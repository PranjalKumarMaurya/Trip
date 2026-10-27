/**
 * Pure helpers for the Trips home: which Trips are ongoing, upcoming or past
 * (judged by each Trip's own calendar dates in its own timezone), how they are
 * ordered, and the short relative line on each card.
 */

export interface DatedTrip {
  startDate: string
  endDate: string
  timezone: string
}

export type TripPhase = 'ongoing' | 'upcoming' | 'past'

const dayMs = 86_400_000

/** "YYYY-MM-DD" for `now` in `timeZone`; UTC when the zone is not usable. */
export function calendarDateIn(timeZone: string, now: Date): string {
  const read = (zone: string) => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(now)
    const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? ''
    return `${part('year')}-${part('month')}-${part('day')}`
  }
  try {
    return read(timeZone)
  } catch {
    return read('UTC')
  }
}

/** Whole calendar days from `from` to `to` (both "YYYY-MM-DD"). */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / dayMs)
}

export function tripPhase(trip: DatedTrip, now: Date): TripPhase {
  const today = calendarDateIn(trip.timezone, now)
  if (today < trip.startDate) return 'upcoming'
  if (today > trip.endDate) return 'past'
  return 'ongoing'
}

/** "2 Nov", or "2 Nov 2025" when the year differs from `today`'s. */
function shortDate(value: string, today: string, locale: string): string {
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', timeZone: 'UTC' }
  if (value.slice(0, 4) !== today.slice(0, 4)) options.year = 'numeric'
  try {
    return new Intl.DateTimeFormat(locale, options).format(new Date(`${value}T00:00:00Z`))
  } catch {
    return value
  }
}

/**
 * The card's relative line: "Starts tomorrow", "in 5 days", "in 3 months",
 * "Day 3 of 7", "Ended 2 Nov".
 */
export function relativeTripLine(trip: DatedTrip, now: Date, locale = 'en-GB'): string {
  const today = calendarDateIn(trip.timezone, now)
  const phase = tripPhase(trip, now)
  if (phase === 'ongoing') {
    return `Day ${daysBetween(trip.startDate, today) + 1} of ${daysBetween(trip.startDate, trip.endDate) + 1}`
  }
  if (phase === 'past') return `Ended ${shortDate(trip.endDate, today, locale)}`
  const days = daysBetween(today, trip.startDate)
  if (days <= 1) return 'Starts tomorrow'
  if (days < 60) return `in ${days} days`
  return `in ${Math.round(days / 30.44)} months`
}

/**
 * Ongoing (ending soonest first), upcoming (starting soonest first) and past
 * (most recently ended first). Ties keep the Trips' given order.
 */
export function groupTrips<T extends DatedTrip>(trips: readonly T[], now: Date): Record<TripPhase, T[]> {
  const groups: Record<TripPhase, T[]> = { ongoing: [], upcoming: [], past: [] }
  for (const trip of trips) groups[tripPhase(trip, now)].push(trip)
  groups.ongoing.sort((left, right) => left.endDate.localeCompare(right.endDate))
  groups.upcoming.sort((left, right) => left.startDate.localeCompare(right.startDate))
  groups.past.sort((left, right) => right.endDate.localeCompare(left.endDate))
  return groups
}

const proofPattern = /^[0-9a-f]{64}$/

/**
 * The invitation proof inside something pasted into "Have an invite link?": a
 * full link (".../#invite=<proof>") or the bare 64-character code. Null if none.
 */
export function inviteProofFromInput(input: string): string | null {
  const text = input.trim()
  if (proofPattern.test(text)) return text
  const match = /(?:^|[#&?])invite=([0-9a-f]{64})(?:$|[&\s])/u.exec(text)
  return match ? match[1] : null
}
