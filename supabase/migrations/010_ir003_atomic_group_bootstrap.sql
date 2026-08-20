-- IR-003 DBM-014: atomic Group bootstrap and TOP-001 only.
-- Authorised by docs/implementation-execution/authorisations/IR-003-authorisation.md.

BEGIN;

ALTER TABLE public.group_audit_events
  DROP CONSTRAINT group_audit_events_request_id_key;

CREATE INDEX group_audit_events_request_id_idx
  ON public.group_audit_events (request_id);

CREATE TABLE public.group_configuration_display_currencies (
  group_id UUID NOT NULL
    REFERENCES public.group_configurations(group_id) ON DELETE RESTRICT,
  currency_code TEXT NOT NULL
    REFERENCES public.iso_4217_currency_codes(code) ON DELETE RESTRICT,
  PRIMARY KEY (group_id, currency_code)
);

CREATE TABLE public.ir003_bootstrap_requests (
  operation TEXT NOT NULL CHECK (operation = 'TOP-001'),
  actor_profile_id UUID NOT NULL
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  request_id UUID NOT NULL,
  request_fingerprint JSONB NOT NULL
    CHECK (jsonb_typeof(request_fingerprint) = 'object'),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed')),
  group_id UUID
    REFERENCES public.groups(id) ON DELETE RESTRICT,
  result JSONB
    CHECK (result IS NULL OR jsonb_typeof(result) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (operation, actor_profile_id, request_id),
  CONSTRAINT ir003_bootstrap_requests_completion_state_check CHECK (
    (
      status = 'pending'
      AND group_id IS NULL
      AND result IS NULL
      AND completed_at IS NULL
    )
    OR (
      status = 'completed'
      AND group_id IS NOT NULL
      AND result = jsonb_build_object(
        'outcome', 'completed',
        'group_id', group_id,
        'request_id', request_id
      )
      AND completed_at IS NOT NULL
    )
  )
);

CREATE INDEX ir003_bootstrap_requests_group_id_idx
  ON public.ir003_bootstrap_requests (group_id);

ALTER TABLE public.group_configuration_display_currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_configuration_display_currencies FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ir003_bootstrap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ir003_bootstrap_requests FORCE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE
  public.group_configuration_display_currencies,
  public.ir003_bootstrap_requests
FROM PUBLIC, anon, authenticated;

CREATE ROLE ir003_top001_executor
  NOLOGIN
  NOINHERIT
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOREPLICATION
  BYPASSRLS;

GRANT USAGE ON SCHEMA auth, public TO ir003_top001_executor;

GRANT EXECUTE ON FUNCTION auth.uid() TO ir003_top001_executor;
GRANT EXECUTE ON FUNCTION public.is_valid_iana_timezone(TEXT)
  TO ir003_top001_executor;
GRANT EXECUTE ON FUNCTION pg_catalog.gen_random_uuid()
  TO ir003_top001_executor;

GRANT SELECT ON TABLE pg_catalog.pg_timezone_names TO ir003_top001_executor;
GRANT SELECT (id, email_confirmed_at)
  ON TABLE auth.users TO ir003_top001_executor;
GRANT SELECT (id, auth_user_id)
  ON TABLE public.profiles TO ir003_top001_executor;
GRANT SELECT (id), INSERT
  ON TABLE public.groups TO ir003_top001_executor;
GRANT INSERT (
  group_id,
  trip_name,
  destination,
  start_date,
  end_date,
  timezone,
  accounting_currency
) ON TABLE public.group_configurations TO ir003_top001_executor;
GRANT SELECT (id), INSERT (group_id, profile_id, role, status)
  ON TABLE public.group_members TO ir003_top001_executor;
GRANT INSERT (
  group_id,
  actor_group_member_id,
  event_type,
  request_id,
  details,
  occurred_at
) ON TABLE public.group_audit_events TO ir003_top001_executor;
GRANT SELECT (code)
  ON TABLE public.iso_4217_currency_codes TO ir003_top001_executor;
GRANT INSERT (group_id, currency_code)
  ON TABLE public.group_configuration_display_currencies TO ir003_top001_executor;
GRANT SELECT (
  operation,
  actor_profile_id,
  request_id,
  request_fingerprint,
  status,
  group_id,
  result,
  completed_at
), INSERT (
  operation,
  actor_profile_id,
  request_id,
  request_fingerprint,
  status
), UPDATE (
  status,
  group_id,
  result,
  completed_at
) ON TABLE public.ir003_bootstrap_requests TO ir003_top001_executor;

-- PostgreSQL cannot compile a PL/pgSQL routine with the same input and
-- RETURNS TABLE output parameter name. This non-granted implementation
-- routine preserves the exact public TOP-001 RPC argument/result names.
CREATE FUNCTION public.ir003_bootstrap_group_impl(
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
  v_auth_user_id := auth.uid();

  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'not_authenticated';
  END IF;

  PERFORM 1
  FROM auth.users AS auth_user
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
    OR (SELECT count(*) FROM jsonb_object_keys(p_configuration_request)) <> 6
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
  THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_request';
  END IF;

  v_trip_name := btrim(p_group_request ->> 'trip_name');
  v_destination := btrim(p_configuration_request ->> 'destination');
  v_start_date_text := p_configuration_request ->> 'start_date';
  v_end_date_text := p_configuration_request ->> 'end_date';
  v_timezone := p_configuration_request ->> 'timezone';
  v_accounting_currency := p_configuration_request ->> 'accounting_currency';

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
    accounting_currency
  ) VALUES (
    v_group_id,
    v_trip_name,
    v_destination,
    v_start_date,
    v_end_date,
    v_timezone,
    v_accounting_currency
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

ALTER FUNCTION public.ir003_bootstrap_group_impl(jsonb, jsonb, uuid)
  OWNER TO ir003_top001_executor;

REVOKE ALL ON FUNCTION public.ir003_bootstrap_group_impl(jsonb, jsonb, uuid)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.bootstrap_group(
  group_request jsonb,
  configuration_request jsonb,
  request_id uuid
)
RETURNS TABLE (
  outcome text,
  group_id uuid,
  request_id uuid
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT *
  FROM public.ir003_bootstrap_group_impl($1, $2, $3);
$$;

ALTER FUNCTION public.bootstrap_group(jsonb, jsonb, uuid)
  OWNER TO ir003_top001_executor;

REVOKE ALL ON FUNCTION public.bootstrap_group(jsonb, jsonb, uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.bootstrap_group(jsonb, jsonb, uuid)
  TO authenticated;

COMMIT;
