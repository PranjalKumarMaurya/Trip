-- Create Trip: bootstrap_group() accepts an optional boolean `is_international`
-- in configuration_request (default false) and stores it. Every other rule of
-- migration 010 is unchanged: exact keys, strict types, the same validation and
-- idempotency. The implementation keeps its owner (ir003_top001_executor) and
-- grants; it only gains the INSERT grant on the new column.
BEGIN;

-- Hosted Supabase applies migrations as the non-superuser `postgres`, which can
-- assign ownership only to a role it can SET ROLE to and that may CREATE in the
-- schema. Both grants are revoked before COMMIT. Name `postgres` explicitly:
-- `TO CURRENT_USER` crashes the server under Supabase's supautils extension.
GRANT ir003_top001_executor TO postgres;
GRANT CREATE ON SCHEMA public TO ir003_top001_executor;

GRANT INSERT (is_international) ON TABLE public.group_configurations TO ir003_top001_executor;

CREATE OR REPLACE FUNCTION public.ir003_bootstrap_group_impl(
  p_group_request jsonb,
  p_configuration_request jsonb,
  p_request_id uuid
)
RETURNS TABLE (
  outcome text,
  group_id uuid,
  request_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_auth_user_id uuid;
  v_actor_profile_id uuid;
  v_trip_name text;
  v_destination text;
  v_start_date_text text;
  v_end_date_text text;
  v_start_date date;
  v_end_date date;
  v_timezone text;
  v_accounting_currency text;
  v_is_international boolean;
  v_display_currency_codes text[];
  v_display_currency_code text;
  v_request_fingerprint jsonb;
  v_group_id uuid;
  v_owner_group_member_id uuid;
  v_existing_fingerprint jsonb;
  v_existing_status text;
  v_existing_group_id uuid;
  v_existing_result jsonb;
BEGIN
  v_auth_user_id := trip_private.auth_uid();

  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'not_authenticated';
  END IF;

  PERFORM 1
  FROM trip_private.auth_users AS auth_user
  WHERE auth_user.id = v_auth_user_id
    AND auth_user.email_confirmed_at IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'auth_not_verified';
  END IF;

  SELECT profile.id
  INTO v_actor_profile_id
  FROM public.profiles AS profile
  WHERE profile.auth_user_id = v_auth_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'profile_unavailable';
  END IF;

  IF $3 IS NULL
    OR jsonb_typeof(p_group_request) IS DISTINCT FROM 'object'
    OR jsonb_typeof(p_configuration_request) IS DISTINCT FROM 'object'
    OR (SELECT count(*) FROM jsonb_object_keys(p_group_request)) <> 1
    OR NOT (p_group_request ? 'trip_name')
    OR (SELECT count(*) FROM jsonb_object_keys(p_configuration_request))
      <> (CASE WHEN p_configuration_request ? 'is_international' THEN 7 ELSE 6 END)
    OR NOT (
      p_configuration_request ? 'destination'
      AND p_configuration_request ? 'start_date'
      AND p_configuration_request ? 'end_date'
      AND p_configuration_request ? 'timezone'
      AND p_configuration_request ? 'accounting_currency'
      AND p_configuration_request ? 'display_currency_codes'
    )
    OR jsonb_typeof(p_group_request -> 'trip_name') IS DISTINCT FROM 'string'
    OR jsonb_typeof(p_configuration_request -> 'destination') IS DISTINCT FROM 'string'
    OR jsonb_typeof(p_configuration_request -> 'start_date') IS DISTINCT FROM 'string'
    OR jsonb_typeof(p_configuration_request -> 'end_date') IS DISTINCT FROM 'string'
    OR jsonb_typeof(p_configuration_request -> 'timezone') IS DISTINCT FROM 'string'
    OR jsonb_typeof(p_configuration_request -> 'accounting_currency') IS DISTINCT FROM 'string'
    OR jsonb_typeof(p_configuration_request -> 'display_currency_codes') IS DISTINCT FROM 'array'
    OR (p_configuration_request ? 'is_international'
      AND jsonb_typeof(p_configuration_request -> 'is_international') IS DISTINCT FROM 'boolean')
  THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_request';
  END IF;

  v_trip_name := btrim(p_group_request ->> 'trip_name');
  v_destination := btrim(p_configuration_request ->> 'destination');
  v_start_date_text := p_configuration_request ->> 'start_date';
  v_end_date_text := p_configuration_request ->> 'end_date';
  v_timezone := p_configuration_request ->> 'timezone';
  v_accounting_currency := p_configuration_request ->> 'accounting_currency';
  v_is_international := coalesce((p_configuration_request ->> 'is_international')::boolean, false);

  IF v_trip_name = ''
    OR v_destination = ''
    OR v_start_date_text !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    OR v_end_date_text !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    OR v_accounting_currency !~ '^[A-Z]{3}$'
    OR jsonb_array_length(p_configuration_request -> 'display_currency_codes') = 0
    OR EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_configuration_request -> 'display_currency_codes') AS display_value(value)
      WHERE jsonb_typeof(display_value.value) IS DISTINCT FROM 'string'
    )
  THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_request';
  END IF;

  BEGIN
    v_start_date := v_start_date_text::date;
    v_end_date := v_end_date_text::date;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_request';
  END;

  IF v_end_date < v_start_date THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_request';
  END IF;

  IF NOT public.is_valid_iana_timezone(v_timezone) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_request';
  END IF;

  PERFORM 1
  FROM public.iso_4217_currency_codes AS currency
  WHERE currency.code = v_accounting_currency;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_request';
  END IF;

  SELECT array_agg(
    display_value.value #>> '{}'
    ORDER BY (display_value.value #>> '{}') COLLATE "C"
  )
  INTO v_display_currency_codes
  FROM jsonb_array_elements(p_configuration_request -> 'display_currency_codes') AS display_value(value);

  IF cardinality(v_display_currency_codes) <> (
      SELECT count(DISTINCT display_currency_code)
      FROM unnest(v_display_currency_codes) AS display_currency_code
    )
    OR NOT (v_accounting_currency = ANY(v_display_currency_codes))
  THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_request';
  END IF;

  FOREACH v_display_currency_code IN ARRAY v_display_currency_codes LOOP
    IF v_display_currency_code !~ '^[A-Z]{3}$' THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_request';
    END IF;

    PERFORM 1
    FROM public.iso_4217_currency_codes AS currency
    WHERE currency.code = v_display_currency_code;

    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_request';
    END IF;
  END LOOP;

  v_request_fingerprint := jsonb_build_object(
    'operation', 'TOP-001',
    'group_request', jsonb_build_object(
      'trip_name', v_trip_name
    ),
    'configuration_request', jsonb_build_object(
      'destination', v_destination,
      'start_date', v_start_date_text,
      'end_date', v_end_date_text,
      'timezone', v_timezone,
      'accounting_currency', v_accounting_currency,
      'display_currency_codes', to_jsonb(v_display_currency_codes)
    )
    -- Only an International Trip adds the flag, so a request made before this
    -- migration (no flag, domestic) keeps exactly the fingerprint it had.
    || CASE WHEN v_is_international
      THEN jsonb_build_object('is_international', true) ELSE '{}'::jsonb END
  );

  INSERT INTO public.ir003_bootstrap_requests (
    operation,
    actor_profile_id,
    request_id,
    request_fingerprint,
    status
  ) VALUES (
    'TOP-001',
    v_actor_profile_id,
    $3,
    v_request_fingerprint,
    'pending'
  )
  ON CONFLICT ON CONSTRAINT ir003_bootstrap_requests_pkey DO NOTHING;

  IF NOT FOUND THEN
    SELECT
      bootstrap_request.request_fingerprint,
      bootstrap_request.status,
      bootstrap_request.group_id,
      bootstrap_request.result
    INTO
      v_existing_fingerprint,
      v_existing_status,
      v_existing_group_id,
      v_existing_result
    FROM public.ir003_bootstrap_requests AS bootstrap_request
    WHERE bootstrap_request.operation = 'TOP-001'
      AND bootstrap_request.actor_profile_id = v_actor_profile_id
      AND bootstrap_request.request_id = $3
    FOR UPDATE;

    IF v_existing_fingerprint IS DISTINCT FROM v_request_fingerprint THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'idempotency_conflict';
    END IF;

    IF v_existing_status = 'completed' THEN
      RETURN QUERY
      SELECT
        v_existing_result ->> 'outcome',
        (v_existing_result ->> 'group_id')::uuid,
        (v_existing_result ->> 'request_id')::uuid;
      RETURN;
    END IF;

    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'operation_failed';
  END IF;

  INSERT INTO public.groups DEFAULT VALUES
  RETURNING id INTO v_group_id;

  INSERT INTO public.group_configurations (
    group_id,
    trip_name,
    destination,
    start_date,
    end_date,
    timezone,
    accounting_currency,
    is_international
  ) VALUES (
    v_group_id,
    v_trip_name,
    v_destination,
    v_start_date,
    v_end_date,
    v_timezone,
    v_accounting_currency,
    v_is_international
  );

  INSERT INTO public.group_configuration_display_currencies (group_id, currency_code)
  SELECT v_group_id, display_currency_code
  FROM unnest(v_display_currency_codes) AS display_currency_code;

  INSERT INTO public.group_members (group_id, profile_id, role, status)
  VALUES (v_group_id, v_actor_profile_id, 'owner', 'active')
  RETURNING id INTO v_owner_group_member_id;

  INSERT INTO public.group_audit_events (
    group_id,
    actor_group_member_id,
    event_type,
    request_id,
    details,
    occurred_at
  ) VALUES (
    v_group_id,
    v_owner_group_member_id,
    'group_bootstrapped',
    $3,
    jsonb_build_object('operation', 'TOP-001'),
    now()
  );

  UPDATE public.ir003_bootstrap_requests AS bootstrap_request
  SET
    status = 'completed',
    group_id = v_group_id,
    result = jsonb_build_object(
      'outcome', 'completed',
      'group_id', v_group_id,
      'request_id', $3
    ),
    completed_at = now()
  WHERE bootstrap_request.operation = 'TOP-001'
    AND bootstrap_request.actor_profile_id = v_actor_profile_id
    AND bootstrap_request.request_id = $3;

  RETURN QUERY
  SELECT 'completed'::text, v_group_id, $3;
EXCEPTION
  WHEN SQLSTATE 'P0001' THEN
    RAISE;
  WHEN OTHERS THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'operation_failed';
END;
$$;

REVOKE CREATE ON SCHEMA public FROM ir003_top001_executor;
REVOKE ir003_top001_executor FROM postgres;

COMMIT;
