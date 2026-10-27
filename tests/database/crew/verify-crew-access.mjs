// Crew management reads (migration 060 + the lifecycle RPCs the Crew tab calls):
// archived Trips are listed only to their active, verified Owners; anon and
// non-members are refused; restore brings the Trip back to the normal list.
import assert from 'node:assert/strict'
import { createLocalStack } from '../../support/local-stack.mjs'
import { createTrip, createUsers, quote, sqlAs } from '../../support/db-fixtures.mjs'

const stack = createLocalStack({ projectId: 'crew-db', basePort: 58950 })
const tripA = 'c0000000-0000-4000-8000-00000000000a'
const tripB = 'c0000000-0000-4000-8000-00000000000b'

const archivedFor = (userId) => sqlAs(stack, userId, 'SELECT group_id, trip_name FROM public.get_my_archived_groups();')
const accessFor = (userId) => sqlAs(stack, userId, 'SELECT group_id FROM public.get_my_group_access();')
const setArchive = (userId, groupId, state) => sqlAs(stack, userId,
  `SELECT public.set_group_archive_state(${quote(groupId)}, ${quote(state)}, gen_random_uuid())->>'outcome';`)
const listInvites = (userId, groupId) => sqlAs(stack, userId,
  `SELECT public.list_group_invitations(${quote(groupId)}, NULL, NULL)->>'live_count';`)

try {
  stack.start()
  stack.migrate()
  const user = createUsers(stack, ['owner', 'coowner', 'friend', 'former', 'unverified', 'stranger'])
  const a = createTrip(stack, {
    groupId: tripA, name: 'Goa', members: {
      [user.owner]: 'owner', [user.coowner]: 'owner', [user.friend]: 'member',
      [user.former]: 'owner', [user.unverified]: 'owner',
    },
  })
  createTrip(stack, { groupId: tripB, name: 'Jaipur', members: { [user.owner]: 'owner' } })
  stack.psql(`UPDATE public.group_members SET status = 'inactive', role = 'member' WHERE id = ${quote(a.memberIds[user.former])};
    UPDATE auth.users SET email_confirmed_at = NULL WHERE id = ${quote(user.unverified)};`)

  // The new function is a fixed-search-path definer owned by the narrow role, callable only when signed in.
  assert.equal(stack.psql(`SELECT prosecdef, proowner::regrole, array_to_string(proconfig, ',') FROM pg_proc
    WHERE oid = 'public.get_my_archived_groups()'::regprocedure;`), 't|ir005_invitation_executor|search_path=pg_catalog')
  assert.equal(stack.psql(`SELECT has_function_privilege('anon', 'public.get_my_archived_groups()', 'EXECUTE'),
    has_function_privilege('authenticated', 'public.get_my_archived_groups()', 'EXECUTE'),
    has_schema_privilege('ir005_invitation_executor', 'public', 'CREATE');`), 'f|t|f')

  // Nothing is archived yet.
  assert.deepEqual(archivedFor(user.owner).rows, [])

  // Only an active Owner can archive; members and strangers are refused.
  assert.equal(setArchive(user.friend, tripA, 'archived').error, 'not_authorized')
  assert.equal(setArchive(user.stranger, tripA, 'archived').error, 'not_authorized')
  assert.equal(setArchive(null, tripA, 'archived').ok, false, 'anon archive')
  assert.deepEqual(setArchive(user.owner, tripA, 'archived').rows, [['archived']])

  // Archived Trips disappear from the normal list and appear only for their active, verified Owners.
  assert.deepEqual(accessFor(user.owner).rows, [[tripB]])
  assert.deepEqual(archivedFor(user.owner).rows, [[tripA, 'Goa']])
  assert.deepEqual(archivedFor(user.coowner).rows, [[tripA, 'Goa']])
  assert.deepEqual(archivedFor(user.friend).rows, [], 'member sees archived Trip')
  assert.deepEqual(archivedFor(user.former).rows, [], 'former Owner sees archived Trip')
  assert.deepEqual(archivedFor(user.unverified).rows, [], 'unverified Owner sees archived Trip')
  assert.deepEqual(archivedFor(user.stranger).rows, [], 'stranger sees archived Trip')
  const anon = archivedFor(null)
  assert.equal(anon.ok, false, 'anon archived list')
  assert.match(anon.error, /permission denied/)

  // Archived Trips stay closed: no roster and no lifecycle writes.
  assert.deepEqual(sqlAs(stack, user.owner, `SELECT count(*) FROM public.get_group_roster(${quote(tripA)});`).rows, [['0']])
  assert.equal(sqlAs(stack, user.owner, `SELECT public.change_member_role(${quote(tripA)}, ${quote(a.memberIds[user.friend])},
    'owner', gen_random_uuid());`).error, 'not_authorized')

  // A member cannot restore; an Owner can, and the Trip returns to everyone's normal list.
  assert.equal(setArchive(user.friend, tripA, 'active').error, 'not_authorized')
  assert.deepEqual(setArchive(user.coowner, tripA, 'active').rows, [['restored']])
  assert.deepEqual(archivedFor(user.owner).rows, [])
  assert.deepEqual(accessFor(user.owner).rows.map(([id]) => id).sort(), [tripA, tripB])
  assert.deepEqual(accessFor(user.friend).rows, [[tripA]])

  // The Owner-only invitation list the Crew tab reads refuses members, strangers and anon.
  assert.deepEqual(listInvites(user.owner, tripA).rows, [['0']])
  assert.equal(listInvites(user.friend, tripA).error, 'not_authorized')
  assert.equal(listInvites(user.stranger, tripA).error, 'not_authorized')
  assert.equal(listInvites(null, tripA).ok, false, 'anon invitation list')

  stack.stop()
  console.log(JSON.stringify({ crewDb: 'passed', archivedOwnerOnly: 'passed', anonDenied: 'passed', restore: 'passed', cleanup: 'passed' }))
} catch (error) {
  try { stack.stop() } catch { /* keep the primary failure */ }
  console.error(error instanceof Error && /^[a-z0-9-]+$/u.test(error.message) ? error.message : 'crew-db-verification-failed')
  if (process.env.TRIP_DEBUG === '1') console.error(error)
  process.exitCode = 1
}
