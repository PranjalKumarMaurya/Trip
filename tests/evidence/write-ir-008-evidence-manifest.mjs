import { createHash } from 'node:crypto'
import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  assertSecretSafe,
  buildTrustedOperationEvidenceStages,
  collectTrustedOperationPlanEvidence,
  requiredEvidenceStages,
} from '../database/ir-008/run-trusted-operation-plan-evidence.mjs'

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url))
const artifactRoot = resolve(repositoryRoot, 'artifacts/ir-008')
const evidenceFileStages = requiredEvidenceStages.filter((stage) => stage !== 'final-manifest')

function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function assert(boolean, message) {
  if (!boolean) throw new Error(message)
}

function assertArtifactFileName(fileName) {
  assert(/^[a-z0-9-]+\.json$/u.test(fileName), 'unsafe-ir008-evidence-file-name')
  return fileName
}

function immutableWrite(path, serialized) {
  assertSecretSafe(serialized)
  writeFileSync(path, serialized, { encoding: 'utf8', flag: 'wx', mode: 0o444 })
  chmodSync(path, 0o444)
}

export function buildImmutableEvidenceManifest({ runId, evidence, stageRecords }) {
  const manifestPayload = {
    schemaVersion: 2,
    ir: 'IR-008',
    runId,
    result: 'contract-verified',
    operationExecution: 'not-implemented',
    performance: 'not-run-not-applicable',
    requiredStages: requiredEvidenceStages,
    stages: stageRecords,
    finalManifest: {
      stage: 'final-manifest',
      integrity: 'sha256-canonical-manifest-payload',
      result: 'contract-verified',
    },
    evidence,
    evidenceControls: ['write-once-artifacts', 'sha256-per-stage', 'secret-safety-scan', 'no-stack-required'],
  }
  return {
    ...manifestPayload,
    finalManifestIntegrity: {
      algorithm: 'sha256',
      canonicalPayloadSha256: sha256(serialize(manifestPayload)),
    },
  }
}

export function validateImmutableEvidenceManifest({ runDirectory, manifest }) {
  assert(manifest?.schemaVersion === 2 && manifest.ir === 'IR-008', 'invalid-ir008-evidence-manifest')
  assert(Array.isArray(manifest.requiredStages), 'invalid-ir008-required-stages')
  assert(manifest.requiredStages.length === requiredEvidenceStages.length, 'invalid-ir008-required-stage-count')
  assert(manifest.requiredStages.every((stage, index) => stage === requiredEvidenceStages[index]), 'invalid-ir008-required-stage-order')
  assert(Array.isArray(manifest.stages) && manifest.stages.length === evidenceFileStages.length, 'invalid-ir008-stage-record-count')
  assert(!Object.hasOwn(manifest, 'latest'), 'mutable-ir008-latest-pointer')
  const observedStages = new Set()
  for (const record of manifest.stages) {
    assert(evidenceFileStages.includes(record.stage) && !observedStages.has(record.stage), 'invalid-ir008-stage-record')
    observedStages.add(record.stage)
    assertArtifactFileName(record.file)
    assert(/^[a-f0-9]{64}$/u.test(record.sha256), 'invalid-ir008-stage-sha256')
    const artifactPath = resolve(runDirectory, record.file)
    assert(artifactPath.startsWith(`${runDirectory}/`), 'unsafe-ir008-evidence-artifact-path')
    assert(existsSync(artifactPath) && !lstatSync(artifactPath).isSymbolicLink(), 'missing-or-unsafe-ir008-evidence-artifact')
    const serialized = readFileSync(artifactPath, 'utf8')
    assertSecretSafe(serialized)
    assert(sha256(serialized) === record.sha256, `changed-ir008-evidence-artifact-${record.stage}`)
  }
  assert(observedStages.size === evidenceFileStages.length, 'missing-ir008-evidence-stage')
  const expectedFiles = new Set([...manifest.stages.map(({ file }) => file), 'final-manifest.json'])
  const artifactEntries = readdirSync(runDirectory, { withFileTypes: true })
  assert(
    artifactEntries.length === expectedFiles.size && artifactEntries.every((entry) => entry.isFile() && expectedFiles.has(entry.name)),
    'unexpected-or-unsafe-ir008-evidence-artifact',
  )
  assert(manifest.finalManifest?.stage === 'final-manifest', 'missing-ir008-final-manifest-stage')
  assert(manifest.finalManifestIntegrity?.algorithm === 'sha256', 'invalid-ir008-final-manifest-integrity')
  const { finalManifestIntegrity, ...manifestPayload } = manifest
  assert(
    sha256(serialize(manifestPayload)) === finalManifestIntegrity.canonicalPayloadSha256,
    'changed-ir008-final-manifest',
  )
  assertSecretSafe(serialize(manifest))
  return { referencedFileCount: manifest.stages.length, requiredStageCount: manifest.requiredStages.length }
}

export function writeImmutableEvidenceRun(runId) {
  if (!runId || !/^ir008-[a-z0-9-]+$/iu.test(runId)) throw new Error('invalid-ir008-evidence-run-id')
  const runDirectory = resolve(artifactRoot, runId)
  if (!runDirectory.startsWith(`${artifactRoot}/`) || existsSync(runDirectory)) {
    throw new Error('unsafe-or-existing-ir008-evidence-run')
  }

  const evidence = collectTrustedOperationPlanEvidence()
  const stagePayloads = buildTrustedOperationEvidenceStages(evidence)
  mkdirSync(runDirectory, { recursive: true, mode: 0o700 })
  const stageRecords = evidenceFileStages.map((stage) => {
    const file = assertArtifactFileName(`${stage}.json`)
    const serialized = serialize(stagePayloads[stage])
    immutableWrite(resolve(runDirectory, file), serialized)
    return Object.freeze({ stage, file, sha256: sha256(serialized) })
  })
  const manifest = buildImmutableEvidenceManifest({ runId, evidence, stageRecords })
  const manifestPath = resolve(runDirectory, 'final-manifest.json')
  if (!manifestPath.startsWith(`${runDirectory}/`)) throw new Error('unsafe-ir008-evidence-path')
  immutableWrite(manifestPath, serialize(manifest))
  const validation = validateImmutableEvidenceManifest({ runDirectory, manifest })
  return Object.freeze({
    capability: 'ir-008-evidence-manifest',
    result: 'contract-verified',
    operationExecution: 'not-implemented',
    runId,
    ...validation,
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(writeImmutableEvidenceRun(process.env.IR008_EVIDENCE_RUN_ID))}\n`)
}
