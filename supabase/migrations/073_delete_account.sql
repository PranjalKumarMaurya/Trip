-- Delete my account. The person leaves every Trip (memberships stay as inactive,
-- unlinked rows so Trip history keeps its foreign keys and shows "a former
-- member"), their profile is removed, and their Auth user is deleted. It is
-- refused while they are the last active Owner of any Trip that is not archived.
--
-- SECURITY DEFINER owned by `postgres`: the final step deletes from auth.users,
-- which hosted `postgres` may do but cannot grant to another role. Profile photos
-- must be removed through the Storage API first (Storage refuses SQL deletes, and
-- they would orphan the files); the function refuses while any remain.
BEGIN;

-- Trips that would be left without an Owner if the caller deleted their account.
CREATE FUNCTION public.get_account_deletion_blockers()
RETURNS TABLE (group_id uuid, trip_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT mine.group_id, config.trip_name
  FROM public.group_members AS mine
  JOIN public.groups AS trip_group ON trip_group.id = mine.group_id
  JOIN public.group_configurations AS config ON config.group_id = mine.group_id
  WHERE mine.profile_id = (SELECT ir007_private.current_profile_id())
    AND mine.status = 'active'
    AND mine.role = 'owner'
    AND trip_group.archived_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.group_members AS other
      WHERE other.group_id = mine.group_id
        AND other.id <> mine.id
        AND other.status = 'active'
        AND other.role = 'owner'
    )
  ORDER BY config.trip_name, mine.group_id;
$$;
REVOKE ALL ON FUNCTION public.get_account_deletion_blockers() FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_account_deletion_blockers() TO authenticated;

CREATE FUNCTION public.delete_my_account(p_confirmation text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile_id uuid;
  v_request_id uuid := gen_random_uuid();
  v_member record;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'not_authenticated';
  END IF;
  IF p_confirmation IS DISTINCT FROM 'DELETE' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'invalid_request';
  END IF;

  -- The profile row lock serialises two deletes of the same account.
  SELECT profile.id INTO v_profile_id
  FROM public.profiles AS profile
  WHERE profile.auth_user_id = v_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    -- A retry after a lost response: the account is already gone.
    IF NOT EXISTS (SELECT 1 FROM auth.users AS auth_user WHERE auth_user.id = v_user_id) THEN
      RETURN jsonb_build_object('outcome', 'already_deleted');
    END IF;
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'profile_unavailable';
  END IF;

  -- Lock every Trip the caller is active in (fixed order), like every membership
  -- lifecycle operation, so no concurrent role change can strand a Trip.
  PERFORM 1
  FROM public.groups AS trip_group
  WHERE trip_group.id IN (
    SELECT member.group_id FROM public.group_members AS member
    WHERE member.profile_id = v_profile_id AND member.status = 'active'
  )
  ORDER BY trip_group.id
  FOR UPDATE;

  IF EXISTS (
    SELECT 1
    FROM public.group_members AS mine
    JOIN public.groups AS trip_group ON trip_group.id = mine.group_id
    WHERE mine.profile_id = v_profile_id
      AND mine.status = 'active'
      AND mine.role = 'owner'
      AND trip_group.archived_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.group_members AS other
        WHERE other.group_id = mine.group_id
          AND other.id <> mine.id
          AND other.status = 'active'
          AND other.role = 'owner'
      )
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'last_owner';
  END IF;

  IF EXISTS (
    SELECT 1 FROM storage.objects AS object
    WHERE object.bucket_id = 'avatars' AND object.name LIKE v_user_id::text || '/%'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'avatars_remaining';
  END IF;

  FOR v_member IN
    SELECT member.id, member.group_id, member.role
    FROM public.group_members AS member
    WHERE member.profile_id = v_profile_id AND member.status = 'active'
    ORDER BY member.group_id
  LOOP
    INSERT INTO public.group_audit_events (
      group_id, actor_group_member_id, event_type, request_id, details, occurred_at
    ) VALUES (
      v_member.group_id, v_member.id, 'membership_lifecycle', v_request_id,
      jsonb_build_object('operation', 'account_deleted', 'target_membership_id', v_member.id,
        'prior_role', v_member.role),
      clock_timestamp()
    );
  END LOOP;

  -- Invitations they accepted no longer carry their email address.
  UPDATE public.invitations AS invitation
  SET recipient_email = 'former-member@deleted.invalid'
  FROM public.group_members AS member
  WHERE member.profile_id = v_profile_id
    AND invitation.group_id = member.group_id
    AND invitation.accepted_by_group_member_id = member.id;

  -- Every membership (active or past) becomes an inactive, unlinked history row.
  UPDATE public.group_members AS member
  SET status = 'inactive', role = 'member', profile_id = NULL
  WHERE member.profile_id = v_profile_id;

  -- Idempotency records for their own requests reference the profile.
  DELETE FROM public.ir003_bootstrap_requests AS request WHERE request.actor_profile_id = v_profile_id;
  DELETE FROM public.ir005_invitation_requests AS request WHERE request.actor_profile_id = v_profile_id;
  DELETE FROM public.ir005_lifecycle_requests AS request WHERE request.actor_profile_id = v_profile_id;

  DELETE FROM public.profiles AS profile WHERE profile.id = v_profile_id;
  -- Cascades to the person's Auth identities, sessions, and refresh tokens.
  DELETE FROM auth.users AS auth_user WHERE auth_user.id = v_user_id;

  RETURN jsonb_build_object('outcome', 'deleted');
EXCEPTION
  WHEN SQLSTATE 'P0001' THEN RAISE;
  WHEN OTHERS THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'operation_failed';
END;
$$;
REVOKE ALL ON FUNCTION public.delete_my_account(text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.delete_my_account(text) TO authenticated;

COMMIT;
