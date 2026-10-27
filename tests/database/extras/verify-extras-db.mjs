// Hardening migrations, applied as the non-superuser `postgres`:
// - 090: the legacy `tickets` bucket is private, its public read/insert
//   policies are gone, and existing objects survive for the service role.
// - 091: parse usage is insert-only and server-stamped; claim_document_parse
//   enforces the per-person and per-Trip caps (also under concurrency); the
//   parse-document function (stub extractor, low limits) answers 429.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createLocalStack, root } from '../../support/local-stack.mjs'
import { createTrip, quote, sqlAs } from '../../support/db-fixtures.mjs'

const stack = createLocalStack({
  projectId: 'extras-db', basePort: 59000, edgeRuntime: true,
  functionSecrets: { SCAN_PARSE_STUB: '1', SCAN_PARSE_DAILY_LIMIT_MEMBER: '2', SCAN_PARSE_DAILY_LIMIT_TRIP: '3' },
})
const tripA = 'e0000000-0000-4000-8000-00000000000a'
const tripB = 'e0000000-0000-4000-8000-00000000000b'
const tripC = 'e0000000-0000-4000-8000-00000000000c'
const pdf = new TextEncoder().encode('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n')
let keys

/** Apply the migrations `include` selects, in filename order, exactly as local-stack's migrate() does. */
function migrate(include) {
  const dir = resolve(root, 'supabase/migrations')
  for (const name of readdirSync(dir).filter((file) => file.endsWith('.sql')).sort().filter(include)) {
    stack.psql(readFileSync(resolve(dir, name), 'utf8'), name)
    if (name === '001_initial.sql') {
      stack.adminSql(readFileSync(resolve(root, 'tests/database/ir-002/platform-storage-baseline.sql'), 'utf8'), 'storage-baseline')
    }
  }
}

async function api(path, { token = keys.anonKey, apiKey = keys.anonKey, method = 'GET', body, contentType } = {}) {
  const headers = { apikey: apiKey, Authorization: `Bearer ${token}` }
  if (contentType) headers['Content-Type'] = contentType
  const response = await fetch(`${stack.apiUrl}${path}`, { method, headers, body })
  const text = await response.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* binary or empty body */ }
  return { status: response.status, json, text }
}
// Storage answers HTTP 400 and carries the real reason in `statusCode`.
const reason = (result) => result.json?.statusCode ?? String(result.status)
const anon = () => ({ token: keys.anonKey })
const service = () => ({ token: keys.serviceRoleKey, apiKey: keys.serviceRoleKey })

async function createAccount(name) {
  const email = `${name}@example.test`
  const created = await api('/auth/v1/admin/users', {
    ...service(), method: 'POST', contentType: 'application/json',
    body: JSON.stringify({ email, password: 'LongerPass123!', email_confirm: true, user_metadata: { display_name: name } }),
  })
  assert.equal(created.status, 200, `create ${name}: ${created.text}`)
  const session = await api('/auth/v1/token?grant_type=password', {
    method: 'POST', contentType: 'application/json', body: JSON.stringify({ email, password: 'LongerPass123!' }),
  })
  assert.equal(session.status, 200, `sign in ${name}`)
  return { id: created.json.id, token: session.json.access_token }
}

const objectApi = (bucket, path, user, { method = 'POST', bytes = pdf, type = 'application/pdf' } = {}) =>
  api(`/storage/v1/object/${bucket}/${path}`, { ...user, method, body: bytes, contentType: type })

/** Upload a document into a Trip as `user` and record its metadata; returns the document id. */
async function addDocument(user, groupId, memberId) {
  const path = `${groupId}/${crypto.randomUUID()}/ticket.pdf`
  assert.equal((await objectApi('trip-documents', path, user)).status, 200, 'document upload')
  const inserted = sqlAs(stack, user.id, `INSERT INTO public.trip_documents (group_id, storage_path, file_name, mime_type, size_bytes, uploaded_by)
    VALUES (${quote(groupId)}, ${quote(path)}, 'ticket.pdf', 'application/pdf', ${pdf.byteLength}, ${quote(memberId)}) RETURNING id;`)
  assert.equal(inserted.ok, true, inserted.error)
  return inserted.rows[0][0]
}

