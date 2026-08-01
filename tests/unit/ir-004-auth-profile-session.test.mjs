import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const migration = readFileSync('supabase/migrations/008_ir004_profile_auth.sql', 'utf8')
const app = readFileSync('src/App.tsx', 'utf8')
const session = readFileSync('src/features/auth/authSession.ts', 'utf8')
const boundary = readFileSync('src/features/auth/AuthBoundary.tsx', 'utf8')
const entry = readFileSync('src/features/auth/AuthEntry.tsx', 'utf8')
const require = createRequire(import.meta.url)

function loadProfileResolutionController() {
  const typescript = require('typescript')
  const output = typescript.transpileModule(session, {
    compilerOptions: {
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText
  const module = { exports: {} }
  new Function('require', 'exports', 'module', output)(
    (specifier) => {
      if (specifier === 'react') return {}
      if (specifier === '../../lib/supabase') return { supabase: {} }
      throw new Error(`unexpected-import-${specifier}`)
    },
    module.exports,
    module,
  )
  return module.exports.createProfileResolutionController
}

function deferred() {
  let resolve
  const promise = new Promise((complete) => {
    resolve = complete
  })
  return { promise, resolve }
}

async function commitWhenCurrent(controller, token, lookup, commit) {
  const value = await lookup.promise
  if (controller.isCurrent(token)) commit(value)
}

test('IR-004 fixes the Profile/Auth contract without legacy attachment authority', () => {
  assert.match(migration, /profiles_auth_user_id_key UNIQUE \(auth_user_id\)/)
  assert.match(migration, /REFERENCES auth\.users\(id\) ON DELETE RESTRICT/)
  assert.match(migration, /CREATE POLICY profiles_select_own_linked_profile/)
  assert.match(migration, /CREATE FUNCTION public\.ir004_create_profile_for_auth_user\(\)/)
  assert.match(migration, /ON CONFLICT \(auth_user_id\) DO NOTHING/)
  assert.doesNotMatch(migration, /legacy users|pin|persona/i)
})

test('IR-004 application entry derives actor from the session and never renders legacy workspace', () => {
  assert.match(session, /supabase\.auth\.getSession\(\)/)
  assert.match(session, /onAuthStateChange/)
  assert.match(session, /session\.user\.id/)
  assert.match(session, /PASSWORD_RECOVERY/)
  assert.match(session, /manualSignOut/)
  assert.match(session, /createProfileResolutionController/)
  assert.match(session, /controller\.isCurrent\(resolution\)/)
  assert.match(app, /AuthBoundary/)
  assert.doesNotMatch(app, /PersonaPicker|TripTab|UserChips|useCurrentUser/)
  assert.match(boundary, /workspace-unavailable/)
  assert.doesNotMatch(boundary, /TripTab|PersonaPicker|supabase\.from\('events'\)/)
})

test('IR-004 owns only the accepted Auth forms and safe terminal states', () => {
  assert.match(entry, /signInWithPassword/)
  assert.match(entry, /signUp/)
  assert.match(entry, /resetPasswordForEmail/)
  assert.match(entry, /updateUser/)
  assert.match(entry, /display_name/)
  assert.match(entry, /Passwords must match/)
  assert.match(boundary, /supabase\.auth\.signOut/)
  assert.match(boundary, /workspace remains closed/)
  assert.doesNotMatch(entry, /service_role|createClient|PersonaPicker/i)
})

test('IR-004 ignores a deferred Profile lookup after sign-out', async () => {
  const createProfileResolutionController = loadProfileResolutionController()
  const controller = createProfileResolutionController()
  const lookup = deferred()
  const states = ['signed-out']
  const token = controller.beginProfileResolution('account-a')
  const pending = commitWhenCurrent(controller, token, lookup, (state) => states.push(state))

  controller.invalidate()
  lookup.resolve('authenticated-account-a')
  await pending

  assert.deepEqual(states, ['signed-out'])
})

test('IR-004 ignores Account A after Account B supersedes it', async () => {
  const createProfileResolutionController = loadProfileResolutionController()
  const controller = createProfileResolutionController()
  const accountALookup = deferred()
  const accountBLookup = deferred()
  let state = 'loading'
  const accountA = controller.beginProfileResolution('account-a')
  const pendingA = commitWhenCurrent(controller, accountA, accountALookup, (next) => { state = next })
  const accountB = controller.beginProfileResolution('account-b')
  const pendingB = commitWhenCurrent(controller, accountB, accountBLookup, (next) => { state = next })

  accountBLookup.resolve('authenticated-account-b')
  await pendingB
  accountALookup.resolve('authenticated-account-a')
  await pendingA

  assert.equal(state, 'authenticated-account-b')
})

test('IR-004 ignores a deferred Profile lookup after session expiry', async () => {
  const createProfileResolutionController = loadProfileResolutionController()
  const controller = createProfileResolutionController()
  const lookup = deferred()
  const states = ['expired']
  const token = controller.beginProfileResolution('account-a')
  const pending = commitWhenCurrent(controller, token, lookup, (state) => states.push(state))

  controller.invalidate()
  lookup.resolve('authenticated-account-a')
  await pending

  assert.deepEqual(states, ['expired'])
})

test('IR-004 commits a deferred Profile lookup for the current session only', async () => {
  const createProfileResolutionController = loadProfileResolutionController()
  const controller = createProfileResolutionController()
  const lookup = deferred()
  let state = 'loading'
  const token = controller.beginProfileResolution('account-a')
  const pending = commitWhenCurrent(controller, token, lookup, (next) => { state = next })

  lookup.resolve('authenticated-account-a')
  await pending

  assert.equal(state, 'authenticated-account-a')
})
