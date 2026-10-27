// "Who's where" for the Trip tab: a status per member from their flights (an
// event's "who's on this" audience, or everyone when it has none) and the Trip
// dates in the Trip timezone. Pure: no React or Supabase imports.
import { formatDay, formatTime, zonedInputToIso } from './tripTime.ts'

export type CrewPhase =
  | 'not-left' | 'in-air' | 'on-the-way' | 'at-destination' | 'heading-home' | 'back-home'
  | 'before-trip' | 'on-trip' | 'trip-over'

export interface CrewStatus {
  phase: CrewPhase
  /** "Not left yet", "In the air", "At Bali", … */
  label: string
  /** A short second line, e.g. "BOM → DPS" or "Flies in 2d 4h". */
  detail: string | null
}

export interface CrewFlight {
  id: string
  starts_at: string
  ends_at: string | null
  dep_code: string | null
  arr_code: string | null
  location_to?: string | null
}

export interface CrewTrip {
  startDate: string
  endDate: string
  /** A resolved IANA timezone. */
  timeZone: string
  destination: string
}

const HOUR = 3_600_000
const DAY = 24 * HOUR
/** Flights closer together than this (arrival to next departure) are one journey. */
export const CONNECTION_MS = 12 * HOUR

interface Leg { flight: CrewFlight; start: number; end: number }
interface Journey { legs: Leg[]; start: number; end: number }

/** Flights this member is on: listed in the audience, or the event has no audience. */
export function flightsFor<T extends { id: string }>(memberId: string, flights: readonly T[], audience: ReadonlyMap<string, readonly string[]>): T[] {
  return flights.filter((flight) => {
    const people = audience.get(flight.id)
    return !people?.length || people.includes(memberId)
  })
}

/** Midnight at the start of `date` (YYYY-MM-DD) in `timeZone`, or null. */
function dayStart(date: string, timeZone: string): number | null {
  const iso = zonedInputToIso(`${date}T00:00`, timeZone)
  return iso ? Date.parse(iso) : null
}

function nextDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10)
}

/** The Trip as [first midnight, midnight after the last day) in its timezone. */
export function tripWindow(trip: CrewTrip): { start: number; end: number } | null {
  const start = dayStart(trip.startDate, trip.timeZone)
  const end = /^\d{4}-\d{2}-\d{2}$/u.test(trip.endDate) ? dayStart(nextDate(trip.endDate), trip.timeZone) : null
  return start !== null && end !== null && end > start ? { start, end } : null
}

function journeys(flights: readonly CrewFlight[]): Journey[] {
  const legs = flights.flatMap((flight) => {
    const start = Date.parse(flight.starts_at)
    if (Number.isNaN(start)) return []
    const parsedEnd = flight.ends_at ? Date.parse(flight.ends_at) : Number.NaN
    return [{ flight, start, end: Number.isNaN(parsedEnd) || parsedEnd < start ? start : parsedEnd }]
  }).sort((left, right) => left.start - right.start || left.flight.id.localeCompare(right.flight.id))

  const result: Journey[] = []
  for (const leg of legs) {
    const current = result[result.length - 1]
    const previous = current?.legs[current.legs.length - 1]
    const arrival = previous?.flight.arr_code?.toUpperCase()
    const departure = leg.flight.dep_code?.toUpperCase()
    const connects = previous && leg.start - previous.end <= CONNECTION_MS && (!arrival || !departure || arrival === departure)
    if (current && connects) {
      current.legs.push(leg)
      current.end = Math.max(current.end, leg.end)
    } else {
      result.push({ legs: [leg], start: leg.start, end: leg.end })
    }
  }
  return result
}

/** "2d 4h", "3h 20m", "25m" until `target`. */
export function shortCountdown(targetMs: number, nowMs: number): string {
  const minutes = Math.max(1, Math.ceil((targetMs - nowMs) / 60_000))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  if (days > 0) return hours ? `${days}d ${hours}h` : `${days}d`
  if (hours > 0) return minutes % 60 ? `${hours}h ${minutes % 60}m` : `${hours}h`
  return `${minutes}m`
}

const route = (leg: Leg) => `${leg.flight.dep_code?.toUpperCase() || '—'} → ${leg.flight.arr_code?.toUpperCase() || '—'}`

function layover(journey: Journey, nowMs: number): string {
  const landed = journey.legs.filter((leg) => leg.end <= nowMs).pop()
  const where = landed?.flight.arr_code?.toUpperCase()
  return where ? `Layover · ${where}` : 'Between flights'
}