const parse = (user, documentId) => api('/functions/v1/parse-document', {
  token: user.token, method: 'POST', contentType: 'application/json', body: JSON.stringify({ documentId }),
})
const claim = (documentId, member = 2, trip = 3) => `SELECT public.claim_document_parse(${quote(documentId)}, ${member}, ${trip});`

/** sqlAs, but asynchronous so several sessions can run at once. */
function sqlAsAsync(userId, sql) {
  return new Promise((resolveResult, reject) => {
    const child = spawn('psql', ['--no-psqlrc', '--quiet', '--tuples-only', '--no-align', '--set', 'ON_ERROR_STOP=1',
      '--host', '127.0.0.1', '--port', stack.dbPort, '--username', 'postgres', '--dbname', 'postgres'], {
      cwd: root, env: { ...process.env, PGPASSWORD: 'postgres' },
    })
    let stdout = ''
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.on('error', reject)
    child.on('close', (code) => resolveResult(code === 0
      ? stdout.split('\n').filter((line) => line && !['BEGIN', 'COMMIT', 'SET'].includes(line))
      : ['error']))
    child.stdin.end(`BEGIN;\nSET LOCAL ROLE authenticated;\nSELECT set_config('request.jwt.claim.sub', ${quote(userId)}, true) \\g /dev/null\n${sql}\nCOMMIT;\n`)
  })
}

