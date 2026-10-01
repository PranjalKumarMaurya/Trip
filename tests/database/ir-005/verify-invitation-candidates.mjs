import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Isolated candidate evidence. This is not an IR-005 packet exit.
const root = fileURLToPath(new URL('../../..', import.meta.url))
const localCli = resolve(root, 'node_modules/.bin/supabase')
const siblingCli = resolve(root, '../bachelor-trip-app/node_modules/.bin/supabase')
const supabaseCli = existsSync(localCli) ? localCli : siblingCli
const projectId = 'bachelor-trip-app-ir005-verify'
const container = `supabase_db_${projectId}`
const port = '58422'
const read = (path) => readFileSync(resolve(root, path), 'utf8')
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`
const actor = {
  owner: 'a5000000-0000-4000-8000-000000000001',
  friend: 'a5000000-0000-4000-8000-000000000002',
  stranger: 'a5000000-0000-4000-8000-000000000003',
  late: 'a5000000-0000-4000-8000-000000000004',
  race: 'a5000000-0000-4000-8000-000000000005',
  contest: 'a5000000-0000-4000-8000-000000000006',
}
const groupA = 'b5000000-0000-4000-8000-000000000001'
const groupB = 'b5000000-0000-4000-8000-000000000002'
let workdir = ''
let started = false

function processSync(name, args, input, admin = false) {
  return spawnSync(name, args, {
    cwd: root, encoding: 'utf8', input,
    env: admin ? process.env : { ...process.env, PGPASSWORD: 'postgres' },
  })
}

function requireSuccess(result, label) {
  if (result.error || result.status !== 0) throw new Error(`${label}-failed`)
  return result.stdout.trim()
}

function psqlArgs() {
  return [
    '--no-psqlrc', '--quiet', '--tuples-only', '--no-align',
    '--set', 'ON_ERROR_STOP=1', '--host', '127.0.0.1',
    '--port', port, '--username', 'postgres', '--dbname', 'postgres',
  ]
}

function psql(sql, label = 'psql') {
  return requireSuccess(processSync('psql', psqlArgs(), sql), label)
}

function adminSql(sql, label = 'admin-sql') {
  return requireSuccess(processSync('docker', [
    'exec', '--interactive', '--user', 'postgres', container, 'psql',
    '--no-psqlrc', '--quiet', '--set', 'ON_ERROR_STOP=1',
    '--username', 'supabase_admin', '--dbname', 'postgres',
  ], sql, true), label)
}

function assertClean() {
  const names = requireSuccess(processSync('docker', ['ps', '--all', '--format', '{{.Names}}']), 'docker-list')
  assert.equal(names.split('\n').some((name) => name.endsWith(`_${projectId}`)), false, 'stack-cleanup')
}

function start() {
  assertClean()
  workdir = mkdtempSync(resolve(tmpdir(), 'trip-ir005-verify-'))
  mkdirSync(resolve(workdir, 'supabase'))
  writeFileSync(resolve(workdir, 'supabase/config.toml'), `project_id = "${projectId}"
[api]
enabled = true
port = 58421
[db]
port = ${port}
[db.pooler]
enabled = false
port = 58429
[realtime]
enabled = false
[studio]
enabled = false
port = 58423
[inbucket]
enabled = false
port = 58424
smtp_port = 58425
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
  requireSuccess(processSync(supabaseCli, ['start', '--workdir', workdir]), 'stack-start')
}

function stop() {
  if (started) {
    requireSuccess(processSync(supabaseCli, [
      'stop', '--workdir', workdir,
      '--project-id', projectId, '--no-backup',
    ]), 'stack-stop')
    started = false
  }
  if (workdir) rmSync(workdir, { recursive: true, force: true })
  workdir = ''
  assertClean()
}

function migrate() {
  psql(read('supabase/migrations/001_initial.sql'), 'migration-001')
  adminSql(read('tests/database/ir-002/platform-storage-baseline.sql'), 'storage-baseline')
  const earlier = [
    '002_tickets_bucket.sql', '003_gmap_url.sql', '004_paid_by_splits.sql',
    '005_todos.sql', '006_ir002_tenant_root.sql',
    '007_ir002_configuration_archive_audit.sql',
    '008_ir004_profile_auth.sql', '009_ir007_base_rls_ownership.sql',
  ]
  for (const file of earlier) psql(read(`supabase/migrations/${file}`), file)
  const candidates = [
    '010_ir003_atomic_group_bootstrap.sql',
    '011_ir002_timezone_reference.sql',
    '012_ir005_invitation_foundation.sql',
    '013_ir005_create_invitation_candidate.sql',
    '014_ir005_accept_invitation_candidate.sql',
    '015_ir005_revoke_invitation_candidate.sql',
  ]
  for (const file of candidates) adminSql(read(`supabase/migrations/${file}`), file)
}

