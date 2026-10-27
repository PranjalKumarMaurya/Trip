// Request handling for parse-document, free of Deno and npm imports so it can be
// unit-tested in Node. index.ts wires in the user-scoped Supabase store and the
// Anthropic extractor.
import {
  EVENT_TYPES, MAX_PARSE_IMAGE_BYTES, type EventDraft, type TripContext,
  isParseableMimeType, normaliseExtraction,
} from '../_shared/documentDraft.ts'

export type ParseErrorCode =
  | 'method_not_allowed'
  | 'not_authenticated'
  | 'invalid_request'
  | 'document_not_found'
  | 'unsupported_for_parsing'
  | 'too_large_to_parse'
  | 'document_unavailable'
  | 'parser_unavailable'
  | 'parse_failed'
  | 'parse_limit_reached'

export interface StoredDocument { id: string; groupId: string; storagePath: string; fileName: string; mimeType: string }
export interface DocumentFile { bytes: Uint8Array; mimeType: string }
export type ParseResult = { status: 'parsed'; draft: EventDraft } | { status: 'failed'; error: ParseErrorCode }

/** Model calls allowed per person and per Trip in any 24 hours. */
export interface ParseLimits { member: number; trip: number }
export type ParseClaim = 'claimed' | 'member_limit' | 'trip_limit'

export const DEFAULT_PARSE_LIMITS: ParseLimits = { member: 20, trip: 100 }

/** Limits from SCAN_PARSE_DAILY_LIMIT_MEMBER / _TRIP; anything but a whole number ≥ 0 uses the default. */
export function parseLimitsFromEnv(get: (name: string) => string | undefined): ParseLimits {
  const read = (name: string, fallback: number) => {
    const raw = get(name)?.trim()
    return raw && /^\d{1,9}$/u.test(raw) ? Number(raw) : fallback
  }
  return {
    member: read('SCAN_PARSE_DAILY_LIMIT_MEMBER', DEFAULT_PARSE_LIMITS.member),
    trip: read('SCAN_PARSE_DAILY_LIMIT_TRIP', DEFAULT_PARSE_LIMITS.trip),
  }
}

/** Every method runs as the caller, so Row Level Security decides what exists. */
export interface ParseStore {
  currentUserId(): Promise<string | null>
  findDocument(id: string): Promise<StoredDocument | null>
  tripContext(groupId: string): Promise<TripContext | null>
  download(path: string): Promise<DocumentFile | null>
  saveResult(documentId: string, result: ParseResult): Promise<void>
  /**
   * Count this parse against the daily limits (claim_document_parse, as the
   * caller). Throws when the count cannot be checked; the model is then not called.
   */
  claimParse(documentId: string, limits: ParseLimits): Promise<ParseClaim>
}

export type Extractor = (input: { file: DocumentFile; fileName: string; trip: TripContext }) => Promise<unknown>

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
}

export function createParseHandler({ openStore, extractor, limits = DEFAULT_PARSE_LIMITS, log = () => {} }: {
  openStore: (authorization: string) => ParseStore
  extractor: Extractor | null
  limits?: ParseLimits
  log?: (event: string) => void
}) {
  return async function handle(request: Request): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS })
    if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' })

    const authorization = request.headers.get('Authorization') ?? ''
    if (!/^Bearer \S+$/u.test(authorization)) return json(401, { error: 'not_authenticated' })

    let documentId: unknown
    try {
      documentId = ((await request.json()) as { documentId?: unknown })?.documentId
    } catch {
      return json(400, { error: 'invalid_request' })
    }
    if (typeof documentId !== 'string' || !UUID.test(documentId)) return json(400, { error: 'invalid_request' })

    const store = openStore(authorization)
    if (!(await store.currentUserId())) return json(401, { error: 'not_authenticated' })

    // Visible only to an active member of the document's Trip (RLS); anything
    // else, including another Trip's document, is indistinguishable from missing.
    const document = await store.findDocument(documentId)
    if (!document || !document.storagePath.startsWith(`${document.groupId}/`)) return json(404, { error: 'document_not_found' })
    const trip = await store.tripContext(document.groupId)
    if (!trip) return json(404, { error: 'document_not_found' })

    const fail = async (status: number, error: ParseErrorCode, extra: Record<string, string> = {}) => {
      try { await store.saveResult(document.id, { status: 'failed', error }) } catch { log('save_failed') }
      log(error)
      return json(status, { error, ...extra })
    }

    if (!isParseableMimeType(document.mimeType)) return fail(422, 'unsupported_for_parsing')
    const file = await store.download(document.storagePath)
    if (!file) return fail(422, 'document_unavailable')
    if (!isParseableMimeType(file.mimeType)) return fail(422, 'unsupported_for_parsing')
    if (file.mimeType !== 'application/pdf' && file.bytes.byteLength > MAX_PARSE_IMAGE_BYTES) return fail(422, 'too_large_to_parse')
    if (!extractor) return fail(503, 'parser_unavailable')

    // Cost cap: counted (and checked) before the model is called. If the count
    // cannot be checked, do not call the model.
    let claim: ParseClaim
    try {
      claim = await store.claimParse(document.id, limits)
    } catch {
      log('claim_failed')
      return fail(503, 'parser_unavailable')
    }
    if (claim === 'member_limit' || claim === 'trip_limit') {
      return fail(429, 'parse_limit_reached', { scope: claim === 'member_limit' ? 'member' : 'trip' })
    }
    if (claim !== 'claimed') return fail(503, 'parser_unavailable')

    let raw: unknown
    try {
      raw = await extractor({ file, fileName: document.fileName, trip })
    } catch {
      return fail(502, 'parse_failed')
    }
    // The draft is returned for review; no Event is created here.
    const draft = normaliseExtraction(raw, trip)
    try { await store.saveResult(document.id, { status: 'parsed', draft }) } catch { log('save_failed') }
    return json(200, { draft })
  }
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
  }
  return btoa(binary)
}

