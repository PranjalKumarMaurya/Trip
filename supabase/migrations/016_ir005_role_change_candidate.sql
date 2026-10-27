-- IR-005 isolated TOP-004 candidate. Not integrated or an IR-005 exit.
BEGIN;

-- Hosted Supabase applies migrations as the non-superuser `postgres`, which can
-- assign ownership only to a role it can SET ROLE to and that may CREATE in the
-- schema. Both grants are revoked before COMMIT. Name `postgres` explicitly:
-- `TO CURRENT_USER` crashes the server under Supabase's supautils extension.
GRANT ir005_invitation_executor TO postgres;
GRANT CREATE ON SCHEMA public TO ir005_invitation_executor;

CREATE TABLE public.ir005_lifecycle_requests (
  operation text NOT NULL CHECK (operation IN ('TOP-004', 'TOP-005', 'TOP-006', 'TOP-007')),
  actor_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE RESTRICT,
  request_id uuid NOT NULL,
  request_fingerprint jsonb NOT NULL CHECK (jsonb_typeof(request_fingerprint) = 'object'),
  status text NOT NULL CHECK (status IN ('pending', 'completed')),
  result jsonb CHECK (result IS NULL OR jsonb_typeof(result) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  PRIMARY KEY (operation, actor_profile_id, group_id, request_id),
  CONSTRAINT ir005_lifecycle_requests_completion_check CHECK (
    (status = 'pending' AND result IS NULL AND completed_at IS NULL)
    OR (status = 'completed' AND result IS NOT NULL AND completed_at IS NOT NULL)
  )
);
ALTER TABLE public.ir005_lifecycle_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ir005_lifecycle_requests FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ir005_lifecycle_requests
  FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT (operation, actor_profile_id, group_id, request_id,
    request_fingerprint, status, result),
  INSERT (operation, actor_profile_id, group_id, request_id,
    request_fingerprint, status),
  UPDATE (status, result, completed_at)
  ON TABLE public.ir005_lifecycle_requests TO ir005_invitation_executor;

CREATE FUNCTION public.ir005_change_member_role_impl(
  p_group_id uuid,
  p_target_membership_id uuid,
  p_requested_role text,
  p_request_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_actor_profile_id uuid;
  v_actor_member_id uuid;
  v_target_role text;
  v_target_status text;
  v_archived_at timestamptz;
  v_fingerprint jsonb;
  v_existing_fingerprint jsonb;
  v_existing_status text;
  v_existing_result jsonb;
  v_result jsonb;
BEGIN
  IF trip_private.auth_uid() IS NULL OR p_group_id IS NULL
    OR p_target_membership_id IS NULL OR p_request_id IS NULL
    OR p_requested_role IS NULL
    OR p_requested_role NOT IN ('owner', 'member') THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_request';
  END IF;

  SELECT profile.id INTO v_actor_profile_id
  FROM public.profiles AS profile
  JOIN trip_private.auth_users AS auth_user ON auth_user.id = profile.auth_user_id
  WHERE profile.auth_user_id = trip_private.auth_uid()
    AND auth_user.email_confirmed_at IS NOT NULL;
  IF v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'not_authorized';
  END IF;

  SELECT g.archived_at INTO v_archived_at
  FROM public.groups AS g
  WHERE g.id = p_group_id
  FOR UPDATE;
  IF NOT FOUND OR v_archived_at IS NOT NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'not_authorized';
  END IF;

  SELECT member.id INTO v_actor_member_id
  FROM public.group_members AS member
  WHERE member.group_id = p_group_id
    AND member.profile_id = v_actor_profile_id
    AND member.role = 'owner'
    AND member.status = 'active';
  IF v_actor_member_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'not_authorized';
  END IF;

  SELECT member.role, member.status
  INTO v_target_role, v_target_status
  FROM public.group_members AS member
  WHERE member.group_id = p_group_id
    AND member.id = p_target_membership_id
  FOR UPDATE;
  IF NOT FOUND OR v_target_status <> 'active' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_target';
  END IF;

  v_fingerprint := jsonb_build_object(
    'group_id', p_group_id,
    'target_membership_id', p_target_membership_id,
    'requested_role', p_requested_role
  );
  INSERT INTO public.ir005_lifecycle_requests (
    operation, actor_profile_id, group_id, request_id,
    request_fingerprint, status
  ) VALUES (
    'TOP-004', v_actor_profile_id, p_group_id, p_request_id,
    v_fingerprint, 'pending'
  ) ON CONFLICT ON CONSTRAINT ir005_lifecycle_requests_pkey DO NOTHING;

  IF NOT FOUND THEN
    SELECT request.request_fingerprint, request.status, request.result
    INTO v_existing_fingerprint, v_existing_status, v_existing_result
    FROM public.ir005_lifecycle_requests AS request
    WHERE request.operation = 'TOP-004'
      AND request.actor_profile_id = v_actor_profile_id
      AND request.group_id = p_group_id
      AND request.request_id = p_request_id
    FOR UPDATE;
    IF v_existing_fingerprint IS DISTINCT FROM v_fingerprint THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'idempotency_conflict';
    END IF;
    IF v_existing_status = 'completed' THEN
      RETURN jsonb_set(v_existing_result, '{outcome}', '"already_completed"'::jsonb);
    END IF;
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'operation_failed';
  END IF;

  IF v_target_role = 'owner' AND p_requested_role = 'member'
    AND NOT EXISTS (
      SELECT 1 FROM public.group_members AS member
      WHERE member.group_id = p_group_id
        AND member.id <> p_target_membership_id
        AND member.role = 'owner'
        AND member.status = 'active'
    ) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'last_owner';
  END IF;

  IF v_target_role <> p_requested_role THEN
    UPDATE public.group_members AS member
    SET role = p_requested_role
    WHERE member.group_id = p_group_id
      AND member.id = p_target_membership_id;
  END IF;

  v_result := jsonb_build_object(
    'outcome', CASE WHEN v_target_role = p_requested_role THEN 'unchanged' ELSE 'changed' END,
    'group_id', p_group_id,
    'target_membership_id', p_target_membership_id,
    'role', p_requested_role,
    'request_id', p_request_id
  );
  INSERT INTO public.group_audit_events (
    group_id, actor_group_member_id, event_type, request_id,
    details, occurred_at
  ) VALUES (
    p_group_id, v_actor_member_id, 'membership_lifecycle', p_request_id,
    jsonb_build_object(
      'operation', 'TOP-004',
      'target_membership_id', p_target_membership_id,
      'from_role', v_target_role,
      'to_role', p_requested_role
    ),
    clock_timestamp()
  );
  UPDATE public.ir005_lifecycle_requests AS request
  SET status = 'completed', result = v_result, completed_at = clock_timestamp()
  WHERE request.operation = 'TOP-004'
    AND request.actor_profile_id = v_actor_profile_id
    AND request.group_id = p_group_id
    AND request.request_id = p_request_id;
  RETURN v_result;
EXCEPTION
  WHEN SQLSTATE 'P0001' THEN RAISE;
  WHEN OTHERS THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'operation_failed';
END;
$$;

ALTER FUNCTION public.ir005_change_member_role_impl(uuid, uuid, text, uuid)
  OWNER TO ir005_invitation_executor;
REVOKE ALL ON FUNCTION public.ir005_change_member_role_impl(uuid, uuid, text, uuid)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.change_member_role(
  group_id uuid,
  target_membership_id uuid,
  requested_role text,
  request_id uuid
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
  SELECT public.ir005_change_member_role_impl($1, $2, $3, $4);
$$;
REVOKE ALL ON FUNCTION public.change_member_role(uuid, uuid, text, uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.change_member_role(uuid, uuid, text, uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.ir005_change_member_role_impl(uuid, uuid, text, uuid)
  TO authenticated;

REVOKE CREATE ON SCHEMA public FROM ir005_invitation_executor;
REVOKE ir005_invitation_executor FROM postgres;

COMMIT;
