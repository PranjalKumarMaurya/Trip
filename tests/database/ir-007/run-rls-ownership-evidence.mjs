import { createHash, randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  IR007_LOCAL_PROJECT_ID,
  assertIr007DockerAbsent,
  assertIr007DockerEmptyBeforeStart,
  readIr007DockerSnapshot,
} from './local-docker-cleanup.mjs'
import { runIr007PerformanceProbes } from './performance-probes.mjs'

const repositoryRoot = fileURLToPath(new URL('../../..', import.meta.url))
const stackWorkdir = fileURLToPath(new URL('./local-stack', import.meta.url))
const rollbackSqlPath = fileURLToPath(new URL('./empty-target-rollback.sql', import.meta.url))
const laneBFixturePath = fileURLToPath(new URL('./cases/fixtures.sql', import.meta.url))
const storageBaselineSqlPath = resolve(repositoryRoot, 'tests/database/ir-002/platform-storage-baseline.sql')
const artifactRoot = resolve(repositoryRoot, 'artifacts/ir-007')
const runId = process.env.IR007_EVIDENCE_RUN_ID ?? `ir007-${Date.now()}-${randomUUID()}`
const artifactDirectory = resolve(artifactRoot, runId)
const expectedMigrationNames = Object.freeze([
  '001_initial.sql',
  '002_tickets_bucket.sql',
  '003_gmap_url.sql',
  '004_paid_by_splits.sql',
  '005_todos.sql',
  '006_ir002_tenant_root.sql',
  '007_ir002_configuration_archive_audit.sql',
  '008_ir004_profile_auth.sql',
  '009_ir007_base_rls_ownership.sql',
])
const stageNames = new Set([
  'clean-application',
  'schema-policy-function-grant-catalogue',
  'adversarial-matrix',
  'performance-probes',
  'type-generation-pass-1',
  'empty-target-rollback',
  'clean-reapplication',
  'type-generation-pass-2',
  'type-comparison',
  'cleanup',
  'secret-safety',
])
const scopedTables = Object.freeze([
  'profiles',
  'groups',
  'group_configurations',
  'group_members',
  'group_audit_events',
  'users',
  'iso_4217_currency_codes',
  'events',
  'expenses',
  'settlements',
  'exchange_rates',
  'todos',
])
const legacyPermissivePolicies = Object.freeze([
  'group_read_events',
  'group_insert_events',
  'group_update_events',
  'group_delete_events',
  'group_read_expenses',
  'group_insert_expenses',
  'group_update_expenses',
  'group_delete_expenses',
  'group_read_settlements',
  'group_insert_settlements',
  'group_read_rates',
  'group_insert_rates',
  'group_update_rates',
  'todos_public',
])
const unsafeEvidencePatterns = Object.freeze([
  /postgres(?:ql)?:\/\//i,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\b/,
  /\b(?:password|token|secret|api[_-]?key|service[_-]?role)["']?\s*[:=]/i,
  /(?:^|[^A-Za-z])(?:\/home\/|\/Users\/|[A-Za-z]:\\)/,
])

let started = false
let databaseUrl = ''
let localEndpoints = null

function digest(value) {
  return createHash('sha256').update(value).digest('hex')
}

function run(command, args, { capture = false, env = process.env, input } = {}) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env,
    input,
    stdio: capture || input !== undefined ? undefined : 'ignore',
  })
  if (result.error || result.status !== 0) throw new Error(`${command}-command-failed`)
  return capture ? result.stdout : ''
}

function requireTool(command, args) {
  const result = spawnSync(command, args, { cwd: repositoryRoot, encoding: 'utf8' })
  if (result.error || result.status !== 0) throw new Error(`${command}-unavailable`)
  return result.stdout.trim()
}

function safeCliVersion() {
  const version = requireTool('npx', ['--no-install', 'supabase', '--version'])
  if (!/^[0-9]+(?:\.[0-9]+){1,3}(?:-[a-z0-9]+)?$/i.test(version)) {
    throw new Error('ir007-supabase-cli-version-unsafe')
  }
  return version
}

function assertSafeEvidenceText(value) {
  if (typeof value !== 'string' || unsafeEvidencePatterns.some((pattern) => pattern.test(value))) {
    throw new Error('refusing-unsafe-ir007-evidence')
  }
}

