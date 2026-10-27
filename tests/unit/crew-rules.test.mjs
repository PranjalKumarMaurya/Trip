import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canStepDown, crewErrorCode, crewErrorCodeOf, crewErrorView, formatCalendarDate, formatDay, formatInstant,
  invitationStatusLabel, leaveBlockReason, lifecycleOutcome, memberActionsFor, parseArchivedTrips,
  parseInvitationList, splitInvitations,
} from '../../src/features/crew/crewRules.ts'

const member = (id, role, status = 'active') => ({ groupMemberId: id, displayName: `Person ${id}`, role, status })
const owner = { groupMemberId: 'o1', role: 'owner' }
const plainMember = { groupMemberId: 'm1', role: 'member' }

test('database refusals map to stable codes; anything else is a retryable unknown', () => {
  for (const code of ['last_owner', 'not_authorized', 'invalid_target', 'invalid_invitation', 'idempotency_conflict']) {
    assert.equal(crewErrorCode(code), code)
  }
  assert.equal(crewErrorCode('invalid_request'), 'not_authorized')
  assert.equal(crewErrorCode('operation_failed'), 'unavailable')
  assert.equal(crewErrorCode('TypeError: Failed to fetch'), 'unavailable')
  assert.equal(crewErrorCode(undefined), 'unavailable')
  assert.equal(crewErrorCodeOf(new Error('last_owner')), 'last_owner')
  assert.equal(crewErrorCodeOf('last_owner'), 'unavailable')
})

test('only transport failures offer retry; refusals explain the consequence', () => {
  assert.equal(crewErrorView('remove', 'unavailable').retryable, true)
  for (const code of ['last_owner', 'not_authorized', 'invalid_target', 'invalid_invitation', 'idempotency_conflict']) {
    assert.equal(crewErrorView('remove', code, 'Asha').retryable, false, code)
  }
  assert.match(crewErrorView('leave', 'last_owner').message, /last Owner.*transfer ownership/)
  assert.match(crewErrorView('demote', 'last_owner', 'Asha').message, /^Asha is the last Owner/)
  assert.match(crewErrorView('remove', 'last_owner', 'Asha').message, /cannot be removed/)
  assert.match(crewErrorView('promote', 'invalid_target', 'Asha').message, /^Asha is no longer an active member/)
  assert.match(crewErrorView('promote', 'not_authorized').message, /Only an active Owner/)
  assert.match(crewErrorView('leave', 'not_authorized').message, /no longer an active member/)
  for (const view of [crewErrorView('archive', 'not_authorized'), crewErrorView('promote', 'unavailable')]) {
    assert.doesNotMatch(view.message, /not_authorized|P0001|RLS|policy/i)
  }
})

test('the last Owner is told to hand over before leaving; others may leave', () => {
  assert.equal(leaveBlockReason(plainMember, [member('o1', 'owner'), member('m1', 'member')]), null)
  assert.match(leaveBlockReason(owner, [member('o1', 'owner'), member('m1', 'member')]), /only Owner.*transfer ownership/)
  assert.match(leaveBlockReason(owner, [member('o1', 'owner'), member('x', 'owner', 'inactive')]), /only member.*Archive/)
  assert.equal(leaveBlockReason(owner, [member('o1', 'owner'), member('o2', 'owner')]), null)
  // An unloaded roster never blocks: the server decides.
  assert.equal(leaveBlockReason(owner, []), null)
})

test('step down is offered only while another active Owner remains', () => {
  assert.equal(canStepDown(owner, [member('o1', 'owner'), member('m1', 'member')]), false)
  assert.equal(canStepDown(owner, [member('o1', 'owner'), member('o2', 'owner', 'inactive')]), false)
  assert.equal(canStepDown(owner, [member('o1', 'owner'), member('o2', 'owner')]), true)
  assert.equal(canStepDown(plainMember, [member('o1', 'owner'), member('o2', 'owner')]), false)
})

