-- IR-005 isolated TOP-002 candidate. Not integrated or an IR-005 exit.
BEGIN;

-- Hosted Supabase applies migrations as the non-superuser `postgres`, which can
-- assign ownership only to a role it can SET ROLE to and that may CREATE in the
-- schema. Both grants are revoked before COMMIT. Name `postgres` explicitly:
-- `TO CURRENT_USER` crashes the server under Supabase's supautils extension.
GRANT ir005_invitation_executor TO postgres;
GRANT CREATE ON SCHEMA public TO ir005_invitation_executor;

GRANT USAGE ON SCHEMA trip_private, public, extensions TO ir005_invitation_executor;
GRANT EXECUTE ON FUNCTION trip_private.auth_uid() TO ir005_invitation_executor;
GRANT EXECUTE ON FUNCTION extensions.gen_random_bytes(integer)
  TO ir005_invitation_executor;
GRANT EXECUTE ON FUNCTION extensions.digest(text, text)
  TO ir005_invitation_executor;
GRANT SELECT (id, email, email_confirmed_at)
  ON TABLE trip_private.auth_users TO ir005_invitation_executor;
GRANT SELECT (id, auth_user_id)
  ON TABLE public.profiles TO ir005_invitation_executor;
GRANT SELECT (id, archived_at), UPDATE (updated_at)
  ON TABLE public.groups TO ir005_invitation_executor;
GRANT SELECT (id, group_id, profile_id, role, status)
  ON TABLE public.group_members TO ir005_invitation_executor;
GRANT SELECT (id, group_id, recipient_email, status, expires_at, created_at),
  INSERT (group_id, created_by_group_member_id, recipient_email,
    proof_verifier, status, expires_at),
  UPDATE (status, expired_at)
  ON TABLE public.invitations TO ir005_invitation_executor;
GRANT SELECT (operation, actor_profile_id, group_id, request_id,
    request_fingerprint, status, invitation_id),
  INSERT (operation, actor_profile_id, group_id, request_id,
    request_fingerprint, status),
  UPDATE (status, invitation_id, completed_at)
  ON TABLE public.ir005_invitation_requests TO ir005_invitation_executor;
GRANT INSERT (group_id, actor_group_member_id, event_type, request_id,
    details, occurred_at)
  ON TABLE public.group_audit_events TO ir005_invitation_executor;

