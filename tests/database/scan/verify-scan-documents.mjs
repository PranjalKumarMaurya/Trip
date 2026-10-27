// Private Trip documents (migration 050): Storage object policies through the real
// Storage API, `trip_documents` metadata RLS, the parse-document Edge Function
// (stub extractor) running as the caller, cross-Trip Event links, the
// create_event_from_document RPC, delete rules, and member removal.
import assert from 'node:assert/strict'
import { createLocalStack } from '../../support/local-stack.mjs'
import { createTrip, quote, sqlAs } from '../../support/db-fixtures.mjs'

const stack = createLocalStack({
  projectId: 'scan-fx-db', basePort: 58800, edgeRuntime: true, functionSecrets: { SCAN_PARSE_STUB: '1' },
})
const tripA = 'c0000000-0000-4000-8000-00000000000a'
const tripB = 'c0000000-0000-4000-8000-00000000000b'
const bucket = 'trip-documents'
const pdf = new TextEncoder().encode('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n')
let keys

const uuid = () => crypto.randomUUID()
const pathIn = (groupId, name = 'ticket.pdf') => `${groupId}/${uuid()}/${name}`

async function api(path, { token = keys.anonKey, apiKey = keys.anonKey, method = 'GET', body, contentType } = {}) {
  const headers = { apikey: apiKey, Authorization: `Bearer ${token}` }
  if (contentType) headers['Content-Type'] = contentType
  const response = await fetch(`${stack.apiUrl}${path}`, { method, headers, body })
  const text = await response.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* binary or empty body */ }
  return { status: response.status, json, text }
}

async function createAccount(name) {
  const email = `${name}@example.test`
  const created = await api('/auth/v1/admin/users', {
    token: keys.serviceRoleKey, apiKey: keys.serviceRoleKey, method: 'POST', contentType: 'application/json',
    body: JSON.stringify({ email, password: 'LongerPass123!', email_confirm: true, user_metadata: { display_name: name } }),
  })
  assert.equal(created.status, 200, `create ${name}: ${created.text}`)
  const session = await api('/auth/v1/token?grant_type=password', {
    method: 'POST', contentType: 'application/json', body: JSON.stringify({ email, password: 'LongerPass123!' }),
  })
  assert.equal(session.status, 200, `sign in ${name}`)
  return { id: created.json.id, token: session.json.access_token }
}

const upload = (user, path, { bytes = pdf, type = 'application/pdf', method = 'POST' } = {}) =>
  api(`/storage/v1/object/${bucket}/${path}`, { token: user.token, method, body: bytes, contentType: type })
const download = (user, path) => api(`/storage/v1/object/authenticated/${bucket}/${path}`, { token: user.token })
const sign = (user, path) => api(`/storage/v1/object/sign/${bucket}/${path}`, {
  token: user.token, method: 'POST', contentType: 'application/json', body: JSON.stringify({ expiresIn: 60 }),
})
const list = (user, groupId) => api(`/storage/v1/object/list/${bucket}`, {
  token: user.token, method: 'POST', contentType: 'application/json', body: JSON.stringify({ prefix: `${groupId}/`, limit: 100 }),
})
const remove = (user, path) => api(`/storage/v1/object/${bucket}`, {
  token: user.token, method: 'DELETE', contentType: 'application/json', body: JSON.stringify({ prefixes: [path] }),
})
// Storage answers HTTP 400 and carries the real reason in `statusCode`.
const reason = (result) => result.json?.statusCode ?? String(result.status)
const objectExists = (path) => stack.psql(`SELECT count(*) FROM storage.objects
  WHERE bucket_id = '${bucket}' AND name = ${quote(path)};`) === '1'

function insertDocument(groupId, path, uploadedBy) {
  return `INSERT INTO public.trip_documents (group_id, storage_path, file_name, mime_type, size_bytes, uploaded_by)
    VALUES (${quote(groupId)}, ${quote(path)}, 'ticket.pdf', 'application/pdf', ${pdf.byteLength}, ${quote(uploadedBy)})
    RETURNING id;`
}

const parse = (user, documentId) => api('/functions/v1/parse-document', {
  token: user.token, method: 'POST', contentType: 'application/json', body: JSON.stringify({ documentId }),
})

const createEvent = (documentId, title = 'Flight to Goa') => `SELECT public.create_event_from_document(
  ${quote(documentId)}, 'flight', ${quote(title)}, '2026-11-01T00:45:00Z', '2026-11-01T02:00:00Z',
  'DEL', 'GOI', NULL, 'DEL', 'GOI', '6E-123', 'IndiGo', 'T1', 'PNR42');`

