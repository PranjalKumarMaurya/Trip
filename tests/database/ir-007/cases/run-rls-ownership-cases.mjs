import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const matrixPath = fileURLToPath(new URL('./rls-ownership.matrix.json', import.meta.url))

const requiredActorStates = new Set([
  'anonymous',
  'Auth User without Profile',
  'linked Profile without membership',
  'active Owner in Group A',
  'active Member in Group A',
  'active Owner in Group B',
  'inactive membership',
  'active membership in archived Group',
])

const requiredDeferredCaseIds = new Set([
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
])

const caseIdPattern = /^IR007-RLS-\d{3}-[a-z0-9-]+$/u
const deferredCaseIdPattern = /^IR007-DEFERRED-[a-z0-9-]+$/u
const allowedAssertionKinds = new Set(['error', 'scalar'])

function fail(reason) {
  throw new Error(`invalid-ir007-rls-ownership-matrix-${reason}`)
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function stringAtPath(source, path) {
  const value = path.split('.').reduce((current, segment) => (
    isObject(current) ? current[segment] : undefined
  ), source)
  if (typeof value !== 'string' || value.length === 0) fail('unknown-template-value')
  return value
}

export function resolveRlsOwnershipSql(sql, matrix) {
  if (typeof sql !== 'string' || sql.length === 0) fail('invalid-sql')
  const resolved = sql.replace(/\{\{([a-zA-Z0-9_.-]+)\}\}/gu, (_match, path) => {
    if (!path.startsWith('ids.')) fail('disallowed-template-path')
    return stringAtPath(matrix, path)
  })
  if (resolved.includes('{{') || resolved.includes('}}')) fail('unresolved-template')
  return resolved
}

export function readRlsOwnershipMatrix(path = matrixPath) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    throw new Error('invalid-ir007-rls-ownership-matrix-json')
  }
}

export function validateRlsOwnershipMatrix(matrix = readRlsOwnershipMatrix()) {
  if (!isObject(matrix) || matrix.schemaVersion !== 1 || matrix.capability !== 'ir-007-rls-ownership') {
    fail('header')
  }
  if (matrix.fixture !== 'tests/database/ir-007/cases/fixtures.sql' || matrix.retainedEvidence !== false) {
    fail('fixture-or-evidence-boundary')
  }
  if (!isObject(matrix.actors) || !isObject(matrix.ids) || !isObject(matrix.duplicateDisplayNames)) fail('fixtures')

  const actorStates = new Set()
  for (const actor of Object.values(matrix.actors)) {
    if (!isObject(actor) || typeof actor.state !== 'string' ||
      ![null, 'anon', 'authenticated'].includes(actor.dbRole) ||
      (actor.authUserId !== null && typeof actor.authUserId !== 'string')) {
      fail('actor')
    }
    actorStates.add(actor.state)
  }
  for (const state of requiredActorStates) {
    if (!actorStates.has(state)) fail('missing-actor-state')
  }

  if (!Array.isArray(matrix.duplicateDisplayNames.profileIds) ||
    !Array.isArray(matrix.duplicateDisplayNames.participantIds) ||
    matrix.duplicateDisplayNames.profileIds.length !== 2 ||
    matrix.duplicateDisplayNames.participantIds.length !== 2 ||
    new Set(matrix.duplicateDisplayNames.profileIds).size !== 2 ||
    new Set(matrix.duplicateDisplayNames.participantIds).size !== 2) {
    fail('duplicate-display-name-identities')
  }

  if (!Array.isArray(matrix.cases) || matrix.cases.length !== 40) fail('current-case-count')
  const caseIds = new Set()
  let assertionCount = 0
  for (const testCase of matrix.cases) {
    if (!isObject(testCase) || !caseIdPattern.test(testCase.caseId) || caseIds.has(testCase.caseId) ||
      testCase.scope !== 'current-schema' || testCase.executable !== true ||
      !Object.hasOwn(matrix.actors, testCase.actor) || !['allowed', 'denied'].includes(testCase.expected) ||
      !Array.isArray(testCase.assertions) || testCase.assertions.length === 0) {
      fail('current-case')
    }
    caseIds.add(testCase.caseId)
    const assertionIds = new Set()
    for (const assertion of testCase.assertions) {
      if (!isObject(assertion) || typeof assertion.assertionId !== 'string' || assertionIds.has(assertion.assertionId) ||
        !allowedAssertionKinds.has(assertion.kind)) {
        fail('assertion')
      }
      if (assertion.kind === 'scalar' && typeof assertion.expectedScalar !== 'string') fail('scalar-assertion')
      if (assertion.kind === 'error' && Object.hasOwn(assertion, 'expectedScalar')) fail('error-assertion')
      resolveRlsOwnershipSql(assertion.sql, matrix)
      assertionIds.add(assertion.assertionId)
      assertionCount += 1
    }
  }

  if (!Array.isArray(matrix.deferredCases) || matrix.deferredCases.length !== requiredDeferredCaseIds.size) {
    fail('deferred-case-count')
  }
  const deferredCaseIds = new Set()
  for (const deferredCase of matrix.deferredCases) {
    if (!isObject(deferredCase) || !deferredCaseIdPattern.test(deferredCase.caseId) ||
      deferredCaseIds.has(deferredCase.caseId) || deferredCase.scope !== 'future-target' ||
      deferredCase.executable !== false || deferredCase.expected !== 'deferred' ||
      typeof deferredCase.reason !== 'string' || deferredCase.reason.length === 0 ||
      Object.hasOwn(deferredCase, 'assertions') || Object.hasOwn(deferredCase, 'sql')) {
      fail('deferred-case')
    }
    deferredCaseIds.add(deferredCase.caseId)
  }
  for (const caseId of requiredDeferredCaseIds) {
    if (!deferredCaseIds.has(caseId)) fail('missing-deferred-case')
  }

  return {
    executableCaseIds: [...caseIds],
    deferredCaseIds: [...deferredCaseIds],
    executableCaseCount: matrix.cases.length,
    deferredCaseCount: matrix.deferredCases.length,
    assertionCount,
  }
}

