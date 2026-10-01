-- Journey-only IR-011 candidate. Not an authorised migration or release artifact.
-- Lists only the current verified user's active, non-archived memberships.
BEGIN;

GRANT SELECT (group_id, trip_name, destination)
  ON TABLE public.group_configurations TO ir005_invitation_executor;

CREATE FUNCTION public.get_my_group_access()
RETURNS TABLE(group_id uuid, role text, trip_name text, destination text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT member.group_id, member.role, config.trip_name, config.destination
  FROM auth.users AS auth_user
  JOIN public.profiles AS profile ON profile.auth_user_id = auth_user.id
  JOIN public.group_members AS member ON member.profile_id = profile.id
  JOIN public.groups AS trip_group ON trip_group.id = member.group_id
  JOIN public.group_configurations AS config ON config.group_id = member.group_id
  WHERE auth_user.id = (SELECT auth.uid())
    AND auth_user.email_confirmed_at IS NOT NULL
    AND member.status = 'active'
    AND trip_group.archived_at IS NULL
  ORDER BY member.group_id;
$$;
ALTER FUNCTION public.get_my_group_access() OWNER TO ir005_invitation_executor;
REVOKE ALL ON FUNCTION public.get_my_group_access() FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_group_access() TO authenticated;

COMMIT;
