import { useId, useState, type CSSProperties } from 'react'
import { eventTypeMeta, safeMapUrl, type EventStatus, type TripEvent } from './itinerary'
import { dualTime, formatTime } from './tripTime'

const STATUS_LABEL: Record<EventStatus, string> = { past: 'Past', live: 'Live now', next: 'Next', upcoming: 'Upcoming' }

const smallButton: CSSProperties = {
  fontSize: 12, color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px',
}

export function EventCard({ event, status, tripTimeZone, localTimeZone, audienceNames, onEdit, onDelete }: {
  event: TripEvent
  status: EventStatus
  tripTimeZone: string
  localTimeZone: string
  /** Names of the people this is for; empty means everyone. */
  audienceNames: string[]
  onEdit: () => void
  onDelete: () => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(false)
  const notesId = useId()
  const meta = eventTypeMeta(event.event_type)
  const start = dualTime(event.starts_at, tripTimeZone, localTimeZone)
  const end = event.ends_at ? dualTime(event.ends_at, tripTimeZone, localTimeZone) : null
  const mapUrl = safeMapUrl(event.map_url)
  const highlighted = status === 'live' || status === 'next'
  const isFlight = event.event_type === 'flight'
  const flightLine = [event.airline, event.flight_no, event.terminal && `Terminal ${event.terminal}`].filter(Boolean).join(' · ')

  const confirmDelete = async () => {
    setDeleting(true)
    setDeleteError(false)
    try {
      await onDelete()
    } catch {
      setDeleteError(true)
      setDeleting(false)
    }
  }

  return (
    <li data-testid="trip-event" data-status={status} aria-label={event.title} className="flex items-start gap-3">
      <span aria-hidden="true" className="relative flex shrink-0 items-center justify-center" style={{
        width: 38, height: 38, borderRadius: '50%', background: 'var(--bg-base)', fontSize: 16,
        border: `1px solid ${highlighted ? 'var(--accent)' : 'var(--border-strong)'}`,
      }}>
        {meta.icon}
      </span>
      <article className="surface min-w-0 flex-1 px-4 py-3.5" style={{
        borderColor: status === 'live' ? 'var(--accent)' : status === 'next' ? 'rgba(255,139,77,0.35)' : undefined,
        opacity: status === 'past' ? 0.55 : 1,
      }}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="serif-display min-w-0" style={{ fontSize: 18, fontWeight: 400, color: 'var(--text-primary)', lineHeight: 1.25 }}>
            {event.notes
              ? <button type="button" aria-expanded={expanded} aria-controls={notesId} onClick={() => setExpanded((value) => !value)} className="text-left">{event.title}</button>
              : event.title}
          </h3>
          <span className="pill shrink-0" style={{ color: highlighted ? 'var(--accent)' : 'var(--text-tertiary)', borderColor: highlighted ? 'rgba(255,139,77,0.45)' : undefined }}>
            {STATUS_LABEL[status]}
          </span>
        </div>

        <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span>{start.tripDay} · </span>
          <span className="font-mono">{start.trip}{end ? `–${end.tripDay === start.tripDay ? end.trip : `${end.tripDay} ${end.trip}`}` : ''}</span>
          <span style={{ color: 'var(--text-tertiary)' }}> trip time</span>
        </p>
        {start.local && (
          <p className="font-mono text-xs" data-testid="event-local-time" style={{ color: 'var(--text-tertiary)' }}>
            {start.local.day} · {start.local.time}{end?.local ? `–${formatTime(event.ends_at as string, localTimeZone)}` : ''} your time
          </p>
        )}

        {(event.location || event.location_to) && (
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {event.location}
            {event.location_to && <><span aria-hidden="true" style={{ color: 'var(--text-quaternary)', margin: '0 6px' }}>→</span><span className="sr-only"> to </span>{event.location_to}</>}
          </p>
        )}
        {isFlight && (event.dep_code || event.arr_code || flightLine) && (
          <p className="font-mono mt-2 text-xs" data-testid="event-flight" style={{ color: 'var(--text-secondary)' }}>
            {(event.dep_code || event.arr_code) && <span>{event.dep_code ?? '—'} → {event.arr_code ?? '—'}</span>}
            {flightLine && <span>{event.dep_code || event.arr_code ? ' · ' : ''}{flightLine}</span>}
          </p>
        )}
        {event.booking_ref && <p className="font-mono mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>Booking {event.booking_ref}</p>}
        <p className="mt-2 text-xs" data-testid="event-audience" style={{ color: 'var(--text-tertiary)' }}>
          {audienceNames.length ? `For ${audienceNames.join(', ')}` : 'For everyone'}
        </p>

        {expanded && event.notes && (
          <p id={notesId} className="font-mono mt-2.5 whitespace-pre-wrap pt-2.5 text-xs animate-fade-in" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            {event.notes}
          </p>
        )}

        {confirming ? (
          <div role="group" aria-label={`Confirm deleting ${event.title}`} className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Delete this for everyone?</span>
            <button type="button" disabled={deleting} onClick={() => void confirmDelete()} style={{ ...smallButton, color: '#1A0A03', background: 'var(--accent)', borderColor: 'var(--accent)' }}>
              {deleting ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button type="button" disabled={deleting} onClick={() => setConfirming(false)} style={smallButton}>Keep it</button>
            {deleteError && <p role="alert" className="w-full text-xs" style={{ color: 'var(--accent)' }}>Could not delete. Try again.</p>}
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {mapUrl && <a href={mapUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open map for ${event.title}`} style={smallButton}>↗ Map</a>}
            <button type="button" aria-label={`Edit ${event.title}`} onClick={onEdit} style={smallButton}>Edit</button>
            <button type="button" aria-label={`Delete ${event.title}`} onClick={() => setConfirming(true)} style={smallButton}>Delete</button>
          </div>
        )}
      </article>
    </li>
  )
}
