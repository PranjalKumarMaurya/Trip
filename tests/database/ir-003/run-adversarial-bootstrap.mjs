import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = fileURLToPath(new URL('../../..', import.meta.url))
const projectId = 'bachelor-trip-app-ir003-laneb'
const dbPort = '57722'
const apiPort = '57721'
const container = `supabase_db_${projectId}`
const migrations = [
  '001_initial.sql', '002_tickets_bucket.sql', '003_gmap_url.sql', '004_paid_by_splits.sql',
  '005_todos.sql', '006_ir002_tenant_root.sql', '007_ir002_configuration_archive_audit.sql',
  '008_ir004_profile_auth.sql', '009_ir007_base_rls_ownership.sql', '010_ir003_atomic_group_bootstrap.sql',
  '011_ir002_timezone_reference.sql',
]
let stackRoot = ''
let started = false

function assertSafe(value, label = 'value') {
  assert.ok(typeof value === 'string' && !/[\0\r\n]/u.test(value), `unsafe-${label}`)
  return value
}

function command(commandName, args, options = {}) {
  const result = spawnSync(commandName, args, { cwd: repositoryRoot, encoding: 'utf8', ...options })
  if (result.error || result.status !== 0) throw new Error(`${commandName}-failed`)
  return result.stdout
}

function commandResult(commandName, args, options = {}) {
  return spawnSync(commandName, args, { cwd: repositoryRoot, encoding: 'utf8', ...options })
}

function dockerNames(args) {
  return command('docker', args).trim().split('\n').filter(Boolean)
}

function assertNoLaneBResources() {
  const containers = dockerNames(['ps', '--all', '--format', '{{.Names}}'])
    .filter((name) => name.endsWith(`_${projectId}`))
  const volumes = dockerNames(['volume', 'ls', '--format', '{{.Name}}'])
    .filter((name) => name === `supabase_db_${projectId}`)
  assert.deepEqual(containers, [], 'pre-existing-lane-b-containers')
  assert.deepEqual(volumes, [], 'pre-existing-lane-b-volume')
}

function localConfig() {
  return `project_id = "${projectId}"

[api]
enabled = true
port = ${apiPort}

[db]
port = ${dbPort}

[db.pooler]
enabled = false
port = 57729

[realtime]
enabled = false

[studio]
enabled = false
port = 57723

[inbucket]
enabled = false
port = 57724
smtp_port = 57725

[storage]
enabled = true

[auth]
enabled = true

[edge_runtime]
enabled = false

[analytics]
enabled = false
`
}

function start() {
  assertNoLaneBResources()
  stackRoot = mkdtempSync(resolve(tmpdir(), 'ir003-laneb-'))
  command('mkdir', ['-p', resolve(stackRoot, 'supabase')])
  writeFileSync(resolve(stackRoot, 'supabase/config.toml'), localConfig(), 'utf8')
  command('npx', ['--no-install', 'supabase', 'start', '--workdir', stackRoot])
  started = true
}

function stop() {
  if (started) {
    commandResult('npx', ['--no-install', 'supabase', 'stop', '--workdir', stackRoot, '--project-id', projectId, '--no-backup'])
    started = false
  }
  if (stackRoot && existsSync(stackRoot)) rmSync(stackRoot, { recursive: true, force: true })
  stackRoot = ''
  assertNoLaneBResources()
}

function psql(sql, { expectFailure = false, role = 'postgres' } = {}) {
  const result = commandResult('psql', [
    '--no-psqlrc', '--quiet', '--tuples-only', '--no-align', '--set', 'ON_ERROR_STOP=1',
    '--host', '127.0.0.1', '--port', dbPort, '--username', role, '--dbname', 'postgres', '--command', sql,
  ], { env: { ...process.env, PGPASSWORD: 'postgres' } })
  if (expectFailure) {
    assert.notEqual(result.status, 0, 'expected-database-denial')
    return `${result.stdout}\n${result.stderr}`
  }
  if (result.error || result.status !== 0) throw new Error('psql-failed')
  return result.stdout.trim()
}

