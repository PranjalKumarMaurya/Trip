import assert from 'node:assert/strict'
import test from 'node:test'

import { memberName, renameOutcome, splitTodos, validateTodoTitle, type TripTodo } from '../../src/features/todos/todoList.ts'

const todo = (id: string, createdAt: string, done = false): TripTodo => ({
  id, group_id: 'g', title: id, done, created_by: 'm1', completed_by: done ? 'm2' : null,
  completed_at: done ? createdAt : null, created_at: createdAt, updated_at: createdAt,
})

test('todo titles are trimmed and bounded', () => {
  assert.deepEqual(validateTodoTitle('  Buy SIM cards '), { ok: true, title: 'Buy SIM cards' })
  assert.equal(validateTodoTitle('   ').ok, false)
  assert.equal(validateTodoTitle('x'.repeat(200)).ok, true)
  assert.equal(validateTodoTitle('x'.repeat(201)).ok, false)
})

test('open and completed todos keep creation order so rows never jump', () => {
  const { open, done } = splitTodos([
    todo('c', '2026-11-01T10:02:00Z'),
    todo('a', '2026-11-01T10:00:00Z', true),
    todo('b', '2026-11-01T10:01:00Z'),
    todo('a2', '2026-11-01T10:00:00Z'),
  ])
  assert.deepEqual(open.map((entry) => entry.id), ['a2', 'b', 'c'])
  assert.deepEqual(done.map((entry) => entry.id), ['a'])
})

test('attribution names', () => {
  const roster = [{ groupMemberId: 'm1', displayName: 'Asha' }, { groupMemberId: 'm2', displayName: 'Ben' }]
  assert.equal(memberName(roster, 'm2', 'm1'), 'Ben')
  assert.equal(memberName(roster, 'm1', 'm1'), 'you')
  assert.equal(memberName(roster, 'm9', 'm1'), 'a former member')
  assert.equal(memberName(roster, null, 'm1'), 'someone')
})

test('a guarded rename that touched no row is a conflict or a removal', () => {
  assert.equal(renameOutcome(1, true), 'saved')
  assert.equal(renameOutcome(0, true), 'conflict')
  assert.equal(renameOutcome(0, false), 'removed')
})
