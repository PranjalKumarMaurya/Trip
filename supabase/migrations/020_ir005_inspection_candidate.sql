-- IR-005 isolated read-only Invitation inspection candidate.
BEGIN;

-- Hosted Supabase applies migrations as the non-superuser `postgres`, which can
-- assign ownership only to a role it can SET ROLE to and that may CREATE in the
-- schema. Both grants are revoked before COMMIT. Name `postgres` explicitly:
-- `TO CURRENT_USER` crashes the server under Supabase's supautils extension.
GRANT ir005_invitation_executor TO postgres;
GRANT CREATE ON SCHEMA public TO ir005_invitation_executor;

GRANT SELECT (group_id, trip_name, destination, start_date, end_date)
  ON TABLE public.group_configurations TO ir005_invitation_executor;

CREATE FUNCTION public.ir005_inspect_invitation_impl(p_invitation_proof text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_recipient_email text;
  v_status text;
  v_expires_at timestamptz;
  v_archived_at timestamptz;
  v_trip_name text;
  v_destination text;
  v_start_date date;
  v_end_date date;
  v_auth_email text;
  v_email_confirmed_at timestamptz;
  v_context jsonb;
BEGIN
  IF p_invitation_proof IS NULL
    OR p_invitation_proof !~ '^[0-9a-f]{64}$' THEN
    RETURN jsonb_build_object('outcome', 'invalid');
  END IF;

  SELECT invitation.recipient_email, invitation.status,
    invitation.expires_at, g.archived_at,
    config.trip_name, config.destination,
    config.start_date, config.end_date
  INTO v_recipient_email, v_status, v_expires_at, v_archived_at,
    v_trip_name, v_destination, v_start_date, v_end_date
  FROM public.invitations AS invitation
  JOIN public.groups AS g ON g.id = invitation.group_id
  JOIN public.group_configurations AS config ON config.group_id = g.id
  WHERE invitation.proof_verifier = extensions.digest(p_invitation_proof, 'sha256');
  IF NOT FOUND THEN
    RETURN jsonb_build_object('outcome', 'invalid');
  END IF;

  IF trip_private.auth_uid() IS NOT NULL THEN
    SELECT lower(auth_user.email), auth_user.email_confirmed_at
    INTO v_auth_email, v_email_confirmed_at
    FROM trip_private.auth_users AS auth_user
    WHERE auth_user.id = trip_private.auth_uid();
  END IF;

  IF v_archived_at IS NOT NULL THEN
    RETURN jsonb_build_object('outcome', 'invalid');
  END IF;
  IF v_status <> 'pending' OR v_expires_at <= clock_timestamp() THEN
    IF v_email_confirmed_at IS NOT NULL
      AND v_auth_email = v_recipient_email THEN
      RETURN jsonb_build_object(
        'outcome', CASE
          WHEN v_status = 'accepted' THEN 'used'
          WHEN v_status = 'revoked' THEN 'revoked'
          ELSE 'expired'
        END
      );
    END IF;
    RETURN jsonb_build_object('outcome', 'invalid');
  END IF;

  v_context := jsonb_build_object(
    'trip_name', v_trip_name,
    'destination', v_destination,
    'start_date', v_start_date,
    'end_date', v_end_date,
    'expires_at', v_expires_at
  );
  IF trip_private.auth_uid() IS NULL THEN
    RETURN v_context || jsonb_build_object('outcome', 'continue');
  END IF;
  IF v_email_confirmed_at IS NULL THEN
    RETURN v_context || jsonb_build_object('outcome', 'verification_required');
  END IF;
  IF v_auth_email <> v_recipient_email THEN
    RETURN v_context || jsonb_build_object('outcome', 'switch_account');
  END IF;
  RETURN v_context || jsonb_build_object('outcome', 'ready');
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'inspection_failed';
END;
$$;

ALTER FUNCTION public.ir005_inspect_invitation_impl(text)
  OWNER TO ir005_invitation_executor;
REVOKE ALL ON FUNCTION public.ir005_inspect_invitation_impl(text)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.inspect_invitation(invitation_proof text)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
  SELECT public.ir005_inspect_invitation_impl($1);
$$;
REVOKE ALL ON FUNCTION public.inspect_invitation(text)
  FROM PUBLIC, service_role;
GRANT EXECUTE ON FUNCTION public.inspect_invitation(text)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ir005_inspect_invitation_impl(text)
  TO anon, authenticated;

REVOKE CREATE ON SCHEMA public FROM ir005_invitation_executor;
REVOKE ir005_invitation_executor FROM postgres;

COMMIT;