function psqlFile(path) {
  const result = commandResult('psql', [
    '--no-psqlrc', '--quiet', '--set', 'ON_ERROR_STOP=1', '--host', '127.0.0.1', '--port', dbPort,
    '--username', 'postgres', '--dbname', 'postgres', '--file', path,
  ], { env: { ...process.env, PGPASSWORD: 'postgres' } })
  if (result.error || result.status !== 0) throw new Error('migration-application-failed')
}

function applyMigrations() {
  psqlFile(resolve(repositoryRoot, 'supabase/migrations/001_initial.sql'))
  const baseline = resolve(repositoryRoot, 'tests/database/ir-002/platform-storage-baseline.sql')
  const baselineResult = commandResult('docker', [
    'exec', '--interactive', '--user', 'postgres', container, 'psql', '--no-psqlrc', '--quiet',
    '--set', 'ON_ERROR_STOP=1', '--username', 'supabase_admin', '--dbname', 'postgres',
  ], { input: readFileSync(baseline, 'utf8') })
  if (baselineResult.error || baselineResult.status !== 0) throw new Error('platform-storage-baseline-failed')
  psqlFile(resolve(repositoryRoot, 'supabase/migrations/002_tickets_bucket.sql'))
  for (const migration of migrations.slice(2, 9)) psqlFile(resolve(repositoryRoot, 'supabase/migrations', migration))
  const migration010 = commandResult('docker', [
    'exec', '--interactive', '--user', 'postgres', container, 'psql', '--no-psqlrc', '--quiet',
    '--set', 'ON_ERROR_STOP=1', '--username', 'supabase_admin', '--dbname', 'postgres',
  ], { input: readFileSync(resolve(repositoryRoot, 'supabase/migrations/010_ir003_atomic_group_bootstrap.sql'), 'utf8') })
  if (migration010.error || migration010.status !== 0) throw new Error('migration-010-application-failed')
  const migration011 = commandResult('docker', [
    'exec', '--interactive', '--user', 'postgres', container, 'psql', '--no-psqlrc', '--quiet',
    '--set', 'ON_ERROR_STOP=1', '--username', 'supabase_admin', '--dbname', 'postgres',
  ], { input: readFileSync(resolve(repositoryRoot, 'supabase/migrations/011_ir002_timezone_reference.sql'), 'utf8') })
  if (migration011.error || migration011.status !== 0) throw new Error('migration-011-application-failed')
  assert.equal(psql("SELECT public.is_valid_iana_timezone('Asia/Kolkata')::text"), 'true')
  assert.equal(psql("SELECT public.is_valid_iana_timezone('asia/kolkata')::text"), 'false')
  assert.equal(psql("SELECT public.is_valid_iana_timezone('Asia/Calcutta')::text"), 'true')
}

function quote(value) {
  return `'${String(value).replaceAll("'", "''")}'`
}

function query(sql) {
  return psql(sql)
}

function scalar(sql) {
  return query(sql).split('\n').filter(Boolean).at(-1) ?? ''
}

function counts() {
  return JSON.parse(scalar(`SELECT json_build_object(
    'groups', (SELECT count(*) FROM public.groups),
    'configurations', (SELECT count(*) FROM public.group_configurations),
    'display_rows', (SELECT count(*) FROM public.group_configuration_display_currencies),
    'memberships', (SELECT count(*) FROM public.group_members),
    'audits', (SELECT count(*) FROM public.group_audit_events),
    'requests', (SELECT count(*) FROM public.ir003_bootstrap_requests)
  )::text;`))
}

function assertNoStateChange(before, label) {
  assert.deepEqual(counts(), before, `${label}-must-not-commit-state`)
}

