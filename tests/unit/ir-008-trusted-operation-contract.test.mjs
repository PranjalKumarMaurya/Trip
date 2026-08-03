import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  collectTrustedOperationPlanEvidence,
} from '../database/ir-008/run-trusted-operation-plan-evidence.mjs'
import {
  loadOperationContractMatrix,
  runOperationContractCases,
  validateOperationContractMatrix,
} from '../database/ir-008/cases/run-operation-contract-cases.mjs'

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url))
const readText = (relativePath) => readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8')
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

test('IR-008 freezes the exact TOP inventory, owner map, and actor-free logical signatures', () => {
  const matrix = validateOperationContractMatrix(loadOperationContractMatrix())
  assert.deepEqual(
    matrix.operations.map(({ id, operation, physicalOwner }) => [id, operation, physicalOwner]),
    expectedOwners,
  )
  for (const operation of matrix.operations) {
    assert.equal(operation.logicalSignature, `${operation.operation}(${operation.requestFields.join(', ')})`)
    assert.ok(!operation.requestFields.some((field) => /^(?:actor|auth_user_id|profile_id|actor_profile_id|actor_role|actor_owner|recorder_id|uploader_id)$/u.test(field)))
  }

  const authorisation = readText('docs/implementation-execution/authorisations/IR-008-authorisation.md')
  const register = readText('docs/implementation-execution/trusted-operation-register.md')
  for (const [id, operation, owner] of expectedOwners) {
    assert.match(authorisation, new RegExp(id + '\\s+\\| `' + operation + '\\(', 'u'))
    assert.match(register, new RegExp(id + '\\s+\\| `' + operation + '\\(', 'u'))
    assert.match(authorisation, new RegExp(`Physical owner: ${owner.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}`, 'u'))
  }
  assert.match(authorisation, /No operation may accept an actor parameter\./u)
  assert.match(register, /Request ID is only[\s\S]*?not authority\./u)
})

test('IR-008 contract forbids authority expansion and records the unresolved document boundary', () => {
  const authorisation = readText('docs/implementation-execution/authorisations/IR-008-authorisation.md')
  const packet = readText('docs/implementation-execution/packets/IR-008-trusted-operations.md')
  const register = readText('docs/implementation-execution/trusted-operation-register.md')
  const combined = `${authorisation}\n${packet}\n${register}`
  for (const requiredText of [
    'IR-008 owns no DBM unit',
    'No `010_*` migration is reserved',
    'No generic `execute_operation(name, payload)` proxy',
    'browser service-role credential',
    'broad service-role database proxy',
    'parse-document',
    'client-controlled provenance',
    'uploads to public Storage',
    'inserts legacy global Events',
    'IR-008 must not modify it',
  ]) {
    assert.ok(combined.includes(requiredText), `missing contract text: ${requiredText}`)
  }
  assert.match(authorisation, /supabase\/migrations\/\*\*/u)
  assert.match(authorisation, /supabase\/functions\/\*\*/u)
  assert.match(authorisation, /src\/\*\*/u)
  assert.match(authorisation, /package\.json/u)
  assert.match(authorisation, /remote Supabase/u)
})

test('IR-008 static evidence proves absence without claiming operation execution or performance', () => {
  const matrix = loadOperationContractMatrix()
  const results = runOperationContractCases({ matrix })
  assert.equal(matrix.evidenceRequirements.physicalTrustedOperationsImplemented, 0)
  assert.equal(matrix.evidenceRequirements.migration010, 'absent')
  assert.match(matrix.evidenceRequirements.migrationTreeSha256, /^[a-f0-9]{64}$/u)
  assert.equal(matrix.evidenceRequirements.genericProxy, 'absent')
  assert.equal(matrix.evidenceRequirements.browserServiceRole, 'absent')
  assert.match(matrix.evidenceRequirements.knownUnresolvedParseDocumentSha256, /^[a-f0-9]{64}$/u)
  assert.equal(matrix.evidenceRequirements.generatedTypeDrift, 'none')
  assert.match(matrix.evidenceRequirements.applicationSourceTreeSha256, /^[a-f0-9]{64}$/u)
  assert.equal(matrix.evidenceRequirements.applicationAuthority, 'not-introduced')
  assert.equal(matrix.evidenceRequirements.performance, 'not-run-not-applicable')
  assert.equal(matrix.immutableEvidence.writeOnce, true)
  assert.equal(matrix.immutableEvidence.secretSafe, true)
  assert.ok(results.every((result) => result.expected === 'not-implemented' && result.actual === 'not-implemented'))
  assert.ok(results.every((result) => result.executionClaimed === false))
  assert.deepEqual(matrix.adversarialRequirements, [
    'replay',
    'cross-Group substitution',
    'inactive membership',
    'archive state',
    'stale authority',
    'races',
  ])
})

test('IR-008 plan evidence is static-only, secret-safe, and leaves no stack to clean up', () => {
  const evidence = collectTrustedOperationPlanEvidence()
  assert.equal(evidence.result, 'contract-verified')
  assert.equal(evidence.implementationState, 'authorised-not-started')
  assert.equal(evidence.physicalTrustedOperationsImplemented, 0)
  assert.equal(evidence.migration010, 'absent')
  assert.equal(evidence.migrationDrift, 'none')
  assert.equal(evidence.genericProxy, 'absent')
  assert.equal(evidence.browserElevatedCredential, 'absent')
  assert.equal(evidence.generatedTypeDrift, 'none')
  assert.equal(evidence.applicationSourceDrift, 'none')
  assert.equal(evidence.applicationAuthority, 'not-introduced')
  assert.equal(evidence.performance, 'not-run-not-applicable')
  assert.ok(evidence.operationResults.every((result) => result.executionClaimed === false))

  const runner = readText('tests/database/ir-008/run-trusted-operation-plan-evidence.mjs')
  const cleanup = readText('tests/database/ir-008/assert-cleanup.mjs')
  const manifestWriter = readText('tests/evidence/write-ir-008-evidence-manifest.mjs')
  assert.doesNotMatch(runner, /spawnSync|supabase\s+(?:start|stop)|docker\s+(?:compose|start|stop)/iu)
  assert.doesNotMatch(cleanup, /supabase\s+(?:start|stop)|docker\s+(?:compose|start|stop)/iu)
  assert.match(manifestWriter, /flag: 'wx'/u)
  assert.match(manifestWriter, /chmodSync\(manifestPath, 0o444\)/u)
  assert.doesNotMatch(JSON.stringify(evidence), /postgres(?:ql)?:\/\//iu)
  assert.doesNotMatch(JSON.stringify(evidence), /(?:password|token|secret|api[_-]?key|service[_-]?role)["']?\s*[:=]/iu)
})

void repositoryRoot