function dateFallback(trip: CrewTrip, nowMs: number): CrewStatus {
  const window = tripWindow(trip)
  if (!window) return { phase: 'on-trip', label: 'On the trip', detail: null }
  if (nowMs < window.start) return { phase: 'before-trip', label: 'Before the trip', detail: `Starts in ${shortCountdown(window.start, nowMs)}` }
  if (nowMs >= window.end) return { phase: 'trip-over', label: 'Trip over', detail: null }
  const total = Math.round((window.end - window.start) / DAY)
  // Count calendar days in the Trip timezone (robust to DST-length days).
  let day = 1
  let date = trip.startDate
  while (day < total) {
    const next = dayStart(nextDate(date), trip.timeZone)
    if (next === null || nowMs < next) break
    date = nextDate(date)
    day += 1
  }
  return { phase: 'on-trip', label: 'On the trip', detail: `Day ${day} of ${total}` }
}

/**
 * Status for one member at `nowMs`. Flights are grouped into journeys (legs
 * with connections under 12 hours); the first journey is the way out, the last
 * one the way home when it ends where the trip began or leaves near the end of
 * the Trip, and any others are hops during the Trip.
 */
export function crewStatus(flights: readonly CrewFlight[], trip: CrewTrip, nowMs: number): CrewStatus {
  const all = journeys(flights)
  if (!all.length) return dateFallback(trip, nowMs)

  const window = tripWindow(trip)
  const midpoint = window ? (window.start + window.end) / 2 : null
  const first = all[0]
  const last = all[all.length - 1]
  // A single journey after the middle of the Trip is the way home (the way out was not entered).
  const outbound = all.length === 1 && midpoint !== null && first.start >= midpoint ? null : first
  const homeCode = outbound?.legs[0].flight.dep_code?.toUpperCase()
  const lastArrival = last.legs[last.legs.length - 1].flight.arr_code?.toUpperCase()
  const homeward = last !== outbound && (
    outbound === null
    || (homeCode !== undefined && homeCode === lastArrival)
    || (window !== null && last.start >= window.end - 2 * DAY)
  ) ? last : null
  const atDestination = `At ${trip.destination.trim() || 'the Trip'}`

  if (outbound && nowMs < outbound.start) {
    return { phase: 'not-left', label: 'Not left yet', detail: `Flies in ${shortCountdown(outbound.start, nowMs)}` }
  }

  for (const journey of all) {
    if (nowMs < journey.start || nowMs > journey.end) continue
    const flying = journey.legs.find((leg) => leg.start <= nowMs && nowMs <= leg.end)
    if (journey === homeward) {
      return { phase: 'heading-home', label: 'Heading home', detail: flying ? route(flying) : layover(journey, nowMs) }
    }
    if (flying) return { phase: 'in-air', label: 'In the air', detail: route(flying) }
    return { phase: 'on-the-way', label: 'On the way', detail: layover(journey, nowMs) }
  }

  if (homeward && nowMs > homeward.end) {
    return {
      phase: 'back-home', label: 'Back home',
      detail: `Landed ${formatDay(new Date(homeward.end).toISOString(), trip.timeZone)}`,
    }
  }

  // Before a return-only journey: as far as we know they are on (or before) the Trip.
  if (!outbound) return dateFallback(trip, nowMs)

  // Past the Trip with no way home entered: nothing better than the Trip dates.
  if (window && nowMs >= window.end && !homeward) return dateFallback(trip, nowMs)

  const landed = all.filter((journey) => journey.end < nowMs).pop()
  const hopArrival = landed && landed !== outbound
    ? landed.legs[landed.legs.length - 1].flight.location_to?.trim() || landed.legs[landed.legs.length - 1].flight.arr_code?.toUpperCase()
    : null
  const upcoming = all.find((journey) => journey.start > nowMs)
  return {
    phase: 'at-destination',
    label: hopArrival ? `At ${hopArrival}` : atDestination,
    detail: upcoming
      ? `${upcoming === homeward ? 'Flies home' : 'Next flight'} in ${shortCountdown(upcoming.start, nowMs)}`
      : landed && nowMs - landed.end < 12 * HOUR ? `Landed ${formatTime(new Date(landed.end).toISOString(), trip.timeZone)}` : null,
  }
}

export interface CrewMemberInput { groupMemberId: string; displayName: string }

/** Status for every member, from the Trip's flight events and their audiences. */
export function crewStatuses<T extends CrewFlight & { event_type: string }>(
  members: readonly CrewMemberInput[], events: readonly T[], audience: ReadonlyMap<string, readonly string[]>,
  trip: CrewTrip, nowMs: number,
): Map<string, CrewStatus> {
  const flights = events.filter((event) => event.event_type === 'flight')
  return new Map(members.map((member) => [member.groupMemberId, crewStatus(flightsFor(member.groupMemberId, flights, audience), trip, nowMs)]))
}
