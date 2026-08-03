import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import test from 'node:test'

const BASELINE_SHA = '3d4ac573b8bcdcf0f80569bfacc5b683c554df0d'
const migrationDirectory = 'supabase/migrations'
const migrationFile = '009_ir007_base_rls_ownership.sql'
const migrationPath = join(migrationDirectory, migrationFile)
const migrationAvailable = existsSync(migrationPath)
const migration = migrationAvailable ? readFileSync(migrationPath, 'utf8') : null

const protectedTables = [
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
]

const legacyPolicies = [
  ['events', 'group_read_events'],
  ['events', 'group_insert_events'],
  ['events', 'group_update_events'],
  ['events', 'group_delete_events'],
  ['expenses', 'group_read_expenses'],
  ['expenses', 'group_insert_expenses'],
  ['expenses', 'group_update_expenses'],
  ['expenses', 'group_delete_expenses'],
  ['settlements', 'group_read_settlements'],
  ['settlements', 'group_insert_settlements'],
  ['settlements', 'group_update_settlements'],
  ['exchange_rates', 'group_read_rates'],
  ['exchange_rates', 'group_insert_rates'],
  ['todos', 'todos_public'],
]

const migrationHashes = {
  '001_initial.sql': '370f0e89c718645b0d419a476fa4404f2d9339df5f2286ba2184264f67912b79',
  '002_tickets_bucket.sql': '055abed5cf8a04ef04030b5f34ae3e1b2e3e2caa4efe4b8054f6d4d40cb3ff0a',
  '003_gmap_url.sql': 'f3d0c67e74bc5ef015bcac0f6292c156d00a414501fdadd32634c6c218007ba7',
  '004_paid_by_splits.sql': '8042533554f97ae6e929bef784d2a9b43531abd3af846b7d1317297733f40f41',
  '005_todos.sql': '96181aeb519d2ad723fae0300a7ecb0f0067fbbb757fef06631b3fda22b0c601',
  '006_ir002_tenant_root.sql': 'cb330e8b9f993bd3f8a633b4c9a931cd82af8438b384c4156e50ddf6dd214c26',
  '007_ir002_configuration_archive_audit.sql': '17ad0e96bc2597b59cd31325cb4f4ce2968048bc8a511de93ffb6fc4e88bb338',
  '008_ir004_profile_auth.sql': 'fd8775bc1a666d01424e4537ef4b5e6715dd2c171199f7d34d12fb5f9be40190',
}

const authorisedChangedPaths = new Set([
  migrationPath,
  'src/lib/database.types.ts',
  'tests/unit/ir-007-rls-ownership-matrix.test.mjs',
  'tests/unit/ir-007-static-contract.test.mjs',
  'tests/evidence/write-ir-007-evidence-manifest.mjs',
  'package.json',
  'docs/implementation-execution/authorisations/IR-007-authorisation.md',
  'docs/implementation-execution/packets/IR-007-rls-and-ownership.md',
  'docs/implementation-execution/database-migration-register.md',
  'docs/implementation-execution/gate-ledger.md',
  'docs/implementation-execution/change-control.md',
  'docs/implementation-execution/execution-order.md',
  'docs/implementation-execution/dependency-map.md',
  'docs/implementation-execution/repository-change-map.md',
  'docs/implementation-execution/implementation-traceability.md',
  'docs/implementation-execution/waves/W2-auth-and-security-foundation.md',
  'docs/implementation-execution/README.md',
])