function assertPlainEvidenceValue(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('refusing-nonfinite-ir007-evidence')
    return
  }
  if (Array.isArray(value)) {
    value.forEach(assertPlainEvidenceValue)
    return
  }
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new Error('refusing-nonplain-ir007-evidence')
  }
  Object.entries(value).forEach(([key, entry]) => {
    if (
      !/^[A-Za-z][A-Za-z0-9 _-]{0,100}$/.test(key) &&
      !/^(?:Temp )?I\/O(?: [A-Za-z]+){1,5}$/.test(key) &&
      !expectedMigrationNames.includes(key)
    ) {
      throw new Error('refusing-unsafe-ir007-evidence-key')
    }
    assertPlainEvidenceValue(entry)
  })
}

function assertArtifactDirectory() {
  if (!/^ir007-[a-z0-9-]+$/i.test(runId) || !artifactDirectory.startsWith(`${artifactRoot}/`)) {
    throw new Error('refusing-invalid-ir007-evidence-run')
  }
  if (existsSync(artifactDirectory)) throw new Error('refusing-existing-ir007-evidence-run')
  mkdirSync(artifactDirectory, { recursive: true, mode: 0o700 })
}

function writeImmutableArtifact(name, serialized) {
  if (!/^[A-Za-z0-9][A-Za-z0-9.-]*\.(?:json|ts)$/.test(name)) {
    throw new Error('refusing-unsafe-ir007-evidence-name')
  }
  const path = resolve(artifactDirectory, name)
  if (!path.startsWith(`${artifactDirectory}/`)) throw new Error('refusing-ir007-artifact-outside-boundary')
  assertSafeEvidenceText(serialized)
  try {
    writeFileSync(path, serialized, { encoding: 'utf8', flag: 'wx', mode: 0o444 })
    chmodSync(path, 0o444)
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'EEXIST') {
      throw new Error('refusing-overwrite-of-ir007-evidence')
    }
    throw error
  }
}

function writeStage(stage, details = {}) {
  if (!stageNames.has(stage)) throw new Error('refusing-unknown-ir007-evidence-stage')
  assertPlainEvidenceValue(details)
  const record = Object.freeze({
    schemaVersion: 1,
    capability: 'ir-007-rls-ownership',
    runId,
    stage,
    result: 'passed',
    environment: 'local-isolated',
    projectId: IR007_LOCAL_PROJECT_ID,
    details,
  })
  writeImmutableArtifact(`${stage}.json`, `${JSON.stringify(record, null, 2)}\n`)
  console.log(JSON.stringify({ capability: record.capability, stage, result: record.result }))
}

function statusEnvironment() {
  const output = run('npx', [
    '--no-install', 'supabase', 'status', '--workdir', stackWorkdir, '--output', 'env',
    '--override-name', 'db.url=IR007_DATABASE_URL',
    '--override-name', 'api.url=IR007_API_URL',
  ], { capture: true })
  const lookup = (name) => {
    const entry = output.split('\n').find((line) => line.startsWith(`${name}=`))
    if (!entry) throw new Error(`ir007-local-${name.toLowerCase()}-unavailable`)
    const raw = entry.slice(name.length + 1)
    return raw.startsWith('"') ? JSON.parse(raw) : raw
  }
  return { databaseUrl: lookup('IR007_DATABASE_URL'), apiUrl: lookup('IR007_API_URL') }
}

function assertLoopbackEndpoint(raw, { protocol, port, label }) {
  let endpoint
  try {
    endpoint = new URL(raw)
  } catch {
    throw new Error(`ir007-local-${label}-url-invalid`)
  }
  const permittedProtocols = Array.isArray(protocol) ? protocol : [protocol]
  if (!permittedProtocols.includes(endpoint.protocol)) {
    const scheme = endpoint.protocol.replace(/[^a-z0-9]/gi, '')
    throw new Error(`refusing-nonlocal-ir007-${label}-scheme-${scheme}`)
  }
  if (!['localhost', '127.0.0.1'].includes(endpoint.hostname)) {
    throw new Error(`refusing-nonlocal-ir007-${label}-host`)
  }
  if (endpoint.port !== String(port)) {
    throw new Error(`refusing-nonlocal-ir007-${label}-port`)
  }
  return endpoint
}

