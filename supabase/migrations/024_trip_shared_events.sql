-- Shared base for the Trip feature streams: the caller's member id helper and
-- the Group-scoped itinerary table used by both the Trip and Scan tabs.
BEGIN;

-- The caller's active Participant identity in one Trip, or NULL. Owned by
-- `postgres` so policies can use it without granting group_members broadly.
CREATE FUNCTION trip_private.current_member_id(p_group_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT member.id
  FROM public.group_members AS member
  JOIN public.groups AS trip_group ON trip_group.id = member.group_id
  WHERE member.group_id = p_group_id
    AND member.profile_id = (SELECT ir007_private.current_profile_id())
    AND member.status = 'active'
    AND trip_group.archived_at IS NULL;
$$;
REVOKE ALL ON FUNCTION trip_private.current_member_id(uuid) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION trip_private.current_member_id(uuid) TO authenticated;

CREATE TABLE public.trip_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE RESTRICT,
  event_type text NOT NULL
    CHECK (event_type IN ('flight', 'hotel', 'ferry', 'activity', 'food', 'transport', 'other')),
  title text NOT NULL CHECK (btrim(title) <> ''),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  location text,
  location_to text,
  map_url text,
  notes text,
  dep_code text,
  arr_code text,
  flight_no text,
  airline text,
  terminal text,
  booking_ref text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, id),
  CONSTRAINT trip_events_end_after_start CHECK (ends_at IS NULL OR ends_at >= starts_at),
  -- The creator is always a member of the same Trip.
  CONSTRAINT trip_events_creator_same_group FOREIGN KEY (group_id, created_by)
    REFERENCES public.group_members(group_id, id) ON DELETE RESTRICT
);
CREATE INDEX trip_events_group_starts_idx ON public.trip_events (group_id, starts_at);

CREATE TRIGGER trip_events_set_updated_at
  BEFORE UPDATE ON public.trip_events
  FOR EACH ROW EXECUTE FUNCTION public.ir002_set_updated_at();

ALTER TABLE public.trip_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_events FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.trip_events FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, DELETE ON TABLE public.trip_events TO authenticated;
-- group_id and created_by are fixed after insert: an Event cannot move Trips.
GRANT UPDATE (event_type, title, starts_at, ends_at, location, location_to, map_url, notes,
  dep_code, arr_code, flight_no, airline, terminal, booking_ref)
  ON TABLE public.trip_events TO authenticated;

CREATE POLICY trip_events_select_member ON public.trip_events
  FOR SELECT TO authenticated
  USING (group_id IN (SELECT ir007_private.current_active_group_ids()));

CREATE POLICY trip_events_insert_member ON public.trip_events
  FOR INSERT TO authenticated
  WITH CHECK (
    group_id IN (SELECT ir007_private.current_active_group_ids())
    AND created_by = trip_private.current_member_id(group_id)
  );

CREATE POLICY trip_events_update_member ON public.trip_events
  FOR UPDATE TO authenticated
  USING (group_id IN (SELECT ir007_private.current_active_group_ids()))
  WITH CHECK (group_id IN (SELECT ir007_private.current_active_group_ids()));

CREATE POLICY trip_events_delete_member ON public.trip_events
  FOR DELETE TO authenticated
  USING (group_id IN (SELECT ir007_private.current_active_group_ids()));

-- Realtime delivers changes only for rows the subscriber can SELECT under RLS.
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_events;

COMMIT;
