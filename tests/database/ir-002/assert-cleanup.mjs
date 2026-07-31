import { assertIr002DockerAbsent } from './local-docker-cleanup.mjs'

try {
  const cleanup = assertIr002DockerAbsent()
  console.log(JSON.stringify({ capability: 'ir-002-local-cleanup', result: 'passed', attempts: cleanup.attempts }))
} catch {
  console.error(JSON.stringify({ capability: 'ir-002-local-cleanup', result: 'failed-safely' }))
  process.exitCode = 1
}
