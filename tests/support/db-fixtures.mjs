import { spawnSync } from 'node:child_process'
import { root } from './local-stack.mjs'

export const quote = (value) => `'${String(value).replaceAll("'", "''")}'`

/**
 * Run `sql` as a signed-in user (`userId`) or as `anon` (userId = null) inside one
 * transaction, the way PostgREST would. Returns { ok, rows } or { ok: false, error }.
 * The last statement's rows are returned as arrays of text cells.
 */
export function sqlAs(stack, userId, sql) {
  const asRole = userId === null
    ? 'SET LOCAL ROLE anon;'
    : `SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claim.sub', ${quote(userId)}, true) \\g /dev/null`
  const result = spawnSync('psql', ['--no-psqlrc', '--quiet', '--tuples-only', '--no-align', '--set', 'ON_ERROR_STOP=1',
    '--host', '127.0.0.1', '--port', stack.dbPort, '--username', 'postgres', '--dbname', 'postgres'], {
    cwd: root, encoding: 'utf8', env: { ...process.env, PGPASSWORD: 'postgres' },
    input: `BEGIN;\n${asRole}\n${sql}\nCOMMIT;\n`,
  })
  if (result.error) throw result.error
  if (result.status !== 0) return { ok: false, error: result.stderr.match(/ERROR:\s+([^\n]+)/u)?.[1] ?? 'failed' }
  const rows = result.stdout.split('\n').filter((line) => line !== '' && line !== 'BEGIN' && line !== 'COMMIT' && line !== 'SET')
    .map((line) => line.split('|'))
  return { ok: true, rows }
}

/** Create verified Auth users (profiles are created by the Auth trigger). Returns name -> auth user id. */
export function createUsers(stack, names) {
  const ids = Object.fromEntries(names.map((name, index) =>
    [name, `a0000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`]))
  stack.psql(`INSERT INTO auth.users
    (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES ${names.map((name) => `(${quote(ids[name])}, 'authenticated', 'authenticated', ${quote(`${name}@example.test`)},
      'fixture', now(), '{}', ${quote(JSON.stringify({ display_name: name }))}, now(), now())`).join(',\n')};`, 'fixture-users')
  return ids
}

/**
 * Create a Trip with members. `members` maps auth user id -> 'owner' | 'member'.
 * Returns { groupId, memberIds: auth user id -> group_members.id }.
 */
export function createTrip(stack, { groupId, name = 'Trip', currency = 'INR', timezone = 'Asia/Kolkata', members }) {
  stack.psql(`INSERT INTO public.groups (id) VALUES (${quote(groupId)});
    INSERT INTO public.group_configurations
      (group_id, trip_name, destination, start_date, end_date, timezone, accounting_currency)
    VALUES (${quote(groupId)}, ${quote(name)}, 'Goa', '2026-11-01', '2026-11-05', ${quote(timezone)}, ${quote(currency)});
    INSERT INTO public.group_members (group_id, profile_id, role, status)
    SELECT ${quote(groupId)}, profile.id, member.role, 'active'
    FROM (VALUES ${Object.entries(members).map(([userId, role]) => `(${quote(userId)}::uuid, ${quote(role)})`).join(', ')})
      AS member(user_id, role)
    JOIN public.profiles AS profile ON profile.auth_user_id = member.user_id;`, 'fixture-trip')
  const rows = stack.psql(`SELECT profile.auth_user_id, member.id FROM public.group_members AS member
    JOIN public.profiles AS profile ON profile.id = member.profile_id WHERE member.group_id = ${quote(groupId)};`)
  return { groupId, memberIds: Object.fromEntries(rows.split('\n').filter(Boolean).map((line) => line.split('|'))) }
}
