-- Profile photos: a private `avatars` bucket. Each person writes only their own
-- folder `<auth uid>/<uuid>.<jpg|png|webp>`; they and the people they share an
-- active Trip with may read it (through short-lived signed URLs). Nobody else,
-- including anon, can read, list, or overwrite anything.
BEGIN;

-- Private bucket; Storage enforces the size and type limits on upload. The app
-- resizes photos to a small JPEG before uploading, far below 2 MB.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', false, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- True when the folder is the caller's own, or belongs to someone who is an
-- active member of a Trip the caller is active in. Owned by `postgres` (like
-- current_member_id) so the policy can read memberships clients cannot.
CREATE FUNCTION trip_private.avatar_folder_visible(p_folder text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_owner uuid;
BEGIN
  IF p_folder IS NULL
    OR p_folder !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN false;
  END IF;
  v_owner := p_folder::uuid;
  IF v_owner = auth.uid() THEN
    RETURN true;
  END IF;
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    JOIN public.group_members AS member ON member.profile_id = profile.id
    WHERE profile.auth_user_id = v_owner
      AND member.status = 'active'
      AND member.group_id IN (SELECT ir007_private.current_active_group_ids())
  );
END;
$$;
REVOKE ALL ON FUNCTION trip_private.avatar_folder_visible(text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION trip_private.avatar_folder_visible(text) TO authenticated;

-- A new photo goes into the caller's own folder under a fresh uuid name, and a
-- person keeps at most three objects (the app replaces, then removes the old).
CREATE FUNCTION trip_private.avatar_upload_allowed(p_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT coalesce(
    p_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](jpg|png|webp)$'
    AND split_part(p_name, '/', 1) = (SELECT auth.uid())::text
    AND (
      SELECT count(*)
      FROM storage.objects AS object
      WHERE object.bucket_id = 'avatars'
        AND object.name LIKE split_part(p_name, '/', 1) || '/%'
    ) < 3,
    false);
$$;
REVOKE ALL ON FUNCTION trip_private.avatar_upload_allowed(text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION trip_private.avatar_upload_allowed(text) TO authenticated;

CREATE POLICY avatars_objects_select_self_or_crew ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND trip_private.avatar_folder_visible((storage.foldername(name))[1]));

CREATE POLICY avatars_objects_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND trip_private.avatar_upload_allowed(name));

-- No UPDATE policy: a photo is never overwritten or moved, only replaced.
CREATE POLICY avatars_objects_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

-- A profile can point only at a photo in its owner's own folder.
ALTER TABLE public.profiles ADD CONSTRAINT profiles_avatar_path_own_folder CHECK (
  avatar_path IS NULL OR (
    avatar_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](jpg|png|webp)$'
    AND split_part(avatar_path, '/', 1) = auth_user_id::text
  )
);

COMMIT;
