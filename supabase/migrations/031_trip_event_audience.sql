-- "Who's on this" for itinerary events. Display-only: every active Member can
-- still read every event; an event with no audience rows is for everyone.
BEGIN;

CREATE TABLE public.trip_event_audience (
  group_id uuid NOT NULL,
  event_id uuid NOT NULL,
  group_member_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, group_member_id),
  -- The event and the person are always in the same Trip as the row.
  CONSTRAINT trip_event_audience_event_same_group FOREIGN KEY (group_id, event_id)
    REFERENCES public.trip_events(group_id, id) ON DELETE CASCADE,
  CONSTRAINT trip_event_audience_member_same_group FOREIGN KEY (group_id, group_member_id)
    REFERENCES public.group_members(group_id, id) ON DELETE RESTRICT
);
CREATE INDEX trip_event_audience_group_idx ON public.trip_event_audience (group_id, event_id);
CREATE INDEX trip_event_audience_member_idx ON public.trip_event_audience (group_id, group_member_id);

ALTER TABLE public.trip_event_audience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_event_audience FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.trip_event_audience FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, DELETE ON TABLE public.trip_event_audience TO authenticated;
GRANT INSERT (group_id, event_id, group_member_id) ON TABLE public.trip_event_audience TO authenticated;

CREATE POLICY trip_event_audience_select_member ON public.trip_event_audience
  FOR SELECT TO authenticated
  USING (group_id IN (SELECT ir007_private.current_active_group_ids()));

CREATE POLICY trip_event_audience_insert_member ON public.trip_event_audience
  FOR INSERT TO authenticated
  WITH CHECK (group_id IN (SELECT ir007_private.current_active_group_ids()));

CREATE POLICY trip_event_audience_delete_member ON public.trip_event_audience
  FOR DELETE TO authenticated
  USING (group_id IN (SELECT ir007_private.current_active_group_ids()));

-- Replace an event's audience in one transaction. SECURITY INVOKER: the
-- caller's RLS applies to every read and write. An empty array means everyone.
CREATE FUNCTION public.set_trip_event_audience(p_group_id uuid, p_event_id uuid, p_member_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.trip_events AS event
    WHERE event.group_id = p_group_id AND event.id = p_event_id
  ) THEN
    RAISE EXCEPTION 'trip_event_not_found' USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM public.trip_event_audience AS audience
  WHERE audience.group_id = p_group_id
    AND audience.event_id = p_event_id
    AND NOT (audience.group_member_id = ANY (COALESCE(p_member_ids, '{}'::uuid[])));

  INSERT INTO public.trip_event_audience (group_id, event_id, group_member_id)
  SELECT DISTINCT p_group_id, p_event_id, wanted.member_id
  FROM unnest(COALESCE(p_member_ids, '{}'::uuid[])) AS wanted(member_id)
  WHERE wanted.member_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.trip_event_audience AS existing
      WHERE existing.event_id = p_event_id AND existing.group_member_id = wanted.member_id
    );
END;
$$;
REVOKE ALL ON FUNCTION public.set_trip_event_audience(uuid, uuid, uuid[]) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_trip_event_audience(uuid, uuid, uuid[]) TO authenticated;

-- FULL replica identity lets `group_id=eq.<id>` Realtime filters match deletes
-- (payloads still carry only the primary key). Also applied to trip_events so the
-- itinerary sees removals made by other members.
ALTER TABLE public.trip_event_audience REPLICA IDENTITY FULL;
ALTER TABLE public.trip_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_event_audience;

COMMIT;