function actorSql(actorId, body) {
  const sub = actorId === null ? '' : actorId
  return `BEGIN; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claim.sub', ${quote(sub)}, true); ${body}; COMMIT;`
}

function bootstrapSql(group, configuration, requestId) {
  return `SELECT outcome || '|' || group_id || '|' || request_id FROM public.bootstrap_group(${quote(JSON.stringify(group))}::jsonb, ${quote(JSON.stringify(configuration))}::jsonb, ${quote(requestId)}::uuid)`
}

function bootstrap(actorId, group, configuration, requestId) {
  const output = psql(actorSql(actorId, bootstrapSql(group, configuration, requestId)))
  const line = output.split('\n').filter((entry) => entry.includes('|')).at(-1)
  assert.ok(line, 'missing-bootstrap-result')
  const [outcome, groupId, returnedRequestId] = line.split('|')
  return { outcome, groupId, requestId: returnedRequestId }
}

function bootstrapFailure(actorId, group, configuration, requestId, expected) {
  const output = psql(actorSql(actorId, bootstrapSql(group, configuration, requestId)), { expectFailure: true })
  assert.match(output, new RegExp(`\\b${expected}\\b`, 'u'), `expected-${expected}`)
  assert.doesNotMatch(output, /ir003_top001_executor|auth_user_id|actor_profile_id|group_audit_events_request_id_key/u, 'error-must-not-leak-internals')
}

function validPayload(label) {
  return {
    group: { trip_name: `Synthetic ${label}` },
    configuration: {
      destination: 'Kochi', start_date: '2026-10-03', end_date: '2026-10-07', timezone: 'Asia/Kolkata',
      accounting_currency: 'INR', display_currency_codes: ['INR', 'USD'],
    },
  }
}

function fixtureId(suite, suffix) {
  return `00000000-0000-4000-8000-${String(suite).padStart(2, '0')}00000000${suffix}`
}

function createFixtures(suite) {
  const actors = {
    a: fixtureId(suite, 'a1'), b: fixtureId(suite, 'b1'), unconfirmed: fixtureId(suite, 'c1'), missing: fixtureId(suite, 'd1'), unknown: fixtureId(suite, 'e1'),
  }
  const values = [
    [actors.a, 'confirmed-a'], [actors.b, 'confirmed-b'], [actors.unconfirmed, 'unconfirmed'], [actors.missing, 'missing-profile'],
  ].map(([id, label]) => `(${quote(id)}::uuid, 'authenticated', 'authenticated', ${quote(`${label}-${suite}@example.test`)}, 'test-only', ${label === 'unconfirmed' ? 'NULL' : 'now()'}, '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Synthetic"}'::jsonb, now(), now())`).join(',')
  query(`INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) VALUES ${values};`)
  query(`DELETE FROM public.profiles WHERE auth_user_id = ${quote(actors.missing)}::uuid;`)
  assert.equal(scalar(`SELECT count(*)::text FROM public.profiles WHERE auth_user_id IN (${quote(actors.a)}::uuid, ${quote(actors.b)}::uuid, ${quote(actors.unconfirmed)}::uuid);`), '3')
  return actors
}

