import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useLiveRefetch } from '../trip/useLiveRefetch'
import { renameOutcome, type RenameOutcome, type TripTodo } from './todoList'

const TODO_COLUMNS = 'id, group_id, title, done, created_by, completed_by, completed_at, created_at, updated_at'
const LIVE_TABLES = ['trip_todos'] as const

export class TodoError extends Error {
  constructor() { super('trip_todo_failed') }
}

export function useTripTodos(groupId: string) {
  const [todos, setTodos] = useState<TripTodo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const sequence = useRef(0)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const reload = useCallback(async () => {
    const mine = ++sequence.current
    const { data, error: readError } = await supabase.from('trip_todos').select(TODO_COLUMNS)
      .eq('group_id', groupId).order('created_at').order('id')
    if (!mounted.current || mine !== sequence.current) return
    setLoading(false)
    if (readError) {
      setError(true)
      return
    }
    setError(false)
    setTodos(data ?? [])
  }, [groupId])

  useEffect(() => { void reload() }, [reload])
  const live = useLiveRefetch(groupId, LIVE_TABLES, () => { void reload() })

  /** Show a local change at once; the next reload replaces it with the server's version. */
  const patchLocal = useCallback((id: string, patch: Partial<TripTodo>) => {
    setTodos((current) => current.map((todo) => todo.id === id ? { ...todo, ...patch } : todo))
  }, [])

  return { todos, loading, error, live, reload, patchLocal }
}

export async function addTodo(groupId: string, createdBy: string, title: string) {
  const { error } = await supabase.from('trip_todos').insert({ group_id: groupId, created_by: createdBy, title })
  if (error) throw new TodoError()
}

/** Set (not flip) the state, so two members ticking at once agree. */
export async function setTodoDone(groupId: string, id: string, done: boolean) {
  const { error } = await supabase.from('trip_todos').update({ done }).eq('group_id', groupId).eq('id', id)
  if (error) throw new TodoError()
}

/** Rename only if the title is still the one the editor started from. */
export async function renameTodo(groupId: string, id: string, fromTitle: string, title: string): Promise<RenameOutcome> {
  const { data, error } = await supabase.from('trip_todos').update({ title })
    .eq('group_id', groupId).eq('id', id).eq('title', fromTitle).select('id')
  if (error) throw new TodoError()
  if (data.length) return 'saved'
  const { data: existing, error: readError } = await supabase.from('trip_todos').select('id').eq('group_id', groupId).eq('id', id)
  if (readError) throw new TodoError()
  return renameOutcome(0, existing.length > 0)
}

export async function deleteTodo(groupId: string, id: string) {
  const { error } = await supabase.from('trip_todos').delete().eq('group_id', groupId).eq('id', id)
  if (error) throw new TodoError()
}

/** Delete exactly the completed todos the user saw, and only if still completed. */
export async function clearCompleted(groupId: string, ids: string[]) {
  if (!ids.length) return
  const { error } = await supabase.from('trip_todos').delete().eq('group_id', groupId).eq('done', true).in('id', ids)
  if (error) throw new TodoError()
}
