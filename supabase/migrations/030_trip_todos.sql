-- Shared Trip todo list: every active Member of a Trip sees and edits the same
-- list. Completion is stamped by the database with the caller's own member id.
BEGIN;

CREATE TABLE public.trip_todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE RESTRICT,
  title text NOT NULL CHECK (btrim(title) <> '' AND char_length(title) <= 200),
  done boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  completed_by uuid,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, id),
  CONSTRAINT trip_todos_completion_stamped CHECK (
    (done AND completed_by IS NOT NULL AND completed_at IS NOT NULL)
    OR (NOT done AND completed_by IS NULL AND completed_at IS NULL)
  ),
  -- Creator and completer are always members of the same Trip.
  CONSTRAINT trip_todos_creator_same_group FOREIGN KEY (group_id, created_by)
    REFERENCES public.group_members(group_id, id) ON DELETE RESTRICT,
  CONSTRAINT trip_todos_completer_same_group FOREIGN KEY (group_id, completed_by)
    REFERENCES public.group_members(group_id, id) ON DELETE RESTRICT
);
CREATE INDEX trip_todos_group_created_idx ON public.trip_todos (group_id, created_at);

-- Clients never write completed_by/completed_at (no column grant). This trigger
-- stamps them from the caller's member id when `done` flips, and keeps them
-- unchanged otherwise. SECURITY INVOKER: it runs with the caller's rights.
CREATE FUNCTION trip_private.trip_todos_stamp_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.done IS NOT DISTINCT FROM OLD.done THEN
    NEW.completed_by := OLD.completed_by;
    NEW.completed_at := OLD.completed_at;
  ELSIF NEW.done THEN
    -- Privileged maintenance (no signed-in caller) may supply its own stamp.
    NEW.completed_by := COALESCE(trip_private.current_member_id(NEW.group_id), NEW.completed_by);
    NEW.completed_at := CASE WHEN TG_OP = 'INSERT' THEN COALESCE(NEW.completed_at, now()) ELSE now() END;
  ELSE
    NEW.completed_by := NULL;
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION trip_private.trip_todos_stamp_completion() FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER trip_todos_stamp_completion
  BEFORE INSERT OR UPDATE ON public.trip_todos
  FOR EACH ROW EXECUTE FUNCTION trip_private.trip_todos_stamp_completion();

CREATE TRIGGER trip_todos_set_updated_at
  BEFORE UPDATE ON public.trip_todos
  FOR EACH ROW EXECUTE FUNCTION public.ir002_set_updated_at();

ALTER TABLE public.trip_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_todos FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.trip_todos FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, DELETE ON TABLE public.trip_todos TO authenticated;
-- New todos start open; group_id and created_by are fixed after insert.
GRANT INSERT (group_id, title, created_by) ON TABLE public.trip_todos TO authenticated;
GRANT UPDATE (title, done) ON TABLE public.trip_todos TO authenticated;

CREATE POLICY trip_todos_select_member ON public.trip_todos
  FOR SELECT TO authenticated
  USING (group_id IN (SELECT ir007_private.current_active_group_ids()));

CREATE POLICY trip_todos_insert_member ON public.trip_todos
  FOR INSERT TO authenticated
  WITH CHECK (
    group_id IN (SELECT ir007_private.current_active_group_ids())
    AND created_by = trip_private.current_member_id(group_id)
  );

CREATE POLICY trip_todos_update_member ON public.trip_todos
  FOR UPDATE TO authenticated
  USING (group_id IN (SELECT ir007_private.current_active_group_ids()))
  WITH CHECK (group_id IN (SELECT ir007_private.current_active_group_ids()));

CREATE POLICY trip_todos_delete_member ON public.trip_todos
  FOR DELETE TO authenticated
  USING (group_id IN (SELECT ir007_private.current_active_group_ids()));

-- Realtime delivers inserts/updates only for rows the subscriber can SELECT under
-- RLS. FULL replica identity lets a `group_id=eq.<id>` filter match deletes too
-- (the delete payload still carries only the primary key).
ALTER TABLE public.trip_todos REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_todos;

COMMIT;
