import { useCallback, useEffect, useState } from 'react'
import { ActionSheet, buttonClass, quietButtonStyle } from './ActionSheet'
import { listGroupInvitations, revokeInvitation } from './crewApi'
import {
  type InvitationRow, crewErrorView, formatDay, formatInstant, invitationStatusLabel, splitInvitations,
} from './crewRules'

type ListState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; items: InvitationRow[]; liveCount: number }

/**
 * Owner-only invitation management (MBR-04): recipient, status, expiry, revoke.
 * The list never carries proofs; the one-time link is only shown by InviteMember.
 */
export function InvitationList({ groupId, reloadKey }: { groupId: string; reloadKey: number }) {
  const [state, setState] = useState<ListState>({ kind: 'loading' })
  const [localReload, setLocalReload] = useState(0)
  const [revoking, setRevoking] = useState<InvitationRow | null>(null)

  useEffect(() => {
    let active = true
    void listGroupInvitations(groupId).then(
      (result) => { if (active) setState({ kind: 'ready', ...result }) },
      () => { if (active) setState({ kind: 'error' }) },
    )
    return () => { active = false }
  }, [groupId, reloadKey, localReload])

  const reload = useCallback(() => setLocalReload((value) => value + 1), [])
  const { pending, past } = state.kind === 'ready' ? splitInvitations(state.items) : { pending: [], past: [] }

  return (
    <section data-testid="invitation-list" aria-label="Invitations" className="surface px-4 py-5">
      <h2 className="serif-display" style={{ color: 'var(--text-primary)', fontSize: 25 }}>Invitations</h2>
      {state.kind === 'loading' && <p className="mt-3" style={{ color: 'var(--text-secondary)' }}>Loading invitations…</p>}
      {state.kind === 'error' && <div className="mt-3">
        <p role="alert" style={{ color: 'var(--text-secondary)' }}>We could not load invitations.</p>
        <button type="button" onClick={reload} className={`${buttonClass} mt-3`} style={quietButtonStyle}>Try again</button>
      </div>}
      {state.kind === 'ready' && <>
        <p className="mt-2" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          {state.liveCount === 1 ? '1 live link' : `${state.liveCount} live links`}. Links are shown only once, when you create them.
        </p>
        {pending.length === 0
          ? <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>No pending invitations.</p>
          : <ul aria-label="Pending invitations" className="mt-4 flex flex-col gap-3">
            {pending.map((item) => (
              <li key={item.invitationId} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate" style={{ color: 'var(--text-primary)' }}>{item.recipientEmail}</p>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{invitationStatusLabel(item.status)} · Expires {formatInstant(item.expiresAt)}</p>
                </div>
                <button type="button" aria-label={`Revoke invitation for ${item.recipientEmail}`} onClick={() => setRevoking(item)}
                  className={buttonClass} style={{ ...quietButtonStyle, color: 'var(--neon-pink)' }}>Revoke</button>
              </li>
            ))}
          </ul>}
        {past.length > 0 && <details className="mt-4">
          <summary style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}>Past invitations ({past.length})</summary>
          <ul aria-label="Past invitations" className="mt-3 flex flex-col gap-2">
            {past.map((item) => (
              <li key={item.invitationId} className="flex justify-between gap-3" style={{ fontSize: 14 }}>
                <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{item.recipientEmail}</span>
                <span style={{ color: 'var(--text-tertiary)' }}>{invitationStatusLabel(item.status)} · {formatDay(item.createdAt)}</span>
              </li>
            ))}
          </ul>
        </details>}
      </>}
      {revoking && <ActionSheet title="Revoke invitation" testId="revoke-invitation-sheet" onClose={(result) => {
        setRevoking(null)
        if (result !== 'cancelled') reload()
      }} actions={[{
        id: 'revoke',
        menuLabel: 'Revoke invitation',
        title: `Revoke the invitation for ${revoking.recipientEmail}?`,
        body: 'The link stops working straight away. You can create a new one later.',
        confirmLabel: 'Revoke invitation',
        busyLabel: 'Revoking…',
        tone: 'danger',
        run: async (requestId) => {
          const outcome = await revokeInvitation(groupId, revoking.invitationId, requestId)
          return outcome === 'expired' ? 'That invitation had already expired. Its link does not work.'
            : outcome === 'already_terminal' ? 'That invitation was already used or revoked.'
              : 'Invitation revoked. The link no longer works.'
        },
        describeError: (code) => crewErrorView('revoke', code),
      }]} />}
    </section>
  )
}