function staticContractChecks() {
  assert.equal(scalar(`SELECT count(*)::text FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname='bootstrap_group';`), '1')
  assert.equal(scalar(`SELECT pronargs::text || '|' || pronargdefaults::text || '|' || pg_get_function_result(oid) FROM pg_proc WHERE oid='public.bootstrap_group(jsonb,jsonb,uuid)'::regprocedure;`), '3|0|TABLE(outcome text, group_id uuid, request_id uuid)')
  assert.equal(scalar(`SELECT count(*)::text FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.proname ILIKE '%bootstrap%' AND has_function_privilege('authenticated', p.oid, 'EXECUTE');`), '1')
  assert.equal(scalar(`SELECT count(*)::text FROM pg_proc WHERE oid='public.ir003_bootstrap_group_impl(jsonb,jsonb,uuid)'::regprocedure;`), '1')
  assert.equal(scalar(`SELECT count(*)::text FROM pg_constraint WHERE conname='group_audit_events_request_id_key';`), '0')
  assert.equal(scalar(`SELECT count(*)::text FROM pg_class c JOIN pg_index i ON i.indexrelid=c.oid WHERE c.oid='public.group_audit_events_request_id_idx'::regclass AND NOT i.indisunique;`), '1')
  assert.equal(scalar(`SELECT count(*)::text FROM information_schema.columns WHERE table_schema='public' AND table_name='group_audit_events' AND column_name='request_id';`), '1')
  assert.equal(scalar(`SELECT count(*)::text FROM pg_constraint WHERE conrelid='public.group_audit_events'::regclass AND contype='f';`), '2')
  assert.equal(scalar(`SELECT count(*)::text FROM pg_constraint WHERE conrelid='public.ir003_bootstrap_requests'::regclass AND conname='ir003_bootstrap_requests_pkey' AND pg_get_constraintdef(oid) LIKE '%operation, actor_profile_id, request_id%';`), '1')
  const posture = scalar(`SELECT (SELECT r.rolname FROM pg_proc p JOIN pg_roles r ON r.oid=p.proowner WHERE p.oid='public.bootstrap_group(jsonb,jsonb,uuid)'::regprocedure) || '|' || (SELECT prosecdef FROM pg_proc WHERE oid='public.bootstrap_group(jsonb,jsonb,uuid)'::regprocedure) || '|' || (SELECT array_to_string(proconfig, ',') FROM pg_proc WHERE oid='public.bootstrap_group(jsonb,jsonb,uuid)'::regprocedure) || '|' || (SELECT count(*) FROM pg_auth_members m WHERE m.roleid='ir003_top001_executor'::regrole AND m.member IN ('anon'::regrole, 'authenticated'::regrole, 'service_role'::regrole));`)
  assert.equal(posture, 'ir003_top001_executor|true|search_path=pg_catalog|0')
  for (const role of ['public', 'anon', 'authenticated', 'service_role']) {
    assert.equal(scalar(`SELECT has_function_privilege(${quote(role)}, 'public.ir003_bootstrap_group_impl(jsonb,jsonb,uuid)'::regprocedure, 'EXECUTE')::text;`), 'false')
  }
  assert.equal(scalar(`SELECT has_function_privilege('authenticated', 'public.bootstrap_group(jsonb,jsonb,uuid)'::regprocedure, 'EXECUTE')::text;`), 'true')
}

function directHelperDenials(actors) {
  for (const role of ['anon', 'authenticated', 'service_role']) {
    const output = psql(`BEGIN; SET LOCAL ROLE ${role}; SELECT * FROM public.ir003_bootstrap_group_impl('{}'::jsonb, '{}'::jsonb, ${quote(randomUUID())}::uuid); ROLLBACK;`, { expectFailure: true })
    assert.match(output, /permission denied/u, `${role}-helper-denial`)
  }
  const payload = validPayload('shadow')
  const result = bootstrap(actors.a, payload.group, payload.configuration, randomUUID())
  assert.equal(result.outcome, 'completed')
  const shadow = psql(actorSql(actors.a, `CREATE TEMP TABLE groups (id uuid); ${bootstrapSql({ trip_name: 'Synthetic shadow attack' }, payload.configuration, randomUUID())}`))
  assert.match(shadow, /completed\|/u, 'qualified-references-resist-search-path-shadowing')
}

