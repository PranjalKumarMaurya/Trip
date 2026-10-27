// Real-stack Split journey for percent and shares splits and "Pay via UPI":
// two users, one INR Trip, realtime on. Disposable stack and preview server;
// both are always stopped. The spec sets the friend's UPI ID with psql, so it
// gets the stack's database port.
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { createLocalStack, root } from '../support/local-stack.mjs'

process.env.TRIP_WEB_PORT ??= '4185'
const webUrl = `http://127.0.0.1:${process.env.TRIP_WEB_PORT}`
const stack = createLocalStack({ projectId: 'split-modes-live', basePort: 58730, realtime: true })
const playwright = resolve(root, 'node_modules/.bin/playwright')

async function assertWebPortFree() {
  // Playwright would silently reuse a server already on this port (built against another stack).
  const response = await fetch(webUrl).catch(() => null)
  if (response) throw new Error('web-port-busy')
}

try {
  await assertWebPortFree()
  stack.start()
  stack.migrate()
  const { anonKey } = stack.keys()
  const result = spawnSync(playwright, ['test', 'tests/browser/split/split-modes-live.spec.ts'], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env, PLAYWRIGHT_BROWSERS_PATH: '0', TRIP_SPLIT_MODES_LIVE: '1', TRIP_SPLIT_DB_PORT: stack.dbPort,
      VITE_SUPABASE_URL: stack.apiUrl, VITE_SUPABASE_ANON_KEY: anonKey,
    },
  })
  // A skipped test also exits 0; require that the journey actually ran and passed.
  const ran = /\b1 passed\b/u.test(result.stdout ?? '') && !/\bskipped\b/u.test(result.stdout ?? '')
  if (process.env.TRIP_DEBUG === '1' && ran) console.log(result.stdout)
  if (result.error || result.status !== 0 || !ran) {
    const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
    if (process.env.TRIP_DEBUG === '1') console.error(output)
    else console.error(output.split('\n').filter((line) => /Error:|✘|expect\(/u.test(line)).slice(0, 8)
      .map((line) => line.replace(/#invite=[0-9a-f]+/gu, '#invite=<redacted>')).join('\n'))
    throw new Error('split-modes-live-browser-failed')
  }
  stack.stop()
  console.log(JSON.stringify({ splitModesLive: 'passed', percentSplit: 'passed', sharesSplit: 'passed', editRestore: 'passed', upiLink: 'passed', upiRecord: 'passed', cleanup: 'passed' }))
} catch (error) {
  try { stack.stop() } catch { /* keep the primary failure */ }
  console.error(error instanceof Error && /^[a-z0-9-]+$/u.test(error.message) ? error.message : 'split-modes-live-failed')
  if (process.env.TRIP_DEBUG === '1') console.error(error)
  process.exitCode = 1
}
