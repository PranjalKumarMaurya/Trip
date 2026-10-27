// Pure logic for the shared Trip todo list. No React or Supabase imports.

export interface TripTodo {
  id: string
  group_id: string
  title: string
  done: boolean
  created_by: string
  completed_by: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export const TODO_TITLE_MAX = 200

/** Returns the trimmed title, or an error message. */
export function validateTodoTitle(value: string): { ok: true; title: string } | { ok: false; error: string } {
  const title = value.trim()
  if (!title) return { ok: false, error: 'Write something to add.' }
  if (title.length > TODO_TITLE_MAX) return { ok: false, error: `Keep it under ${TODO_TITLE_MAX} characters.` }
  return { ok: true, title }
}

const byCreation = (left: TripTodo, right: TripTodo) =>
  Date.parse(left.created_at) - Date.parse(right.created_at) || left.id.localeCompare(right.id)

/** Open and completed todos, each in creation order so rows never jump. */
export function splitTodos(todos: readonly TripTodo[]): { open: TripTodo[]; done: TripTodo[] } {
  const sorted = [...todos].sort(byCreation)
  return { open: sorted.filter((todo) => !todo.done), done: sorted.filter((todo) => todo.done) }
}

export function memberName(roster: readonly { groupMemberId: string; displayName: string }[], memberId: string | null, selfId: string): string {
  if (!memberId) return 'someone'
  if (memberId === selfId) return 'you'
  return roster.find((member) => member.groupMemberId === memberId)?.displayName ?? 'a former member'
}

export type RenameOutcome = 'saved' | 'conflict' | 'removed'

/**
 * Classify a guarded rename (UPDATE ... WHERE title = <title the user started
 * from>). Zero updated rows means someone else changed or removed the todo.
 */
export function renameOutcome(updatedRows: number, stillExists: boolean): RenameOutcome {
  if (updatedRows > 0) return 'saved'
  return stillExists ? 'conflict' : 'removed'
}
