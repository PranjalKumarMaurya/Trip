import { createHash } from 'node:crypto'
import { chmodSync, existsSync, lstatSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url))
const artifactRoot = resolve(repositoryRoot, 'artifacts/ir-007')
const runId = process.env.IR007_EVIDENCE_RUN_ID
const requiredStages = Object.freeze([
  'clean-application',
  'schema-policy-function-grant-catalogue',
  'adversarial-matrix',
  'performance-probes',
  'type-generation-pass-1',
  'empty-target-rollback',
  'clean-reapplication',
  'type-generation-pass-2',
  'type-comparison',
  'cleanup',
  'secret-safety',
])
const requiredFileNames = Object.freeze([
  ...requiredStages.map((stage) => `${stage}.json`),
  'database.types.pass-1.ts',
])
const stageKeys = Object.freeze([
  'schemaVersion',
  'capability',
  'runId',
  'stage',
  'result',
  'environment',
  'projectId',
  'details',
])
const unsafeEvidencePatterns = Object.freeze([
  /postgres(?:ql)?:\/\//i,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\b/,
  /\b(?:password|token|secret|api[_-]?key|service[_-]?role)["']?\s*[:=]/i,
  /(?:^|[^A-Za-z])(?:\/home\/|\/Users\/|[A-Za-z]:\\)/,
])

if (!runId || !/^ir007-[a-z0-9-]+$/i.test(runId)) {
  throw new Error('refusing-invalid-ir007-evidence-run-id')
}

const runDirectory = resolve(artifactRoot, runId)
if (!runDirectory.startsWith(`${artifactRoot}/`) || !existsSync(runDirectory)) {
  throw new Error('refusing-missing-ir007-evidence-run')
}
const directoryStats = lstatSync(runDirectory)
if (!directoryStats.isDirectory() || directoryStats.isSymbolicLink()) {
  throw new Error('refusing-unsafe-ir007-evidence-directory')
}

function assertSafeText(value) {
  if (typeof value !== 'string' || unsafeEvidencePatterns.some((pattern) => pattern.test(value))) {
    throw new Error('refusing-unsafe-ir007-evidence')
  }
}

function assertExactKeys(value, expected, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`refusing-invalid-ir007-${label}`)
  }
  const actual = Object.keys(value).sort()
  const sortedExpected = [...expected].sort()
  if (actual.length !== sortedExpected.length || actual.some((key, index) => key !== sortedExpected[index])) {
    throw new Error(`refusing-invalid-ir007-${label}`)
  }
}

function assertStageRecord(record, stage) {
  assertExactKeys(record, stageKeys, 'stage-record-shape')
  if (
    record.schemaVersion !== 1 ||
    record.capability !== 'ir-007-rls-ownership' ||
    record.runId !== runId ||
    record.stage !== stage ||
    record.result !== 'passed' ||
    record.environment !== 'local-isolated' ||
    record.projectId !== 'bachelor-trip-app-ir007' ||
    !record.details || typeof record.details !== 'object' || Array.isArray(record.details)
  ) {
    throw new Error(`refusing-invalid-ir007-stage-${stage}`)
  }
}

function checksum(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

const entries = readdirSync(runDirectory, { withFileTypes: true })
if (entries.some((entry) => !entry.isFile() || entry.isSymbolicLink())) {
  throw new Error('refusing-unsafe-ir007-evidence-entry')
}
const fileNames = entries.map((entry) => entry.name).sort()
const expectedNames = [...requiredFileNames].sort()
if (
  fileNames.length !== expectedNames.length ||
  fileNames.some((name, index) => name !== expectedNames[index])
) {
  throw new Error('refusing-unexpected-ir007-evidence-artifact-set')
}

for (const stage of requiredStages) {
  const path = resolve(runDirectory, `${stage}.json`)
  const text = readFileSync(path, 'utf8')
  assertSafeText(text)
  let record
  try {
    record = JSON.parse(text)
  } catch {
    throw new Error(`refusing-invalid-ir007-stage-json-${stage}`)
  }
  assertStageRecord(record, stage)
}

const generatedTypesPath = resolve(runDirectory, 'database.types.pass-1.ts')
assertSafeText(readFileSync(generatedTypesPath, 'utf8'))

const artifacts = expectedNames.map((name) => {
  const path = resolve(runDirectory, name)
  return {
    path: `artifacts/ir-007/${runId}/${name}`,
    bytes: statSync(path).size,
    sha256: checksum(path),
  }
})
const manifest = {
  schemaVersion: 1,
  ir: 'IR-007',
  runId,
  result: 'passed',
  environment: 'local-isolated',
  projectId: 'bachelor-trip-app-ir007',
  requiredStages,
  evidenceControls: Object.freeze([
    'write-once-stage-records',
    'loopback-only-endpoints',
    'exact-docker-project-cleanup',
    'secret-safety-scan',
  ]),
  artifacts,
}
const serialized = `${JSON.stringify(manifest, null, 2)}\n`
assertSafeText(serialized)
const manifestPath = resolve(runDirectory, 'final-manifest.json')
if (!manifestPath.startsWith(`${runDirectory}/`) || existsSync(manifestPath)) {
  throw new Error('refusing-overwrite-of-ir007-final-manifest')
}
writeFileSync(manifestPath, serialized, { encoding: 'utf8', flag: 'wx', mode: 0o444 })
chmodSync(manifestPath, 0o444)
console.log(JSON.stringify({ capability: 'ir-007-evidence-manifest', result: 'passed', artifacts: artifacts.length }))