function fixture() {
  const users = Object.entries(actor).map(([name, id]) =>
    `(${quote(id)},'authenticated','authenticated',${quote(`${name}@example.test`)},'fixture',now(),'{}','{}',now(),now())`).join(',\n')
  psql(`INSERT INTO auth.users
    (id,aud,role,email,encrypted_password,email_confirmed_at,
     raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
    VALUES ${users};
    INSERT INTO public.groups(id) VALUES (${quote(groupA)}), (${quote(groupB)});
    INSERT INTO public.group_members(group_id,profile_id,role,status)
    SELECT target.group_id, profile.id, 'owner', 'active'
    FROM public.profiles AS profile
    CROSS JOIN (VALUES (${quote(groupA)}::uuid), (${quote(groupB)}::uuid)) AS target(group_id)
    WHERE profile.auth_user_id=${quote(actor.owner)}::uuid;`, 'fixture')
}

function callSql(userId, expression, delaySeconds = 0) {
  return `BEGIN;
    SET LOCAL ROLE authenticated;
    SELECT set_config('request.jwt.claim.sub', ${quote(userId)}, true);
    ${delaySeconds ? `SELECT pg_sleep(${delaySeconds});` : ''}
    SELECT (${expression})::text;
    COMMIT;`
}

function parseCall(result) {
  if (result.error) throw new Error('psql-process-error')
  if (result.status !== 0) {
    const message = result.stderr.match(/ERROR:\s+([^\n]+)/u)?.[1] ?? 'call-failed'
    return { ok: false, error: message }
  }
  const line = result.stdout.split('\n').map((value) => value.trim()).filter(Boolean).at(-1)
  return { ok: true, value: JSON.parse(line) }
}

function call(userId, expression, delaySeconds = 0) {
  return parseCall(processSync('psql', psqlArgs(), callSql(userId, expression, delaySeconds)))
}

