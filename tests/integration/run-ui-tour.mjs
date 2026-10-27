// Screenshot tour of every main screen on a disposable stack, for UI review.
// Usage: npm run test:ui:tour   (optional TRIP_TOUR_DIR, TRIP_WEB_PORT)
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { createLocalStack, root } from '../support/local-stack.mjs'

const webPort = process.env.TRIP_WEB_PORT ?? '4190'
const stack = createLocalStack({ projectId: 'ui-tour', basePort: 58560, siteUrl: `http://127.0.0.1:${webPort}` })

try {
  stack.start()
  stack.migrate()
  const { anonKey } = stack.keys()
  const result = spawnSync(resolve(root, 'node_modules/.bin/playwright'), ['test', 'tests/browser/tour/ui-tour.spec.ts'], {
    cwd: root, stdio: 'inherit',
    env: {
      ...process.env, PLAYWRIGHT_BROWSERS_PATH: '0', TRIP_UI_TOUR: '1', TRIP_WEB_PORT: webPort,
      VITE_SUPABASE_URL: stack.apiUrl, VITE_SUPABASE_ANON_KEY: anonKey,
    },
  })
  stack.stop()
  if (result.error || result.status !== 0) throw new Error('ui-tour-failed')
} catch (error) {
  try { stack.stop() } catch { /* keep the primary failure */ }
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
