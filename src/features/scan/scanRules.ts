// Pure Scan-tab rules: local file checks, storage naming, and the review form.
// No Supabase imports, so these run under `node --test`.
import {
  EVENT_TYPES, MAX_DOCUMENT_BYTES, type DraftWarning, type EventDraft, type EventType,
  isStorableMimeType, isValidTimeZone, parseWallTime, utcToZonedWallTime, zonedWallTimeToUtc,
} from '../../../supabase/functions/_shared/documentDraft.ts'

export { EVENT_TYPES, type EventDraft, type EventType }

export type FileProblem = 'empty' | 'unsupported' | 'too_large'

/** Checked on selection, before anything leaves the device. Uses the browser-reported type only. */
export function checkSelectedFile(file: { name: string; size: number; type: string }): FileProblem | null {
  if (!isStorableMimeType(file.type)) return 'unsupported'
  if (file.size <= 0) return 'empty'
  if (file.size > MAX_DOCUMENT_BYTES) return 'too_large'
  return null
}

export const FILE_PROBLEM_MESSAGES: Record<FileProblem, string> = {
  unsupported: 'Choose a PDF, JPEG, PNG, WebP, or HEIC file.',
  too_large: 'This file is larger than 10 MB. Choose a smaller file.',
  empty: 'This file is empty or could not be read. Choose it again.',
}

/** A storage-safe object name that keeps the extension; the original name is kept in metadata. */
export function storageFileName(name: string): string {
  const trimmed = (name.split(/[\\/]/u).pop() ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/gu, '').trim()
  const dot = trimmed.lastIndexOf('.')
  const base = (dot > 0 ? trimmed.slice(0, dot) : trimmed).replace(/[^A-Za-z0-9_-]+/gu, '-').replace(/^-+|-+$/gu, '').slice(0, 80)
  const extension = dot > 0 ? trimmed.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/gu, '').slice(0, 5) : ''
  return `${base || 'document'}${extension ? `.${extension}` : ''}`
}

export function documentPath(groupId: string, objectId: string, fileName: string): string {
  return `${groupId}/${objectId}/${storageFileName(fileName)}`
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function fileKindLabel(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType === 'image/heic' || mimeType === 'image/heif') return 'HEIC'
  return mimeType.startsWith('image/') ? mimeType.slice(6).toUpperCase().replace('JPEG', 'JPG') : 'File'
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  flight: 'Flight', hotel: 'Hotel', ferry: 'Ferry', activity: 'Activity', food: 'Food', transport: 'Transport', other: 'Other',
}

export const WARNING_MESSAGES: Record<DraftWarning, string> = {
  start_missing: 'No start time was found. Enter it below.',
  time_missing: 'The document shows a date without a time. Check the time.',
  timezone_assumed: 'The timezone was not clear, so the Trip timezone was assumed. Check it.',
  end_before_start: 'The end time looked wrong, so it was left blank.',
  end_implausible: 'The end time looked wrong, so it was left blank.',
  outside_trip_dates: 'This booking falls outside the Trip dates. Check the date.',
}

export interface EventForm {
  eventType: EventType
  title: string
  startLocal: string
  startTimezone: string
  endLocal: string
  endTimezone: string
  location: string
  locationTo: string
  depCode: string
  arrCode: string
  flightNo: string
  airline: string
  terminal: string
  bookingRef: string
  notes: string
}

export type FormErrors = Partial<Record<keyof EventForm, string>>

/** What `create_event_from_document` receives. */
export interface EventInput {
  eventType: EventType
  title: string
  startsAt: string
  endsAt: string | null
  location: string | null
  locationTo: string | null
  depCode: string | null
  arrCode: string | null
  flightNo: string | null
  airline: string | null
  terminal: string | null
  bookingRef: string | null
  notes: string | null
}

export function draftToForm(draft: EventDraft): EventForm {
  return {
    eventType: draft.eventType,
    title: draft.title,
    startLocal: draft.startsAt ? utcToZonedWallTime(draft.startsAt, draft.startTimezone) : '',
    startTimezone: draft.startTimezone,
    endLocal: draft.endsAt ? utcToZonedWallTime(draft.endsAt, draft.endTimezone) : '',
    endTimezone: draft.endTimezone,
    location: draft.location ?? '',
    locationTo: draft.locationTo ?? '',
    depCode: draft.depCode ?? '',
    arrCode: draft.arrCode ?? '',
    flightNo: draft.flightNo ?? '',
    airline: draft.airline ?? '',
    terminal: draft.terminal ?? '',
    bookingRef: draft.bookingRef ?? '',
    notes: draft.notes ?? '',
  }
}

