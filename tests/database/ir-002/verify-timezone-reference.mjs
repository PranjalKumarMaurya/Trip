import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const projectId = 'bachelor-trip-app-tzref-verify'
const container = `supabase_db_${projectId}`
const port = '58122'
const read = (path) => readFileSync(resolve(root, path), 'utf8')
const digest = (value) => createHash('sha256').update(value).digest('hex')
const artifact = read('supabase/reference-data/iana-timezone-reference/2026e.txt')
const manifest = JSON.parse(read('supabase/reference-data/iana-timezone-reference/2026e.manifest.json'))
const migration011 = read('supabase/migrations/011_ir002_timezone_reference.sql')
let workdir = ''
let started = false

function run(name, args, { input, fail = false, admin = false } = {}) {
  const result = spawnSync(name, args, {
    cwd: root, encoding: 'utf8', input,
    env: admin ? process.env : { ...process.env, PGPASSWORD: 'postgres' },
  })
  if (fail) {
    assert.notEqual(result.status, 0, `${name}-expected-failure`)
    return `${result.stdout}\n${result.stderr}`
  }
  if (result.error || result.status !== 0) throw new Error(`${name}-failed`)
  return result.stdout.trim()
}

function assertClean() {
  const names = run('docker', ['ps', '--all', '--format', '{{.Names}}']).split('\n').filter(Boolean)
  assert.equal(names.some((name) => name.endsWith(`_${projectId}`)), false, 'timezone-stack-not-clean')
}

function psql(sql, options = {}) {
  return run('psql', [
    '--no-psqlrc', '--quiet', '--tuples-only', '--no-align', '--set', 'ON_ERROR_STOP=1',
    '--host', '127.0.0.1', '--port', port, '--username', 'postgres', '--dbname', 'postgres', '--command', sql,
  ], options)
}

function adminSql(sql, options = {}) {
  return run('docker', [
    'exec', '--interactive', '--user', 'postgres', container, 'psql', '--no-psqlrc', '--quiet',
    '--set', 'ON_ERROR_STOP=1', '--username', 'supabase_admin', '--dbname', 'postgres',
  ], { ...options, input: sql, admin: true })
}

function start() {
  assertClean()
  workdir = mkdtempSync(resolve(tmpdir(), 'trip-tzref-verify-'))
  mkdirSync(resolve(workdir, 'supabase'))
  writeFileSync(resolve(workdir, 'supabase/config.toml'), `project_id = "${projectId}"
[api]
enabled = true
port = 58121
[db]
port = ${port}
[db.pooler]
enabled = false
port = 58129
[realtime]
enabled = false
[studio]
enabled = false
port = 58123
[inbucket]
enabled = false
port = 58124
smtp_port = 58125
[storage]
enabled = true
[auth]
enabled = true
[edge_runtime]
enabled = false
[analytics]
enabled = false
`)
  started = true
  run('npx', ['--no-install', 'supabase', 'start', '--workdir', workdir])
}

function stop() {
  if (started) {
    run('npx', ['--no-install', 'supabase', 'stop', '--workdir', workdir, '--project-id', projectId, '--no-backup'])
    started = false
  }
  if (workdir) rmSync(workdir, { recursive: true, force: true })
  workdir = ''
  assertClean()
}

const laterPrefix = [
  '002_tickets_bucket.sql', '003_gmap_url.sql', '004_paid_by_splits.sql', '005_todos.sql',
  '006_ir002_tenant_root.sql', '007_ir002_configuration_archive_audit.sql',
  '008_ir004_profile_auth.sql', '009_ir007_base_rls_ownership.sql',
]

