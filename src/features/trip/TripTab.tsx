import { useEffect, useMemo, useState } from 'react'
import type { TripTabProps } from '../workspace/tripTab'
import { EventCard } from './EventCard'
import { EventDialog, type SaveEvent } from './EventDialog'
import { NextFlight } from './NextFlight'
import { eventStatuses, nextFlight, type TripEvent } from './itinerary'
import { createTripEvent, deleteTripEvent, updateTripEvent, useItinerary } from './tripEventsApi'
import { dayKey, formatDay, timeZoneCity, viewerTimeZone } from './tripTime'
import { LiveBadge } from './useLiveRefetch'

type Editing = { mode: 'add' } | { mode: 'edit'; event: TripEvent }

export function TripTab({ trip, roster }: TripTabProps) {
  const { events, audience, loading, error, live, reload } = useItinerary(trip.groupId)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [localTimeZone] = useState(viewerTimeZone)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const statuses = useMemo(() => eventStatuses(events, now), [events, now])
  const flight = useMemo(() => nextFlight(events, now), [events, now])
  const names = useMemo(() => new Map(roster.map((member) => [member.groupMemberId, member.displayName])), [roster])
  const days = useMemo(() => {
    const groups: { key: string; label: string; events: TripEvent[] }[] = []
    for (const event of events) {
      const key = dayKey(event.starts_at, trip.timezone)
      const last = groups[groups.length - 1]
      if (last?.key === key) last.events.push(event)
      else groups.push({ key, label: formatDay(event.starts_at, trip.timezone), events: [event] })
    }
    return groups
  }, [events, trip.timezone])

  const save: SaveEvent = async (payload, people, overwrite) => {
    const saved = editing?.mode === 'edit'
      ? await updateTripEvent(trip.groupId, editing.event.id, overwrite ? null : editing.event.updated_at, payload, people)
      : await createTripEvent(trip.groupId, trip.groupMemberId, payload, people)
    // The event is saved either way; never leave the dialog open to be saved twice.
    setNotice(saved.audienceSaved ? null : `“${payload.title}” was saved, but who’s on it was not. Edit it to try again.`)
    setEditing(null)
    void reload()
  }

  const remove = async (event: TripEvent) => {
    await deleteTripEvent(trip.groupId, event.id)
    void reload()
  }

  const showsLocal = localTimeZone !== trip.timezone

  return (
    <section data-testid="trip-tab" className="flex flex-col gap-6">
      <NextFlight flight={flight} tripTimeZone={trip.timezone} localTimeZone={localTimeZone} />

      <div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="serif-display" style={{ color: 'var(--text-primary)', fontSize: 25 }}>Itinerary</h2>
            <p className="font-mono mt-1" style={{ color: 'var(--text-tertiary)', fontSize: 10, letterSpacing: '0.08em' }}>
              Trip time: {timeZoneCity(trip.timezone)} ({trip.timezone}){showsLocal ? ` · your time: ${timeZoneCity(localTimeZone)}` : ''}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <LiveBadge status={live} />
            <button type="button" onClick={() => setEditing({ mode: 'add' })} className="rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
              Add event
            </button>
          </div>
        </div>

        {notice && (
          <p role="status" className="surface mt-4 px-3.5 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {notice} <button type="button" onClick={() => setNotice(null)} style={{ color: 'var(--accent)' }}>Dismiss</button>
          </p>
        )}
        {error && (
          <p role="alert" className="surface mt-4 px-3.5 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Could not load the itinerary. <button type="button" onClick={() => void reload()} style={{ color: 'var(--accent)' }}>Try again</button>
          </p>
        )}
        {loading ? (
          <p role="status" className="mt-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading itinerary…</p>
        ) : !error && events.length === 0 ? (
          <div className="surface mt-4 px-4 py-5" data-testid="itinerary-empty">
            <p className="serif-display" style={{ color: 'var(--text-secondary)', fontSize: 19 }}>Nothing planned yet.</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>Add flights, stays and plans. Everyone in the Trip sees them.</p>
          </div>
        ) : (
          <div className="relative mt-4 flex flex-col gap-5" data-testid="itinerary">
            {days.map((day) => (
              <section key={day.key} aria-label={day.label}>
                <p className="serif-eyebrow mb-2" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{day.label}</p>
                <ol className="flex flex-col gap-3">
                  {day.events.map((event) => (
                    <EventCard key={event.id} event={event} status={statuses.get(event.id) ?? 'upcoming'}
                      tripTimeZone={trip.timezone} localTimeZone={localTimeZone}
                      audienceNames={(audience.get(event.id) ?? []).map((id) => names.get(id) ?? 'a former member')}
                      onEdit={() => setEditing({ mode: 'edit', event })} onDelete={() => remove(event)} />
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <EventDialog
          key={editing.mode === 'edit' ? editing.event.id : 'add'}
          event={editing.mode === 'edit' ? editing.event : null}
          initialAudience={editing.mode === 'edit' ? audience.get(editing.event.id) ?? [] : []}
          tripTimeZone={trip.timezone}
          roster={roster}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  )
}
