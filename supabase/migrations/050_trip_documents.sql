-- Private Trip documents (Scan tab): a private Storage bucket whose objects live
-- under `<group_id>/<uuid>/<filename>`, a metadata table, and one RPC that adds
-- a reviewed Event to the itinerary and links the document atomically.
-- Access is always the caller's current active membership of that Trip.
BEGIN;

-- Private bucket. Limits are enforced by Storage on upload.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('trip-documents', 'trip-documents', false, 10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

-- Object policies. The first path segment is the Trip; compare as text so a
-- malformed name in any bucket can never raise a cast error.
CREATE POLICY trip_documents_objects_select_member ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'trip-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT active_group_id::text FROM ir007_private.current_active_group_ids() AS active_group_id)
  );

CREATE POLICY trip_documents_objects_insert_member ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'trip-documents'
    AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[^/]+$'
    AND (storage.foldername(name))[1] IN (
      SELECT active_group_id::text FROM ir007_private.current_active_group_ids() AS active_group_id)
  );

-- No UPDATE policy: objects cannot be overwritten, moved, or renamed.
-- Delete: the uploader, or an Owner of the Trip.
CREATE POLICY trip_documents_objects_delete_uploader_or_owner ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'trip-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT active_group_id::text FROM ir007_private.current_active_group_ids() AS active_group_id)
    AND (
      owner_id = (SELECT auth.uid())::text
      OR (storage.foldername(name))[1] IN (
        SELECT owner_group_id::text FROM ir007_private.current_active_owner_group_ids() AS owner_group_id)
    )
  );

CREATE TABLE public.trip_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE RESTRICT,
  storage_path text NOT NULL UNIQUE,
  file_name text NOT NULL CHECK (btrim(file_name) <> '' AND length(file_name) <= 255),
  mime_type text NOT NULL
    CHECK (mime_type IN ('application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif')),
  size_bytes integer NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
  uploaded_by uuid NOT NULL,
  event_id uuid,
  parse_status text NOT NULL DEFAULT 'pending' CHECK (parse_status IN ('pending', 'parsed', 'failed')),
  extracted jsonb CHECK (extracted IS NULL OR jsonb_typeof(extracted) = 'object'),
  parse_error text CHECK (parse_error IS NULL OR parse_error ~ '^[a-z_]{1,64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, id),
  -- The object always lives in this Trip's folder, so metadata cannot retarget it.
  CONSTRAINT trip_documents_path_in_group CHECK (
    split_part(storage_path, '/', 1) = group_id::text
    AND storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[^/]+$'
  ),
  CONSTRAINT trip_documents_uploader_same_group FOREIGN KEY (group_id, uploaded_by)
    REFERENCES public.group_members(group_id, id) ON DELETE RESTRICT,
  -- A linked Event is always in the same Trip; deleting the Event only unlinks it.
  CONSTRAINT trip_documents_event_same_group FOREIGN KEY (group_id, event_id)
    REFERENCES public.trip_events(group_id, id) ON DELETE SET NULL (event_id)
);
CREATE INDEX trip_documents_group_created_idx ON public.trip_documents (group_id, created_at DESC);
CREATE INDEX trip_documents_group_event_idx ON public.trip_documents (group_id, event_id) WHERE event_id IS NOT NULL;

CREATE TRIGGER trip_documents_set_updated_at
  BEFORE UPDATE ON public.trip_documents
  FOR EACH ROW EXECUTE FUNCTION public.ir002_set_updated_at();

ALTER TABLE public.trip_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_documents FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.trip_documents FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, DELETE ON TABLE public.trip_documents TO authenticated;
-- Trip, object, file facts, and uploader are fixed after insert.
GRANT UPDATE (event_id, parse_status, extracted, parse_error) ON TABLE public.trip_documents TO authenticated;

CREATE POLICY trip_documents_select_member ON public.trip_documents
  FOR SELECT TO authenticated
  USING (group_id IN (SELECT ir007_private.current_active_group_ids()));

-- Metadata may only describe an object the caller uploaded into this Trip.
CREATE POLICY trip_documents_insert_uploader ON public.trip_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    group_id IN (SELECT ir007_private.current_active_group_ids())
    AND uploaded_by = trip_private.current_member_id(group_id)
    AND EXISTS (
      SELECT 1 FROM storage.objects AS object
      WHERE object.bucket_id = 'trip-documents'
        AND object.name = storage_path
        AND object.owner_id = (SELECT auth.uid())::text
    )
  );

CREATE POLICY trip_documents_update_member ON public.trip_documents
  FOR UPDATE TO authenticated
  USING (group_id IN (SELECT ir007_private.current_active_group_ids()))
  WITH CHECK (group_id IN (SELECT ir007_private.current_active_group_ids()));

CREATE POLICY trip_documents_delete_uploader_or_owner ON public.trip_documents
  FOR DELETE TO authenticated
  USING (
    group_id IN (SELECT ir007_private.current_active_group_ids())
    AND (
      uploaded_by = trip_private.current_member_id(group_id)
      OR group_id IN (SELECT ir007_private.current_active_owner_group_ids())
    )
  );

-- Add a reviewed Event to the itinerary and link the document in one
-- transaction. SECURITY INVOKER: every read and write runs under the caller's RLS.
CREATE FUNCTION public.create_event_from_document(
  p_document_id uuid,
  p_event_type text,
  p_title text,
  p_starts_at timestamptz,
  p_ends_at timestamptz DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_location_to text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_dep_code text DEFAULT NULL,
  p_arr_code text DEFAULT NULL,
  p_flight_no text DEFAULT NULL,
  p_airline text DEFAULT NULL,
  p_terminal text DEFAULT NULL,
  p_booking_ref text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  v_group_id uuid;
  v_event_id uuid;
BEGIN
  SELECT document.group_id INTO v_group_id
  FROM public.trip_documents AS document
  WHERE document.id = p_document_id AND document.event_id IS NULL
  FOR UPDATE;
  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'document_unavailable' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.trip_events (group_id, event_type, title, starts_at, ends_at, location, location_to,
    notes, dep_code, arr_code, flight_no, airline, terminal, booking_ref, created_by)
  VALUES (v_group_id, p_event_type, btrim(p_title), p_starts_at, p_ends_at, p_location, p_location_to,
    p_notes, p_dep_code, p_arr_code, p_flight_no, p_airline, p_terminal, p_booking_ref,
    trip_private.current_member_id(v_group_id))
  RETURNING id INTO v_event_id;

  UPDATE public.trip_documents SET event_id = v_event_id WHERE id = p_document_id;
  RETURN v_event_id;
END;
$$;
REVOKE ALL ON FUNCTION public.create_event_from_document(uuid, text, text, timestamptz, timestamptz,
  text, text, text, text, text, text, text, text, text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.create_event_from_document(uuid, text, text, timestamptz, timestamptz,
  text, text, text, text, text, text, text, text, text) TO authenticated;

COMMIT;