const optional = (value: string) => value.trim() || null

/** Validate the review form; returns either field errors or the Event to create. */
export function formToEventInput(form: EventForm): { errors: FormErrors; input: EventInput | null } {
  const errors: FormErrors = {}
  const title = form.title.trim()
  if (!title) errors.title = 'Enter a title.'
  else if (title.length > 200) errors.title = 'Keep the title under 200 characters.'
  if (!(EVENT_TYPES as readonly string[]).includes(form.eventType)) errors.eventType = 'Choose a type.'

  if (!isValidTimeZone(form.startTimezone.trim())) errors.startTimezone = 'Enter an IANA timezone, for example Asia/Kolkata.'
  if (!form.startLocal) errors.startLocal = 'Enter the start date and time.'
  else if (!parseWallTime(form.startLocal)) errors.startLocal = 'Enter a valid date and time.'
  const startsAt = errors.startLocal || errors.startTimezone ? null : zonedWallTimeToUtc(form.startLocal, form.startTimezone.trim())

  let endsAt: string | null = null
  if (form.endLocal) {
    if (!isValidTimeZone(form.endTimezone.trim())) errors.endTimezone = 'Enter an IANA timezone, for example Asia/Kolkata.'
    else if (!parseWallTime(form.endLocal)) errors.endLocal = 'Enter a valid date and time.'
    else {
      endsAt = zonedWallTimeToUtc(form.endLocal, form.endTimezone.trim())
      if (startsAt && endsAt && Date.parse(endsAt) < Date.parse(startsAt)) errors.endLocal = 'The end must be after the start.'
    }
  }

  const code = (value: string) => value.trim().toUpperCase()
  const flight = form.eventType === 'flight'
  if (flight && form.depCode.trim() && !/^[A-Z]{3}$/u.test(code(form.depCode))) errors.depCode = 'Use a three-letter airport code.'
  if (flight && form.arrCode.trim() && !/^[A-Z]{3}$/u.test(code(form.arrCode))) errors.arrCode = 'Use a three-letter airport code.'

  if (Object.keys(errors).length || !startsAt) return { errors, input: null }
  return {
    errors,
    input: {
      eventType: form.eventType,
      title,
      startsAt,
      endsAt,
      location: optional(form.location),
      locationTo: optional(form.locationTo),
      depCode: flight ? optional(code(form.depCode)) : null,
      arrCode: flight ? optional(code(form.arrCode)) : null,
      flightNo: flight ? optional(form.flightNo.toUpperCase()) : null,
      airline: flight ? optional(form.airline) : null,
      terminal: flight ? optional(form.terminal) : null,
      bookingRef: optional(form.bookingRef),
      notes: optional(form.notes),
    },
  }
}

export type ParseFailure =
  | 'not_authenticated' | 'document_not_found' | 'unsupported_for_parsing' | 'too_large_to_parse'
  | 'document_unavailable' | 'parser_unavailable' | 'parse_failed' | 'network' | 'unknown'
  /** The daily automatic-reading limit: yours, or the whole Trip's. */
  | 'parse_limit_reached' | 'trip_parse_limit_reached'

export function parseFailureMessage(code: ParseFailure): string {
  switch (code) {
    case 'unsupported_for_parsing': return 'This file type cannot be read automatically. Enter the details yourself.'
    case 'too_large_to_parse': return 'This image is too large to read automatically. Enter the details yourself.'
    case 'parser_unavailable': return 'Automatic reading is not available right now. Enter the details yourself.'
    case 'parse_failed': return 'We could not read this document. Enter the details yourself.'
    case 'parse_limit_reached': return 'You’ve used today’s automatic reads. Enter the details yourself, or try again tomorrow. The document is saved.'
    case 'trip_parse_limit_reached': return 'This Trip has used today’s automatic reads. Enter the details yourself, or try again tomorrow. The document is saved.'
    case 'document_not_found':
    case 'document_unavailable': return 'This document is no longer available to you.'
    case 'not_authenticated': return 'Your session has ended. Sign in again to read documents.'
    case 'network': return 'The connection dropped while reading. The document is saved; enter the details or try again.'
    default: return 'We could not read this document. Enter the details yourself.'
  }
}
