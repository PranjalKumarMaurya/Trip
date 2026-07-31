-- Local Supabase platform baseline required before replaying legacy migration
-- 002_tickets_bucket.sql. This is not IR-002 Storage work: it creates only the
-- minimal platform catalog shape consumed by the unchanged legacy migration.
CREATE SCHEMA IF NOT EXISTS storage;

CREATE TABLE IF NOT EXISTS storage.buckets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  public BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS storage.objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id TEXT NOT NULL
);