function psqlOptions() {
  if (!databaseUrl) throw new Error('ir007-local-database-not-started')
  const parsed = assertLoopbackEndpoint(databaseUrl, { protocol: ['postgres:', 'postgresql:'], port: 57722, label: 'database' })
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
  const result = spawnSync('psql', [...options.args, '--command', sql], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: options.env,
  })
  if (result.error || result.status !== 0) throw new Error('ir007-psql-command-failed')
  return result.stdout.trim()
}

function runPsqlFile(path, { migrationName } = {}) {
  const options = psqlOptions()
  const result = spawnSync('psql', [...options.args, '--file', path], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: options.env,
  })
  if (result.error || result.status !== 0) {
    throw new Error(migrationName ? `ir007-migration-application-failed-${migrationName.slice(0, 3)}` : 'ir007-psql-file-failed')
  }
}

function scalar(sql, expected, label) {
  if (runPsql(sql) !== expected) throw new Error(`ir007-catalogue-assertion-failed-${label}`)
}

function migrationPaths() {
  const migrationDirectory = resolve(repositoryRoot, 'supabase/migrations')
  const actualNames = readdirSync(migrationDirectory).filter((name) => name.endsWith('.sql')).sort()
  if (
    actualNames.length !== expectedMigrationNames.length ||
    actualNames.some((name, index) => name !== expectedMigrationNames[index])
  ) {
    throw new Error('ir007-unexpected-migration-set')
  }
  return expectedMigrationNames.map((name) => resolve(migrationDirectory, name))
}

function replayLegacyStorageMigration(path) {
  const databaseContainer = `supabase_db_${IR007_LOCAL_PROJECT_ID}`
  const snapshot = readIr007DockerSnapshot()
  if (!snapshot.containers.includes(databaseContainer)) {
    throw new Error('ir007-local-database-container-unavailable')
  }
  const sql = `${readFileSync(storageBaselineSqlPath, 'utf8')}\n${readFileSync(path, 'utf8')}`
  const result = spawnSync('docker', [
    'exec', '--interactive', '--user', 'postgres', databaseContainer,
    'psql', '--no-psqlrc', '--quiet', '--set', 'ON_ERROR_STOP=1',
    '--username', 'supabase_admin', '--dbname', 'postgres',
  ], { cwd: repositoryRoot, encoding: 'utf8', input: sql })
  if (result.error || result.status !== 0) throw new Error('ir007-legacy-storage-migration-failed')
}

function applyAllMigrations() {
  for (const path of migrationPaths()) {
    const name = path.split('/').pop()
    if (name === '002_tickets_bucket.sql') {
      replayLegacyStorageMigration(path)
    } else {
      runPsqlFile(path, { migrationName: name })
    }
  }
}

function startStack() {
  assertIr007DockerEmptyBeforeStart()
  run('npx', ['--no-install', 'supabase', 'start', '--workdir', stackWorkdir])
  started = true
  const environment = statusEnvironment()
  const databaseEndpoint = assertLoopbackEndpoint(environment.databaseUrl, {
    protocol: ['postgres:', 'postgresql:'], port: 57722, label: 'database',
  })
  const apiEndpoint = assertLoopbackEndpoint(environment.apiUrl, {
    protocol: 'http:', port: 57721, label: 'api',
  })
  databaseUrl = environment.databaseUrl
  localEndpoints = Object.freeze({ database: `loopback:${databaseEndpoint.port}`, api: `loopback:${apiEndpoint.port}` })
  runPsql('SELECT 1')
}

function stopStack() {
  if (!started) return
  run('npx', [
    '--no-install', 'supabase', 'stop', '--workdir', stackWorkdir,
    '--project-id', IR007_LOCAL_PROJECT_ID, '--no-backup',
  ])
  started = false
  databaseUrl = ''
  localEndpoints = null
  assertIr007DockerAbsent()
}

