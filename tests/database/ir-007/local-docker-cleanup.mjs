import { spawnSync } from 'node:child_process'

export const IR007_LOCAL_PROJECT_ID = 'bachelor-trip-app-ir007'
export const IR007_LOCAL_PROJECT_NETWORK = `supabase_network_${IR007_LOCAL_PROJECT_ID}`
export const IR007_LOCAL_PROJECT_VOLUME = `supabase_db_${IR007_LOCAL_PROJECT_ID}`

const containerName = new RegExp(`^supabase_[a-z0-9_]+_${IR007_LOCAL_PROJECT_ID}$`, 'i')

function dockerNames(args) {
  const result = spawnSync('docker', args, { encoding: 'utf8' })
  if (result.error || result.status !== 0) {
    throw new Error('ir007-local-docker-inspection-failed')
  }
  return result.stdout.trim().split('\n').filter(Boolean)
}

export function readIr007DockerSnapshot() {
  return {
    containers: dockerNames(['ps', '--all', '--format', '{{.Names}}']).filter((name) => containerName.test(name)),
    networks: dockerNames(['network', 'ls', '--format', '{{.Name}}']).filter(
      (name) => name === IR007_LOCAL_PROJECT_NETWORK,
    ),
    volumes: dockerNames(['volume', 'ls', '--format', '{{.Name}}']).filter(
      (name) => name === IR007_LOCAL_PROJECT_VOLUME,
    ),
  }
}

export function assertIr007DockerSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    throw new Error('refusing-invalid-ir007-local-docker-snapshot')
  }
  for (const key of ['containers', 'networks', 'volumes']) {
    if (!Array.isArray(snapshot[key]) || snapshot[key].some((entry) => typeof entry !== 'string')) {
      throw new Error('refusing-invalid-ir007-local-docker-snapshot')
    }
  }
  if (
    snapshot.containers.some((name) => !containerName.test(name)) ||
    snapshot.networks.some((name) => name !== IR007_LOCAL_PROJECT_NETWORK) ||
    snapshot.volumes.some((name) => name !== IR007_LOCAL_PROJECT_VOLUME)
  ) {
    throw new Error('refusing-nonexact-ir007-local-docker-snapshot')
  }
  return snapshot
}

export function assertIr007DockerEmptyBeforeStart() {
  const snapshot = assertIr007DockerSnapshot(readIr007DockerSnapshot())
  if (snapshot.containers.length || snapshot.networks.length || snapshot.volumes.length) {
    throw new Error('refusing-preexisting-ir007-local-resources')
  }
}

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds)
}

export function assertIr007DockerAbsent({ attempts = 12, intervalMilliseconds = 500 } = {}) {
  let consecutiveAbsent = 0
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const snapshot = assertIr007DockerSnapshot(readIr007DockerSnapshot())
    if (!snapshot.containers.length && !snapshot.networks.length && !snapshot.volumes.length) {
      consecutiveAbsent += 1
      if (consecutiveAbsent === 2) return { attempts: attempt, observedAtAttempt: attempt, result: 'absent' }
    } else {
      consecutiveAbsent = 0
    }
    if (attempt < attempts) sleep(intervalMilliseconds)
  }
  throw new Error('ir007-exact-local-docker-cleanup-timeout')
}
