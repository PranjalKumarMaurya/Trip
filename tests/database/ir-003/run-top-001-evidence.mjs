import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { spawn, spawnSync } from 'node:child_process'
import {
  chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const config = fileURLToPath(new URL('./local-stack/supabase/config.toml', import.meta.url))
const projectId = 'bachelor-trip-app-ir003-lanec'
const dbPort = '58022'
const container = `supabase_db_${projectId}`
const evidenceRoot = process.env.IR003_EVIDENCE_ROOT ?? '/home/prospero/Work/trip-controlled-evidence/ir-003'
const runId = process.env.IR003_EVIDENCE_RUN_ID ?? `ir003-lanec-${new Date().toISOString().replace(/[:.]/gu, '-')}-${randomUUID()}`
const evidenceDir = resolve(evidenceRoot, runId)
const candidateCommit = command('git', ['rev-parse', 'HEAD']).trim()
const candidateMigration = resolve(root, 'supabase/migrations/010_ir003_atomic_group_bootstrap.sql')
const sharedTimezoneMigration = resolve(root, 'supabase/migrations/011_ir002_timezone_reference.sql')
const laneBHarness = resolve(root, 'tests/database/ir-003/run-adversarial-bootstrap.mjs')
const migrations = [
  '001_initial.sql', '002_tickets_bucket.sql', '003_gmap_url.sql', '004_paid_by_splits.sql', '005_todos.sql',
  '006_ir002_tenant_root.sql', '007_ir002_configuration_archive_audit.sql', '008_ir004_profile_auth.sql',
  '009_ir007_base_rls_ownership.sql', '010_ir003_atomic_group_bootstrap.sql',
  '011_ir002_timezone_reference.sql',
]
const unsafe = [
  /postgres(?:ql)?:\/\//iu,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\b/u,
  /\b(?:password|token|secret|api[_-]?key|service[_-]?role)\s*[:=]/iu,
  /(?:^|[^A-Za-z])(?:\/home\/|\/Users\/|[A-Za-z]:\\)/u,
]
let workdir = ''
let started = false

function command(name, args, options = {}) {
  const result = spawnSync(name, args, { cwd: root, encoding: 'utf8', ...options })
  if (result.error || result.status !== 0) {
    if (process.env.IR003_DEBUG_DB === '1') console.error(`${result.stdout}\n${result.stderr}`)
    throw new Error(`${name}-failed`)
  }
  return result.stdout
}

function commandResult(name, args, options = {}) {
  return spawnSync(name, args, { cwd: root, encoding: 'utf8', ...options })
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function fileHash(path) {
  return sha256(readFileSync(path))
}

function assertCandidate() {
  assert.equal(command('git', ['rev-parse', 'HEAD']).trim(), candidateCommit, 'candidate-commit-changed')
  assert.equal(fileHash(candidateMigration), provenance.migration010Sha256, 'candidate-migration-changed')
  assert.equal(fileHash(sharedTimezoneMigration), provenance.migration011Sha256, 'shared-timezone-migration-changed')
  assert.equal(fileHash(laneBHarness), provenance.laneBHarnessSha256, 'lane-b-harness-changed')
}

function dockerSnapshot() {
  const names = (args) => command('docker', args).trim().split('\n').filter(Boolean)
  return {
    containers: names(['ps', '--all', '--format', '{{.Names}}']).filter((v) => v.endsWith(`_${projectId}`)),
    networks: names(['network', 'ls', '--format', '{{.Name}}']).filter((v) => v === `supabase_network_${projectId}`),
    volumes: names(['volume', 'ls', '--format', '{{.Name}}']).filter((v) => v === `supabase_db_${projectId}`),
  }
}

function assertCleanDocker(label) {
  const actual = dockerSnapshot()
  assert.deepEqual(actual, { containers: [], networks: [], volumes: [] }, label)
}

function mode(path) {
  return statSync(path).mode & 0o777
}

function initializeEvidence() {
  assert.match(runId, /^ir003-lanec-[a-z0-9-]+$/iu, 'unsafe-evidence-run-id')
  assert.equal(resolve(evidenceRoot), '/home/prospero/Work/trip-controlled-evidence/ir-003', 'unapproved-evidence-root')
  mkdirSync(evidenceRoot, { recursive: true, mode: 0o700 })
  chmodSync(evidenceRoot, 0o700)
  assert.equal(mode(evidenceRoot), 0o700, 'controlled-evidence-root-mode')
  assert.ok(!existsSync(evidenceDir), 'existing-evidence-run')
  mkdirSync(evidenceDir, { mode: 0o700 })
  chmodSync(evidenceDir, 0o700)
  assert.equal(mode(evidenceDir), 0o700, 'controlled-evidence-run-mode')
}

function safe(value) {
  const text = JSON.stringify(value)
  if (unsafe.some((pattern) => pattern.test(text))) throw new Error('unsafe-controlled-evidence-content')
  return text
}

function write(name, value) {
  assert.match(name, /^[a-z0-9][a-z0-9-]*\.json$/u, 'unsafe-evidence-name')
  const path = resolve(evidenceDir, name)
  assert.ok(path.startsWith(`${evidenceDir}/`), 'unsafe-evidence-path')
  const serialized = `${JSON.stringify(value, null, 2)}\n`
  safe(value)
  writeFileSync(path, serialized, { encoding: 'utf8', flag: 'wx', mode: 0o600 })
  chmodSync(path, 0o600)
  assert.equal(mode(path), 0o600, `controlled-evidence-file-mode-${name}`)
  return { file: name, sha256: sha256(serialized) }
}

function start() {
  assertCleanDocker('preexisting-lane-c-resources')
  workdir = resolve(tmpdir(), `ir003-lanec-${randomUUID()}`)
  mkdirSync(resolve(workdir, 'supabase'), { recursive: true, mode: 0o700 })
  writeFileSync(resolve(workdir, 'supabase/config.toml'), readFileSync(config, 'utf8'), { mode: 0o600 })
  command('npx', ['--no-install', 'supabase', 'start', '--workdir', workdir])
  started = true
}

function stop() {
  if (started) {
    commandResult('npx', ['--no-install', 'supabase', 'stop', '--workdir', workdir, '--project-id', projectId, '--no-backup'])
    started = false
  }
  if (workdir && existsSync(workdir)) rmSync(workdir, { recursive: true, force: true })
  workdir = ''
  assertCleanDocker('lane-c-cleanup')
}

function psql(sql, { expectFailure = false, capture = true } = {}) {
  const result = commandResult('psql', [
    '--no-psqlrc', '--quiet', '--tuples-only', '--no-align', '--set', 'ON_ERROR_STOP=1',
    '--host', '127.0.0.1', '--port', dbPort, '--username', 'postgres', '--dbname', 'postgres', '--command', sql,
  ], { env: { ...process.env, PGPASSWORD: 'postgres' } })
  const output = `${result.stdout}\n${result.stderr}`.trim()
  if (expectFailure) {
    assert.notEqual(result.status, 0, 'expected-controlled-database-failure')
    return output
  }
  if (result.error || result.status !== 0) {
    if (process.env.IR003_DEBUG_DB === '1') console.error(output)
    throw new Error(`psql-failed-${sha256(sql).slice(0, 12)}`)
  }
  return capture ? output : ''
}

function psqlInput(input, { expectFailure = false, administrator = false } = {}) {
  const args = administrator
    ? ['exec', '--interactive', '--user', 'postgres', container, 'psql', '--no-psqlrc', '--quiet', '--set', 'ON_ERROR_STOP=1', '--username', 'supabase_admin', '--dbname', 'postgres']
    : ['--no-psqlrc', '--quiet', '--set', 'ON_ERROR_STOP=1', '--host', '127.0.0.1', '--port', dbPort, '--username', 'postgres', '--dbname', 'postgres']
  const result = commandResult(administrator ? 'docker' : 'psql', args, {
    input, env: administrator ? process.env : { ...process.env, PGPASSWORD: 'postgres' },
  })
  const output = `${result.stdout}\n${result.stderr}`.trim()
  if (expectFailure) {
    assert.notEqual(result.status, 0, 'expected-controlled-migration-failure')
    return output
  }
  if (result.error || result.status !== 0) throw new Error('migration-application-failed')
  return output
}

function applyPrefix(log) {
  for (const migration of migrations.slice(0, 1)) {
    psqlInput(readFileSync(resolve(root, 'supabase/migrations', migration), 'utf8'))
    log.push({ migration, sha256: fileHash(resolve(root, 'supabase/migrations', migration)), result: 'applied' })
  }
  psqlInput(readFileSync(resolve(root, 'tests/database/ir-002/platform-storage-baseline.sql'), 'utf8'), { administrator: true })
  log.push({ support: 'platform-storage-baseline.sql', sha256: fileHash(resolve(root, 'tests/database/ir-002/platform-storage-baseline.sql')), result: 'applied' })
  for (const migration of migrations.slice(1, 9)) {
    psqlInput(readFileSync(resolve(root, 'supabase/migrations', migration), 'utf8'))
    log.push({ migration, sha256: fileHash(resolve(root, 'supabase/migrations', migration)), result: 'applied' })
  }
}

function apply010(log) {
  psqlInput(readFileSync(candidateMigration, 'utf8'), { administrator: true })
  log.push({ migration: migrations[9], sha256: provenance.migration010Sha256, result: 'applied-once-exact-file' })
  psqlInput(readFileSync(sharedTimezoneMigration, 'utf8'), { administrator: true })
  log.push({ migration: migrations[10], sha256: provenance.migration011Sha256, result: 'applied-once-exact-file' })
}

function q(value) { return `'${String(value).replaceAll("'", "''")}'` }

function scalar(sql) { return psql(sql).split('\n').filter(Boolean).at(-1) ?? '' }

function json(sql) { return JSON.parse(scalar(sql)) }

function candidateObjectSnapshot() {
  return json(`SELECT json_build_object(
    'displayTable', to_regclass('public.group_configuration_display_currencies')::text,
    'requestTable', to_regclass('public.ir003_bootstrap_requests')::text,
    'requestGroupIndex', to_regclass('public.ir003_bootstrap_requests_group_id_idx')::text,
    'auditConstraintAbsent', NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='group_audit_events_request_id_key'),
    'auditIndexNonUnique', EXISTS (SELECT 1 FROM pg_class c JOIN pg_index i ON i.indexrelid=c.oid WHERE c.oid='public.group_audit_events_request_id_idx'::regclass AND NOT i.indisunique),
    'wrapperCount', (SELECT count(*) FROM pg_proc WHERE oid='public.bootstrap_group(jsonb,jsonb,uuid)'::regprocedure),
    'wrapperSignature', (SELECT pg_get_function_result('public.bootstrap_group(jsonb,jsonb,uuid)'::regprocedure)),
    'helperCount', (SELECT count(*) FROM pg_proc WHERE oid='public.ir003_bootstrap_group_impl(jsonb,jsonb,uuid)'::regprocedure),
    'bootstrapFunctions', (SELECT count(*) FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname ILIKE '%bootstrap%'),
    'executor', (SELECT r.rolname FROM pg_proc p JOIN pg_roles r ON r.oid=p.proowner WHERE p.oid='public.bootstrap_group(jsonb,jsonb,uuid)'::regprocedure),
    'wrapperSecurityDefiner', (SELECT prosecdef FROM pg_proc WHERE oid='public.bootstrap_group(jsonb,jsonb,uuid)'::regprocedure),
    'wrapperSearchPath', (SELECT array_to_string(proconfig, ',') FROM pg_proc WHERE oid='public.bootstrap_group(jsonb,jsonb,uuid)'::regprocedure),
    'executorAttributes', (SELECT json_build_object('canLogin', rolcanlogin, 'inherit', rolinherit, 'bypassRls', rolbypassrls, 'superuser', rolsuper) FROM pg_roles WHERE rolname='ir003_top001_executor'),
    'rls', (SELECT json_object_agg(relname, json_build_object('enabled', relrowsecurity, 'forced', relforcerowsecurity)) FROM pg_class WHERE oid IN ('public.group_configuration_display_currencies'::regclass, 'public.ir003_bootstrap_requests'::regclass)),
    'policies', (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename IN ('group_configuration_display_currencies','ir003_bootstrap_requests')),
    'authenticatedWrapperExecute', has_function_privilege('authenticated', 'public.bootstrap_group(jsonb,jsonb,uuid)'::regprocedure, 'EXECUTE'),
    'helperExecute', (SELECT json_object_agg(role_name, allowed) FROM (VALUES ('public', has_function_privilege('public', 'public.ir003_bootstrap_group_impl(jsonb,jsonb,uuid)'::regprocedure, 'EXECUTE')), ('anon', has_function_privilege('anon', 'public.ir003_bootstrap_group_impl(jsonb,jsonb,uuid)'::regprocedure, 'EXECUTE')), ('authenticated', has_function_privilege('authenticated', 'public.ir003_bootstrap_group_impl(jsonb,jsonb,uuid)'::regprocedure, 'EXECUTE')), ('service_role', has_function_privilege('service_role', 'public.ir003_bootstrap_group_impl(jsonb,jsonb,uuid)'::regprocedure, 'EXECUTE'))) x(role_name, allowed)),
    'laterObjectsAbsent', NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('invitations','invitation_claims','storage_objects','realtime_events','finance_lifecycles'))
  )::text;`)
}

function verifyObjects(snapshot) {
  assert.equal(snapshot.displayTable, 'group_configuration_display_currencies')
  assert.equal(snapshot.requestTable, 'ir003_bootstrap_requests')
  assert.equal(snapshot.requestGroupIndex, 'ir003_bootstrap_requests_group_id_idx')
  assert.equal(snapshot.auditConstraintAbsent, true)
  assert.equal(snapshot.auditIndexNonUnique, true)
  assert.equal(snapshot.wrapperCount, 1)
  assert.equal(snapshot.wrapperSignature, 'TABLE(outcome text, group_id uuid, request_id uuid)')
  assert.equal(snapshot.helperCount, 1)
  assert.equal(snapshot.bootstrapFunctions, 2)
  assert.equal(snapshot.executor, 'ir003_top001_executor')
  assert.equal(snapshot.wrapperSecurityDefiner, true)
  assert.equal(snapshot.wrapperSearchPath, 'search_path=pg_catalog')
  assert.deepEqual(snapshot.executorAttributes, { canLogin: false, inherit: false, bypassRls: true, superuser: false })
  assert.equal(snapshot.rls.group_configuration_display_currencies.enabled, true)
  assert.equal(snapshot.rls.group_configuration_display_currencies.forced, true)
  assert.equal(snapshot.rls.ir003_bootstrap_requests.enabled, true)
  assert.equal(snapshot.rls.ir003_bootstrap_requests.forced, true)
  assert.equal(snapshot.policies, 0)
  assert.equal(snapshot.authenticatedWrapperExecute, true)
  assert.deepEqual(snapshot.helperExecute, { public: false, anon: false, authenticated: false, service_role: false })
  assert.equal(snapshot.laterObjectsAbsent, true)
}

function absenceSnapshot() {
  return json(`SELECT json_build_object(
    'ir003Tables', (SELECT count(*) FROM pg_class WHERE oid IN (to_regclass('public.group_configuration_display_currencies'), to_regclass('public.ir003_bootstrap_requests'))),
    'bootstrapFunctions', (SELECT count(*) FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname ILIKE '%bootstrap%'),
    'executor', EXISTS (SELECT 1 FROM pg_roles WHERE rolname='ir003_top001_executor'),
    'auditUniqueRestored', EXISTS (SELECT 1 FROM pg_constraint WHERE conname='group_audit_events_request_id_key'),
    'auditReplacementIndexAbsent', to_regclass('public.group_audit_events_request_id_idx') IS NULL
  )::text;`)
}

function verifyAbsence(value) {
  assert.deepEqual(value, { ir003Tables: 0, bootstrapFunctions: 0, executor: false, auditUniqueRestored: true, auditReplacementIndexAbsent: true })
}

function exactInjectedFailure(log) {
  const original = readFileSync(candidateMigration, 'utf8')
  const body = original.replace(/^BEGIN;\s*/u, '').replace(/\s*COMMIT;\s*$/u, '')
  assert.notEqual(body, original, 'candidate-transaction-framing-not-found')
  const output = psqlInput(`BEGIN;\n${body}\nDO $$ BEGIN RAISE EXCEPTION 'ir003-lanec-test-only-migration-failure'; END $$;\nCOMMIT;\n`, { expectFailure: true, administrator: true })
  assert.match(output, /ir003-lanec-test-only-migration-failure/u)
  log.push({ mechanism: 'candidate SQL body framed by one disposable outer transaction; exact candidate statements retained; test-only exception raised before outer COMMIT', result: 'failed-and-rolled-back' })
}

function actorIds(suffix) {
  return {
    a: `91000000-0000-4000-8000-${suffix}`,
    b: `91000000-0000-4000-8000-${String(Number(suffix) + 1).padStart(12, '0')}`,
  }
}

function addActors(suffix) {
  const ids = actorIds(suffix)
  psql(`INSERT INTO auth.users (id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) VALUES
    (${q(ids.a)}::uuid,'authenticated','authenticated',${q(`actor-a-${suffix}@example.test`)},'fixture',now(),'{}','{}',now(),now()),
    (${q(ids.b)}::uuid,'authenticated','authenticated',${q(`actor-b-${suffix}@example.test`)},'fixture',now(),'{}','{}',now(),now());`)
  return ids
}

function payload(label) {
  return {
    group: { trip_name: `Synthetic Lane C ${label}` },
    configuration: { destination: 'Kochi', start_date: '2032-10-03', end_date: '2032-10-07', timezone: 'Asia/Kolkata', accounting_currency: 'INR', display_currency_codes: ['INR', 'USD'] },
  }
}

function bootstrapSql(actor, input, requestId) {
  return `BEGIN; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claim.sub', ${q(actor)}, true); WITH started AS (SELECT clock_timestamp() AS at), result AS (SELECT b.* FROM started CROSS JOIN LATERAL public.bootstrap_group(${q(JSON.stringify(input.group))}::jsonb, ${q(JSON.stringify(input.configuration))}::jsonb, ${q(requestId)}::uuid) b) SELECT outcome || '|' || group_id || '|' || request_id || '|' || round((extract(epoch FROM clock_timestamp() - started.at) * 1000)::numeric, 3) FROM result CROSS JOIN started; COMMIT;`
}

function psqlAsync(sql) {
  const begun = process.hrtime.bigint()
  return new Promise((resolvePromise) => {
    const child = spawn('psql', ['--no-psqlrc', '--quiet', '--tuples-only', '--no-align', '--set', 'ON_ERROR_STOP=1', '--host', '127.0.0.1', '--port', dbPort, '--username', 'postgres', '--dbname', 'postgres', '--command', sql], { cwd: root, env: { ...process.env, PGPASSWORD: 'postgres' } })
    let stdout = ''; let stderr = ''
    child.stdout.on('data', (part) => { stdout += part })
    child.stderr.on('data', (part) => { stderr += part })
    child.on('close', (status) => resolvePromise({ status, stdout, stderr, clientMilliseconds: Number(process.hrtime.bigint() - begun) / 1e6 }))
  })
}

function parseResponse(response) {
  assert.equal(response.status, 0, `bootstrap-failed-${response.stderr}`)
  const line = response.stdout.split('\n').find((value) => /^completed\|[0-9a-f-]{36}\|[0-9a-f-]{36}\|[0-9.]+$/iu.test(value))
  assert.ok(line, 'missing-bootstrap-response')
  const [outcome, groupId, requestId, serverMilliseconds] = line.split('|')
  return { outcome, groupId, requestId, serverMilliseconds: Number(serverMilliseconds), clientMilliseconds: response.clientMilliseconds }
}

async function invoke(actor, input, requestId) {
  return parseResponse(await psqlAsync(bootstrapSql(actor, input, requestId)))
}

async function runWorkers(workerCount, requestsPerWorker, operation) {
  const workers = Array.from({ length: workerCount }, async (_, worker) => {
    const samples = []
    for (let request = 0; request < requestsPerWorker; request += 1) {
      samples.push(await operation(worker, request))
    }
    return samples
  })
  return (await Promise.all(workers)).flat()
}

function countFor(requestId) {
  return json(`SELECT json_build_object(
    'groups', (SELECT count(*) FROM public.groups),
    'configurations', (SELECT count(*) FROM public.group_configurations),
    'memberships', (SELECT count(*) FROM public.group_members),
    'audits', (SELECT count(*) FROM public.group_audit_events),
    'requests', (SELECT count(*) FROM public.ir003_bootstrap_requests),
    'forRequestGroups', (SELECT count(DISTINCT group_id) FROM public.ir003_bootstrap_requests WHERE request_id=${q(requestId)}::uuid),
    'forRequestAudits', (SELECT count(*) FROM public.group_audit_events WHERE request_id=${q(requestId)}::uuid),
    'forRequestRows', (SELECT count(*) FROM public.ir003_bootstrap_requests WHERE request_id=${q(requestId)}::uuid)
  )::text;`)
}

async function concurrencyEvidence() {
  const actors = addActors('000000000001')
  const records = []
  for (let repetition = 1; repetition <= 3; repetition += 1) {
    const sameId = randomUUID(); const samePayload = payload(`same-${repetition}`)
    const same = await Promise.all(Array.from({ length: 10 }, () => invoke(actors.a, samePayload, sameId)))
    assert.equal(new Set(same.map((v) => v.groupId)).size, 1)
    const sameCounts = countFor(sameId)
    assert.deepEqual({ groups: sameCounts.forRequestGroups, audits: sameCounts.forRequestAudits, requests: sameCounts.forRequestRows }, { groups: 1, audits: 1, requests: 1 })
    records.push({ shape: 'same-actor-same-request-same-payload', repetition, callerCount: 10, outcomes: same.map((v) => v.outcome), resultIds: [...new Set(same.map((v) => v.groupId))], counts: sameCounts, timings: same.map((v) => ({ serverMilliseconds: v.serverMilliseconds, clientMilliseconds: v.clientMilliseconds })), deadlocks: 0, errors: 0 })

    const changedId = randomUUID(); const changed = payload(`changed-${repetition}`)
    const changedResponses = await Promise.all([
      psqlAsync(bootstrapSql(actors.a, changed, changedId)),
      psqlAsync(bootstrapSql(actors.a, { ...changed, group: { trip_name: `Synthetic changed ${repetition}` } }, changedId)),
    ])
    const success = changedResponses.filter((response) => response.status === 0).map(parseResponse)
    const conflicts = changedResponses.filter((response) => response.status !== 0)
    assert.equal(success.length, 1)
    assert.equal(conflicts.length, 1)
    assert.match(conflicts[0].stderr, /idempotency_conflict/u)
    const changedCounts = countFor(changedId)
    assert.deepEqual({ groups: changedCounts.forRequestGroups, audits: changedCounts.forRequestAudits, requests: changedCounts.forRequestRows }, { groups: 1, audits: 1, requests: 1 })
    records.push({ shape: 'same-actor-same-request-changed-payload', repetition, callerCount: 2, outcomes: ['completed', 'idempotency_conflict'], resultIds: [success[0].groupId], counts: changedCounts, deadlocks: 0, errors: 0 })

    const crossId = randomUUID(); const crossA = payload(`cross-a-${repetition}`); const crossB = payload(`cross-b-${repetition}`); crossB.configuration.destination = 'Pune'
    const cross = await Promise.all([invoke(actors.a, crossA, crossId), invoke(actors.b, crossB, crossId)])
    assert.equal(new Set(cross.map((v) => v.groupId)).size, 2)
    const crossCounts = countFor(crossId)
    assert.deepEqual({ groups: crossCounts.forRequestGroups, audits: crossCounts.forRequestAudits, requests: crossCounts.forRequestRows }, { groups: 2, audits: 2, requests: 2 })
    records.push({ shape: 'cross-actor-same-request', repetition, callerCount: 2, outcomes: cross.map((v) => v.outcome), resultIds: cross.map((v) => v.groupId), counts: crossCounts, timings: cross.map((v) => ({ serverMilliseconds: v.serverMilliseconds, clientMilliseconds: v.clientMilliseconds })), deadlocks: 0, errors: 0 })
  }
  return records
}

function setupScaleFixture(run) {
  const actor = `92000000-0000-4000-8000-00000000000${run}`
  psql(`TRUNCATE public.ir003_bootstrap_requests, public.group_audit_events, public.group_configuration_display_currencies, public.group_configurations, public.group_members, public.profiles, public.groups CASCADE;
    DELETE FROM auth.users WHERE email LIKE 'ir003-perf-%@example.test';
    INSERT INTO auth.users (id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) VALUES (${q(actor)}::uuid,'authenticated','authenticated',${q(`ir003-perf-${run}@example.test`)},'fixture',now(),'{}','{}',now(),now());
    INSERT INTO public.groups (id, archived_at) SELECT ('10000000-0000-4000-8000-' || lpad(g::text,12,'0'))::uuid, CASE WHEN g > 180 THEN now() ELSE NULL END FROM generate_series(1,200) g;
    INSERT INTO public.group_configurations (group_id,trip_name,destination,start_date,end_date,timezone,accounting_currency) SELECT ('10000000-0000-4000-8000-' || lpad(g::text,12,'0'))::uuid, 'Synthetic Scale '||g, 'Kochi', DATE '2030-01-01', DATE '2030-01-02', 'Asia/Kolkata', 'INR' FROM generate_series(1,200) g;
    INSERT INTO public.group_configuration_display_currencies (group_id,currency_code) SELECT ('10000000-0000-4000-8000-' || lpad(g::text,12,'0'))::uuid, c FROM generate_series(1,200) g CROSS JOIN (VALUES ('INR'),('USD')) x(c);
    INSERT INTO public.profiles (id,display_name) SELECT ('30000000-0000-4000-8000-' || lpad(p::text,12,'0'))::uuid, 'Synthetic Profile '||p FROM generate_series(1,4200) p;
    INSERT INTO public.group_members (id,group_id,profile_id,role,status) SELECT ('40000000-0000-4000-8000-' || lpad(((g-1)*20+m)::text,12,'0'))::uuid, ('10000000-0000-4000-8000-' || lpad(g::text,12,'0'))::uuid, CASE WHEN g=1 AND m=1 THEN (SELECT id FROM public.profiles WHERE auth_user_id=${q(actor)}::uuid) ELSE ('30000000-0000-4000-8000-' || lpad(((g-1)*20+m)::text,12,'0'))::uuid END, CASE WHEN m=1 THEN 'owner' ELSE 'member' END, 'active' FROM generate_series(1,200) g CROSS JOIN generate_series(1,20) m;
    INSERT INTO public.group_members (id,group_id,profile_id,role,status) SELECT ('60000000-0000-4000-8000-' || lpad(g::text,12,'0'))::uuid, ('10000000-0000-4000-8000-' || lpad(g::text,12,'0'))::uuid, ('30000000-0000-4000-8000-' || lpad((4000+g)::text,12,'0'))::uuid, 'member','inactive' FROM generate_series(1,200) g;
    INSERT INTO public.group_audit_events (id,group_id,actor_group_member_id,event_type,request_id,details,occurred_at) SELECT ('70000000-0000-4000-8000-' || lpad(a::text,12,'0'))::uuid, ('10000000-0000-4000-8000-' || lpad((((a-1)/100)+1)::text,12,'0'))::uuid, ('40000000-0000-4000-8000-' || lpad((((a-1)/100)*20+1)::text,12,'0'))::uuid, 'group_bootstrapped', ('80000000-0000-4000-8000-' || lpad(a::text,12,'0'))::uuid, '{}'::jsonb, TIMESTAMPTZ '2030-01-01 00:00:00+00' + a * INTERVAL '1 second' FROM generate_series(1,20000) a;
    INSERT INTO public.ir003_bootstrap_requests (operation,actor_profile_id,request_id,request_fingerprint,status,group_id,result,created_at,completed_at) SELECT 'TOP-001',(SELECT id FROM public.profiles WHERE auth_user_id=${q(actor)}::uuid),('81000000-0000-4000-8000-' || lpad(r::text,12,'0'))::uuid,'{}'::jsonb,'completed',('10000000-0000-4000-8000-' || lpad((((r-1)%200)+1)::text,12,'0'))::uuid,jsonb_build_object('outcome','completed','group_id',('10000000-0000-4000-8000-' || lpad((((r-1)%200)+1)::text,12,'0'))::uuid,'request_id',('81000000-0000-4000-8000-' || lpad(r::text,12,'0'))::uuid),TIMESTAMPTZ '2030-01-01 00:00:00+00',TIMESTAMPTZ '2030-01-01 00:00:01+00' FROM generate_series(1,20000) r;
    ANALYZE;`)
  const actual = json(`SELECT json_build_object('groups',(SELECT count(*) FROM public.groups),'activeMemberships',(SELECT count(*) FROM public.group_members WHERE status='active'),'inactiveMemberships',(SELECT count(*) FROM public.group_members WHERE status='inactive'),'archivedGroups',(SELECT count(*) FROM public.groups WHERE archived_at IS NOT NULL),'auditRows',(SELECT count(*) FROM public.group_audit_events),'completedRequests',(SELECT count(*) FROM public.ir003_bootstrap_requests WHERE status='completed'))::text;`)
  assert.deepEqual(actual, { groups: 200, activeMemberships: 4000, inactiveMemberships: 200, archivedGroups: 20, auditRows: 20000, completedRequests: 20000 })
  return actor
}

function stats(samples) {
  assert.ok(samples.length > 0)
  const sorted = samples.slice().sort((a, b) => a - b)
  const at = (p) => sorted[Math.ceil(sorted.length * p) - 1]
  return { min: sorted[0], p50: at(0.5), p90: at(0.9), p95: at(0.95), p99: at(0.99), max: sorted.at(-1) }
}

function explain(sql) {
  const output = psql(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`)
  const first = output.indexOf('['); const last = output.lastIndexOf(']')
  assert.ok(first >= 0 && last > first, 'missing-explain-json')
  return JSON.parse(output.slice(first, last + 1))
}

function planNodes(value) {
  const nodes = []
  const visit = (entry) => { if (!entry || typeof entry !== 'object') return; if (Array.isArray(entry)) { entry.forEach(visit); return }; if (typeof entry['Node Type'] === 'string') nodes.push(entry); Object.values(entry).forEach(visit) }
  visit(value); return nodes
}

function assertPlan(name, plan, expectedIndex) {
  const nodes = planNodes(plan)
  assert.ok(nodes.some((n) => n['Index Name'] === expectedIndex), `${name}-expected-index-missing`)
  for (const node of nodes) {
    const relation = String(node['Relation Name'] ?? '')
    assert.ok(!(node['Node Type'] === 'Seq Scan' && ['profiles', 'group_members', 'iso_4217_currency_codes', 'ir003_bootstrap_requests'].includes(relation)), `${name}-forbidden-sequential-scan-${relation}`)
    assert.equal(Number(node['Temp Read Blocks'] ?? 0), 0, `${name}-temporary-read-spill`)
    assert.equal(Number(node['Temp Written Blocks'] ?? 0), 0, `${name}-temporary-write-spill`)
  }
}

function plans(actor) {
  const profile = scalar(`SELECT id::text FROM public.profiles WHERE auth_user_id=${q(actor)}::uuid;`)
  const request = '81000000-0000-4000-8000-000000000001'
  const paths = {
    ir003_bootstrap_requests_authoritative_key: { index: 'ir003_bootstrap_requests_pkey', plan: explain(`SELECT * FROM public.ir003_bootstrap_requests WHERE operation='TOP-001' AND actor_profile_id=${q(profile)}::uuid AND request_id=${q(request)}::uuid`) },
    group_audit_events_request_id_correlation: { index: 'group_audit_events_request_id_idx', plan: explain(`SELECT * FROM public.group_audit_events WHERE request_id='80000000-0000-4000-8000-000000000001'::uuid`) },
    profile_auth_resolution: { index: 'profiles_auth_user_id_key', plan: explain(`SELECT id FROM public.profiles WHERE auth_user_id=${q(actor)}::uuid`) },
    group_configuration: { index: 'group_configurations_pkey', plan: explain(`SELECT * FROM public.group_configurations WHERE group_id='10000000-0000-4000-8000-000000000001'::uuid`) },
    display_currency: { index: 'group_configuration_display_currencies_pkey', plan: explain(`SELECT * FROM public.group_configuration_display_currencies WHERE group_id='10000000-0000-4000-8000-000000000001'::uuid AND currency_code='INR'`) },
    iso_validation: { index: 'iso_4217_currency_codes_pkey', plan: explain(`SELECT * FROM public.iso_4217_currency_codes WHERE code='INR'`) },
  }
  const violations = []
  for (const [name, result] of Object.entries(paths)) {
    try { assertPlan(name, result.plan, result.index) }
    catch (error) { violations.push(error instanceof Error ? error.message : `${name}-plan-failed`) }
  }
  return {
    paths: Object.fromEntries(Object.entries(paths).map(([name, result]) => [name, { expectedIndex: result.index, plan: result.plan }])),
    violations,
  }
}

async function performanceRun(run) {
  const actor = setupScaleFixture(run)
  const cold = await invoke(actor, payload(`cold-${run}`), randomUUID())
  const warmups = []
  for (let i = 0; i < 10; i += 1) warmups.push(await invoke(actor, payload(`warm-${run}-${i}`), randomUUID()))
  const distinct = await runWorkers(10, 10, (worker, request) => invoke(actor, payload(`distinct-${run}-${worker}-${request}`), randomUUID()))
  const distinctServer = distinct.map((v) => v.serverMilliseconds)
  const distinctStats = stats(distinctServer)
  if (distinctStats.p95 > 40 || distinctStats.p99 > 75) {
    write(`06-distinct-performance-failure-run-${run}.json`, {
      run, sampleCount: distinct.length, workers: 10, requestsPerWorker: 10,
      samples: distinct.map((v) => ({ serverMilliseconds: v.serverMilliseconds, clientMilliseconds: v.clientMilliseconds })),
      stats: distinctStats, limits: { p95Milliseconds: 40, p99Milliseconds: 75 }, errors: 0, result: 'failed',
    })
  }
  assert.ok(distinctStats.p95 <= 40, `distinct-p95-threshold-run-${run}`)
  assert.ok(distinctStats.p99 <= 75, `distinct-p99-threshold-run-${run}`)
  const sameId = randomUUID(); const sameInput = payload(`same-performance-${run}`)
  const race = await Promise.all(Array.from({ length: 10 }, () => invoke(actor, sameInput, sameId)))
  const raceStats = stats(race.map((v) => v.serverMilliseconds))
  assert.ok(raceStats.p95 <= 40, `same-key-p95-threshold-run-${run}`)
  assert.ok(raceStats.max <= 75, `same-key-max-threshold-run-${run}`)
  assert.equal(new Set(race.map((v) => v.groupId)).size, 1, `same-key-result-convergence-run-${run}`)
  const raceCounts = countFor(sameId)
  assert.deepEqual({ groups: raceCounts.forRequestGroups, audits: raceCounts.forRequestAudits, requests: raceCounts.forRequestRows }, { groups: 1, audits: 1, requests: 1 })
  const loadedFailureId = randomUUID(); const before = countFor(loadedFailureId); const failure = psql(bootstrapSql(actor, payload(`loaded-failure-${run}`), loadedFailureId).replace(/COMMIT;$/u, 'SELECT 1 / 0; COMMIT;'), { expectFailure: true })
  assert.match(failure, /division by zero/u)
  const afterFailure = countFor(loadedFailureId); assert.deepEqual(afterFailure, before, `loaded-failure-no-partial-state-run-${run}`)
  const retry = await invoke(actor, payload(`loaded-failure-${run}`), loadedFailureId); assert.equal(retry.outcome, 'completed')
  const planEvidence = plans(actor)
  return {
    run, fixture: { groups: 200, activeMemberships: 4000, inactiveMemberships: 200, archivedGroups: 20, auditRows: 20000, completedRequests: 20000 },
    cold: { serverMilliseconds: cold.serverMilliseconds, clientMilliseconds: cold.clientMilliseconds }, warmupCount: warmups.length,
    distinct: { sampleCount: distinct.length, workers: 10, requestsPerWorker: 10, samples: distinct.map((v) => ({ serverMilliseconds: v.serverMilliseconds, clientMilliseconds: v.clientMilliseconds })), stats: distinctStats, errors: 0 },
    sameKeyRace: { callerCount: race.length, workers: 10, samples: race.map((v) => ({ serverMilliseconds: v.serverMilliseconds, clientMilliseconds: v.clientMilliseconds })), stats: raceStats, authoritativeGroupCount: raceCounts.forRequestGroups, authoritativeResultCount: new Set(race.map((v) => `${v.outcome}|${v.groupId}|${v.requestId}`)).size, auditCount: raceCounts.forRequestAudits, requestRowCount: raceCounts.forRequestRows, errors: 0, deadlocks: 0 },
    loadedFailure: { result: 'rolled-back-then-retry-completed', unrelatedFixtureRowsPreserved: true }, plans: planEvidence,
  }
}

function baselineOutput() {
  const result = commandResult('npm', ['run', 'test:ir003'])
  const output = `${result.stdout}\n${result.stderr}`.trim()
  if (result.error || result.status !== 0) throw new Error('lane-b-prerequisite-failed')
  return { command: 'npm run test:ir003', exitCode: result.status, output: output.replaceAll(root, '<repository>') }
}

const provenance = Object.freeze({
  schemaVersion: 1, ir: 'IR-003', lane: 'C', runId, candidateCommit,
  migration010Sha256: fileHash(candidateMigration), migration011Sha256: fileHash(sharedTimezoneMigration), laneBHarnessSha256: fileHash(laneBHarness),
  packageScripts: JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).scripts,
  tools: {
    supabase: command('npx', ['--no-install', 'supabase', '--version']).trim(),
    postgres: command('psql', ['--version']).trim(), docker: command('docker', ['--version']).trim(), node: process.version,
  }, environment: { classification: 'isolated-local-supabase-docker', os: process.platform, arch: process.arch, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, startedAtUtc: new Date().toISOString(), startedAtLocal: new Date().toString() },
})

function finalManifest(records, result) {
  const artifacts = records.map(({ file }) => ({ file, sha256: fileHash(resolve(evidenceDir, file)) })).sort((a, b) => a.file.localeCompare(b.file))
  const payload = { schemaVersion: 1, ir: 'IR-003', lane: 'C', runId, candidateCommit, migration010Sha256: provenance.migration010Sha256, migration011Sha256: provenance.migration011Sha256, laneBHarnessSha256: provenance.laneBHarnessSha256, environment: provenance.tools, timestamps: { startedAtUtc: provenance.environment.startedAtUtc, completedAtUtc: new Date().toISOString() }, artifacts, result }
  const manifest = { ...payload, canonicalization: 'JSON UTF-8 terminal LF sorted artifact names; manifest hash excludes finalManifestSha256', finalManifestSha256: sha256(`${JSON.stringify(payload, null, 2)}\n`) }
  const record = write('final-manifest.json', manifest)
  const independentlyRead = JSON.parse(readFileSync(resolve(evidenceDir, record.file), 'utf8'))
  const { canonicalization, finalManifestSha256, ...withoutHashOrDescription } = independentlyRead
  const independentlyReconstructed = { ...withoutHashOrDescription }
  const expected = sha256(`${JSON.stringify(independentlyReconstructed, null, 2)}\n`)
  assert.equal(expected, finalManifestSha256, 'independent-manifest-recheck')
  for (const artifact of artifacts) assert.equal(fileHash(resolve(evidenceDir, artifact.file)), artifact.sha256, `artifact-recheck-${artifact.file}`)
  for (const entry of readdirSync(evidenceDir)) {
    const path = resolve(evidenceDir, entry); assert.ok(lstatSync(path).isFile()); assert.equal(mode(path), 0o600)
  }
  assert.equal(mode(evidenceRoot), 0o700); assert.equal(mode(evidenceDir), 0o700)
  assert.equal(command('git', ['ls-files', '--', evidenceDir]).trim(), '', 'controlled-evidence-git-tracked')
  return { sha256: finalManifestSha256, artifactCount: artifacts.length + 1 }
}

try {
  initializeEvidence(); assertCandidate()
  const records = [write('00-provenance.json', provenance)]
  records.push(write('01-lane-b-baseline.json', baselineOutput())); assertCandidate()
  start(); const lifecycle = []; applyPrefix(lifecycle); records.push(write('02-clean-001-009.json', { migrations: lifecycle }))
  exactInjectedFailure(lifecycle); const rollback = absenceSnapshot(); verifyAbsence(rollback); records.push(write('03-controlled-failure-rollback.json', { migrationApplication: lifecycle.at(-1), rollback }))
  const recovery = []; apply010(recovery); const objectSnapshot = candidateObjectSnapshot(); verifyObjects(objectSnapshot); records.push(write('04-recovery-object-catalogue.json', { migration: recovery, objectSnapshot }))
  const concurrency = await concurrencyEvidence(); records.push(write('05-concurrency.json', { repetitions: 3, records: concurrency }))
  if (process.env.IR003_EVIDENCE_CAPTURE_ONLY === 'pre-performance') {
    stop()
    records.push(write('07-cleanup.json', { result: 'passed', dockerSnapshot: dockerSnapshot(), temporaryWorkdirRemoved: true, captureOnly: 'pre-performance' }))
    console.log(JSON.stringify({ capability: 'ir-003-lane-c-evidence', result: 'partial-pre-performance-capture', runId, evidenceDir: '<controlled-external>' }))
  } else {
    const performance = []; for (let run = 1; run <= 3; run += 1) performance.push(await performanceRun(run)); records.push(write('06-performance-and-plans.json', { exactFrozenInterpretation: '200 Groups; 4,000 active memberships; 200 inactive memberships; 20 archived Groups; 20,000 audit rows; 20,000 completed synthetic TOP-001 request records; 1 cold operation; 10 warm-ups; 100 distinct committed calls at 10 workers x 10 requests; 10 concurrent same-key callers.', runs: performance }))
    assert.deepEqual(performance.flatMap((run) => run.plans.violations), [], 'lane-c-plan-violations')
    stop(); records.push(write('07-cleanup.json', { result: 'passed', dockerSnapshot: dockerSnapshot(), temporaryWorkdirRemoved: true }))
    start(); const repeat = []; applyPrefix(repeat); apply010(repeat); const repeatedSnapshot = candidateObjectSnapshot(); verifyObjects(repeatedSnapshot); records.push(write('08-repeated-clean-application.json', { migrations: repeat, objectEquivalent: sha256(JSON.stringify(repeatedSnapshot)) === sha256(JSON.stringify(objectSnapshot)), snapshot: repeatedSnapshot })); stop()
    assertCandidate()
    const manifest = finalManifest(records, { cleanApply: 'PASS', controlledFailure: 'PASS', rollback: 'PASS', recovery: 'PASS', repeatedCleanApply: 'PASS', laneB: 'PASS', concurrency: 'PASS', distinctPerformance: 'PASS', sameKeyRacePerformance: 'PASS', indexPlans: 'PASS', cleanup: 'PASS', decision: 'PASS' })
    console.log(JSON.stringify({ capability: 'ir-003-lane-c-evidence', result: 'passed', runId, evidenceDir: '<controlled-external>', manifestSha256: manifest.sha256, artifactCount: manifest.artifactCount }))
  }
} catch (error) {
  try { stop() } catch { /* preserve evidence failure */ }
  const rawMessage = error instanceof Error ? error.message : 'lane-c-evidence-failed'
  const message = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(rawMessage) ? rawMessage : 'lane-c-evidence-failed'
  if (existsSync(evidenceDir)) {
    try { write('99-failure.json', { result: 'failed-safely', reason: message, rawReasonClass: rawMessage.replace(/[^A-Za-z0-9_-]/gu, '-').slice(0, 160) }) } catch { /* preserve original evidence failure */ }
  }
  console.error(JSON.stringify({ capability: 'ir-003-lane-c-evidence', result: 'failed-safely', runId, reason: message }))
  process.exitCode = 1
}
