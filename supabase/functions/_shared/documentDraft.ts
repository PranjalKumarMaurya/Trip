// Pure rules shared by the parse-document Edge Function (Deno) and the Scan tab
// (browser). No runtime-specific APIs: only Intl and Date.

export const EVENT_TYPES = ['flight', 'hotel', 'ferry', 'activity', 'food', 'transport', 'other'] as const
export type EventType = (typeof EVENT_TYPES)[number]

export const DOCUMENT_BUCKET = 'trip-documents'
/** Types the bucket accepts. HEIC/HEIF can be stored but not read automatically. */
export const STORABLE_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'] as const
export const PARSEABLE_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024
/** The vision API accepts images up to 5 MB. */
export const MAX_PARSE_IMAGE_BYTES = 5 * 1024 * 1024

export type DraftWarning =
  | 'start_missing'
  | 'time_missing'
  | 'timezone_assumed'
  | 'end_before_start'
  | 'end_implausible'
  | 'outside_trip_dates'

export interface EventDraft {
  eventType: EventType
  title: string
  /** UTC instant (ISO 8601) or null when the document gave no usable start. */
  startsAt: string | null
  endsAt: string | null
  /** IANA zones the times were printed in; the review form edits times in these zones. */
  startTimezone: string
  endTimezone: string
  location: string | null
  locationTo: string | null
  depCode: string | null
  arrCode: string | null
  flightNo: string | null
  airline: string | null
  terminal: string | null
  bookingRef: string | null
  notes: string | null
  warnings: DraftWarning[]
}

export interface TripContext {
  timezone: string
  startDate: string
  endDate: string
  destination?: string
}

export function isStorableMimeType(value: string): boolean {
  return (STORABLE_MIME_TYPES as readonly string[]).includes(value)
}

export function isParseableMimeType(value: string): boolean {
  return (PARSEABLE_MIME_TYPES as readonly string[]).includes(value)
}

export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || !/^[A-Za-z][A-Za-z0-9_+-]*(\/[A-Za-z0-9_+-]+)+$|^UTC$/u.test(value)) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(0)
    return true
  } catch {
    return false
  }
}

const formatters = new Map<string, Intl.DateTimeFormat>()
function wallClock(utcMs: number, timeZone: string) {
  let formatter = formatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
    formatters.set(timeZone, formatter)
  }
  const parts = Object.fromEntries(formatter.formatToParts(new Date(utcMs)).map((part) => [part.type, part.value]))
  return {
    year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
    hour: Number(parts.hour), minute: Number(parts.minute), second: Number(parts.second),
  }
}

function offsetMs(utcMs: number, timeZone: string): number {
  const wall = wallClock(utcMs, timeZone)
  const asUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second)
  return asUtc - Math.floor(utcMs / 1000) * 1000
}

const WALL_TIME = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?$/u
const OFFSET_TIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})$/u

interface WallTime { year: number; month: number; day: number; hour: number; minute: number; second: number; hasTime: boolean }

export function parseWallTime(value: string): WallTime | null {
  const match = WALL_TIME.exec(value.trim())
  if (!match) return null
  const [year, month, day, hour = 0, minute = 0, second = 0] = match.slice(1, 7).map((part) => (part === undefined ? undefined : Number(part))) as number[]
  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return null
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  if (day < 1 || day > daysInMonth) return null
  return { year, month, day, hour, minute, second, hasTime: match[4] !== undefined }
}

/** Interpret a wall-clock time (`YYYY-MM-DDTHH:mm[:ss]`) in an IANA zone; returns a UTC ISO string. */
export function zonedWallTimeToUtc(value: string, timeZone: string): string | null {
  const wall = parseWallTime(value)
  if (!wall || !isValidTimeZone(timeZone)) return null
  const guess = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second)
  const firstOffset = offsetMs(guess, timeZone)
  let instant = guess - firstOffset
  const secondOffset = offsetMs(instant, timeZone)
  if (secondOffset !== firstOffset) instant = guess - secondOffset
  return new Date(instant).toISOString()
}

