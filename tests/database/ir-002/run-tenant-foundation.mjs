import { createHash, randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  IR002_LOCAL_PROJECT_ID,
  assertIr002DockerAbsent,
  assertIr002Snapshot,
  readIr002DockerSnapshot,
} from './local-docker-cleanup.mjs'

const repositoryRoot = fileURLToPath(new URL('../../..', import.meta.url))
const stackWorkdir = fileURLToPath(new URL('./local-stack', import.meta.url))
const rollbackSql = fileURLToPath(new URL('./empty-target-rollback.sql', import.meta.url))
const storageBaselineSql = fileURLToPath(new URL('./platform-storage-baseline.sql', import.meta.url))
const artifactRoot = resolve(repositoryRoot, 'artifacts/ir-002')
const artifactRunId = process.env.IR002_EVIDENCE_RUN_ID ?? `ir002-${Date.now()}-${randomUUID()}`
const artifactDirectory = resolve(artifactRoot, artifactRunId)
const generatedTypesPath = resolve(repositoryRoot, 'src/lib/database.types.ts')
const expectedMigrationNames = [
  '001_initial.sql',
  '002_tickets_bucket.sql',
  '003_gmap_url.sql',
  '004_paid_by_splits.sql',
  '005_todos.sql',
  '006_ir002_tenant_root.sql',
  '007_ir002_configuration_archive_audit.sql',
]
const stageNames = new Set([
  'clean-application',
  'schema-validation',
  'constraint-tests',
  'two-group-structural-tests',
  'type-generation-pass-1',
  'empty-target-rollback',
  'clean-reapplication',
  'type-generation-pass-2',
  'type-comparison',
  'typecheck-test-build',
  'cleanup',
])

let started = false
let databaseUrl = null

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function run(command, args, { env = process.env, capture = false } = {}) {
  const result = spawnSync(command, args, capture
    ? { cwd: repositoryRoot, encoding: 'utf8', env }
    : { cwd: repositoryRoot, env, stdio: 'ignore' })
  if (result.error || result.status !== 0) {
    throw new Error(`${command}-command-failed`)
  }
  return capture ? result.stdout : ''
}

function requireTool(command, args) {
  const result = spawnSync(command, args, { cwd: repositoryRoot, encoding: 'utf8' })
  if (result.error || result.status !== 0) throw new Error(`${command}-unavailable`)
  return result.stdout.trim()
}

function assertArtifactBoundary() {
  if (!artifactDirectory.startsWith(`${artifactRoot}/`)) {
    throw new Error('refusing-ir002-artifact-outside-boundary')
  }
  if (existsSync(artifactDirectory)) throw new Error('refusing-existing-ir002-evidence-run')
  mkdirSync(artifactDirectory, { recursive: true })
}

function writeStage(stage, details = {}) {
  if (!stageNames.has(stage)) throw new Error('refusing-unknown-ir002-evidence-stage')
  const path = resolve(artifactDirectory, `${stage}.json`)
  if (!path.startsWith(`${artifactDirectory}/`) || existsSync(path)) {
    throw new Error('refusing-overwrite-of-ir002-evidence-stage')
  }
  const record = {
    schemaVersion: 1,
    capability: 'ir-002-tenant-foundation',
    runId: artifactRunId,
    stage,
    result: 'passed',
    environment: 'local-isolated',
    projectId: IR002_LOCAL_PROJECT_ID,
    ...details,
  }
  const serialized = `${JSON.stringify(record, null, 2)}\n`
  if (/postgres(?:ql)?:\/\/|password|token|secret|api[_-]?key|service[_-]?role|\/home\//i.test(serialized)) {
    throw new Error('refusing-unsafe-ir002-evidence')
  }
  writeFileSync(path, serialized, 'utf8')
  console.log(JSON.stringify({ capability: 'ir-002-tenant-foundation', stage, result: 'passed' }))
}

function startStack() {
  assertIr002Snapshot(readIr002DockerSnapshot())
  const existing = readIr002DockerSnapshot()
  if (existing.containers.length || existing.networks.length || existing.volumes.length) {
    throw new Error('refusing-preexisting-ir002-local-resources')
  }
  console.log(JSON.stringify({ capability: 'ir-002-tenant-foundation', stage: 'stack-cli', result: 'started' }))
  run('npx', ['--no-install', 'supabase', 'start', '--workdir', stackWorkdir])
  started = true
  databaseUrl = waitForLocalDatabase()
  console.log(JSON.stringify({ capability: 'ir-002-tenant-foundation', stage: 'database-ready', result: 'passed' }))
}

