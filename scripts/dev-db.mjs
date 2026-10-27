// Persistent local Supabase for development.
//   npm run db:start   start, apply all migrations, write .env.development.local
//   npm run db:types   regenerate src/lib/database.types.ts from the running stack
//   npm run db:reset   stop (dropping data) and start fresh
//   npm run db:stop    stop and drop data
// Override ports with TRIP_DEV_DB_BASE_PORT (default 54320 -> API on 54321) and the
// container name with TRIP_DEV_DB_PROJECT (default trip-dev) when worktrees run side by side.
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createLocalStack, root } from '../tests/support/local-stack.mjs'

const basePort = Number(process.env.TRIP_DEV_DB_BASE_PORT ?? 54320)
const workdir = resolve(root, '.local-stack')
mkdirSync(workdir, { recursive: true })
const stack = createLocalStack({
  projectId: process.env.TRIP_DEV_DB_PROJECT ?? 'trip-dev',
  basePort,
  workdir,
  realtime: true,
  mailbox: true,
  confirmations: true,
  siteUrl: 'http://127.0.0.1:5173',
})

function start() {
  stack.start()
  stack.migrate()
  const { anonKey } = stack.keys()
  writeFileSync(resolve(root, '.env.development.local'),
    `# Written by scripts/dev-db.mjs for the local dev stack only.\nVITE_SUPABASE_URL=${stack.apiUrl}\nVITE_SUPABASE_ANON_KEY=${anonKey}\n`)
  console.log(`Local Supabase ready: API ${stack.apiUrl}, mailbox ${stack.mailboxUrl}`)
  console.log('Wrote .env.development.local; `npm run dev` now uses this stack.')
}

function stop() {
  if (stack.containerExists()) stack.stop()
  if (existsSync(resolve(root, '.env.development.local'))) rmSync(resolve(root, '.env.development.local'))
}

function types() {
  const output = stack.run(resolve(root, 'node_modules/.bin/supabase'),
    ['gen', 'types', 'typescript', '--local', '--schema', 'public', '--workdir', workdir], { label: 'gen-types' })
  writeFileSync(resolve(root, 'src/lib/database.types.ts'), output)
  console.log('Regenerated src/lib/database.types.ts')
}

const command = process.argv[2]
try {
  if (command === 'start') start()
  else if (command === 'stop') stop()
  else if (command === 'reset') { stop(); start() }
  else if (command === 'types') types()
  else throw new Error('usage: dev-db.mjs start|stop|reset|types')
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