function cleanLocalCliState() {
  const directories = [
    [resolve(stackWorkdir, 'supabase/.branches'), new Set(['_current_branch'])],
    [resolve(stackWorkdir, 'supabase/.temp'), new Set(['cli-latest'])],
  ]
  for (const [directory, allowedEntries] of directories) {
    if (!existsSync(directory)) continue
    const stats = lstatSync(directory)
    if (!stats.isDirectory() || stats.isSymbolicLink()) throw new Error('refusing-unsafe-ir007-cli-state')
    const entries = readdirSync(directory)
    if (entries.some((entry) => !allowedEntries.has(entry))) throw new Error('refusing-unsafe-ir007-cli-state')
    for (const entry of entries) {
      const path = resolve(directory, entry)
      const entryStats = lstatSync(path)
      if (!entryStats.isFile() || entryStats.isSymbolicLink()) throw new Error('refusing-unsafe-ir007-cli-state')
      try {
        rmSync(path)
      } catch {
        throw new Error('ir007-cli-state-file-cleanup-failed')
      }
    }
    try {
      rmSync(directory, { recursive: true, maxRetries: 3, retryDelay: 100 })
    } catch {
      throw new Error('ir007-cli-state-directory-cleanup-failed')
    }
  }
}

function assertCatalogue() {
  const tableList = scopedTables.map((name) => `'${name}'`).join(',')
  scalar(`
    SELECT count(*)::text
    FROM pg_catalog.pg_class
    JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_class.relnamespace
    WHERE pg_namespace.nspname = 'public'
      AND pg_class.relname IN (${tableList})
      AND pg_class.relrowsecurity
      AND pg_class.relforcerowsecurity
  `, '12', 'forced-rls-tables')
  scalar(`
    SELECT string_agg(tablename || ':' || policyname || ':' || cmd || ':' || array_to_string(roles, ','), '|' ORDER BY tablename, policyname)
    FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (${tableList})
  `, [
    'group_configurations:group_configurations_select_active_member:SELECT:authenticated',
    'groups:groups_select_active_member:SELECT:authenticated',
    'profiles:profiles_select_own_linked_profile:SELECT:authenticated',
    'profiles:profiles_update_own_presentation:UPDATE:authenticated',
  ].join('|'), 'policy-inventory')
  scalar(`
    SELECT count(*)::text
    FROM pg_catalog.pg_policies
    WHERE schemaname = 'public' AND policyname IN (${legacyPermissivePolicies.map((name) => `'${name}'`).join(',')})
  `, '0', 'legacy-permissive-policies')
  scalar(`
    SELECT count(*)::text
    FROM pg_catalog.pg_proc
    JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
    WHERE (pg_namespace.nspname = 'ir007_private' AND pg_proc.proname IN (
      'current_profile_id', 'current_active_group_ids', 'current_active_owner_group_ids'
    )) OR (pg_namespace.nspname = 'public' AND pg_proc.proname IN (
      'get_group_roster', 'get_group_audit_summary'
    ))
  `, '5', 'function-count')
  scalar(`
    SELECT count(*)::text
    FROM pg_catalog.pg_proc
    JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
    WHERE (pg_namespace.nspname = 'ir007_private' OR (
      pg_namespace.nspname = 'public' AND pg_proc.proname IN ('get_group_roster', 'get_group_audit_summary')
    ))
      AND pg_proc.prosecdef
      AND pg_proc.provolatile = 's'
      AND array_to_string(pg_proc.proconfig, ',') LIKE '%search_path=pg_catalog%'
  `, '5', 'function-security-properties')
  scalar(`
    SELECT string_agg(pg_namespace.nspname || '.' || pg_proc.proname || '(' || pg_catalog.pg_get_function_identity_arguments(pg_proc.oid) || ')', '|' ORDER BY pg_namespace.nspname, pg_proc.proname)
    FROM pg_catalog.pg_proc
    JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
    WHERE (pg_namespace.nspname = 'ir007_private' AND pg_proc.proname IN (
      'current_profile_id', 'current_active_group_ids', 'current_active_owner_group_ids'
    )) OR (pg_namespace.nspname = 'public' AND pg_proc.proname IN (
      'get_group_roster', 'get_group_audit_summary'
    ))
  `, [
    'ir007_private.current_active_group_ids()',
    'ir007_private.current_active_owner_group_ids()',
    'ir007_private.current_profile_id()',
    'public.get_group_audit_summary(p_group_id uuid, p_limit integer)',
    'public.get_group_roster(p_group_id uuid, p_limit integer)',
  ].join('|'), 'function-signatures')
  scalar(`
    SELECT string_agg(
      COALESCE(role.rolname, 'PUBLIC') || ':' || privilege.privilege_type,
      '|' ORDER BY COALESCE(role.rolname, 'PUBLIC'), privilege.privilege_type
    )
    FROM pg_catalog.pg_namespace AS schema
    CROSS JOIN LATERAL pg_catalog.aclexplode(
      COALESCE(schema.nspacl, pg_catalog.acldefault('n', schema.nspowner))
    ) AS privilege
    LEFT JOIN pg_catalog.pg_roles AS role ON role.oid = privilege.grantee
    WHERE schema.nspname = 'ir007_private'
  `, 'postgres:CREATE|postgres:USAGE', 'private-schema-direct-grants')
  scalar(`
    SELECT count(*)::text
    FROM pg_catalog.pg_proc AS function
    JOIN pg_catalog.pg_namespace AS schema ON schema.oid = function.pronamespace
    CROSS JOIN LATERAL pg_catalog.aclexplode(
      COALESCE(function.proacl, pg_catalog.acldefault('f', function.proowner))
    ) AS privilege
    JOIN pg_catalog.pg_roles AS grantee ON grantee.oid = privilege.grantee
    WHERE schema.nspname = 'ir007_private'
      AND privilege.privilege_type = 'EXECUTE'
      AND grantee.rolname = 'authenticated'
  `, '3', 'authenticated-helper-execution')
  scalar(`
    SELECT count(*)::text
    FROM pg_catalog.pg_proc AS function
    JOIN pg_catalog.pg_namespace AS schema ON schema.oid = function.pronamespace
    CROSS JOIN LATERAL pg_catalog.aclexplode(
      COALESCE(function.proacl, pg_catalog.acldefault('f', function.proowner))
    ) AS privilege
    LEFT JOIN pg_catalog.pg_roles AS grantee ON grantee.oid = privilege.grantee
    WHERE schema.nspname = 'ir007_private'
      AND privilege.privilege_type = 'EXECUTE'
      AND (privilege.grantee = 0 OR grantee.rolname = 'anon')
  `, '0', 'anon-helper-execution')
  scalar(`
    SELECT count(*)::text
    FROM pg_catalog.pg_proc AS function
    JOIN pg_catalog.pg_namespace AS schema ON schema.oid = function.pronamespace
    CROSS JOIN LATERAL pg_catalog.aclexplode(
      COALESCE(function.proacl, pg_catalog.acldefault('f', function.proowner))
    ) AS privilege
    JOIN pg_catalog.pg_roles AS grantee ON grantee.oid = privilege.grantee
    WHERE schema.nspname = 'public'
      AND function.proname IN ('get_group_roster', 'get_group_audit_summary')
      AND privilege.privilege_type = 'EXECUTE'
      AND grantee.rolname = 'authenticated'
  `, '2', 'authenticated-projection-execution')
  scalar(`
    SELECT count(*)::text
    FROM pg_catalog.pg_proc AS function
    JOIN pg_catalog.pg_namespace AS schema ON schema.oid = function.pronamespace
    CROSS JOIN LATERAL pg_catalog.aclexplode(
      COALESCE(function.proacl, pg_catalog.acldefault('f', function.proowner))
    ) AS privilege
    LEFT JOIN pg_catalog.pg_roles AS grantee ON grantee.oid = privilege.grantee
    WHERE schema.nspname = 'public'
      AND function.proname IN ('get_group_roster', 'get_group_audit_summary')
      AND privilege.privilege_type = 'EXECUTE'
      AND (privilege.grantee = 0 OR grantee.rolname = 'anon')
  `, '0', 'anon-projection-execution')
  scalar(`
    SELECT string_agg(
      attribute.attname || ':' || privilege.privilege_type,
      '|' ORDER BY attribute.attname, privilege.privilege_type
    )
    FROM pg_catalog.pg_attribute AS attribute
    JOIN pg_catalog.pg_class AS table_class ON table_class.oid = attribute.attrelid
    JOIN pg_catalog.pg_namespace AS schema ON schema.oid = table_class.relnamespace
    CROSS JOIN LATERAL pg_catalog.aclexplode(
      COALESCE(attribute.attacl, pg_catalog.acldefault('c', table_class.relowner))
    ) AS privilege
    JOIN pg_catalog.pg_roles AS grantee ON grantee.oid = privilege.grantee
    WHERE schema.nspname = 'public'
      AND table_class.relname = 'profiles'
      AND attribute.attnum > 0
      AND NOT attribute.attisdropped
      AND grantee.rolname = 'authenticated'
  `, 'display_name:SELECT|display_name:UPDATE|id:SELECT', 'profile-column-grants')
  scalar(`
    SELECT string_agg(
      relation.relname || ':' || privilege.privilege_type,
      '|' ORDER BY relation.relname, privilege.privilege_type
    )
    FROM pg_catalog.pg_class AS relation
    JOIN pg_catalog.pg_namespace AS schema ON schema.oid = relation.relnamespace
    CROSS JOIN LATERAL pg_catalog.aclexplode(
      COALESCE(relation.relacl, pg_catalog.acldefault('r', relation.relowner))
    ) AS privilege
    JOIN pg_catalog.pg_roles AS grantee ON grantee.oid = privilege.grantee
    WHERE schema.nspname = 'public'
      AND relation.relname IN ('groups', 'group_configurations')
      AND privilege.privilege_type = 'SELECT'
      AND grantee.rolname = 'authenticated'
  `, 'group_configurations:SELECT|groups:SELECT', 'authenticated-group-read-grants')
  scalar(`
    SELECT count(*)::text
    FROM pg_catalog.pg_class AS relation
    JOIN pg_catalog.pg_namespace AS schema ON schema.oid = relation.relnamespace
    CROSS JOIN LATERAL pg_catalog.aclexplode(
      COALESCE(relation.relacl, pg_catalog.acldefault('r', relation.relowner))
    ) AS privilege
    LEFT JOIN pg_catalog.pg_roles AS grantee ON grantee.oid = privilege.grantee
    WHERE schema.nspname = 'public'
      AND relation.relname IN (${tableList})
      AND (privilege.grantee = 0 OR grantee.rolname = 'anon')
  `, '0', 'anon-table-grants')
  scalar(`
    SELECT count(*)::text
    FROM pg_catalog.pg_class AS relation
    JOIN pg_catalog.pg_namespace AS schema ON schema.oid = relation.relnamespace
    CROSS JOIN LATERAL pg_catalog.aclexplode(
      COALESCE(relation.relacl, pg_catalog.acldefault('r', relation.relowner))
    ) AS privilege
    JOIN pg_catalog.pg_roles AS grantee ON grantee.oid = privilege.grantee
    WHERE schema.nspname = 'public'
      AND relation.relname IN ('group_members', 'group_audit_events', 'users', 'iso_4217_currency_codes',
                               'events', 'expenses', 'settlements', 'exchange_rates', 'todos')
      AND grantee.rolname = 'authenticated'
  `, '0', 'authenticated-direct-table-denial')
  scalar(`
    SELECT count(*)::text
    FROM pg_catalog.pg_class AS relation
    JOIN pg_catalog.pg_namespace AS schema ON schema.oid = relation.relnamespace
    CROSS JOIN LATERAL pg_catalog.aclexplode(
      COALESCE(relation.relacl, pg_catalog.acldefault('r', relation.relowner))
    ) AS privilege
    JOIN pg_catalog.pg_roles AS grantee ON grantee.oid = privilege.grantee
    WHERE schema.nspname = 'public'
      AND relation.relname IN ('groups', 'group_configurations')
      AND privilege.privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
      AND grantee.rolname = 'authenticated'
  `, '0', 'group-configuration-write-denial')
  scalar(`
    SELECT count(*)::text FROM pg_catalog.pg_indexes
    WHERE schemaname = 'public' AND indexname = 'group_members_active_profile_group_role_idx'
  `, '1', 'required-membership-index')
  scalar(`
    SELECT count(*)::text FROM pg_catalog.pg_indexes
    WHERE schemaname = 'public'
      AND indexname IN ('group_members_active_profile_group_role_idx', 'group_members_active_owner_profile_group_idx')
  `, '1', 'membership-index-inventory')
  scalar(`
    SELECT count(*)::text
    FROM pg_catalog.pg_trigger
    WHERE NOT tgisinternal AND tgname ILIKE '%ir007%'
  `, '0', 'new-trigger-inventory')
}

