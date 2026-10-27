-- IR-005 isolated TOP-005 candidate. Not integrated or an IR-005 exit.
BEGIN;

-- Hosted Supabase applies migrations as the non-superuser `postgres`, which can
-- assign ownership only to a role it can SET ROLE to and that may CREATE in the
-- schema. Both grants are revoked before COMMIT. Name `postgres` explicitly:
-- `TO CURRENT_USER` crashes the server under Supabase's supautils extension.
GRANT ir005_invitation_executor TO postgres;
GRANT CREATE ON SCHEMA public TO ir005_invitation_executor;

CREATE FUNCTION public.ir005_transfer_ownership_impl(
  p_group_id uuid,
  p_successor_membership_id uuid,
  p_prior_owner_outcome text,
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
  v_successor_role text;
  v_successor_status text;
  v_archived_at timestamptz;
  v_fingerprint jsonb;
  v_existing_fingerprint jsonb;
  v_existing_status text;
  v_result jsonb;
BEGIN
  IF trip_private.auth_uid() IS NULL OR p_group_id IS NULL
    OR p_successor_membership_id IS NULL OR p_request_id IS NULL
    OR p_prior_owner_outcome IS NULL
    OR p_prior_owner_outcome NOT IN ('member', 'inactive') THEN
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
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'not_authorized';
  END IF;

  v_fingerprint := jsonb_build_object(
    'group_id', p_group_id,
    'successor_membership_id', p_successor_membership_id,
    'prior_owner_outcome', p_prior_owner_outcome
  );
  SELECT request.request_fingerprint, request.status
  INTO v_existing_fingerprint, v_existing_status
  FROM public.ir005_lifecycle_requests AS request
  WHERE request.operation = 'TOP-005'
    AND request.actor_profile_id = v_actor_profile_id
    AND request.group_id = p_group_id
    AND request.request_id = p_request_id
  FOR UPDATE;
  IF FOUND THEN
    IF v_existing_fingerprint IS DISTINCT FROM v_fingerprint THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'idempotency_conflict';
    END IF;
    IF v_existing_status = 'completed' THEN
      RETURN jsonb_build_object('outcome', 'already_completed', 'request_id', p_request_id);
    END IF;
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'operation_failed';
  END IF;

  IF v_archived_at IS NOT NULL THEN
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
  INTO v_successor_role, v_successor_status
  FROM public.group_members AS member
  WHERE member.group_id = p_group_id
    AND member.id = p_successor_membership_id
  FOR UPDATE;
  IF NOT FOUND OR v_successor_status <> 'active'
    OR p_successor_membership_id = v_actor_member_id THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_target';
  END IF;

  INSERT INTO public.ir005_lifecycle_requests (
    operation, actor_profile_id, group_id, request_id,
    request_fingerprint, status
  ) VALUES (
    'TOP-005', v_actor_profile_id, p_group_id, p_request_id,
    v_fingerprint, 'pending'
  );

  IF v_successor_role <> 'owner' THEN
    UPDATE public.group_members AS member
    SET role = 'owner'
    WHERE member.group_id = p_group_id
      AND member.id = p_successor_membership_id;
  END IF;

  UPDATE public.group_members AS member
  SET role = 'member',
    status = CASE WHEN p_prior_owner_outcome = 'inactive'
      THEN 'inactive' ELSE 'active' END
  WHERE member.group_id = p_group_id
    AND member.id = v_actor_member_id;

  v_result := jsonb_build_object(
    'outcome', 'transferred',
    'group_id', p_group_id,
    'successor_membership_id', p_successor_membership_id,
    'prior_owner_outcome', p_prior_owner_outcome,
    'request_id', p_request_id
  );
  INSERT INTO public.group_audit_events (
    group_id, actor_group_member_id, event_type, request_id,
    details, occurred_at
  ) VALUES (
    p_group_id, v_actor_member_id, 'membership_lifecycle', p_request_id,
    jsonb_build_object(
      'operation', 'TOP-005',
      'successor_membership_id', p_successor_membership_id,
      'prior_owner_outcome', p_prior_owner_outcome
    ),
    clock_timestamp()
  );
  UPDATE public.ir005_lifecycle_requests AS request
  SET status = 'completed', result = v_result, completed_at = clock_timestamp()
  WHERE request.operation = 'TOP-005'
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

ALTER FUNCTION public.ir005_transfer_ownership_impl(uuid, uuid, text, uuid)
  OWNER TO ir005_invitation_executor;
REVOKE ALL ON FUNCTION public.ir005_transfer_ownership_impl(uuid, uuid, text, uuid)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.transfer_ownership(
  group_id uuid,
  successor_membership_id uuid,
  prior_owner_outcome text,
  request_id uuid
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
  SELECT public.ir005_transfer_ownership_impl($1, $2, $3, $4);
$$;
REVOKE ALL ON FUNCTION public.transfer_ownership(uuid, uuid, text, uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.transfer_ownership(uuid, uuid, text, uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.ir005_transfer_ownership_impl(uuid, uuid, text, uuid)
  TO authenticated;

REVOKE CREATE ON SCHEMA public FROM ir005_invitation_executor;
REVOKE ir005_invitation_executor FROM postgres;

COMMIT;
