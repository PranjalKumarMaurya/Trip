// Timezone helpers for the itinerary. Pure functions (no React, no Supabase) so
// they run under `node --test`. Times are stored as UTC instants; the Trip's
// IANA timezone decides how they are typed and shown.

const partsFormatters = new Map<string, Intl.DateTimeFormat>()

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = partsFormatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
    partsFormatters.set(timeZone, formatter)
  }
  return formatter
}

interface WallClock { year: number; month: number; day: number; hour: number; minute: number; second: number }

function wallClock(instantMs: number, timeZone: string): WallClock {
  const values: Record<string, number> = {}
  for (const part of partsFormatter(timeZone).formatToParts(new Date(instantMs))) {
    if (part.type !== 'literal') values[part.type] = Number(part.value)
  }
  return {
    year: values.year, month: values.month, day: values.day,
    hour: values.hour === 24 ? 0 : values.hour, minute: values.minute, second: values.second,
  }
}

/** Offset of `timeZone` from UTC at `instantMs`, in milliseconds (east positive). */
export function timeZoneOffsetMs(instantMs: number, timeZone: string): number {
  const wall = wallClock(instantMs, timeZone)
  const asUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second)
  return asUtc - Math.floor(instantMs / 1000) * 1000
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format()
    return true
  } catch {
    return false
  }
}

/** The Trip's timezone if usable, else UTC, so bad data never crashes the tab. */
export function resolveTripTimeZone(value: unknown): string {
  return typeof value === 'string' && value !== '' && isValidTimeZone(value) ? value : 'UTC'
}

const INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/u

/**
 * Interpret a `datetime-local` value ("YYYY-MM-DDTHH:mm") as wall-clock time in
 * `timeZone` and return the UTC instant as an ISO string, or null if invalid.
 * Like Temporal's "compatible" disambiguation: a repeated time (DST fall-back)
 * picks the earlier instant; a skipped time (DST spring-forward) moves forward
 * by the gap.
 */
export function zonedInputToIso(value: string, timeZone: string): string | null {
  const match = INPUT_PATTERN.exec(value)
  if (!match) return null
  const [year, month, day, hour, minute] = match.slice(1).map(Number)
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null
  const naive = Date.UTC(year, month - 1, day, hour, minute)
  const check = new Date(naive)
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null
  const DAY = 86_400_000
  const before = timeZoneOffsetMs(naive - DAY, timeZone)
  const after = timeZoneOffsetMs(naive + DAY, timeZone)
  const candidates = [naive - before, naive - after]
    .filter((instant) => naive - timeZoneOffsetMs(instant, timeZone) === instant)
    .sort((left, right) => left - right)
  return new Date(candidates[0] ?? naive - before).toISOString()
}

const pad = (value: number) => String(value).padStart(2, '0')

/** The `datetime-local` value showing `iso` as wall-clock time in `timeZone`. */
export function isoToZonedInput(iso: string | null | undefined, timeZone: string): string {
  if (!iso) return ''
  const instant = Date.parse(iso)
  if (Number.isNaN(instant)) return ''
  const wall = wallClock(instant, timeZone)
  return `${wall.year}-${pad(wall.month)}-${pad(wall.day)}T${pad(wall.hour)}:${pad(wall.minute)}`
}

/** "Asia/Kolkata" -> "Kolkata", "America/Argentina/Buenos_Aires" -> "Buenos Aires". */
export function timeZoneCity(timeZone: string): string {
  const last = timeZone.split('/').pop() ?? timeZone
  return last.replace(/_/gu, ' ')
}

export function formatTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .format(new Date(iso))
}

/** "Sun 1 Nov". Built from parts so every engine renders it identically. */
export function formatDay(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone, weekday: 'short', day: 'numeric', month: 'short' })
    .formatToParts(new Date(iso))
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)?.value ?? ''
  return `${part('weekday')} ${part('day')} ${part('month')}`
}

/** Calendar day key ("YYYY-MM-DD") of `iso` in `timeZone`. */
export function dayKey(iso: string, timeZone: string): string {
  return isoToZonedInput(iso, timeZone).slice(0, 10)
}

/**
 * "Sun 1 Nov · 19:00", "Sun 1 Nov · 19:00–21:30", or, across days,
 * "Sun 1 Nov · 21:55 – Wed 4 Nov 10:00", all in `timeZone`.
 */
export function formatSpan(startIso: string, endIso: string | null, timeZone: string): string {
  const startDay = formatDay(startIso, timeZone)
  const start = `${startDay} · ${formatTime(startIso, timeZone)}`
  if (!endIso) return start
  const endDay = formatDay(endIso, timeZone)
  return endDay === startDay ? `${start}–${formatTime(endIso, timeZone)}` : `${start} – ${endDay} ${formatTime(endIso, timeZone)}`
}

/** True when the two zones' clocks read differently at any of the instants. */
export function clocksDiffer(isos: readonly (string | null)[], tripTimeZone: string, localTimeZone: string): boolean {
  return isos.some((iso) => iso !== null
    && timeZoneOffsetMs(Date.parse(iso), tripTimeZone) !== timeZoneOffsetMs(Date.parse(iso), localTimeZone))
}

export function viewerTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export interface DualTime {
  /** Time in the Trip timezone, e.g. "18:30". */
  trip: string
  tripDay: string
  tripLabel: string
  /** Present only when the viewer's clock reads differently at that instant. */
  local?: { time: string; day: string; label: string }
}

/**
 * Show an instant in the Trip timezone and, when the viewer's timezone has a
 * different offset at that instant, in the viewer's timezone as well.
 */
export function dualTime(iso: string, tripTimeZone: string, localTimeZone: string): DualTime {
  const instant = Date.parse(iso)
  const result: DualTime = {
    trip: formatTime(iso, tripTimeZone),
    tripDay: formatDay(iso, tripTimeZone),
    tripLabel: timeZoneCity(tripTimeZone),
  }
  if (timeZoneOffsetMs(instant, tripTimeZone) !== timeZoneOffsetMs(instant, localTimeZone)) {
    result.local = { time: formatTime(iso, localTimeZone), day: formatDay(iso, localTimeZone), label: 'your time' }
  }
  return result
}