function authAndValidationDenials(actors) {
  const payload = validPayload('validation')
  const cases = [
    [null, payload.group, payload.configuration, 'not_authenticated'],
    [actors.unknown, payload.group, payload.configuration, 'auth_not_verified'],
    [actors.unconfirmed, payload.group, payload.configuration, 'auth_not_verified'],
    [actors.missing, payload.group, payload.configuration, 'profile_unavailable'],
    [actors.a, null, payload.configuration, 'invalid_request'],
    [actors.a, ['array'], payload.configuration, 'invalid_request'],
    [actors.a, {}, payload.configuration, 'invalid_request'],
    [actors.a, { trip_name: null }, payload.configuration, 'invalid_request'],
    [actors.a, { trip_name: '   ' }, payload.configuration, 'invalid_request'],
    [actors.a, payload.group, null, 'invalid_request'],
    [actors.a, payload.group, [], 'invalid_request'],
    [actors.a, payload.group, {}, 'invalid_request'],
    [actors.a, payload.group, { ...payload.configuration, destination: ' ' }, 'invalid_request'],
    [actors.a, payload.group, { ...payload.configuration, start_date: 'not-a-date' }, 'invalid_request'],
    [actors.a, payload.group, { ...payload.configuration, start_date: '2026-02-30' }, 'invalid_request'],
    [actors.a, payload.group, { ...payload.configuration, end_date: '2026-10-01' }, 'invalid_request'],
    [actors.a, payload.group, { ...payload.configuration, timezone: 'Mars/Olympus' }, 'invalid_request'],
    [actors.a, payload.group, { ...payload.configuration, timezone: 'asia/kolkata' }, 'invalid_request'],
    [actors.a, payload.group, { ...payload.configuration, accounting_currency: 'ZZZ', display_currency_codes: ['ZZZ'] }, 'invalid_request'],
    [actors.a, payload.group, { ...payload.configuration, display_currency_codes: [] }, 'invalid_request'],
    [actors.a, payload.group, { ...payload.configuration, display_currency_codes: ['INR', 'INR'] }, 'invalid_request'],
    [actors.a, payload.group, { ...payload.configuration, display_currency_codes: ['INR', 'QQQ'] }, 'invalid_request'],
    [actors.a, payload.group, { ...payload.configuration, display_currency_codes: ['USD'] }, 'invalid_request'],
  ]
  for (const [actor, group, configuration, expected] of cases) {
    const before = counts()
    bootstrapFailure(actor, group, configuration, randomUUID(), expected)
    assertNoStateChange(before, expected)
  }
  for (const field of ['actor', 'actor_id', 'auth_user_id', 'profile_id', 'owner_id', 'owner', 'role', 'group_owner', 'recorder', 'uploader']) {
    const before = counts()
    bootstrapFailure(actors.a, { ...payload.group, [field]: actors.b }, payload.configuration, randomUUID(), 'invalid_request')
    assertNoStateChange(before, `forged-${field}`)
  }
  assert.equal(scalar(`SELECT count(*)::text FROM pg_constraint WHERE conname='profiles_auth_user_id_key';`), '1', 'exactly-one-profile-condition-is-schema-prevented')
}

function directWriteDenial(actors) {
  const before = counts()
  for (const statement of [
    'INSERT INTO public.groups DEFAULT VALUES',
    `INSERT INTO public.group_configurations (group_id, trip_name, destination, start_date, end_date, timezone, accounting_currency) VALUES (${quote(randomUUID())}::uuid, 'x', 'x', '2026-01-01', '2026-01-01', 'Asia/Kolkata', 'INR')`,
    `INSERT INTO public.ir003_bootstrap_requests (operation, actor_profile_id, request_id, request_fingerprint, status) VALUES ('TOP-001', ${quote(randomUUID())}::uuid, ${quote(randomUUID())}::uuid, '{}'::jsonb, 'pending')`,
  ]) {
    const output = psql(actorSql(actors.a, statement), { expectFailure: true })
    assert.match(output, /permission denied|row-level security/u, 'direct-write-must-fail')
  }
  assertNoStateChange(before, 'direct-write')
}

