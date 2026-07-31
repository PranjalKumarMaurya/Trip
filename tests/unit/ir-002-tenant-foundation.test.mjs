import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const tenantRoot = readFileSync('supabase/migrations/006_ir002_tenant_root.sql', 'utf8')
const configuration = readFileSync('supabase/migrations/007_ir002_configuration_archive_audit.sql', 'utf8')

test('IR-002 fixes the authorised tenant and Participant foundations', () => {
  assert.match(tenantRoot, /CREATE TABLE public\.groups/)
  assert.match(tenantRoot, /CREATE TABLE public\.profiles/)
  assert.match(tenantRoot, /CREATE TABLE public\.group_members/)
  assert.match(tenantRoot, /UNIQUE \(group_id, id\)/)
  assert.match(tenantRoot, /WHERE profile_id IS NOT NULL/)
  assert.doesNotMatch(tenantRoot, /auth_user_id/)
  assert.doesNotMatch(tenantRoot, /CREATE TABLE public\.participants/)
})

test('IR-002 fixes the authorised configuration, archive, and audit contract', () => {
  assert.match(configuration, /CREATE TABLE public\.group_configurations/)
  assert.match(configuration, /CREATE FUNCTION public\.is_valid_iana_timezone/)
  assert.match(configuration, /CREATE TABLE public\.iso_4217_currency_codes/)
  assert.match(configuration, /ADD COLUMN archived_at TIMESTAMPTZ/)
  assert.match(configuration, /CREATE TABLE public\.group_audit_events/)
  assert.match(configuration, /REFERENCES public\.group_members\(group_id, id\)/)
})
