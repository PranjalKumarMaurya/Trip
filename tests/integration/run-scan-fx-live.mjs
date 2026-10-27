// Disposable real-stack browser test for the Scan and FX tabs: Auth, PostgREST,
// Storage, and the parse-document Edge Function (stub extractor) all run locally;
// only the public FX rates endpoint is mocked inside Playwright.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { createLocalStack, root } from '../support/local-stack.mjs'

const webPort = process.env.TRIP_WEB_PORT ?? '4183'
const stack = createLocalStack({
  projectId: 'scan-fx-live', basePort: 58800, siteUrl: `http://127.0.0.1:${webPort}`,
  edgeRuntime: true, functionSecrets: { SCAN_PARSE_STUB: '1' },
})

try {
  stack.start()
  stack.migrate()
  const { anonKey } = stack.keys()
  const result = spawnSync(resolve(root, 'node_modules/.bin/playwright'), ['test', 'tests/browser/integration/scan-fx-live.spec.ts'], {
    cwd: root, encoding: 'utf8',
    env: {
      ...process.env, PLAYWRIGHT_BROWSERS_PATH: '0', TRIP_SCAN_FX_LIVE: '1', TRIP_WEB_PORT: webPort,
      VITE_SUPABASE_URL: stack.apiUrl, VITE_SUPABASE_ANON_KEY: anonKey,
    },
  })
  if (result.status !== 0) {
    if (process.env.TRIP_DEBUG === '1') console.error(`${result.stdout}\n${result.stderr}`)
    throw new Error('scan-fx-browser-failed')
  }

  // What the browser did is what the database holds.
  assert.equal(stack.psql(`SELECT string_agg(event.title || '|' || (member.id = event.created_by)::text, ',' ORDER BY event.title)
    FROM public.trip_events AS event JOIN public.group_members AS member ON member.group_id = event.group_id;`),
  'Flight to Goa|true,Hotel check-in|true')
  assert.equal(stack.psql(`SELECT count(*) || '|' || count(event_id) FROM public.trip_documents;`), '1|1')
  assert.equal(stack.psql(`SELECT count(*) FROM storage.objects WHERE bucket_id = 'trip-documents';`), '1')
  assert.equal(stack.psql(`SELECT count(*) FROM storage.objects WHERE bucket_id = 'tickets';`), '0', 'legacy public bucket used')

  stack.stop()
  console.log(JSON.stringify({ scanFxLive: 'passed', privateStorage: 'passed', parseFunction: 'passed', review: 'passed', fx: 'passed', cleanup: 'passed' }))
} catch (error) {
  try { stack.stop() } catch { /* keep the primary failure */ }
  console.error(error instanceof Error && /^[a-z0-9-]+$/u.test(error.message) ? error.message : 'scan-fx-live-failed')
  if (process.env.TRIP_DEBUG === '1') console.error(error)
  process.exitCode = 1
}