function callAsync(userId, expression) {
  return new Promise((resolveCall, rejectCall) => {
    const child = spawn('psql', psqlArgs(), {
      cwd: root, env: { ...process.env, PGPASSWORD: 'postgres' },
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.on('error', rejectCall)
    child.on('close', (status) => resolveCall(parseCall({ status, stdout, stderr })))
    child.stdin.end(callSql(userId, expression))
  })
}

function issue(groupId, email, requestId) {
  return `public.create_invitation(${quote(groupId)}::uuid,
    jsonb_build_object('email',${quote(email)}), '{}'::jsonb,
    ${quote(requestId)}::uuid)`
}

function accept(proof, requestId) {
  return `public.accept_invitation(${quote(proof)}, '{}'::jsonb, ${quote(requestId)}::uuid)`
}

function revoke(groupId, invitationId, requestId) {
  return `public.revoke_invitation(${quote(groupId)}::uuid,
    ${quote(invitationId)}::uuid, ${quote(requestId)}::uuid)`
}

function success(result, outcome) {
  assert.equal(result.ok, true, result.error)
  assert.equal(result.value.outcome, outcome)
  return result.value
}

function denied(result, reason) {
  assert.equal(result.ok, false, 'unexpected-success')
  assert.equal(result.error, reason)
}

const id = (suffix) => `c5000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`

async function verify() {
  const a = success(call(actor.owner, issue(groupA, 'friend@example.test', id(1))), 'created')
  assert.match(a.proof, /^[0-9a-f]{64}$/u)
  const same = success(call(actor.owner, issue(groupA, 'friend@example.test', id(1))), 'already_completed')
  assert.equal(Object.hasOwn(same, 'proof'), false, 'proof-redisplayed')
  denied(call(actor.stranger, accept(a.proof, id(2))), 'invalid_invitation')
  const joined = success(call(actor.friend, accept(a.proof, id(2))), 'accepted')
  assert.equal(joined.group_id, groupA)
  success(call(actor.friend, accept(a.proof, id(2))), 'already_completed')
  denied(call(actor.friend, accept(a.proof, id(3))), 'invalid_invitation')

  const b = success(call(actor.owner, issue(groupA, 'late@example.test', id(4))), 'created')
  denied(call(actor.stranger, revoke(groupA, b.invitation_id, id(5))), 'not_authorized')
  success(call(actor.owner, revoke(groupA, b.invitation_id, id(5))), 'revoked')
  success(call(actor.owner, revoke(groupA, b.invitation_id, id(5))), 'already_completed')
  denied(call(actor.late, accept(b.proof, id(6))), 'invalid_invitation')

  const cross = success(call(actor.owner, issue(groupB, 'late@example.test', id(7))), 'created')
  denied(call(actor.owner, revoke(groupA, cross.invitation_id, id(8))), 'invalid_invitation')
  const crossJoin = success(call(actor.late, accept(cross.proof, id(9))), 'accepted')
  assert.equal(crossJoin.group_id, groupB)
  assert.equal(psql(`SELECT count(*) FROM public.group_members AS member
    JOIN public.profiles AS profile ON profile.id=member.profile_id
    WHERE profile.auth_user_id=${quote(actor.late)}::uuid
      AND member.group_id=${quote(groupA)}::uuid`), '0')

  const expires = success(call(actor.owner, issue(groupA, 'stranger@example.test', id(10))), 'created')
  psql(`UPDATE public.invitations
    SET expires_at=clock_timestamp()+interval '0.25 second'
    WHERE id=${quote(expires.invitation_id)}::uuid`, 'shorten-expiry')
  denied(call(actor.stranger, accept(expires.proof, id(11)), 0.45), 'invalid_invitation')
  assert.equal(psql(`SELECT count(*) FROM public.group_members AS member
    JOIN public.profiles AS profile ON profile.id=member.profile_id
    WHERE profile.auth_user_id=${quote(actor.stranger)}::uuid`), '0')

  const raceInvite = success(call(actor.owner, issue(groupA, 'race@example.test', id(12))), 'created')
  const race = await Promise.all([
    callAsync(actor.race, accept(raceInvite.proof, id(13))),
    callAsync(actor.race, accept(raceInvite.proof, id(14))),
  ])
  assert.equal(race.filter((result) => result.ok && result.value.outcome === 'accepted').length, 1, 'accept-race-winner')
  assert.equal(race.filter((result) => !result.ok && result.error === 'invalid_invitation').length, 1, 'accept-race-loser')

  const contestInvite = success(call(actor.owner, issue(groupA, 'contest@example.test', id(15))), 'created')
  const contest = await Promise.all([
    callAsync(actor.contest, accept(contestInvite.proof, id(16))),
    callAsync(actor.owner, revoke(groupA, contestInvite.invitation_id, id(17))),
  ])
  const finalStatus = psql(`SELECT status FROM public.invitations WHERE id=${quote(contestInvite.invitation_id)}::uuid`)
  const contestMembers = Number(psql(`SELECT count(*) FROM public.group_members AS member
    JOIN public.profiles AS profile ON profile.id=member.profile_id
    WHERE profile.auth_user_id=${quote(actor.contest)}::uuid
      AND member.group_id=${quote(groupA)}::uuid`))
  assert.ok(['accepted', 'revoked'].includes(finalStatus), 'contest-terminal-status')
  assert.equal(contestMembers, finalStatus === 'accepted' ? 1 : 0, 'contest-membership-atomic')
  assert.equal(contest.filter((result) => result.ok).length, finalStatus === 'accepted' ? 2 : 1, 'contest-call-results')

  assert.equal(psql(`SELECT has_table_privilege('authenticated','public.invitations','SELECT'),
    has_table_privilege('service_role','public.invitations','SELECT'),
    has_function_privilege('anon','public.accept_invitation(text,jsonb,uuid)','EXECUTE')`), 'f|f|f')
  return { invitationCandidate: 'passed', twoGroups: 'passed', expiry: 'passed', acceptRace: 'passed', revokeRace: 'passed', cleanup: 'pending' }
}

try {
  start()
  migrate()
  fixture()
  const result = await verify()
  stop()
  console.log(JSON.stringify({ ...result, cleanup: 'passed' }))
} catch (error) {
  try { stop() } catch { /* preserve primary failure */ }
  const message = error instanceof Error && /^[a-z0-9-]+$/u.test(error.message)
    ? error.message : 'invitation-candidate-verification-failed'
  console.error(message)
  process.exitCode = 1
}
