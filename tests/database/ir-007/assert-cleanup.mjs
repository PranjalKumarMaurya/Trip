import { assertIr007DockerAbsent } from './local-docker-cleanup.mjs'

try {
  const cleanup = assertIr007DockerAbsent()
  console.log(JSON.stringify({ capability: 'ir-007-local-cleanup', result: 'passed', attempts: cleanup.observedAtAttempt }))
} catch {
  console.error(JSON.stringify({ capability: 'ir-007-local-cleanup', result: 'failed-safely' }))
  process.exitCode = 1
}
