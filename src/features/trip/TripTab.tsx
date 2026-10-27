import { useEffect, useMemo, useState } from 'react'
import { NeonBtn } from '../../components/ui/NeonBtn'
import type { TripTabProps } from '../workspace/tripTab'
import { CrewStatusStrip } from './CrewStatusStrip'
import { EventCard } from './EventCard'
import { EventDialog, type SaveEvent } from './EventDialog'
import { NextFlight } from './NextFlight'
import { eventStatuses, nextFlight, type TripEvent } from './itinerary'
import { createTripEvent, deleteTripEvent, updateTripEvent, useItinerary } from './tripEventsApi'
import { clocksDiffer, dayKey, formatDay, resolveTripTimeZone, timeZoneCity, viewerTimeZone } from './tripTime'
import { LiveBadge } from './useLiveRefetch'

type Editing = { mode: 'add' } | { mode: 'edit'; event: TripEvent }

export function TripTab({ trip, roster }: TripTabProps) {
  const { events, audience, loading, error, live, reload } = useItinerary(trip.groupId)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [localTimeZone] = useState(viewerTimeZone)
  const [notice, setNotice] = useState<string | null>(null)
  const tripZone = resolveTripTimeZone(trip.timezone)

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
      const key = dayKey(event.starts_at, tripZone)
      const last = groups[groups.length - 1]
      if (last?.key === key) last.events.push(event)
      else groups.push({ key, label: formatDay(event.starts_at, tripZone), events: [event] })
    }
    return groups
  }, [events, tripZone])

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

  // Compare clock offsets, not names: browsers may report an old alias (Asia/Calcutta for Asia/Kolkata).
  const showsLocal = clocksDiffer([new Date().toISOString()], tripZone, localTimeZone)

  return (
    <section data-testid="trip-tab" className="flex flex-col gap-6">
      {/* Statuses come from the itinerary, so wait for it rather than guess. */}
      {!loading && !error && <CrewStatusStrip trip={trip} roster={roster} events={events} audience={audience} tripTimeZone={tripZone} />}
      <NextFlight flight={flight} tripTimeZone={tripZone} localTimeZone={localTimeZone} />

      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="serif-display" style={{ color: 'var(--text-primary)', fontSize: 25 }}>Itinerary</h2>
          <NeonBtn type="button" variant="outline" color="#FF8B4D" className="min-h-11 shrink-0" onClick={() => setEditing({ mode: 'add' })}>
            Add event
          </NeonBtn>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span>Times in {timeZoneCity(tripZone)} time{showsLocal ? ` · yours shown below each` : ''}</span>
          <LiveBadge status={live} />
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
                      tripTimeZone={tripZone} localTimeZone={localTimeZone}
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
          tripTimeZone={tripZone}
          roster={roster}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  )
}
