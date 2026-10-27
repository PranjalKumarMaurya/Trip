-- Shared base for the Trips home, profile, and international-Trip streams.
BEGIN;

-- Domestic Trips hide currency choice and FX; International Trips show them.
ALTER TABLE public.group_configurations
  ADD COLUMN is_international boolean NOT NULL DEFAULT false;

-- Details people edit about themselves. Only the owner reads or writes their
-- own row (existing RLS); co-members see them via get_trip_member_profiles().
ALTER TABLE public.profiles
  ADD COLUMN avatar_emoji text CHECK (avatar_emoji IS NULL OR char_length(avatar_emoji) BETWEEN 1 AND 16),
  ADD COLUMN avatar_path text CHECK (avatar_path IS NULL OR char_length(avatar_path) <= 300),
  ADD COLUMN home_currency text REFERENCES public.iso_4217_currency_codes(code) ON DELETE RESTRICT,
  ADD COLUMN upi_id text CHECK (upi_id IS NULL OR upi_id ~ '^[A-Za-z0-9._-]{2,64}@[A-Za-z][A-Za-z0-9]{1,63}$'),
  ADD COLUMN phone text CHECK (phone IS NULL OR phone ~ '^\+?[0-9 ()-]{6,24}$'),
  ADD COLUMN emergency_contact text CHECK (emergency_contact IS NULL OR char_length(emergency_contact) <= 200),
  ADD COLUMN dietary_notes text CHECK (dietary_notes IS NULL OR char_length(dietary_notes) <= 300);

GRANT SELECT (avatar_emoji, avatar_path, home_currency, upi_id, phone, emergency_contact, dietary_notes),
  UPDATE (avatar_emoji, avatar_path, home_currency, upi_id, phone, emergency_contact, dietary_notes)
  ON TABLE public.profiles TO authenticated;

-- Active members of a Trip see each other's name, avatar, UPI ID and crew info;
-- nobody else sees anything. Owned by `postgres` like current_member_id().
CREATE FUNCTION public.get_trip_member_profiles(p_group_id uuid)
RETURNS TABLE (
  group_member_id uuid, display_name text, avatar_emoji text, avatar_path text,
  upi_id text, phone text, emergency_contact text, dietary_notes text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT member.id, profile.display_name, profile.avatar_emoji, profile.avatar_path,
    profile.upi_id, profile.phone, profile.emergency_contact, profile.dietary_notes
  FROM public.group_members AS member
  JOIN public.profiles AS profile ON profile.id = member.profile_id
  WHERE member.group_id = p_group_id
    AND member.status = 'active'
    AND p_group_id IN (SELECT ir007_private.current_active_group_ids())
  ORDER BY member.created_at, member.id;
$$;
REVOKE ALL ON FUNCTION public.get_trip_member_profiles(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_trip_member_profiles(uuid) TO authenticated;

-- get_my_group_access() also reports whether each Trip is international.
-- Hosted Supabase applies migrations as the non-superuser `postgres`, which can
-- assign ownership only to a role it can SET ROLE to and that may CREATE in the
-- schema. Both grants are revoked before COMMIT. Name `postgres` explicitly:
-- `TO CURRENT_USER` crashes the server under Supabase's supautils extension.
GRANT ir005_invitation_executor TO postgres;
GRANT CREATE ON SCHEMA public TO ir005_invitation_executor;

GRANT SELECT (is_international) ON TABLE public.group_configurations TO ir005_invitation_executor;

DROP FUNCTION public.get_my_group_access();
CREATE FUNCTION public.get_my_group_access()
RETURNS TABLE(
  group_id uuid, group_member_id uuid, role text, trip_name text, destination text,
  start_date date, end_date date, timezone text, accounting_currency text, is_international boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT member.group_id, member.id, member.role, config.trip_name, config.destination,
    config.start_date, config.end_date, config.timezone, config.accounting_currency, config.is_international
  FROM trip_private.auth_users AS auth_user
  JOIN public.profiles AS profile ON profile.auth_user_id = auth_user.id
  JOIN public.group_members AS member ON member.profile_id = profile.id
  JOIN public.groups AS trip_group ON trip_group.id = member.group_id
  JOIN public.group_configurations AS config ON config.group_id = member.group_id
  WHERE auth_user.id = (SELECT trip_private.auth_uid())
    AND auth_user.email_confirmed_at IS NOT NULL
    AND member.status = 'active'
    AND trip_group.archived_at IS NULL
  ORDER BY member.group_id;
$$;
ALTER FUNCTION public.get_my_group_access() OWNER TO ir005_invitation_executor;
REVOKE ALL ON FUNCTION public.get_my_group_access() FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_group_access() TO authenticated;

REVOKE CREATE ON SCHEMA public FROM ir005_invitation_executor;
REVOKE ir005_invitation_executor FROM postgres;

COMMIT;
