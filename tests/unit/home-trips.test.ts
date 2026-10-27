import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  calendarDateIn, daysBetween, groupTrips, inviteProofFromInput, relativeTripLine, tripPhase,
} from '../../src/features/home/tripGrouping.ts'
import {
  PHONE_PATTERN, UPI_PATTERN, emailError, newPasswordError, profileChanges, validateProfileForm,
} from '../../src/features/profile/profileRules.ts'

const trip = (name: string, startDate: string, endDate: string, timezone = 'Asia/Kolkata') => ({ name, startDate, endDate, timezone })
// 28 Oct 2026, 20:00 UTC: already 29 Oct in Bali (UTC+8) and Kolkata (UTC+5:30), still 28 Oct in New York.
const now = new Date('2026-10-28T20:00:00Z')

test('today is read in each Trip’s own timezone, with UTC for an unusable zone', () => {
  assert.equal(calendarDateIn('Asia/Makassar', now), '2026-10-29')
  assert.equal(calendarDateIn('America/New_York', now), '2026-10-28')
  assert.equal(calendarDateIn('Not/AZone', now), '2026-10-28')
  assert.equal(daysBetween('2026-10-29', '2026-11-03'), 5)
  assert.equal(daysBetween('2027-03-27', '2027-03-29'), 2, 'DST changes do not skew whole days')
})

test('a Trip is upcoming, ongoing or past by its dates in its timezone', () => {
  assert.equal(tripPhase(trip('Bali', '2026-10-29', '2026-11-04', 'Asia/Makassar'), now), 'ongoing')
  assert.equal(tripPhase(trip('NYC', '2026-10-29', '2026-11-04', 'America/New_York'), now), 'upcoming')
  assert.equal(tripPhase(trip('Goa', '2026-10-20', '2026-10-28', 'Asia/Kolkata'), now), 'past')
  assert.equal(tripPhase(trip('Boston', '2026-10-20', '2026-10-28', 'America/New_York'), now), 'ongoing', 'last day still ongoing')
})

test('the relative line reads naturally', () => {
  assert.equal(relativeTripLine(trip('Bali', '2026-10-27', '2026-11-02', 'Asia/Makassar'), now), 'Day 3 of 7')
  assert.equal(relativeTripLine(trip('Day trip', '2026-10-29', '2026-10-29'), now), 'Day 1 of 1')
  assert.equal(relativeTripLine(trip('Soon', '2026-10-30', '2026-11-02'), now), 'Starts tomorrow')
  assert.equal(relativeTripLine(trip('Goa', '2026-11-03', '2026-11-08'), now), 'in 5 days')
  assert.equal(relativeTripLine(trip('Far', '2027-02-01', '2027-02-08'), now), 'in 3 months')
  assert.equal(relativeTripLine(trip('Done', '2026-10-28', '2026-11-02', 'Asia/Kolkata'), new Date('2026-11-05T12:00:00Z')), 'Ended 2 Nov')
  assert.equal(relativeTripLine(trip('Old', '2025-12-20', '2025-12-24'), now), 'Ended 24 Dec 2025')
})

test('Trips are grouped and ordered: ongoing ends soonest, upcoming starts soonest, past most recent', () => {
  const trips = [
    trip('Past A', '2026-09-01', '2026-09-05'),
    trip('Upcoming late', '2026-12-20', '2026-12-30'),
    trip('Ongoing long', '2026-10-20', '2026-11-20'),
    trip('Past B', '2026-10-01', '2026-10-10'),
    trip('Upcoming soon', '2026-11-03', '2026-11-08'),
    trip('Ongoing short', '2026-10-28', '2026-10-30'),
  ]
  const grouped = groupTrips(trips, now)
  assert.deepEqual(grouped.ongoing.map((entry) => entry.name), ['Ongoing short', 'Ongoing long'])
  assert.deepEqual(grouped.upcoming.map((entry) => entry.name), ['Upcoming soon', 'Upcoming late'])
  assert.deepEqual(grouped.past.map((entry) => entry.name), ['Past B', 'Past A'])
  assert.deepEqual(groupTrips([], now), { ongoing: [], upcoming: [], past: [] })
})

test('a pasted invite link or bare code yields the proof; anything else is refused', () => {
  const proof = 'ab'.repeat(32)
  assert.equal(inviteProofFromInput(`https://trip.example/#invite=${proof}`), proof)
  assert.equal(inviteProofFromInput(`  http://127.0.0.1:4173/?x=1#invite=${proof}\n`), proof)
  assert.equal(inviteProofFromInput(proof), proof)
  assert.equal(inviteProofFromInput(`Join my Trip: https://trip.example/#invite=${proof} see you`), proof)
  assert.equal(inviteProofFromInput(`https://trip.example/#invite=${proof}ff`), null, 'too long')
  assert.equal(inviteProofFromInput(`https://trip.example/#invite=${proof.toUpperCase()}`), null)
  assert.equal(inviteProofFromInput('https://trip.example/'), null)
  assert.equal(inviteProofFromInput(''), null)
})

test('profile patterns match the database checks in migration 025', () => {
  const sql = readFileSync('supabase/migrations/025_trip_profile_base.sql', 'utf8')
  assert.ok(sql.includes(`upi_id ~ '${UPI_PATTERN.source}'`), 'UPI pattern')
  assert.ok(sql.includes(`phone ~ '${PHONE_PATTERN.source}'`), 'phone pattern')
})

test('profile validation and normalisation', () => {
  const values = { displayName: ' Partha ', homeCurrency: 'INR', upiId: 'partha@okaxis', phone: '+91 98765 43210', emergencyContact: '', dietaryNotes: ' Vegetarian ' }
  assert.deepEqual(validateProfileForm(values), {})
  assert.deepEqual(profileChanges(values), {
    display_name: 'Partha', home_currency: 'INR', upi_id: 'partha@okaxis', phone: '+91 98765 43210', emergency_contact: null, dietary_notes: 'Vegetarian',
  })
  const errors = validateProfileForm({ ...values, displayName: '  ', upiId: 'not a upi', phone: 'call me', dietaryNotes: 'x'.repeat(301) })
  assert.deepEqual(Object.keys(errors).sort(), ['dietaryNotes', 'displayName', 'phone', 'upiId'])
  assert.equal(newPasswordError('short', 'short'), 'Use at least 8 characters.')
  assert.equal(newPasswordError('LongerPass1', 'LongerPass2'), 'The new passwords don’t match.')
  assert.equal(newPasswordError('LongerPass1', 'LongerPass1'), null)
  assert.equal(emailError('me@example.test', 'ME@example.test'), 'That’s already your email address.')
  assert.equal(emailError('nope', undefined), 'Enter an email address like you@example.com.')
  assert.equal(emailError('new@example.test', 'old@example.test'), null)
})
