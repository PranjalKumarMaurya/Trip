import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { DOCUMENT_BUCKET, type EventDraft, type TripContext, readStoredDraft } from '../../../supabase/functions/_shared/documentDraft.ts'
import { type EventInput, type ParseFailure, documentPath } from './scanRules'

export interface TripDocument {
  id: string
  storagePath: string
  fileName: string
  mimeType: string
  sizeBytes: number
  uploadedBy: string
  eventId: string | null
  eventTitle: string | null
  parseStatus: 'pending' | 'parsed' | 'failed'
  extracted: unknown
  createdAt: string
}

export class ScanError extends Error {}

const DOCUMENT_COLUMNS = 'id, storage_path, file_name, mime_type, size_bytes, uploaded_by, event_id, parse_status, extracted, created_at, event:trip_events(title)'

type DocumentRow = {
  id: string; storage_path: string; file_name: string; mime_type: string; size_bytes: number; uploaded_by: string
  event_id: string | null; parse_status: string; extracted: unknown; created_at: string
  event: { title: string } | { title: string }[] | null
}

function toDocument(row: DocumentRow): TripDocument {
  const event = Array.isArray(row.event) ? row.event[0] : row.event
  return {
    id: row.id,
    storagePath: row.storage_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    uploadedBy: row.uploaded_by,
    eventId: row.event_id,
    eventTitle: event?.title ?? null,
    parseStatus: row.parse_status === 'parsed' || row.parse_status === 'failed' ? row.parse_status : 'pending',
    extracted: row.extracted,
    createdAt: row.created_at,
  }
}

export async function listTripDocuments(groupId: string): Promise<TripDocument[]> {
  const { data, error } = await supabase.from('trip_documents').select(DOCUMENT_COLUMNS)
    .eq('group_id', groupId).order('created_at', { ascending: false })
  if (error || !data) throw new ScanError('documents_unavailable')
  return (data as unknown as DocumentRow[]).map(toDocument)
}

/** Upload to the private bucket, then record metadata. A metadata failure removes the object again. */
export async function uploadTripDocument(groupId: string, groupMemberId: string, file: File): Promise<TripDocument> {
  const path = documentPath(groupId, crypto.randomUUID(), file.name)
  const uploaded = await supabase.storage.from(DOCUMENT_BUCKET).upload(path, file, { contentType: file.type, upsert: false })
  if (uploaded.error) {
    const status = (uploaded.error as { statusCode?: string }).statusCode
    throw new ScanError(status === '413' ? 'too_large' : status === '415' ? 'unsupported' : 'upload_failed')
  }
  const { data, error } = await supabase.from('trip_documents').insert({
    group_id: groupId, storage_path: path, file_name: file.name.slice(0, 255) || 'document',
    mime_type: file.type, size_bytes: file.size, uploaded_by: groupMemberId,
  }).select(DOCUMENT_COLUMNS).single()
  if (error || !data) {
    await supabase.storage.from(DOCUMENT_BUCKET).remove([path])
    throw new ScanError('upload_failed')
  }
  return toDocument(data as unknown as DocumentRow)
}

export type ParseOutcome = { ok: true; draft: EventDraft } | { ok: false; code: ParseFailure }

const PARSE_FAILURES: readonly string[] = ['not_authenticated', 'document_not_found', 'unsupported_for_parsing',
  'too_large_to_parse', 'document_unavailable', 'parser_unavailable', 'parse_failed']

export async function parseTripDocument(documentId: string, trip: TripContext): Promise<ParseOutcome> {
  const { data, error } = await supabase.functions.invoke<{ draft?: unknown }>('parse-document', { body: { documentId } })
  if (error) {
    if (error instanceof FunctionsFetchError) return { ok: false, code: 'network' }
    if (error instanceof FunctionsHttpError) {
      const body = await (error.context as Response).json().catch(() => null) as { error?: unknown } | null
      const code = typeof body?.error === 'string' && PARSE_FAILURES.includes(body.error) ? body.error as ParseFailure : 'unknown'
      return { ok: false, code }
    }
    return { ok: false, code: 'unknown' }
  }
  // The function already normalised the draft; normalise again so the form never trusts the wire.
  const draft = readStoredDraft(data?.draft, trip)
  return draft ? { ok: true, draft } : { ok: false, code: 'unknown' }
}

/** A stored draft from an earlier parse, if any. */
export function storedDraft(document: TripDocument, trip: TripContext): EventDraft | null {
  return document.parseStatus === 'parsed' ? readStoredDraft(document.extracted, trip) : null
}

export async function addDocumentEvent(documentId: string, input: EventInput): Promise<string> {
  const { data, error } = await supabase.rpc('create_event_from_document', {
    p_document_id: documentId,
    p_event_type: input.eventType,
    p_title: input.title,
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt ?? undefined,
    p_location: input.location ?? undefined,
    p_location_to: input.locationTo ?? undefined,
    p_notes: input.notes ?? undefined,
    p_dep_code: input.depCode ?? undefined,
    p_arr_code: input.arrCode ?? undefined,
    p_flight_no: input.flightNo ?? undefined,
    p_airline: input.airline ?? undefined,
    p_terminal: input.terminal ?? undefined,
    p_booking_ref: input.bookingRef ?? undefined,
  })
  if (error || typeof data !== 'string') {
    throw new ScanError(error?.message === 'document_unavailable' ? 'document_unavailable' : 'event_failed')
  }
  return data
}

/** A short-lived link to one object, issued only after Storage re-checks membership. */
export async function signedDocumentUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from(DOCUMENT_BUCKET).createSignedUrl(storagePath, 60)
  if (error || !data?.signedUrl) throw new ScanError('view_failed')
  return data.signedUrl
}

/**
 * Remove the object, then its metadata. Both follow the same rule (uploader or
 * Owner), so a refusal leaves both in place; an already-missing object still
 * lets the metadata go.
 */
export async function deleteTripDocument(document: TripDocument): Promise<void> {
  const removed = await supabase.storage.from(DOCUMENT_BUCKET).remove([document.storagePath])
  if (removed.error) throw new ScanError('delete_failed')
  const { data, error } = await supabase.from('trip_documents').delete().eq('id', document.id).select('id')
  if (error || !data?.length) throw new ScanError(removed.data?.length ? 'delete_partial' : 'delete_denied')
}
