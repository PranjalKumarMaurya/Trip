import assert from 'node:assert/strict'
import test from 'node:test'

import {
  countdown, emptyEventForm, eventStatuses, formatCountdown, nextFlight, safeMapUrl, sortEvents, validateEventForm,
} from '../../src/features/trip/itinerary.ts'
import {
  dayKey, dualTime, formatDay, formatTime, isoToZonedInput, timeZoneCity, timeZoneOffsetMs, zonedInputToIso,
} from '../../src/features/trip/tripTime.ts'

test('typed times are read as wall-clock time in the Trip timezone', () => {
  assert.equal(zonedInputToIso('2026-11-01T10:30', 'Asia/Kolkata'), '2026-11-01T05:00:00.000Z')
  assert.equal(zonedInputToIso('2026-11-01T10:30', 'Asia/Makassar'), '2026-11-01T02:30:00.000Z')
  assert.equal(zonedInputToIso('2026-11-01T00:15', 'UTC'), '2026-11-01T00:15:00.000Z')
  assert.equal(zonedInputToIso('2026-07-01T09:00', 'America/Los_Angeles'), '2026-07-01T16:00:00.000Z')
})

test('DST: skipped times move forward, repeated times pick the earlier instant', () => {
  // New York springs forward at 02:00 on 2026-03-08; 02:30 does not exist.
  assert.equal(zonedInputToIso('2026-03-08T02:30', 'America/New_York'), '2026-03-08T07:30:00.000Z')
  assert.equal(isoToZonedInput('2026-03-08T07:30:00.000Z', 'America/New_York'), '2026-03-08T03:30')
  // Falls back at 02:00 on 2026-11-01; 01:30 happens twice (EDT first).
  assert.equal(zonedInputToIso('2026-11-01T01:30', 'America/New_York'), '2026-11-01T05:30:00.000Z')
  assert.equal(zonedInputToIso('2026-11-01T03:00', 'America/New_York'), '2026-11-01T08:00:00.000Z')
})

test('invalid typed times are rejected', () => {
  assert.equal(zonedInputToIso('', 'Asia/Kolkata'), null)
  assert.equal(zonedInputToIso('2026-02-30T10:00', 'Asia/Kolkata'), null)
  assert.equal(zonedInputToIso('2026-11-01 10:00', 'Asia/Kolkata'), null)
  assert.equal(zonedInputToIso('2026-11-01T24:00', 'Asia/Kolkata'), null)
})

test('stored instants round-trip into the edit form in the Trip timezone', () => {
  for (const zone of ['Asia/Kolkata', 'Asia/Makassar', 'Europe/London', 'America/New_York', 'Australia/Adelaide']) {
    for (const input of ['2026-01-15T06:15', '2026-06-30T23:45', '2026-11-01T12:00']) {
      const iso = zonedInputToIso(input, zone)
      assert.ok(iso)
      assert.equal(isoToZonedInput(iso, zone), input, `${zone} ${input}`)
    }
  }
  assert.equal(isoToZonedInput(null, 'Asia/Kolkata'), '')
  assert.equal(isoToZonedInput('not a date', 'Asia/Kolkata'), '')
})

test('offsets, labels and formatting', () => {
  const instant = Date.parse('2026-11-01T05:00:00Z')
  assert.equal(timeZoneOffsetMs(instant, 'Asia/Kolkata'), 5.5 * 3_600_000)
  assert.equal(timeZoneOffsetMs(instant, 'America/Los_Angeles'), -7 * 3_600_000)
  assert.equal(timeZoneCity('Asia/Kolkata'), 'Kolkata')
  assert.equal(timeZoneCity('America/Argentina/Buenos_Aires'), 'Buenos Aires')
  assert.equal(formatTime('2026-11-01T05:00:00Z', 'Asia/Kolkata'), '10:30')
  assert.equal(formatDay('2026-11-01T20:00:00Z', 'Asia/Kolkata'), 'Mon 2 Nov')
  assert.equal(dayKey('2026-11-01T20:00:00Z', 'Asia/Kolkata'), '2026-11-02')
  assert.equal(dayKey('2026-11-01T20:00:00Z', 'UTC'), '2026-11-01')
})

test('dual time shows the viewer clock only when it reads differently', () => {
  const same = dualTime('2026-11-01T05:00:00Z', 'Asia/Kolkata', 'Asia/Kolkata')
  assert.deepEqual({ trip: same.trip, day: same.tripDay, local: same.local }, { trip: '10:30', day: 'Sun 1 Nov', local: undefined })
  // An alias with the same offset is not a different clock.
  assert.equal(dualTime('2026-11-01T05:00:00Z', 'Asia/Kolkata', 'Asia/Calcutta').local, undefined)
  const apart = dualTime('2026-11-01T20:00:00Z', 'Asia/Makassar', 'Europe/Berlin')
  assert.equal(apart.trip, '04:00')
  assert.equal(apart.tripDay, 'Mon 2 Nov')
  assert.deepEqual(apart.local, { time: '21:00', day: 'Sun 1 Nov', label: 'your time' })
})

