-- The legacy v1 `tickets` bucket (002) is public: anyone could read every
-- object and anyone, signed in or not, could add one. Make it private and drop
-- both policies so anon and authenticated can no longer list, read, or insert.
-- Objects are kept: the one-time Bali import reads them with the service role,
-- which Storage RLS does not apply to.
BEGIN;

UPDATE storage.buckets SET public = false WHERE id = 'tickets';

DROP POLICY IF EXISTS "tickets_public_read" ON storage.objects;
DROP POLICY IF EXISTS "tickets_auth_write" ON storage.objects;

COMMIT;
