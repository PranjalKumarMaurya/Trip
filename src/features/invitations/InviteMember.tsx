import { type FormEvent, useRef, useState } from 'react'
import { NeonBtn } from '../../components/ui/NeonBtn'
import { NeonInput } from '../../components/ui/NeonInput'
import { createInvitation } from './invitationApi'
import { invitationShareUrl } from './invitationLink'

type IssueState =
  | { kind: 'idle' }
  | { kind: 'issuing' }
  | { kind: 'issued'; url: string; recipient: string }
  | { kind: 'already-issued' }
  | { kind: 'error'; message: string; retryable: boolean }

export function InviteMember({ groupId, onIssued }: {
  groupId: string
  /** Called once the server confirms an invitation, e.g. to refresh the invitation list. */
  onIssued?: () => void
}) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<IssueState>({ kind: 'idle' })
  const [copyMessage, setCopyMessage] = useState('')
  const requestIdRef = useRef<string | null>(null)

  const updateEmail = (value: string) => {
    requestIdRef.current = null
    setEmail(value)
    setState({ kind: 'idle' })
  }

  const issue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (state.kind === 'issuing' || state.kind === 'issued' || state.kind === 'already-issued') return
    const recipient = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      setState({ kind: 'error', message: 'Enter your friend’s email address.', retryable: false })
      return
    }
    const requestId = requestIdRef.current ?? crypto.randomUUID()
    requestIdRef.current = requestId
    setState({ kind: 'issuing' })
    try {
      const result = await createInvitation(groupId, recipient, requestId)
      if (result.outcome === 'already_completed') {
        setState({ kind: 'already-issued' })
        onIssued?.()
        return
      }
      const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin).toString()
      setState({ kind: 'issued', url: invitationShareUrl(baseUrl, result.proof), recipient })
      onIssued?.()
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'creation_unavailable'
      if (reason === 'invitation_already_pending') {
        setState({ kind: 'error', message: 'A live invitation already exists for this email. Revoke it before creating another.', retryable: false })
      } else if (reason === 'recipient_already_member') {
        setState({ kind: 'error', message: 'This person is already a member of the Trip.', retryable: false })
      } else if (reason === 'not_authorized') {
        setState({ kind: 'error', message: 'Only an active Owner of this Trip can invite a friend.', retryable: false })
      } else if (reason === 'idempotency_conflict') {
        setState({ kind: 'error', message: 'This request changed. Review the email before trying again.', retryable: false })
      } else {
        setState({ kind: 'error', message: 'We could not confirm whether the invitation was created. Retry this same request safely.', retryable: true })
      }
    }
  }

  // Forget the one-time link and start a new request for another recipient.
  const inviteAnother = () => {
    requestIdRef.current = null
    setEmail('')
    setCopyMessage('')
    setState({ kind: 'idle' })
  }

  const copy = async () => {
    if (state.kind !== 'issued') return
    try {
      await navigator.clipboard.writeText(state.url)
      setCopyMessage('Link copied. Send it to the email address shown above.')
    } catch {
      setCopyMessage('Copy failed. Select the link and copy it manually.')
    }
  }

  return (
    <section data-testid="invite-member" aria-label="Invite a friend" className="surface px-4 py-5">
      <h2 className="serif-display" style={{ color: 'var(--text-primary)', fontSize: 25 }}>Invite a friend</h2>
      {state.kind === 'issued' ? <>
        <p className="mt-3" style={{ color: 'var(--text-secondary)' }}>For {state.recipient}. Only someone who verifies this email can join. The link works once and expires after 7 days.</p>
        <label className="mt-4 block" style={{ color: 'var(--text-secondary)' }}>
          Invitation link
          <NeonInput readOnly value={state.url} onFocus={(event) => event.target.select()} className="mt-2" />
        </label>
        <NeonBtn type="button" onClick={() => void copy()} className="mt-4 min-h-11 w-full">Copy link</NeonBtn>
        {copyMessage && <p role="status" className="mt-2" style={{ color: 'var(--text-secondary)' }}>{copyMessage}</p>}
        <NeonBtn type="button" variant="ghost" onClick={inviteAnother} className="mt-3 min-h-11 w-full">Invite someone else</NeonBtn>
      </> : state.kind === 'already-issued' ? <>
        <p role="status" className="mt-3" style={{ color: 'var(--text-secondary)' }}>An invitation was issued, but its one-time link can no longer be shown. Revoke it and create a new one if you need a link to share.</p>
        <NeonBtn type="button" variant="ghost" onClick={inviteAnother} className="mt-3 min-h-11 w-full">Invite someone else</NeonBtn>
      </> : <form onSubmit={(event) => void issue(event)} className="mt-4 flex flex-col gap-3">
        <label style={{ color: 'var(--text-secondary)' }}>Friend’s email
          <NeonInput required type="email" autoComplete="off" placeholder="friend@example.com" value={email} onChange={(event) => updateEmail(event.target.value)} className="mt-2" />
        </label>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>You will send the link yourself. Only this verified email can use it.</p>
        {state.kind === 'error' && <p role="alert" style={{ color: 'var(--accent)' }}>{state.message}</p>}
        <NeonBtn type="submit" className="min-h-11 w-full" disabled={state.kind === 'issuing' || (state.kind === 'error' && !state.retryable)}>{state.kind === 'issuing' ? 'Creating link…' : state.kind === 'error' && state.retryable ? 'Retry creating link' : 'Create link'}</NeonBtn>
      </form>}
    </section>
  )
}
