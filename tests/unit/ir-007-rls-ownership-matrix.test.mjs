import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  assertRlsOwnershipResults,
  readRlsOwnershipMatrix,
  resolveRlsOwnershipSql,
  runRlsOwnershipCases,
  validateRlsOwnershipMatrix,
} from '../database/ir-007/cases/run-rls-ownership-cases.mjs'

const fixturePath = 'tests/database/ir-007/cases/fixtures.sql'
const runnerPath = 'tests/database/ir-007/cases/run-rls-ownership-cases.mjs'
const fixture = readFileSync(fixturePath, 'utf8')
const runnerSource = readFileSync(runnerPath, 'utf8')
const matrix = readRlsOwnershipMatrix()

const executableCaseIds = [
  'IR007-RLS-001-anonymous-profile-denial',
  'IR007-RLS-002-own-profile-read',
  'IR007-RLS-003-own-profile-presentation-update',
  'IR007-RLS-004-cross-account-profile-denial',
  'IR007-RLS-005-no-profile-denial',
  'IR007-RLS-006-no-membership-denial',
  'IR007-RLS-007-active-same-group-read',
  'IR007-RLS-008-cross-group-denial',
  'IR007-RLS-009-inactive-membership-denial',
  'IR007-RLS-010-archived-group-denial',
  'IR007-RLS-011-direct-configuration-write-member-denial',
  'IR007-RLS-012-direct-configuration-write-owner-denial',
  'IR007-RLS-013-same-group-roster-projection',
  'IR007-RLS-014-cross-group-roster-denial',
  'IR007-RLS-015-direct-membership-insert-denial',
  'IR007-RLS-016-direct-membership-update-denial',
  'IR007-RLS-017-direct-membership-delete-denial',
  'IR007-RLS-018-raw-audit-insert-denial',
  'IR007-RLS-019-raw-audit-update-denial',
  'IR007-RLS-020-raw-audit-delete-denial',
  'IR007-RLS-021-active-owner-audit-summary-success',
  'IR007-RLS-022-ordinary-member-audit-summary-denial',
  'IR007-RLS-023-forged-group-id-denial',
  'IR007-RLS-024-forged-profile-id-denial',
  'IR007-RLS-025-forged-participant-id-denial',
  'IR007-RLS-026-anonymous-legacy-events-denial',
  'IR007-RLS-027-authenticated-legacy-events-denial',
  'IR007-RLS-028-anonymous-legacy-expenses-denial',
  'IR007-RLS-029-authenticated-legacy-expenses-denial',
  'IR007-RLS-030-anonymous-legacy-settlements-denial',
  'IR007-RLS-031-authenticated-legacy-settlements-denial',
  'IR007-RLS-032-anonymous-legacy-exchange-rates-denial',
  'IR007-RLS-033-authenticated-legacy-exchange-rates-denial',
  'IR007-RLS-034-anonymous-legacy-todos-denial',
  'IR007-RLS-035-authenticated-legacy-todos-denial',
  'IR007-RLS-036-legacy-permissive-policy-absence',
  'IR007-RLS-037-no-recursive-rls-result',
  'IR007-RLS-038-no-raw-auth-user-id-in-roster',
  'IR007-RLS-039-anonymous-legacy-users-and-currency-denial',
  'IR007-RLS-040-authenticated-legacy-users-and-currency-denial',
]

const deferredCaseIds = [
  'IR007-DEFERRED-tenant-aware-events',
  'IR007-DEFERRED-tenant-aware-todos',
  'IR007-DEFERRED-normalized-finance-and-settlements',
  'IR007-DEFERRED-documents',
  'IR007-DEFERRED-storage',
  'IR007-DEFERRED-realtime',
  'IR007-DEFERRED-invitations',
  'IR007-DEFERRED-group-bootstrap',
  'IR007-DEFERRED-membership-lifecycle',
  'IR007-DEFERRED-trusted-operations',
]

test('IR-007 freezes exactly the current-schema executable matrix and defers future targets', () => {
  const summary = validateRlsOwnershipMatrix(matrix)

  assert.equal(summary.executableCaseCount, 40)
  assert.equal(summary.deferredCaseCount, 10)
  assert.equal(summary.assertionCount, 52)
  assert.deepEqual(summary.executableCaseIds, executableCaseIds)
  assert.deepEqual([...summary.deferredCaseIds].sort(), [...deferredCaseIds].sort())
  assert.ok(matrix.cases.every((testCase) => testCase.scope === 'current-schema' && testCase.executable === true))
  assert.ok(matrix.deferredCases.every((testCase) => testCase.scope === 'future-target' && testCase.executable === false))
  assert.ok(matrix.deferredCases.every((testCase) => !Object.hasOwn(testCase, 'assertions')))
})

