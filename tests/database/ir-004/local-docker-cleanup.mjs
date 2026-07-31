import { spawnSync } from 'node:child_process'

export const IR004_LOCAL_PROJECT_ID = 'bachelor-trip-app-ir004'
const network = `supabase_network_${IR004_LOCAL_PROJECT_ID}`
const volume = `supabase_db_${IR004_LOCAL_PROJECT_ID}`
const containerName = new RegExp(`^supabase_[a-z0-9_]+_${IR004_LOCAL_PROJECT_ID}$`, 'i')

function names(args) {
  const result = spawnSync('docker', args, { encoding: 'utf8' })
  if (result.error || result.status !== 0) throw new Error('ir004-local-docker-inspection-failed')
  return result.stdout.trim().split('\n').filter(Boolean)
}

function snapshot() {
  return {
    containers: names(['ps', '--all', '--format', '{{.Names}}']).filter((name) => containerName.test(name)),
    networks: names(['network', 'ls', '--format', '{{.Name}}']).filter((name) => name === network),
    volumes: names(['volume', 'ls', '--format', '{{.Name}}']).filter((name) => name === volume),
  }
}

function pause(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds)
}

export function assertIr004DockerAbsent() {
  let consecutive = 0
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    const current = snapshot()
    if (!current.containers.length && !current.networks.length && !current.volumes.length) {
      consecutive += 1
      if (consecutive === 2) return { attempts: attempt }
    } else {
      consecutive = 0
    }
    if (attempt < 12) pause(500)
  }
  throw new Error('ir004-local-docker-cleanup-timeout')
}

export function assertIr004DockerEmptyBeforeStart() {
  const current = snapshot()
  if (current.containers.length || current.networks.length || current.volumes.length) {
    throw new Error('refusing-preexisting-ir004-local-resources')
  }
}
