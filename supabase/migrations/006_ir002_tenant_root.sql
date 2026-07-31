-- IR-002 DBM-001: Tenant root.
-- Authorised by docs/implementation-execution/authorisations/IR-002-authorisation.md.

CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL CHECK (btrim(display_name) <> ''),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE RESTRICT,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, id)
);

CREATE UNIQUE INDEX group_members_group_profile_linked_key
  ON public.group_members (group_id, profile_id)
  WHERE profile_id IS NOT NULL;

CREATE INDEX group_members_group_id_idx ON public.group_members (group_id);
CREATE INDEX group_members_profile_id_idx
  ON public.group_members (profile_id)
  WHERE profile_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.ir002_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER groups_ir002_set_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.ir002_set_updated_at();

CREATE TRIGGER profiles_ir002_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.ir002_set_updated_at();

CREATE TRIGGER group_members_ir002_set_updated_at
  BEFORE UPDATE ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.ir002_set_updated_at();
