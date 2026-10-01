-- IR-005 isolated Invitation revocation candidate. Not integrated or an exit.
BEGIN;

ALTER TABLE public.ir005_invitation_requests
  DROP CONSTRAINT ir005_invitation_requests_operation_check;
ALTER TABLE public.ir005_invitation_requests
  ADD CONSTRAINT ir005_invitation_requests_operation_check
  CHECK (operation IN ('TOP-002', 'TOP-003', 'IR005-REVOKE'));

GRANT UPDATE (revoked_at, expired_at)
  ON TABLE public.invitations TO ir005_invitation_executor;

CREATE FUNCTION public.ir005_revoke_invitation_impl(
  p_group_id uuid,
  p_invitation_id uuid,
  p_request_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_actor_profile_id uuid;
  v_owner_member_id uuid;
  v_archived_at timestamptz;
  v_status text;
  v_expires_at timestamptz;
  v_checked_at timestamptz;
  v_outcome text;
  v_fingerprint jsonb;
  v_existing_fingerprint jsonb;
  v_existing_status text;
  v_existing_invitation_id uuid;
BEGIN
  IF auth.uid() IS NULL OR p_group_id IS NULL
    OR p_invitation_id IS NULL OR p_request_id IS NULL THEN
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
  IF NOT FOUND OR v_archived_at IS NOT NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'not_authorized';
  END IF;

  SELECT member.id INTO v_owner_member_id
  FROM public.group_members AS member
  WHERE member.group_id = p_group_id
    AND member.profile_id = v_actor_profile_id
    AND member.role = 'owner'
    AND member.status = 'active';
  IF v_owner_member_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'not_authorized';
  END IF;

  SELECT invitation.status, invitation.expires_at
  INTO v_status, v_expires_at
  FROM public.invitations AS invitation
  WHERE invitation.id = p_invitation_id
    AND invitation.group_id = p_group_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_invitation';
  END IF;

  v_fingerprint := jsonb_build_object(
    'group_id', p_group_id,
    'invitation_id', p_invitation_id
  );
  INSERT INTO public.ir005_invitation_requests (
    operation, actor_profile_id, group_id, request_id,
    request_fingerprint, status
  ) VALUES (
    'IR005-REVOKE', v_actor_profile_id, p_group_id,
    p_request_id, v_fingerprint, 'pending'
  ) ON CONFLICT ON CONSTRAINT ir005_invitation_requests_pkey DO NOTHING;

  IF NOT FOUND THEN
    SELECT request.request_fingerprint, request.status, request.invitation_id
    INTO v_existing_fingerprint, v_existing_status, v_existing_invitation_id
    FROM public.ir005_invitation_requests AS request
    WHERE request.operation = 'IR005-REVOKE'
      AND request.actor_profile_id = v_actor_profile_id
      AND request.group_id = p_group_id
      AND request.request_id = p_request_id
    FOR UPDATE;
    IF v_existing_fingerprint IS DISTINCT FROM v_fingerprint THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'idempotency_conflict';
    END IF;
    IF v_existing_status = 'completed'
      AND v_existing_invitation_id = p_invitation_id THEN
      RETURN jsonb_build_object(
        'outcome', 'already_completed',
        'invitation_id', p_invitation_id,
        'request_id', p_request_id
      );
    END IF;
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'operation_failed';
  END IF;

  v_checked_at := clock_timestamp();
  IF v_status = 'pending' AND v_expires_at <= v_checked_at THEN
    UPDATE public.invitations AS invitation
    SET status = 'expired', expired_at = v_checked_at
    WHERE invitation.id = p_invitation_id
      AND invitation.group_id = p_group_id;
    v_outcome := 'expired';
  ELSIF v_status = 'pending' THEN
    UPDATE public.invitations AS invitation
    SET status = 'revoked', revoked_at = v_checked_at
    WHERE invitation.id = p_invitation_id
      AND invitation.group_id = p_group_id;
    v_outcome := 'revoked';
  ELSE
    v_outcome := 'already_terminal';
  END IF;

  IF v_outcome <> 'already_terminal' THEN
    INSERT INTO public.group_audit_events (
      group_id, actor_group_member_id, event_type, request_id,
      details, occurred_at
    ) VALUES (
      p_group_id, v_owner_member_id, 'membership_lifecycle', p_request_id,
      jsonb_build_object(
        'operation', 'IR005-REVOKE',
        'invitation_id', p_invitation_id,
        'outcome', v_outcome
      ),
      v_checked_at
    );
  END IF;

  UPDATE public.ir005_invitation_requests AS request
  SET status = 'completed', invitation_id = p_invitation_id,
    completed_at = clock_timestamp()
  WHERE request.operation = 'IR005-REVOKE'
    AND request.actor_profile_id = v_actor_profile_id
    AND request.group_id = p_group_id
    AND request.request_id = p_request_id;

  RETURN jsonb_build_object(
    'outcome', v_outcome,
    'invitation_id', p_invitation_id,
    'request_id', p_request_id
  );
EXCEPTION
  WHEN SQLSTATE 'P0001' THEN RAISE;
  WHEN OTHERS THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'operation_failed';
END;
$$;

ALTER FUNCTION public.ir005_revoke_invitation_impl(uuid, uuid, uuid)
  OWNER TO ir005_invitation_executor;
REVOKE ALL ON FUNCTION public.ir005_revoke_invitation_impl(uuid, uuid, uuid)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.revoke_invitation(
  group_id uuid,
  invitation_id uuid,
  request_id uuid
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
  SELECT public.ir005_revoke_invitation_impl($1, $2, $3);
$$;
REVOKE ALL ON FUNCTION public.revoke_invitation(uuid, uuid, uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.revoke_invitation(uuid, uuid, uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.ir005_revoke_invitation_impl(uuid, uuid, uuid)
  TO authenticated;

COMMIT;