function executeLaneBAssertion({ actor, sql, transaction }) {
  if (!actor || typeof actor !== 'object' || !['anon', 'authenticated', null].includes(actor.dbRole)) {
    throw new Error('ir007-lane-b-actor-interface-invalid')
  }
  if (typeof sql !== 'string' || transaction !== 'rollback') {
    throw new Error('ir007-lane-b-assertion-interface-invalid')
  }
  if (actor.authUserId !== null && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actor.authUserId)) {
    throw new Error('ir007-lane-b-auth-user-interface-invalid')
  }
  const roleStatement = actor.dbRole ? `SET LOCAL ROLE ${actor.dbRole};` : ''
  const authStatement = actor.authUserId
    ? `SET LOCAL request.jwt.claim.sub = '${actor.authUserId}';`
    : ''
  const options = psqlOptions()
  const result = spawnSync('psql', [...options.args, '--command', `
    BEGIN;
    ${roleStatement}
    ${authStatement}
    ${sql}
    ROLLBACK;
  `], { cwd: repositoryRoot, encoding: 'utf8', env: options.env })
  if (result.error || result.status !== 0) return { ok: false }
  return { ok: true, scalar: result.stdout.trim() }
}

async function invokeLaneBMatrix() {
  const module = await import('./cases/run-rls-ownership-cases.mjs')
  if (
    typeof module.runRlsOwnershipCases !== 'function' ||
    typeof module.assertRlsOwnershipResults !== 'function'
  ) {
    throw new Error('ir007-lane-b-runner-interface-missing')
  }
  runPsqlFile(laneBFixturePath)
  const results = await module.runRlsOwnershipCases(Object.freeze({ execute: executeLaneBAssertion }))
  const passed = module.assertRlsOwnershipResults(results)
  if (!Array.isArray(passed) || passed.length !== 40) throw new Error('ir007-lane-b-runner-result-invalid')
  return Object.freeze({
    caseCount: passed.length,
    results: passed.map(({ caseId, expected, actual, assertionCount }) => ({
      caseId,
      expected,
      actual,
      assertionCount,
    })),
  })
}

