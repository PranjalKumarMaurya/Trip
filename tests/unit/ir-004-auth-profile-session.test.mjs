import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const migration = readFileSync('supabase/migrations/008_ir004_profile_auth.sql', 'utf8')
const app = readFileSync('src/App.tsx', 'utf8')
const session = readFileSync('src/features/auth/authSession.ts', 'utf8')
const boundary = readFileSync('src/features/auth/AuthBoundary.tsx', 'utf8')
const entry = readFileSync('src/features/auth/AuthEntry.tsx', 'utf8')

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
