-- IR-004 DBM-003: Profile/Auth linkage and own-Profile privacy.
-- Authorised by docs/implementation-execution/authorisations/IR-004-authorisation.md.

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN auth_user_id UUID;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_auth_user_id_key UNIQUE (auth_user_id),
  ADD CONSTRAINT profiles_auth_user_id_fkey
    FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE RESTRICT;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own_linked_profile
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = auth_user_id);

CREATE FUNCTION public.ir004_create_profile_for_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  INSERT INTO public.profiles (auth_user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(btrim(NEW.raw_user_meta_data ->> 'display_name'), ''), 'Account')
  )
  ON CONFLICT (auth_user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.ir004_create_profile_for_auth_user() FROM PUBLIC;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.ir004_create_profile_for_auth_user();

INSERT INTO public.profiles (auth_user_id, display_name)
SELECT
  auth_user.id,
  COALESCE(NULLIF(btrim(auth_user.raw_user_meta_data ->> 'display_name'), ''), 'Account')
FROM auth.users AS auth_user
ON CONFLICT (auth_user_id) DO NOTHING;

COMMIT;
