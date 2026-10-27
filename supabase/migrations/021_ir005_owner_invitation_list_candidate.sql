-- IR-005 isolated Owner-only Invitation management projection.
BEGIN;

-- Hosted Supabase applies migrations as the non-superuser `postgres`, which can
-- assign ownership only to a role it can SET ROLE to and that may CREATE in the
-- schema. Both grants are revoked before COMMIT. Name `postgres` explicitly:
-- `TO CURRENT_USER` crashes the server under Supabase's supautils extension.
GRANT ir005_invitation_executor TO postgres;
GRANT CREATE ON SCHEMA public TO ir005_invitation_executor;

CREATE INDEX invitations_group_created_id_desc_idx
  ON public.invitations (group_id, created_at DESC, id DESC);

CREATE FUNCTION public.ir005_list_group_invitations_impl(
  p_group_id uuid,
  p_before_created_at timestamptz,
  p_before_invitation_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_actor_profile_id uuid;
  v_checked_at timestamptz;
  v_live_count bigint;
  v_items jsonb;
BEGIN
  IF trip_private.auth_uid() IS NULL OR p_group_id IS NULL
    OR ((p_before_created_at IS NULL) <> (p_before_invitation_id IS NULL)) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_request';
  END IF;

  SELECT profile.id INTO v_actor_profile_id
  FROM public.profiles AS profile
  JOIN trip_private.auth_users AS auth_user ON auth_user.id = profile.auth_user_id
  WHERE profile.auth_user_id = trip_private.auth_uid()
    AND auth_user.email_confirmed_at IS NOT NULL;
  IF v_actor_profile_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.group_members AS member
    WHERE member.group_id = p_group_id
      AND member.profile_id = v_actor_profile_id
      AND member.status = 'active'
      AND member.role = 'owner'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'not_authorized';
  END IF;

  v_checked_at := clock_timestamp();
  SELECT count(*) INTO v_live_count
  FROM public.invitations AS invitation
  WHERE invitation.group_id = p_group_id
    AND invitation.status = 'pending'
    AND invitation.expires_at > v_checked_at;

  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'invitation_id', page.id,
      'recipient_email', page.recipient_email,
      'status', CASE
        WHEN page.status = 'pending' AND page.expires_at <= v_checked_at
          THEN 'expired' ELSE page.status END,
      'expires_at', page.expires_at,
      'created_at', page.created_at
    ) ORDER BY page.created_at DESC, page.id DESC
  ), '[]'::jsonb)
  INTO v_items
  FROM (
    SELECT invitation.id, invitation.recipient_email,
      invitation.status, invitation.expires_at, invitation.created_at
    FROM public.invitations AS invitation
    WHERE invitation.group_id = p_group_id
      AND (p_before_created_at IS NULL
        OR (invitation.created_at, invitation.id)
          < (p_before_created_at, p_before_invitation_id))
    ORDER BY invitation.created_at DESC, invitation.id DESC
    LIMIT 50
  ) AS page;

  RETURN jsonb_build_object('items', v_items, 'live_count', v_live_count);
EXCEPTION
  WHEN SQLSTATE 'P0001' THEN RAISE;
  WHEN OTHERS THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'list_failed';
END;
$$;

ALTER FUNCTION public.ir005_list_group_invitations_impl(uuid, timestamptz, uuid)
  OWNER TO ir005_invitation_executor;
REVOKE ALL ON FUNCTION public.ir005_list_group_invitations_impl(uuid, timestamptz, uuid)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.list_group_invitations(
  group_id uuid,
  before_created_at timestamptz,
  before_invitation_id uuid
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
  SELECT public.ir005_list_group_invitations_impl($1, $2, $3);
$$;
REVOKE ALL ON FUNCTION public.list_group_invitations(uuid, timestamptz, uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.list_group_invitations(uuid, timestamptz, uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.ir005_list_group_invitations_impl(uuid, timestamptz, uuid)
  TO authenticated;

REVOKE CREATE ON SCHEMA public FROM ir005_invitation_executor;
REVOKE ir005_invitation_executor FROM postgres;

COMMIT;
