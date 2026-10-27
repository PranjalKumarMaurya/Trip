// Trips home, Profile and Trip settings (migrations 070-073), against a real
// local stack with every migration applied as the non-superuser `postgres`:
// bootstrap's International flag; Owner-only Trip settings with validation,
// the currency lock once money is recorded, idempotency and audit; member
// counts and display currencies; the private avatars bucket through the real
// Storage API; and account deletion (last-Owner guard, photo check, cleanup).
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createLocalStack, root } from '../../support/local-stack.mjs'
import { quote, sqlAs } from '../../support/db-fixtures.mjs'

const stack = createLocalStack({ projectId: 'home-profile-verify', basePort: 58950 })
const password = 'LongerPass123!'
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 0xff, 0xd9])
let keys

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
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { display_name: name } }),
  })
  assert.equal(created.status, 200, `create ${name}: ${created.text}`)
  const session = await api('/auth/v1/token?grant_type=password', {
    method: 'POST', contentType: 'application/json', body: JSON.stringify({ email, password }),
  })
  assert.equal(session.status, 200, `sign in ${name}`)
  return { id: created.json.id, email, token: session.json.access_token, refresh: session.json.refresh_token }
}

/** Call an RPC through PostgREST as `user` (or anon). Returns { ok, data, error }. */
async function rpc(user, name, args) {
  const result = await api(`/rest/v1/rpc/${name}`, {
    token: user?.token ?? keys.anonKey, method: 'POST', contentType: 'application/json', body: JSON.stringify(args),
  })
  return result.status < 300 ? { ok: true, data: result.json } : { ok: false, status: result.status, error: result.json?.message ?? result.text }
}

const scalar = (sql) => stack.psql(sql)
/** The error message of `sql` run as `postgres`, or null if it succeeds. */
function postgresError(sql) {
  const result = spawnSync('psql', ['--no-psqlrc', '--quiet', '--set', 'ON_ERROR_STOP=1', '--host', '127.0.0.1',
    '--port', stack.dbPort, '--username', 'postgres', '--dbname', 'postgres'], {
    cwd: root, encoding: 'utf8', env: { ...process.env, PGPASSWORD: 'postgres' }, input: sql,
  })
  return result.status === 0 ? null : result.stderr.match(/ERROR:\s+([^\n]+)/u)?.[1] ?? 'failed'
}
const configOf = (groupId) => scalar(`SELECT trip_name || '|' || destination || '|' || start_date || '|' || end_date || '|'
  || timezone || '|' || accounting_currency || '|' || is_international || '|' || (
    SELECT string_agg(currency_code, ',' ORDER BY currency_code) FROM public.group_configuration_display_currencies
    WHERE group_id = ${quote(groupId)})
  FROM public.group_configurations WHERE group_id = ${quote(groupId)};`)
const memberIdOf = (groupId, user) => scalar(`SELECT member.id FROM public.group_members AS member
  JOIN public.profiles AS profile ON profile.id = member.profile_id
  WHERE member.group_id = ${quote(groupId)} AND profile.auth_user_id = ${quote(user.id)};`)
const addMember = (groupId, user, role = 'member') => stack.psql(`INSERT INTO public.group_members (group_id, profile_id, role, status)
  SELECT ${quote(groupId)}, id, ${quote(role)}, 'active' FROM public.profiles WHERE auth_user_id = ${quote(user.id)};`)

const bootstrapArgs = (name, configuration, requestId = crypto.randomUUID()) => ({
  group_request: { trip_name: name },
  configuration_request: {
    destination: 'Bali', start_date: '2026-11-01', end_date: '2026-11-07', timezone: 'Asia/Kolkata',
    accounting_currency: 'INR', display_currency_codes: ['INR'], ...configuration,
  },
  request_id: requestId,
})

const settingsFor = (overrides = {}) => ({
  trip_name: 'Bali bachelor', destination: 'Seminyak, Bali', start_date: '2026-11-02', end_date: '2026-11-09',
  timezone: 'Asia/Makassar', is_international: true, accounting_currency: 'IDR', display_currency_codes: ['IDR', 'USD'],
  ...overrides,
})

const storagePath = (user, extension = 'jpg') => `${user.id}/${crypto.randomUUID()}.${extension}`
const upload = (user, path, { bytes = jpeg, type = 'image/jpeg' } = {}) =>
  api(`/storage/v1/object/avatars/${path}`, { token: user.token, method: 'POST', body: bytes, contentType: type })
