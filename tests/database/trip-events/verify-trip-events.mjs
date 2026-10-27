// Trip itinerary table (migration 024): Group isolation and member-only writes.
import assert from 'node:assert/strict'
import { createLocalStack } from '../../support/local-stack.mjs'
import { createTrip, createUsers, quote, sqlAs } from '../../support/db-fixtures.mjs'

const stack = createLocalStack({ projectId: 'trip-events-verify', basePort: 58500 })
const tripA = 'b0000000-0000-4000-8000-00000000000a'
const tripB = 'b0000000-0000-4000-8000-00000000000b'

function insertEvent(groupId, createdBy, title = 'Flight') {
  return `INSERT INTO public.trip_events (group_id, event_type, title, starts_at, created_by)
    VALUES (${quote(groupId)}, 'flight', ${quote(title)}, '2026-11-01T05:00:00Z', ${quote(createdBy)}) RETURNING id;`
}

try {
  stack.start()
  stack.migrate()
  const user = createUsers(stack, ['owner', 'friend', 'stranger'])
  const a = createTrip(stack, { groupId: tripA, name: 'Goa', members: { [user.owner]: 'owner', [user.friend]: 'member' } })
  const b = createTrip(stack, { groupId: tripB, name: 'Jaipur', members: { [user.owner]: 'owner' } })

  // Members can add events to their own Trip, stamped with their own member id.
  const created = sqlAs(stack, user.friend, insertEvent(tripA, a.memberIds[user.friend]))
  assert.equal(created.ok, true, created.error)
  const eventId = created.rows[0][0]
  assert.equal(sqlAs(stack, user.owner, insertEvent(tripB, b.memberIds[user.owner], 'Train')).ok, true)

  // Nobody can impersonate another member or write into a Trip they are not in.
  assert.equal(sqlAs(stack, user.friend, insertEvent(tripA, a.memberIds[user.owner])).ok, false, 'impersonated creator')
  assert.equal(sqlAs(stack, user.friend, insertEvent(tripB, b.memberIds[user.owner])).ok, false, 'foreign Trip insert')
  assert.equal(sqlAs(stack, user.stranger, insertEvent(tripA, a.memberIds[user.owner])).ok, false, 'stranger insert')

  // Reads are scoped to the caller's Trips.
  assert.deepEqual(sqlAs(stack, user.friend, 'SELECT title FROM public.trip_events ORDER BY title;').rows, [['Flight']])
  assert.deepEqual(sqlAs(stack, user.owner, 'SELECT title FROM public.trip_events ORDER BY title;').rows, [['Flight'], ['Train']])
  assert.deepEqual(sqlAs(stack, user.stranger, 'SELECT title FROM public.trip_events;').rows, [])
  assert.equal(sqlAs(stack, null, 'SELECT count(*) FROM public.trip_events;').ok, false, 'anon read')

  // Events cannot move between Trips or change creator; foreign rows are untouchable.
  assert.equal(sqlAs(stack, user.owner, `UPDATE public.trip_events SET group_id = ${quote(tripB)} WHERE id = ${quote(eventId)};`).ok, false)
  assert.equal(sqlAs(stack, user.owner, `UPDATE public.trip_events SET created_by = ${quote(a.memberIds[user.owner])} WHERE id = ${quote(eventId)};`).ok, false)
  assert.deepEqual(sqlAs(stack, user.stranger, `UPDATE public.trip_events SET title = 'x' WHERE id = ${quote(eventId)} RETURNING id;`).rows, [])
  assert.deepEqual(sqlAs(stack, user.owner, `UPDATE public.trip_events SET title = 'Flight to Goa' WHERE id = ${quote(eventId)} RETURNING title;`).rows, [['Flight to Goa']])

  // A removed member loses access immediately.
  stack.psql(`UPDATE public.group_members SET status = 'inactive' WHERE id = ${quote(a.memberIds[user.friend])};`)
  assert.deepEqual(sqlAs(stack, user.friend, 'SELECT title FROM public.trip_events;').rows, [])
  assert.deepEqual(sqlAs(stack, user.friend, `DELETE FROM public.trip_events WHERE id = ${quote(eventId)} RETURNING id;`).rows, [])

  stack.stop()
  console.log(JSON.stringify({ tripEvents: 'passed', isolation: 'passed', impersonation: 'passed', removal: 'passed', cleanup: 'passed' }))
} catch (error) {
  try { stack.stop() } catch { /* keep the primary failure */ }
  console.error(error instanceof Error && /^[a-z0-9-]+$/u.test(error.message) ? error.message : 'trip-events-verification-failed')
  if (process.env.TRIP_DEBUG === '1') console.error(error)
  process.exitCode = 1
}