const nullableString = { anyOf: [{ type: 'string' }, { type: 'null' }] }
const EXTRACTED_FIELDS = ['start_local', 'start_timezone', 'end_local', 'end_timezone', 'location', 'location_to',
  'dep_code', 'arr_code', 'flight_no', 'airline', 'terminal', 'booking_ref', 'notes'] as const

/** JSON schema for the model's answer (structured outputs). */
export const EXTRACTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    event_type: { type: 'string', enum: [...EVENT_TYPES] },
    title: { type: 'string' },
    ...Object.fromEntries(EXTRACTED_FIELDS.map((field) => [field, nullableString])),
  },
  required: ['event_type', 'title', ...EXTRACTED_FIELDS],
}

export const EXTRACTION_SYSTEM_PROMPT = 'You read one travel document (boarding pass, e-ticket, hotel voucher, ferry or activity booking, receipt) '
  + 'and extract a single booking for a group trip itinerary. Report only what the document shows; use null for anything it does not show.'

export function buildExtractionPrompt(trip: TripContext): string {
  return [
    'Extract the primary booking in this document. If it lists several, use the earliest one.',
    `Trip: ${trip.destination || 'unknown destination'}, ${trip.startDate} to ${trip.endDate}. Trip timezone: ${trip.timezone}.`,
    '',
    'Times:',
    '- start_local is the departure, check-in, or start clock time; end_local is the arrival, check-out, or end time.',
    '- Write them as YYYY-MM-DDTHH:mm exactly as printed on the document, in local time. Do not convert between timezones.',
    '- start_timezone and end_timezone are the IANA timezones of the places those times apply to (for a flight: departure airport, then arrival airport), for example Asia/Kolkata or Asia/Makassar. Use null if you cannot tell.',
    '- A duration such as "2h 30m" is never a clock time.',
    '- If no year is printed, use the year that puts the date within or nearest the trip dates.',
    '',
    'Other fields:',
    '- title: short, for example "IndiGo 6E-123 · DEL → GOI" or "Hotel · Taj Fort Aguada".',
    '- dep_code and arr_code: three-letter IATA airport codes. flight_no: carrier code and number, for example 6E-123.',
    '- booking_ref: the PNR or confirmation number. terminal: as printed.',
    '- notes: brief useful details such as seat, baggage, or check-in instructions.',
  ].join('\n')
}

/** Parse the model's text answer; tolerates a stray code fence. */
export function parseModelText(text: string): unknown {
  const clean = text.trim().replace(/^```(?:json)?\s*/iu, '').replace(/\s*```$/u, '')
  return JSON.parse(clean)
}

/**
 * Deterministic extractor for local stacks and tests (SCAN_PARSE_STUB=1). A file
 * whose name contains "unreadable" simulates a document the parser cannot read.
 */
export function createStubExtractor(): Extractor {
  return async ({ fileName, trip }) => {
    if (/unreadable/iu.test(fileName)) throw new Error('stub_unreadable')
    return {
      event_type: 'flight', title: 'IndiGo 6E-123 · DEL → GOI',
      start_local: `${trip.startDate}T06:15`, start_timezone: 'Asia/Kolkata',
      end_local: `${trip.startDate}T08:45`, end_timezone: 'Asia/Kolkata',
      location: 'Delhi (DEL)', location_to: 'Goa (GOI)', dep_code: 'del', arr_code: 'goi',
      flight_no: '6e 123', airline: 'IndiGo', terminal: 'T1', booking_ref: 'stub42', notes: 'Seat 12A',
    }
  }
}
