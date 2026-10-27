import assert from 'node:assert/strict'
import test from 'node:test'

import {
  emptyDraft, isValidTimeZone, normaliseExtraction, normaliseFlightNumber, readStoredDraft,
  utcToZonedWallTime, zonedWallTimeToUtc,
} from '../../supabase/functions/_shared/documentDraft.ts'

const goa = { timezone: 'Asia/Kolkata', startDate: '2026-11-01', endDate: '2026-11-05', destination: 'Goa' }

test('wall-clock times convert to UTC in the given IANA zone, both ways', () => {
  assert.equal(zonedWallTimeToUtc('2026-11-01T06:15', 'Asia/Kolkata'), '2026-11-01T00:45:00.000Z')
  assert.equal(zonedWallTimeToUtc('2026-11-01T09:00', 'Asia/Makassar'), '2026-11-01T01:00:00.000Z')
  assert.equal(zonedWallTimeToUtc('2026-07-01 12:00:30', 'Europe/London'), '2026-07-01T11:00:30.000Z')
  assert.equal(zonedWallTimeToUtc('2026-01-01T12:00', 'Europe/London'), '2026-01-01T12:00:00.000Z')
  // Around a DST change the offset of the target instant wins.
  assert.equal(zonedWallTimeToUtc('2026-03-29T03:30', 'Europe/Berlin'), '2026-03-29T01:30:00.000Z')
  assert.equal(zonedWallTimeToUtc('2026-11-01T01:30', 'America/New_York'), '2026-11-01T05:30:00.000Z')
  assert.equal(utcToZonedWallTime('2026-11-01T00:45:00.000Z', 'Asia/Kolkata'), '2026-11-01T06:15')
  assert.equal(utcToZonedWallTime('2026-11-01T23:30:00Z', 'Asia/Tokyo'), '2026-11-02T08:30')
  assert.equal(utcToZonedWallTime('2026-11-01T23:30:00Z', 'Not/AZone'), '')
})

test('invalid dates, times, and zones are rejected rather than guessed', () => {
  assert.equal(zonedWallTimeToUtc('2026-02-30T10:00', 'UTC'), null)
  assert.equal(zonedWallTimeToUtc('2026-11-01T24:00', 'UTC'), null)
  assert.equal(zonedWallTimeToUtc('1 Nov 2026 06:15', 'UTC'), null)
  assert.equal(zonedWallTimeToUtc('2026-11-01T06:15', 'Mars/Olympus'), null)
  assert.equal(isValidTimeZone('Asia/Kolkata'), true)
  assert.equal(isValidTimeZone('UTC'), true)
  assert.equal(isValidTimeZone('IST'), false)
  assert.equal(isValidTimeZone(42), false)
})

test('a flight across timezones keeps each local time in its own zone', () => {
  const draft = normaliseExtraction({
    event_type: 'Flight', title: '  IndiGo   6E-123 · DEL → DPS ',
    start_local: '2026-11-01T06:15', start_timezone: 'Asia/Kolkata',
    end_local: '2026-11-01T14:45', end_timezone: 'Asia/Makassar',
    dep_code: 'del', arr_code: 'dps', flight_no: '6e 123', airline: 'IndiGo', terminal: 'T3',
    booking_ref: 'ab12cd', location: 'Delhi', location_to: 'Denpasar', notes: 'null',
  }, goa)
  assert.equal(draft.eventType, 'flight')
  assert.equal(draft.title, 'IndiGo 6E-123 · DEL → DPS')
  assert.equal(draft.startsAt, '2026-11-01T00:45:00.000Z')
  assert.equal(draft.endsAt, '2026-11-01T06:45:00.000Z')
  assert.equal(draft.startTimezone, 'Asia/Kolkata')
  assert.equal(draft.endTimezone, 'Asia/Makassar')
  assert.deepEqual([draft.depCode, draft.arrCode, draft.flightNo, draft.bookingRef], ['DEL', 'DPS', '6E-123', 'AB12CD'])
  assert.equal(draft.notes, null)
  assert.deepEqual(draft.warnings, [])
})