function waitForLocalDatabase() {
  for (let attempt = 1; attempt <= 60; attempt += 1) {
    try {
      const url = readLocalDatabaseUrl()
      databaseUrl = url
      runPsql('SELECT 1;')
      return url
    } catch {
      console.log(JSON.stringify({ capability: 'ir-002-tenant-foundation', stage: 'database-ready', result: 'waiting', attempt }))
      if (attempt < 60) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500)
    }
  }
  throw new Error('ir002-local-database-readiness-timeout')
}

function readLocalDatabaseUrl() {
  const output = run('npx', [
    '--no-install', 'supabase', 'status', '--workdir', stackWorkdir, '--output', 'env',
    '--override-name', 'db.url=IR002_DATABASE_URL',
  ], { capture: true })
  const line = output.split('\n').find((candidate) => candidate.startsWith('IR002_DATABASE_URL='))
  if (!line) throw new Error('ir002-local-database-url-unavailable')
  const value = line.slice('IR002_DATABASE_URL='.length)
  const url = value.startsWith('"') ? JSON.parse(value) : value
  const parsed = new URL(url)
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol) ||
    !['localhost', '127.0.0.1'].includes(parsed.hostname) || parsed.port !== '57422') {
    throw new Error('refusing-nonlocal-ir002-database-endpoint')
  }
  return url
}

function psqlOptions() {
  if (!databaseUrl) throw new Error('ir002-local-database-not-started')
  const parsed = new URL(databaseUrl)
  return {
    args: [
      '--no-psqlrc', '--quiet', '--tuples-only', '--no-align', '--set', 'ON_ERROR_STOP=1',
      '--host', parsed.hostname, '--port', parsed.port, '--username', decodeURIComponent(parsed.username),
      '--dbname', parsed.pathname.slice(1),
    ],
    env: { ...process.env, PGPASSWORD: decodeURIComponent(parsed.password) },
  }
}

function runPsql(sql) {
  const options = psqlOptions()
  return run('psql', [...options.args, '--command', sql], { env: options.env, capture: true }).trim()
}

function runPsqlFile(path) {
  const options = psqlOptions()
  const result = spawnSync('psql', [...options.args, '--file', path], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: options.env,
  })
  if (result.error || result.status !== 0) {
    const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
    const reason = /storage\.buckets.*does not exist/i.test(output)
      ? 'storage-schema-missing'
      : /policy .*already exists/i.test(output)
        ? 'policy-already-exists'
        : /permission denied to set role/i.test(output)
          ? 'storage-role-assumption-denied'
          : /permission denied for schema storage/i.test(output)
            ? 'storage-schema-permission-denied'
        : /permission denied/i.test(output)
          ? 'permission-denied'
          : 'psql-file-failed'
    console.log(JSON.stringify({ capability: 'ir-002-tenant-foundation', stage: 'migration', migration: path.split('/').pop(), result: 'failed-safely', reason }))
    throw new Error(reason)
  }
}

function expectFailure(sql, label) {
  const options = psqlOptions()
  const result = spawnSync('psql', [...options.args, '--command', sql], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: options.env,
  })
  if (result.error || result.status === 0) throw new Error(`expected-constraint-failure-not-observed-${label}`)
}

function migrationPaths() {
  const directory = resolve(repositoryRoot, 'supabase/migrations')
  const names = readdirSync(directory).filter((name) => name.endsWith('.sql')).sort()
  if (names.length !== expectedMigrationNames.length || names.some((name, index) => name !== expectedMigrationNames[index])) {
    throw new Error('unexpected-migration-set')
  }
  return names.map((name) => resolve(directory, name))
}