function normalizeSql(sql) {
  return sql.replace(/--[^\n]*/g, ' ').replace(/\s+/g, ' ').trim()
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function migrationContractTest(name, callback) {
  test(name, { skip: !migrationAvailable && `requires ${migrationPath}` }, () => {
    callback(migration)
  })
}

function functionDefinition(sql, name) {
  const expression = new RegExp(
    `CREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\s+${escapeRegExp(name)}\\s*\\([\\s\\S]*?\\bAS\\s+\\$[A-Za-z0-9_]*\\$[\\s\\S]*?\\$[A-Za-z0-9_]*\\$\\s*;`,
    'i',
  )
  const definition = sql.match(expression)?.[0]
  assert.ok(definition, `missing complete definition for ${name}`)
  return definition
}

function createdNames(sql, kind) {
  const expression = new RegExp(
    `\\bCREATE\\s+(?:OR\\s+REPLACE\\s+)?${kind}\\s+([A-Za-z0-9_.]+)`,
    'gi',
  )
  return [...sql.matchAll(expression)].map((match) => match[1].toLowerCase()).sort()
}

function assertFixedSearchPathSqlFunction(sql, name) {
  const definition = functionDefinition(sql, name)
  assert.match(definition, /\bLANGUAGE\s+sql\b/i, `${name} must be LANGUAGE sql`)
  assert.match(definition, /\bSTABLE\b/i, `${name} must be STABLE`)
  assert.match(definition, /\bSECURITY\s+DEFINER\b/i, `${name} must be SECURITY DEFINER`)
  assert.match(
    definition,
    /\bSET\s+search_path\s*=\s*pg_catalog\b/i,
    `${name} must use the fixed pg_catalog search path`,
  )
  assert.doesNotMatch(
    definition,
    /\b(?:EXECUTE\s+IMMEDIATE|PREPARE|DEALLOCATE|format\s*\(|quote_ident\s*\(|quote_literal\s*\()/i,
    `${name} must use static SQL only`,
  )
  return definition
}

function assertRoleRevoke(sql, resource, role) {
  const expression = new RegExp(
    `\\bREVOKE\\s+ALL(?:\\s+PRIVILEGES)?\\s+ON\\s+${escapeRegExp(resource)}\\s+FROM\\s+[^;]*\\b${role}\\b`,
    'i',
  )
  assert.match(sql, expression, `${resource} must revoke access from ${role}`)
}

function changedPathsSinceBaseline() {
  const tracked = execFileSync('git', ['diff', '--name-only', BASELINE_SHA], {
    encoding: 'utf8',
  })
  const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], {
    encoding: 'utf8',
  })
  return [...new Set(`${tracked}\n${untracked}`.split('\n').filter(Boolean))].sort()
}

function readBaselinePackage() {
  return JSON.parse(execFileSync('git', ['show', `${BASELINE_SHA}:package.json`], {
    encoding: 'utf8',
  }))
}

function readSourceTree(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? readSourceTree(path) : [readFileSync(path, 'utf8')]
  }).join('\n')
}

test('IR-007 reserves exactly the DBM-006 migration filename and no alternate IR-007 migration', () => {
  assert.equal(
    migrationAvailable,
    true,
    `missing required frozen migration: ${migrationPath}`,
  )
  const ir007Migrations = readdirSync(migrationDirectory)
    .filter((name) => /ir[-_]?007/i.test(name))
    .sort()
  assert.deepEqual(ir007Migrations, [migrationFile])
})

migrationContractTest('IR-007 creates only the frozen private schema and helper inventory', (sql) => {
  const normalized = normalizeSql(sql)
  assert.deepEqual(createdNames(normalized, 'SCHEMA'), ['ir007_private'])
  assert.deepEqual(createdNames(normalized, 'FUNCTION'), [
    'ir007_private.current_active_group_ids',
    'ir007_private.current_active_owner_group_ids',
    'ir007_private.current_profile_id',
    'public.get_group_audit_summary',
    'public.get_group_roster',
  ])

  assert.match(
    normalized,
    /create (?:or replace )?function ir007_private\.current_profile_id\(\) returns uuid\b/i,
  )
  assert.match(
    normalized,
    /create (?:or replace )?function ir007_private\.current_active_group_ids\(\) returns setof uuid\b/i,
  )
  assert.match(
    normalized,
    /create (?:or replace )?function ir007_private\.current_active_owner_group_ids\(\) returns setof uuid\b/i,
  )
})