/** Format a UTC instant as `YYYY-MM-DDTHH:mm` in an IANA zone (the value of a datetime-local input). */
export function utcToZonedWallTime(iso: string, timeZone: string): string {
  const ms = Date.parse(iso)
  if (Number.isNaN(ms) || !isValidTimeZone(timeZone)) return ''
  const wall = wallClock(ms, timeZone)
  const pad = (value: number, size = 2) => String(value).padStart(size, '0')
  return `${pad(wall.year, 4)}-${pad(wall.month)}-${pad(wall.day)}T${pad(wall.hour)}:${pad(wall.minute)}`
}

const TYPE_SYNONYMS: Record<string, EventType> = {
  flight: 'flight', plane: 'flight', airline: 'flight', boarding_pass: 'flight',
  hotel: 'hotel', accommodation: 'hotel', stay: 'hotel', villa: 'hotel', hostel: 'hotel', lodging: 'hotel',
  ferry: 'ferry', boat: 'ferry', fast_boat: 'ferry', cruise: 'ferry',
  activity: 'activity', tour: 'activity', ticket: 'activity', event: 'activity', excursion: 'activity',
  food: 'food', restaurant: 'food', dinner: 'food', lunch: 'food', meal: 'food',
  transport: 'transport', train: 'transport', bus: 'transport', taxi: 'transport', car: 'transport',
  car_rental: 'transport', transfer: 'transport', shuttle: 'transport',
  other: 'other',
}

export function normaliseEventType(value: unknown): EventType {
  if (typeof value !== 'string') return 'other'
  return TYPE_SYNONYMS[value.trim().toLowerCase().replace(/[\s-]+/gu, '_')] ?? 'other'
}

export function cleanText(value: unknown, maxLength = 200): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const text = String(value).replace(/\s+/gu, ' ').trim()
  if (!text || /^(null|none|n\/a|unknown|-)$/iu.test(text)) return null
  return text.slice(0, maxLength)
}

export function normaliseAirportCode(value: unknown): string | null {
  const text = cleanText(value, 10)?.toUpperCase() ?? null
  return text && /^[A-Z]{3}$/u.test(text) ? text : null
}

/** `6e 123`, `6E123`, `6E-123` -> `6E-123`. Unrecognised shapes are kept, upper-cased. */
export function normaliseFlightNumber(value: unknown): string | null {
  const text = cleanText(value, 20)?.toUpperCase() ?? null
  if (!text) return null
  const match = /^([A-Z]{2,3}|[A-Z][0-9]|[0-9][A-Z])\s*-?\s*(\d{1,4}[A-Z]?)$/u.exec(text)
  return match ? `${match[1]}-${match[2]}` : text.slice(0, 12)
}

export function normaliseBookingRef(value: unknown): string | null {
  const text = cleanText(value, 40)
  return text ? text.toUpperCase() : null
}

interface ResolvedTime { iso: string | null; timeZone: string; assumedZone: boolean; missingTime: boolean }

function resolveTime(value: unknown, zone: unknown, fallbackZone: string): ResolvedTime {
  const validZone = isValidTimeZone(zone) ? zone : null
  const timeZone = validZone ?? fallbackZone
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) return { iso: null, timeZone, assumedZone: false, missingTime: false }
  if (OFFSET_TIME.test(text)) {
    const ms = Date.parse(text.replace(' ', 'T'))
    return { iso: Number.isNaN(ms) ? null : new Date(ms).toISOString(), timeZone, assumedZone: false, missingTime: false }
  }
  const wall = parseWallTime(text)
  if (!wall) return { iso: null, timeZone, assumedZone: false, missingTime: false }
  return { iso: zonedWallTimeToUtc(text, timeZone), timeZone, assumedZone: !validZone, missingTime: !wall.hasTime }
}

const HOUR = 3600 * 1000
const DAY = 24 * HOUR

function defaultTitle(type: EventType, fields: Pick<EventDraft, 'airline' | 'flightNo' | 'depCode' | 'arrCode' | 'location'>): string {
  const route = fields.depCode && fields.arrCode ? `${fields.depCode} → ${fields.arrCode}` : null
  if (type === 'flight') {
    const carrier = [fields.airline, fields.flightNo].filter(Boolean).join(' ')
    return [carrier || 'Flight', route].filter(Boolean).join(' · ')
  }
  const label = { hotel: 'Hotel stay', ferry: 'Ferry', activity: 'Activity', food: 'Meal', transport: 'Transport', other: 'Booking' }[type]
  return fields.location ? `${label} · ${fields.location}` : label
}

