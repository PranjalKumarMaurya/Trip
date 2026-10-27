// Pure itinerary logic: event types, ordering, past/live/next status, the
// next-flight countdown, and form validation. No React or Supabase imports.
import { zonedInputToIso } from './tripTime.ts'

export const EVENT_TYPES = [
  { type: 'flight', icon: '✈️', label: 'Flight' },
  { type: 'hotel', icon: '🏨', label: 'Stay' },
  { type: 'ferry', icon: '⛴️', label: 'Ferry' },
  { type: 'activity', icon: '🎯', label: 'Activity' },
  { type: 'food', icon: '🍽️', label: 'Food' },
  { type: 'transport', icon: '🚗', label: 'Transport' },
  { type: 'other', icon: '📌', label: 'Other' },
] as const

export type EventType = (typeof EVENT_TYPES)[number]['type']

export function eventTypeMeta(type: string) {
  return EVENT_TYPES.find((entry) => entry.type === type) ?? EVENT_TYPES[EVENT_TYPES.length - 1]
}

export function isEventType(value: string): value is EventType {
  return EVENT_TYPES.some((entry) => entry.type === value)
}

/** The columns the itinerary reads from `trip_events`. */
export interface TripEvent {
  id: string
  group_id: string
  event_type: string
  title: string
  starts_at: string
  ends_at: string | null
  location: string | null
  location_to: string | null
  map_url: string | null
  notes: string | null
  dep_code: string | null
  arr_code: string | null
  flight_no: string | null
  airline: string | null
  terminal: string | null
  booking_ref: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type EventStatus = 'past' | 'live' | 'next' | 'upcoming'

export function sortEvents<T extends Pick<TripEvent, 'id' | 'starts_at'>>(events: readonly T[]): T[] {
  return [...events].sort((left, right) => Date.parse(left.starts_at) - Date.parse(right.starts_at)
    || left.id.localeCompare(right.id))
}

/**
 * past: ended (or, without an end, started) before now; live: now is within
 * [start, end]; next: the first event starting after now; upcoming: the rest.
 */
export function eventStatuses(events: readonly Pick<TripEvent, 'id' | 'starts_at' | 'ends_at'>[], nowMs: number): Map<string, EventStatus> {
  const statuses = new Map<string, EventStatus>()
  let nextAssigned = false
  for (const event of sortEvents(events)) {
    const start = Date.parse(event.starts_at)
    const end = event.ends_at ? Date.parse(event.ends_at) : start
    if (end < nowMs) statuses.set(event.id, 'past')
    else if (start <= nowMs) statuses.set(event.id, 'live')
    else if (!nextAssigned) {
      statuses.set(event.id, 'next')
      nextAssigned = true
    } else statuses.set(event.id, 'upcoming')
  }
  return statuses
}

export function nextFlight<T extends Pick<TripEvent, 'id' | 'starts_at' | 'event_type'>>(events: readonly T[], nowMs: number): T | null {
  return sortEvents(events).find((event) => event.event_type === 'flight' && Date.parse(event.starts_at) > nowMs) ?? null
}

export interface Countdown { days: number; hours: number; minutes: number; seconds: number; totalMs: number }

export function countdown(targetMs: number, nowMs: number): Countdown {
  const totalMs = Math.max(0, targetMs - nowMs)
  return {
    days: Math.floor(totalMs / 86_400_000),
    hours: Math.floor((totalMs % 86_400_000) / 3_600_000),
    minutes: Math.floor((totalMs % 3_600_000) / 60_000),
    seconds: Math.floor((totalMs % 60_000) / 1000),
    totalMs,
  }
}

export function formatCountdown(parts: Countdown): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  const clock = `${pad(parts.hours)}h ${pad(parts.minutes)}m ${pad(parts.seconds)}s`
  return parts.days > 0 ? `${parts.days}d ${clock}` : clock
}

/** Only http(s) links become clickable map links. */
export function safeMapUrl(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch {
    return null
  }
}

export interface EventFormValues {
  eventType: string
  title: string
  startsAt: string
  endsAt: string
  location: string
  locationTo: string
  mapUrl: string
  notes: string
  depCode: string
  arrCode: string
  flightNo: string
  airline: string
  terminal: string
  bookingRef: string
}

export type EventFormField = keyof EventFormValues
export type EventFormErrors = Partial<Record<EventFormField, string>>

/** The writable `trip_events` columns produced by a valid form. */
export interface EventPayload {
  event_type: EventType
  title: string
  starts_at: string
  ends_at: string | null
  location: string | null
  location_to: string | null
  map_url: string | null
  notes: string | null
  dep_code: string | null
  arr_code: string | null
  flight_no: string | null
  airline: string | null
  terminal: string | null
  booking_ref: string | null
}

export const emptyEventForm: EventFormValues = {
  eventType: 'activity', title: '', startsAt: '', endsAt: '', location: '', locationTo: '', mapUrl: '',
  notes: '', depCode: '', arrCode: '', flightNo: '', airline: '', terminal: '', bookingRef: '',
}

const optional = (value: string) => value.trim() || null
const code = (value: string) => optional(value)?.toUpperCase() ?? null

/** Validate the form; typed times are wall-clock times in `tripTimeZone`. */
export function validateEventForm(values: EventFormValues, tripTimeZone: string):
  { ok: true; payload: EventPayload } | { ok: false; errors: EventFormErrors } {
  const errors: EventFormErrors = {}
  if (!isEventType(values.eventType)) errors.eventType = 'Choose a type.'
  if (!values.title.trim()) errors.title = 'Enter a title.'
  else if (values.title.trim().length > 140) errors.title = 'Keep the title under 140 characters.'
  const startsAt = values.startsAt ? zonedInputToIso(values.startsAt, tripTimeZone) : null
  if (!values.startsAt) errors.startsAt = 'Choose when it starts.'
  else if (!startsAt) errors.startsAt = 'Enter a valid date and time.'
  const endsAt = values.endsAt ? zonedInputToIso(values.endsAt, tripTimeZone) : null
  if (values.endsAt && !endsAt) errors.endsAt = 'Enter a valid date and time.'
  else if (startsAt && endsAt && Date.parse(endsAt) < Date.parse(startsAt)) errors.endsAt = 'End must be after the start.'
  if (values.mapUrl.trim() && !safeMapUrl(values.mapUrl)) errors.mapUrl = 'Use a full https:// link.'
  for (const field of ['depCode', 'arrCode'] as const) {
    if (values[field].trim() && !/^[A-Za-z0-9]{2,5}$/u.test(values[field].trim())) errors[field] = 'Use a 3-letter airport code.'
  }
  if (Object.keys(errors).length || !startsAt) return { ok: false, errors }
  const isFlight = values.eventType === 'flight'
  return {
    ok: true,
    payload: {
      event_type: values.eventType as EventType,
      title: values.title.trim(),
      starts_at: startsAt,
      ends_at: endsAt,
      location: optional(values.location),
      location_to: optional(values.locationTo),
      map_url: values.mapUrl.trim() ? safeMapUrl(values.mapUrl) : null,
      notes: optional(values.notes),
      dep_code: isFlight ? code(values.depCode) : null,
      arr_code: isFlight ? code(values.arrCode) : null,
      flight_no: isFlight ? code(values.flightNo) : null,
      airline: isFlight ? optional(values.airline) : null,
      terminal: isFlight ? optional(values.terminal) : null,
      booking_ref: optional(values.bookingRef),
    },
  }
}
