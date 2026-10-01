import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url))
const artifact = read('supabase/reference-data/iana-timezone-reference/2026e.txt')
const manifest = JSON.parse(read('supabase/reference-data/iana-timezone-reference/2026e.manifest.json'))
const migration = read('supabase/migrations/011_ir002_timezone_reference.sql').toString('utf8')
const digest = (content) => createHash('sha256').update(content).digest('hex')

test('reviewed IANA artifact is canonical and migration 011 materializes exactly that set', () => {
  const names = artifact.toString('utf8').split('\n')
  assert.equal(names.pop(), '')
  assert.equal(names.length, manifest.row_count)
  assert.equal(names.length, new Set(names).size)
  assert.deepEqual(names, [...names].sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b))))
  assert.ok(names.every((name) => /^[A-Za-z][A-Za-z0-9_+\-]*(?:\/[A-Za-z0-9_+\-]+)+$/u.test(name)))
  assert.equal(digest(artifact), manifest.artifact_sha256)
  assert.equal(manifest.canonical_name_count + manifest.alias_name_count, names.length)

  const insert = migration.match(/INSERT INTO ir002_private\.iana_timezone_reference \(name\) VALUES\n([\s\S]*?);/u)?.[1]
  assert.ok(insert, 'missing static reference insertion')
  const materialized = [...insert.matchAll(/\('([^']+)'\)/gu)].map((match) => match[1])
  assert.deepEqual(materialized, names)
  assert.match(migration, /name text COLLATE "C" NOT NULL PRIMARY KEY/u)
  assert.match(migration, /reference\.name = candidate COLLATE "C"/u)
})
