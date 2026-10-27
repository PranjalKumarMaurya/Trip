import { useEffect, useState } from 'react'
import { InviteMember } from '../invitations/InviteMember'
import type { RosterMember } from '../groups/useGroupRoster'
import { useTripMemberProfiles } from '../groups/useTripMemberProfiles'
import type { TripTabProps } from '../workspace/tripTab'
import { type ActionSheetResult, type ActionSpec, ActionSheet, buttonClass, quietButtonStyle } from './ActionSheet'
import { changeMemberRole, deactivateMembership, setTripArchiveState, transferOwnership } from './crewApi'
import { CrewInfo } from './CrewInfo'
import { type CrewViewer, canStepDown, crewErrorView, leaveBlockReason, memberActionsFor } from './crewRules'
import { InvitationList } from './InvitationList'

type Sheet =
  | { kind: 'member'; member: RosterMember }
  | { kind: 'leave' }
  | { kind: 'step-down' }
  | { kind: 'archive' }

export function CrewTab({ trip, roster, reloadRoster, onTripsChanged }: TripTabProps) {
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const [notice, setNotice] = useState('')
  const [invitationReload, setInvitationReload] = useState(0)
  const viewer: CrewViewer = { groupMemberId: trip.groupMemberId, role: trip.role }
  const isOwner = trip.role === 'owner'
  const active = roster.filter((member) => member.status === 'active')
  const former = roster.filter((member) => member.status === 'inactive')
  const groupId = trip.groupId
  const profiles = useTripMemberProfiles(groupId)
  const [expanded, setExpanded] = useState<string | null>(null)
  const profileOf = (memberId: string) => profiles.profiles.find((profile) => profile.groupMemberId === memberId)

  // Others may have joined or changed roles since the workspace opened.
  useEffect(() => { reloadRoster() }, [reloadRoster])
  const refreshCrew = () => {
    setNotice('')
    reloadRoster()
    profiles.reload()
    setInvitationReload((value) => value + 1)
  }

  const memberSpecs = (member: RosterMember): ActionSpec[] => memberActionsFor(viewer, member).map((kind) => {
    const name = member.displayName
    switch (kind) {
      case 'promote':
        return {
          id: kind, menuLabel: 'Make Owner', title: `Make ${name} an Owner?`,
          body: 'Owners can invite and remove people, change roles, and archive the Trip. Any Owner can undo this.',
          confirmLabel: 'Make Owner', busyLabel: 'Updating role…',
          run: async (requestId) => { await changeMemberRole(groupId, member.groupMemberId, 'owner', requestId); return `${name} is now an Owner.` },
          describeError: (code) => crewErrorView('promote', code, name),
        }
      case 'demote':
        return {
          id: kind, menuLabel: 'Make Member', title: `Make ${name} a Member?`,
          body: `${name} stays in the Trip with their history but can no longer manage the crew. Any Owner can undo this.`,
          confirmLabel: 'Make Member', busyLabel: 'Updating role…',
          run: async (requestId) => { await changeMemberRole(groupId, member.groupMemberId, 'member', requestId); return `${name} is now a Member.` },
          describeError: (code) => crewErrorView('demote', code, name),
        }
      case 'transfer':
        return {
          id: kind, menuLabel: 'Transfer ownership', title: `Transfer ownership to ${name}?`, tone: 'danger',
          body: `${name} becomes an Owner and you become a Member. Only an Owner can make you an Owner again.`,
          confirmLabel: 'Transfer ownership', busyLabel: 'Transferring…',
          run: async (requestId) => { await transferOwnership(groupId, member.groupMemberId, requestId); return `${name} is now an Owner. You are a Member.` },
          describeError: (code) => crewErrorView('transfer', code, name),
        }
      case 'remove':
        return {
          id: kind, menuLabel: 'Remove from Trip', title: `Remove ${name} from the Trip?`, tone: 'danger',
          body: `${name} loses access to this Trip straight away. Their expenses, todos and history stay attributed to them; nothing is deleted. You can invite them again later.`,
          confirmLabel: 'Remove from Trip', busyLabel: 'Removing…',
          run: async (requestId) => { await deactivateMembership(groupId, member.groupMemberId, 'remove', requestId); return `${name} was removed. Their history stays in the Trip.` },
          describeError: (code) => crewErrorView('remove', code, name),
        }
    }
  })

  const leaveBlocked = leaveBlockReason(viewer, roster)
  const leaveSpec: ActionSpec = {
    id: 'leave', menuLabel: 'Leave Trip', title: leaveBlocked ? 'Hand over before you leave' : 'Leave this Trip?', tone: 'danger',
    body: `You lose access to ${trip.tripName} straight away. Your expenses and history stay in the Trip. An Owner can invite you back.`,
    blocked: leaveBlocked ?? undefined,
    confirmLabel: 'Leave Trip', busyLabel: 'Leaving…',
    run: async (requestId) => { await deactivateMembership(groupId, trip.groupMemberId, 'leave', requestId); return `You left ${trip.tripName}.` },
    describeError: (code) => crewErrorView('leave', code),
  }

  const stepDownSpec: ActionSpec = {
    id: 'step-down', menuLabel: 'Step down to Member', title: 'Step down to Member?',
    body: 'You stay in the Trip but can no longer manage the crew. Another Owner can make you an Owner again.',
    confirmLabel: 'Step down', busyLabel: 'Updating role…',
    run: async (requestId) => { await changeMemberRole(groupId, trip.groupMemberId, 'member', requestId); return 'You are now a Member.' },
    describeError: (code) => crewErrorView('step_down', code),
  }

  const archiveSpec: ActionSpec = {
    id: 'archive', menuLabel: 'Archive Trip', title: `Archive ${trip.tripName}?`,
    body: 'The Trip closes for everyone: nobody can open or change it, and pending invitations stop working. Nothing is deleted, and any Owner can restore it later from Archived Trips.',
    confirmLabel: 'Archive Trip', busyLabel: 'Archiving…',
    run: async (requestId) => { await setTripArchiveState(groupId, 'archived', requestId); return `${trip.tripName} is archived. Restore it any time from Archived Trips.` },
    describeError: (code) => crewErrorView('archive', code),
  }

  const closeSheet = (result: ActionSheetResult, message?: string) => {
    setSheet(null)
    if (result === 'cancelled') return
    setNotice(message ?? '')
    // Server-confirmed change (or a refusal that shows our view was stale): re-read both.
    reloadRoster()
    onTripsChanged?.()
  }

  const sheetView = (() => {
    if (!sheet) return null
    if (sheet.kind === 'member') {
      const specs = memberSpecs(sheet.member)
      return <ActionSheet title={`Manage ${sheet.member.displayName}`} actions={specs} testId="member-actions-sheet"
        intro={`${sheet.member.displayName} is ${sheet.member.role === 'owner' ? 'an Owner' : 'a Member'} of this Trip.`}
        onClose={closeSheet} />
    }
    const spec = sheet.kind === 'leave' ? leaveSpec : sheet.kind === 'step-down' ? stepDownSpec : archiveSpec
    return <ActionSheet title={spec.title} actions={[spec]} testId={`${spec.id}-sheet`}
      onClose={closeSheet} />
  })()

  return (
    <section data-testid="crew-tab" className="flex flex-col gap-6">
      <div className="surface px-4 py-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="serif-display" style={{ color: 'var(--text-primary)', fontSize: 25 }}>Crew</h2>
          <button type="button" onClick={refreshCrew} className="text-sm" style={{ color: 'var(--text-secondary)' }}>Refresh crew</button>
        </div>
        {notice && <p role="status" className="mt-2" style={{ color: 'var(--text-secondary)' }}>{notice}</p>}
        {active.length === 0 && <p className="mt-3" style={{ color: 'var(--text-secondary)' }}>The crew list is not available right now. Try Refresh crew.</p>}
        <ul className="mt-3 flex flex-col gap-2" aria-label="Trip members">
          {active.map((member) => {
            const manageable = memberActionsFor(viewer, member).length > 0
            const isMe = member.groupMemberId === trip.groupMemberId
            const label = `${member.displayName}${isMe ? ' (you)' : ''}`
            const open = expanded === member.groupMemberId
            const infoId = `crew-info-${member.groupMemberId}`
            const emoji = profileOf(member.groupMemberId)?.avatarEmoji
            return (
              <li key={member.groupMemberId} style={{ color: 'var(--text-primary)' }}>
                <div className="flex items-center justify-between gap-3" style={{ minHeight: 44 }}>
                  <button type="button" aria-expanded={open} aria-controls={infoId} aria-label={`Details for ${label}`}
                    onClick={() => setExpanded(open ? null : member.groupMemberId)} className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 text-left">
                    <span aria-hidden="true" className="flex shrink-0 items-center justify-center" style={{
                      width: 30, height: 30, borderRadius: '50%', background: 'var(--accent-soft)', border: '1px solid var(--border-strong)',
                      fontSize: emoji ? 16 : 13, fontWeight: 600,
                    }}>{emoji || member.displayName.trim().charAt(0).toUpperCase()}</span>
                    <span className="min-w-0 truncate">{label}</span>
                    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                      className="shrink-0 transition-transform" style={{ color: 'var(--text-tertiary)', transform: open ? 'rotate(180deg)' : undefined }}><path d="m6 9 6 6 6-6" /></svg>
                  </button>
                  <span className="flex shrink-0 items-center gap-3">
                    <span style={{ color: 'var(--text-secondary)' }}>{member.role === 'owner' ? 'Owner' : 'Member'}</span>
                    {manageable && <button type="button" aria-label={`Manage ${member.displayName}`} onClick={() => { setNotice(''); setSheet({ kind: 'member', member }) }}
                      className={buttonClass} style={quietButtonStyle}>Manage</button>}
                  </span>
                </div>
                {open && <CrewInfo id={infoId} name={member.displayName} isMe={isMe} profile={profileOf(member.groupMemberId)}
                  loading={profiles.loading} error={profiles.error} />}
              </li>
            )
          })}
        </ul>
        {former.length > 0 && <details className="mt-4">
          <summary style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}>Former members ({former.length})</summary>
          <ul aria-label="Former members" className="mt-2 flex flex-col gap-1">
            {former.map((member) => (
              <li key={member.groupMemberId} className="flex justify-between" style={{ color: 'var(--text-tertiary)' }}>
                <span>{member.displayName}</span><span>No longer in the Trip</span>
              </li>
            ))}
          </ul>
        </details>}
      </div>
      {isOwner && <InviteMember groupId={groupId} tripName={trip.tripName} onIssued={() => setInvitationReload((value) => value + 1)} />}
      {isOwner && <InvitationList groupId={groupId} reloadKey={invitationReload} />}
      <section aria-label="Your membership" className="surface px-4 py-5">
        <h2 className="serif-display" style={{ color: 'var(--text-primary)', fontSize: 25 }}>Your membership</h2>
        <p className="mt-2" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          You are {isOwner ? 'an Owner' : 'a Member'} of this Trip.{isOwner ? '' : ' Owners manage the crew; ask one of them to change roles.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {canStepDown(viewer, roster) && <button type="button" onClick={() => { setNotice(''); setSheet({ kind: 'step-down' }) }} className={buttonClass} style={quietButtonStyle}>Step down to Member</button>}
          <button type="button" onClick={() => { setNotice(''); setSheet({ kind: 'leave' }) }} className={buttonClass} style={{ ...quietButtonStyle, color: 'var(--neon-pink)' }}>Leave Trip</button>
        </div>
        {isOwner && <div className="mt-6">
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Archiving closes the Trip for everyone until an Owner restores it.</p>
          <button type="button" onClick={() => { setNotice(''); setSheet({ kind: 'archive' }) }} className={`${buttonClass} mt-3`} style={quietButtonStyle}>Archive Trip</button>
        </div>}
      </section>
      {sheetView}
    </section>
  )
}
