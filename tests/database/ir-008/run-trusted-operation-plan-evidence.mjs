import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadOperationContractMatrix, runOperationContractCases } from './cases/run-operation-contract-cases.mjs'

const repositoryRoot = fileURLToPath(new URL('../../..', import.meta.url))
const operationPattern = /\b(?:bootstrap_group|create_invitation|accept_invitation|change_member_role|transfer_ownership|deactivate_membership|set_group_archive_state|claim_legacy_participant|commit_expense|record_settlement|change_sensitive_configuration|ingest_and_reconcile_document)\b/iu
const proxyPattern = /\bexecute_operation\s*\(/iu
const browserServiceRolePattern = /(?:SUPABASE_SERVICE_ROLE_KEY|service[_ -]?role)/iu
const unsafeEvidencePattern = /(?:postgres(?:ql)?:\/\/|\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\b|(?:password|token|secret|api[_-]?key|service[_-]?role)["']?\s*[:=]|(?:^|[^A-Za-z])(?:\/home\/|\/Users\/|[A-Za-z]:\\))/iu

export const requiredEvidenceStages = Object.freeze([
  'contract-inventory',
  'owner-mapping',
  'logical-signatures',
  'actor-authority-boundary',
  'idempotency-and-transaction-contract',
  'adversarial-obligations',
  'zero-physical-implementation',
  'repository-drift',
  'privileged-path-boundary',
  'secret-safety',
  'cleanup',
  'final-manifest',
])

function readText(relativePath) {
  return readFileSync(resolve(repositoryRoot, relativePath), 'utf8')
}

function listFiles(relativeDirectory) {
  const directory = resolve(repositoryRoot, relativeDirectory)
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = `${relativeDirectory}/${entry.name}`
    return entry.isDirectory() ? listFiles(relativePath) : [relativePath]
  })
}

function sha256(relativePath) {
  return createHash('sha256').update(readText(relativePath)).digest('hex')
}

function treeSha256(relativeDirectory) {
  const paths = listFiles(relativeDirectory).sort()
  const entries = paths.map((path) => `${path}\0${sha256(path)}`).join('\n')
  return createHash('sha256').update(entries).digest('hex')
}

function assert(boolean, message) {
  if (!boolean) throw new Error(message)
}

export function assertSecretSafe(value) {
  assert(typeof value === 'string' && !unsafeEvidencePattern.test(value), 'unsafe-ir008-evidence')
}

export function collectTrustedOperationPlanEvidence() {
  const matrix = loadOperationContractMatrix()
  const operationResults = runOperationContractCases({ matrix })
  const migrationFiles = listFiles('supabase/migrations').map((path) => path.split('/').at(-1))
  assert(!migrationFiles.some((name) => /^010_/u.test(name)), 'ir008-migration-010-present')
  assert(migrationFiles.every((name) => !operationPattern.test(readText(`supabase/migrations/${name}`))), 'ir008-physical-operation-in-migration')
  assert(treeSha256('supabase/migrations') === matrix.evidenceRequirements.migrationTreeSha256, 'ir008-migration-tree-modified')
  const expectedMigrationFiles = matrix.evidenceRequirements.migrationFileSha256
  assert(Object.keys(expectedMigrationFiles).length === migrationFiles.length, 'ir008-migration-file-count-modified')
  for (const migrationFile of migrationFiles) {
    assert(sha256(`supabase/migrations/${migrationFile}`) === expectedMigrationFiles[migrationFile], `ir008-migration-file-modified-${migrationFile}`)
  }

  const functionFiles = listFiles('supabase/functions')
  assert(functionFiles.length === 1 && functionFiles[0] === 'supabase/functions/parse-document/index.ts', 'ir008-unexpected-function-path')
  const knownLegacyFunction = readText(functionFiles[0])
  assert(sha256(functionFiles[0]) === matrix.evidenceRequirements.knownUnresolvedParseDocumentSha256, 'ir008-known-legacy-boundary-modified')
  assert(browserServiceRolePattern.test(knownLegacyFunction), 'ir008-known-legacy-boundary-missing')
  assert(!operationPattern.test(knownLegacyFunction) && !proxyPattern.test(knownLegacyFunction), 'ir008-physical-operation-or-proxy-in-function')

  const applicationFiles = listFiles('src')
  for (const path of applicationFiles) {
    const source = readText(path)
    assert(!operationPattern.test(source), 'ir008-application-operation-introduced')
    assert(!proxyPattern.test(source), 'ir008-application-generic-proxy-introduced')
    assert(!browserServiceRolePattern.test(source), 'ir008-browser-service-role-introduced')
  }
  assert(treeSha256('src') === matrix.evidenceRequirements.applicationSourceTreeSha256, 'ir008-application-source-modified')

  const generatedTypeSha256 = sha256('src/lib/database.types.ts')
  assert(generatedTypeSha256 === matrix.evidenceRequirements.generatedTypeSha256, 'ir008-generated-type-drift')

  const authorisation = readText('docs/implementation-execution/authorisations/IR-008-authorisation.md')
  const packet = readText('docs/implementation-execution/packets/IR-008-trusted-operations.md')
  const register = readText('docs/implementation-execution/trusted-operation-register.md')
  for (const requiredText of [
    'IR-008 owns no DBM unit',
    'No `010_*` migration is reserved',
    'No operation may accept an actor parameter',
    'No generic `execute_operation(name, payload)` proxy',
    'IR-008 must not modify it',
    'IR-008: Implemented, not Verified',
  ]) {
    assert(authorisation.includes(requiredText) || packet.includes(requiredText) || register.includes(requiredText), 'ir008-document-contract-missing')
  }

  const result = Object.freeze({
    schemaVersion: 1,
    capability: 'ir-008-trusted-operation-plan',
    result: 'contract-verified',
    implementationState: matrix.implementationState,
    physicalTrustedOperationsImplemented: matrix.evidenceRequirements.physicalTrustedOperationsImplemented,
    migration010: matrix.evidenceRequirements.migration010,
    migrationDrift: 'none',
    migrationFileSha256: expectedMigrationFiles,
    genericProxy: matrix.evidenceRequirements.genericProxy,
    browserElevatedCredential: matrix.evidenceRequirements.browserServiceRole,
    generatedTypeDrift: matrix.evidenceRequirements.generatedTypeDrift,
    applicationSourceDrift: 'none',
    applicationAuthority: matrix.evidenceRequirements.applicationAuthority,
    performance: matrix.evidenceRequirements.performance,
    operationResults,
    immutableEvidence: matrix.immutableEvidence,
    adversarialRequirements: matrix.adversarialRequirements,
  })
  assertSecretSafe(JSON.stringify(result))
  return result
}

export function buildTrustedOperationEvidenceStages(evidence = collectTrustedOperationPlanEvidence()) {
  const matrix = loadOperationContractMatrix()
  const stages = Object.freeze({
    'contract-inventory': Object.freeze({
      topCount: matrix.operations.length,
      operations: matrix.operations.map(({ id, operation }) => ({ id, operation })),
      operationExecution: 'not-implemented',
    }),
    'owner-mapping': Object.freeze({
      owners: matrix.operations.map(({ id, physicalOwner }) => ({ id, physicalOwner })),
      exactlyOneOwnerPerTop: true,
    }),
    'logical-signatures': Object.freeze({
      signatures: matrix.operations.map(({ id, logicalSignature, requestFields }) => ({ id, logicalSignature, requestFields })),
      actorParameter: 'forbidden',
    }),
    'actor-authority-boundary': Object.freeze({
      derivation: matrix.actorDerivation,
      requestId: 'correlation-and-idempotency-only',
      groupAndTargetIds: 'selectors-not-authority',
      clientSuppliedAuthority: 'forbidden',
    }),
    'idempotency-and-transaction-contract': Object.freeze({
      binding: ['operation', 'validated actor', 'relevant Group', 'request ID', 'immutable normalized request fingerprint'],
      sameKeySameRequest: 'return-original-safe-result',
      sameKeyChangedPayload: 'safe-conflict',
      unknownCompletionRetry: 'converges-safely',
      transaction: 'one-authoritative-all-or-nothing-transaction',
    }),
    'adversarial-obligations': Object.freeze({
      obligationCount: matrix.adversarialRequirements.length,
      obligations: matrix.adversarialRequirements,
      status: 'future-owner-obligations-only',
    }),
    'zero-physical-implementation': Object.freeze({
      physicalTrustedOperationsImplemented: evidence.physicalTrustedOperationsImplemented,
      operationResults: evidence.operationResults,
      migration010: evidence.migration010,
      performance: evidence.performance,
    }),
    'repository-drift': Object.freeze({
      migrationDrift: evidence.migrationDrift,
      migrationFileSha256: evidence.migrationFileSha256,
      generatedTypeDrift: evidence.generatedTypeDrift,
      applicationSourceDrift: evidence.applicationSourceDrift,
      applicationAuthority: evidence.applicationAuthority,
    }),
    'privileged-path-boundary': Object.freeze({
      genericProxy: evidence.genericProxy,
      browserElevatedCredential: evidence.browserElevatedCredential,
      unresolvedLegacyPath: 'parse-document remains owned by IR-013 and IR-009',
    }),
    'secret-safety': Object.freeze({
      secretSafe: evidence.immutableEvidence.secretSafe,
      prohibitedContent: matrix.auditProhibitions,
      localHomePath: 'forbidden',
    }),
    cleanup: Object.freeze({
      databaseOrStackStarted: false,
      physicalTrustedOperationsImplemented: evidence.physicalTrustedOperationsImplemented,
      result: 'passed',
    }),
  })
  for (const stage of Object.values(stages)) assertSecretSafe(JSON.stringify(stage))
  return stages
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(collectTrustedOperationPlanEvidence())}\n`)
}
