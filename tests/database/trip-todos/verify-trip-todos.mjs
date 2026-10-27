// Shared Trip todos (migration 030) and itinerary audience (migration 031):
// Trip isolation, shared edits by any active member, server-stamped creator and
// completer, no cross-Trip moves, and removal cutting access.
import assert from 'node:assert/strict'
import { createLocalStack } from '../../support/local-stack.mjs'
import { createTrip, createUsers, quote, sqlAs } from '../../support/db-fixtures.mjs'

const stack = createLocalStack({ projectId: 'trip-todos-db', basePort: 58600 })
const tripA = 'c0000000-0000-4000-8000-00000000000a'
const tripB = 'c0000000-0000-4000-8000-00000000000b'
const checks = []
const check = (name, fn) => { fn(); checks.push(name) }

const ok = (result, message) => {
  assert.equal(result.ok, true, `${message}: ${result.error}`)
  return result.rows
}
const denied = (result, message, pattern) => {
  assert.equal(result.ok, false, `${message}: unexpectedly allowed`)
  if (pattern) assert.match(result.error, pattern, message)
}

const insertTodo = (groupId, createdBy, title = 'Book transfer', extra = '') =>
  `INSERT INTO public.trip_todos (group_id, title, created_by${extra ? `, ${extra.split('=')[0]}` : ''})
   VALUES (${quote(groupId)}, ${quote(title)}, ${quote(createdBy)}${extra ? `, ${extra.split('=')[1]}` : ''}) RETURNING id;`
const todoState = (id) => stack.psql(`SELECT title, done, completed_by, completed_at IS NOT NULL FROM public.trip_todos WHERE id = ${quote(id)};`)
const insertEvent = (groupId, createdBy, title) => `INSERT INTO public.trip_events (group_id, event_type, title, starts_at, created_by)
  VALUES (${quote(groupId)}, 'activity', ${quote(title)}, '2026-11-02T05:00:00Z', ${quote(createdBy)}) RETURNING id;`

