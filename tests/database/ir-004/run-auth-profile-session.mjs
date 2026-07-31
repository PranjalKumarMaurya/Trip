import { createHash, randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { IR004_LOCAL_PROJECT_ID, assertIr004DockerAbsent, assertIr004DockerEmptyBeforeStart } from './local-docker-cleanup.mjs'

const repositoryRoot = fileURLToPath(new URL('../../..', import.meta.url))
const stackWorkdir = fileURLToPath(new URL('./local-stack', import.meta.url))
const artifactRoot = resolve(repositoryRoot, 'artifacts/ir-004')
const runId = process.env.IR004_EVIDENCE_RUN_ID ?? `ir004-${Date.now()}-${randomUUID()}`
const artifactDirectory = resolve(artifactRoot, runId)
const generatedTypesPath = resolve(repositoryRoot, 'src/lib/database.types.ts')
const rollbackSql = resolve(fileURLToPath(new URL('./', import.meta.url)), 'empty-target-rollback.sql')
const storageBaselineSql = resolve(repositoryRoot, 'tests/database/ir-002/platform-storage-baseline.sql')
const localCliStateFiles = [
  resolve(stackWorkdir, 'supabase/.branches/_current_branch'),
  resolve(stackWorkdir, 'supabase/.temp/cli-latest'),
]
const expectedMigrations = ['001_initial.sql', '002_tickets_bucket.sql', '003_gmap_url.sql', '004_paid_by_splits.sql', '005_todos.sql', '006_ir002_tenant_root.sql', '007_ir002_configuration_archive_audit.sql', '008_ir004_profile_auth.sql']
const stages = new Set(['clean-application', 'schema-validation', 'auth-profile-constraints', 'profile-privacy', 'type-generation-pass-1', 'empty-target-rollback', 'clean-reapplication', 'type-generation-pass-2', 'type-comparison', 'typecheck-test-build', 'cleanup'])

let started = false
let databaseUrl = ''

function digest(value) {
  return createHash('sha256').update(value).digest('hex')
}

function run(command, args, { env = process.env, capture = false } = {}) {
  const result = spawnSync(command, args, capture ? { cwd: repositoryRoot, encoding: 'utf8', env } : { cwd: repositoryRoot, env, stdio: 'ignore' })
  if (result.error || result.status !== 0) throw new Error(`${command}-command-failed`)
  return capture ? result.stdout : ''
}

function tool(command, args) {
  const result = spawnSync(command, args, { cwd: repositoryRoot, encoding: 'utf8' })
  if (result.error || result.status !== 0) throw new Error(`${command}-unavailable`)
  return result.stdout.trim()
}

function writeStage(stage, details = {}) {
  if (!stages.has(stage)) throw new Error('refusing-unknown-ir004-evidence-stage')
  const path = resolve(artifactDirectory, `${stage}.json`)
  if (!path.startsWith(`${artifactDirectory}/`) || existsSync(path)) throw new Error('refusing-overwrite-of-ir004-evidence-stage')
  const output = `${JSON.stringify({ schemaVersion: 1, capability: 'ir-004-auth-profile-session', runId, stage, result: 'passed', environment: 'local-isolated', projectId: IR004_LOCAL_PROJECT_ID, ...details }, null, 2)}\n`
  if (/postgres(?:ql)?:\/\/|password|token|secret|api[_-]?key|service[_-]?role|\/home\//i.test(output)) throw new Error('refusing-unsafe-ir004-evidence')
  writeFileSync(path, output, 'utf8')
}

function createArtifacts() {
  if (!/^ir004-[a-z0-9-]+$/i.test(runId) || !artifactDirectory.startsWith(`${artifactRoot}/`) || existsSync(artifactDirectory)) {
    throw new Error('refusing-invalid-or-existing-ir004-evidence-run')
  }
  mkdirSync(artifactDirectory, { recursive: true })
}

function start() {
  assertIr004DockerEmptyBeforeStart()
  run('npx', ['--no-install', 'supabase', 'start', '--workdir', stackWorkdir])
  started = true
  const output = run('npx', ['--no-install', 'supabase', 'status', '--workdir', stackWorkdir, '--output', 'env', '--override-name', 'db.url=IR004_DATABASE_URL'], { capture: true })
  const entry = output.split('\n').find((line) => line.startsWith('IR004_DATABASE_URL='))
  if (!entry) throw new Error('ir004-local-database-url-unavailable')
  const raw = entry.slice('IR004_DATABASE_URL='.length)
  databaseUrl = raw.startsWith('"') ? JSON.parse(raw) : raw
  const parsed = new URL(databaseUrl)
  if (!['localhost', '127.0.0.1'].includes(parsed.hostname) || parsed.port !== '57522') throw new Error('refusing-nonlocal-ir004-database-endpoint')
}

function stop() {
  if (started) {
    run('npx', ['--no-install', 'supabase', 'stop', '--workdir', stackWorkdir, '--project-id', IR004_LOCAL_PROJECT_ID, '--no-backup'])
    started = false
    databaseUrl = ''
    assertIr004DockerAbsent()
  }
  for (const path of localCliStateFiles) rmSync(path, { force: true })
}

function psql(sql, expectedFailure = false) {
  const parsed = new URL(databaseUrl)
  const result = spawnSync('psql', ['--no-psqlrc', '--quiet', '--tuples-only', '--no-align', '--set', 'ON_ERROR_STOP=1', '--host', parsed.hostname, '--port', parsed.port, '--username', decodeURIComponent(parsed.username), '--dbname', parsed.pathname.slice(1), '--command', sql], { cwd: repositoryRoot, encoding: 'utf8', env: { ...process.env, PGPASSWORD: decodeURIComponent(parsed.password) } })
  if (expectedFailure ? result.status === 0 : result.error || result.status !== 0) throw new Error(expectedFailure ? 'expected-denial-not-observed' : 'psql-command-failed')
  return result.stdout.trim()
}

function psqlFile(path) {
  const parsed = new URL(databaseUrl)
  const result = spawnSync('psql', ['--no-psqlrc', '--quiet', '--set', 'ON_ERROR_STOP=1', '--host', parsed.hostname, '--port', parsed.port, '--username', decodeURIComponent(parsed.username), '--dbname', parsed.pathname.slice(1), '--file', path], { cwd: repositoryRoot, encoding: 'utf8', env: { ...process.env, PGPASSWORD: decodeURIComponent(parsed.password) } })
  if (result.error || result.status !== 0) {
    const name = path.split('/').pop()
    if (name === '008_ir004_profile_auth.sql') throw new Error('ir004-migration-008-failed')
    throw new Error('ir004-migration-application-failed')
  }
}

function applyAllMigrations() {
  for (const name of expectedMigrations) {
    const path = resolve(repositoryRoot, 'supabase/migrations', name)
    if (name === '002_tickets_bucket.sql') {
      const databaseContainer = `supabase_db_${IR004_LOCAL_PROJECT_ID}`
      const sql = `${readFileSync(storageBaselineSql, 'utf8')}\n${readFileSync(path, 'utf8')}`
      const result = spawnSync('docker', ['exec', '--interactive', '--user', 'postgres', databaseContainer, 'psql', '--no-psqlrc', '--quiet', '--set', 'ON_ERROR_STOP=1', '--username', 'supabase_admin', '--dbname', 'postgres'], { cwd: repositoryRoot, encoding: 'utf8', input: sql })
      if (result.error || result.status !== 0) throw new Error('ir004-legacy-storage-migration-failed')
      continue
    }
    psqlFile(path)
  }
}

function scalar(sql, expected, label) {
  if (psql(sql) !== expected) throw new Error(`schema-assertion-failed-${label}`)
}

function insertAuthUser(id, email, displayName) {
  psql(`INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) VALUES ('${id}', 'authenticated', 'authenticated', '${email}', 'not-a-credential', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"${displayName}"}'::jsonb, now(), now());`)
}

function validateSchema({ writeEvidence = true } = {}) {
  scalar("SELECT count(*)::text FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'auth_user_id';", '1', 'auth-user-column')
  scalar("SELECT count(*)::text FROM pg_constraint WHERE conname IN ('profiles_auth_user_id_key', 'profiles_auth_user_id_fkey');", '2', 'profile-auth-constraints')
  scalar("SELECT count(*)::text FROM pg_trigger WHERE tgname = 'on_auth_user_created' AND NOT tgisinternal;", '1', 'profile-auth-trigger')
  scalar("SELECT count(*)::text FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_select_own_linked_profile';", '1', 'profile-privacy-policy')
  scalar("SELECT count(*)::text FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('participants', 'trips');", '0', 'no-prohibited-tables')
  if (writeEvidence) writeStage('schema-validation', { assertions: 5 })
}

function validateAuthProfileContract({ writeEvidence = true } = {}) {
  const accountA = '00000000-0000-4000-8000-0000000004a1'
  const accountB = '00000000-0000-4000-8000-0000000004b1'
  insertAuthUser(accountA, 'account-a@example.test', 'Account A')
  insertAuthUser(accountB, 'account-b@example.test', 'Account B')
  scalar(`SELECT count(*)::text FROM public.profiles WHERE auth_user_id IN ('${accountA}', '${accountB}');`, '2', 'trigger-created-two-profiles')
  scalar(`SELECT display_name FROM public.profiles WHERE auth_user_id = '${accountA}';`, 'Account A', 'trigger-derived-display-name')
  psql(`INSERT INTO public.profiles (display_name, auth_user_id) VALUES ('Duplicate', '${accountA}');`, true)
  psql("INSERT INTO public.profiles (display_name, auth_user_id) VALUES ('Missing', '00000000-0000-4000-8000-0000000004ff');", true)
  psql(`DELETE FROM auth.users WHERE id = '${accountA}';`, true)
  scalar(`SELECT count(*)::text FROM public.group_members WHERE id = '00000000-0000-4000-8000-0000000004a1';`, '0', 'no-membership-created')
  if (writeEvidence) writeStage('auth-profile-constraints', { assertions: 6 })
}

function validatePrivacy({ writeEvidence = true } = {}) {
  const accountA = '00000000-0000-4000-8000-0000000004a1'
  const accountB = '00000000-0000-4000-8000-0000000004b1'
  scalar(`BEGIN; SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub = '${accountA}'; SELECT count(*)::text FROM public.profiles; ROLLBACK;`, '1', 'own-profile-only')
  psql(`BEGIN; SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub = '${accountA}'; INSERT INTO public.profiles (display_name, auth_user_id) VALUES ('Forged', '${accountB}'); ROLLBACK;`, true)
  scalar(`BEGIN; SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub = '${accountB}'; SELECT count(*)::text FROM public.profiles WHERE auth_user_id = '${accountA}'; ROLLBACK;`, '0', 'cross-account-profile-denial')
  if (writeEvidence) writeStage('profile-privacy', { assertions: 3 })
}

function generateTypes(pass) {
  const output = run('npx', ['--no-install', 'supabase', 'gen', 'types', 'typescript', '--local', '--schema', 'public', '--workdir', stackWorkdir], { capture: true }).replace(/\n\n$/u, '\n')
  if (!output.includes('auth_user_id') || !output.includes('profiles')) throw new Error('generated-types-missing-ir004-schema')
  writeFileSync(generatedTypesPath, output, 'utf8')
  if (pass === 1) writeFileSync(resolve(artifactDirectory, 'database.types.pass-1.ts'), output, 'utf8')
  writeStage(`type-generation-pass-${pass}`, { cliVersion: tool('npx', ['--no-install', 'supabase', '--version']), schema: 'public', migrationChecksum: digest(readFileSync(resolve(repositoryRoot, 'supabase/migrations/008_ir004_profile_auth.sql'))), generatedTypeChecksum: digest(output) })
  return output
}

function rollbackEmptyTarget() {
  psql("DELETE FROM public.group_members; DELETE FROM public.profiles; DELETE FROM auth.users WHERE email LIKE '%@example.test';")
  const sql = readFileSync(rollbackSql, 'utf8')
  psql(sql)
  scalar("SELECT count(*)::text FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'auth_user_id';", '0', 'rollback-removed-auth-link')
  scalar("SELECT count(*)::text FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users','events','expenses','settlements','exchange_rates','todos');", '6', 'rollback-preserved-legacy')
  writeStage('empty-target-rollback', { legacyTablesPreserved: 6 })
}

function buildChecks() {
  run('npm', ['run', 'typecheck'])
  run('npm', ['run', 'test:types'])
  run('npm', ['run', 'build'])
  writeStage('typecheck-test-build', { commands: ['npm-run-typecheck', 'npm-run-test-types', 'npm-run-build'] })
}

try {
  createArtifacts()
  tool('docker', ['--version'])
  tool('psql', ['--version'])
  tool('npx', ['--no-install', 'supabase', '--version'])
  start()
  applyAllMigrations()
  writeStage('clean-application', { migrations: expectedMigrations })
  validateSchema()
  validateAuthProfileContract()
  validatePrivacy()
  const firstTypes = generateTypes(1)
  rollbackEmptyTarget()
  stop()

  start()
  applyAllMigrations()
  validateSchema({ writeEvidence: false })
  validateAuthProfileContract({ writeEvidence: false })
  validatePrivacy({ writeEvidence: false })
  writeStage('clean-reapplication', { migrations: expectedMigrations })
  const secondTypes = generateTypes(2)
  if (firstTypes !== secondTypes) throw new Error('generated-types-not-byte-identical')
  writeStage('type-comparison', { comparison: 'byte-identical', checksum: digest(secondTypes) })
  buildChecks()
  stop()
  const cleanup = assertIr004DockerAbsent()
  writeStage('cleanup', { exactProjectResources: 'absent', attempts: cleanup.attempts })
  console.log(JSON.stringify({ capability: 'ir-004-auth-profile-session', result: 'passed', runId }))
} catch (error) {
  try {
    stop()
  } catch {
    // Keep failures audit-safe.
  }
  const candidate = error instanceof Error ? error.message : ''
  const reason = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate) ? candidate : 'authorised-local-command-failed'
  console.error(JSON.stringify({ capability: 'ir-004-auth-profile-session', result: 'failed-safely', reason }))
  process.exitCode = 1
}
