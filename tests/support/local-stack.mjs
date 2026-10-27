import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const root = fileURLToPath(new URL('../..', import.meta.url))
const cli = resolve(root, 'node_modules/.bin/supabase')

/**
 * A local Supabase stack with every migration applied as `postgres`, the role
 * hosted Supabase uses. Ports derive from `basePort`: API +1, DB +2, Studio +3,
 * mailbox +4, SMTP +5, pooler +9. Give each suite (and each parallel worktree)
 * its own `projectId` and `basePort`.
 *
 * Disposable by default (temporary workdir, removed on stop). Pass `workdir` to
 * keep a persistent stack, e.g. for local development.
 *
 * `edgeRuntime: true` also serves `supabase/functions` (copied into the workdir at
 * start) at `<apiUrl>/functions/v1/<name>`, with `functionSecrets` as their env.
 */
export function createLocalStack({
  projectId,
  basePort,
  workdir: fixedWorkdir,
  realtime = false,
  storage = true,
  mailbox = false,
  confirmations = false,
  edgeRuntime = false,
  functionSecrets = {},
  siteUrl = `http://127.0.0.1:${process.env.TRIP_WEB_PORT ?? '4173'}`,
}) {
  const port = (offset) => String(basePort + offset)
  const container = `supabase_db_${projectId}`
  let workdir = fixedWorkdir ?? ''

  function run(name, args, { input, env = process.env, label = 'command' } = {}) {
    const result = spawnSync(name, args, { cwd: root, encoding: 'utf8', input, env })
    if (result.error || result.status !== 0) {
      if (process.env.TRIP_DEBUG === '1') console.error(result.error ?? `${result.stdout}\n${result.stderr}`)
      throw new Error(`${label}-failed`)
    }
    return result.stdout
  }

  function containerExists() {
    const names = run('docker', ['ps', '--all', '--format', '{{.Names}}'], { label: 'docker-list' })
    return names.split('\n').some((name) => name.endsWith(`_${projectId}`))
  }

  function psql(sql, label = 'psql') {
    return run('psql', ['--no-psqlrc', '--quiet', '--tuples-only', '--no-align', '--set', 'ON_ERROR_STOP=1',
      '--host', '127.0.0.1', '--port', port(2), '--username', 'postgres', '--dbname', 'postgres'], {
      input: sql, env: { ...process.env, PGPASSWORD: 'postgres' }, label,
    }).trim()
  }

  function adminSql(sql, label = 'admin-sql') {
    return run('docker', ['exec', '--interactive', '--user', 'postgres', container, 'psql',
      '--no-psqlrc', '--quiet', '--tuples-only', '--no-align', '--set', 'ON_ERROR_STOP=1',
      '--username', 'supabase_admin', '--dbname', 'postgres'], { input: sql, label }).trim()
  }

  function start() {
    if (containerExists()) throw new Error(`${projectId}-stack-already-exists`)
    if (!workdir) workdir = mkdtempSync(resolve(tmpdir(), `${projectId}-`))
    mkdirSync(resolve(workdir, 'supabase'), { recursive: true })
    if (edgeRuntime) cpSync(resolve(root, 'supabase/functions'), resolve(workdir, 'supabase/functions'), { recursive: true })
    const edgeConfig = edgeRuntime
      ? `policy = "per_worker"\n[edge_runtime.secrets]\n${Object.entries(functionSecrets)
        .map(([key, value]) => `${key} = ${JSON.stringify(String(value))}\n`).join('')}`
      : ''
    writeFileSync(resolve(workdir, 'supabase/config.toml'), `project_id = "${projectId}"
[api]
enabled = true
port = ${port(1)}
[db]
port = ${port(2)}
[db.pooler]
enabled = false
port = ${port(9)}
[realtime]
enabled = ${realtime}
[studio]
enabled = false
port = ${port(3)}
[inbucket]
enabled = ${mailbox}
port = ${port(4)}
smtp_port = ${port(5)}
[storage]
enabled = ${storage}
[auth]
enabled = true
site_url = "${siteUrl}"
[auth.email]
enable_confirmations = ${confirmations}
[edge_runtime]
enabled = ${edgeRuntime}
${edgeConfig}[analytics]
enabled = false
`)
    run(cli, ['start', '--workdir', workdir], { label: 'stack-start' })
  }

  /** Apply every file in supabase/migrations in order, as `postgres`. */
  function migrate() {
    const dir = resolve(root, 'supabase/migrations')
    for (const name of readdirSync(dir).filter((file) => file.endsWith('.sql')).sort()) {
      psql(readFileSync(resolve(dir, name), 'utf8'), name)
      if (name === '001_initial.sql') {
        adminSql(readFileSync(resolve(root, 'tests/database/ir-002/platform-storage-baseline.sql'), 'utf8'), 'storage-baseline')
      }
    }
  }

  function keys() {
    const output = run(cli, ['status', '--workdir', workdir, '--output', 'env'], { label: 'stack-status' })
    const value = (key) => {
      const line = output.split('\n').find((entry) => entry.startsWith(`${key}=`))
      if (!line) throw new Error(`${key.toLowerCase()}-unavailable`)
      const raw = line.slice(key.length + 1)
      return raw.startsWith('"') ? JSON.parse(raw) : raw
    }
    return { anonKey: value('ANON_KEY'), serviceRoleKey: value('SERVICE_ROLE_KEY') }
  }

  function stop() {
    if (workdir && existsSync(workdir)) {
      run(cli, ['stop', '--workdir', workdir, '--project-id', projectId, '--no-backup'], { label: 'stack-stop' })
      if (!fixedWorkdir) rmSync(workdir, { recursive: true, force: true })
    }
    if (!fixedWorkdir) workdir = ''
    if (containerExists()) throw new Error('stack-cleanup-failed')
  }

  return {
    projectId,
    apiUrl: `http://127.0.0.1:${port(1)}`,
    dbPort: port(2),
    mailboxUrl: `http://127.0.0.1:${port(4)}`,
    get workdir() { return workdir },
    run, psql, adminSql, start, migrate, keys, stop, containerExists,
  }
}