test('explicit offsets are honoured and missing zones fall back to the Trip zone with a warning', () => {
  const offset = normaliseExtraction({ event_type: 'ferry', start_local: '2026-11-02T08:00:00+08:00', start_timezone: 'Asia/Makassar' }, goa)
  assert.equal(offset.startsAt, '2026-11-02T00:00:00.000Z')
  const assumed = normaliseExtraction({ event_type: 'hotel', start_local: '2026-11-01T14:00', location: 'Taj Fort Aguada' }, goa)
  assert.equal(assumed.startsAt, '2026-11-01T08:30:00.000Z')
  assert.equal(assumed.startTimezone, 'Asia/Kolkata')
  assert.equal(assumed.title, 'Hotel stay · Taj Fort Aguada')
  assert.deepEqual(assumed.warnings, ['timezone_assumed'])
  const dateOnly = normaliseExtraction({ event_type: 'activity', start_local: '2026-11-03', start_timezone: 'Asia/Kolkata' }, goa)
  assert.equal(dateOnly.startsAt, '2026-11-02T18:30:00.000Z')
  assert.deepEqual(dateOnly.warnings, ['time_missing'])
})

test('implausible ends are dropped with a warning instead of being stored', () => {
  const durationAsTime = normaliseExtraction({
    event_type: 'flight', start_local: '2026-11-01T06:15', start_timezone: 'Asia/Kolkata',
    end_local: '2026-11-01T05:30', end_timezone: 'Asia/Kolkata',
  }, goa)
  assert.equal(durationAsTime.endsAt, null)
  assert.ok(durationAsTime.warnings.includes('end_before_start'))
  const tooLong = normaliseExtraction({
    event_type: 'flight', start_local: '2026-11-01T06:15', start_timezone: 'Asia/Kolkata',
    end_local: '2026-11-04T06:15', end_timezone: 'Asia/Kolkata',
  }, goa)
  assert.equal(tooLong.endsAt, null)
  assert.ok(tooLong.warnings.includes('end_implausible'))
  const hotel = normaliseExtraction({
    event_type: 'hotel', start_local: '2026-11-01T14:00', start_timezone: 'Asia/Kolkata',
    end_local: '2026-11-05T11:00', end_timezone: 'Asia/Kolkata',
  }, goa)
  assert.equal(hotel.endsAt, '2026-11-05T05:30:00.000Z')
})

test('unknown or hostile input becomes a safe draft that needs manual entry', () => {
  for (const raw of [null, 'text', [], 42, { start_local: 'soon', event_type: 'spaceship', dep_code: 'DELHI' }]) {
    const draft = normaliseExtraction(raw, goa)
    assert.equal(draft.startsAt, null)
    assert.equal(draft.eventType, 'other')
    assert.equal(draft.depCode, null)
    assert.ok(draft.warnings.includes('start_missing'))
  }
  assert.equal(normaliseExtraction({ title: 'x'.repeat(500) }, goa).title.length, 200)
  assert.equal(normaliseExtraction({ event_type: 'train' }, goa).eventType, 'transport')
  assert.equal(normaliseExtraction({ event_type: 'fast boat' }, goa).eventType, 'ferry')
  const outside = normaliseExtraction({ start_local: '2027-03-01T10:00', start_timezone: 'Asia/Kolkata' }, goa)
  assert.ok(outside.warnings.includes('outside_trip_dates'))
})

test('flight numbers normalise to carrier-number form', () => {
  assert.equal(normaliseFlightNumber('6e123'), '6E-123')
  assert.equal(normaliseFlightNumber('AI 2024'), 'AI-2024')
  assert.equal(normaliseFlightNumber('QZ-7510'), 'QZ-7510')
  assert.equal(normaliseFlightNumber('charter flight'), 'CHARTER FLIG')
  assert.equal(normaliseFlightNumber(''), null)
})

test('stored drafts round-trip and an empty draft is ready for manual entry', () => {
  const draft = normaliseExtraction({ event_type: 'flight', title: 'Flight', start_local: '2026-11-01T06:15', start_timezone: 'Asia/Kolkata', end_local: '2026-11-01T14:45', end_timezone: 'Asia/Makassar' }, goa)
  const restored = readStoredDraft(JSON.parse(JSON.stringify(draft)), goa)
  assert.equal(restored?.startsAt, draft.startsAt)
  assert.equal(restored?.endTimezone, 'Asia/Makassar')
  assert.equal(readStoredDraft({ nope: true }, goa), null)
  const empty = emptyDraft(goa)
  assert.equal(empty.title, '')
  assert.equal(empty.startsAt, null)
  assert.equal(empty.startTimezone, 'Asia/Kolkata')
  assert.deepEqual(empty.warnings, [])
})