test('management actions are Owner-only and never target the viewer or former members', () => {
  assert.deepEqual(memberActionsFor(owner, member('m1', 'member')), ['promote', 'transfer', 'remove'])
  assert.deepEqual(memberActionsFor(owner, member('o2', 'owner')), ['demote', 'remove'])
  assert.deepEqual(memberActionsFor(owner, member('o1', 'owner')), [])
  assert.deepEqual(memberActionsFor(owner, member('m2', 'member', 'inactive')), [])
  assert.deepEqual(memberActionsFor(plainMember, member('o1', 'owner')), [])
})

test('invitation list parsing keeps recipient, status and expiry and rejects odd shapes', () => {
  const data = {
    live_count: 1,
    items: [
      { invitation_id: 'i2', recipient_email: 'b@example.test', status: 'pending', expires_at: '2026-11-08T10:00:00Z', created_at: '2026-11-01T10:00:00Z' },
      { invitation_id: 'i1', recipient_email: 'a@example.test', status: 'accepted', expires_at: '2026-11-07T10:00:00Z', created_at: '2026-10-31T10:00:00Z' },
    ],
  }
  const parsed = parseInvitationList(data)
  assert.equal(parsed.liveCount, 1)
  assert.deepEqual(Object.keys(parsed.items[0]).sort(), ['createdAt', 'expiresAt', 'invitationId', 'recipientEmail', 'status'])
  const { pending, past } = splitInvitations(parsed.items)
  assert.deepEqual(pending.map((item) => item.invitationId), ['i2'])
  assert.deepEqual(past.map((item) => item.invitationId), ['i1'])
  assert.equal(invitationStatusLabel('accepted'), 'Joined')
  assert.throws(() => parseInvitationList({ items: [] }), /unavailable/)
  assert.throws(() => parseInvitationList({ live_count: 0, items: [{ ...data.items[0], status: 'live' }] }), /unavailable/)
  assert.throws(() => parseInvitationList([]), /unavailable/)
})

test('lifecycle results must echo the request id and an expected outcome', () => {
  const requestId = 'r-1'
  assert.equal(lifecycleOutcome({ outcome: 'changed', request_id: requestId }, requestId, ['changed', 'unchanged']), 'changed')
  assert.equal(lifecycleOutcome({ outcome: 'already_completed', request_id: requestId }, requestId, ['changed']), 'already_completed')
  assert.throws(() => lifecycleOutcome({ outcome: 'changed', request_id: 'other' }, requestId, ['changed']), /unavailable/)
  assert.throws(() => lifecycleOutcome({ outcome: 'surprise', request_id: requestId }, requestId, ['changed']), /unavailable/)
  assert.throws(() => lifecycleOutcome(null, requestId, ['changed']), /unavailable/)
})

test('archived Trips parse strictly', () => {
  const row = { group_id: 'g', trip_name: 'Goa', destination: 'Goa', start_date: '2026-11-01', end_date: '2026-11-05', archived_at: '2026-11-10T08:00:00Z' }
  assert.deepEqual(parseArchivedTrips([row]), [{ groupId: 'g', tripName: 'Goa', destination: 'Goa', startDate: '2026-11-01', endDate: '2026-11-05', archivedAt: '2026-11-10T08:00:00Z' }])
  assert.throws(() => parseArchivedTrips([{ ...row, archived_at: null }]), /unavailable/)
  assert.throws(() => parseArchivedTrips({}), /unavailable/)
})

test('dates render plainly and calendar dates never shift by zone', () => {
  assert.equal(formatDay('2026-11-08T23:30:00Z', 'UTC'), '8 Nov 2026')
  assert.equal(formatInstant('2026-11-08T14:05:00Z', 'UTC'), '8 Nov 2026, 14:05')
  assert.equal(formatCalendarDate('2026-11-01'), '1 Nov 2026')
  assert.equal(formatDay('not a date'), 'not a date')
})
