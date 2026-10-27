-- Journey-only Auth/Profile grant correction candidate. Not an IR-004/007 exit.
-- AuthBoundary filters its own RLS-visible Profile by auth_user_id.
BEGIN;
GRANT SELECT (auth_user_id) ON TABLE public.profiles TO authenticated;
COMMIT;
