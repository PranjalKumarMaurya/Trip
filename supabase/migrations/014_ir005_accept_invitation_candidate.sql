-- IR-005 isolated TOP-003 candidate. Not integrated or an IR-005 exit.
BEGIN;

GRANT SELECT (proof_verifier, accepted_by_group_member_id),
  UPDATE (status, accepted_by_group_member_id, accepted_at)
  ON TABLE public.invitations TO ir005_invitation_executor;
GRANT INSERT (group_id, profile_id, role, status),
  UPDATE (role, status)
  ON TABLE public.group_members TO ir005_invitation_executor;

CREATE FUNCTION public.ir005_accept_invitation_impl(
  p_invitation_proof text,
  p_continuation_context jsonb,
  p_request_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_auth_user_id uuid;
  v_actor_email text;
  v_actor_profile_id uuid;
  v_invitation_id uuid;
  v_group_id uuid;
  v_recipient_email text;
  v_invitation_status text;
  v_expires_at timestamptz;
  v_archived_at timestamptz;
  v_group_member_id uuid;
  v_member_status text;
  v_request_fingerprint jsonb;
  v_existing_fingerprint jsonb;
  v_existing_status text;
  v_existing_invitation_id uuid;
BEGIN
  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL OR p_request_id IS NULL
    OR p_invitation_proof IS NULL
    OR p_invitation_proof !~ '^[0-9a-f]{64}$'
    OR p_continuation_context IS DISTINCT FROM '{}'::jsonb
  THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_invitation';
  END IF;

  SELECT lower(auth_user.email), profile.id
  INTO v_actor_email, v_actor_profile_id
  FROM auth.users AS auth_user
  JOIN public.profiles AS profile ON profile.auth_user_id = auth_user.id
  WHERE auth_user.id = v_auth_user_id
    AND auth_user.email_confirmed_at IS NOT NULL;
  IF v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'not_authorized';
  END IF;

  -- Resolve an opaque proof only to find the Group lock. Re-read state after it.
  SELECT invitation.id, invitation.group_id
  INTO v_invitation_id, v_group_id
  FROM public.invitations AS invitation
  WHERE invitation.proof_verifier = extensions.digest(p_invitation_proof, 'sha256');
  IF v_invitation_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_invitation';
  END IF;

  SELECT g.archived_at INTO v_archived_at
  FROM public.groups AS g
  WHERE g.id = v_group_id
  FOR UPDATE;
  IF NOT FOUND OR v_archived_at IS NOT NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_invitation';
  END IF;

  SELECT invitation.recipient_email, invitation.status, invitation.expires_at
  INTO v_recipient_email, v_invitation_status, v_expires_at
  FROM public.invitations AS invitation
  WHERE invitation.id = v_invitation_id
    AND invitation.group_id = v_group_id
  FOR UPDATE;
  IF NOT FOUND OR v_recipient_email <> v_actor_email THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_invitation';
  END IF;

  v_request_fingerprint := jsonb_build_object(
    'invitation_id', v_invitation_id,
    'group_id', v_group_id,
    'actor_profile_id', v_actor_profile_id
  );
  INSERT INTO public.ir005_invitation_requests (
    operation, actor_profile_id, group_id, request_id,
    request_fingerprint, status
  ) VALUES (
    'TOP-003', v_actor_profile_id, v_group_id, p_request_id,
    v_request_fingerprint, 'pending'
  ) ON CONFLICT ON CONSTRAINT ir005_invitation_requests_pkey DO NOTHING;

  IF NOT FOUND THEN
    SELECT request.request_fingerprint, request.status, request.invitation_id
    INTO v_existing_fingerprint, v_existing_status, v_existing_invitation_id
    FROM public.ir005_invitation_requests AS request
    WHERE request.operation = 'TOP-003'
      AND request.actor_profile_id = v_actor_profile_id
      AND request.group_id = v_group_id
      AND request.request_id = p_request_id
    FOR UPDATE;
    IF v_existing_fingerprint IS DISTINCT FROM v_request_fingerprint THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'idempotency_conflict';
    END IF;
    IF v_existing_status = 'completed'
      AND v_existing_invitation_id = v_invitation_id
      AND v_invitation_status = 'accepted'
    THEN
      RETURN jsonb_build_object(
        'outcome', 'already_completed',
        'group_id', v_group_id,
        'request_id', p_request_id
      );
    END IF;
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_invitation';
  END IF;

  IF v_invitation_status <> 'pending' OR v_expires_at <= now() THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_invitation';
  END IF;

  SELECT member.id, member.status
  INTO v_group_member_id, v_member_status
  FROM public.group_members AS member
  WHERE member.group_id = v_group_id
    AND member.profile_id = v_actor_profile_id
  FOR UPDATE;
  IF v_group_member_id IS NOT NULL AND v_member_status = 'active' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'already_member';
  END IF;

  IF v_group_member_id IS NULL THEN
    INSERT INTO public.group_members (group_id, profile_id, role, status)
    VALUES (v_group_id, v_actor_profile_id, 'member', 'active')
    RETURNING id INTO v_group_member_id;
  ELSE
    UPDATE public.group_members AS member
    SET role = 'member', status = 'active'
    WHERE member.id = v_group_member_id
      AND member.group_id = v_group_id;
  END IF;

  UPDATE public.invitations AS invitation
  SET status = 'accepted',
    accepted_by_group_member_id = v_group_member_id,
    accepted_at = now()
  WHERE invitation.id = v_invitation_id
    AND invitation.group_id = v_group_id
    AND invitation.status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_invitation';
  END IF;

  INSERT INTO public.group_audit_events (
    group_id, actor_group_member_id, event_type, request_id,
    details, occurred_at
  ) VALUES (
    v_group_id, v_group_member_id, 'membership_lifecycle', p_request_id,
    jsonb_build_object('operation', 'TOP-003', 'invitation_id', v_invitation_id),
    now()
  );

  UPDATE public.ir005_invitation_requests AS request
  SET status = 'completed', invitation_id = v_invitation_id,
    completed_at = now()
  WHERE request.operation = 'TOP-003'
    AND request.actor_profile_id = v_actor_profile_id
    AND request.group_id = v_group_id
    AND request.request_id = p_request_id;

  RETURN jsonb_build_object(
    'outcome', 'accepted',
    'group_id', v_group_id,
    'group_member_id', v_group_member_id,
    'request_id', p_request_id
  );
EXCEPTION
  WHEN SQLSTATE 'P0001' THEN RAISE;
  WHEN OTHERS THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'operation_failed';
END;
$$;

ALTER FUNCTION public.ir005_accept_invitation_impl(text, jsonb, uuid)
  OWNER TO ir005_invitation_executor;
REVOKE ALL ON FUNCTION public.ir005_accept_invitation_impl(text, jsonb, uuid)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.accept_invitation(
  invitation_proof text,
  continuation_context jsonb,
  request_id uuid
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
  SELECT public.ir005_accept_invitation_impl($1, $2, $3);
$$;
REVOKE ALL ON FUNCTION public.accept_invitation(text, jsonb, uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text, jsonb, uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.ir005_accept_invitation_impl(text, jsonb, uuid)
  TO authenticated;

COMMIT;
