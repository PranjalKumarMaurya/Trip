// Profile fields and Trip international flag (migration 025): own-profile edits,
// co-member visibility only, input validation.
import assert from 'node:assert/strict'
import { createLocalStack } from '../../support/local-stack.mjs'
import { createTrip, createUsers, quote, sqlAs } from '../../support/db-fixtures.mjs'

const stack = createLocalStack({ projectId: 'profile-base-verify', basePort: 58500 })
const tripA = 'b0000000-0000-4000-8000-00000000000a'
const tripB = 'b0000000-0000-4000-8000-00000000000b'
const profileOf = (userId) => `(SELECT id FROM public.profiles WHERE auth_user_id = ${quote(userId)})`

try {
  stack.start()
  stack.migrate()
  const user = createUsers(stack, ['owner', 'friend', 'stranger'])
  const a = createTrip(stack, { groupId: tripA, name: 'Goa', members: { [user.owner]: 'owner', [user.friend]: 'member' } })
  createTrip(stack, { groupId: tripB, name: 'Jaipur', members: { [user.stranger]: 'owner' } })

  // Everyone edits their own profile details; nobody edits someone else's.
  const update = (userId, target, set) => sqlAs(stack, userId,
    `UPDATE public.profiles SET ${set} WHERE id = ${profileOf(target)} RETURNING id;`)
  const first = update(user.friend, user.friend, "upi_id = 'friend@okaxis', phone = '+91 98765 43210', dietary_notes = 'Vegetarian', avatar_emoji = '🦊', home_currency = 'INR'")
  assert.equal(first.ok, true, first.error)
  assert.equal(first.rows.length, 1)
  assert.deepEqual(update(user.owner, user.friend, "upi_id = 'thief@okaxis'").rows, [], 'edit someone else')
  assert.equal(update(user.friend, user.friend, "upi_id = 'not a upi'").ok, false, 'invalid UPI')
  assert.equal(update(user.friend, user.friend, "home_currency = 'ZZZ'").ok, false, 'invalid currency')
  assert.deepEqual(sqlAs(stack, user.owner, `SELECT upi_id FROM public.profiles WHERE id = ${profileOf(user.friend)};`).rows, [], 'direct read of another profile')

  // Co-members see each other's details; strangers, anon and removed members do not.
  const members = (userId) => sqlAs(stack, userId, `SELECT display_name, upi_id, dietary_notes FROM public.get_trip_member_profiles(${quote(tripA)}) ORDER BY display_name;`)
  assert.deepEqual(members(user.owner).rows, [['friend', 'friend@okaxis', 'Vegetarian'], ['owner', '', '']])
  assert.deepEqual(members(user.stranger).rows, [])
  assert.equal(sqlAs(stack, null, `SELECT count(*) FROM public.get_trip_member_profiles(${quote(tripA)});`).ok, false, 'anon')
  stack.psql(`UPDATE public.group_members SET status = 'inactive' WHERE id = ${quote(a.memberIds[user.friend])};`)
  assert.deepEqual(members(user.friend).rows, [], 'removed member')
  assert.deepEqual(members(user.owner).rows, [['owner', '', '']], 'removed member hidden from others')

  // Trips are domestic by default and report the flag in get_my_group_access().
  assert.deepEqual(sqlAs(stack, user.owner, 'SELECT trip_name, is_international FROM public.get_my_group_access();').rows, [['Goa', 'f']])
  stack.psql(`UPDATE public.group_configurations SET is_international = true WHERE group_id = ${quote(tripA)};`)
  assert.deepEqual(sqlAs(stack, user.owner, 'SELECT is_international FROM public.get_my_group_access();').rows, [['t']])

  stack.stop()
  console.log(JSON.stringify({ profileBase: 'passed', ownEdits: 'passed', coMemberOnly: 'passed', validation: 'passed', international: 'passed', cleanup: 'passed' }))
} catch (error) {
  try { stack.stop() } catch { /* keep the primary failure */ }
  console.error(error instanceof Error && /^[a-z0-9-]+$/u.test(error.message) ? error.message : 'profile-base-verification-failed')
  if (process.env.TRIP_DEBUG === '1') console.error(error)
  process.exitCode = 1
}
