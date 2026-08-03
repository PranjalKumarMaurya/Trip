import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { assertSecretSafe, collectTrustedOperationPlanEvidence } from '../database/ir-008/run-trusted-operation-plan-evidence.mjs'

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url))
const runId = process.env.IR008_EVIDENCE_RUN_ID
const artifactRoot = resolve(repositoryRoot, 'artifacts/ir-008')

if (!runId || !/^ir008-[a-z0-9-]+$/iu.test(runId)) throw new Error('invalid-ir008-evidence-run-id')
const runDirectory = resolve(artifactRoot, runId)
if (!runDirectory.startsWith(`${artifactRoot}/`) || existsSync(runDirectory)) {
  throw new Error('unsafe-or-existing-ir008-evidence-run')
}

const evidence = collectTrustedOperationPlanEvidence()
const manifest = Object.freeze({
  schemaVersion: 1,
  ir: 'IR-008',
  runId,
  result: 'contract-verified',
  operationExecution: 'not-implemented',
  performance: 'not-run-not-applicable',
  evidence,
  evidenceControls: ['write-once-manifest', 'secret-safety-scan', 'no-stack-required'],
})
const serialized = `${JSON.stringify(manifest, null, 2)}\n`
assertSecretSafe(serialized)

mkdirSync(runDirectory, { recursive: true, mode: 0o700 })
const manifestPath = resolve(runDirectory, 'final-manifest.json')
if (!manifestPath.startsWith(`${runDirectory}/`)) throw new Error('unsafe-ir008-evidence-path')
writeFileSync(manifestPath, serialized, { encoding: 'utf8', flag: 'wx', mode: 0o444 })
chmodSync(manifestPath, 0o444)
process.stdout.write(`${JSON.stringify({ capability: 'ir-008-evidence-manifest', result: 'contract-verified', operationExecution: 'not-implemented' })}\n`)