try {
  assert.equal(digest(artifact), manifest.artifact_sha256)
  assert.equal(artifact.split('\n').length - 1, manifest.row_count)
  assert.equal(manifest.row_count, 553)
  start()
  psql(read('supabase/migrations/001_initial.sql'))
  adminSql(read('tests/database/ir-002/platform-storage-baseline.sql'))
  for (const file of laterPrefix) psql(read(`supabase/migrations/${file}`))
  adminSql(read('supabase/migrations/010_ir003_atomic_group_bootstrap.sql'))

  const body = migration011.replace(/^BEGIN;\s*/u, '').replace(/\s*COMMIT;\s*$/u, '')
  assert.notEqual(body, migration011, 'timezone-migration-framing')
  adminSql(`BEGIN;\n${body}\nSELECT 1 / 0; COMMIT;`, { fail: true })
  assert.equal(psql("SELECT to_regclass('ir002_private.iana_timezone_reference') IS NULL"), 't')

  adminSql(migration011)
  const databaseCollation = psql('SELECT datcollate FROM pg_database WHERE datname=current_database()')
  assert.equal(psql('SELECT count(*) FROM ir002_private.iana_timezone_reference'), '553')
  const actual = psql('COPY (SELECT name FROM ir002_private.iana_timezone_reference ORDER BY name COLLATE "C") TO STDOUT') + '\n'
  assert.equal(actual, artifact, 'timezone-reference-exact-set')
  assert.equal(psql("SELECT a.attcollation::regcollation FROM pg_attribute a WHERE a.attrelid='ir002_private.iana_timezone_reference'::regclass AND a.attname='name'"), '"C"')
  assert.equal(psql("SELECT i.indcollation[0]::regcollation FROM pg_index i WHERE i.indrelid='ir002_private.iana_timezone_reference'::regclass AND i.indisprimary"), '"C"')
  assert.equal(psql("SELECT public.is_valid_iana_timezone('Asia/Kolkata'), public.is_valid_iana_timezone('asia/kolkata'), public.is_valid_iana_timezone('Asia/Calcutta'), public.is_valid_iana_timezone('Mars/Olympus')"), 't|f|t|f')
  assert.equal(psql('SELECT public.is_valid_iana_timezone(NULL) IS NULL'), 't')
  assert.equal(psql("SELECT has_schema_privilege('authenticated','ir002_private','USAGE'), has_table_privilege('authenticated','ir002_private.iana_timezone_reference','SELECT'), has_table_privilege('service_role','ir002_private.iana_timezone_reference','SELECT'), has_function_privilege('authenticated','public.is_valid_iana_timezone(text)','EXECUTE')"), 'f|f|f|t')
  assert.equal(psql("SELECT p.prosecdef, p.proowner::regrole, p.proconfig FROM pg_proc p WHERE p.oid='public.is_valid_iana_timezone(text)'::regprocedure"), 't|ir002_timezone_validator|{search_path=pg_catalog}')
  assert.equal(psql("SELECT n.nspowner::regrole FROM pg_namespace n WHERE n.nspname='ir002_private'"), 'ir002_timezone_maintenance_owner')
  assert.equal(psql("SELECT c.relowner::regrole FROM pg_class c WHERE c.oid='ir002_private.iana_timezone_reference'::regclass"), 'ir002_timezone_maintenance_owner')
  assert.equal(psql("SELECT rolcanlogin, rolinherit, rolsuper, rolcreaterole, rolcreatedb, rolreplication, rolbypassrls FROM pg_roles WHERE rolname='ir002_timezone_validator'"), 'f|f|f|f|f|f|f')
  assert.equal(psql("SELECT rolcanlogin, rolinherit, rolsuper, rolcreaterole, rolcreatedb, rolreplication, rolbypassrls FROM pg_roles WHERE rolname='ir002_timezone_maintenance_owner'"), 'f|f|f|f|f|f|f')
  assert.equal(psql("SELECT count(*) FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.roleid WHERE r.rolname IN ('ir002_timezone_validator','ir002_timezone_maintenance_owner')"), '0')
  assert.match(psql("SET ROLE authenticated; SELECT name FROM ir002_private.iana_timezone_reference LIMIT 1", { fail: true }), /permission denied/u)
  assert.match(psql("SET ROLE service_role; SELECT name FROM ir002_private.iana_timezone_reference LIMIT 1", { fail: true }), /permission denied/u)
  assert.match(psql("SET ROLE authenticated; INSERT INTO ir002_private.iana_timezone_reference(name) VALUES ('Asia/Fake')", { fail: true }), /permission denied/u)
  const drift = psql(`WITH approved AS (SELECT name COLLATE "C" AS name FROM ir002_private.iana_timezone_reference), platform AS (SELECT name COLLATE "C" AS name FROM pg_catalog.pg_timezone_names WHERE name ~ '^[A-Za-z][A-Za-z0-9_+\\-]*(?:/[A-Za-z0-9_+\\-]+)+$') SELECT (SELECT count(*) FROM (SELECT name FROM approved EXCEPT SELECT name FROM platform) a), (SELECT count(*) FROM (SELECT name FROM platform EXCEPT SELECT name FROM approved) b)`)
  const [approvedMissing, platformAdditions] = drift.split('|').map(Number)
  assert.equal(approvedMissing, 0, 'timezone-platform-removal')
  const blocked = adminSql(`BEGIN; UPDATE ir002_private.iana_timezone_reference_control SET state='blocked'; DO $probe$ BEGIN PERFORM public.is_valid_iana_timezone('Asia/Kolkata'); RAISE EXCEPTION 'unexpected-success'; EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM <> 'timezone_reference_unavailable' THEN RAISE; END IF; END $probe$; ROLLBACK;`)
  void blocked
  adminSql(`BEGIN; DELETE FROM ir002_private.iana_timezone_reference_control; DO $probe$ BEGIN PERFORM public.is_valid_iana_timezone('Asia/Kolkata'); RAISE EXCEPTION 'unexpected-success'; EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM <> 'timezone_reference_unavailable' THEN RAISE; END IF; END $probe$; ROLLBACK;`)
  adminSql(`BEGIN; INSERT INTO public.groups DEFAULT VALUES; DO $probe$ DECLARE group_id uuid; rejected boolean := false; BEGIN SELECT id INTO group_id FROM public.groups LIMIT 1; BEGIN INSERT INTO public.group_configurations(group_id,trip_name,destination,start_date,end_date,timezone,accounting_currency) VALUES(group_id,'Probe','Probe','2026-10-01','2026-10-02','asia/kolkata','INR'); EXCEPTION WHEN check_violation THEN rejected := true; END; IF NOT rejected THEN RAISE EXCEPTION 'invalid-timezone-accepted'; END IF; END $probe$; ROLLBACK;`)
  assert.equal(psql("SELECT public.is_valid_iana_timezone('Asia/Kolkata')"), 't')
  stop()
  console.log(JSON.stringify({ capability: 'timezone-reference-local', result: 'passed', datasetVersion: '2026e', rows: 553, databaseCollation, artifactSha256: manifest.artifact_sha256, migrationSha256: digest(migration011), approvedMissing, platformAdditions, cleanup: 'passed' }))
} catch (error) {
  try { stop() } catch { /* preserve first failure */ }
  const reason = error instanceof Error && /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(error.message) ? error.message : 'timezone-reference-verification-failed'
  console.error(JSON.stringify({ capability: 'timezone-reference-local', result: 'failed-safely', reason }))
  process.exitCode = 1
}
