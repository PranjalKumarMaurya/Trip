// Real-stack browser test for the Trip itinerary and shared Todos tabs: a
// disposable Supabase (with Realtime) plus a production build served on
// TRIP_WEB_PORT, driven by Playwright with two signed-up accounts.
import { spawnSync } from 'node:child_process'
import { createConnection } from 'node:net'
import { resolve } from 'node:path'
import { createLocalStack, root } from '../support/local-stack.mjs'

const webPort = process.env.TRIP_WEB_PORT ?? '4181'
const playwright = resolve(root, 'node_modules/.bin/playwright')
const stack = createLocalStack({
  projectId: 'trip-todos-live', basePort: 58600, realtime: true, siteUrl: `http://127.0.0.1:${webPort}`,
})

/** Playwright reuses any server already on the port, which could be a stale build. */
function assertPortFree(port) {
  return new Promise((resolvePort, reject) => {
    const socket = createConnection({ host: '127.0.0.1', port: Number(port) })
    socket.once('connect', () => { socket.destroy(); reject(new Error('web-port-in-use')) })
    socket.once('error', () => resolvePort())
  })
}

let started = false
try {
  await assertPortFree(webPort)
  started = true
  stack.start()
  stack.migrate()
  const { anonKey } = stack.keys()
  const result = spawnSync(playwright, ['test', 'tests/browser/trip-todos/trip-todos-live.spec.ts'], {
    cwd: root, stdio: 'inherit',
    env: {
      ...process.env, PLAYWRIGHT_BROWSERS_PATH: '0', TRIP_TODOS_LIVE: '1', TRIP_WEB_PORT: webPort,
      VITE_SUPABASE_URL: stack.apiUrl, VITE_SUPABASE_ANON_KEY: anonKey,
    },
  })
  if (result.error || result.status !== 0) throw new Error('trip-todos-browser-failed')
  stack.stop()
  started = false
  console.log(JSON.stringify({ tripTodosLive: 'passed', twoAccounts: 'passed', realtime: 'passed', cleanup: 'passed' }))
} catch (error) {
  if (started) {
    try { stack.stop() } catch { /* keep the primary failure */ }
  }
  console.error(error instanceof Error && /^[a-z0-9-]+$/u.test(error.message) ? error.message : 'trip-todos-live-failed')
  if (process.env.TRIP_DEBUG === '1') console.error(error)
  process.exitCode = 1
}
