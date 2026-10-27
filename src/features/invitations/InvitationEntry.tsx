import { type ReactNode, useEffect, useRef, useState } from 'react'
import { NeonBtn } from '../../components/ui/NeonBtn'
import { ScreenFrame } from '../../components/ui/ScreenFrame'
import { AuthEntry } from '../auth/AuthEntry'
import type { AuthSessionState } from '../auth/authSession'
import { formatTripDates } from '../onboarding/tripSettings'
import { acceptInvitation, inspectInvitation, type InvitationInspection } from './invitationApi'

type ViewState =
  | { kind: 'loading' }
  | { kind: 'inspection-error' }
  | { kind: 'inspected'; value: InvitationInspection }
  | { kind: 'accepting' }
  | { kind: 'accept-error'; reason: 'already-member' | 'invalid' | 'unknown' }
  | { kind: 'accepted'; groupId: string }

type TripSummary = { name: string; destination: string; startDate?: string; endDate?: string }

export function InvitationEntry({ proof, auth, onSignOut, onClose, onAccepted, onOpenTrip, signOutError }: {
  proof: string
  auth: AuthSessionState
  onSignOut: () => void
  onClose: () => void
  /** Called once the server confirms membership, with the joined Trip. */
  onAccepted: (groupId: string) => void
  /** "Open Trip" after joining; falls back to `onClose`. */
  onOpenTrip?: (groupId: string) => void
  signOutError?: string | null
}) {
  const [view, setView] = useState<ViewState>({ kind: 'loading' })
  const [trip, setTrip] = useState<TripSummary | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [inspectionAttempt, setInspectionAttempt] = useState(0)
  const requestIdRef = useRef<string | null>(null)
  const signedIn = auth.status === 'authenticated-linked' || auth.status === 'authenticated-unlinked'
  const userId = signedIn ? auth.session.user.id : null
  const signedInEmail = signedIn ? auth.session.user.email : undefined

  useEffect(() => {
    let current = true
    setView({ kind: 'loading' })
    void inspectInvitation(proof).then(
      (value) => {
        if (!current) return
        setView({ kind: 'inspected', value })
        if (value.tripName && value.destination) {
          setTrip({ name: value.tripName, destination: value.destination, startDate: value.startDate, endDate: value.endDate })
        }
      },
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
      onAccepted(groupId)
    } catch (error) {
      if (error instanceof Error && error.message === 'already_member') {
        setView({ kind: 'accept-error', reason: 'already-member' })
      } else if (error instanceof Error && error.message === 'invalid_invitation') {
        setView({ kind: 'accept-error', reason: 'invalid' })
      } else {
        setView({ kind: 'accept-error', reason: 'unknown' })
      }
    }
  }

  if (showAuth && auth.status === 'signed-out') {
    return <AuthEntry mode="sign-in" onBack={() => setShowAuth(false)}
      contextMessage={trip
        ? `Sign in or create an account to join ${trip.name}. We’ll bring you back to your invitation.`
        : 'Sign in or create an account to join this Trip. We’ll bring you back to your invitation.'} />
  }

  const outcome = view.kind === 'inspected' ? view.value.outcome : null
  const tripName = trip?.name ?? 'this Trip'
  const dates = trip?.startDate && trip.endDate ? formatTripDates(trip.startDate, trip.endDate) : null
  const invitedTitle = trip ? `You’re invited to ${trip.name} · ${trip.destination}` : 'You’re invited to a Trip'
  const leave = (label: string) => <NeonBtn type="button" variant="ghost" size="lg" className="w-full" onClick={onClose}>{label}</NeonBtn>
  const exitLabel = auth.status === 'authenticated-linked' ? 'Go to my Trips' : signedIn ? 'Continue' : 'Go to sign in'
  const askForNewLink = 'Ask the person who invited you to send a new link.'

  // Each state: a title, one plain sentence, one primary action, and at most one way out.
  let title: ReactNode = invitedTitle
  let body: ReactNode = null
  let actions: ReactNode = null

  if (view.kind === 'loading') {
    title = trip ? invitedTitle : 'Checking your invite'
    body = <span className="flex items-center gap-3"><span className="spinner" aria-hidden="true" />Checking this invite…</span>
  } else if (view.kind === 'inspection-error') {
    title = trip ? invitedTitle : 'Trip invitation'
    body = 'We couldn’t check this invite right now. Check your connection and try again.'
    actions = <><NeonBtn type="button" size="lg" className="w-full" onClick={retryInspection}>Try again</NeonBtn>{leave('Not now')}</>
  } else if (outcome === 'invalid') {
    title = 'This invite link doesn’t work'
    body = askForNewLink
    actions = <NeonBtn type="button" size="lg" className="w-full" onClick={onClose}>{exitLabel}</NeonBtn>
  } else if (outcome === 'expired') {
    title = 'This invite has expired'
    body = askForNewLink
    actions = <NeonBtn type="button" size="lg" className="w-full" onClick={onClose}>{exitLabel}</NeonBtn>
  } else if (outcome === 'revoked') {
    title = 'This invite was cancelled'
    body = askForNewLink
    actions = <NeonBtn type="button" size="lg" className="w-full" onClick={onClose}>{exitLabel}</NeonBtn>
  } else if (outcome === 'used') {
    title = 'This invite has already been used'
    body = `If you accepted it, the Trip is already in your list. Otherwise, ${askForNewLink.charAt(0).toLowerCase()}${askForNewLink.slice(1)}`
    actions = <NeonBtn type="button" size="lg" className="w-full" onClick={onClose}>{exitLabel}</NeonBtn>
  } else if (outcome === 'continue') {
    body = 'Sign in or create an account with the email address this invite was sent to. You join only after you confirm.'
    actions = <><NeonBtn type="button" size="lg" className="w-full" onClick={() => setShowAuth(true)}>Continue</NeonBtn>{leave('Not now')}</>
  } else if (outcome === 'verification_required') {
    body = 'Confirm your email address first: open the link we emailed you, then come back here and check again.'
    actions = <><NeonBtn type="button" size="lg" className="w-full" onClick={retryInspection}>Check again</NeonBtn>{leave('Not now')}</>
  } else if (outcome === 'switch_account') {
    body = <>This invite was sent to a different email address. You’re signed in as <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{signedInEmail ?? 'another account'}</strong>. Switch to the invited account to join.</>
    actions = <>
      {signOutError && <p role="alert" className="notice notice--error">{signOutError}</p>}
      <NeonBtn type="button" size="lg" className="w-full" onClick={onSignOut}>Switch account</NeonBtn>
      {leave('Not now')}
    </>
  } else if (outcome === 'ready') {
    body = <>Join <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{tripName}</strong> as a member? Everyone in the Trip will see you in the Crew.</>
    actions = <><NeonBtn type="button" size="lg" className="w-full" onClick={() => void accept()}>Confirm and join</NeonBtn>{leave('Not now')}</>
  } else if (view.kind === 'accepting') {
    body = `Joining ${tripName}…`
    actions = <NeonBtn type="button" size="lg" className="w-full" disabled>Joining…</NeonBtn>
  } else if (view.kind === 'accept-error' && view.reason === 'already-member') {
    title = 'You’re already in this Trip'
    body = 'This invite wasn’t needed, so it was left unused.'
    actions = <NeonBtn type="button" size="lg" className="w-full" onClick={onClose}>Go to my Trips</NeonBtn>
  } else if (view.kind === 'accept-error' && view.reason === 'invalid') {
    title = 'This invite can’t be used any more'
    body = askForNewLink
    actions = <NeonBtn type="button" size="lg" className="w-full" onClick={onClose}>{exitLabel}</NeonBtn>
  } else if (view.kind === 'accept-error') {
    body = <span role="alert">We couldn’t confirm whether you joined. It’s safe to try again — you won’t be added twice.</span>
    actions = <><NeonBtn type="button" size="lg" className="w-full" onClick={() => void accept()}>Try again</NeonBtn>{leave('Not now')}</>
  } else if (view.kind === 'accepted') {
    title = 'You’re in!'
    body = `You joined ${tripName}. Everyone in the Trip is in the Crew tab.`
    const joined = view.groupId
    actions = <NeonBtn type="button" size="lg" className="w-full" onClick={() => (onOpenTrip ? onOpenTrip(joined) : onClose())}>Open Trip</NeonBtn>
  }

  const showTripDetails = trip && title === invitedTitle

  return (
    <ScreenFrame testId="invitation-entry" title={title}
      eyebrow={<p className="eyebrow">Trip invitation</p>}
      lede={showTripDetails && dates ? dates : undefined}>
      <div aria-live="polite" className="flex flex-col gap-6">
        {body && <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.5 }}>{body}</p>}
        {actions && <div className="flex flex-col gap-3">{actions}</div>}
      </div>
    </ScreenFrame>
  )
}
