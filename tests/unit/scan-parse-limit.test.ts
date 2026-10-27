import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEFAULT_PARSE_LIMITS, type Extractor, type ParseClaim, type ParseLimits, type ParseResult, type ParseStore,
  createParseHandler, createStubExtractor, parseLimitsFromEnv,
} from '../../supabase/functions/parse-document/handler.ts'
import { parseFailureMessage } from '../../src/features/scan/scanRules.ts'

const groupId = 'c0000000-0000-4000-8000-00000000000a'
const documentId = 'd0000000-0000-4000-8000-000000000001'

function setup({ claim = async () => 'claimed', overrides = {}, extractor }: {
  claim?: (documentId: string, limits: ParseLimits) => Promise<ParseClaim>
  overrides?: Partial<ParseStore>
  extractor?: Extractor | null
} = {}) {
  const saved: ParseResult[] = []
  const claims: ParseLimits[] = []
  let extracted = 0
  const stub = createStubExtractor()
  const store: ParseStore = {
    currentUserId: async () => 'user-1',
    findDocument: async (id) => ({ id, groupId, storagePath: `${groupId}/e0000000-0000-4000-8000-000000000001/ticket.pdf`, fileName: 'ticket.pdf', mimeType: 'application/pdf' }),
    tripContext: async () => ({ timezone: 'Asia/Kolkata', startDate: '2026-11-01', endDate: '2026-11-05', destination: 'Goa' }),
    download: async () => ({ bytes: new Uint8Array([37, 80, 68, 70]), mimeType: 'application/pdf' }),
    saveResult: async (_id, result) => { saved.push(result) },
    claimParse: async (id, limits) => { claims.push(limits); return claim(id, limits) },
    ...overrides,
  }
  const counted: Extractor = async (input) => { extracted += 1; return stub(input) }
  return { store, saved, claims, extractor: extractor === undefined ? counted : extractor, extracted: () => extracted }
}

const post = () => new Request('http://local/parse-document', {
  method: 'POST', headers: { Authorization: 'Bearer user-jwt', 'Content-Type': 'application/json' }, body: JSON.stringify({ documentId }),
})

test('limits come from the function env; anything but a whole number uses the default', () => {
  assert.deepEqual(DEFAULT_PARSE_LIMITS, { member: 20, trip: 100 })
  assert.deepEqual(parseLimitsFromEnv(() => undefined), { member: 20, trip: 100 })
  const env = (values: Record<string, string>) => (name: string) => values[name]
  assert.deepEqual(parseLimitsFromEnv(env({ SCAN_PARSE_DAILY_LIMIT_MEMBER: '1', SCAN_PARSE_DAILY_LIMIT_TRIP: ' 3 ' })), { member: 1, trip: 3 })
  assert.deepEqual(parseLimitsFromEnv(env({ SCAN_PARSE_DAILY_LIMIT_MEMBER: '0' })), { member: 0, trip: 100 })
  for (const bad of ['', '-1', '2.5', 'ten', '1e3', '9999999999']) {
    assert.deepEqual(parseLimitsFromEnv(env({ SCAN_PARSE_DAILY_LIMIT_MEMBER: bad, SCAN_PARSE_DAILY_LIMIT_TRIP: bad })), DEFAULT_PARSE_LIMITS, bad)
  }
})

test('every parse is claimed with the configured limits before the model is called', async () => {
  const { store, claims, extractor, extracted } = setup()
  const response = await createParseHandler({ openStore: () => store, extractor, limits: { member: 2, trip: 7 } })(post())
  assert.equal(response.status, 200)
  assert.deepEqual(claims, [{ member: 2, trip: 7 }])
  assert.equal(extracted(), 1)
})

test('over a limit: 429 parse_limit_reached, the model is not called, the document is marked', async () => {
  for (const [claim, scope] of [['member_limit', 'member'], ['trip_limit', 'trip']] as const) {
    const { store, saved, extractor, extracted } = setup({ claim: async () => claim })
    const response = await createParseHandler({ openStore: () => store, extractor })(post())
    assert.equal(response.status, 429)
    assert.deepEqual(await response.json(), { error: 'parse_limit_reached', scope })
    assert.equal(extracted(), 0)
    assert.deepEqual(saved, [{ status: 'failed', error: 'parse_limit_reached' }])
  }
})

test('if the count cannot be checked, the model is not called', async () => {
  for (const claim of [async () => { throw new Error('rpc down') }, async () => 'surprise' as ParseClaim]) {
    const { store, extractor, extracted } = setup({ claim })
    const response = await createParseHandler({ openStore: () => store, extractor })(post())
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { error: 'parser_unavailable' })
    assert.equal(extracted(), 0)
  }
})

test('requests that never reach the model do not count', async () => {
  const cases: Array<{ overrides?: Partial<ParseStore>; extractor?: Extractor | null; status: number }> = [
    { overrides: { currentUserId: async () => null }, status: 401 },
    { overrides: { findDocument: async () => null }, status: 404 },
    { overrides: { findDocument: async (id) => ({ id, groupId, storagePath: `${groupId}/x/photo.heic`, fileName: 'photo.heic', mimeType: 'image/heic' }) }, status: 422 },
    { overrides: { download: async () => null }, status: 422 },
    { overrides: { download: async () => ({ bytes: new Uint8Array(5 * 1024 * 1024 + 1), mimeType: 'image/png' }) }, status: 422 },
    { extractor: null, status: 503 },
  ]
  for (const { overrides, extractor, status } of cases) {
    const context = setup({ overrides, extractor })
    const response = await createParseHandler({ openStore: () => context.store, extractor: context.extractor })(post())
    assert.equal(response.status, status)
    assert.deepEqual(context.claims, [], `status ${status}`)
  }
})

test('the Scan tab says whose limit it is and points to manual entry', () => {
  assert.equal(parseFailureMessage('parse_limit_reached'),
    'You’ve used today’s automatic reads. Enter the details yourself, or try again tomorrow. The document is saved.')
  assert.match(parseFailureMessage('trip_parse_limit_reached'), /^This Trip has used today’s automatic reads\. Enter the details yourself/u)
})
