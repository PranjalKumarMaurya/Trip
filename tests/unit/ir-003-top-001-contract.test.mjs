import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const migration = readFileSync('supabase/migrations/010_ir003_atomic_group_bootstrap.sql', 'utf8')

test('IR-003 applies the approved audit request-id forward correction only in migration 010', () => {
  assert.match(migration, /ALTER TABLE public\.group_audit_events\s+DROP CONSTRAINT group_audit_events_request_id_key;/u)
  assert.match(migration, /CREATE INDEX group_audit_events_request_id_idx\s+ON public\.group_audit_events \(request_id\);/u)
  assert.doesNotMatch(migration, /CREATE UNIQUE INDEX group_audit_events_request_id_idx/u)
  assert.match(migration, /PRIMARY KEY \(operation, actor_profile_id, request_id\)/u)
})

test('IR-003 preserves the sole public TOP-001 wrapper and its non-callable helper', () => {
  assert.match(migration, /CREATE FUNCTION public\.bootstrap_group\(\s+group_request jsonb,\s+configuration_request jsonb,\s+request_id uuid\s+\)[\s\S]*?RETURNS TABLE \(\s+outcome text,\s+group_id uuid,\s+request_id uuid\s+\)/u)
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.ir003_bootstrap_group_impl\(jsonb, jsonb, uuid\)\s+FROM PUBLIC, anon, authenticated, service_role;/u)
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.bootstrap_group\(jsonb, jsonb, uuid\)\s+TO authenticated;/u)
})