function generateTypes(pass) {
  const output = run('npx', [
    '--no-install', 'supabase', 'gen', 'types', 'typescript', '--local', '--schema', 'public', '--workdir', stackWorkdir,
  ], { capture: true }).replace(/\n\n$/u, '\n')
  if (!output.includes('get_group_roster') || !output.includes('get_group_audit_summary')) {
    throw new Error('ir007-generated-types-missing-projections')
  }
  if (pass === 1) writeImmutableArtifact('database.types.pass-1.ts', output)
  writeStage(`type-generation-pass-${pass}`, {
    cliVersion: safeCliVersion(),
    schema: 'public',
    migrationChecksums: Object.fromEntries(migrationPaths().map((path) => [path.split('/').pop(), digest(readFileSync(path))])),
    generatedTypeChecksum: digest(output),
    sourceWrite: 'lane-d-owned',
  })
  return output
}

function emptyTargetRollback() {
  runPsql(`
    DELETE FROM public.group_audit_events;
    DELETE FROM public.group_configurations;
    DELETE FROM public.group_members;
    DELETE FROM public.profiles;
    DELETE FROM public.groups;
    DELETE FROM auth.users WHERE id = '20000000-0000-4000-8000-000000000001'::uuid;
  `)
  scalar(`
    SELECT (
      (SELECT count(*) FROM public.group_audit_events)
      + (SELECT count(*) FROM public.group_configurations)
      + (SELECT count(*) FROM public.group_members)
      + (SELECT count(*) FROM public.profiles)
      + (SELECT count(*) FROM public.groups)
    )::text
  `, '0', 'empty-target-before-rollback')
  runPsqlFile(rollbackSqlPath)
  scalar(`
    SELECT count(*)::text FROM pg_catalog.pg_policies
    WHERE schemaname = 'public' AND policyname IN (${legacyPermissivePolicies.map((name) => `'${name}'`).join(',')})
  `, '0', 'rollback-legacy-permissive-policies')
  scalar(`
    SELECT (
      (SELECT count(*) FROM pg_catalog.pg_namespace WHERE nspname = 'ir007_private')
      + (SELECT count(*) FROM pg_catalog.pg_proc JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
         WHERE pg_namespace.nspname = 'public' AND pg_proc.proname IN ('get_group_roster', 'get_group_audit_summary'))
      + (SELECT count(*) FROM pg_catalog.pg_policies WHERE schemaname = 'public'
         AND policyname IN ('profiles_update_own_presentation', 'groups_select_active_member', 'group_configurations_select_active_member'))
      + (SELECT count(*) FROM pg_catalog.pg_policies WHERE schemaname = 'public'
         AND policyname = 'profiles_select_own_linked_profile')
    )::text
  `, '1', 'rollback-ir007-object-removal')
  scalar(`
    SELECT count(*)::text
    FROM pg_catalog.pg_class JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_class.relnamespace
    WHERE pg_namespace.nspname = 'public' AND pg_class.relname IN (${scopedTables.map((name) => `'${name}'`).join(',')})
      AND pg_class.relrowsecurity
  `, '12', 'rollback-fail-closed-rls')
  writeStage('empty-target-rollback', {
    targetRows: 0,
    permissiveLegacyPolicies: 'absent',
    rollbackDisposition: 'fail-closed',
  })
}

