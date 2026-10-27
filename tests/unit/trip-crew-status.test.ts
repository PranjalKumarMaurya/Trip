import assert from 'node:assert/strict'
import test from 'node:test'

import {
  type CrewFlight, type CrewTrip, crewStatus, crewStatuses, flightsFor, shortCountdown, tripWindow,
} from '../../src/features/trip/crewStatus.ts'

// Bali, Sun 1 – Sun 8 Nov 2026, Trip time UTC+8.
const bali: CrewTrip = { startDate: '2026-11-01', endDate: '2026-11-08', timeZone: 'Asia/Makassar', destination: 'Bali' }

let sequence = 0
function flight(dep: string | null, arr: string | null, startsAt: string, endsAt: string | null, extra: Partial<CrewFlight> = {}): CrewFlight {
  sequence += 1
  return { id: `f${String(sequence).padStart(3, '0')}`, starts_at: startsAt, ends_at: endsAt, dep_code: dep, arr_code: arr, ...extra }
}

const at = (iso: string) => Date.parse(iso)
const status = (flights: CrewFlight[], iso: string, trip = bali) => {
  const { label, detail, phase } = crewStatus(flights, trip, at(iso))
  return { phase, label, detail }
}

// Mumbai → Singapore → Bali, and back the same way.
const outbound = [
  flight('BOM', 'SIN', '2026-10-31T18:00:00Z', '2026-11-01T00:00:00Z'),
  flight('SIN', 'DPS', '2026-11-01T03:00:00Z', '2026-11-01T05:30:00Z'),
]
const homeward = [
  flight('DPS', 'SIN', '2026-11-08T04:00:00Z', '2026-11-08T06:30:00Z'),
  flight('SIN', 'BOM', '2026-11-08T10:00:00Z', '2026-11-08T15:00:00Z'),
]

test('the Trip window is midnight to midnight in the Trip timezone', () => {
  assert.deepEqual(tripWindow(bali), { start: at('2026-10-31T16:00:00Z'), end: at('2026-11-08T16:00:00Z') })
  assert.equal(tripWindow({ ...bali, endDate: 'soon' }), null)
  assert.equal(tripWindow({ ...bali, endDate: '2026-10-01' }), null)
})

test('multi-leg journeys: not left, in the air, layover, at the destination, heading home, back home', () => {
  const flights = [...homeward, ...outbound]
  assert.deepEqual(status(flights, '2026-10-30T00:00:00Z'), { phase: 'not-left', label: 'Not left yet', detail: 'Flies in 1d 18h' })
  assert.deepEqual(status(flights, '2026-10-31T20:00:00Z'), { phase: 'in-air', label: 'In the air', detail: 'BOM → SIN' })
  assert.deepEqual(status(flights, '2026-11-01T01:00:00Z'), { phase: 'on-the-way', label: 'On the way', detail: 'Layover · SIN' })
  assert.deepEqual(status(flights, '2026-11-01T04:00:00Z'), { phase: 'in-air', label: 'In the air', detail: 'SIN → DPS' })
  assert.deepEqual(status(flights, '2026-11-01T06:00:00Z'), { phase: 'at-destination', label: 'At Bali', detail: 'Flies home in 6d 22h' })
  assert.deepEqual(status(flights, '2026-11-08T05:00:00Z'), { phase: 'heading-home', label: 'Heading home', detail: 'DPS → SIN' })
  assert.deepEqual(status(flights, '2026-11-08T08:00:00Z'), { phase: 'heading-home', label: 'Heading home', detail: 'Layover · SIN' })
  // Landed 23:00 on Sunday 8 Nov in Trip time.
  assert.deepEqual(status(flights, '2026-11-08T16:00:00Z'), { phase: 'back-home', label: 'Back home', detail: 'Landed Sun 8 Nov' })
  assert.deepEqual(status(flights, '2026-12-01T00:00:00Z').label, 'Back home')
})

test('departure and landing instants count as in the air', () => {
  assert.equal(status(outbound, '2026-10-31T18:00:00Z').label, 'In the air')
  assert.equal(status(outbound, '2026-11-01T05:30:00Z').label, 'In the air')
  assert.deepEqual(status(outbound, '2026-11-01T05:31:00Z'), { phase: 'at-destination', label: 'At Bali', detail: 'Landed 13:30' })
})

