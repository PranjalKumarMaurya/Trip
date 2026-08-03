import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { collectTrustedOperationPlanEvidence } from './run-trusted-operation-plan-evidence.mjs'
import { validateImmutableEvidenceManifest } from '../../evidence/write-ir-008-evidence-manifest.mjs'

const repositoryRoot = fileURLToPath(new URL('../../..', import.meta.url))
const artifactRoot = resolve(repositoryRoot, 'artifacts/ir-008')

const evidence = collectTrustedOperationPlanEvidence()
let manifestValidated = 0
if (existsSync(artifactRoot)) {
  for (const entry of readdirSync(artifactRoot, { withFileTypes: true })) {
    if (entry.isSymbolicLink() || !entry.isDirectory()) throw new Error('unsafe-ir008-artifact-entry')
    const runDirectory = resolve(artifactRoot, entry.name)
    const manifestPath = resolve(runDirectory, 'final-manifest.json')
    if (!manifestPath.startsWith(`${runDirectory}/`) || !existsSync(manifestPath)) {
      throw new Error('missing-ir008-artifact-manifest')
    }
    validateImmutableEvidenceManifest({
      runDirectory,
      manifest: JSON.parse(readFileSync(manifestPath, 'utf8')),
    })
    manifestValidated += 1
  }
}

process.stdout.write(`${JSON.stringify({
  capability: 'ir-008-cleanup',
  result: 'passed',
  databaseOrStackStarted: false,
  physicalTrustedOperationsImplemented: evidence.physicalTrustedOperationsImplemented,
  manifestValidated,
})}\n`)
