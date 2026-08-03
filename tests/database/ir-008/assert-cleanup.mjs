import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { collectTrustedOperationPlanEvidence } from './run-trusted-operation-plan-evidence.mjs'

const repositoryRoot = fileURLToPath(new URL('../../..', import.meta.url))
const artifactRoot = resolve(repositoryRoot, 'artifacts/ir-008')

const evidence = collectTrustedOperationPlanEvidence()
if (existsSync(artifactRoot) && readdirSync(artifactRoot, { withFileTypes: true }).some((entry) => entry.isSymbolicLink())) {
  throw new Error('unsafe-ir008-artifact-symlink')
}

process.stdout.write(`${JSON.stringify({
  capability: 'ir-008-cleanup',
  result: 'passed',
  databaseOrStackStarted: false,
  physicalTrustedOperationsImplemented: evidence.physicalTrustedOperationsImplemented,
})}\n`)
