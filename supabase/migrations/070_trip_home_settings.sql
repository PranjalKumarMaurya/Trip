-- Trips home and Trip settings: member counts for Trip cards, display currencies
-- readable by every member, an Owner-only settings RPC with an audit row, and a
-- guard that keeps every Expense and payment in the Trip's current currency.
BEGIN;

-- Trip settings changes get their own audit type.
ALTER TABLE public.group_audit_events DROP CONSTRAINT group_audit_events_event_type_check;
ALTER TABLE public.group_audit_events ADD CONSTRAINT group_audit_events_event_type_check
  CHECK (event_type IN ('group_bootstrapped', 'membership_lifecycle', 'trip_settings_updated'));

-- Every active member reads the Trip's display currencies (Trip details, FX tab).
GRANT SELECT ON TABLE public.group_configuration_display_currencies TO authenticated;
CREATE POLICY group_configuration_display_currencies_select_member
  ON public.group_configuration_display_currencies
  FOR SELECT TO authenticated
  USING (group_id IN (SELECT ir007_private.current_active_group_ids()));

-- Active member count per Trip the caller is active in (Trips home cards).
-- Owned by `postgres` like get_trip_member_profiles(): group_members is not
-- readable by clients.
CREATE FUNCTION public.get_my_trip_member_counts()
RETURNS TABLE (group_id uuid, member_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT member.group_id, count(*)::integer
  FROM public.group_members AS member
  WHERE member.status = 'active'
    AND member.group_id IN (SELECT ir007_private.current_active_group_ids())
  GROUP BY member.group_id
  ORDER BY member.group_id;
$$;
REVOKE ALL ON FUNCTION public.get_my_trip_member_counts() FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_trip_member_counts() TO authenticated;

-- An Expense or payment is always recorded in the Trip's current currency. The
-- insert policies already compare against the configuration, but only as of the
-- statement's snapshot. This check runs after the row is written and takes a
-- share lock on the configuration row, so it is ordered against
-- update_trip_settings() (which locks that row before it looks for Expenses):
-- whichever commits second sees the other, and a currency change can never
-- slip past a new Expense. Running after the policies keeps their refusals as is.
CREATE FUNCTION trip_private.trip_currency_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_trip_currency text;
  v_recorded_currency text;
BEGIN
  SELECT config.accounting_currency INTO v_trip_currency
  FROM public.group_configurations AS config
  WHERE config.group_id = NEW.group_id
  FOR SHARE;
  IF TG_TABLE_NAME = 'trip_expenses' THEN
    v_recorded_currency := NEW.accounting_currency;
  ELSE
    v_recorded_currency := NEW.currency;
  END IF;
  IF v_trip_currency IS DISTINCT FROM v_recorded_currency THEN
    RAISE EXCEPTION 'split_currency_changed' USING ERRCODE = 'P0001';
  END IF;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION trip_private.trip_currency_guard() FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER trip_expenses_currency_guard
  AFTER INSERT ON public.trip_expenses
  FOR EACH ROW EXECUTE FUNCTION trip_private.trip_currency_guard();
CREATE TRIGGER trip_settlements_currency_guard
  AFTER INSERT ON public.trip_settlements
  FOR EACH ROW EXECUTE FUNCTION trip_private.trip_currency_guard();

-- Owner-only settings change. SECURITY DEFINER is required because clients may
-- not write group_configurations, the display currencies, or the audit log; the
-- function is owned by a dedicated role holding only the grants below.
CREATE ROLE trip_settings_executor
  NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION BYPASSRLS;

-- Hosted Supabase applies migrations as the non-superuser `postgres`, which can
-- assign ownership only to a role it can SET ROLE to and that may CREATE in the
-- schema. Both grants are revoked before COMMIT. Name `postgres` explicitly:
-- `TO CURRENT_USER` crashes the server under Supabase's supautils extension.
GRANT trip_settings_executor TO postgres;
GRANT CREATE ON SCHEMA public TO trip_settings_executor;

GRANT USAGE ON SCHEMA public, trip_private, ir007_private TO trip_settings_executor;
GRANT EXECUTE ON FUNCTION trip_private.current_member_id(uuid) TO trip_settings_executor;
GRANT EXECUTE ON FUNCTION ir007_private.current_active_owner_group_ids() TO trip_settings_executor;
-- UPDATE (updated_at) only so the function may take the Trip row lock.
GRANT SELECT (id, archived_at), UPDATE (updated_at) ON TABLE public.groups TO trip_settings_executor;
GRANT SELECT (group_id, trip_name, destination, start_date, end_date, timezone, accounting_currency, is_international),
  UPDATE (trip_name, destination, start_date, end_date, timezone, accounting_currency, is_international)
  ON TABLE public.group_configurations TO trip_settings_executor;
GRANT SELECT (code) ON TABLE public.iso_4217_currency_codes TO trip_settings_executor;
GRANT SELECT, INSERT, DELETE ON TABLE public.group_configuration_display_currencies TO trip_settings_executor;
GRANT SELECT (group_id) ON TABLE public.trip_expenses, public.trip_settlements TO trip_settings_executor;
GRANT SELECT (group_id, event_type, request_id, details),
  INSERT (group_id, actor_group_member_id, event_type, request_id, details, occurred_at)
  ON TABLE public.group_audit_events TO trip_settings_executor;

-- `p_settings` must hold exactly: trip_name, destination, start_date, end_date,
-- timezone, is_international, accounting_currency, display_currency_codes.
-- Values are validated exactly like bootstrap_group(). The Trip currency may
-- change only while the Trip has no Expenses or payments. A retry with the same
-- request id returns `already_completed`; different settings under that id
-- are an `idempotency_conflict`.
CREATE FUNCTION public.update_trip_settings(p_group_id uuid, p_settings jsonb, p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_archived_at timestamptz;
  v_actor uuid;
  v_trip_name text;
  v_destination text;
  v_start_text text;
  v_end_text text;
  v_start date;
  v_end date;
  v_timezone text;
  v_currency text;
  v_international boolean;
  v_display text[];
  v_code text;
  v_settings jsonb;
  v_previous jsonb;
  v_old record;
  v_old_display text[];
  v_changed text[] := ARRAY[]::text[];
BEGIN
  IF p_group_id IS NULL OR p_request_id IS NULL
    OR jsonb_typeof(p_settings) IS DISTINCT FROM 'object'
    OR (SELECT count(*) FROM jsonb_object_keys(p_settings)) <> 8
    OR NOT (p_settings ?& ARRAY['trip_name', 'destination', 'start_date', 'end_date', 'timezone',
      'is_international', 'accounting_currency', 'display_currency_codes'])
    OR jsonb_typeof(p_settings -> 'trip_name') IS DISTINCT FROM 'string'
    OR jsonb_typeof(p_settings -> 'destination') IS DISTINCT FROM 'string'
    OR jsonb_typeof(p_settings -> 'start_date') IS DISTINCT FROM 'string'
    OR jsonb_typeof(p_settings -> 'end_date') IS DISTINCT FROM 'string'
    OR jsonb_typeof(p_settings -> 'timezone') IS DISTINCT FROM 'string'
    OR jsonb_typeof(p_settings -> 'is_international') IS DISTINCT FROM 'boolean'
    OR jsonb_typeof(p_settings -> 'accounting_currency') IS DISTINCT FROM 'string'
    OR jsonb_typeof(p_settings -> 'display_currency_codes') IS DISTINCT FROM 'array'
  THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_request';
  END IF;

  -- Take the Trip lock first, like every membership lifecycle operation.
  SELECT trip_group.archived_at INTO v_archived_at
  FROM public.groups AS trip_group
  WHERE trip_group.id = p_group_id
  FOR UPDATE;
  IF NOT FOUND OR v_archived_at IS NOT NULL OR NOT EXISTS (
    SELECT 1 FROM ir007_private.current_active_owner_group_ids() AS owner_group_id
    WHERE owner_group_id = p_group_id
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'not_authorized';
  END IF;
  v_actor := trip_private.current_member_id(p_group_id);
  IF v_actor IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'not_authorized';
  END IF;

  v_trip_name := btrim(p_settings ->> 'trip_name');
  v_destination := btrim(p_settings ->> 'destination');
  v_start_text := p_settings ->> 'start_date';
  v_end_text := p_settings ->> 'end_date';
  v_timezone := p_settings ->> 'timezone';
  v_international := (p_settings ->> 'is_international')::boolean;
  v_currency := p_settings ->> 'accounting_currency';

  IF v_trip_name = '' OR v_destination = ''
    OR v_start_text !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    OR v_end_text !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    OR v_currency !~ '^[A-Z]{3}$'
    OR jsonb_array_length(p_settings -> 'display_currency_codes') = 0
    OR EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_settings -> 'display_currency_codes') AS display_value(value)
      WHERE jsonb_typeof(display_value.value) IS DISTINCT FROM 'string'
    )
  THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_request';
  END IF;

  BEGIN
    v_start := v_start_text::date;
    v_end := v_end_text::date;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_request';
  END;
  IF v_end < v_start OR NOT public.is_valid_iana_timezone(v_timezone) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_request';
  END IF;
  PERFORM 1 FROM public.iso_4217_currency_codes AS currency WHERE currency.code = v_currency;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_request';
  END IF;

  SELECT array_agg(display_value.value #>> '{}' ORDER BY (display_value.value #>> '{}') COLLATE "C")
  INTO v_display
  FROM jsonb_array_elements(p_settings -> 'display_currency_codes') AS display_value(value);
  IF cardinality(v_display) <> (SELECT count(DISTINCT code) FROM unnest(v_display) AS code)
    OR NOT (v_currency = ANY(v_display))
  THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_request';
  END IF;
  FOREACH v_code IN ARRAY v_display LOOP
    IF v_code !~ '^[A-Z]{3}$' THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_request';
    END IF;
    PERFORM 1 FROM public.iso_4217_currency_codes AS currency WHERE currency.code = v_code;
    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_request';
    END IF;
  END LOOP;

  v_settings := jsonb_build_object(
    'trip_name', v_trip_name, 'destination', v_destination,
    'start_date', v_start_text, 'end_date', v_end_text, 'timezone', v_timezone,
    'is_international', v_international, 'accounting_currency', v_currency,
    'display_currency_codes', to_jsonb(v_display));

  SELECT audit.details -> 'settings' INTO v_previous
  FROM public.group_audit_events AS audit
  WHERE audit.group_id = p_group_id
    AND audit.request_id = p_request_id
    AND audit.event_type = 'trip_settings_updated'
  LIMIT 1;
  IF FOUND THEN
    IF v_previous IS DISTINCT FROM v_settings THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'idempotency_conflict';
    END IF;
    RETURN jsonb_build_object('outcome', 'already_completed', 'group_id', p_group_id, 'request_id', p_request_id);
  END IF;

  -- Lock the configuration row before looking for Expenses (see trip_currency_guard).
  SELECT config.trip_name, config.destination, config.start_date, config.end_date, config.timezone,
    config.is_international, config.accounting_currency
  INTO v_old
  FROM public.group_configurations AS config
  WHERE config.group_id = p_group_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'not_authorized';
  END IF;
  SELECT coalesce(array_agg(display.currency_code ORDER BY display.currency_code COLLATE "C"), ARRAY[]::text[])
  INTO v_old_display
  FROM public.group_configuration_display_currencies AS display
  WHERE display.group_id = p_group_id;

  IF v_old.trip_name <> v_trip_name THEN v_changed := array_append(v_changed, 'trip_name'); END IF;
  IF v_old.destination <> v_destination THEN v_changed := array_append(v_changed, 'destination'); END IF;
  IF v_old.start_date <> v_start THEN v_changed := array_append(v_changed, 'start_date'); END IF;
  IF v_old.end_date <> v_end THEN v_changed := array_append(v_changed, 'end_date'); END IF;
  IF v_old.timezone <> v_timezone THEN v_changed := array_append(v_changed, 'timezone'); END IF;
  IF v_old.is_international <> v_international THEN v_changed := array_append(v_changed, 'is_international'); END IF;
  IF v_old.accounting_currency <> v_currency THEN v_changed := array_append(v_changed, 'accounting_currency'); END IF;
  IF v_old_display <> v_display THEN v_changed := array_append(v_changed, 'display_currency_codes'); END IF;

  IF cardinality(v_changed) = 0 THEN
    RETURN jsonb_build_object('outcome', 'unchanged', 'group_id', p_group_id, 'request_id', p_request_id);
  END IF;

  IF v_old.accounting_currency <> v_currency AND (
    EXISTS (SELECT 1 FROM public.trip_expenses AS expense WHERE expense.group_id = p_group_id)
    OR EXISTS (SELECT 1 FROM public.trip_settlements AS settlement WHERE settlement.group_id = p_group_id)
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'currency_locked';
  END IF;

  UPDATE public.group_configurations AS config
  SET trip_name = v_trip_name, destination = v_destination, start_date = v_start, end_date = v_end,
    timezone = v_timezone, is_international = v_international, accounting_currency = v_currency
  WHERE config.group_id = p_group_id;

  DELETE FROM public.group_configuration_display_currencies AS display
  WHERE display.group_id = p_group_id AND NOT (display.currency_code = ANY(v_display));
  INSERT INTO public.group_configuration_display_currencies (group_id, currency_code)
  SELECT p_group_id, code FROM unnest(v_display) AS code
  WHERE NOT (code = ANY(v_old_display));

  INSERT INTO public.group_audit_events (group_id, actor_group_member_id, event_type, request_id, details, occurred_at)
  VALUES (p_group_id, v_actor, 'trip_settings_updated', p_request_id,
    jsonb_build_object('operation', 'trip_settings', 'changed', to_jsonb(v_changed), 'settings', v_settings),
    clock_timestamp());

  RETURN jsonb_build_object('outcome', 'updated', 'group_id', p_group_id, 'request_id', p_request_id,
    'changed', to_jsonb(v_changed));
EXCEPTION
  WHEN SQLSTATE 'P0001' THEN RAISE;
  WHEN OTHERS THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'operation_failed';
END;
$$;
ALTER FUNCTION public.update_trip_settings(uuid, jsonb, uuid) OWNER TO trip_settings_executor;
REVOKE ALL ON FUNCTION public.update_trip_settings(uuid, jsonb, uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.update_trip_settings(uuid, jsonb, uuid) TO authenticated;

REVOKE CREATE ON SCHEMA public FROM trip_settings_executor;
REVOKE trip_settings_executor FROM postgres;

COMMIT;
