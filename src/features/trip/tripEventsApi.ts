import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { sortEvents, type EventPayload, type TripEvent } from './itinerary'
import { useLiveRefetch } from './useLiveRefetch'

const EVENT_COLUMNS = 'id, group_id, event_type, title, starts_at, ends_at, location, location_to, map_url, notes, dep_code, arr_code, flight_no, airline, terminal, booking_ref, created_by, created_at, updated_at'
const LIVE_TABLES = ['trip_events', 'trip_event_audience'] as const

export interface ItineraryState {
  events: TripEvent[]
  /** event id -> group_members.id list; absent means everyone. */
  audience: Map<string, string[]>
  loading: boolean
  error: boolean
}

export function useItinerary(groupId: string) {
  const [state, setState] = useState<ItineraryState>({ events: [], audience: new Map(), loading: true, error: false })
  const sequence = useRef(0)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const reload = useCallback(async () => {
    const mine = ++sequence.current
    const [events, audience] = await Promise.all([
      supabase.from('trip_events').select(EVENT_COLUMNS).eq('group_id', groupId).order('starts_at').order('id'),
      supabase.from('trip_event_audience').select('event_id, group_member_id').eq('group_id', groupId),
    ])
    // Ignore responses that a newer request has overtaken.
    if (!mounted.current || mine !== sequence.current) return
    if (events.error || audience.error) {
      setState((current) => ({ ...current, loading: false, error: true }))
      return
    }
    const byEvent = new Map<string, string[]>()
    for (const row of audience.data ?? []) byEvent.set(row.event_id, [...(byEvent.get(row.event_id) ?? []), row.group_member_id])
    setState({ events: sortEvents(events.data ?? []), audience: byEvent, loading: false, error: false })
  }, [groupId])

  useEffect(() => { void reload() }, [reload])
  const live = useLiveRefetch(groupId, LIVE_TABLES, () => { void reload() })
  return { ...state, live, reload }
}

export class EventSaveError extends Error {
  constructor(readonly kind: 'conflict' | 'removed' | 'failed') {
    super(`trip_event_${kind}`)
  }
}

/** Returns false if the audience could not be saved (the event itself already was). */
async function setAudience(groupId: string, eventId: string, memberIds: string[]): Promise<boolean> {
  const { error } = await supabase.rpc('set_trip_event_audience', { p_group_id: groupId, p_event_id: eventId, p_member_ids: memberIds })
  return !error
}

/** Saved event; `audienceSaved` is false when only the "who's on this" step failed. */
export interface EventSaved { audienceSaved: boolean }

export async function createTripEvent(groupId: string, createdBy: string, payload: EventPayload, audience: string[]): Promise<EventSaved> {
  const { data, error } = await supabase.from('trip_events')
    .insert({ ...payload, group_id: groupId, created_by: createdBy }).select('id').single()
  if (error || !data) throw new EventSaveError('failed')
  return { audienceSaved: audience.length ? await setAudience(groupId, data.id, audience) : true }
}

/**
 * Update guarded by the `updated_at` the editor started from, so a concurrent
 * edit by another member is reported instead of silently overwritten.
 * Pass `expectedUpdatedAt = null` to overwrite deliberately.
 */
export async function updateTripEvent(groupId: string, eventId: string, expectedUpdatedAt: string | null, payload: EventPayload, audience: string[]): Promise<EventSaved> {
  let query = supabase.from('trip_events').update(payload).eq('group_id', groupId).eq('id', eventId)
  if (expectedUpdatedAt) query = query.eq('updated_at', expectedUpdatedAt)
  const { data, error } = await query.select('id')
  if (error) throw new EventSaveError('failed')
  if (!data.length) {
    const { data: existing, error: readError } = await supabase.from('trip_events').select('id').eq('group_id', groupId).eq('id', eventId)
    if (readError) throw new EventSaveError('failed')
    throw new EventSaveError(existing.length ? 'conflict' : 'removed')
  }
  return { audienceSaved: await setAudience(groupId, eventId, audience) }
}

export async function deleteTripEvent(groupId: string, eventId: string) {
  const { error } = await supabase.from('trip_events').delete().eq('group_id', groupId).eq('id', eventId)
  if (error) throw new EventSaveError('failed')
}
