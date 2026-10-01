-- IR-005 isolated TOP-006 candidate. Not integrated or an IR-005 exit.
BEGIN;

CREATE FUNCTION public.ir005_deactivate_membership_impl(
  p_group_id uuid,
  p_target_membership_id uuid,
  p_action text,
  p_confirmation jsonb,
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
  v_actor_role text;
  v_target_role text;
  v_target_status text;
  v_archived_at timestamptz;
  v_fingerprint jsonb;
  v_existing_fingerprint jsonb;
  v_existing_status text;
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL OR p_group_id IS NULL
    OR p_target_membership_id IS NULL OR p_request_id IS NULL
    OR p_action IS NULL OR p_action NOT IN ('leave', 'remove')
    OR p_confirmation IS DISTINCT FROM '{"confirmed":true}'::jsonb THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_request';
  END IF;

  SELECT profile.id INTO v_actor_profile_id
  FROM public.profiles AS profile
  JOIN auth.users AS auth_user ON auth_user.id = profile.auth_user_id
  WHERE profile.auth_user_id = auth.uid()
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
    'target_membership_id', p_target_membership_id,
    'action', p_action,
    'confirmed', true
  );
  SELECT request.request_fingerprint, request.status
  INTO v_existing_fingerprint, v_existing_status
  FROM public.ir005_lifecycle_requests AS request
  WHERE request.operation = 'TOP-006'
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
  SELECT member.id, member.role
  INTO v_actor_member_id, v_actor_role
  FROM public.group_members AS member
  WHERE member.group_id = p_group_id
    AND member.profile_id = v_actor_profile_id
    AND member.status = 'active';
  IF v_actor_member_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'not_authorized';
  END IF;

  IF (p_action = 'leave' AND p_target_membership_id <> v_actor_member_id)
    OR (p_action = 'remove' AND
      (v_actor_role <> 'owner' OR p_target_membership_id = v_actor_member_id)) THEN
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

  INSERT INTO public.ir005_lifecycle_requests (
    operation, actor_profile_id, group_id, request_id,
    request_fingerprint, status
  ) VALUES (
    'TOP-006', v_actor_profile_id, p_group_id, p_request_id,
    v_fingerprint, 'pending'
  );

  IF v_target_role = 'owner' AND NOT EXISTS (
    SELECT 1 FROM public.group_members AS member
    WHERE member.group_id = p_group_id
      AND member.id <> p_target_membership_id
      AND member.role = 'owner'
      AND member.status = 'active'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'last_owner';
  END IF;

  UPDATE public.group_members AS member
  SET status = 'inactive', role = 'member'
  WHERE member.group_id = p_group_id
    AND member.id = p_target_membership_id;

  v_result := jsonb_build_object(
    'outcome', 'deactivated',
    'group_id', p_group_id,
    'target_membership_id', p_target_membership_id,
    'action', p_action,
    'request_id', p_request_id
  );
  INSERT INTO public.group_audit_events (
    group_id, actor_group_member_id, event_type, request_id,
    details, occurred_at
  ) VALUES (
    p_group_id, v_actor_member_id, 'membership_lifecycle', p_request_id,
    jsonb_build_object(
      'operation', 'TOP-006',
      'target_membership_id', p_target_membership_id,
      'action', p_action,
      'prior_role', v_target_role
    ),
    clock_timestamp()
  );
  UPDATE public.ir005_lifecycle_requests AS request
  SET status = 'completed', result = v_result, completed_at = clock_timestamp()
  WHERE request.operation = 'TOP-006'
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

ALTER FUNCTION public.ir005_deactivate_membership_impl(uuid, uuid, text, jsonb, uuid)
  OWNER TO ir005_invitation_executor;
REVOKE ALL ON FUNCTION public.ir005_deactivate_membership_impl(uuid, uuid, text, jsonb, uuid)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.deactivate_membership(
  group_id uuid,
  target_membership_id uuid,
  action text,
  confirmation jsonb,
  request_id uuid
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
  SELECT public.ir005_deactivate_membership_impl($1, $2, $3, $4, $5);
$$;
REVOKE ALL ON FUNCTION public.deactivate_membership(uuid, uuid, text, jsonb, uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.deactivate_membership(uuid, uuid, text, jsonb, uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.ir005_deactivate_membership_impl(uuid, uuid, text, jsonb, uuid)
  TO authenticated;

COMMIT;
