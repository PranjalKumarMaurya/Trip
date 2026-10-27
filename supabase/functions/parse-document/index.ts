// parse-document: read one private Trip document and return an Event draft for
// review. Runs entirely as the calling user (anon key + the caller's JWT), so
// Row Level Security decides which documents and objects exist. It never uses
// the service-role key and never creates Events.
//
// Secrets: ANTHROPIC_API_KEY (required for real parsing), SCAN_PARSE_MODEL
// (optional), SCAN_PARSE_STUB=1 (local stacks and tests only: deterministic draft).
import { createClient } from 'npm:@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk@1'
import { DOCUMENT_BUCKET } from '../_shared/documentDraft.ts'
import {
  EXTRACTION_SCHEMA, EXTRACTION_SYSTEM_PROMPT, type Extractor, type ParseStore,
  buildExtractionPrompt, bytesToBase64, createParseHandler, createStubExtractor, parseModelText,
} from './handler.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

function openStore(authorization: string): ParseStore {
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  const token = authorization.slice('Bearer '.length)
  return {
    async currentUserId() {
      const { data, error } = await client.auth.getUser(token)
      return error ? null : data.user?.id ?? null
    },
    async findDocument(id) {
      const { data } = await client.from('trip_documents')
        .select('id, group_id, storage_path, file_name, mime_type').eq('id', id).maybeSingle()
      return data ? { id: data.id, groupId: data.group_id, storagePath: data.storage_path, fileName: data.file_name, mimeType: data.mime_type } : null
    },
    async tripContext(groupId) {
      const { data } = await client.from('group_configurations')
        .select('timezone, start_date, end_date, destination').eq('group_id', groupId).maybeSingle()
      return data ? { timezone: data.timezone, startDate: data.start_date, endDate: data.end_date, destination: data.destination } : null
    },
    async download(path) {
      const { data, error } = await client.storage.from(DOCUMENT_BUCKET).download(path)
      if (error || !data) return null
      return { bytes: new Uint8Array(await data.arrayBuffer()), mimeType: data.type }
    },
    async saveResult(documentId, result) {
      const { error } = await client.from('trip_documents').update(result.status === 'parsed'
        ? { parse_status: 'parsed', extracted: result.draft, parse_error: null }
        : { parse_status: 'failed', parse_error: result.error }).eq('id', documentId)
      if (error) throw new Error('save_failed')
    },
  }
}

function anthropicExtractor(apiKey: string, model: string): Extractor {
  const anthropic = new Anthropic({ apiKey, maxRetries: 1, timeout: 60_000 })
  return async ({ file, trip }) => {
    const data = bytesToBase64(file.bytes)
    const source = file.mimeType === 'application/pdf'
      ? { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data } }
      : { type: 'image' as const, source: { type: 'base64' as const, media_type: file.mimeType as 'image/jpeg' | 'image/png' | 'image/webp', data } }
    const response = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: [source, { type: 'text', text: buildExtractionPrompt(trip) }] }],
      output_config: { format: { type: 'json_schema', schema: EXTRACTION_SCHEMA } },
    })
    if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') throw new Error('extraction_incomplete')
    const text = response.content.find((block) => block.type === 'text')
    if (!text || text.type !== 'text') throw new Error('extraction_empty')
    return parseModelText(text.text)
  }
}

const apiKey = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
const extractor: Extractor | null = Deno.env.get('SCAN_PARSE_STUB') === '1'
  ? createStubExtractor()
  : apiKey ? anthropicExtractor(apiKey, Deno.env.get('SCAN_PARSE_MODEL') || 'claude-haiku-4-5-20251001') : null

// Log only outcome codes: never document content, names, or tokens.
Deno.serve(createParseHandler({ openStore, extractor, log: (event) => console.log(`parse-document ${event}`) }))