function scanRetainedArtifacts() {
  const entries = readdirSync(artifactDirectory, { withFileTypes: true })
  if (entries.some((entry) => !entry.isFile() || entry.isSymbolicLink())) {
    throw new Error('refusing-unsafe-ir007-artifact-entry')
  }
  for (const entry of entries) {
    assertSafeEvidenceText(entry.name)
    assertSafeEvidenceText(readFileSync(resolve(artifactDirectory, entry.name), 'utf8'))
  }
  return entries.length
}

try {
  assertArtifactDirectory()
  requireTool('docker', ['--version'])
  requireTool('psql', ['--version'])
  safeCliVersion()

  startStack()
  applyAllMigrations()
  writeStage('clean-application', {
    migrations: expectedMigrationNames,
    endpoints: localEndpoints,
    application: 'manual-001-through-009',
  })
  assertCatalogue()
  writeStage('schema-policy-function-grant-catalogue', {
    tables: scopedTables,
    policies: [
      'profiles_select_own_linked_profile',
      'profiles_update_own_presentation',
      'groups_select_active_member',
      'group_configurations_select_active_member',
    ],
    approvedFunctions: [
      'ir007_private.current_profile_id',
      'ir007_private.current_active_group_ids',
      'ir007_private.current_active_owner_group_ids',
      'public.get_group_roster',
      'public.get_group_audit_summary',
    ],
    grants: 'authenticated-minimum-anon-none',
    legacyPermissivePolicies: 'absent',
    triggersAdded: 0,
  })
  const initialMatrix = await invokeLaneBMatrix()
  writeStage('adversarial-matrix', {
    caseCount: initialMatrix.caseCount,
    runner: 'lane-b-import',
    results: initialMatrix.results,
  })
  const performance = runIr007PerformanceProbes({ executeSql: runPsql, explainSql: runPsql })
  writeStage('performance-probes', performance)
  const firstTypes = generateTypes(1)
  emptyTargetRollback()
  stopStack()

  startStack()
  applyAllMigrations()
  assertCatalogue()
  const reapplicationMatrix = await invokeLaneBMatrix()
  writeStage('clean-reapplication', {
    migrations: expectedMigrationNames,
    catalogue: 'passed',
    adversarialMatrixCaseCount: reapplicationMatrix.caseCount,
  })
  const secondTypes = generateTypes(2)
  if (firstTypes !== secondTypes) throw new Error('ir007-generated-types-not-byte-identical')
  writeStage('type-comparison', { comparison: 'byte-identical', checksum: digest(secondTypes) })
  stopStack()
  cleanLocalCliState()
  const cleanup = assertIr007DockerAbsent()
  writeStage('cleanup', {
    exactProjectResources: 'absent',
    consecutiveObservations: 2,
    observedAtAttempt: cleanup.observedAtAttempt,
  })
  const filesScanned = scanRetainedArtifacts()
  writeStage('secret-safety', { filesScanned, unsafeFindings: 0, result: 'passed' })
  run(process.execPath, ['tests/evidence/write-ir-007-evidence-manifest.mjs'], {
    env: { ...process.env, IR007_EVIDENCE_RUN_ID: runId },
  })
  console.log(JSON.stringify({ capability: 'ir-007-rls-ownership', result: 'passed', runId }))
} catch (error) {
  try {
    stopStack()
    cleanLocalCliState()
  } catch {
    // Do not expose command output or local environment details in evidence logs.
  }
  const candidate = error instanceof Error ? error.message : ''
  const reason = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate)
    ? candidate
    : 'authorised-local-command-failed'
  console.error(JSON.stringify({ capability: 'ir-007-rls-ownership', result: 'failed-safely', reason }))
  process.exitCode = 1
}
