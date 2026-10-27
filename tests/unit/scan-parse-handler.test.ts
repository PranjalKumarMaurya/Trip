import assert from 'node:assert/strict'
import test from 'node:test'

import {
  EXTRACTION_SCHEMA, type ParseResult, type ParseStore, buildExtractionPrompt, bytesToBase64,
  createParseHandler, createStubExtractor, parseModelText,
} from '../../supabase/functions/parse-document/handler.ts'

const groupId = 'c0000000-0000-4000-8000-00000000000a'
const documentId = 'd0000000-0000-4000-8000-000000000001'
const trip = { timezone: 'Asia/Kolkata', startDate: '2026-11-01', endDate: '2026-11-05', destination: 'Goa' }

function fakeStore(overrides: Partial<ParseStore> = {}) {
  const saved: ParseResult[] = []
  const store: ParseStore = {
    currentUserId: async () => 'user-1',
    findDocument: async (id) => id === documentId
      ? { id, groupId, storagePath: `${groupId}/e0000000-0000-4000-8000-000000000001/ticket.pdf`, fileName: 'ticket.pdf', mimeType: 'application/pdf' }
      : null,
    tripContext: async () => trip,
    download: async () => ({ bytes: new Uint8Array([37, 80, 68, 70]), mimeType: 'application/pdf' }),
    saveResult: async (_id, result) => { saved.push(result) },
    ...overrides,
  }
  return { store, saved }
}

const post = (body: unknown, authorization = 'Bearer user-jwt') => new Request('http://local/parse-document', {
  method: 'POST', headers: { Authorization: authorization, 'Content-Type': 'application/json' },
  body: typeof body === 'string' ? body : JSON.stringify(body),
})

test('requires a bearer token and a document id before touching any data', async () => {
  let opened = 0
  const handle = createParseHandler({ openStore: () => { opened += 1; return fakeStore().store }, extractor: createStubExtractor() })
  assert.equal((await handle(new Request('http://local', { method: 'OPTIONS' }))).status, 204)
  assert.equal((await handle(new Request('http://local', { method: 'GET' }))).status, 405)
  assert.equal((await handle(post({ documentId }, ''))).status, 401)
  assert.equal((await handle(post({ documentId }, 'Basic abc'))).status, 401)
  assert.equal((await handle(post('not json'))).status, 400)
  assert.equal((await handle(post({ documentId: '../etc/passwd' }))).status, 400)
  assert.equal(opened, 0)
})

test('an invalid session or an invisible document is a safe not-found', async () => {
  const anonymous = createParseHandler({ openStore: () => fakeStore({ currentUserId: async () => null }).store, extractor: createStubExtractor() })
  assert.equal((await anonymous(post({ documentId }))).status, 401)
  const handle = createParseHandler({ openStore: () => fakeStore().store, extractor: createStubExtractor() })
  const missing = await handle(post({ documentId: 'd0000000-0000-4000-8000-000000000999' }))
  assert.equal(missing.status, 404)
  assert.deepEqual(await missing.json(), { error: 'document_not_found' })
  const misplaced = createParseHandler({
    openStore: () => fakeStore({ findDocument: async (id) => ({ id, groupId, storagePath: 'other-trip/x/ticket.pdf', fileName: 'ticket.pdf', mimeType: 'application/pdf' }) }).store,
    extractor: createStubExtractor(),
  })
  assert.equal((await misplaced(post({ documentId }))).status, 404)
})

test('returns a normalised draft, records it, and creates no Event', async () => {
  const { store, saved } = fakeStore()
  const handle = createParseHandler({ openStore: () => store, extractor: createStubExtractor() })
  const response = await handle(post({ documentId }))
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*')
  const { draft } = await response.json()
  assert.equal(draft.eventType, 'flight')
  assert.equal(draft.startsAt, '2026-11-01T00:45:00.000Z')
  assert.equal(draft.endsAt, '2026-11-01T03:15:00.000Z')
  assert.deepEqual([draft.depCode, draft.arrCode, draft.flightNo, draft.bookingRef], ['DEL', 'GOI', '6E-123', 'STUB42'])
  assert.equal(saved.length, 1)
  assert.equal(saved[0].status, 'parsed')
  assert.equal(Object.keys(store).includes('createEvent'), false)
})

test('unsupported, unavailable, oversize, and failed parses are recorded with a code', async () => {
  const cases: Array<[Partial<ParseStore>, Parameters<typeof createParseHandler>[0]['extractor'], number, string]> = [
    [{ findDocument: async (id) => ({ id, groupId, storagePath: `${groupId}/x/photo.heic`, fileName: 'photo.heic', mimeType: 'image/heic' }) }, createStubExtractor(), 422, 'unsupported_for_parsing'],
    [{ download: async () => null }, createStubExtractor(), 422, 'document_unavailable'],
    [{ download: async () => ({ bytes: new Uint8Array(5 * 1024 * 1024 + 1), mimeType: 'image/png' }) }, createStubExtractor(), 422, 'too_large_to_parse'],
    [{}, null, 503, 'parser_unavailable'],
    [{}, async () => { throw new Error('provider said no: secret detail') }, 502, 'parse_failed'],
    [{ findDocument: async (id) => ({ id, groupId, storagePath: `${groupId}/x/unreadable.pdf`, fileName: 'unreadable.pdf', mimeType: 'application/pdf' }) }, createStubExtractor(), 502, 'parse_failed'],
  ]
  for (const [overrides, extractor, status, code] of cases) {
    const { store, saved } = fakeStore(overrides)
    const response = await createParseHandler({ openStore: () => store, extractor })(post({ documentId }))
    assert.equal(response.status, status, code)
    const body = await response.json()
    assert.deepEqual(body, { error: code }, 'no provider detail leaks')
    assert.deepEqual(saved, [{ status: 'failed', error: code }])
  }
})

test('a failure to record the result does not lose the draft', async () => {
  const { store } = fakeStore({ saveResult: async () => { throw new Error('rls') } })
  const response = await createParseHandler({ openStore: () => store, extractor: createStubExtractor() })(post({ documentId }))
  assert.equal(response.status, 200)
})

test('prompt, schema, and response helpers', () => {
  assert.equal(bytesToBase64(new TextEncoder().encode('%PDF')), 'JVBERg==')
  assert.equal(bytesToBase64(new Uint8Array(100_000)).length, 133_336)
  assert.deepEqual(parseModelText('```json\n{"title":"x"}\n```'), { title: 'x' })
  assert.throws(() => parseModelText('I could not read it'))
  assert.equal(EXTRACTION_SCHEMA.additionalProperties, false)
  assert.deepEqual([...EXTRACTION_SCHEMA.required].sort(), Object.keys(EXTRACTION_SCHEMA.properties).sort())
  const prompt = buildExtractionPrompt(trip)
  assert.match(prompt, /2026-11-01 to 2026-11-05/u)
  assert.match(prompt, /Asia\/Kolkata/u)
})
