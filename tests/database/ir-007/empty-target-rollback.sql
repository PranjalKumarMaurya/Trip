-- IR-007 empty-target compensating removal.
-- It removes only IR-007 objects after target rows have been removed. It must
-- never restore a legacy permissive policy or browser table privilege.

BEGIN;

DROP FUNCTION IF EXISTS public.get_group_audit_summary(uuid, integer);
DROP FUNCTION IF EXISTS public.get_group_roster(uuid, integer);

DROP POLICY IF EXISTS profiles_update_own_presentation ON public.profiles;
DROP POLICY IF EXISTS groups_select_active_member ON public.groups;
DROP POLICY IF EXISTS group_configurations_select_active_member ON public.group_configurations;

DROP FUNCTION IF EXISTS ir007_private.current_active_owner_group_ids();
DROP FUNCTION IF EXISTS ir007_private.current_active_group_ids();
DROP FUNCTION IF EXISTS ir007_private.current_profile_id();
DROP SCHEMA IF EXISTS ir007_private;

DROP INDEX IF EXISTS public.group_members_active_owner_profile_group_idx;
DROP INDEX IF EXISTS public.group_members_active_profile_group_role_idx;

-- The IR-004 own-profile SELECT policy remains in place. All other affected
-- tables remain RLS-enabled and fail closed; this is deliberately not a
-- restoration of pre-IR-007 permissive legacy policies or grants.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles NO FORCE ROW LEVEL SECURITY;
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

COMMIT;