test('without flights, the Trip dates in the Trip timezone decide', () => {
  // 16:30 UTC on 31 Oct is already 00:30 on 1 Nov in Bali.
  assert.deepEqual(status([], '2026-10-31T16:30:00Z'), { phase: 'on-trip', label: 'On the trip', detail: 'Day 1 of 8' })
  assert.deepEqual(status([], '2026-10-31T16:30:00Z', { ...bali, timeZone: 'UTC' }),
    { phase: 'before-trip', label: 'Before the trip', detail: 'Starts in 7h 30m' })
  assert.deepEqual(status([], '2026-10-29T15:00:00Z'), { phase: 'before-trip', label: 'Before the trip', detail: 'Starts in 2d 1h' })
  assert.deepEqual(status([], '2026-11-08T15:59:00Z'), { phase: 'on-trip', label: 'On the trip', detail: 'Day 8 of 8' })
  assert.deepEqual(status([], '2026-11-08T16:00:00Z'), { phase: 'trip-over', label: 'Trip over', detail: null })
})

test('Trip days follow the Trip clock across a DST change', () => {
  // New York falls back on Sun 1 Nov 2026; that day is 25 hours long.
  const nyc: CrewTrip = { startDate: '2026-10-31', endDate: '2026-11-02', timeZone: 'America/New_York', destination: 'New York' }
  assert.deepEqual(tripWindow(nyc), { start: at('2026-10-31T04:00:00Z'), end: at('2026-11-03T05:00:00Z') })
  assert.equal(status([], '2026-11-02T04:30:00Z', nyc).detail, 'Day 2 of 3') // 23:30 EST on 1 Nov
  assert.equal(status([], '2026-11-02T05:00:00Z', nyc).detail, 'Day 3 of 3') // midnight EST on 2 Nov
  assert.equal(status([], '2026-11-03T05:00:00Z', nyc).label, 'Trip over')
})

test('a hop during the Trip shows where people are now', () => {
  const flights = [
    flight('BOM', 'DPS', '2026-10-31T20:00:00Z', '2026-11-01T05:30:00Z'),
    flight('DPS', 'LOP', '2026-11-03T02:00:00Z', '2026-11-03T03:00:00Z', { location_to: 'Lombok' }),
    flight('LOP', 'BOM', '2026-11-07T04:00:00Z', '2026-11-07T12:00:00Z'),
  ]
  assert.deepEqual(status(flights, '2026-11-02T00:00:00Z'), { phase: 'at-destination', label: 'At Bali', detail: 'Next flight in 1d 2h' })
  assert.deepEqual(status(flights, '2026-11-03T02:30:00Z'), { phase: 'in-air', label: 'In the air', detail: 'DPS → LOP' })
  assert.deepEqual(status(flights, '2026-11-04T00:00:00Z'), { phase: 'at-destination', label: 'At Lombok', detail: 'Flies home in 3d 4h' })
  // Ends where the way out began (BOM), so it is the way home even mid-Trip.
  assert.equal(status(flights, '2026-11-07T05:00:00Z').label, 'Heading home')
  assert.equal(status(flights, '2026-11-07T13:00:00Z').label, 'Back home')
})

test('a late hop that does not end at home is not the way home', () => {
  const flights = [
    flight('BOM', 'DPS', '2026-10-31T20:00:00Z', '2026-11-01T05:30:00Z'),
    flight('DPS', 'LOP', '2026-11-05T02:00:00Z', '2026-11-05T03:00:00Z'),
  ]
  assert.deepEqual(status(flights, '2026-11-05T02:30:00Z'), { phase: 'in-air', label: 'In the air', detail: 'DPS → LOP' })
  assert.equal(status(flights, '2026-11-06T00:00:00Z').label, 'At LOP')
  // Past the Trip with no way home entered: fall back to the dates.
  assert.equal(status(flights, '2026-11-09T00:00:00Z').label, 'Trip over')
})

test('only one way entered', () => {
  const out = [flight('BOM', 'DPS', '2026-10-31T20:00:00Z', '2026-11-01T05:30:00Z')]
  assert.equal(status(out, '2026-11-04T00:00:00Z').label, 'At Bali')
  assert.equal(status(out, '2026-11-04T00:00:00Z').detail, null)
  assert.equal(status(out, '2026-11-10T00:00:00Z').label, 'Trip over')

  const back = [flight('DPS', 'BOM', '2026-11-08T04:00:00Z', '2026-11-08T12:00:00Z')]
  assert.deepEqual(status(back, '2026-11-03T00:00:00Z'), { phase: 'on-trip', label: 'On the trip', detail: 'Day 3 of 8' })
  assert.equal(status(back, '2026-10-20T00:00:00Z').label, 'Before the trip')
  assert.equal(status(back, '2026-11-08T05:00:00Z').label, 'Heading home')
  assert.equal(status(back, '2026-11-09T00:00:00Z').label, 'Back home')
})