test('IR-007 fixture supplies every adversarial identity without display-name authority', () => {
  const requiredStates = [
    'anonymous',
    'Auth User without Profile',
    'linked Profile without membership',
    'active Owner in Group A',
    'active Member in Group A',
    'active Owner in Group B',
    'inactive membership',
    'active membership in archived Group',
  ]

  assert.ok(requiredStates.every((state) => Object.values(matrix.actors).some((actor) => actor.state === state)))
  for (const [name, id] of Object.entries(matrix.ids)) {
    if (name.startsWith('forged')) continue
    assert.match(fixture, new RegExp(id, 'u'))
  }
  for (const id of matrix.duplicateDisplayNames.profileIds) assert.match(fixture, new RegExp(id, 'u'))
  for (const id of matrix.duplicateDisplayNames.participantIds) assert.match(fixture, new RegExp(id, 'u'))
  assert.equal((fixture.match(/Duplicate Display/gu) ?? []).length, 4)
  assert.match(fixture, /DELETE FROM public\.profiles\s+WHERE auth_user_id = '00000000-0000-4000-8000-000000007107'/u)
  assert.match(fixture, /'inactive'\),/u)
  assert.match(fixture, /\('00000000-0000-4000-8000-000000007303', now\(\)\)/u)
  assert.match(fixture, /BEGIN;/u)
  assert.match(fixture, /COMMIT;/u)
  assert.doesNotMatch(fixture, /\b(?:CREATE|ALTER|DROP|GRANT|REVOKE)\b/u)
})

test('IR-007 runner resolves only fixture IDs and returns audit-safe structured results', async () => {
  const assertionsById = new Map(
    matrix.cases.flatMap((testCase) => testCase.assertions.map((assertion) => [assertion.assertionId, assertion])),
  )
  let executions = 0

  const results = await runRlsOwnershipCases({
    matrix,
    execute: async ({ assertionId, actor, sql, transaction }) => {
      executions += 1
      const assertion = assertionsById.get(assertionId)
      assert.ok(assertion)
      assert.equal(transaction, 'rollback')
      assert.ok([null, 'anon', 'authenticated'].includes(actor.dbRole))
      assert.equal(sql, resolveRlsOwnershipSql(assertion.sql, matrix))
      return assertion.kind === 'error'
        ? { ok: false }
        : { ok: true, scalar: assertion.expectedScalar }
    },
  })

  assert.equal(executions, 52)
  assert.equal(results.length, 40)
  assert.ok(results.every((result) => Object.keys(result).join(',') === 'caseId,expected,actual,assertionCount'))
  assert.ok(results.every((result) => result.expected === result.actual))
  assertRlsOwnershipResults(results)
  assert.doesNotMatch(JSON.stringify(results), /postgres(?:ql)?:\/\/|password|token|secret|service[_-]?role|@example\.test/iu)
})

test('IR-007 runner surfaces an unexpected allow without returning database details', async () => {
  const results = await runRlsOwnershipCases({
    matrix,
    execute: async ({ assertionId }) => {
      if (assertionId === 'anonymous-cannot-select-profiles') return { ok: true, scalar: '1' }
      const assertion = matrix.cases.flatMap((testCase) => testCase.assertions)
        .find((candidate) => candidate.assertionId === assertionId)
      return assertion.kind === 'error'
        ? { ok: false }
        : { ok: true, scalar: assertion.expectedScalar }
    },
  })

  const result = results.find((candidate) => candidate.caseId === 'IR007-RLS-001-anonymous-profile-denial')
  assert.deepEqual(result, {
    caseId: 'IR007-RLS-001-anonymous-profile-denial',
    expected: 'denied',
    actual: 'unexpected-allow',
    assertionCount: 1,
  })
  assert.throws(() => assertRlsOwnershipResults(results), /ir007-rls-ownership-matrix-failed/u)
})

test('IR-007 runner has no retained-evidence writer or database lifecycle ownership', () => {
  assert.doesNotMatch(runnerSource, /(?:writeFile(?:Sync)?|mkdir(?:Sync)?|supabase\s+start|supabase\s+stop|docker)/iu)
  assert.match(runnerSource, /transaction: 'rollback'/u)
  assert.match(runnerSource, /caseId: testCase\.caseId/u)
  assert.match(runnerSource, /expected: testCase\.expected/u)
  assert.match(runnerSource, /actual,/u)
  assert.match(runnerSource, /assertionCount,/u)
})