CREATE FUNCTION public.ir005_create_invitation_impl(
  p_group_id uuid,
  p_recipient_request jsonb,
  p_invitation_request jsonb,
  p_request_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_auth_user_id uuid;
  v_actor_profile_id uuid;
  v_owner_member_id uuid;
  v_archived_at timestamptz;
  v_recipient_email text;
  v_request_fingerprint jsonb;
  v_existing_fingerprint jsonb;
  v_existing_status text;
  v_existing_invitation_id uuid;
  v_pending_invitation_id uuid;
  v_invitation_id uuid;
  v_expires_at timestamptz;
  v_checked_at timestamptz;
  v_proof text;
BEGIN
  v_auth_user_id := trip_private.auth_uid();
  IF v_auth_user_id IS NULL OR p_group_id IS NULL OR p_request_id IS NULL
    OR p_recipient_request IS NULL
    OR jsonb_typeof(p_recipient_request) IS DISTINCT FROM 'object'
    OR jsonb_typeof(p_recipient_request -> 'email') IS DISTINCT FROM 'string'
    OR (p_recipient_request - 'email') <> '{}'::jsonb
    OR p_invitation_request IS DISTINCT FROM '{}'::jsonb
  THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_request';
  END IF;

  v_recipient_email := lower(btrim(p_recipient_request ->> 'email'));
  IF length(v_recipient_email) NOT BETWEEN 3 AND 320
    OR v_recipient_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_request';
  END IF;

  SELECT profile.id INTO v_actor_profile_id
  FROM public.profiles AS profile
  JOIN trip_private.auth_users AS auth_user ON auth_user.id = profile.auth_user_id
  WHERE profile.auth_user_id = v_auth_user_id
    AND auth_user.email_confirmed_at IS NOT NULL;
  IF v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'not_authorized';
  END IF;

  -- Every IR-005 Group lifecycle operation must acquire this lock first.
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

  v_request_fingerprint := jsonb_build_object(
    'group_id', p_group_id,
    'recipient_email', v_recipient_email,
    'expires_in_days', 7,
    'role', 'member'
  );
  INSERT INTO public.ir005_invitation_requests (
    operation, actor_profile_id, group_id, request_id,
    request_fingerprint, status
  ) VALUES (
    'TOP-002', v_actor_profile_id, p_group_id, p_request_id,
    v_request_fingerprint, 'pending'
  ) ON CONFLICT ON CONSTRAINT ir005_invitation_requests_pkey DO NOTHING;

  IF NOT FOUND THEN
    SELECT request.request_fingerprint, request.status, request.invitation_id
    INTO v_existing_fingerprint, v_existing_status, v_existing_invitation_id
    FROM public.ir005_invitation_requests AS request
    WHERE request.operation = 'TOP-002'
      AND request.actor_profile_id = v_actor_profile_id
      AND request.group_id = p_group_id
      AND request.request_id = p_request_id
    FOR UPDATE;
    IF v_existing_fingerprint IS DISTINCT FROM v_request_fingerprint THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'idempotency_conflict';
    END IF;
    IF v_existing_status = 'completed' THEN
      RETURN jsonb_build_object(
        'outcome', 'already_completed',
        'invitation_id', v_existing_invitation_id,
        'request_id', p_request_id
      );
    END IF;
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'operation_failed';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.group_members AS member
    JOIN public.profiles AS profile ON profile.id = member.profile_id
    JOIN trip_private.auth_users AS auth_user ON auth_user.id = profile.auth_user_id
    WHERE member.group_id = p_group_id
      AND member.status = 'active'
      AND lower(auth_user.email) = v_recipient_email
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'recipient_already_member';
  END IF;

  SELECT invitation.id INTO v_pending_invitation_id
  FROM public.invitations AS invitation
  WHERE invitation.group_id = p_group_id
    AND invitation.recipient_email = v_recipient_email
    AND invitation.status = 'pending'
  FOR UPDATE;
  IF v_pending_invitation_id IS NOT NULL THEN
    v_checked_at := clock_timestamp();
    UPDATE public.invitations AS invitation
    SET status = 'expired', expired_at = v_checked_at
    WHERE invitation.id = v_pending_invitation_id
      AND invitation.expires_at <= v_checked_at;
    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invitation_already_pending';
    END IF;
  END IF;

  v_proof := encode(extensions.gen_random_bytes(32), 'hex');
  v_expires_at := clock_timestamp() + interval '7 days';
  INSERT INTO public.invitations (
    group_id, created_by_group_member_id, recipient_email,
    proof_verifier, status, expires_at
  ) VALUES (
    p_group_id, v_owner_member_id, v_recipient_email,
    extensions.digest(v_proof, 'sha256'), 'pending', v_expires_at
  ) RETURNING id INTO v_invitation_id;

  INSERT INTO public.group_audit_events (
    group_id, actor_group_member_id, event_type, request_id,
    details, occurred_at
  ) VALUES (
    p_group_id, v_owner_member_id, 'membership_lifecycle', p_request_id,
    jsonb_build_object('operation', 'TOP-002', 'invitation_id', v_invitation_id),
    now()
  );

  UPDATE public.ir005_invitation_requests AS request
  SET status = 'completed', invitation_id = v_invitation_id,
    completed_at = now()
  WHERE request.operation = 'TOP-002'
    AND request.actor_profile_id = v_actor_profile_id
    AND request.group_id = p_group_id
    AND request.request_id = p_request_id;

  RETURN jsonb_build_object(
    'outcome', 'created',
    'invitation_id', v_invitation_id,
    'proof', v_proof,
    'expires_at', v_expires_at,
    'request_id', p_request_id
  );
EXCEPTION
  WHEN SQLSTATE 'P0001' THEN RAISE;
  WHEN OTHERS THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'operation_failed';
END;
$$;

ALTER FUNCTION public.ir005_create_invitation_impl(uuid, jsonb, jsonb, uuid)
  OWNER TO ir005_invitation_executor;
REVOKE ALL ON FUNCTION public.ir005_create_invitation_impl(uuid, jsonb, jsonb, uuid)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.create_invitation(
  group_id uuid,
  recipient_request jsonb,
  invitation_request jsonb,
  request_id uuid
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
  SELECT public.ir005_create_invitation_impl($1, $2, $3, $4);
$$;
REVOKE ALL ON FUNCTION public.create_invitation(uuid, jsonb, jsonb, uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.create_invitation(uuid, jsonb, jsonb, uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.ir005_create_invitation_impl(uuid, jsonb, jsonb, uuid)
  TO authenticated;

REVOKE CREATE ON SCHEMA public FROM ir005_invitation_executor;
REVOKE ir005_invitation_executor FROM postgres;

COMMIT;