migrationContractTest('IR-007 helper and projection definitions use fixed search paths and static SQL', (sql) => {
  const profileHelper = assertFixedSearchPathSqlFunction(sql, 'ir007_private.current_profile_id')
  const membershipHelper = assertFixedSearchPathSqlFunction(sql, 'ir007_private.current_active_group_ids')
  const ownerHelper = assertFixedSearchPathSqlFunction(sql, 'ir007_private.current_active_owner_group_ids')
  const rosterProjection = assertFixedSearchPathSqlFunction(sql, 'public.get_group_roster')
  const auditProjection = assertFixedSearchPathSqlFunction(sql, 'public.get_group_audit_summary')

  assert.match(profileHelper, /\bauth\.uid\s*\(\s*\)/i)
  assert.match(profileHelper, /\bpublic\.profiles\b/i)
  assert.match(membershipHelper, /\bpublic\.group_members\b/i)
  assert.match(membershipHelper, /\bpublic\.groups\b/i)
  assert.match(membershipHelper, /\bstatus\s*=\s*'active'/i)
  assert.match(membershipHelper, /\barchived_at\s+is\s+null\b/i)
  assert.match(ownerHelper, /\brole\s*=\s*'owner'/i)
  assert.match(ownerHelper, /\bstatus\s*=\s*'active'/i)
  assert.match(ownerHelper, /\barchived_at\s+is\s+null\b/i)

  assert.match(rosterProjection, /\bir007_private\.current_active_group_ids\s*\(\s*\)/i)
  assert.match(auditProjection, /\bir007_private\.current_active_owner_group_ids\s*\(\s*\)/i)
  for (const definition of [rosterProjection, auditProjection]) {
    assert.match(definition, /\bLEAST\s*\(/i, 'projection must clamp p_limit')
    assert.match(definition, /\bGREATEST\s*\(/i, 'projection must clamp p_limit')
    assert.match(definition, /\bp_limit\b/i, 'projection must use p_limit')
    assert.match(definition, /\b100\b/, 'projection limit upper bound must be 100')
    assert.match(definition, /\b1\b/, 'projection limit lower bound must be 1')
  }

  const normalized = normalizeSql(sql)
  assert.doesNotMatch(
    normalized,
    /\bEXECUTE\s+(?!ON\s+FUNCTION\b)/i,
    'the migration must not contain dynamic SQL execution',
  )
})

migrationContractTest('IR-007 public projections retain their exact narrow signatures', (sql) => {
  const normalized = normalizeSql(sql)
  assert.match(
    normalized,
    /create (?:or replace )?function public\.get_group_roster\(p_group_id uuid, p_limit integer default 100\) returns table \(participant_id uuid, group_id uuid, display_name text, role text, status text\)/i,
  )
  assert.match(
    normalized,
    /create (?:or replace )?function public\.get_group_audit_summary\(p_group_id uuid, p_limit integer default 100\) returns table \(audit_event_id uuid, group_id uuid, actor_participant_id uuid, event_type text, occurred_at timestamptz\)/i,
  )
})

migrationContractTest('IR-007 enables and forces RLS with only the frozen browser policies', (sql) => {
  const normalized = normalizeSql(sql)
  for (const table of protectedTables) {
    assert.match(normalized, new RegExp(`alter table public\\.${table} enable row level security`, 'i'))
    assert.match(normalized, new RegExp(`alter table public\\.${table} force row level security`, 'i'))
  }

  assert.deepEqual(createdNames(normalized, 'POLICY'), [
    'group_configurations_select_active_member',
    'groups_select_active_member',
    'profiles_select_own_linked_profile',
    'profiles_update_own_presentation',
  ])

  const policies = [
    ['profiles_select_own_linked_profile', 'profiles', 'select', 'current_profile_id'],
    ['profiles_update_own_presentation', 'profiles', 'update', 'current_profile_id'],
    ['groups_select_active_member', 'groups', 'select', 'current_active_group_ids'],
    ['group_configurations_select_active_member', 'group_configurations', 'select', 'current_active_group_ids'],
  ]
  for (const [name, table, action, predicate] of policies) {
    const definition = sql.match(new RegExp(
      `CREATE\\s+POLICY\\s+${name}\\s+ON\\s+public\\.${table}[\\s\\S]*?;`,
      'i',
    ))?.[0]
    assert.ok(definition, `missing ${name}`)
    assert.match(definition, new RegExp(`\\bFOR\\s+${action}\\b`, 'i'))
    assert.match(definition, /\bTO\s+authenticated\b/i)
    assert.match(definition, new RegExp(`\\bir007_private\\.${predicate}\\s*\\(`, 'i'))
    assert.doesNotMatch(definition, /\bOR\b/i, `${name} must not broaden its predicate`)
    assert.doesNotMatch(definition, /\b(?:true|1\s*=\s*1)\b/i, `${name} must not be permissive`)
  }

  const updatePolicy = sql.match(/CREATE\s+POLICY\s+profiles_update_own_presentation[\s\S]*?;/i)?.[0]
  assert.match(updatePolicy, /\bUSING\s*\(/i)
  assert.match(updatePolicy, /\bWITH\s+CHECK\s*\(/i)
  assert.doesNotMatch(
    normalized,
    /\b(?:USING|WITH\s+CHECK)\s*\(\s*(?:true|1\s*=\s*1)\s*\)/i,
    'permissive RLS predicates are prohibited',
  )
})

migrationContractTest('IR-007 retires every frozen legacy policy and creates no raw data or trigger access', (sql) => {
  const normalized = normalizeSql(sql)
  for (const [table, policy] of legacyPolicies) {
    assert.match(
      normalized,
      new RegExp(`drop policy(?: if exists)? ${policy} on public\\.${table}`, 'i'),
    )
  }
  assert.doesNotMatch(normalized, /\b(?:CREATE|ALTER|DROP)\s+TRIGGER\b/i)
  assert.doesNotMatch(normalized, /\b(?:storage|realtime)\s*\./i)
  assert.doesNotMatch(normalized, /\bservice[_ -]?role\b/i)
  assert.doesNotMatch(
    normalized,
    /alter table public\.(?:events|expenses|settlements|exchange_rates|todos) add(?: column)?\b/i,
    'IR-007 must not change legacy product-table shape',
  )
})

migrationContractTest('IR-007 installs only the authorised active-membership index definition', (sql) => {
  const normalized = normalizeSql(sql)
  const indexes = [...normalized.matchAll(
    /\bcreate\s+(?:unique\s+)?index(?:\s+if\s+not\s+exists)?\s+([a-z0-9_]+)/gi,
  )].map((match) => match[1]).sort()
  assert.ok(
    indexes.length === 1 || indexes.length === 2,
    'IR-007 may create only the required index and conditional owner index',
  )
  assert.ok(indexes.includes('group_members_active_profile_group_role_idx'))
  assert.ok(indexes.every((name) => [
    'group_members_active_profile_group_role_idx',
    'group_members_active_owner_profile_group_idx',
  ].includes(name)))
  assert.match(
    normalized,
    /create index(?: if not exists)? group_members_active_profile_group_role_idx on public\.group_members \(profile_id, group_id, role\) where profile_id is not null and status = 'active'/i,
  )
  if (indexes.includes('group_members_active_owner_profile_group_idx')) {
    assert.match(
      normalized,
      /create index(?: if not exists)? group_members_active_owner_profile_group_idx on public\.group_members \(profile_id, group_id\) where profile_id is not null and status = 'active' and role = 'owner'/i,
    )
  }
})

migrationContractTest('IR-007 revokes browser access before granting only the frozen minimum', (sql) => {
  const normalized = normalizeSql(sql)
  for (const role of ['PUBLIC', 'anon', 'authenticated']) {
    assertRoleRevoke(normalized, 'SCHEMA ir007_private', role)
  }
  assert.doesNotMatch(normalized, /\bGRANT\s+USAGE\s+ON\s+SCHEMA\s+ir007_private\b/i)

  for (const helper of [
    'ir007_private.current_profile_id',
    'ir007_private.current_active_group_ids',
    'ir007_private.current_active_owner_group_ids',
  ]) {
    for (const role of ['PUBLIC', 'anon']) assertRoleRevoke(normalized, `FUNCTION ${helper}()`, role)
    assert.match(normalized, new RegExp(`grant execute on function ${escapeRegExp(helper)}\\(\\) to authenticated`, 'i'))
  }
  for (const projection of [
    'public.get_group_roster',
    'public.get_group_audit_summary',
  ]) {
    for (const role of ['PUBLIC', 'anon']) {
      assertRoleRevoke(normalized, `FUNCTION ${projection}(uuid, integer)`, role)
    }
    assert.match(
      normalized,
      new RegExp(`grant execute on function ${escapeRegExp(projection)}\\(uuid, integer\\) to authenticated`, 'i'),
    )
  }

  for (const table of protectedTables) {
    for (const role of ['PUBLIC', 'anon', 'authenticated']) {
      assertRoleRevoke(normalized, `TABLE public.${table}`, role)
    }
  }
  assert.match(
    normalized,
    /grant select \(id, display_name\) on table public\.profiles to authenticated/i,
  )
  assert.match(
    normalized,
    /grant update \(display_name\) on table public\.profiles to authenticated/i,
  )
  const authenticatedTableGrants = (table) => [...normalized.matchAll(new RegExp(
    `\\bgrant\\s+(.+?)\\s+on\\s+table\\s+public\\.${table}\\s+to\\s+authenticated\\s*;`,
    'gi',
  ))].map((match) => match[1].trim()).sort()
  assert.deepEqual(authenticatedTableGrants('profiles'), [
    'select (id, display_name)',
    'update (display_name)',
  ])
  assert.deepEqual(authenticatedTableGrants('groups'), ['select'])
  assert.deepEqual(authenticatedTableGrants('group_configurations'), ['select'])
  for (const table of [
    'group_members',
    'group_audit_events',
    'users',
    'iso_4217_currency_codes',
    'events',
    'expenses',
    'settlements',
    'exchange_rates',
    'todos',
  ]) {
    assert.deepEqual(authenticatedTableGrants(table), [], `authenticated must not receive direct ${table} access`)
    assert.doesNotMatch(
      normalized,
      new RegExp(`\\bgrant\\b[^;]*\\bon\\s+table\\s+public\\.${table}\\b[^;]*\\bto\\s+authenticated\\b`, 'i'),
      `authenticated must not receive direct ${table} access`,
    )
  }
  assert.doesNotMatch(normalized, /\bgrant\b[^;]*\bto\s+(?:anon|public)\b/i)
})

test('IR-007 leaves migrations 001 through 008 byte-for-byte unchanged', () => {
  for (const [file, expectedHash] of Object.entries(migrationHashes)) {
    const actualHash = createHash('sha256')
      .update(readFileSync(join(migrationDirectory, file)))
      .digest('hex')
    assert.equal(actualHash, expectedHash, `${file} must remain unchanged`)
  }
})

test('IR-007 package changes are limited to its five dedicated aliases without dependency changes', () => {
  const baseline = readBaselinePackage()
  const current = JSON.parse(readFileSync('package.json', 'utf8'))
  assert.deepEqual(current.dependencies, baseline.dependencies)
  assert.deepEqual(current.devDependencies, baseline.devDependencies)

  const changedScripts = Object.keys({ ...baseline.scripts, ...current.scripts })
    .filter((name) => baseline.scripts[name] !== current.scripts[name])
    .sort()
  assert.deepEqual(changedScripts, [
    'test:ir007',
    'test:ir007:cleanup',
    'test:ir007:evidence',
    'test:ir007:static',
    'test:ir007:unit',
  ])
  assert.equal(
    current.scripts['test:ir007'],
    'npm run test:ir007:unit && npm run test:ir007:static && npm run test:ir007:evidence && npm run test:ir007:cleanup',
  )
  assert.equal(current.scripts['test:ir007:unit'], 'node --test tests/unit/ir-007-rls-ownership-matrix.test.mjs')
  assert.equal(current.scripts['test:ir007:static'], 'node --test tests/unit/ir-007-static-contract.test.mjs')
  assert.equal(current.scripts['test:ir007:evidence'], 'node tests/evidence/write-ir-007-evidence-manifest.mjs')
  assert.equal(current.scripts['test:ir007:cleanup'], 'node tests/database/ir-007/assert-cleanup.mjs')
})

test('IR-007 changes only authorised paths and leaves browser, Storage, and Realtime code untouched', () => {
  const changedPaths = changedPathsSinceBaseline()
  assert.ok(changedPaths.length > 0, 'IR-007 must have an explicit reviewed change set')
  assert.deepEqual(
    changedPaths.filter((path) => !(
      authorisedChangedPaths.has(path)
      || path.startsWith('tests/database/ir-007/')
      || path.startsWith('artifacts/ir-007/')
    )),
    [],
  )
  assert.equal(changedPaths.includes('package-lock.json'), false, 'package-lock.json is prohibited')
  assert.deepEqual(
    changedPaths.filter((path) => path.startsWith('src/') && path !== 'src/lib/database.types.ts'),
    [],
    'IR-007 does not change browser application code',
  )
  assert.deepEqual(
    changedPaths.filter((path) => /(?:^|\/)(?:storage|realtime)(?:\/|$)/i.test(path)),
    [],
    'IR-007 does not change Storage or Realtime assets',
  )
  assert.deepEqual(
    changedPaths.filter((path) => path.startsWith('supabase/functions/')),
    [],
    'IR-007 does not change application functions',
  )

  const browserSource = readSourceTree('src')
  assert.doesNotMatch(browserSource, /\b(?:service_role|SUPABASE_SERVICE_ROLE_KEY)\b/i)
})
