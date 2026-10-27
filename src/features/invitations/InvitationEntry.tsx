import { useEffect, useRef, useState } from 'react'
import { AuthEntry } from '../auth/AuthEntry'
import type { AuthSessionState } from '../auth/authSession'
import { acceptInvitation, inspectInvitation, type InvitationInspection } from './invitationApi'

type ViewState =
  | { kind: 'loading' }
  | { kind: 'inspection-error' }
  | { kind: 'inspected'; value: InvitationInspection }
  | { kind: 'accepting' }
  | { kind: 'accept-error'; message: string; retryable: boolean }
  | { kind: 'accepted'; groupId: string }

export function InvitationEntry({ proof, auth, onSignOut, onClose, onAccepted, signOutError }: {
  proof: string
  auth: AuthSessionState
  onSignOut: () => void
  onClose: () => void
  onAccepted: () => void
  signOutError?: string | null
}) {
  const [view, setView] = useState<ViewState>({ kind: 'loading' })
  const [showAuth, setShowAuth] = useState(false)
  const [inspectionAttempt, setInspectionAttempt] = useState(0)
  const requestIdRef = useRef<string | null>(null)
  const userId = auth.status === 'authenticated-linked' || auth.status === 'authenticated-unlinked'
    ? auth.session.user.id : null

  useEffect(() => {
    let current = true
    setView({ kind: 'loading' })
    void inspectInvitation(proof).then(
      (value) => { if (current) setView({ kind: 'inspected', value }) },
      () => { if (current) setView({ kind: 'inspection-error' }) },
    )
    return () => { current = false }
  }, [proof, userId, inspectionAttempt])

  const retryInspection = () => {
    setInspectionAttempt((attempt) => attempt + 1)
  }

  const accept = async () => {
    if (view.kind === 'accepting' || view.kind === 'accepted') return
    const requestId = requestIdRef.current ?? crypto.randomUUID()
    requestIdRef.current = requestId
    setView({ kind: 'accepting' })
    try {
      const groupId = await acceptInvitation(proof, requestId)
      setView({ kind: 'accepted', groupId })
      onAccepted()
    } catch (error) {
      if (error instanceof Error && error.message === 'already_member') {
        setView({ kind: 'accept-error', message: 'You are already a member of this Trip. The invitation was not used.', retryable: false })
      } else if (error instanceof Error && error.message === 'invalid_invitation') {
        setView({ kind: 'accept-error', message: 'This invitation can no longer be accepted. Ask the Owner for a new link.', retryable: false })
      } else {
        setView({ kind: 'accept-error', message: 'We could not confirm whether you joined. Retry this same request safely.', retryable: true })
      }
    }
  }

  const inspected = view.kind === 'inspected' ? view.value : null
  const context = inspected?.tripName && inspected.destination
    ? `${inspected.tripName} · ${inspected.destination}` : null

  if (showAuth && auth.status === 'signed-out') {
    return <AuthEntry mode="sign-in" contextMessage="Your Trip invitation will be checked after you sign in or create an account." />
  }

  return (
    <main data-testid="invitation-entry" className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center px-5 py-10">
      <p className="font-mono" style={{ color: 'var(--text-tertiary)', fontSize: 10, letterSpacing: '0.22em' }}>TRIP INVITATION</p>
      <h1 className="serif-display" style={{ color: 'var(--text-primary)', fontSize: 34, fontWeight: 400, marginTop: 12 }}>Join a Trip</h1>
      {context && <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>{context}</p>}
      <section aria-live="polite" className="surface mt-6 px-4 py-4" style={{ color: 'var(--text-secondary)' }}>
        {view.kind === 'loading' && <p>Checking this invitation. Nothing has been accepted yet.</p>}
        {view.kind === 'inspection-error' && <>
          <p>We could not check this invitation right now.</p>
          <button type="button" onClick={retryInspection}>Try again</button>
        </>}
        {inspected?.outcome === 'invalid' && <p>This invitation is unavailable. Ask the Owner for a new link.</p>}
        {inspected?.outcome === 'expired' && <p>This invitation expired. Ask the Owner for a new link.</p>}
        {inspected?.outcome === 'revoked' && <p>This invitation was revoked. Ask the Owner for a new link.</p>}
        {inspected?.outcome === 'used' && <p>This invitation has already been used.</p>}
        {inspected?.outcome === 'continue' && <>
          <p>Sign in or create an account to continue. Nothing has been accepted yet. The invitation will be checked again after you sign in.</p>
          <button type="button" onClick={() => setShowAuth(true)} className="mt-4">Continue</button>
        </>}
        {inspected?.outcome === 'verification_required' && <p>Verify your email, then return here to continue. No membership has been created.</p>}
        {inspected?.outcome === 'switch_account' && <>
          <p>This link belongs to another verified email. Signed in as {auth.status === 'authenticated-linked' || auth.status === 'authenticated-unlinked' ? auth.session.user.email : 'another account'}.</p>
          <button type="button" onClick={onSignOut} className="mt-4">Switch account</button>
          {signOutError && <p role="alert">{signOutError}</p>}
        </>}
        {inspected?.outcome === 'ready' && <>
          <p>Join as an ordinary Member? The Trip will see your membership after you confirm.</p>
          <button type="button" onClick={() => void accept()} className="mt-4">Confirm and join</button>
        </>}
        {view.kind === 'accepting' && <p>Joining this Trip…</p>}
        {view.kind === 'accept-error' && <>
          <p role="alert">{view.message}</p>
          {view.retryable && <button type="button" onClick={() => void accept()} className="mt-4">Retry acceptance</button>}
        </>}
        {view.kind === 'accepted' && <p>Joined successfully. Your Trip is ready when the Group workspace opens.</p>}
      </section>
      <button type="button" onClick={onClose} className="mt-6 self-start" style={{ color: 'var(--text-secondary)' }}>Close invitation</button>
    </main>
  )
}