const download = (user, path) => api(`/storage/v1/object/authenticated/avatars/${path}`, { token: user?.token ?? keys.anonKey })
const sign = (user, path) => api(`/storage/v1/object/sign/avatars/${path}`, {
  token: user.token, method: 'POST', contentType: 'application/json', body: JSON.stringify({ expiresIn: 60 }),
})
const removeObjects = (user, paths) => api('/storage/v1/object/avatars', {
  token: user.token, method: 'DELETE', contentType: 'application/json', body: JSON.stringify({ prefixes: paths }),
})
const objectCount = (user) => Number(scalar(`SELECT count(*) FROM storage.objects
  WHERE bucket_id = 'avatars' AND name LIKE ${quote(`${user.id}/%`)};`))

try {
  stack.start()
  stack.migrate()
  keys = stack.keys()
  const owner = await createAccount('olive')
  const friend = await createAccount('farah')
  const stranger = await createAccount('sam')
  const guest = await createAccount('gita')

  // ---- Create Trip: the International flag -------------------------------
  const intlRequest = crypto.randomUUID()
  const intlArgs = bootstrapArgs('Bali', { is_international: true, display_currency_codes: ['INR', 'USD'] }, intlRequest)
  const intl = await rpc(owner, 'bootstrap_group', intlArgs)
  assert.equal(intl.ok, true, intl.error)
  const tripI = intl.data[0].group_id
  assert.equal(configOf(tripI), 'Bali|Bali|2026-11-01|2026-11-07|Asia/Kolkata|INR|true|INR,USD')
  const domestic = await rpc(owner, 'bootstrap_group', bootstrapArgs('Goa', { destination: 'Goa' }))
  assert.equal(domestic.ok, true, domestic.error)
  const tripD = domestic.data[0].group_id
  assert.equal(configOf(tripD), 'Goa|Goa|2026-11-01|2026-11-07|Asia/Kolkata|INR|false|INR', 'flag defaults to false')
  const explicitDomestic = await rpc(owner, 'bootstrap_group', bootstrapArgs('Pune', { destination: 'Pune', is_international: false }))
  assert.equal(explicitDomestic.ok, true, explicitDomestic.error)
  assert.match(configOf(explicitDomestic.data[0].group_id), /\|INR\|false\|INR$/u)
  for (const [label, configuration] of [
    ['string flag', { is_international: 'yes' }],
    ['null flag', { is_international: null }],
    ['unknown key', { surprise: true }],
    ['flag plus unknown key', { is_international: true, surprise: true }],
  ]) {
    const refused = await rpc(owner, 'bootstrap_group', bootstrapArgs('Refused', configuration))
    assert.equal(refused.error, 'invalid_request', label)
  }
  const replay = await rpc(owner, 'bootstrap_group', intlArgs)
  assert.equal(replay.ok, true, replay.error)
  assert.equal(replay.data[0].group_id, tripI, 'replay returns the same Trip')
  const flipped = await rpc(owner, 'bootstrap_group', { ...intlArgs, configuration_request: { ...intlArgs.configuration_request, is_international: false } })
  assert.equal(flipped.error, 'idempotency_conflict', 'flag is part of the request fingerprint')
  assert.equal(scalar(`SELECT count(*) FROM public.groups;`), '3')

  addMember(tripI, friend)
  const ownerMemberI = memberIdOf(tripI, owner)
  const friendMemberI = memberIdOf(tripI, friend)

  // ---- Trips home: member counts and display currencies -----------------
  assert.deepEqual((await rpc(owner, 'get_my_trip_member_counts', {})).data
    .filter((row) => [tripI, tripD].includes(row.group_id))
    .map((row) => `${row.group_id === tripI ? 'I' : 'D'}:${row.member_count}`).sort(), ['D:1', 'I:2'])
  assert.deepEqual((await rpc(stranger, 'get_my_trip_member_counts', {})).data, [])
  assert.equal((await rpc(null, 'get_my_trip_member_counts', {})).ok, false, 'anon')
  const displayFor = (user) => sqlAs(stack, user.id, `SELECT coalesce(string_agg(currency_code, ',' ORDER BY currency_code), 'none')
    FROM public.group_configuration_display_currencies WHERE group_id = ${quote(tripI)};`).rows
  assert.deepEqual(displayFor(friend), [['INR,USD']], 'a Member reads display currencies')
  assert.deepEqual(displayFor(stranger), [['none']], 'a stranger reads none')

  // ---- Trip settings: Owner only ----------------------------------------
  const before = configOf(tripI)
  for (const [label, user] of [['member', friend], ['stranger', stranger]]) {
    const refused = await rpc(user, 'update_trip_settings', { p_group_id: tripI, p_settings: settingsFor(), p_request_id: crypto.randomUUID() })
    assert.equal(refused.error, 'not_authorized', label)
  }
  assert.equal((await rpc(null, 'update_trip_settings', { p_group_id: tripI, p_settings: settingsFor(), p_request_id: crypto.randomUUID() })).ok, false, 'anon')
  assert.equal(configOf(tripI), before)

  // Validation mirrors bootstrap; nothing changes on refusal.
  const { display_currency_codes: _ignored, ...withoutDisplay } = settingsFor()
  for (const [label, settings] of [
    ['missing key', withoutDisplay],
    ['unknown key', { ...settingsFor(), owner: friend.id }],
    ['blank name', settingsFor({ trip_name: '  ' })],
    ['blank destination', settingsFor({ destination: '' })],
    ['bad date', settingsFor({ start_date: '2026-02-30' })],
    ['end before start', settingsFor({ end_date: '2026-11-01' })],
    ['unknown timezone', settingsFor({ timezone: 'Mars/Olympus' })],
    ['lowercase timezone', settingsFor({ timezone: 'asia/makassar' })],
    ['unknown currency', settingsFor({ accounting_currency: 'ZZZ', display_currency_codes: ['ZZZ'] })],
    ['lowercase currency', settingsFor({ accounting_currency: 'idr', display_currency_codes: ['idr'] })],
    ['display without Trip currency', settingsFor({ display_currency_codes: ['USD'] })],
    ['duplicate display currency', settingsFor({ display_currency_codes: ['IDR', 'IDR'] })],
    ['unknown display currency', settingsFor({ display_currency_codes: ['IDR', 'QQQ'] })],
    ['empty display set', settingsFor({ display_currency_codes: [] })],
    ['string flag', settingsFor({ is_international: 'true' })],
  ]) {
    const refused = await rpc(owner, 'update_trip_settings', { p_group_id: tripI, p_settings: settings, p_request_id: crypto.randomUUID() })
    assert.equal(refused.error, 'invalid_request', label)
  }
  assert.equal(configOf(tripI), before)

  // A valid change applies atomically and is audited with the actor.
  const settingsRequest = crypto.randomUUID()
  const updated = await rpc(owner, 'update_trip_settings', { p_group_id: tripI, p_settings: settingsFor(), p_request_id: settingsRequest })
  assert.equal(updated.ok, true, updated.error)
  assert.equal(updated.data.outcome, 'updated')
  assert.deepEqual(updated.data.changed, ['trip_name', 'destination', 'start_date', 'end_date', 'timezone', 'accounting_currency', 'display_currency_codes'])
  assert.equal(configOf(tripI), 'Bali bachelor|Seminyak, Bali|2026-11-02|2026-11-09|Asia/Makassar|IDR|true|IDR,USD')
  assert.equal(scalar(`SELECT actor_group_member_id || '|' || (details ->> 'operation') FROM public.group_audit_events
    WHERE group_id = ${quote(tripI)} AND event_type = 'trip_settings_updated' AND request_id = ${quote(settingsRequest)};`),
  `${ownerMemberI}|trip_settings`)
  assert.deepEqual(sqlAs(stack, friend.id, 'SELECT trip_name, accounting_currency, is_international FROM public.get_my_group_access();').rows,
    [['Bali bachelor', 'IDR', 't']], 'members see the new settings')
  const again = await rpc(owner, 'update_trip_settings', { p_group_id: tripI, p_settings: settingsFor(), p_request_id: settingsRequest })
  assert.equal(again.data?.outcome, 'already_completed', again.error)
  const conflict = await rpc(owner, 'update_trip_settings', { p_group_id: tripI, p_settings: settingsFor({ trip_name: 'Other' }), p_request_id: settingsRequest })
  assert.equal(conflict.error, 'idempotency_conflict')
  const unchanged = await rpc(owner, 'update_trip_settings', { p_group_id: tripI, p_settings: settingsFor(), p_request_id: crypto.randomUUID() })
  assert.equal(unchanged.data?.outcome, 'unchanged', unchanged.error)
  assert.equal(scalar(`SELECT count(*) FROM public.group_audit_events WHERE event_type = 'trip_settings_updated';`), '1')

  // Once money is recorded the Trip currency is locked; other settings still change.
  const expense = await rpc(friend, 'commit_expense', {
    p_group_id: tripI, p_description: 'Dinner', p_original_amount: '200000', p_original_currency: 'IDR', p_split_method: 'equal',
    p_payers: [{ member_id: friendMemberI, amount: '200000' }],
    p_shares: [{ member_id: friendMemberI, amount: '100000' }, { member_id: ownerMemberI, amount: '100000' }],
    p_request_id: crypto.randomUUID(),
  })
  assert.equal(expense.ok, true, expense.error)
  const locked = await rpc(owner, 'update_trip_settings', { p_group_id: tripI, p_settings: settingsFor({ accounting_currency: 'USD', display_currency_codes: ['USD'] }), p_request_id: crypto.randomUUID() })
  assert.equal(locked.error, 'currency_locked')
  assert.match(configOf(tripI), /\|IDR\|true\|IDR,USD$/u)
  const domesticNow = await rpc(owner, 'update_trip_settings', { p_group_id: tripI, p_settings: settingsFor({ is_international: false, display_currency_codes: ['IDR'] }), p_request_id: crypto.randomUUID() })
  assert.deepEqual(domesticNow.data?.changed, ['is_international', 'display_currency_codes'], domesticNow.error)
  assert.match(configOf(tripI), /\|IDR\|false\|IDR$/u)
  // The guard keeps any write path in the current currency.
  assert.equal(postgresError(`INSERT INTO public.trip_expenses (group_id, description, original_amount, original_currency,
    accounting_amount, accounting_currency, split_method, created_by)
    VALUES (${quote(tripI)}, 'Stale', 5, 'INR', 5, 'INR', 'equal', ${quote(friendMemberI)});`), 'split_currency_changed')
  assert.equal(postgresError(`INSERT INTO public.trip_settlements (group_id, from_member, to_member, amount, currency, recorded_by)
    VALUES (${quote(tripI)}, ${quote(friendMemberI)}, ${quote(ownerMemberI)}, 5, 'INR', ${quote(friendMemberI)});`), 'split_currency_changed')
  // Without Expenses the currency can still change; an archived Trip cannot change at all.
  const tripDChange = await rpc(owner, 'update_trip_settings', { p_group_id: tripD, p_settings: settingsFor({ trip_name: 'Goa', destination: 'Goa', accounting_currency: 'EUR', display_currency_codes: ['EUR', 'INR'] }), p_request_id: crypto.randomUUID() })
  assert.equal(tripDChange.data?.outcome, 'updated', tripDChange.error)
  assert.match(configOf(tripD), /\|EUR\|true\|EUR,INR$/u)
  stack.psql(`UPDATE public.groups SET archived_at = now() WHERE id = ${quote(tripD)};`)
  const archived = await rpc(owner, 'update_trip_settings', { p_group_id: tripD, p_settings: settingsFor({ trip_name: 'Late' }), p_request_id: crypto.randomUUID() })
  assert.equal(archived.error, 'not_authorized', 'archived Trip')

  // ---- Avatars bucket -----------------------------------------------------
  const photo = storagePath(owner)
  assert.equal((await upload(owner, photo)).status, 200, 'own folder')
  const refusedUpload = async (label, user, path, options) => {
    const result = await upload(user, path, options)
    assert.notEqual(result.status, 200, label)
  }
  await refusedUpload('someone else’s folder', owner, storagePath(friend))
  await refusedUpload('free-form name', owner, `${owner.id}/me.jpg`)
  await refusedUpload('nested path', owner, `${owner.id}/${crypto.randomUUID()}/x.jpg`)
  await refusedUpload('other extension', owner, storagePath(owner, 'gif'), { type: 'image/gif' })
  await refusedUpload('wrong MIME type', owner, storagePath(owner), { type: 'text/plain' })
  await refusedUpload('over 2 MB', owner, storagePath(owner), { bytes: new Uint8Array(2 * 1024 * 1024 + 1) })
  assert.equal((await api(`/storage/v1/object/avatars/${photo}`, { token: owner.token, method: 'PUT', body: jpeg, contentType: 'image/jpeg' })).status === 200, false, 'no overwrite')
  assert.equal(objectCount(owner), 1)
  assert.equal((await upload(owner, storagePath(owner, 'png'), { type: 'image/png' })).status, 200)
  assert.equal((await upload(owner, storagePath(owner, 'webp'), { type: 'image/webp' })).status, 200)
  await refusedUpload('more than three photos', owner, storagePath(owner))
  assert.equal(objectCount(owner), 3)

  // Readable by the person and their crew, through signed URLs only.
  assert.equal((await download(owner, photo)).status, 200)
  assert.equal((await download(friend, photo)).status, 200, 'co-member')
  assert.equal((await sign(friend, photo)).status, 200, 'co-member signed URL')
  assert.notEqual((await download(stranger, photo)).status, 200, 'stranger')
  assert.notEqual((await sign(stranger, photo)).status, 200, 'stranger signed URL')
  assert.notEqual((await download(null, photo)).status, 200, 'anon')
  assert.notEqual((await api(`/storage/v1/object/public/avatars/${photo}`)).status, 200, 'not public')
  await removeObjects(friend, [photo])
  assert.equal(objectCount(owner), 3, 'a co-member cannot delete')

  // A profile points only at a photo in its own folder.
  const setAvatar = (user, value) => sqlAs(stack, user.id, `UPDATE public.profiles SET avatar_path = ${value === null ? 'NULL' : quote(value)}
    WHERE auth_user_id = ${quote(user.id)} RETURNING avatar_path;`)
  assert.equal(setAvatar(owner, photo).ok, true)
  assert.equal(setAvatar(owner, storagePath(friend)).ok, false, 'someone else’s folder')
  assert.equal(setAvatar(owner, `${owner.id}/../x.jpg`).ok, false, 'traversal')
  assert.equal(setAvatar(owner, 'tickets/boarding.pdf').ok, false, 'other bucket path')
  assert.deepEqual(sqlAs(stack, friend.id, `SELECT avatar_path FROM public.get_trip_member_profiles(${quote(tripI)})
    WHERE group_member_id = ${quote(ownerMemberI)};`).rows, [[photo]])

  // A removed member loses access to the photo.
  stack.psql(`UPDATE public.group_members SET status = 'inactive' WHERE id = ${quote(friendMemberI)};`)
  assert.notEqual((await download(friend, photo)).status, 200, 'removed member')
  stack.psql(`UPDATE public.group_members SET status = 'active' WHERE id = ${quote(friendMemberI)};`)

  // ---- Delete account -------------------------------------------------------
  // A Member joins with a real invitation; deleting them removes them everywhere.
  const invitation = await rpc(owner, 'create_invitation', {
    group_id: tripI, recipient_request: { email: guest.email }, invitation_request: {}, request_id: crypto.randomUUID(),
  })
  assert.equal(invitation.ok, true, invitation.error)
  const accepted = await rpc(guest, 'accept_invitation', { invitation_proof: invitation.data.proof, continuation_context: {}, request_id: crypto.randomUUID() })
  assert.equal(accepted.ok, true, accepted.error)
  const guestMember = memberIdOf(tripI, guest)
  assert.deepEqual((await rpc(guest, 'get_account_deletion_blockers', {})).data, [])
  assert.equal((await rpc(guest, 'delete_my_account', { p_confirmation: 'delete' })).error, 'invalid_request')
  const guestDeleted = await rpc(guest, 'delete_my_account', { p_confirmation: 'DELETE' })
  assert.deepEqual(guestDeleted.data, { outcome: 'deleted' }, guestDeleted.error)
  assert.equal(scalar(`SELECT count(*) FROM auth.users WHERE id = ${quote(guest.id)};`), '0', 'Auth user removed')
  assert.equal(scalar(`SELECT count(*) FROM auth.identities WHERE user_id = ${quote(guest.id)};`), '0')
  assert.equal(scalar(`SELECT count(*) FROM public.profiles WHERE auth_user_id = ${quote(guest.id)};`), '0', 'profile removed')
  assert.equal(scalar(`SELECT status || '|' || role || '|' || coalesce(profile_id::text, 'unlinked') FROM public.group_members WHERE id = ${quote(guestMember)};`), 'inactive|member|unlinked')
  assert.equal(scalar(`SELECT recipient_email FROM public.invitations WHERE accepted_by_group_member_id = ${quote(guestMember)};`), 'former-member@deleted.invalid')
  assert.equal(scalar(`SELECT details ->> 'operation' FROM public.group_audit_events WHERE actor_group_member_id = ${quote(guestMember)} AND details ->> 'operation' = 'account_deleted';`), 'account_deleted')
  assert.deepEqual(sqlAs(stack, friend.id, `SELECT display_name FROM public.get_group_roster(${quote(tripI)}) ORDER BY display_name;`).rows,
    [['farah'], ['olive']], 'gone from the roster')
  assert.deepEqual((await rpc(guest, 'delete_my_account', { p_confirmation: 'DELETE' })).data, { outcome: 'already_deleted' }, 'retry')
  const refreshed = await api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', contentType: 'application/json', body: JSON.stringify({ refresh_token: guest.refresh }) })
  assert.notEqual(refreshed.status, 200, 'the session cannot be refreshed')
  const signIn = await api('/auth/v1/token?grant_type=password', { method: 'POST', contentType: 'application/json', body: JSON.stringify({ email: guest.email, password }) })
  assert.notEqual(signIn.status, 200, 'cannot sign in again')

  // The last active Owner of a live Trip is blocked; archived Trips do not block.
  stack.psql(`UPDATE public.groups SET archived_at = NULL WHERE id = ${quote(tripD)};`)
  assert.deepEqual((await rpc(owner, 'get_account_deletion_blockers', {})).data.map((row) => row.trip_name).sort(),
    ['Bali bachelor', 'Goa', 'Pune'])
  assert.equal((await rpc(owner, 'delete_my_account', { p_confirmation: 'DELETE' })).error, 'last_owner')
  assert.equal(scalar(`SELECT count(*) FROM auth.users WHERE id = ${quote(owner.id)};`), '1')
  stack.psql(`UPDATE public.group_members SET role = 'owner' WHERE id = ${quote(friendMemberI)};
    UPDATE public.groups SET archived_at = now() WHERE id IN (${quote(tripD)}, ${quote(explicitDomestic.data[0].group_id)});`)
  assert.deepEqual((await rpc(owner, 'get_account_deletion_blockers', {})).data, [])

  // Photos must be removed through Storage first, so no file is orphaned.
  assert.equal((await rpc(owner, 'delete_my_account', { p_confirmation: 'DELETE' })).error, 'avatars_remaining')
  const listed = await api('/storage/v1/object/list/avatars', { token: owner.token, method: 'POST', contentType: 'application/json', body: JSON.stringify({ prefix: `${owner.id}/`, limit: 100 }) })
  assert.equal(listed.json.length, 3)
  assert.equal((await removeObjects(owner, listed.json.map((object) => `${owner.id}/${object.name}`))).status, 200)
  assert.equal(objectCount(owner), 0)
  const ownerDeleted = await rpc(owner, 'delete_my_account', { p_confirmation: 'DELETE' })
  assert.deepEqual(ownerDeleted.data, { outcome: 'deleted' }, ownerDeleted.error)
  assert.equal(scalar(`SELECT count(*) FROM auth.users WHERE id = ${quote(owner.id)};`), '0')
  assert.equal(scalar(`SELECT count(*) FROM public.group_members WHERE id = ${quote(ownerMemberI)} AND profile_id IS NULL AND status = 'inactive';`), '1')
  assert.equal(scalar(`SELECT count(*) FROM public.ir003_bootstrap_requests;`), '0', 'own idempotency records removed')
  // Trip history stays consistent: the Expense, its shares and the audit rows remain.
  assert.equal(scalar(`SELECT count(*) FROM public.trip_expense_shares WHERE group_member_id = ${quote(ownerMemberI)};`), '1')
  assert.equal(scalar(`SELECT string_agg(details ->> 'operation', ',' ORDER BY occurred_at) FROM public.group_audit_events
    WHERE actor_group_member_id = ${quote(ownerMemberI)};`), 'TOP-001,trip_settings,trip_settings,TOP-002,account_deleted')
  assert.deepEqual(sqlAs(stack, friend.id, `SELECT display_name FROM public.get_trip_member_profiles(${quote(tripI)});`).rows, [['farah']])
  assert.deepEqual(sqlAs(stack, friend.id, 'SELECT trip_name, role FROM public.get_my_group_access();').rows, [['Bali bachelor', 'owner']])
  const ledger = await rpc(friend, 'get_split_ledger', { p_group_id: tripI })
  assert.equal(ledger.ok, true, ledger.error)

  stack.stop()
  console.log(JSON.stringify({
    bootstrapInternational: 'passed', settingsOwnerOnly: 'passed', settingsValidation: 'passed', currencyLock: 'passed',
    settingsAudit: 'passed', memberCounts: 'passed', avatarPolicies: 'passed', deleteAccount: 'passed', cleanup: 'passed',
  }))
} catch (error) {
  try { stack.stop() } catch { /* keep the primary failure */ }
  console.error(error instanceof Error && /^[a-z0-9-]+$/u.test(error.message) ? error.message : 'home-profile-verification-failed')
  if (process.env.TRIP_DEBUG === '1') console.error(error)
  process.exitCode = 1
}
