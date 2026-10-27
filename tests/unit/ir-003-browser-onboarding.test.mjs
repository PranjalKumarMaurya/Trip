import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const adapter = readFileSync('src/features/onboarding/bootstrapGroup.ts', 'utf8')
const onboarding = readFileSync('src/features/onboarding/BootstrapOnboarding.tsx', 'utf8')
const tripSettings = readFileSync('src/features/onboarding/tripSettings.ts', 'utf8')
const boundary = readFileSync('src/features/auth/AuthBoundary.tsx', 'utf8')
const groupAccess = readFileSync('src/features/groups/myGroupAccess.ts', 'utf8')
const workspace = readFileSync('src/features/groups/GroupWorkspace.tsx', 'utf8')
const require = createRequire(import.meta.url)

function loadAdapter(rpc) {
  const typescript = require('typescript')
  const output = typescript.transpileModule(adapter, {
    compilerOptions: { module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2022 },
  }).outputText
  const module = { exports: {} }
  new Function('require', 'exports', 'module', output)(
    (specifier) => {
      if (specifier === '../../lib/supabase') return { supabase: { rpc } }
      throw new Error(`unexpected-import-${specifier}`)
    },
    module.exports,
    module,
  )
  return module.exports
}

test('staged handoff uses current membership context before opening a Group shell', () => {
  assert.match(boundary, /loadMyGroupAccess\(\)/)
  assert.match(boundary, /groupAccess === 'none'/)
  assert.match(boundary, /groupAccess === 'has-group' && selectedGroupId/)
  assert.match(boundary, /<BootstrapOnboarding/)
  assert.match(groupAccess, /get_my_group_access/)
  assert.match(workspace, /selected\.role === 'owner'/)
  assert.doesNotMatch(boundary, /TripTab|PersonaPicker|useCurrentUser/)
})

test('IR-003 bootstrap adapter uses the frozen three-argument RPC shape without client authority', async () => {
  const calls = []
  const { bootstrapGroup } = loadAdapter(async (name, args) => {
    calls.push({ name, args })
    return {
      data: [{ outcome: 'completed', group_id: '00000000-0000-4000-8000-000000000003', request_id: args.request_id }],
      error: null,
    }
  })

  const requestId = '00000000-0000-4000-8000-000000000001'
  const result = await bootstrapGroup({
    tripName: 'Northern lights',
    destination: 'Tromsø',
    startDate: '2027-01-11',
    endDate: '2027-01-18',
    timezone: 'Europe/Oslo',
    accountingCurrency: 'nok',
    displayCurrencyCodes: ['nok', 'eur'],
  }, requestId)

  assert.deepEqual(result, { outcome: 'completed', groupId: '00000000-0000-4000-8000-000000000003', requestId })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].name, 'bootstrap_group')
  assert.deepEqual(Object.keys(calls[0].args).sort(), ['configuration_request', 'group_request', 'request_id'])
  assert.deepEqual(calls[0].args, {
    group_request: { trip_name: 'Northern lights' },
    configuration_request: {
      destination: 'Tromsø',
      start_date: '2027-01-11',
      end_date: '2027-01-18',
      timezone: 'Europe/Oslo',
      accounting_currency: 'NOK',
      display_currency_codes: ['NOK', 'EUR'],
    },
    request_id: requestId,
  })
  assert.doesNotMatch(JSON.stringify(calls[0].args), /actor|owner|role|profile|auth_user|invitation/i)
})

test('IR-003 adapter maps only safe error categories and keeps server details out of the UI contract', async () => {
  const { bootstrapGroup, BootstrapGroupError } = loadAdapter(async () => ({ data: null, error: { message: 'idempotency_conflict' } }))
  await assert.rejects(
    bootstrapGroup({ tripName: 'Trip', destination: 'Oslo', startDate: '2027-01-01', endDate: '2027-01-02', timezone: 'Europe/Oslo', accountingCurrency: 'NOK', displayCurrencyCodes: ['NOK'] }, '00000000-0000-4000-8000-000000000001'),
    (error) => error instanceof BootstrapGroupError && error.kind === 'conflict',
  )
  assert.doesNotMatch(onboarding, /error\.message|error\.details|error\.hint/)
})

test('IR-003 onboarding retains one request identity for retry and resets it only after an edited request', () => {
  assert.match(onboarding, /const requestId = requestIdRef\.current \?\? createBootstrapRequestId\(\)/)
  assert.match(onboarding, /if \(requestIdRef\.current\) requestIdRef\.current = null/)
  assert.match(onboarding, /state === 'submitting'/)
  assert.match(onboarding, /Retry creating Trip/)
})

test('IR-003 validates every frozen bootstrap field and renders ONB-06 State A only', () => {
  for (const field of ['tripName', 'destination', 'startDate', 'endDate', 'timezone', 'accountingCurrency', 'displayCurrencies']) {
    assert.match(tripSettings, new RegExp(`errors\\.${field}`))
  }
  assert.match(onboarding, /validateBootstrapForm\(values\)/)
  assert.match(tripSettings, /End date must be on or after the start date\./)
  assert.match(tripSettings, /Include the Trip currency\./)
  assert.match(onboarding, /bootstrap-success-state-a/)
  assert.match(onboarding, /Trip created/)
  // State A creates no invitation; it only points to the Crew tab.
  assert.match(onboarding, /Invite friends from the Crew tab/)
  assert.doesNotMatch(onboarding, /copy invitation|share invitation|invitation URL|invitation code|invite members|recipient/i)
  // No jargon on the Create Trip screen.
  assert.doesNotMatch(onboarding, /IANA|ISO 4217|Accounting currency|\bGroups?\b/)
})
