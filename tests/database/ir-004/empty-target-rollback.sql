-- IR-004 DBM-003 empty-target compensating removal.
-- Run only after all target Profile rows and fixture Auth users are removed.

DROP TRIGGER on_auth_user_created ON auth.users;
DROP FUNCTION public.ir004_create_profile_for_auth_user();
DROP POLICY profiles_select_own_linked_profile ON public.profiles;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DROP CONSTRAINT profiles_auth_user_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT profiles_auth_user_id_key;
ALTER TABLE public.profiles DROP COLUMN auth_user_id;
