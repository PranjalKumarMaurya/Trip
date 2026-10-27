import { useEffect, useState } from 'react'
import { ActionSheet, buttonClass, quietButtonStyle } from './ActionSheet'
import { loadArchivedTrips, setTripArchiveState } from './crewApi'
import { type ArchivedTrip, crewErrorView, formatCalendarDate, formatDay } from './crewRules'

/**
 * Archived Trips the viewer still owns, with Restore (GRP-17/18). Archived Trips
 * are hidden everywhere else, so this is the only way back. Renders nothing while
 * loading, on failure, or when there are none.
 */
export function ArchivedTrips({ refreshKey, onRestored, className = '' }: {
  /** Changes whenever the active Trip list changes, so a just-archived Trip appears. */
  refreshKey: string
  onRestored: (groupId: string) => void
  className?: string
}) {
  const [trips, setTrips] = useState<ArchivedTrip[]>([])
  const [reload, setReload] = useState(0)
  const [restoring, setRestoring] = useState<ArchivedTrip | null>(null)

  useEffect(() => {
    let active = true
    void loadArchivedTrips().then(
      (rows) => { if (active) setTrips(rows) },
      () => { /* keep the last list; nothing to restore is shown on failure */ },
    )
    return () => { active = false }
  }, [refreshKey, reload])

  if (trips.length === 0 && !restoring) return null

  return (
    <section data-testid="archived-trips" aria-label="Archived Trips" className={`surface px-4 py-5 ${className}`}>
      <h2 className="serif-display" style={{ color: 'var(--text-primary)', fontSize: 20 }}>Archived Trips</h2>
      <p className="mt-1.5" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
        Closed for everyone until an Owner restores them. Nothing in them was deleted.
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {trips.map((trip) => (
          <li key={trip.groupId} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate" style={{ color: 'var(--text-primary)' }}>{trip.tripName}</p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                {trip.destination} · {formatCalendarDate(trip.startDate)} · Archived {formatDay(trip.archivedAt)}
              </p>
            </div>
            <button type="button" aria-label={`Restore ${trip.tripName}`} onClick={() => setRestoring(trip)}
              className={buttonClass} style={quietButtonStyle}>Restore</button>
          </li>
        ))}
      </ul>
      {restoring && <ActionSheet title="Restore Trip" testId="restore-trip-sheet" onClose={(result) => {
        const restored = restoring
        setRestoring(null)
        setReload((value) => value + 1)
        if (result === 'success') onRestored(restored.groupId)
      }} actions={[{
        id: 'restore',
        menuLabel: 'Restore Trip',
        title: `Restore ${restoring.tripName}?`,
        body: 'Everyone who is still a member can open and change it again. Its records are exactly as they were when it was archived.',
        confirmLabel: 'Restore Trip',
        busyLabel: 'Restoring…',
        run: async (requestId) => {
          await setTripArchiveState(restoring.groupId, 'active', requestId)
          return `${restoring.tripName} is active again.`
        },
        describeError: (code) => crewErrorView('restore', code),
      }]} />}
    </section>
  )
}