function applyAllMigrations() {
  for (const path of migrationPaths()) {
    const name = path.split('/').pop()
    if (name === '002_tickets_bucket.sql') {
      runPlatformStorageReplay(path)
      console.log(JSON.stringify({ capability: 'ir-002-tenant-foundation', stage: 'migration', migration: name, result: 'passed' }))
      continue
    }
    console.log(JSON.stringify({ capability: 'ir-002-tenant-foundation', stage: 'migration', migration: name, result: 'started' }))
    runPsqlFile(path)
    console.log(JSON.stringify({ capability: 'ir-002-tenant-foundation', stage: 'migration', migration: name, result: 'passed' }))
  }
}

function runPlatformStorageReplay(legacyMigrationPath) {
  const databaseContainer = `supabase_db_${IR002_LOCAL_PROJECT_ID}`
  const snapshot = assertIr002Snapshot(readIr002DockerSnapshot())
  if (!snapshot.containers.includes(databaseContainer)) {
    throw new Error('ir002-local-database-container-unavailable')
  }
  const sql = `${readFileSync(storageBaselineSql, 'utf8')}\n${readFileSync(legacyMigrationPath, 'utf8')}`
  const result = spawnSync('docker', [
    'exec', '--interactive', '--user', 'postgres', databaseContainer,
    'psql', '--no-psqlrc', '--quiet', '--set', 'ON_ERROR_STOP=1', '--username', 'supabase_admin', '--dbname', 'postgres',
  ], { cwd: repositoryRoot, encoding: 'utf8', input: sql })
  if (result.error || result.status !== 0) {
    const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
    const reason = /role .*postgres.*does not exist/i.test(output)
      ? 'ir002-local-postgres-role-missing'
      : /password authentication failed|peer authentication failed/i.test(output)
        ? 'ir002-local-platform-auth-failed'
        : /permission denied/i.test(output)
          ? 'ir002-local-platform-permission-denied'
          : 'ir002-local-platform-storage-replay-failed'
    console.log(JSON.stringify({ capability: 'ir-002-tenant-foundation', stage: 'legacy-storage-platform-baseline', result: 'failed-safely', reason }))
    throw new Error(reason)
  }
}

function scalar(sql, expected, label) {
  const actual = runPsql(sql)
  if (actual !== expected) throw new Error(`schema-assertion-failed-${label}`)
}

function validateSchema() {
  scalar("SELECT count(*)::text FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('groups','profiles','group_members','group_configurations','group_audit_events','iso_4217_currency_codes');", '6', 'target-table-count')
  scalar("SELECT count(*)::text FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('participants','trips');", '0', 'prohibited-table-count')
  scalar("SELECT count(*)::text FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'auth_user_id';", '0', 'no-profile-auth-link')
  scalar("SELECT count(*)::text FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'group_members' AND column_name IN ('id','group_id','profile_id','role','status','created_at','updated_at');", '7', 'group-member-columns')
  scalar("SELECT count(*)::text FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'group_members_group_profile_linked_key';", '1', 'linked-profile-partial-index')
  scalar("SELECT count(*)::text FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users','events','expenses','settlements','exchange_rates','todos');", '6', 'legacy-tables')
}

function insertFixtures() {
  runPsql(`
    INSERT INTO public.groups (id) VALUES
      ('00000000-0000-4000-8000-0000000000a1'),
      ('00000000-0000-4000-8000-0000000000b1');
    INSERT INTO public.profiles (id, display_name) VALUES
      ('00000000-0000-4000-8000-0000000000a2', 'Duplicate Name'),
      ('00000000-0000-4000-8000-0000000000b2', 'Duplicate Name');
    INSERT INTO public.group_members (id, group_id, profile_id, role, status) VALUES
      ('00000000-0000-4000-8000-0000000000a3', '00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a2', 'owner', 'active'),
      ('00000000-0000-4000-8000-0000000000b3', '00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000b2', 'owner', 'active'),
      ('00000000-0000-4000-8000-0000000000a4', '00000000-0000-4000-8000-0000000000a1', NULL, 'member', 'inactive');
    INSERT INTO public.group_configurations (group_id, trip_name, destination, start_date, end_date, timezone, accounting_currency) VALUES
      ('00000000-0000-4000-8000-0000000000a1', 'Group A Trip', 'A', DATE '2030-01-02', DATE '2030-01-03', 'Asia/Makassar', 'IDR'),
      ('00000000-0000-4000-8000-0000000000b1', 'Group B Trip', 'B', DATE '2030-01-02', DATE '2030-01-03', 'America/New_York', 'USD');
  `)
}

