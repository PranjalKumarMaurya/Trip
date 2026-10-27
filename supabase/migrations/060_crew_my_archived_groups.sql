-- Crew: archived Trips the caller can restore.
-- get_my_group_access() hides archived Trips, so an Owner needs this read-only
-- list to find and restore them. It returns only Trips where the verified caller
-- is still an active Owner; Members and former members see nothing.
--
-- SECURITY DEFINER is required: group_members is not readable by clients and the
-- RLS helpers exclude archived Trips. It is owned by the existing narrow role,
-- which already holds exactly the column grants used here (migrations 013, 020,
-- 022), and reaches Auth only through trip_private.
BEGIN;

-- Hosted Supabase applies migrations as the non-superuser `postgres`, which can
-- assign ownership only to a role it can SET ROLE to and that may CREATE in the
-- schema. Both grants are revoked before COMMIT. Name `postgres` explicitly:
-- `TO CURRENT_USER` crashes the server under Supabase's supautils extension.
GRANT ir005_invitation_executor TO postgres;
GRANT CREATE ON SCHEMA public TO ir005_invitation_executor;

CREATE FUNCTION public.get_my_archived_groups()
RETURNS TABLE(
  group_id uuid, trip_name text, destination text,
  start_date date, end_date date, archived_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT member.group_id, config.trip_name, config.destination,
    config.start_date, config.end_date, trip_group.archived_at
  FROM trip_private.auth_users AS auth_user
  JOIN public.profiles AS profile ON profile.auth_user_id = auth_user.id
  JOIN public.group_members AS member ON member.profile_id = profile.id
  JOIN public.groups AS trip_group ON trip_group.id = member.group_id
  JOIN public.group_configurations AS config ON config.group_id = member.group_id
  WHERE auth_user.id = (SELECT trip_private.auth_uid())
    AND auth_user.email_confirmed_at IS NOT NULL
    AND member.status = 'active'
    AND member.role = 'owner'
    AND trip_group.archived_at IS NOT NULL
  ORDER BY trip_group.archived_at DESC, member.group_id
  LIMIT 100;
$$;
ALTER FUNCTION public.get_my_archived_groups() OWNER TO ir005_invitation_executor;
REVOKE ALL ON FUNCTION public.get_my_archived_groups() FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_archived_groups() TO authenticated;

REVOKE CREATE ON SCHEMA public FROM ir005_invitation_executor;
REVOKE ir005_invitation_executor FROM postgres;

COMMIT;
