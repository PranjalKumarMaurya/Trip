import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url))
const artifactRoot = resolve(repositoryRoot, 'artifacts/ir-002')
const runId = process.env.IR002_EVIDENCE_RUN_ID
const requiredStages = [
  'clean-application', 'schema-validation', 'constraint-tests', 'two-group-structural-tests',
  'empty-target-rollback', 'clean-reapplication', 'type-generation-pass-1',
  'type-generation-pass-2', 'type-comparison', 'typecheck-test-build', 'cleanup',
]

if (!runId || !/^ir002-[a-z0-9-]+$/i.test(runId)) throw new Error('refusing-invalid-ir002-evidence-run-id')
const runDirectory = resolve(artifactRoot, runId)
if (!runDirectory.startsWith(`${artifactRoot}/`) || !existsSync(runDirectory)) {
  throw new Error('refusing-missing-ir002-evidence-run')
}
if (!lstatSync(runDirectory).isDirectory() || lstatSync(runDirectory).isSymbolicLink()) {
  throw new Error('refusing-unsafe-ir002-evidence-directory')
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

const files = readdirSync(runDirectory, { withFileTypes: true })
if (files.some((entry) => !entry.isFile() || entry.isSymbolicLink())) throw new Error('refusing-unsafe-ir002-evidence-entry')
const fileNames = files.map((entry) => entry.name).sort()
for (const stage of requiredStages) {
  const name = `${stage}.json`
  if (!fileNames.includes(name)) throw new Error(`missing-ir002-evidence-stage-${stage}`)
  const record = JSON.parse(readFileSync(resolve(runDirectory, name), 'utf8'))
  if (record.stage !== stage || record.result !== 'passed' || record.runId !== runId) {
    throw new Error(`invalid-ir002-evidence-stage-${stage}`)
  }
}
if (!fileNames.includes('database.types.pass-1.ts')) throw new Error('missing-ir002-type-pass-one-artifact')
if (fileNames.includes('final-manifest.json')) throw new Error('refusing-overwrite-of-ir002-final-manifest')

const artifacts = fileNames.map((name) => {
  const path = resolve(runDirectory, name)
  return { path: `artifacts/ir-002/${runId}/${name}`, bytes: statSync(path).size, sha256: sha256(path) }
})
const manifest = {
  schemaVersion: 1,
  ir: 'IR-002',
  runId,
  result: 'passed',
  environment: 'local-isolated',
  requiredStages,
  artifacts,
}
const serialized = `${JSON.stringify(manifest, null, 2)}\n`
if (/postgres(?:ql)?:\/\/|password|token|secret|api[_-]?key|service[_-]?role|\/home\//i.test(serialized)) {
  throw new Error('refusing-unsafe-ir002-manifest')
}
writeFileSync(resolve(runDirectory, 'final-manifest.json'), serialized, 'utf8')
console.log(JSON.stringify({ capability: 'ir-002-evidence-manifest', result: 'passed', artifacts: artifacts.length }))