function happyReplayConflict(actors, suite) {
  const payload = validPayload(`happy-${suite}`)
  const requestId = randomUUID()
  const before = counts()
  const first = bootstrap(actors.a, payload.group, payload.configuration, requestId)
  assert.equal(first.outcome, 'completed')
  assert.equal(first.requestId, requestId)
  const after = counts()
  assert.deepEqual({
    groups: after.groups - before.groups, configurations: after.configurations - before.configurations,
    display_rows: after.display_rows - before.display_rows, memberships: after.memberships - before.memberships,
    audits: after.audits - before.audits, requests: after.requests - before.requests,
  }, { groups: 1, configurations: 1, display_rows: 2, memberships: 1, audits: 1, requests: 1 })
  assert.equal(scalar(`SELECT role || '|' || status FROM public.group_members WHERE group_id=${quote(first.groupId)}::uuid;`), 'owner|active')
  const replay = bootstrap(actors.a, { trip_name: `  ${payload.group.trip_name}  ` }, { ...payload.configuration, destination: ` ${payload.configuration.destination} `, display_currency_codes: ['USD', 'INR'] }, requestId)
  assert.deepEqual(replay, first)
  assert.deepEqual(counts(), after, 'normalized-replay-has-no-duplicate-state')
  bootstrapFailure(actors.a, { trip_name: 'Synthetic changed fingerprint' }, payload.configuration, requestId, 'idempotency_conflict')
  assert.deepEqual(counts(), after, 'conflict-preserves-authoritative-result')
  assert.equal(scalar(`SELECT count(*)::text FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('participants', 'invitations', 'invitation_claims');`), '0')
  return { payload, first }
}

function crossActorSameUuid(actors, suite) {
  const requestId = randomUUID()
  const a = validPayload(`cross-a-${suite}`)
  const b = validPayload(`cross-b-${suite}`)
  b.configuration.destination = 'Pune'
  const first = bootstrap(actors.a, a.group, a.configuration, requestId)
  const second = bootstrap(actors.b, b.group, b.configuration, requestId)
  assert.notEqual(first.groupId, second.groupId)
  assert.equal(scalar(`SELECT count(*)::text FROM public.group_audit_events WHERE request_id=${quote(requestId)}::uuid;`), '2')
  assert.equal(scalar(`SELECT count(*)::text FROM public.ir003_bootstrap_requests WHERE request_id=${quote(requestId)}::uuid;`), '2')
  assert.equal(scalar(`SELECT count(DISTINCT group_id)::text FROM public.group_audit_events WHERE request_id=${quote(requestId)}::uuid;`), '2')
  return { first, second }
}

function psqlAsync(sql) {
  return new Promise((resolvePromise) => {
    const child = spawn('psql', [
      '--no-psqlrc', '--quiet', '--tuples-only', '--no-align', '--set', 'ON_ERROR_STOP=1', '--host', '127.0.0.1', '--port', dbPort, '--username', 'postgres', '--dbname', 'postgres', '--command', sql,
    ], { cwd: repositoryRoot, env: { ...process.env, PGPASSWORD: 'postgres' } })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.on('close', (status) => resolvePromise({ status, stdout, stderr }))
  })
}

async function concurrentBootstrap(actorId, group, configuration, requestId) {
  return psqlAsync(actorSql(actorId, bootstrapSql(group, configuration, requestId)))
}