const event = (id: string, startsAt: string, endsAt: string | null = null, type = 'activity') =>
  ({ id, starts_at: startsAt, ends_at: endsAt, event_type: type })

test('events are marked past, live, next and upcoming', () => {
  const now = Date.parse('2026-11-02T12:00:00Z')
  const events = [
    event('later', '2026-11-04T09:00:00Z'),
    event('done', '2026-11-01T09:00:00Z', '2026-11-01T10:00:00Z'),
    event('point-past', '2026-11-02T11:59:00Z'),
    event('stay', '2026-11-01T14:00:00Z', '2026-11-05T10:00:00Z', 'hotel'),
    event('soon', '2026-11-03T09:00:00Z'),
  ]
  const statuses = eventStatuses(events, now)
  assert.deepEqual(Object.fromEntries(statuses), {
    done: 'past', stay: 'live', 'point-past': 'past', soon: 'next', later: 'upcoming',
  })
  assert.deepEqual(sortEvents(events).map((entry) => entry.id), ['done', 'stay', 'point-past', 'soon', 'later'])
  // Exactly at the start of a point event it is live.
  assert.equal(eventStatuses([event('now', '2026-11-02T12:00:00Z')], now).get('now'), 'live')
  assert.equal(eventStatuses([], now).size, 0)
})

test('next flight and countdown', () => {
  const now = Date.parse('2026-11-01T00:00:00Z')
  const events = [
    event('gone', '2026-10-31T09:00:00Z', null, 'flight'),
    event('dinner', '2026-11-01T01:00:00Z', null, 'food'),
    event('return', '2026-11-05T09:00:00Z', null, 'flight'),
    event('out', '2026-11-02T03:04:05Z', null, 'flight'),
  ]
  assert.equal(nextFlight(events, now)?.id, 'out')
  assert.equal(nextFlight(events.slice(0, 2), now), null)
  const parts = countdown(Date.parse('2026-11-02T03:04:05Z'), now)
  assert.deepEqual(parts, { days: 1, hours: 3, minutes: 4, seconds: 5, totalMs: 97_445_000 })
  assert.equal(formatCountdown(parts), '1d 03h 04m 05s')
  assert.equal(formatCountdown(countdown(now + 61_000, now)), '00h 01m 01s')
  assert.equal(countdown(now - 1, now).totalMs, 0)
})

test('only http(s) map links are kept', () => {
  assert.equal(safeMapUrl('https://maps.app.goo.gl/abc'), 'https://maps.app.goo.gl/abc')
  assert.equal(safeMapUrl(' http://example.test/map '), 'http://example.test/map')
  assert.equal(safeMapUrl('javascript:alert(1)'), null)
  assert.equal(safeMapUrl('data:text/html,hi'), null)
  assert.equal(safeMapUrl('maps.google.com'), null)
  assert.equal(safeMapUrl(null), null)
})

test('event form validation and payload', () => {
  const missing = validateEventForm(emptyEventForm, 'Asia/Kolkata')
  assert.equal(missing.ok, false)
  if (!missing.ok) assert.deepEqual(Object.keys(missing.errors).sort(), ['startsAt', 'title'])

  const backwards = validateEventForm({ ...emptyEventForm, title: 'Dinner', startsAt: '2026-11-01T20:00', endsAt: '2026-11-01T19:00', mapUrl: 'javascript:x' }, 'Asia/Kolkata')
  assert.equal(backwards.ok, false)
  if (!backwards.ok) assert.deepEqual(Object.keys(backwards.errors).sort(), ['endsAt', 'mapUrl'])

  const flight = validateEventForm({
    ...emptyEventForm, eventType: 'flight', title: '  Fly to Bali ', startsAt: '2026-11-01T06:15', endsAt: '2026-11-01T14:40',
    depCode: 'bom', arrCode: 'dps', flightNo: '6e 1601', airline: 'IndiGo', terminal: '2', notes: ' window seats ',
  }, 'Asia/Kolkata')
  assert.equal(flight.ok, true)
  if (flight.ok) {
    assert.deepEqual(flight.payload, {
      event_type: 'flight', title: 'Fly to Bali', starts_at: '2026-11-01T00:45:00.000Z', ends_at: '2026-11-01T09:10:00.000Z',
      location: null, location_to: null, map_url: null, notes: 'window seats', dep_code: 'BOM', arr_code: 'DPS',
      flight_no: '6E 1601', airline: 'IndiGo', terminal: '2', booking_ref: null,
    })
  }

  // Flight-only fields are dropped for other types.
  const dinner = validateEventForm({ ...emptyEventForm, eventType: 'food', title: 'Dinner', startsAt: '2026-11-01T20:00', depCode: 'BOM' }, 'Asia/Makassar')
  assert.equal(dinner.ok, true)
  if (dinner.ok) {
    assert.equal(dinner.payload.dep_code, null)
    assert.equal(dinner.payload.starts_at, '2026-11-01T12:00:00.000Z')
  }
  assert.equal(validateEventForm({ ...emptyEventForm, eventType: 'party', title: 'x', startsAt: '2026-11-01T20:00' }, 'UTC').ok, false)
})
