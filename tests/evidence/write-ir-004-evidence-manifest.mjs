import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const runId = process.env.IR004_EVIDENCE_RUN_ID
const root = resolve('artifacts/ir-004')
const requiredStages = ['clean-application', 'schema-validation', 'auth-profile-constraints', 'profile-privacy', 'session-browser', 'type-generation-pass-1', 'empty-target-rollback', 'clean-reapplication', 'type-generation-pass-2', 'type-comparison', 'typecheck-test-build', 'cleanup']

if (!runId || !/^ir004-[a-z0-9-]+$/i.test(runId)) throw new Error('refusing-invalid-ir004-evidence-run-id')
const directory = resolve(root, runId)
if (!directory.startsWith(`${root}/`) || !existsSync(directory) || lstatSync(directory).isSymbolicLink()) {
  throw new Error('refusing-missing-or-unsafe-ir004-evidence-run')
}

const entries = readdirSync(directory, { withFileTypes: true })
if (entries.some((entry) => !entry.isFile() || entry.isSymbolicLink())) throw new Error('refusing-unsafe-ir004-evidence-entry')
const names = entries.map((entry) => entry.name).sort()
if (names.includes('final-manifest.json')) throw new Error('refusing-overwrite-of-ir004-final-manifest')

for (const stage of requiredStages) {
  const path = resolve(directory, `${stage}.json`)
  if (!names.includes(`${stage}.json`)) throw new Error(`missing-ir004-evidence-stage-${stage}`)
  const record = JSON.parse(readFileSync(path, 'utf8'))
  if (record.runId !== runId || record.stage !== stage || record.result !== 'passed') throw new Error(`invalid-ir004-evidence-stage-${stage}`)
}

const artifacts = names.map((name) => {
  const path = resolve(directory, name)
  return {
    path: `artifacts/ir-004/${runId}/${name}`,
    bytes: statSync(path).size,
    sha256: createHash('sha256').update(readFileSync(path)).digest('hex'),
  }
})
const manifest = `${JSON.stringify({ schemaVersion: 1, ir: 'IR-004', runId, result: 'passed', environment: 'local-isolated', requiredStages, artifacts }, null, 2)}\n`
if (/postgres(?:ql)?:\/\/|password|token|secret|api[_-]?key|service[_-]?role|\/home\//i.test(manifest)) throw new Error('refusing-unsafe-ir004-manifest')
writeFileSync(resolve(directory, 'final-manifest.json'), manifest, 'utf8')
console.log(JSON.stringify({ capability: 'ir-004-evidence-manifest', result: 'passed', artifacts: artifacts.length }))