function runConstraintTests({ writeEvidence = true } = {}) {
  insertFixtures()
  runPsql("INSERT INTO public.groups (id) VALUES ('00000000-0000-4000-8000-0000000000c1');")
  expectFailure("INSERT INTO public.profiles (display_name) VALUES ('   ');", 'empty-profile-name')
  expectFailure("INSERT INTO public.group_members (group_id, role, status) VALUES ('00000000-0000-4000-8000-0000000000ff', 'owner', 'active');", 'missing-group')
  expectFailure("INSERT INTO public.group_members (group_id, role, status) VALUES ('00000000-0000-4000-8000-0000000000a1', 'admin', 'active');", 'invalid-role')
  expectFailure("INSERT INTO public.group_members (group_id, role, status) VALUES ('00000000-0000-4000-8000-0000000000a1', 'member', 'removed');", 'invalid-status')
  expectFailure("INSERT INTO public.group_members (group_id, profile_id, role, status) VALUES ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a2', 'member', 'active');", 'duplicate-linked-profile')
  expectFailure("INSERT INTO public.group_configurations (group_id, trip_name, destination, start_date, end_date, timezone, accounting_currency) VALUES ('00000000-0000-4000-8000-0000000000a1', 'x', 'x', DATE '2030-01-01', DATE '2030-01-01', 'Asia/Makassar', 'IDR');", 'second-configuration')
  expectFailure("INSERT INTO public.group_configurations (group_id, trip_name, destination, start_date, end_date, timezone, accounting_currency) VALUES ('00000000-0000-4000-8000-0000000000ff', 'x', 'x', DATE '2030-01-01', DATE '2030-01-01', 'Asia/Makassar', 'IDR');", 'missing-configuration-group')
  expectFailure("INSERT INTO public.group_configurations (group_id, trip_name, destination, start_date, end_date, timezone, accounting_currency) VALUES ('00000000-0000-4000-8000-0000000000ff', '', 'x', DATE '2030-01-01', DATE '2030-01-01', 'Asia/Makassar', 'IDR');", 'empty-trip-name')
  expectFailure("INSERT INTO public.group_configurations (group_id, trip_name, destination, start_date, end_date, timezone, accounting_currency) VALUES ('00000000-0000-4000-8000-0000000000ff', 'x', '', DATE '2030-01-01', DATE '2030-01-01', 'Asia/Makassar', 'IDR');", 'empty-destination')
  expectFailure("INSERT INTO public.group_configurations (group_id, trip_name, destination, start_date, end_date, timezone, accounting_currency) VALUES ('00000000-0000-4000-8000-0000000000ff', 'x', 'x', DATE '2030-01-02', DATE '2030-01-01', 'Asia/Makassar', 'IDR');", 'invalid-date-order')
  expectFailure("INSERT INTO public.group_configurations (group_id, trip_name, destination, start_date, end_date, timezone, accounting_currency) VALUES ('00000000-0000-4000-8000-0000000000ff', 'x', 'x', DATE '2030-01-01', DATE '2030-01-01', 'Not/AZone', 'IDR');", 'invalid-timezone')
  expectFailure("INSERT INTO public.group_configurations (group_id, trip_name, destination, start_date, end_date, timezone, accounting_currency) VALUES ('00000000-0000-4000-8000-0000000000ff', 'x', 'x', DATE '2030-01-01', DATE '2030-01-01', 'Asia/Makassar', 'ZZZ');", 'invalid-currency')
  expectFailure("INSERT INTO public.group_configurations (group_id, trip_name, destination, start_date, end_date, timezone, accounting_currency) VALUES ('00000000-0000-4000-8000-0000000000c1', NULL, 'x', DATE '2030-01-01', DATE '2030-01-01', 'Asia/Makassar', 'IDR');", 'missing-trip-name')
  expectFailure("UPDATE public.groups SET archived_at = created_at - interval '1 second' WHERE id = '00000000-0000-4000-8000-0000000000a1';", 'invalid-archive-time')
  expectFailure("DELETE FROM public.groups WHERE id = '00000000-0000-4000-8000-0000000000a1';", 'restricted-group-delete')
  expectFailure("DELETE FROM public.profiles WHERE id = '00000000-0000-4000-8000-0000000000a2';", 'restricted-profile-delete')
  runPsql("UPDATE public.groups SET archived_at = now() WHERE id = '00000000-0000-4000-8000-0000000000a1';")
  if (writeEvidence) writeStage('constraint-tests', { assertions: 15 })
}

