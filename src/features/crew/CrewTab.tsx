import { useEffect, useState } from 'react'
import { InviteMember } from '../invitations/InviteMember'
import type { RosterMember } from '../groups/useGroupRoster'
import type { TripTabProps } from '../workspace/tripTab'
import { type ActionSheetResult, type ActionSpec, ActionSheet, buttonClass, quietButtonStyle } from './ActionSheet'
import { changeMemberRole, deactivateMembership, setTripArchiveState, transferOwnership } from './crewApi'
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

  // Others may have joined or changed roles since the workspace opened.
  useEffect(() => { reloadRoster() }, [reloadRoster])
  const refreshCrew = () => {
    setNotice('')
    reloadRoster()
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

  const leaveSpec: ActionSpec = {
    id: 'leave', menuLabel: 'Leave Trip', title: 'Leave this Trip?', tone: 'danger',
    body: `You lose access to ${trip.tripName} straight away. Your expenses and history stay in the Trip. An Owner can invite you back.`,
    blocked: leaveBlockReason(viewer, roster) ?? undefined,
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
        <ul className="mt-3 flex flex-col gap-2" aria-label="Trip members">
          {active.map((member) => {
            const manageable = memberActionsFor(viewer, member).length > 0
            return (
              <li key={member.groupMemberId} className="flex items-center justify-between gap-3" style={{ color: 'var(--text-primary)', minHeight: 40 }}>
                <span className="min-w-0 truncate">{member.displayName}{member.groupMemberId === trip.groupMemberId ? ' (you)' : ''}</span>
                <span className="flex shrink-0 items-center gap-3">
                  <span style={{ color: 'var(--text-secondary)' }}>{member.role === 'owner' ? 'Owner' : 'Member'}</span>
                  {manageable && <button type="button" aria-label={`Manage ${member.displayName}`} onClick={() => { setNotice(''); setSheet({ kind: 'member', member }) }}
                    className={buttonClass} style={quietButtonStyle}>Manage</button>}
                </span>
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
      {isOwner && <InviteMember groupId={groupId} onIssued={() => setInvitationReload((value) => value + 1)} />}
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