async function concurrency(actors, suite) {
  for (let repeat = 0; repeat < 3; repeat += 1) {
    const same = validPayload(`same-race-${suite}-${repeat}`)
    const sameId = randomUUID()
    const before = counts()
    const responses = await Promise.all([concurrentBootstrap(actors.a, same.group, same.configuration, sameId), concurrentBootstrap(actors.a, same.group, same.configuration, sameId)])
    assert.ok(responses.every((response) => response.status === 0 && /completed\|/u.test(response.stdout)), 'same-payload-race-must-converge')
    const after = counts()
    assert.equal(after.groups - before.groups, 1)
    assert.equal(after.audits - before.audits, 1)
    const changedId = randomUUID()
    const changed = validPayload(`changed-race-${suite}-${repeat}`)
    const changedResponses = await Promise.all([
      concurrentBootstrap(actors.a, changed.group, changed.configuration, changedId),
      concurrentBootstrap(actors.a, { trip_name: `Synthetic changed race ${suite}-${repeat}` }, changed.configuration, changedId),
    ])
    assert.equal(changedResponses.filter((response) => response.status === 0).length, 1, 'one-changed-race-winner')
    assert.equal(changedResponses.filter((response) => /idempotency_conflict/u.test(response.stderr)).length, 1, 'one-changed-race-conflict')
    const crossId = randomUUID()
    const crossA = validPayload(`cross-race-a-${suite}-${repeat}`)
    const crossB = validPayload(`cross-race-b-${suite}-${repeat}`)
    crossB.configuration.destination = 'Pune'
    const crossResponses = await Promise.all([concurrentBootstrap(actors.a, crossA.group, crossA.configuration, crossId), concurrentBootstrap(actors.b, crossB.group, crossB.configuration, crossId)])
    assert.ok(crossResponses.every((response) => response.status === 0 && /completed\|/u.test(response.stdout)), 'cross-actor-race-must-not-collide')
    assert.equal(scalar(`SELECT count(*)::text FROM public.group_audit_events WHERE request_id=${quote(crossId)}::uuid;`), '2')
    assert.equal(scalar(`SELECT count(*)::text FROM public.ir003_bootstrap_requests WHERE request_id=${quote(crossId)}::uuid;`), '2')
  }
}

function rollback(actors, suite) {
  const payload = validPayload(`rollback-${suite}`)
  const requestId = randomUUID()
  const before = counts()
  const output = psql(actorSql(actors.a, `${bootstrapSql(payload.group, payload.configuration, requestId)}; DO $$ BEGIN RAISE EXCEPTION 'test-only-injected-rollback'; END $$`), { expectFailure: true })
  assert.match(output, /test-only-injected-rollback/u)
  assertNoStateChange(before, 'injected-rollback')
  assert.equal(scalar(`SELECT count(*)::text FROM public.ir003_bootstrap_requests WHERE request_id=${quote(requestId)}::uuid;`), '0')
  assert.equal(bootstrap(actors.a, payload.group, payload.configuration, requestId).outcome, 'completed')
}

async function runSuite(suite) {
  const actors = createFixtures(suite)
  staticContractChecks()
  directHelperDenials(actors)
  authAndValidationDenials(actors)
  directWriteDenial(actors)
  const happy = happyReplayConflict(actors, suite)
  const cross = crossActorSameUuid(actors, suite)
  assert.notEqual(happy.first.groupId, cross.first.groupId, 'cross-actor-cannot-replay-another-actor-result')
  await concurrency(actors, suite)
  rollback(actors, suite)
  assert.equal(scalar(`SELECT count(*)::text FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('invitations', 'invitation_claims', 'finance_lifecycles', 'storage_objects', 'realtime_events');`), '0', 'later-scope-tables-absent')
}

try {
  command('docker', ['--version'])
  command('psql', ['--version'])
  command('npx', ['--no-install', 'supabase', '--version'])
  start()
  applyMigrations()
  await runSuite(1)
  await runSuite(2)
  stop()
  console.log(JSON.stringify({ capability: 'ir-003-adversarial-bootstrap', result: 'passed', completeSuiteRepetitions: 2, raceRepetitionsPerSuite: 3 }))
} catch (error) {
  try { stop() } catch { /* preserve the original safe failure */ }
  const message = error instanceof Error && /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(error.message) ? error.message : 'lane-b-adversarial-suite-failed'
  console.error(JSON.stringify({ capability: 'ir-003-adversarial-bootstrap', result: 'failed-safely', reason: message }))
  process.exitCode = 1
}