function normalizeExecution(response) {
  if (typeof response === 'string') return { ok: true, scalar: response }
  if (!isObject(response)) return { ok: false }
  return { ok: response.ok !== false, scalar: response.scalar === undefined ? null : String(response.scalar) }
}

function assertionPassed(assertion, execution) {
  if (assertion.kind === 'error') return execution.ok === false
  return execution.ok === true && execution.scalar === assertion.expectedScalar
}

function failedActual(testCase, assertion, execution) {
  if (execution.ok === false) return 'unexpected-error'
  if (testCase.expected === 'denied') return 'unexpected-allow'
  return assertion.kind === 'error' ? 'unexpected-allow' : 'unexpected-denial'
}

/**
 * Execute the frozen current-schema matrix through an injected database adapter.
 * The adapter receives one assertion at a time and must run it in a fresh
 * rollback-only transaction with the supplied role and Auth User context.
 * This module reads the matrix only; it creates no retained evidence artifact.
 */
export async function runRlsOwnershipCases({ execute, matrix = readRlsOwnershipMatrix() } = {}) {
  if (typeof execute !== 'function') throw new Error('ir007-rls-ownership-executor-required')
  validateRlsOwnershipMatrix(matrix)

  const results = []
  for (const testCase of matrix.cases) {
    const actor = matrix.actors[testCase.actor]
    let actual = testCase.expected
    let assertionCount = 0

    for (const assertion of testCase.assertions) {
      let execution
      try {
        execution = normalizeExecution(await execute({
          caseId: testCase.caseId,
          assertionId: assertion.assertionId,
          actor: {
            name: testCase.actor,
            dbRole: actor.dbRole,
            authUserId: actor.authUserId,
          },
          sql: resolveRlsOwnershipSql(assertion.sql, matrix),
          transaction: 'rollback',
        }))
      } catch {
        execution = { ok: false, scalar: null }
      }
      assertionCount += 1
      if (actual === testCase.expected && !assertionPassed(assertion, execution)) {
        actual = failedActual(testCase, assertion, execution)
      }
    }

    results.push({
      caseId: testCase.caseId,
      expected: testCase.expected,
      actual,
      assertionCount,
    })
  }
  return results
}

export function assertRlsOwnershipResults(results) {
  if (!Array.isArray(results) || results.some((result) => result.expected !== result.actual)) {
    throw new Error('ir007-rls-ownership-matrix-failed')
  }
  return results
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--validate') {
    const summary = validateRlsOwnershipMatrix()
    console.log(JSON.stringify({
      capability: 'ir-007-rls-ownership',
      result: 'valid',
      executableCaseCount: summary.executableCaseCount,
      deferredCaseCount: summary.deferredCaseCount,
      assertionCount: summary.assertionCount,
    }))
  } else {
    console.error(JSON.stringify({
      capability: 'ir-007-rls-ownership',
      result: 'failed-safely',
      reason: 'executor-adapter-required',
    }))
    process.exitCode = 1
  }
}
