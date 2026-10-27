-- Daily cap on AI document parsing. parse-document calls claim_document_parse()
-- as the caller right before it would call the model; each successful claim is
-- one row here. Rows are stamped by the server (who, when) and nobody can change
-- or delete them, so a client can only ever make its own count go up.
BEGIN;

CREATE TABLE public.trip_parse_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE RESTRICT,
  group_member_id uuid NOT NULL,
  -- The person, so the per-person cap spans all of their Trips.
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  document_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trip_parse_usage_member_same_group FOREIGN KEY (group_id, group_member_id)
    REFERENCES public.group_members(group_id, id) ON DELETE RESTRICT,
  -- Deleting the document keeps the usage row.
  CONSTRAINT trip_parse_usage_document_same_group FOREIGN KEY (group_id, document_id)
    REFERENCES public.trip_documents(group_id, id) ON DELETE SET NULL (document_id)
);
CREATE INDEX trip_parse_usage_group_time_idx ON public.trip_parse_usage (group_id, created_at);
CREATE INDEX trip_parse_usage_profile_time_idx ON public.trip_parse_usage (profile_id, created_at);

ALTER TABLE public.trip_parse_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_parse_usage FORCE ROW LEVEL SECURITY;

-- Insert-only: no UPDATE or DELETE grant (and no policy) for anyone; `id` and
-- `created_at` always come from their defaults.
REVOKE ALL ON TABLE public.trip_parse_usage FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.trip_parse_usage TO authenticated;
GRANT INSERT (group_id, group_member_id, profile_id, document_id) ON TABLE public.trip_parse_usage TO authenticated;

-- Members see their Trip's usage; everyone sees their own, even after leaving.
CREATE POLICY trip_parse_usage_select_member_or_self ON public.trip_parse_usage
  FOR SELECT TO authenticated
  USING (
    group_id IN (SELECT ir007_private.current_active_group_ids())
    OR profile_id = (SELECT ir007_private.current_profile_id())
  );

-- Only as yourself, as an active member of that Trip.
CREATE POLICY trip_parse_usage_insert_self ON public.trip_parse_usage
  FOR INSERT TO authenticated
  WITH CHECK (
    group_id IN (SELECT ir007_private.current_active_group_ids())
    AND group_member_id = trip_private.current_member_id(group_id)
    AND profile_id = (SELECT ir007_private.current_profile_id())
  );

-- Count the caller's and the Trip's parses in the last 24 hours and, if both
-- are under the limits, record one more. Returns 'claimed', 'member_limit', or
-- 'trip_limit'. SECURITY INVOKER: the caller's RLS applies throughout. The
-- limits come from the Edge Function; a client calling this directly can only
-- add rows against itself. Advisory locks (person, then Trip) serialise claims
-- so concurrent parses cannot both slip under a limit.
CREATE FUNCTION public.claim_document_parse(p_document_id uuid, p_member_limit integer, p_trip_limit integer)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  v_group_id uuid;
  v_member_id uuid;
  v_profile_id uuid;
  v_since timestamptz;
BEGIN
  IF p_member_limit IS NULL OR p_trip_limit IS NULL OR p_member_limit < 0 OR p_trip_limit < 0 THEN
    RAISE EXCEPTION 'invalid_request' USING ERRCODE = '22023';
  END IF;

  SELECT document.group_id INTO v_group_id
  FROM public.trip_documents AS document
  WHERE document.id = p_document_id;
  v_member_id := trip_private.current_member_id(v_group_id);
  -- The caller's own profile row (its RLS); ir007_private is not callable by name here.
  SELECT profile.id INTO v_profile_id
  FROM public.profiles AS profile
  WHERE profile.auth_user_id = trip_private.auth_uid();
  IF v_group_id IS NULL OR v_member_id IS NULL OR v_profile_id IS NULL THEN
    RAISE EXCEPTION 'document_unavailable' USING ERRCODE = 'P0002';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('trip_parse_usage:profile:' || v_profile_id::text, 0));
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('trip_parse_usage:group:' || v_group_id::text, 0));
  -- clock_timestamp(): the transaction may have waited for the locks.
  v_since := pg_catalog.clock_timestamp() - interval '24 hours';

  IF (SELECT count(*) FROM public.trip_parse_usage AS usage
      WHERE usage.profile_id = v_profile_id AND usage.created_at > v_since) >= p_member_limit THEN
    RETURN 'member_limit';
  END IF;
  IF (SELECT count(*) FROM public.trip_parse_usage AS usage
      WHERE usage.group_id = v_group_id AND usage.created_at > v_since) >= p_trip_limit THEN
    RETURN 'trip_limit';
  END IF;

  INSERT INTO public.trip_parse_usage (group_id, group_member_id, profile_id, document_id)
  VALUES (v_group_id, v_member_id, v_profile_id, p_document_id);
  RETURN 'claimed';
END;
$$;
REVOKE ALL ON FUNCTION public.claim_document_parse(uuid, integer, integer) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.claim_document_parse(uuid, integer, integer) TO authenticated;

COMMIT;
