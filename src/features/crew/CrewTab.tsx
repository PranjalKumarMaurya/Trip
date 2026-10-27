import { InviteMember } from '../invitations/InviteMember'
import type { TripTabProps } from '../workspace/tripTab'

export function CrewTab({ trip, roster }: TripTabProps) {
  const active = roster.filter((member) => member.status === 'active')
  return (
    <section data-testid="crew-tab" className="flex flex-col gap-6">
      <div className="surface px-4 py-5">
        <h2 className="serif-display" style={{ color: 'var(--text-primary)', fontSize: 25 }}>Crew</h2>
        <ul className="mt-3 flex flex-col gap-2" aria-label="Trip members">
          {active.map((member) => (
            <li key={member.groupMemberId} className="flex justify-between" style={{ color: 'var(--text-primary)' }}>
              <span>{member.displayName}{member.groupMemberId === trip.groupMemberId ? ' (you)' : ''}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{member.role === 'owner' ? 'Owner' : 'Member'}</span>
            </li>
          ))}
        </ul>
      </div>
      {trip.role === 'owner' && <InviteMember groupId={trip.groupId} />}
    </section>
  )
}
