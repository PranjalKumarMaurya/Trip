import { useEffect, useMemo, useState } from 'react'
import type { MyGroupAccess } from '../groups/myGroupAccess'
import type { RosterMember } from '../groups/useGroupRoster'
import { useTripMemberProfiles } from '../groups/useTripMemberProfiles'
import { type CrewPhase, crewStatuses } from './crewStatus'
import type { TripEvent } from './itinerary'

const MOVING: ReadonlySet<CrewPhase> = new Set(['in-air', 'on-the-way', 'heading-home'])
const RESTING: ReadonlySet<CrewPhase> = new Set(['back-home', 'trip-over'])

/** Compact "who's where" strip for the top of the Trip tab; refreshes every minute. */
export function CrewStatusStrip({ trip, roster, events, audience, tripTimeZone }: {
  trip: MyGroupAccess
  roster: RosterMember[]
  events: TripEvent[]
  audience: Map<string, string[]>
  tripTimeZone: string
}) {
  const { profiles } = useTripMemberProfiles(trip.groupId)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  // The viewer first, then everyone else in roster order.
  const members = useMemo(() => {
    const active = roster.filter((member) => member.status === 'active')
    return [...active.filter((member) => member.groupMemberId === trip.groupMemberId),
      ...active.filter((member) => member.groupMemberId !== trip.groupMemberId)]
  }, [roster, trip.groupMemberId])
  const emoji = useMemo(() => new Map(profiles.map((profile) => [profile.groupMemberId, profile.avatarEmoji])), [profiles])
  const statuses = useMemo(() => crewStatuses(members, events, audience, {
    startDate: trip.startDate, endDate: trip.endDate, timeZone: tripTimeZone, destination: trip.destination,
  }, now), [members, events, audience, trip.startDate, trip.endDate, trip.destination, tripTimeZone, now])

  if (!members.length) return null

  return (
    <section aria-labelledby="crew-status-heading" data-testid="crew-status">
      <p id="crew-status-heading" className="serif-eyebrow" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>the crew, right now</p>
      <ul className="-mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1" style={{ scrollSnapType: 'x proximity' }}>
        {members.map((member) => {
          const status = statuses.get(member.groupMemberId)
          if (!status) return null
          const isMe = member.groupMemberId === trip.groupMemberId
          const firstName = member.displayName.trim().split(/\s+/u)[0] || member.displayName
          return (
            <li key={member.groupMemberId} data-testid="crew-status-member" data-phase={status.phase}
              className="surface relative flex w-[116px] shrink-0 flex-col items-center gap-1 px-2 pb-2.5 pt-3 text-center"
              style={{ scrollSnapAlign: 'start', borderColor: isMe ? 'rgba(255,139,77,0.4)' : undefined, opacity: RESTING.has(status.phase) ? 0.6 : 1 }}>
              {MOVING.has(status.phase) && <span aria-hidden="true" className="animate-pulse-soft absolute right-2 top-2"
                style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />}
              <span aria-hidden="true" className="flex items-center justify-center" style={{
                width: 34, height: 34, borderRadius: '50%', background: 'var(--accent-soft)', border: '1px solid var(--border-strong)',
                color: 'var(--text-primary)', fontSize: emoji.get(member.groupMemberId) ? 18 : 14, fontWeight: 600,
              }}>
                {emoji.get(member.groupMemberId) || firstName.charAt(0).toUpperCase()}
              </span>
              <span className="w-full truncate" style={{ color: 'var(--text-secondary)', fontSize: 12 }} title={member.displayName}>
                {firstName}{isMe ? ' (you)' : ''}
              </span>
              <span className="sr-only">: </span>
              <span className="w-full truncate" style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }} title={status.label}>{status.label}</span>
              {status.detail && <>
                <span className="sr-only">, </span>
                <span className="font-mono w-full truncate" style={{ color: 'var(--text-tertiary)', fontSize: 10.5 }}>{status.detail}</span>
              </>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
