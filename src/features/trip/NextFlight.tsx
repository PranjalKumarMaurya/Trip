import { useEffect, useState } from 'react'
import { countdown, formatCountdown, type TripEvent } from './itinerary'
import { dualTime } from './tripTime'

/** Next-flight card with a ticking countdown (the v1 CountdownClock, simplified). */
export function NextFlight({ flight, tripTimeZone, localTimeZone }: { flight: TripEvent | null; tripTimeZone: string; localTimeZone: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!flight) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [flight])

  if (!flight) {
    return (
      <section aria-label="Next flight" data-testid="next-flight" className="surface px-4 py-4">
        <p className="serif-eyebrow" style={{ color: 'var(--accent)', fontSize: 12 }}>next flight</p>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>No upcoming flight.</p>
      </section>
    )
  }

  const parts = countdown(Date.parse(flight.starts_at), now)
  const time = dualTime(flight.starts_at, tripTimeZone, localTimeZone)
  const details = [flight.airline, flight.flight_no, flight.terminal && `Terminal ${flight.terminal}`].filter(Boolean).join(' · ')

  return (
    <section aria-label="Next flight" data-testid="next-flight" className="surface px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="serif-eyebrow" style={{ color: 'var(--accent)', fontSize: 12 }}>next flight</p>
        {flight.flight_no && <span className="pill font-mono">{flight.flight_no}</span>}
      </div>
      <p className="serif-display mt-1 truncate" style={{ color: 'var(--text-primary)', fontSize: 19 }}>{flight.title}</p>
      {(flight.dep_code || flight.arr_code) && (
        <p className="serif-display mt-2" style={{ color: 'var(--text-primary)', fontSize: 28 }}>
          {flight.dep_code ?? '—'} <span aria-hidden="true" style={{ color: 'var(--text-tertiary)', fontSize: 16 }}>✈</span><span className="sr-only">to</span> {flight.arr_code ?? '—'}
        </p>
      )}
      <p className="font-mono mt-3" data-testid="next-flight-countdown" style={{ color: 'var(--text-primary)', fontSize: 22, letterSpacing: '0.06em' }}>
        <span className="sr-only">Departs in </span>{formatCountdown(parts)}
      </p>
      <p className="font-mono mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
        {time.tripDay} {time.trip} trip time{time.local ? ` · ${time.local.day} ${time.local.time} your time` : ''}
      </p>
      {details && <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>{details}</p>}
    </section>
  )
}