try {
  stack.start()
  stack.migrate()
  keys = stack.keys()

  // The bucket exists, is private, and enforces size and type limits.
  assert.equal(stack.psql(`SELECT public, file_size_limit FROM storage.buckets WHERE id = '${bucket}';`), 'f|10485760')

  const owner = await createAccount('owner')
  const friend = await createAccount('friend')
  const leaver = await createAccount('leaver')
  const stranger = await createAccount('stranger')
  const other = await createAccount('other')
  const a = createTrip(stack, { groupId: tripA, name: 'Goa', members: { [owner.id]: 'owner', [friend.id]: 'member', [leaver.id]: 'member' } })
  const b = createTrip(stack, { groupId: tripB, name: 'Jaipur', members: { [other.id]: 'owner', [owner.id]: 'member' } })
  const memberOf = (trip, user) => trip.memberIds[user.id]

  // Active members upload into their own Trip's folder only.
  const friendPath = pathIn(tripA)
  assert.equal((await upload(friend, friendPath)).status, 200, 'member upload')
  const ownerPath = pathIn(tripA, 'hotel voucher.pdf')
  assert.equal((await upload(owner, ownerPath)).status, 200, 'owner upload')
  const otherPath = pathIn(tripB)
  assert.equal((await upload(other, otherPath)).status, 200, 'other Trip upload')
  assert.equal(reason(await upload(friend, pathIn(tripB))), '403', 'upload into a foreign Trip')
  assert.equal(reason(await upload(stranger, pathIn(tripA))), '403', 'stranger upload')
  assert.notEqual((await upload({ token: keys.anonKey }, pathIn(tripA))).status, 200, 'anon upload')
  assert.equal(reason(await upload(friend, `${tripA}/ticket.pdf`)), '403', 'path without object folder')
  assert.equal(reason(await upload(friend, `${tripA}/not-a-uuid/ticket.pdf`)), '403', 'malformed object folder')
  assert.equal(reason(await upload(friend, `${uuid()}/${uuid()}/ticket.pdf`)), '403', 'unknown Trip folder')
  assert.equal(reason(await upload(friend, pathIn(tripA, 'notes.txt'), { type: 'text/plain', bytes: new TextEncoder().encode('hi') })), '415', 'unsupported type')
  assert.equal(reason(await upload(friend, pathIn(tripA), { bytes: new Uint8Array(10485761) })), '413', 'oversize file')
  // Objects cannot be overwritten (no UPDATE policy) and the legacy public read path is closed.
  assert.equal(reason(await upload(owner, friendPath, { method: 'PUT' })), '403', 'overwrite')
  assert.notEqual((await api(`/storage/v1/object/public/${bucket}/${friendPath}`)).status, 200, 'public URL')
  const moved = await api('/storage/v1/object/move', {
    token: friend.token, method: 'POST', contentType: 'application/json',
    body: JSON.stringify({ bucketId: bucket, sourceKey: friendPath, destinationKey: `${tripB}/${uuid()}/ticket.pdf` }),
  })
  assert.notEqual(moved.status, 200, 'move into another Trip')
  assert.equal(objectExists(friendPath), true)

  // Reads: Trip members only, for download, signed URLs, and listing.
  const fetched = await download(owner, friendPath)
  assert.equal(fetched.status, 200, 'member download')
  assert.equal(fetched.text, new TextDecoder().decode(pdf))
  const signed = await sign(friend, ownerPath)
  assert.equal(signed.status, 200, 'member signed URL')
  assert.equal((await fetch(`${stack.apiUrl}/storage/v1${signed.json.signedURL}`)).status, 200, 'signed URL works')
  assert.equal(reason(await download(stranger, friendPath)), '404', 'stranger download')
  assert.equal(reason(await download(other, friendPath)), '404', 'other Trip download')
  assert.equal(reason(await download({ token: keys.anonKey }, friendPath)), '404', 'anon download')
  assert.notEqual((await sign(stranger, friendPath)).status, 200, 'stranger signed URL')
  assert.notEqual((await sign(friend, otherPath)).status, 200, 'cross-Trip signed URL')
  assert.equal((await list(friend, tripA)).json.length, 2)
  assert.deepEqual((await list(friend, tripB)).json, [])
  assert.deepEqual((await list(stranger, tripA)).json, [])
  assert.deepEqual(sqlAs(stack, null, `SELECT count(*) FROM storage.objects WHERE bucket_id = '${bucket}';`).rows, [['0']])

  // Metadata: only for an object the caller uploaded, stamped with their own member id.
  const friendDoc = sqlAs(stack, friend.id, insertDocument(tripA, friendPath, memberOf(a, friend)))
  assert.equal(friendDoc.ok, true, friendDoc.error)
  const friendDocId = friendDoc.rows[0][0]
  assert.equal(sqlAs(stack, friend.id, insertDocument(tripA, ownerPath, memberOf(a, friend))).ok, false, 'metadata for another uploader object')
  assert.equal(sqlAs(stack, owner.id, insertDocument(tripA, ownerPath, memberOf(a, friend))).ok, false, 'impersonated uploader')
  assert.equal(sqlAs(stack, stranger.id, insertDocument(tripA, ownerPath, memberOf(a, owner))).ok, false, 'stranger metadata')
  assert.equal(sqlAs(stack, owner.id, insertDocument(tripB, ownerPath, memberOf(b, owner))).ok, false, 'metadata retargeted to another Trip')
  assert.equal(sqlAs(stack, owner.id, insertDocument(tripA, `${tripA}/${uuid()}/missing.pdf`, memberOf(a, owner))).ok, false, 'metadata without object')
  const ownerDoc = sqlAs(stack, owner.id, insertDocument(tripA, ownerPath, memberOf(a, owner)))
  assert.equal(ownerDoc.ok, true, ownerDoc.error)
  const ownerDocId = ownerDoc.rows[0][0]
  const otherDoc = sqlAs(stack, other.id, insertDocument(tripB, otherPath, memberOf(b, other)))
  assert.equal(otherDoc.ok, true, otherDoc.error)
  const otherDocId = otherDoc.rows[0][0]

  // The Edge Function reads documents as the caller and returns a draft without creating Events.
  const parsed = await parse(friend, ownerDocId)
  assert.equal(parsed.status, 200, parsed.text)
  assert.equal(parsed.json.draft.flightNo, '6E-123')
  assert.equal(parsed.json.draft.startsAt, '2026-11-01T00:45:00.000Z')
  assert.equal(stack.psql(`SELECT parse_status || '|' || (extracted ->> 'bookingRef') FROM public.trip_documents WHERE id = ${quote(ownerDocId)};`), 'parsed|STUB42')
  assert.equal(stack.psql('SELECT count(*) FROM public.trip_events;'), '0', 'parse created an Event')
  assert.equal((await parse(stranger, ownerDocId)).status, 404, 'stranger parse')
  assert.equal((await parse(other, ownerDocId)).status, 404, 'other Trip parse')
  assert.equal((await parse({ token: keys.anonKey }, ownerDocId)).status, 401, 'anon parse')
  assert.equal((await parse({ token: 'not-a-jwt' }, ownerDocId)).status, 401, 'forged token')
  assert.equal((await parse(friend, 'not-a-uuid')).status, 400)

  // Metadata reads are Trip-scoped.
  const names = (userId) => sqlAs(stack, userId, 'SELECT group_id FROM public.trip_documents ORDER BY group_id;').rows
  assert.deepEqual(names(friend.id), [[tripA], [tripA]])
  assert.deepEqual(names(owner.id), [[tripA], [tripA], [tripB]])
  assert.deepEqual(names(stranger.id), [])
  assert.equal(sqlAs(stack, null, 'SELECT count(*) FROM public.trip_documents;').ok, false, 'anon metadata read')

  // Fixed facts cannot change; parse results can.
  assert.equal(sqlAs(stack, owner.id, `UPDATE public.trip_documents SET group_id = ${quote(tripB)} WHERE id = ${quote(friendDocId)};`).ok, false)
  assert.equal(sqlAs(stack, owner.id, `UPDATE public.trip_documents SET storage_path = ${quote(otherPath)} WHERE id = ${quote(friendDocId)};`).ok, false)
  assert.equal(sqlAs(stack, owner.id, `UPDATE public.trip_documents SET uploaded_by = ${quote(memberOf(a, owner))} WHERE id = ${quote(friendDocId)};`).ok, false)
  assert.deepEqual(sqlAs(stack, owner.id, `UPDATE public.trip_documents SET parse_status = 'parsed', extracted = '{"title":"x"}'
    WHERE id = ${quote(friendDocId)} RETURNING parse_status;`).rows, [['parsed']])
  assert.deepEqual(sqlAs(stack, stranger.id, `UPDATE public.trip_documents SET parse_status = 'failed' WHERE id = ${quote(friendDocId)} RETURNING id;`).rows, [])

  // Event links never cross Trips.
  const foreignEvent = sqlAs(stack, other.id, `INSERT INTO public.trip_events (group_id, event_type, title, starts_at, created_by)
    VALUES (${quote(tripB)}, 'hotel', 'Jaipur hotel', '2026-11-02T08:00:00Z', ${quote(memberOf(b, other))}) RETURNING id;`).rows[0][0]
  const crossLink = sqlAs(stack, owner.id, `UPDATE public.trip_documents SET event_id = ${quote(foreignEvent)} WHERE id = ${quote(friendDocId)};`)
  assert.equal(crossLink.ok, false, 'cross-Trip event link')
  assert.match(crossLink.error, /trip_documents_event_same_group/u)

  // The RPC adds the Event as the caller and links the document once.
  const added = sqlAs(stack, friend.id, createEvent(friendDocId))
  assert.equal(added.ok, true, added.error)
  const eventId = added.rows[0][0]
  assert.deepEqual(stack.psql(`SELECT created_by || '|' || group_id FROM public.trip_events WHERE id = ${quote(eventId)};`),
    `${memberOf(a, friend)}|${tripA}`)
  assert.equal(stack.psql(`SELECT event_id FROM public.trip_documents WHERE id = ${quote(friendDocId)};`), eventId)
  assert.match(sqlAs(stack, friend.id, createEvent(friendDocId, 'Again')).error, /document_unavailable/u, 'second link')
  assert.match(sqlAs(stack, friend.id, createEvent(otherDocId)).error, /document_unavailable/u, 'cross-Trip RPC')
  assert.match(sqlAs(stack, stranger.id, createEvent(ownerDocId)).error, /document_unavailable/u, 'stranger RPC')
  assert.equal(sqlAs(stack, null, createEvent(ownerDocId)).ok, false, 'anon RPC')
  assert.equal(sqlAs(stack, owner.id, `SELECT public.create_event_from_document(${quote(ownerDocId)}, 'flight', ' ', now());`).ok, false, 'blank title')
  assert.equal(stack.psql(`SELECT event_id IS NULL FROM public.trip_documents WHERE id = ${quote(ownerDocId)};`), 't', 'failed RPC left no link')
  // Deleting the Event keeps the document and only unlinks it.
  assert.deepEqual(sqlAs(stack, owner.id, `DELETE FROM public.trip_events WHERE id = ${quote(eventId)} RETURNING id;`).rows, [[eventId]])
  assert.equal(stack.psql(`SELECT coalesce(event_id::text, 'none') FROM public.trip_documents WHERE id = ${quote(friendDocId)};`), 'none')

  // Delete: a non-uploading Member can delete neither object nor metadata.
  assert.deepEqual((await remove(friend, ownerPath)).json, [])
  assert.equal(objectExists(ownerPath), true, 'member deleted another uploader object')
  assert.deepEqual(sqlAs(stack, friend.id, `DELETE FROM public.trip_documents WHERE id = ${quote(ownerDocId)} RETURNING id;`).rows, [])
  assert.deepEqual((await remove(stranger, friendPath)).json, [])
  assert.deepEqual((await remove(owner, otherPath)).json, [], 'Member of B deleted Owner-of-B object')
  assert.equal(objectExists(otherPath), true)

  // The Owner may delete a Member's document; the uploader may delete their own.
  const leaverPath = pathIn(tripA, 'ferry.png')
  assert.equal((await upload(leaver, leaverPath, { type: 'image/png' })).status, 200)
  assert.equal(sqlAs(stack, leaver.id, insertDocument(tripA, leaverPath, memberOf(a, leaver)).replace("'application/pdf'", "'image/png'")).ok, true)
  assert.equal((await remove(owner, friendPath)).json.length, 1, 'Owner object delete')
  assert.deepEqual(sqlAs(stack, owner.id, `DELETE FROM public.trip_documents WHERE id = ${quote(friendDocId)} RETURNING id;`).rows, [[friendDocId]])
  assert.equal((await remove(other, otherPath)).json.length, 1, 'uploader object delete')
  assert.deepEqual(sqlAs(stack, other.id, `DELETE FROM public.trip_documents WHERE id = ${quote(otherDocId)} RETURNING id;`).rows, [[otherDocId]])
  assert.equal(objectExists(friendPath) || objectExists(otherPath), false)

  // A removed Member loses object and metadata access at once, including their own uploads.
  stack.psql(`UPDATE public.group_members SET status = 'inactive' WHERE id = ${quote(memberOf(a, leaver))};`)
  assert.equal(reason(await download(leaver, leaverPath)), '404', 'removed member download')
  assert.notEqual((await sign(leaver, ownerPath)).status, 200, 'removed member signed URL')
  assert.deepEqual((await list(leaver, tripA)).json, [])
  assert.equal(reason(await upload(leaver, pathIn(tripA))), '403', 'removed member upload')
  assert.deepEqual((await remove(leaver, leaverPath)).json, [], 'removed member delete')
  assert.deepEqual(names(leaver.id), [])
  assert.equal((await download(owner, leaverPath)).status, 200, 'remaining members keep access')

  stack.stop()
  console.log(JSON.stringify({ scanDocuments: 'passed', storagePolicies: 'passed', parseFunction: 'passed', metadataRls: 'passed', crossTripLinks: 'passed', deleteRules: 'passed', removal: 'passed', cleanup: 'passed' }))
} catch (error) {
  try { stack.stop() } catch { /* keep the primary failure */ }
  console.error(error instanceof Error && /^[a-z0-9-]+$/u.test(error.message) ? error.message : 'scan-documents-verification-failed')
  if (process.env.TRIP_DEBUG === '1') console.error(error)
  process.exitCode = 1
}