function runTwoGroupTests({ writeEvidence = true } = {}) {
  scalar("SELECT count(*)::text FROM public.group_members WHERE group_id = '00000000-0000-4000-8000-0000000000a1' AND id = '00000000-0000-4000-8000-0000000000a3';", '1', 'stable-participant-a')
  scalar("SELECT count(*)::text FROM public.profiles WHERE display_name = 'Duplicate Name';", '2', 'duplicate-display-name-independent')
  runPsql("UPDATE public.profiles SET display_name = 'Renamed Participant' WHERE id = '00000000-0000-4000-8000-0000000000a2';")
  scalar("SELECT id::text FROM public.group_members WHERE profile_id = '00000000-0000-4000-8000-0000000000a2';", '00000000-0000-4000-8000-0000000000a3', 'participant-stable-after-presentation-update')
  scalar("SELECT count(*)::text FROM public.profiles WHERE updated_at >= created_at;", '2', 'profile-timestamp-order')
  runPsql("INSERT INTO public.group_audit_events (group_id, actor_group_member_id, event_type, request_id, occurred_at) VALUES ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a3', 'group_bootstrapped', '00000000-0000-4000-8000-0000000000c1', now());")
  expectFailure("INSERT INTO public.group_audit_events (group_id, actor_group_member_id, event_type, request_id, occurred_at) VALUES ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000b3', 'group_bootstrapped', '00000000-0000-4000-8000-0000000000c2', now());", 'cross-group-audit-actor')
  expectFailure("INSERT INTO public.group_audit_events (group_id, actor_group_member_id, event_type, request_id, occurred_at) VALUES ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a3', 'unexpected', '00000000-0000-4000-8000-0000000000c3', now());", 'invalid-audit-event-type')
  expectFailure("INSERT INTO public.group_audit_events (group_id, actor_group_member_id, event_type, request_id, occurred_at) VALUES ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a3', 'membership_lifecycle', '00000000-0000-4000-8000-0000000000c1', now());", 'duplicate-audit-request')
  expectFailure("INSERT INTO public.group_audit_events (group_id, actor_group_member_id, event_type, request_id, details, occurred_at) VALUES ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a3', 'membership_lifecycle', '00000000-0000-4000-8000-0000000000c4', '[]'::jsonb, now());", 'non-object-audit-details')
  if (writeEvidence) writeStage('two-group-structural-tests', { assertions: 9 })
}

function generateTypes(pass) {
  const output = run('npx', [
    '--no-install', 'supabase', 'gen', 'types', 'typescript', '--local', '--schema', 'public', '--workdir', stackWorkdir,
  ], { capture: true })
  if (!output.includes('group_configurations') || !output.includes('group_audit_events')) {
    throw new Error('generated-types-missing-ir002-schema')
  }
  writeFileSync(generatedTypesPath, output, 'utf8')
  const checksum = sha256(output)
  if (pass === 1) writeFileSync(resolve(artifactDirectory, 'database.types.pass-1.ts'), output, 'utf8')
  writeStage(`type-generation-pass-${pass}`, {
    cliVersion: requireTool('npx', ['--no-install', 'supabase', '--version']),
    schema: 'public',
    migrationChecksums: Object.fromEntries(migrationPaths().slice(-2).map((path) => [path.split('/').pop(), sha256(readFileSync(path))])),
    generatedTypeChecksum: checksum,
  })
  return output
}

function removeTargetRows() {
  runPsql('DELETE FROM public.group_audit_events; DELETE FROM public.group_configurations; DELETE FROM public.group_members; DELETE FROM public.profiles; DELETE FROM public.groups;')
}

function rollbackEmptyTarget() {
  removeTargetRows()
  runPsqlFile(rollbackSql)
  scalar("SELECT count(*)::text FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users','events','expenses','settlements','exchange_rates','todos');", '6', 'legacy-after-rollback')
  scalar("SELECT count(*)::text FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('groups','profiles','group_members','group_configurations','group_audit_events','iso_4217_currency_codes');", '0', 'target-removed')
  writeStage('empty-target-rollback', { legacyTablesPreserved: 6, targetTablesRemaining: 0 })
}

