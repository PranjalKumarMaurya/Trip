import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const matrixPath = fileURLToPath(new URL('./operation-contract.matrix.json', import.meta.url))

const expectedOwners = Object.freeze([
  ['TOP-001', 'bootstrap_group', 'IR-003'],
  ['TOP-002', 'create_invitation', 'IR-005'],
  ['TOP-003', 'accept_invitation', 'IR-005'],
  ['TOP-004', 'change_member_role', 'IR-005'],
  ['TOP-005', 'transfer_ownership', 'IR-005'],
  ['TOP-006', 'deactivate_membership', 'IR-005'],
  ['TOP-007', 'set_group_archive_state', 'IR-005'],
  ['TOP-008', 'claim_legacy_participant', 'IR-006'],
  ['TOP-009', 'commit_expense', 'IR-014'],
  ['TOP-010', 'record_settlement', 'IR-014'],
  ['TOP-011', 'change_sensitive_configuration', 'IR-015'],
  ['TOP-012', 'ingest_and_reconcile_document', 'IR-013, consuming IR-009'],
])
const forbiddenActorFields = new Set([
  'actor',
  'auth_user_id',
  'profile_id',
  'actor_profile_id',
  'actor_role',
  'actor_owner',
  'recorder_id',
  'uploader_id',
])

export function loadOperationContractMatrix() {
  return JSON.parse(readFileSync(matrixPath, 'utf8'))
}

export function validateOperationContractMatrix(matrix) {
  if (!matrix || matrix.schemaVersion !== 1 || matrix.capability !== 'ir-008-trusted-operation-contract') {
    throw new Error('invalid-ir008-operation-contract-matrix')
  }
  if (
    matrix.implementationState !== 'authorised-not-started' ||
    matrix.executionEnvironment !== 'static-only-no-docker-or-supabase-stack' ||
    matrix.evidenceRequirements?.physicalTrustedOperationsImplemented !== 0 ||
    matrix.evidenceRequirements?.migration010 !== 'absent' ||
    !/^[a-f0-9]{64}$/u.test(matrix.evidenceRequirements?.migrationTreeSha256 ?? '') ||
    matrix.evidenceRequirements?.genericProxy !== 'absent' ||
    matrix.evidenceRequirements?.browserServiceRole !== 'absent' ||
    !/^[a-f0-9]{64}$/u.test(matrix.evidenceRequirements?.knownUnresolvedParseDocumentSha256 ?? '') ||
    matrix.evidenceRequirements?.generatedTypeDrift !== 'none' ||
    !/^[a-f0-9]{64}$/u.test(matrix.evidenceRequirements?.applicationSourceTreeSha256 ?? '') ||
    matrix.evidenceRequirements?.applicationAuthority !== 'not-introduced' ||
    matrix.evidenceRequirements?.performance !== 'not-run-not-applicable' ||
    matrix.evidenceRequirements?.absentOperationExecution !== 'never-reported-successfully' ||
    matrix.immutableEvidence?.writeOnce !== true ||
    matrix.immutableEvidence?.secretSafe !== true ||
    matrix.immutableEvidence?.operationExecutionStatus !== 'not-implemented'
  ) {
    throw new Error('invalid-ir008-contract-state')
  }
  if (!Array.isArray(matrix.operations) || matrix.operations.length !== expectedOwners.length) {
    throw new Error('invalid-ir008-operation-inventory')
  }
  for (const [index, [id, operation, physicalOwner]] of expectedOwners.entries()) {
    const candidate = matrix.operations[index]
    if (
      !candidate || candidate.id !== id || candidate.operation !== operation ||
      candidate.physicalOwner !== physicalOwner ||
      candidate.logicalSignature !== `${operation}(${candidate.requestFields?.join(', ')})` ||
      !Array.isArray(candidate.requestFields) || candidate.requestFields.length === 0 ||
      candidate.requestFields.some((field) => forbiddenActorFields.has(field))
    ) {
      throw new Error(`invalid-ir008-operation-${id}`)
    }
  }
  const adversarial = new Set(matrix.adversarialRequirements)
  for (const requirement of ['replay', 'cross-Group substitution', 'inactive membership', 'archive state', 'stale authority', 'races']) {
    if (!adversarial.has(requirement)) throw new Error(`missing-ir008-adversarial-${requirement.replaceAll(' ', '-')}`)
  }
  return matrix
}

export function runOperationContractCases({ matrix = loadOperationContractMatrix() } = {}) {
  validateOperationContractMatrix(matrix)
  return matrix.operations.map(({ id, operation, physicalOwner }) => Object.freeze({
    caseId: `${id}-physical-operation-absence`,
    operation,
    physicalOwner,
    expected: 'not-implemented',
    actual: 'not-implemented',
    executionClaimed: false,
  }))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const results = runOperationContractCases()
  process.stdout.write(`${JSON.stringify({ capability: 'ir-008-operation-contract-cases', result: 'passed', results })}\n`)
}
