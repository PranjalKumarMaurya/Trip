import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Disposable live API/browser candidate. Not an IR-003, IR-005, or release exit.
const root = fileURLToPath(new URL('../..', import.meta.url))
const cli = resolve(root, 'node_modules/.bin/supabase')
const playwright = resolve(root, 'node_modules/.bin/playwright')
const projectId = 'bachelor-trip-app-journey-live'
const container = `supabase_db_${projectId}`
const port = '58522'
const verifyEmail = process.env.TRIP_VERIFY_EMAIL === '1'
let workdir = ''
let started = false

function run(name, args, { input, env = process.env, label = 'command' } = {}) {
  const result = spawnSync(name, args, { cwd: root, encoding: 'utf8', input, env })
  if (result.error || result.status !== 0) {
    if (label === 'live-browser-journey') {
      const diagnostic = `${result.stdout}\n${result.stderr}`.match(/Error: ([a-z0-9-]+)/u)?.[1]
      if (diagnostic) console.error(diagnostic)
    }
    throw new Error(`${label}-failed`)
  }
  return result.stdout
}

function assertClean() {
  const names = run('docker', ['ps', '--all', '--format', '{{.Names}}'], { label: 'docker-list' })
  if (names.split('\n').some((name) => name === container)) throw new Error('journey-stack-already-exists')
}

function psql(sql, label) {
  run('psql', ['--no-psqlrc', '--quiet', '--set', 'ON_ERROR_STOP=1', '--host', '127.0.0.1',
    '--port', port, '--username', 'postgres', '--dbname', 'postgres'], {
    input: sql, env: { ...process.env, PGPASSWORD: 'postgres' }, label,
  })
}

function adminSql(sql, label) {
  run('docker', ['exec', '--interactive', '--user', 'postgres', container, 'psql',
    '--no-psqlrc', '--quiet', '--set', 'ON_ERROR_STOP=1', '--username', 'supabase_admin', '--dbname', 'postgres'], {
    input: sql, label,
  })
}

function start() {
  assertClean()
  workdir = mkdtempSync(resolve(tmpdir(), 'trip-live-journey-'))
  mkdirSync(resolve(workdir, 'supabase'))
  writeFileSync(resolve(workdir, 'supabase/config.toml'), `project_id = "${projectId}"
[api]
enabled = true
port = 58521
[db]
port = ${port}
[db.pooler]
enabled = false
port = 58529
[realtime]
enabled = false
[studio]
enabled = false
port = 58523
[inbucket]
enabled = ${verifyEmail}
port = 58524
smtp_port = 58525
[storage]
enabled = true
[auth]
enabled = true
site_url = "http://127.0.0.1:4173"
[auth.email]
enable_confirmations = ${verifyEmail}
[edge_runtime]
enabled = false
[analytics]
enabled = false
`)
  started = true
  run(cli, ['start', '--workdir', workdir], { label: 'stack-start' })
}

function migrate() {
  const read = (name) => readFileSync(resolve(root, 'supabase/migrations', name), 'utf8')
  psql(read('001_initial.sql'), 'migration-001')
  adminSql(readFileSync(resolve(root, 'tests/database/ir-002/platform-storage-baseline.sql'), 'utf8'), 'storage-baseline')
  const ordinary = [
    '002_tickets_bucket.sql', '003_gmap_url.sql', '004_paid_by_splits.sql',
    '005_todos.sql', '006_ir002_tenant_root.sql',
    '007_ir002_configuration_archive_audit.sql', '008_ir004_profile_auth.sql',
    '009_ir007_base_rls_ownership.sql',
  ]
  for (const name of ordinary) psql(read(name), name)
  const candidates = [
    '010_ir003_atomic_group_bootstrap.sql', '011_ir002_timezone_reference.sql',
    '012_ir005_invitation_foundation.sql', '013_ir005_create_invitation_candidate.sql',
    '014_ir005_accept_invitation_candidate.sql', '015_ir005_revoke_invitation_candidate.sql',
    '016_ir005_role_change_candidate.sql', '017_ir005_transfer_ownership_candidate.sql',
    '018_ir005_deactivate_membership_candidate.sql', '019_ir005_archive_state_candidate.sql',
    '020_ir005_inspection_candidate.sql', '021_ir005_owner_invitation_list_candidate.sql',
    '022_ir011_my_group_access_candidate.sql', '023_ir004_profile_filter_grant_candidate.sql',
  ]
  for (const name of candidates) adminSql(read(name), name)
}

function anonKey() {
  const output = run(cli, ['status', '--workdir', workdir, '--output', 'env'], { label: 'stack-status' })
  const line = output.split('\n').find((value) => value.startsWith('ANON_KEY='))
  if (!line) throw new Error('anon-key-unavailable')
  const raw = line.slice('ANON_KEY='.length)
  return raw.startsWith('"') ? JSON.parse(raw) : raw
}

function stop() {
  if (started) {
    run(cli, ['stop', '--workdir', workdir, '--project-id', projectId, '--no-backup'], { label: 'stack-stop' })
    started = false
  }
  if (workdir && existsSync(workdir)) rmSync(workdir, { recursive: true, force: true })
  workdir = ''
  assertClean()
}

try {
  start()
  migrate()
  const key = anonKey()
  if (verifyEmail) {
    const mailboxRoot = await fetch('http://127.0.0.1:58524/')
    console.log(JSON.stringify({ mailboxRootStatus: mailboxRoot.status }))
  }
  run(playwright, ['test', verifyEmail
    ? 'tests/browser/integration/email-verification.spec.ts'
    : 'tests/browser/integration/live-journey.spec.ts'], {
    env: {
      ...process.env, PLAYWRIGHT_BROWSERS_PATH: '0', TRIP_LIVE_JOURNEY: '1',
      VITE_SUPABASE_URL: 'http://127.0.0.1:58521', VITE_SUPABASE_ANON_KEY: key,
    }, label: 'live-browser-journey',
  })
  stop()
  console.log(JSON.stringify({ liveJourneyCandidate: 'passed', emailVerification: verifyEmail ? 'passed' : 'not_run', twoAccounts: 'passed', cleanup: 'passed' }))
} catch (error) {
  try { stop() } catch { /* preserve primary error */ }
  const message = error instanceof Error && /^[a-z0-9-]+$/u.test(error.message) ? error.message : 'live-journey-failed'
  console.error(message)
  process.exitCode = 1
}