try {
  stack.start()
  stack.migrate()
  const user = createUsers(stack, ['owner', 'friend', 'leaver', 'stranger'])
  const a = createTrip(stack, { groupId: tripA, name: 'Goa', members: { [user.owner]: 'owner', [user.friend]: 'member', [user.leaver]: 'member' } })
  const b = createTrip(stack, { groupId: tripB, name: 'Jaipur', members: { [user.stranger]: 'owner', [user.owner]: 'member' } })
  const mA = (name) => a.memberIds[user[name]]
  const mB = (name) => b.memberIds[user[name]]

  let todoId = ''
  check('member-adds-own-todo', () => {
    todoId = ok(sqlAs(stack, user.friend, insertTodo(tripA, mA('friend'))), 'friend insert')[0][0]
    assert.equal(todoState(todoId), `Book transfer|f||f`)
    ok(sqlAs(stack, user.stranger, insertTodo(tripB, mB('stranger'), 'Pack chargers')), 'stranger insert in own Trip')
    ok(sqlAs(stack, user.owner, insertTodo(tripB, mB('owner'), 'Train tickets')), 'owner insert in Trip B')
  })

  check('no-impersonation-or-foreign-insert', () => {
    denied(sqlAs(stack, user.friend, insertTodo(tripA, mA('owner'))), 'impersonated creator', /row-level security/u)
    denied(sqlAs(stack, user.friend, insertTodo(tripB, mB('owner'))), 'non-member insert into Trip B')
    denied(sqlAs(stack, user.stranger, insertTodo(tripA, mB('stranger'))), 'creator from another Trip')
    denied(sqlAs(stack, user.stranger, insertTodo(tripA, mA('owner'))), 'stranger insert into Trip A')
    denied(sqlAs(stack, user.friend, insertTodo(tripA, mA('friend'), 'Pre-done', 'done=true')), 'insert as already done', /permission denied/u)
    denied(sqlAs(stack, user.friend, insertTodo(tripA, mA('friend'), 'Stamped', `completed_by=${quote(mA('owner'))}`)), 'insert with completer', /permission denied/u)
  })

  check('title-must-be-non-blank-and-bounded', () => {
    denied(sqlAs(stack, user.friend, insertTodo(tripA, mA('friend'), '   ')), 'blank title', /check constraint/u)
    denied(sqlAs(stack, user.friend, insertTodo(tripA, mA('friend'), 'x'.repeat(201))), 'overlong title', /check constraint/u)
    denied(sqlAs(stack, user.friend, `UPDATE public.trip_todos SET title = '' WHERE id = ${quote(todoId)};`), 'blank rename', /check constraint/u)
  })

  check('anon-has-no-access', () => {
    denied(sqlAs(stack, null, 'SELECT count(*) FROM public.trip_todos;'), 'anon read', /permission denied/u)
    denied(sqlAs(stack, null, insertTodo(tripA, mA('friend'))), 'anon insert', /permission denied/u)
    denied(sqlAs(stack, null, `DELETE FROM public.trip_todos;`), 'anon delete', /permission denied/u)
  })

  check('reads-are-trip-scoped', () => {
    assert.deepEqual(ok(sqlAs(stack, user.friend, 'SELECT title FROM public.trip_todos ORDER BY title;'), 'friend read'), [['Book transfer']])
    assert.deepEqual(ok(sqlAs(stack, user.stranger, 'SELECT title FROM public.trip_todos ORDER BY title;'), 'stranger read'), [['Pack chargers'], ['Train tickets']])
    assert.deepEqual(ok(sqlAs(stack, user.owner, 'SELECT title FROM public.trip_todos ORDER BY title;'), 'owner read'),
      [['Book transfer'], ['Pack chargers'], ['Train tickets']])
  })

  check('another-member-can-edit-shared-todo', () => {
    assert.deepEqual(ok(sqlAs(stack, user.owner, `UPDATE public.trip_todos SET title = 'Book airport transfer' WHERE id = ${quote(todoId)} RETURNING title;`), 'owner rename'),
      [['Book airport transfer']])
    ok(sqlAs(stack, user.leaver, `UPDATE public.trip_todos SET done = true WHERE id = ${quote(todoId)};`), 'leaver completes')
    assert.equal(todoState(todoId), `Book airport transfer|t|${mA('leaver')}|t`)
  })

  check('completion-is-stamped-by-the-server', () => {
    denied(sqlAs(stack, user.friend, `UPDATE public.trip_todos SET completed_by = ${quote(mA('friend'))} WHERE id = ${quote(todoId)};`), 'set completer', /permission denied/u)
    denied(sqlAs(stack, user.friend, `UPDATE public.trip_todos SET completed_at = now() - interval '1 day' WHERE id = ${quote(todoId)};`), 'set completion time', /permission denied/u)
    // Ticking an already-done todo, or renaming it, keeps the original completer.
    ok(sqlAs(stack, user.friend, `UPDATE public.trip_todos SET done = true, title = 'Airport transfer' WHERE id = ${quote(todoId)};`), 'friend re-tick + rename')
    assert.equal(todoState(todoId), `Airport transfer|t|${mA('leaver')}|t`)
    ok(sqlAs(stack, user.friend, `UPDATE public.trip_todos SET done = false WHERE id = ${quote(todoId)};`), 'friend reopens')
    assert.equal(todoState(todoId), 'Airport transfer|f||f')
    ok(sqlAs(stack, user.owner, `UPDATE public.trip_todos SET done = true WHERE id = ${quote(todoId)};`), 'owner completes')
    assert.equal(todoState(todoId), `Airport transfer|t|${mA('owner')}|t`)
  })

  check('guarded-rename-detects-concurrent-change', () => {
    assert.deepEqual(ok(sqlAs(stack, user.friend, `UPDATE public.trip_todos SET title = 'Mine' WHERE id = ${quote(todoId)} AND title = 'Book transfer' RETURNING id;`), 'stale rename'), [])
    assert.equal(todoState(todoId).split('|')[0], 'Airport transfer')
  })

  check('no-cross-trip-moves-or-creator-change', () => {
    denied(sqlAs(stack, user.owner, `UPDATE public.trip_todos SET group_id = ${quote(tripB)} WHERE id = ${quote(todoId)};`), 'move Trip', /permission denied/u)
    denied(sqlAs(stack, user.owner, `UPDATE public.trip_todos SET created_by = ${quote(mA('owner'))} WHERE id = ${quote(todoId)};`), 'change creator', /permission denied/u)
    // Even a privileged writer cannot point a completer at another Trip's member.
    assert.throws(() => stack.psql(`INSERT INTO public.trip_todos (group_id, title, created_by, done, completed_by)
      VALUES (${quote(tripA)}, 'Bad', ${quote(mA('owner'))}, true, ${quote(mB('stranger'))});`), /psql-failed/u)
    assert.throws(() => stack.psql(`INSERT INTO public.trip_todos (group_id, title, created_by)
      VALUES (${quote(tripA)}, 'Bad', ${quote(mB('stranger'))});`), /psql-failed/u)
  })

  check('non-members-cannot-touch-foreign-todos', () => {
    assert.deepEqual(ok(sqlAs(stack, user.stranger, `UPDATE public.trip_todos SET title = 'x' WHERE id = ${quote(todoId)} RETURNING id;`), 'stranger update'), [])
    assert.deepEqual(ok(sqlAs(stack, user.stranger, `UPDATE public.trip_todos SET done = false WHERE id = ${quote(todoId)} RETURNING id;`), 'stranger toggle'), [])
    assert.deepEqual(ok(sqlAs(stack, user.stranger, `DELETE FROM public.trip_todos WHERE id = ${quote(todoId)} RETURNING id;`), 'stranger delete'), [])
    assert.equal(todoState(todoId), `Airport transfer|t|${mA('owner')}|t`)
  })

  check('clear-completed-is-trip-scoped', () => {
    const open = ok(sqlAs(stack, user.friend, insertTodo(tripA, mA('friend'), 'Sunscreen')), 'open todo')[0][0]
    const doneB = ok(sqlAs(stack, user.stranger, insertTodo(tripB, mB('stranger'), 'Done in B')), 'B todo')[0][0]
    ok(sqlAs(stack, user.stranger, `UPDATE public.trip_todos SET done = true WHERE id = ${quote(doneB)};`), 'complete B todo')
    // The friend (not in Trip B) clears completed, naming every id it could guess.
    const cleared = ok(sqlAs(stack, user.friend, `DELETE FROM public.trip_todos WHERE done AND id IN (${[todoId, open, doneB].map(quote).join(', ')}) RETURNING title;`), 'clear completed')
    assert.deepEqual(cleared, [['Airport transfer']])
    assert.equal(stack.psql(`SELECT string_agg(title, ',' ORDER BY title) FROM public.trip_todos;`), 'Done in B,Pack chargers,Sunscreen,Train tickets')
    ok(sqlAs(stack, user.owner, `DELETE FROM public.trip_todos WHERE id = ${quote(open)} RETURNING id;`), 'another member deletes')
  })

  check('removed-member-loses-access', () => {
    const kept = ok(sqlAs(stack, user.friend, insertTodo(tripA, mA('friend'), 'Visa check')), 'todo before removal')[0][0]
    stack.psql(`UPDATE public.group_members SET status = 'inactive' WHERE id = ${quote(mA('leaver'))};`)
    assert.deepEqual(ok(sqlAs(stack, user.leaver, 'SELECT title FROM public.trip_todos;'), 'removed read'), [])
    denied(sqlAs(stack, user.leaver, insertTodo(tripA, mA('leaver'))), 'removed insert')
    assert.deepEqual(ok(sqlAs(stack, user.leaver, `UPDATE public.trip_todos SET done = true WHERE id = ${quote(kept)} RETURNING id;`), 'removed update'), [])
    assert.deepEqual(ok(sqlAs(stack, user.leaver, `DELETE FROM public.trip_todos WHERE id = ${quote(kept)} RETURNING id;`), 'removed delete'), [])
    // Their past completions stay attributed (the member row is kept, not deleted).
    assert.equal(stack.psql(`SELECT count(*) FROM public.trip_todos WHERE id = ${quote(kept)};`), '1')
  })

  check('archived-trip-is-read-only-to-everyone', () => {
    stack.psql(`UPDATE public.groups SET archived_at = now() WHERE id = ${quote(tripB)};`)
    assert.deepEqual(ok(sqlAs(stack, user.stranger, 'SELECT title FROM public.trip_todos;'), 'archived read'), [])
    denied(sqlAs(stack, user.stranger, insertTodo(tripB, mB('stranger'))), 'archived insert')
    stack.psql(`UPDATE public.groups SET archived_at = NULL WHERE id = ${quote(tripB)};`)
  })

  // Itinerary audience ("who's on this").
  let eventId = ''
  check('audience-set-by-member', () => {
    eventId = ok(sqlAs(stack, user.friend, insertEvent(tripA, mA('friend'), 'Surf lesson')), 'event insert')[0][0]
    ok(sqlAs(stack, user.friend, `SELECT public.set_trip_event_audience(${quote(tripA)}, ${quote(eventId)}, ARRAY[${quote(mA('friend'))}, ${quote(mA('owner'))}, ${quote(mA('owner'))}]::uuid[]);`), 'set audience')
    const audience = `SELECT group_member_id FROM public.trip_event_audience WHERE event_id = ${quote(eventId)} ORDER BY group_member_id;`
    assert.deepEqual(ok(sqlAs(stack, user.owner, audience), 'owner reads audience'), [mA('friend'), mA('owner')].sort().map((id) => [id]))
    ok(sqlAs(stack, user.owner, `SELECT public.set_trip_event_audience(${quote(tripA)}, ${quote(eventId)}, ARRAY[${quote(mA('owner'))}]::uuid[]);`), 'narrow audience')
    assert.deepEqual(ok(sqlAs(stack, user.friend, audience), 'friend reads narrowed audience'), [[mA('owner')]])
    // Display-only: the friend still reads the event.
    assert.deepEqual(ok(sqlAs(stack, user.friend, `SELECT title FROM public.trip_events WHERE id = ${quote(eventId)};`), 'event still visible'), [['Surf lesson']])
  })

  check('audience-is-trip-scoped', () => {
    denied(sqlAs(stack, user.owner, `SELECT public.set_trip_event_audience(${quote(tripA)}, ${quote(eventId)}, ARRAY[${quote(mB('stranger'))}]::uuid[]);`), 'member from another Trip', /foreign key/u)
    denied(sqlAs(stack, user.stranger, `SELECT public.set_trip_event_audience(${quote(tripA)}, ${quote(eventId)}, ARRAY[${quote(mA('owner'))}]::uuid[]);`), 'stranger sets audience', /trip_event_not_found/u)
    denied(sqlAs(stack, user.owner, `SELECT public.set_trip_event_audience(${quote(tripB)}, ${quote(eventId)}, '{}'::uuid[]);`), 'event under the wrong Trip', /trip_event_not_found/u)
    denied(sqlAs(stack, user.owner, `INSERT INTO public.trip_event_audience (group_id, event_id, group_member_id) VALUES (${quote(tripB)}, ${quote(eventId)}, ${quote(mB('owner'))});`), 'cross-Trip audience row', /foreign key/u)
    denied(sqlAs(stack, user.stranger, `INSERT INTO public.trip_event_audience (group_id, event_id, group_member_id) VALUES (${quote(tripA)}, ${quote(eventId)}, ${quote(mA('owner'))});`), 'stranger audience insert', /row-level security/u)
    assert.deepEqual(ok(sqlAs(stack, user.stranger, 'SELECT count(*) FROM public.trip_event_audience;'), 'stranger reads audience'), [['0']])
    assert.deepEqual(ok(sqlAs(stack, user.stranger, `DELETE FROM public.trip_event_audience RETURNING event_id;`), 'stranger clears audience'), [])
    denied(sqlAs(stack, user.owner, `UPDATE public.trip_event_audience SET group_member_id = ${quote(mA('friend'))};`), 'audience update', /permission denied/u)
    denied(sqlAs(stack, null, `SELECT public.set_trip_event_audience(${quote(tripA)}, ${quote(eventId)}, '{}'::uuid[]);`), 'anon rpc', /permission denied/u)
    assert.deepEqual(ok(sqlAs(stack, user.leaver, 'SELECT count(*) FROM public.trip_event_audience;'), 'removed member reads audience'), [['0']])
  })

  check('deleting-an-event-removes-its-audience', () => {
    assert.deepEqual(ok(sqlAs(stack, user.owner, `DELETE FROM public.trip_events WHERE id = ${quote(eventId)} RETURNING id;`), 'delete event'), [[eventId]])
    assert.equal(stack.psql(`SELECT count(*) FROM public.trip_event_audience WHERE event_id = ${quote(eventId)};`), '0')
  })

  check('realtime-publication-and-replica-identity', () => {
    assert.equal(stack.psql(`SELECT string_agg(tablename, ',' ORDER BY tablename) FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename IN ('trip_todos', 'trip_events', 'trip_event_audience');`), 'trip_event_audience,trip_events,trip_todos')
    assert.equal(stack.psql(`SELECT string_agg(relname || '=' || relreplident::text, ',' ORDER BY relname) FROM pg_class
      WHERE relnamespace = 'public'::regnamespace AND relname IN ('trip_todos', 'trip_events', 'trip_event_audience');`),
    'trip_event_audience=f,trip_events=f,trip_todos=f')
    assert.equal(stack.psql(`SELECT relrowsecurity AND relforcerowsecurity FROM pg_class WHERE oid IN ('public.trip_todos'::regclass, 'public.trip_event_audience'::regclass) GROUP BY 1;`), 't')
    assert.equal(stack.psql(`SELECT has_table_privilege('service_role', 'public.trip_todos', 'SELECT')
      OR has_table_privilege('anon', 'public.trip_todos', 'SELECT')
      OR has_column_privilege('authenticated', 'public.trip_todos', 'completed_by', 'UPDATE')
      OR has_column_privilege('authenticated', 'public.trip_todos', 'group_id', 'UPDATE');`), 'f')
    assert.equal(stack.psql(`SELECT prosecdef FROM pg_proc WHERE proname IN ('set_trip_event_audience', 'trip_todos_stamp_completion') GROUP BY 1;`), 'f')
  })

  stack.stop()
  console.log(JSON.stringify({ tripTodos: 'passed', checks: checks.length, names: checks, cleanup: 'passed' }))
} catch (error) {
  try { stack.stop() } catch { /* keep the primary failure */ }
  console.error(error instanceof Error && /^[a-z0-9-]+$/u.test(error.message) ? error.message : 'trip-todos-verification-failed')
  if (process.env.TRIP_DEBUG === '1') console.error(error)
  process.exitCode = 1
}
