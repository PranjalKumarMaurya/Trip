import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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

// Apply every migration in order as `postgres`, the role hosted Supabase uses.
function migrate() {
  const files = readdirSync(resolve(root, 'supabase/migrations')).filter((name) => name.endsWith('.sql')).sort()
  for (const file of files) {
    psql(read(`supabase/migrations/${file}`), file)
    if (file === '001_initial.sql') {
      adminSql(read('tests/database/ir-002/platform-storage-baseline.sql'), 'storage-baseline')
    }
  }
}

function fixture() {
  const users = Object.entries(actor).map(([name, id]) =>
    `(${quote(id)},'authenticated','authenticated',${quote(`${name}@example.test`)},'fixture',now(),'{}','{}',now(),now())`).join(',\n')
  psql(`INSERT INTO auth.users
    (id,aud,role,email,encrypted_password,email_confirmed_at,
     raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
    VALUES ${users};
    INSERT INTO public.groups(id) VALUES (${quote(groupA)}), (${quote(groupB)});
    INSERT INTO public.group_configurations
      (group_id,trip_name,destination,start_date,end_date,timezone,accounting_currency)
    VALUES
      (${quote(groupA)},'Trip A','Goa','2026-11-01','2026-11-05','Asia/Kolkata','INR'),
      (${quote(groupB)},'Trip B','Jaipur','2026-12-01','2026-12-04','Asia/Kolkata','INR');
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

function callAnon(expression) {
  return parseCall(processSync('psql', psqlArgs(),
    `BEGIN; SET LOCAL ROLE anon; SELECT (${expression})::text; COMMIT;`))
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

function inspect(proof) {
  return `public.inspect_invitation(${quote(proof)})`
}

function listInvitations(groupId, beforeCreatedAt = null, beforeInvitationId = null) {
  return `public.list_group_invitations(${quote(groupId)}::uuid,
    ${beforeCreatedAt === null ? 'NULL' : `${quote(beforeCreatedAt)}::timestamptz`},
    ${beforeInvitationId === null ? 'NULL' : `${quote(beforeInvitationId)}::uuid`})`
}

function myGroups() {
  return `(SELECT coalesce(jsonb_agg(access), '[]'::jsonb)
    FROM public.get_my_group_access() AS access)`
}

function revoke(groupId, invitationId, requestId) {
  return `public.revoke_invitation(${quote(groupId)}::uuid,
    ${quote(invitationId)}::uuid, ${quote(requestId)}::uuid)`
}

function changeRole(groupId, memberId, role, requestId) {
  return `public.change_member_role(${quote(groupId)}::uuid,
    ${quote(memberId)}::uuid, ${quote(role)}, ${quote(requestId)}::uuid)`
}

function transfer(groupId, memberId, priorOutcome, requestId) {
  return `public.transfer_ownership(${quote(groupId)}::uuid,
    ${quote(memberId)}::uuid, ${quote(priorOutcome)}, ${quote(requestId)}::uuid)`
}

function deactivate(groupId, memberId, action, requestId) {
  return `public.deactivate_membership(${quote(groupId)}::uuid,
    ${quote(memberId)}::uuid, ${quote(action)}, '{"confirmed":true}'::jsonb,
    ${quote(requestId)}::uuid)`
}

function archive(groupId, state, requestId) {
  return `public.set_group_archive_state(${quote(groupId)}::uuid,
    ${quote(state)}, ${quote(requestId)}::uuid)`
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
  assert.equal(call(actor.owner, `(SELECT count(*) FROM public.profiles
    WHERE auth_user_id=${quote(actor.owner)}::uuid)`).value, 1)
  assert.equal(call(actor.owner, `(SELECT count(*) FROM public.profiles
    WHERE auth_user_id=${quote(actor.friend)}::uuid)`).value, 0)
  const initialGroups = call(actor.owner, myGroups())
  assert.equal(initialGroups.ok, true, initialGroups.error)
  assert.deepEqual(initialGroups.value.map((group) => group.group_id).sort(), [groupA, groupB])
  assert.equal(call(actor.friend, myGroups()).value.length, 0)
  const a = success(call(actor.owner, issue(groupA, 'friend@example.test', id(1))), 'created')
  assert.match(a.proof, /^[0-9a-f]{64}$/u)
  const ownerList = call(actor.owner, listInvitations(groupA))
  assert.equal(ownerList.ok, true, ownerList.error)
  assert.equal(ownerList.value.live_count, 1)
  assert.equal(ownerList.value.items.length, 1)
  assert.equal(ownerList.value.items[0].recipient_email, 'friend@example.test')
  assert.equal(ownerList.value.items[0].status, 'pending')
  assert.equal(Object.hasOwn(ownerList.value.items[0], 'proof'), false)
  assert.equal(Object.hasOwn(ownerList.value.items[0], 'proof_verifier'), false)
  const emptyNextPage = call(actor.owner, listInvitations(groupA,
    ownerList.value.items[0].created_at, ownerList.value.items[0].invitation_id))
  assert.equal(emptyNextPage.ok, true, emptyNextPage.error)
  assert.equal(emptyNextPage.value.items.length, 0)
  denied(call(actor.stranger, listInvitations(groupA)), 'not_authorized')
  assert.equal(call(actor.owner, listInvitations(groupB)).value.items.length, 0)
  const publicContext = success(callAnon(inspect(a.proof)), 'continue')
  assert.equal(publicContext.trip_name, 'Trip A')
  assert.equal(Object.hasOwn(publicContext, 'recipient_email'), false)
  assert.equal(Object.hasOwn(publicContext, 'proof'), false)
  success(callAnon(inspect('bad-link')), 'invalid')
  success(callAnon(inspect('0'.repeat(64))), 'invalid')
  success(call(actor.stranger, inspect(a.proof)), 'switch_account')
  psql(`UPDATE auth.users SET email_confirmed_at=NULL
    WHERE id=${quote(actor.friend)}::uuid`, 'unverify-recipient')
  success(call(actor.friend, inspect(a.proof)), 'verification_required')
  denied(call(actor.friend, accept(a.proof, id(41))), 'not_authorized')
  psql(`UPDATE auth.users SET email_confirmed_at=clock_timestamp()
    WHERE id=${quote(actor.friend)}::uuid`, 'verify-recipient')
  success(call(actor.friend, inspect(a.proof)), 'ready')
  const same = success(call(actor.owner, issue(groupA, 'friend@example.test', id(1))), 'already_completed')
  assert.equal(Object.hasOwn(same, 'proof'), false, 'proof-redisplayed')
  denied(call(actor.stranger, accept(a.proof, id(2))), 'invalid_invitation')
  const joined = success(call(actor.friend, accept(a.proof, id(2))), 'accepted')
  assert.equal(joined.group_id, groupA)
  assert.deepEqual(call(actor.friend, myGroups()).value.map((group) => group.group_id), [groupA])
  denied(call(actor.friend, listInvitations(groupA)), 'not_authorized')
  const acceptedList = call(actor.owner, listInvitations(groupA))
  assert.equal(acceptedList.value.live_count, 0)
  assert.equal(acceptedList.value.items[0].status, 'accepted')
  success(call(actor.friend, inspect(a.proof)), 'used')
  success(callAnon(inspect(a.proof)), 'invalid')
  success(call(actor.friend, accept(a.proof, id(2))), 'already_completed')
  denied(call(actor.friend, accept(a.proof, id(3))), 'invalid_invitation')
  const ownerMember = psql(`SELECT member.id FROM public.group_members AS member
    JOIN public.profiles AS profile ON profile.id=member.profile_id
    WHERE member.group_id=${quote(groupA)}::uuid
      AND profile.auth_user_id=${quote(actor.owner)}::uuid`)
  denied(call(actor.friend, changeRole(groupA, joined.group_member_id, 'owner', id(19))), 'not_authorized')
  success(call(actor.owner, changeRole(groupA, joined.group_member_id, 'owner', id(19))), 'changed')
  success(call(actor.owner, changeRole(groupA, joined.group_member_id, 'owner', id(19))), 'already_completed')
  denied(call(actor.owner, changeRole(groupA, joined.group_member_id, 'member', id(19))), 'idempotency_conflict')
  success(call(actor.owner, changeRole(groupA, joined.group_member_id, 'member', id(20))), 'changed')
  denied(call(actor.owner, changeRole(groupA, ownerMember, 'member', id(21))), 'last_owner')

  const b = success(call(actor.owner, issue(groupA, 'late@example.test', id(4))), 'created')
  denied(call(actor.stranger, revoke(groupA, b.invitation_id, id(5))), 'not_authorized')
  success(call(actor.owner, revoke(groupA, b.invitation_id, id(5))), 'revoked')
  const revokedList = call(actor.owner, listInvitations(groupA))
  assert.equal(revokedList.value.live_count, 0)
  assert.equal(revokedList.value.items[0].status, 'revoked')
  success(call(actor.late, inspect(b.proof)), 'revoked')
  success(call(actor.owner, revoke(groupA, b.invitation_id, id(5))), 'already_completed')
  denied(call(actor.late, accept(b.proof, id(6))), 'invalid_invitation')

  const cross = success(call(actor.owner, issue(groupB, 'late@example.test', id(7))), 'created')
  const groupBList = call(actor.owner, listInvitations(groupB))
  assert.equal(groupBList.value.items.length, 1)
  assert.equal(groupBList.value.items[0].invitation_id, cross.invitation_id)
  denied(call(actor.owner, revoke(groupA, cross.invitation_id, id(8))), 'invalid_invitation')
  const crossJoin = success(call(actor.late, accept(cross.proof, id(9))), 'accepted')
  assert.equal(crossJoin.group_id, groupB)
  const priorOwnerB = psql(`SELECT member.id FROM public.group_members AS member
    JOIN public.profiles AS profile ON profile.id=member.profile_id
    WHERE member.group_id=${quote(groupB)}::uuid
      AND profile.auth_user_id=${quote(actor.owner)}::uuid`)
  denied(call(actor.owner, changeRole(groupA, crossJoin.group_member_id, 'owner', id(22))), 'invalid_target')
  assert.equal(psql(`SELECT count(*) FROM public.group_members AS member
    JOIN public.profiles AS profile ON profile.id=member.profile_id
    WHERE profile.auth_user_id=${quote(actor.late)}::uuid
      AND member.group_id=${quote(groupA)}::uuid`), '0')

  const expires = success(call(actor.owner, issue(groupA, 'stranger@example.test', id(10))), 'created')
  psql(`UPDATE public.invitations
    SET expires_at=clock_timestamp()+interval '0.25 second'
    WHERE id=${quote(expires.invitation_id)}::uuid`, 'shorten-expiry')
  denied(call(actor.stranger, accept(expires.proof, id(11)), 0.45), 'invalid_invitation')
  success(call(actor.stranger, inspect(expires.proof)), 'expired')
  const expiredList = call(actor.owner, listInvitations(groupA))
  assert.equal(expiredList.value.items[0].status, 'expired')
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

  denied(call(actor.owner, transfer(groupB, joined.group_member_id, 'member', id(23))), 'invalid_target')
  denied(call(actor.late, transfer(groupB, crossJoin.group_member_id, 'member', id(24))), 'not_authorized')
  success(call(actor.owner, transfer(groupB, crossJoin.group_member_id, 'member', id(25))), 'transferred')
  success(call(actor.owner, transfer(groupB, crossJoin.group_member_id, 'member', id(25))), 'already_completed')
  denied(call(actor.owner, transfer(groupB, crossJoin.group_member_id, 'inactive', id(25))), 'idempotency_conflict')
  denied(call(actor.owner, transfer(groupB, crossJoin.group_member_id, 'member', id(26))), 'not_authorized')
  assert.equal(psql(`SELECT count(*) FROM public.group_members
    WHERE group_id=${quote(groupB)}::uuid AND status='active' AND role='owner'`), '1')
  denied(call(actor.late, deactivate(groupB, crossJoin.group_member_id, 'leave', id(28))), 'last_owner')
  denied(call(actor.owner, deactivate(groupB, crossJoin.group_member_id, 'remove', id(29))), 'not_authorized')
  denied(call(actor.late, deactivate(groupB, joined.group_member_id, 'remove', id(30))), 'invalid_target')
  success(call(actor.owner, deactivate(groupB, priorOwnerB, 'leave', id(31))), 'deactivated')
  success(call(actor.owner, deactivate(groupB, priorOwnerB, 'leave', id(31))), 'already_completed')
  const removalInvite = success(call(actor.late, issue(groupB, 'stranger@example.test', id(32))), 'created')
  const removable = success(call(actor.stranger, accept(removalInvite.proof, id(33))), 'accepted')
  success(call(actor.late, deactivate(groupB, removable.group_member_id, 'remove', id(34))), 'deactivated')
  success(call(actor.late, deactivate(groupB, removable.group_member_id, 'remove', id(34))), 'already_completed')
  assert.equal(psql(`SELECT status || '|' || role FROM public.group_members
    WHERE id=${quote(removable.group_member_id)}::uuid`), 'inactive|member')

  assert.equal(psql(`SELECT has_table_privilege('authenticated','public.invitations','SELECT'),
    has_table_privilege('service_role','public.invitations','SELECT'),
    has_function_privilege('anon','public.accept_invitation(text,jsonb,uuid)','EXECUTE'),
    has_table_privilege('authenticated','public.ir005_lifecycle_requests','SELECT'),
    has_function_privilege('anon','public.list_group_invitations(uuid,timestamptz,uuid)','EXECUTE'),
    has_function_privilege('anon','public.get_my_group_access()','EXECUTE')`), 'f|f|f|f|f|f')

  const beforeFailure = psql(`SELECT (SELECT count(*) FROM public.invitations),
    (SELECT count(*) FROM public.ir005_invitation_requests),
    (SELECT count(*) FROM public.group_audit_events)`)
  const auditColumns = 'group_id, actor_group_member_id, event_type, request_id, details, occurred_at'
  adminSql(`REVOKE INSERT (${auditColumns}) ON TABLE public.group_audit_events
    FROM ir005_invitation_executor`, 'deny-audit-write')
  try {
    denied(call(actor.owner, issue(groupA, 'rollback@example.test', id(18))), 'operation_failed')
    assert.equal(psql(`SELECT (SELECT count(*) FROM public.invitations),
      (SELECT count(*) FROM public.ir005_invitation_requests),
      (SELECT count(*) FROM public.group_audit_events)`), beforeFailure, 'audit-failure-rollback')
  } finally {
    adminSql(`GRANT INSERT (${auditColumns}) ON TABLE public.group_audit_events
      TO ir005_invitation_executor`, 'restore-audit-write')
  }
  success(call(actor.owner, transfer(groupA, joined.group_member_id, 'inactive', id(27))), 'transferred')
  success(call(actor.owner, transfer(groupA, joined.group_member_id, 'inactive', id(27))), 'already_completed')
  assert.equal(psql(`SELECT count(*) FROM public.group_members
    WHERE group_id=${quote(groupA)}::uuid AND status='active' AND role='owner'`), '1')
  assert.equal(psql(`SELECT status || '|' || role FROM public.group_members
    WHERE id=${quote(ownerMember)}::uuid`), 'inactive|member')
  const archiveInvite = success(call(actor.friend, issue(groupA, 'owner@example.test', id(35))), 'created')
  success(call(actor.friend, archive(groupA, 'archived', id(36))), 'archived')
  assert.equal(call(actor.friend, myGroups()).value.some((group) => group.group_id === groupA), false)
  success(callAnon(inspect(archiveInvite.proof)), 'invalid')
  denied(call(actor.friend, issue(groupA, 'new@example.test', id(37))), 'not_authorized')
  denied(call(actor.owner, accept(archiveInvite.proof, id(38))), 'invalid_invitation')
  assert.equal(psql(`SELECT status FROM public.group_members WHERE id=${quote(ownerMember)}::uuid`), 'inactive')
  success(call(actor.friend, archive(groupA, 'active', id(39))), 'restored')
  assert.equal(call(actor.friend, myGroups()).value.some((group) => group.group_id === groupA), true)
  success(callAnon(inspect(archiveInvite.proof)), 'continue')
  const restoredJoin = success(call(actor.owner, accept(archiveInvite.proof, id(38))), 'accepted')
  assert.equal(restoredJoin.group_member_id, ownerMember, 'archived-restoration-stable-id')
  denied(call(actor.owner, archive(groupA, 'archived', id(40))), 'not_authorized')
  assert.equal(psql(`SELECT archived_at IS NULL FROM public.groups WHERE id=${quote(groupA)}::uuid`), 't')
  return { invitationCandidate: 'passed', inspection: 'passed', ownerList: 'passed', myGroupAccess: 'passed', twoGroups: 'passed', expiry: 'passed', acceptRace: 'passed', revokeRace: 'passed', lastOwner: 'passed', transfer: 'passed', deactivate: 'passed', archive: 'passed', rollback: 'passed', cleanup: 'pending' }
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
  // Local debugging only: full errors can include fixture data, so never enable in CI logs.
  if (process.env.TRIP_DEBUG === '1') console.error(error)
  process.exitCode = 1
}
