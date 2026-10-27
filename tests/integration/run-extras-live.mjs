// Real-stack browser test for the extras: crew status from flights and "who's
// on this", invite sharing, crew info between co-members, and the parse limit.
// A disposable Supabase (Auth, PostgREST, Storage, Edge runtime with the stub
// extractor and a limit of one parse per person) is seeded here; Playwright
// drives a production build on TRIP_WEB_PORT.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createConnection } from 'node:net'
import { resolve } from 'node:path'
import { createLocalStack, root } from '../support/local-stack.mjs'
import { createTrip, quote } from '../support/db-fixtures.mjs'

const webPort = process.env.TRIP_WEB_PORT ?? '4185'
const tripZone = 'Asia/Makassar'
const groupId = 'f0000000-0000-4000-8000-00000000000a'
const stack = createLocalStack({
  projectId: 'extras-live', basePort: 59100, siteUrl: `http://127.0.0.1:${webPort}`, edgeRuntime: true,
  functionSecrets: { SCAN_PARSE_STUB: '1', SCAN_PARSE_DAILY_LIMIT_MEMBER: '1', SCAN_PARSE_DAILY_LIMIT_TRIP: '50' },
})

/** Playwright reuses any server already on the port, which could be a stale build. */
function assertPortFree(port) {
  return new Promise((resolvePort, reject) => {
    const socket = createConnection({ host: '127.0.0.1', port: Number(port) })
    socket.once('connect', () => { socket.destroy(); reject(new Error('web-port-in-use')) })
    socket.once('error', () => resolvePort())
  })
}

async function createAccount(keys, name, email) {
  const response = await fetch(`${stack.apiUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { apikey: keys.serviceRoleKey, Authorization: `Bearer ${keys.serviceRoleKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'LongerPass123!', email_confirm: true, user_metadata: { display_name: name } }),
  })
  if (!response.ok) throw new Error('account-create-failed')
  return (await response.json()).id
}

/** Calendar date `days` from today in the Trip timezone. */
const tripDate = (days) => new Intl.DateTimeFormat('en-CA', { timeZone: tripZone, year: 'numeric', month: '2-digit', day: '2-digit' })
  .format(new Date(Date.now() + days * 86_400_000))
const hoursFromNow = (hours) => new Date(Date.now() + hours * 3_600_000).toISOString()

let started = false
try {
  await assertPortFree(webPort)
  started = true
  stack.start()
  stack.migrate()
  const keys = stack.keys()
  const owner = await createAccount(keys, 'Olive Owner', 'owner-extras@example.test')
  const friend = await createAccount(keys, 'Farah Friend', 'friend-extras@example.test')
  const sam = await createAccount(keys, 'Sam Seaside', 'sam-extras@example.test')
  const { memberIds } = createTrip(stack, { groupId, name: 'Bali crew', currency: 'IDR', timezone: tripZone,
    members: { [owner]: 'owner', [friend]: 'member', [sam]: 'member' } })

  // Day 3 of a 7-day Trip in Bali time.
  stack.psql(`UPDATE public.group_configurations SET destination = 'Bali', start_date = ${quote(tripDate(-2))}, end_date = ${quote(tripDate(4))}
    WHERE group_id = ${quote(groupId)};`)
  stack.psql(`UPDATE public.profiles SET phone = '+91 98765 43210', emergency_contact = 'Mum · +91 98100 00000',
    dietary_notes = 'Vegetarian, no peanuts', upi_id = 'farah@okaxis', avatar_emoji = '🦊' WHERE auth_user_id = ${quote(friend)};`)

  // Olive is flying in now; Farah landed yesterday and flies home in three days; Sam has no flights.
  const flight = (title, dep, arr, startsAt, endsAt, forMember) => `WITH event AS (
      INSERT INTO public.trip_events (group_id, event_type, title, starts_at, ends_at, dep_code, arr_code, created_by)
      VALUES (${quote(groupId)}, 'flight', ${quote(title)}, ${quote(startsAt)}, ${quote(endsAt)}, ${quote(dep)}, ${quote(arr)}, ${quote(memberIds[owner])})
      RETURNING id)
    INSERT INTO public.trip_event_audience (group_id, event_id, group_member_id)
    SELECT ${quote(groupId)}, event.id, ${quote(forMember)} FROM event;`
  stack.psql([
    flight('Olive to Bali', 'BOM', 'DPS', hoursFromNow(-1), hoursFromNow(5), memberIds[owner]),
    flight('Farah to Bali', 'DEL', 'DPS', hoursFromNow(-30), hoursFromNow(-24), memberIds[friend]),
    flight('Farah home', 'DPS', 'DEL', hoursFromNow(77), hoursFromNow(84), memberIds[friend]),
  ].join('\n'))

  const result = spawnSync(resolve(root, 'node_modules/.bin/playwright'), ['test', 'tests/browser/extras/extras-live.spec.ts'], {
    cwd: root, stdio: 'inherit',
    env: {
      ...process.env, PLAYWRIGHT_BROWSERS_PATH: '0', TRIP_EXTRAS_LIVE: '1', TRIP_WEB_PORT: webPort,
      VITE_SUPABASE_URL: stack.apiUrl, VITE_SUPABASE_ANON_KEY: keys.anonKey,
    },
  })
  if (result.error || result.status !== 0) throw new Error('extras-browser-failed')

  // What the browser did is what the database holds.
  assert.equal(stack.psql('SELECT count(*) FROM public.trip_parse_usage;'), '1', 'one parse counted')
  assert.equal(stack.psql(`SELECT string_agg(file_name || '|' || parse_status || '|' || coalesce(parse_error, '-') || '|' || (event_id IS NOT NULL)::text, ',' ORDER BY file_name)
    FROM public.trip_documents;`), 'boarding-pass.png|parsed|-|false,hotel-voucher.png|failed|parse_limit_reached|true')
  assert.equal(stack.psql("SELECT count(*) FROM public.trip_events WHERE title = 'Villa check-in' AND event_type = 'hotel';"), '1')
  assert.equal(stack.psql("SELECT count(*) FROM storage.objects WHERE bucket_id = 'tickets';"), '0', 'legacy bucket used')

  stack.stop()
  started = false
  console.log(JSON.stringify({ extrasLive: 'passed', crewStatus: 'passed', inviteShare: 'passed', crewInfo: 'passed', parseLimit: 'passed', cleanup: 'passed' }))
} catch (error) {
  if (started) {
    try { stack.stop() } catch { /* keep the primary failure */ }
  }
  console.error(error instanceof Error && /^[a-z0-9-]+$/u.test(error.message) ? error.message : 'extras-live-failed')
  if (process.env.TRIP_DEBUG === '1') console.error(error)
  process.exitCode = 1
}
