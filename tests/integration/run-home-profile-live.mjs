// Real-stack journey for the Trips home, Profile, Trip settings and domestic vs
// International Trips: a disposable local Supabase (Auth, PostgREST, Storage)
// plus the production build on TRIP_WEB_PORT, driven by Playwright.
import { spawnSync } from 'node:child_process'
import { createConnection } from 'node:net'
import { resolve } from 'node:path'
import { createLocalStack, root } from '../support/local-stack.mjs'

const webPort = process.env.TRIP_WEB_PORT ?? '4185'
const playwright = resolve(root, 'node_modules/.bin/playwright')
const stack = createLocalStack({ projectId: 'home-profile-live', basePort: 58970, siteUrl: `http://127.0.0.1:${webPort}` })
const redact = (text) => text.replace(/[0-9a-f]{64}/gu, '<redacted>').replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/gu, '<jwt>')

/** Playwright reuses any server already on the port, which could be built against another stack. */
function portInUse(port) {
  return new Promise((done) => {
    const socket = createConnection({ host: '127.0.0.1', port: Number(port) })
    socket.once('connect', () => { socket.destroy(); done(true) })
    socket.once('error', () => done(false))
  })
}

try {
  if (await portInUse(webPort)) throw new Error('web-port-in-use')
  stack.start()
  stack.migrate()
  const { anonKey } = stack.keys()
  const result = spawnSync(playwright, ['test', 'tests/browser/home-profile/home-profile-live.spec.ts'], {
    cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    env: {
      ...process.env, PLAYWRIGHT_BROWSERS_PATH: '0', TRIP_HOME_LIVE: '1', TRIP_WEB_PORT: webPort,
      VITE_SUPABASE_URL: stack.apiUrl, VITE_SUPABASE_ANON_KEY: anonKey, VITE_SUPPORT_EMAIL: 'help@example.test',
    },
  })
  const output = redact(`${result.stdout ?? ''}\n${result.stderr ?? ''}`)
  if (process.env.TRIP_DEBUG === '1') console.log(output)
  const ran = /\b1 passed\b/u.test(result.stdout ?? '') && !/\bskipped\b/u.test(result.stdout ?? '')
  if (result.error || result.status !== 0 || !ran) {
    if (process.env.TRIP_DEBUG !== '1') console.error(output.split('\n').filter((line) => /✘|Error:|expect\(/u.test(line)).slice(0, 20).join('\n'))
    throw new Error('home-profile-live-browser-failed')
  }
  // What the browser did is what the database holds.
  const check = (sql, expected, label) => {
    const actual = stack.psql(sql)
    if (actual !== expected) throw new Error(`home-profile-live-${label}`)
  }
  check(`SELECT count(*) FROM auth.users WHERE email LIKE 'farah-home%';`, '0', 'deleted-auth-user')
  check(`SELECT count(*) FROM public.group_members WHERE profile_id IS NULL AND status = 'inactive';`, '1', 'unlinked-membership')
  check(`SELECT string_agg(trip_name || ':' || is_international, ',' ORDER BY trip_name) FROM public.group_configurations;`,
    'Bali crew:true,Goa long weekend:true,Old Pune trip:false', 'trip-settings')
  check(`SELECT count(*) FROM storage.objects WHERE bucket_id = 'avatars';`, '0', 'photo-removed')
  check(`SELECT count(*) FROM public.group_audit_events WHERE event_type = 'trip_settings_updated';`, '1', 'settings-audit')
  stack.stop()
  console.log(JSON.stringify({ homeProfileLive: 'passed', tripsHome: 'passed', profile: 'passed', tripSettings: 'passed', domesticInternational: 'passed', deleteAccount: 'passed', cleanup: 'passed' }))
} catch (error) {
  try { stack.stop() } catch { /* keep the primary failure */ }
  console.error(error instanceof Error && /^[a-z0-9-]+$/u.test(error.message) ? error.message : 'home-profile-live-failed')
  if (process.env.TRIP_DEBUG === '1') console.error(error)
  process.exitCode = 1
}