function stopStack() {
  if (!started) return
  run('npx', ['--no-install', 'supabase', 'stop', '--workdir', stackWorkdir, '--project-id', IR002_LOCAL_PROJECT_ID, '--no-backup'])
  started = false
  databaseUrl = null
  assertIr002DockerAbsent()
}

function cleanupGeneratedCliState() {
  for (const relativePath of ['local-stack/supabase/.branches', 'local-stack/supabase/.temp']) {
    const path = resolve(fileURLToPath(new URL('./', import.meta.url)), relativePath)
    if (!existsSync(path)) continue
    const stats = lstatSync(path)
    if (!stats.isDirectory() || stats.isSymbolicLink()) throw new Error('refusing-unsafe-ir002-cli-state')
    const entries = readdirSync(path)
    if (entries.some((entry) => !['_current_branch', 'cli-latest'].includes(entry))) {
      throw new Error('refusing-unsafe-ir002-cli-state')
    }
    rmSync(path, { recursive: true, force: false })
  }
}

function runBuildChecks() {
  run('npm', ['run', 'typecheck'])
  run('npm', ['run', 'test:types'])
  run('npm', ['run', 'build'])
  writeStage('typecheck-test-build', { commands: ['npm-run-typecheck', 'npm-run-test-types', 'npm-run-build'] })
}

try {
  console.log(JSON.stringify({ capability: 'ir-002-tenant-foundation', stage: 'preflight', result: 'started' }))
  assertArtifactBoundary()
  console.log(JSON.stringify({ capability: 'ir-002-tenant-foundation', stage: 'docker-tool', result: 'started' }))
  requireTool('docker', ['--version'])
  console.log(JSON.stringify({ capability: 'ir-002-tenant-foundation', stage: 'psql-tool', result: 'started' }))
  requireTool('psql', ['--version'])
  console.log(JSON.stringify({ capability: 'ir-002-tenant-foundation', stage: 'supabase-tool', result: 'started' }))
  requireTool('npx', ['--no-install', 'supabase', '--version'])

  console.log(JSON.stringify({ capability: 'ir-002-tenant-foundation', stage: 'stack-start', result: 'started' }))
  startStack()
  console.log(JSON.stringify({ capability: 'ir-002-tenant-foundation', stage: 'migration-application', result: 'started' }))
  applyAllMigrations()
  writeStage('clean-application', { migrations: expectedMigrationNames })
  validateSchema()
  writeStage('schema-validation', { assertions: 6 })
  runConstraintTests()
  runTwoGroupTests()
  const firstTypes = generateTypes(1)
  rollbackEmptyTarget()
  stopStack()

  startStack()
  applyAllMigrations()
  validateSchema()
  runConstraintTests({ writeEvidence: false })
  runTwoGroupTests({ writeEvidence: false })
  writeStage('clean-reapplication', { migrations: expectedMigrationNames, schemaAndConstraintValidation: 'passed' })
  const secondTypes = generateTypes(2)
  if (firstTypes !== secondTypes) throw new Error('generated-types-not-byte-identical')
  writeStage('type-comparison', { comparison: 'byte-identical', checksum: sha256(secondTypes) })
  runBuildChecks()
  stopStack()
  cleanupGeneratedCliState()
  const cleanup = assertIr002DockerAbsent()
  writeStage('cleanup', { exactProjectResources: 'absent', attempts: cleanup.attempts })

  run(process.execPath, ['tests/evidence/write-ir-002-evidence-manifest.mjs'], {
    env: { ...process.env, IR002_EVIDENCE_RUN_ID: artifactRunId },
  })
  console.log(JSON.stringify({ capability: 'ir-002-tenant-foundation', result: 'passed', runId: artifactRunId }))
} catch (error) {
  try {
    stopStack()
    cleanupGeneratedCliState()
  } catch {
    // Do not expose command output or unsafe environment detail.
  }
  const candidate = error instanceof Error ? error.message : ''
  const reason = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate)
    ? candidate
    : 'authorised-local-command-failed'
  console.error(JSON.stringify({ capability: 'ir-002-tenant-foundation', result: 'failed-safely', reason }))
  process.exitCode = 1
}
