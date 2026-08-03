-- IR-007 DBM-006: fail-closed current-schema ownership boundary.
-- Authorised by docs/implementation-execution/authorisations/IR-007-authorisation.md.

BEGIN;

CREATE SCHEMA ir007_private;

REVOKE ALL ON SCHEMA ir007_private FROM PUBLIC, anon, authenticated;

CREATE FUNCTION ir007_private.current_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT profile.id
  FROM public.profiles AS profile
  WHERE profile.auth_user_id = (SELECT auth.uid())
  LIMIT 1;
$$;

CREATE FUNCTION ir007_private.current_active_group_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT group_member.group_id
  FROM public.group_members AS group_member
  INNER JOIN public.groups AS trip_group
    ON trip_group.id = group_member.group_id
  WHERE group_member.profile_id = (
    SELECT ir007_private.current_profile_id()
  )
    AND group_member.status = 'active'
    AND trip_group.archived_at IS NULL;
$$;

CREATE FUNCTION ir007_private.current_active_owner_group_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT group_member.group_id
  FROM public.group_members AS group_member
  INNER JOIN public.groups AS trip_group
    ON trip_group.id = group_member.group_id
  WHERE group_member.profile_id = (
    SELECT ir007_private.current_profile_id()
  )
    AND group_member.status = 'active'
    AND group_member.role = 'owner'
    AND trip_group.archived_at IS NULL;
$$;

CREATE FUNCTION public.get_group_roster(
  p_group_id uuid,
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  participant_id uuid,
  group_id uuid,
  display_name text,
  role text,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT
    group_member.id AS participant_id,
    group_member.group_id,
    profile.display_name,
    group_member.role,
    group_member.status
  FROM public.group_members AS group_member
  INNER JOIN public.profiles AS profile
    ON profile.id = group_member.profile_id
  WHERE group_member.group_id = p_group_id
    AND p_group_id IN (
      SELECT ir007_private.current_active_group_ids()
    )
  ORDER BY group_member.created_at, group_member.id
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 100);
$$;

CREATE FUNCTION public.get_group_audit_summary(
  p_group_id uuid,
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  audit_event_id uuid,
  group_id uuid,
  actor_participant_id uuid,
  event_type text,
  occurred_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT
    audit_event.id AS audit_event_id,
    audit_event.group_id,
    audit_event.actor_group_member_id AS actor_participant_id,
    audit_event.event_type,
    audit_event.occurred_at
  FROM public.group_audit_events AS audit_event
  WHERE audit_event.group_id = p_group_id
    AND p_group_id IN (
      SELECT ir007_private.current_active_owner_group_ids()
    )
  ORDER BY audit_event.occurred_at DESC, audit_event.id DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 100);
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups FORCE ROW LEVEL SECURITY;
ALTER TABLE public.group_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_configurations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members FORCE ROW LEVEL SECURITY;
ALTER TABLE public.group_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_audit_events FORCE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.iso_4217_currency_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iso_4217_currency_codes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events FORCE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses FORCE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements FORCE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates FORCE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_own_linked_profile ON public.profiles;
CREATE POLICY profiles_select_own_linked_profile
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = auth_user_id);

CREATE POLICY profiles_update_own_presentation
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = auth_user_id)
  WITH CHECK ((SELECT auth.uid()) = auth_user_id);

CREATE POLICY groups_select_active_member
  ON public.groups
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT ir007_private.current_active_group_ids()
    )
  );

CREATE POLICY group_configurations_select_active_member
  ON public.group_configurations
  FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT ir007_private.current_active_group_ids()
    )
  );

DROP POLICY IF EXISTS group_read_events ON public.events;
DROP POLICY IF EXISTS group_insert_events ON public.events;
DROP POLICY IF EXISTS group_update_events ON public.events;
DROP POLICY IF EXISTS group_delete_events ON public.events;
DROP POLICY IF EXISTS group_read_expenses ON public.expenses;
DROP POLICY IF EXISTS group_insert_expenses ON public.expenses;
DROP POLICY IF EXISTS group_update_expenses ON public.expenses;
DROP POLICY IF EXISTS group_delete_expenses ON public.expenses;
DROP POLICY IF EXISTS group_read_settlements ON public.settlements;
DROP POLICY IF EXISTS group_insert_settlements ON public.settlements;
DROP POLICY IF EXISTS group_read_rates ON public.exchange_rates;
DROP POLICY IF EXISTS group_insert_rates ON public.exchange_rates;
DROP POLICY IF EXISTS group_update_rates ON public.exchange_rates;
DROP POLICY IF EXISTS todos_public ON public.todos;

CREATE INDEX group_members_active_profile_group_role_idx
  ON public.group_members (profile_id, group_id, role)
  WHERE profile_id IS NOT NULL
    AND status = 'active';

REVOKE ALL PRIVILEGES ON TABLE
  public.profiles,
  public.groups,
  public.group_configurations,
  public.group_members,
  public.group_audit_events,
  public.users,
  public.iso_4217_currency_codes,
  public.events,
  public.expenses,
  public.settlements,
  public.exchange_rates,
  public.todos
FROM PUBLIC, anon, authenticated;

GRANT SELECT (id, display_name), UPDATE (display_name)
  ON TABLE public.profiles
  TO authenticated;

GRANT SELECT
  ON TABLE public.groups, public.group_configurations
  TO authenticated;

REVOKE ALL ON FUNCTION ir007_private.current_profile_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION ir007_private.current_active_group_ids() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION ir007_private.current_active_owner_group_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION ir007_private.current_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION ir007_private.current_active_group_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION ir007_private.current_active_owner_group_ids() TO authenticated;

REVOKE ALL ON FUNCTION public.get_group_roster(uuid, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_group_audit_summary(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_group_roster(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_audit_summary(uuid, integer) TO authenticated;

COMMIT;