/**
 * Turn raw extraction output (model JSON, or anything else) into a safe draft.
 * Never throws: unusable values become null and are reported as warnings.
 */
export function normaliseExtraction(raw: unknown, trip: TripContext): EventDraft {
  const input = (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>
  const tripZone = isValidTimeZone(trip.timezone) ? trip.timezone : 'UTC'
  const eventType = normaliseEventType(input.event_type ?? input.type)
  const warnings = new Set<DraftWarning>()

  const start = resolveTime(input.start_local ?? input.starts_at, input.start_timezone, tripZone)
  const end = resolveTime(input.end_local ?? input.ends_at, input.end_timezone, start.timeZone)
  if (!start.iso) warnings.add('start_missing')
  if (start.missingTime || end.missingTime) warnings.add('time_missing')
  // The end falls back to the start's zone; that is only a guess worth flagging for journeys.
  const journey = eventType === 'flight' || eventType === 'ferry' || eventType === 'transport'
  if ((start.iso && start.assumedZone) || (end.iso && journey && !isValidTimeZone(input.end_timezone))) warnings.add('timezone_assumed')

  let endsAt = end.iso
  if (start.iso && endsAt) {
    const span = Date.parse(endsAt) - Date.parse(start.iso)
    const limit = eventType === 'hotel' ? 60 * DAY : eventType === 'activity' || eventType === 'other' ? 14 * DAY : 48 * HOUR
    if (span < 0) { endsAt = null; warnings.add('end_before_start') }
    else if (span > limit) { endsAt = null; warnings.add('end_implausible') }
  }
  if (start.iso && trip.startDate && trip.endDate) {
    const from = Date.parse(`${trip.startDate}T00:00:00Z`) - 2 * DAY
    const to = Date.parse(`${trip.endDate}T23:59:59Z`) + 2 * DAY
    const at = Date.parse(start.iso)
    if (!Number.isNaN(from) && !Number.isNaN(to) && (at < from || at > to)) warnings.add('outside_trip_dates')
  }

  const fields = {
    location: cleanText(input.location),
    locationTo: cleanText(input.location_to),
    depCode: normaliseAirportCode(input.dep_code),
    arrCode: normaliseAirportCode(input.arr_code),
    flightNo: normaliseFlightNumber(input.flight_no),
    airline: cleanText(input.airline, 80),
    terminal: cleanText(input.terminal, 40),
    bookingRef: normaliseBookingRef(input.booking_ref),
    notes: cleanText(input.notes, 1000),
  }
  return {
    eventType,
    title: cleanText(input.title) ?? defaultTitle(eventType, fields),
    startsAt: start.iso,
    endsAt,
    startTimezone: start.timeZone,
    endTimezone: end.timeZone,
    ...fields,
    warnings: [...warnings],
  }
}

/** An empty draft for manual entry, dated at the start of the Trip. */
export function emptyDraft(trip: TripContext): EventDraft {
  const zone = isValidTimeZone(trip.timezone) ? trip.timezone : 'UTC'
  return { ...normaliseExtraction({}, trip), title: '', startTimezone: zone, endTimezone: zone, warnings: [] }
}

/** Read a stored draft back (e.g. `trip_documents.extracted`), tolerating older or partial shapes. */
export function readStoredDraft(value: unknown, trip: TripContext): EventDraft | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const stored = value as Partial<EventDraft>
  if (typeof stored.title !== 'string') return null
  return normaliseExtraction({
    event_type: stored.eventType, title: stored.title,
    starts_at: stored.startsAt ?? undefined, start_timezone: stored.startTimezone,
    ends_at: stored.endsAt ?? undefined, end_timezone: stored.endTimezone,
    location: stored.location, location_to: stored.locationTo, dep_code: stored.depCode, arr_code: stored.arrCode,
    flight_no: stored.flightNo, airline: stored.airline, terminal: stored.terminal, booking_ref: stored.bookingRef,
    notes: stored.notes,
  }, trip)
}