try {
  stack.start()
  assert.equal(stack.psql("SELECT rolsuper FROM pg_roles WHERE rolname = current_user;"), 'f', 'migrations run as a superuser')

  // ---- 090: the legacy tickets bucket -------------------------------------
  migrate((name) => name < '090')
  keys = stack.keys()
  const legacyPath = 'bali/boarding-pass.pdf'
  // Before 090 the bucket is wide open: anon can add and read objects.
  assert.equal((await objectApi('tickets', legacyPath, anon())).status, 200, 'legacy anon upload before 090')
  assert.equal((await api(`/storage/v1/object/public/tickets/${legacyPath}`)).status, 200, 'legacy public read before 090')

  migrate((name) => name >= '090')
  assert.equal(stack.psql("SELECT public FROM storage.buckets WHERE id = 'tickets';"), 'f')
  assert.equal(stack.psql(`SELECT count(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'
    AND (policyname LIKE 'tickets%' OR coalesce(qual, '') LIKE '%tickets%' OR coalesce(with_check, '') LIKE '%tickets%');`), '0')
  // Objects stay, and the service role (the one-time import) can still read them.
  assert.equal(stack.psql("SELECT count(*) FROM storage.objects WHERE bucket_id = 'tickets';"), '1')
  const imported = await api(`/storage/v1/object/tickets/${legacyPath}`, service())
  assert.equal(imported.status, 200, 'service role read')
  assert.equal(imported.text, new TextDecoder().decode(pdf))

  const owner = await createAccount('owner')
  const friend = await createAccount('friend')
  const stranger = await createAccount('stranger')
  const other = await createAccount('other')
  const racer = await createAccount('racer')
  const a = createTrip(stack, { groupId: tripA, name: 'Goa', members: { [owner.id]: 'owner', [friend.id]: 'member' } })
  const b = createTrip(stack, { groupId: tripB, name: 'Jaipur', members: { [other.id]: 'owner', [owner.id]: 'member' } })
  const c = createTrip(stack, { groupId: tripC, name: 'Kochi', members: { [racer.id]: 'owner' } })

  // Nobody but the service role can list, read, sign, or add tickets objects any more.
  for (const [who, user] of [['anon', anon()], ['member', friend]]) {
    assert.notEqual((await api(`/storage/v1/object/public/tickets/${legacyPath}`, user)).status, 200, `${who} public read`)
    assert.equal(reason(await api(`/storage/v1/object/authenticated/tickets/${legacyPath}`, user)), '404', `${who} read`)
    const listed = await api('/storage/v1/object/list/tickets', {
      ...user, method: 'POST', contentType: 'application/json', body: JSON.stringify({ prefix: '', limit: 100 }),
    })
    assert.ok(listed.status !== 200 || (Array.isArray(listed.json) && listed.json.length === 0), `${who} list`)
    const signed = await api(`/storage/v1/object/sign/tickets/${legacyPath}`, {
      ...user, method: 'POST', contentType: 'application/json', body: JSON.stringify({ expiresIn: 60 }),
    })
    assert.notEqual(signed.status, 200, `${who} signed URL`)
    assert.notEqual((await objectApi('tickets', `bali/${who}-new.pdf`, user)).status, 200, `${who} upload`)
    assert.notEqual((await objectApi('tickets', legacyPath, user, { method: 'PUT' })).status, 200, `${who} overwrite`)
  }
  for (const userId of [null, friend.id]) {
    assert.deepEqual(sqlAs(stack, userId, "SELECT count(*) FROM storage.objects WHERE bucket_id = 'tickets';").rows, [['0']])
    assert.equal(sqlAs(stack, userId, "INSERT INTO storage.objects (bucket_id, name) VALUES ('tickets', 'sql-insert.pdf');").ok, false)
  }
  assert.equal(stack.psql("SELECT count(*) FROM storage.objects WHERE bucket_id = 'tickets';"), '1', 'tickets objects changed')

  // ---- 091: parse caps through the Edge Function (member 2, Trip 3) --------
  const memberOf = (trip, user) => trip.memberIds[user.id]
  const friendDocs = [await addDocument(friend, tripA, memberOf(a, friend)), await addDocument(friend, tripA, memberOf(a, friend))]
  const ownerDocA = await addDocument(owner, tripA, memberOf(a, owner))
  const ownerDocB = await addDocument(owner, tripB, memberOf(b, owner))

  assert.equal((await parse(friend, friendDocs[0])).status, 200)
  assert.equal((await parse(friend, friendDocs[1])).status, 200)
  const overMember = await parse(friend, friendDocs[0])
  assert.equal(overMember.status, 429, overMember.text)
  assert.deepEqual(overMember.json, { error: 'parse_limit_reached', scope: 'member' })
  assert.equal(stack.psql(`SELECT parse_status || '|' || parse_error FROM public.trip_documents WHERE id = ${quote(friendDocs[0])};`), 'failed|parse_limit_reached')
  assert.equal((await parse(owner, ownerDocA)).status, 200, 'third parse in the Trip')
  const overTrip = await parse(owner, ownerDocA)
  assert.equal(overTrip.status, 429)
  assert.deepEqual(overTrip.json, { error: 'parse_limit_reached', scope: 'trip' })
  // The person cap spans Trips: one more in Jaipur, then the owner is at 2.
  assert.equal((await parse(owner, ownerDocB)).status, 200, 'other Trip parse')
  assert.deepEqual((await parse(owner, ownerDocB)).json, { error: 'parse_limit_reached', scope: 'member' })
  // Requests the function refuses earlier never count.
  assert.equal((await parse(stranger, ownerDocA)).status, 404)
  assert.equal((await parse(anon(), ownerDocA)).status, 401)
  assert.equal(stack.psql(`SELECT string_agg(member.group_id::text || ':' || profile.display_name, ',' ORDER BY member.group_id, profile.display_name)
    FROM public.trip_parse_usage AS usage
    JOIN public.group_members AS member ON member.id = usage.group_member_id
    JOIN public.profiles AS profile ON profile.id = usage.profile_id AND profile.id = member.profile_id;`),
  `${tripA}:friend,${tripA}:friend,${tripA}:owner,${tripB}:owner`)

  // ---- 091: tamper-proof usage rows ----------------------------------------
  const usage = (userId) => sqlAs(stack, userId, 'SELECT count(*) FROM public.trip_parse_usage;').rows[0][0]
  assert.equal(usage(friend.id), '3', 'Trip A rows')
  assert.equal(usage(owner.id), '4', 'Trip A rows plus own Trip B row')
  assert.equal(usage(other.id), '1', 'Trip B rows')
  assert.equal(usage(stranger.id), '0')
  assert.equal(sqlAs(stack, null, 'SELECT count(*) FROM public.trip_parse_usage;').ok, false, 'anon read')

  const refused = (userId, sql, label) => {
    const result = sqlAs(stack, userId, sql)
    assert.equal(result.ok, false, label)
    return result.error
  }
  assert.match(refused(friend.id, "UPDATE public.trip_parse_usage SET created_at = now() - interval '2 days';", 'backdate'), /permission denied/u)
  assert.match(refused(owner.id, `UPDATE public.trip_parse_usage SET group_id = ${quote(tripC)};`, 'move'), /permission denied/u)
  assert.match(refused(friend.id, 'DELETE FROM public.trip_parse_usage;', 'delete'), /permission denied/u)
  assert.match(refused(owner.id, 'TRUNCATE public.trip_parse_usage;', 'truncate'), /permission denied/u)
  const profileOf = (user) => `(SELECT id FROM public.profiles WHERE auth_user_id = ${quote(user.id)})`
  const insertUsage = (groupId, memberId, profile, extra = '') => `INSERT INTO public.trip_parse_usage
    (group_id, group_member_id, profile_id${extra ? ', created_at' : ''}) VALUES (${quote(groupId)}, ${quote(memberId)}, ${profile}${extra})`
  assert.match(refused(friend.id, `${insertUsage(tripA, memberOf(a, friend), profileOf(friend), ", now() - interval '2 days'")};`, 'chosen time'), /permission denied/u)
  assert.match(refused(friend.id, `${insertUsage(tripA, memberOf(a, owner), profileOf(owner))};`, 'as someone else'), /row-level security/u)
  assert.match(refused(friend.id, `${insertUsage(tripA, memberOf(a, friend), profileOf(owner))};`, 'other profile'), /row-level security/u)
  assert.match(refused(friend.id, `${insertUsage(tripB, memberOf(b, owner), profileOf(friend))};`, 'other Trip'), /row-level security|violates foreign key/u)
  assert.equal(stack.psql('SELECT count(*) FROM public.trip_parse_usage;'), '4', 'usage changed by a refused write')

  // Calling the RPC directly can only add to your own count; it never lowers it.
  assert.deepEqual(sqlAs(stack, friend.id, claim(friendDocs[0], 1000, 1000)).rows, [['claimed']])
  assert.deepEqual(sqlAs(stack, friend.id, claim(friendDocs[0], 3, 1000)).rows, [['member_limit']])
  assert.equal((await parse(friend, friendDocs[1])).status, 429, 'still capped after a direct claim')
  assert.match(refused(stranger.id, claim(ownerDocA), 'stranger claim'), /document_unavailable/u)
  assert.match(refused(other.id, claim(ownerDocA), 'other Trip claim'), /document_unavailable/u)
  assert.match(refused(friend.id, claim(friendDocs[0], -1, 3), 'negative limit'), /invalid_request/u)
  assert.equal(sqlAs(stack, null, claim(ownerDocA)).ok, false, 'anon claim')

  // Concurrent claims serialise: eight at once against a cap of three give three.
  const racerDoc = await addDocument(racer, tripC, memberOf(c, racer))
  const results = await Promise.all(Array.from({ length: 8 }, () =>
    sqlAsAsync(racer.id, `${claim(racerDoc, 3, 100)}\nSELECT pg_sleep(0.2) \\g /dev/null`)))
  assert.deepEqual(results.map((rows) => rows[0]).sort(), [...Array(3).fill('claimed'), ...Array(5).fill('member_limit')])
  assert.equal(stack.psql(`SELECT count(*) FROM public.trip_parse_usage WHERE group_id = ${quote(tripC)};`), '3')

  // Deleting a document keeps its usage; a removed member keeps seeing only their own rows.
  stack.psql(`DELETE FROM public.trip_documents WHERE id = ${quote(friendDocs[0])};`)
  assert.equal(stack.psql(`SELECT count(*) FROM public.trip_parse_usage WHERE group_id = ${quote(tripA)} AND document_id IS NULL;`), '2')
  stack.psql(`UPDATE public.group_members SET status = 'inactive' WHERE id = ${quote(memberOf(a, friend))};`)
  assert.equal(usage(friend.id), '3', 'own rows after leaving')
  assert.match(refused(friend.id, claim(friendDocs[1]), 'removed member claim'), /document_unavailable/u)
  assert.equal((await parse(friend, friendDocs[1])).status, 404, 'removed member parse')

  stack.stop()
  console.log(JSON.stringify({ ticketsBucketLocked: 'passed', legacyObjectsKept: 'passed', parseCaps: 'passed', usageTamperProof: 'passed', concurrentClaims: 'passed', cleanup: 'passed' }))
} catch (error) {
  try { stack.stop() } catch { /* keep the primary failure */ }
  console.error(error instanceof Error && /^[a-z0-9-]+$/u.test(error.message) ? error.message : 'extras-db-verification-failed')
  if (process.env.TRIP_DEBUG === '1') console.error(error)
  process.exitCode = 1
}
