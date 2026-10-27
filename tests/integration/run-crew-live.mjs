// Real-stack Crew journey: disposable local Supabase + the built app in Chromium.
// Ports: stack base 58900 (API 58901, DB 58902), preview TRIP_WEB_PORT (default 4184).
import { spawnSync } from 'node:child_process'
import { createConnection } from 'node:net'
import { resolve } from 'node:path'
import { createLocalStack, root } from '../support/local-stack.mjs'

process.env.TRIP_WEB_PORT ??= '4184'
const webPort = Number(process.env.TRIP_WEB_PORT)
const playwright = resolve(root, 'node_modules/.bin/playwright')
const stack = createLocalStack({ projectId: 'crew-live', basePort: 58900 })
const redact = (text) => text.replace(/[0-9a-f]{64}/gu, '<redacted>').replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/gu, '<jwt>')

// Playwright reuses a server already on the port; it would be built against another stack.
function portInUse(port) {
  return new Promise((done) => {
    const socket = createConnection({ host: '127.0.0.1', port })
    socket.once('connect', () => { socket.destroy(); done(true) })
    socket.once('error', () => done(false))
  })
}

try {
  if (await portInUse(webPort)) throw new Error('web-port-in-use')
  stack.start()
  stack.migrate()
  const { anonKey } = stack.keys()
  const result = spawnSync(playwright, ['test', 'tests/browser/integration/crew-live.spec.ts'], {
    cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    env: {
      ...process.env, PLAYWRIGHT_BROWSERS_PATH: '0', TRIP_CREW_LIVE: '1',
      VITE_SUPABASE_URL: stack.apiUrl, VITE_SUPABASE_ANON_KEY: anonKey,
    },
  })
  const output = redact(`${result.stdout ?? ''}\n${result.stderr ?? ''}`)
  if (process.env.TRIP_DEBUG === '1') console.log(output)
  if (result.error || result.status !== 0) {
    if (process.env.TRIP_DEBUG !== '1') console.error(output.split('\n').filter((line) => /✘|Error:|expect\(/u.test(line)).slice(0, 20).join('\n'))
    throw new Error('crew-live-browser-failed')
  }
  stack.stop()
  console.log(JSON.stringify({ crewLive: 'passed', cleanup: 'passed' }))
} catch (error) {
  try { stack.stop() } catch { /* keep the primary failure */ }
  console.error(error instanceof Error && /^[a-z0-9-]+$/u.test(error.message) ? error.message : 'crew-live-failed')
  if (process.env.TRIP_DEBUG === '1') console.error(error)
  process.exitCode = 1
}