test('flights without codes or end times still work', () => {
  const flights = [
    flight(null, null, '2026-10-31T20:00:00Z', '2026-11-01T02:00:00Z'),
    flight(null, null, '2026-11-01T04:00:00Z', null),
    flight(null, null, '2026-11-08T04:00:00Z', '2026-11-08T02:00:00Z'), // end before start: ignored
  ]
  assert.deepEqual(status(flights, '2026-10-31T21:00:00Z'), { phase: 'in-air', label: 'In the air', detail: '— → —' })
  assert.deepEqual(status(flights, '2026-11-01T03:00:00Z'), { phase: 'on-the-way', label: 'On the way', detail: 'Between flights' })
  assert.equal(status(flights, '2026-11-01T05:00:00Z').label, 'At Bali')
  assert.equal(status(flights, '2026-11-08T04:00:00Z').label, 'Heading home')
  assert.equal(status(flights, '2026-11-08T04:01:00Z').label, 'Back home')
  assert.equal(status([flight('BOM', 'DPS', 'not a date', null)], '2026-11-03T00:00:00Z').label, 'On the trip')
})

test('legs that do not connect are separate journeys', () => {
  // Lands in DPS, next flight leaves from SIN three hours later: not a connection.
  const flights = [
    flight('BOM', 'DPS', '2026-10-31T20:00:00Z', '2026-11-01T02:00:00Z'),
    flight('SIN', 'KUL', '2026-11-01T05:00:00Z', '2026-11-01T06:00:00Z'),
  ]
  assert.equal(status(flights, '2026-11-01T03:00:00Z').label, 'At Bali')
  // More than 12 hours between legs: a stop, not a layover.
  const stop = [
    flight('BOM', 'DPS', '2026-10-31T20:00:00Z', '2026-11-01T02:00:00Z'),
    flight('DPS', 'LOP', '2026-11-01T15:00:00Z', '2026-11-01T16:00:00Z'),
  ]
  assert.equal(status(stop, '2026-11-01T14:00:00Z').label, 'At Bali')
})

test('the audience decides whose flight it is; no audience means everyone', () => {
  const together = flight('BOM', 'DPS', '2026-10-31T20:00:00Z', '2026-11-01T05:30:00Z')
  const friendOnly = flight('DEL', 'DPS', '2026-11-02T00:00:00Z', '2026-11-02T08:00:00Z')
  const audience = new Map([[friendOnly.id, ['friend']]])
  assert.deepEqual(flightsFor('owner', [together, friendOnly], audience).map((entry) => entry.id), [together.id])
  assert.deepEqual(flightsFor('friend', [together, friendOnly], audience).map((entry) => entry.id), [together.id, friendOnly.id])

  const events = [
    { ...friendOnly, event_type: 'flight' },
    { ...flight(null, null, '2026-11-02T01:00:00Z', '2026-11-02T03:00:00Z'), event_type: 'activity' },
  ]
  const statuses = crewStatuses([
    { groupMemberId: 'owner', displayName: 'Owner' },
    { groupMemberId: 'friend', displayName: 'Friend' },
  ], events, audience, bali, at('2026-11-02T02:00:00Z'))
  assert.deepEqual(statuses.get('owner'), { phase: 'on-trip', label: 'On the trip', detail: 'Day 2 of 8' })
  assert.deepEqual(statuses.get('friend'), { phase: 'in-air', label: 'In the air', detail: 'DEL → DPS' })
})

test('short countdowns', () => {
  const now = at('2026-11-01T00:00:00Z')
  assert.equal(shortCountdown(now + 25 * 60_000, now), '25m')
  assert.equal(shortCountdown(now + 30_000, now), '1m')
  assert.equal(shortCountdown(now + 3 * 3_600_000, now), '3h')
  assert.equal(shortCountdown(now + 200 * 60_000, now), '3h 20m')
  assert.equal(shortCountdown(now + 2 * 86_400_000, now), '2d')
  assert.equal(shortCountdown(now + 2 * 86_400_000 + 4 * 3_600_000 + 59_000, now), '2d 4h')
})
