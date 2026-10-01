import { type FormEvent, type ReactNode, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type EntryMode = 'sign-in' | 'sign-up' | 'recovery' | 'reset' | 'restoring' | 'error' | 'expired'

interface AuthEntryProps {
  mode: EntryMode
  onRetry?: () => void
  contextMessage?: string
}

const fieldStyle = {
  width: '100%',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  background: 'rgba(245, 241, 235, 0.04)',
  color: 'var(--text-primary)',
  padding: '12px 14px',
} as const

const buttonStyle = {
  width: '100%',
  border: '1px solid var(--accent)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--accent)',
  color: '#0f0b08',
  padding: '12px 14px',
  fontWeight: 700,
} as const

export function AuthEntry({ mode: initialMode, onRetry, contextMessage }: AuthEntryProps) {
  const [mode, setMode] = useState<EntryMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setMode(initialMode)
    setMessage(null)
  }, [initialMode])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(null)
    setBusy(true)

    try {
      if (mode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setMessage('We could not sign you in. Check your details and try again.')
        return
      }

      if (mode === 'sign-up') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        })
        if (error) setMessage('We could not create that account. Please try again.')
        else setMessage('Check your email to complete verification.')
        return
      }

      if (mode === 'recovery') {
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        if (error) setMessage('We could not start recovery. Please try again.')
        else setMessage('If the account is eligible, recovery instructions are on the way.')
        return
      }

      if (mode === 'reset') {
        if (!password || password !== confirmation) {
          setMessage('Passwords must match before you continue.')
          return
        }
        const { error } = await supabase.auth.updateUser({ password })
        if (error) setMessage('This reset link is invalid or has expired.')
        else {
          await supabase.auth.signOut()
          setMode('sign-in')
          setMessage('Password updated. Sign in with your new password.')
        }
      }
    } finally {
      setBusy(false)
    }
  }

  if (mode === 'restoring') {
    return <AuthFrame eyebrow="RETURNING USER" title="Restoring your session" detail="Checking your account safely." testId="auth-loading" />
  }

  if (mode === 'error') {
    return (
      <AuthFrame eyebrow="AUTHENTICATION" title="Something went wrong" detail="Your workspace is still protected.">
        <button type="button" style={buttonStyle} onClick={onRetry}>Try again</button>
      </AuthFrame>
    )
  }

  if (mode === 'expired') {
    return (
      <AuthFrame eyebrow="SESSION EXPIRED" title="Sign in again" detail="Your previous workspace was not reopened.">
        <button type="button" style={buttonStyle} onClick={() => setMode('sign-in')}>Continue to sign in</button>
      </AuthFrame>
    )
  }

  const isReset = mode === 'reset'
  const isRecovery = mode === 'recovery'
  const isSignup = mode === 'sign-up'
  const title = isReset ? 'Choose a new password' : isRecovery ? 'Reset your password' : isSignup ? 'Create your account' : 'Sign in'

  return (
    <AuthFrame eyebrow="BAKCHODI IN BALI" title={title} detail="Your account session is verified by Supabase Auth." testId="auth-entry">
      {contextMessage && <p role="status" style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>{contextMessage}</p>}
      <form onSubmit={submit} className="flex flex-col gap-3" aria-label={title}>
        {isSignup && <input aria-label="Display name" required value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your name" style={fieldStyle} />}
        {!isReset && <input aria-label="Email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" style={fieldStyle} />}
        {!isRecovery && <input aria-label="Password" required type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" style={fieldStyle} />}
        {isReset && <input aria-label="Confirm password" required type="password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Confirm password" style={fieldStyle} />}
        {message && <p role="status" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{message}</p>}
        <button disabled={busy} type="submit" style={buttonStyle}>{busy ? 'Please wait…' : isReset ? 'Save password' : isRecovery ? 'Send recovery link' : isSignup ? 'Create account' : 'Sign in'}</button>
      </form>
      {!isReset && !isRecovery && <button type="button" className="font-ui" style={{ color: 'var(--text-secondary)', marginTop: 14 }} onClick={() => setMode(isSignup ? 'sign-in' : 'sign-up')}>{isSignup ? 'Already have an account? Sign in' : 'Create an account'}</button>}
      {!isReset && <button type="button" className="font-ui" style={{ color: 'var(--text-secondary)', marginTop: 10 }} onClick={() => setMode(isRecovery ? 'sign-in' : 'recovery')}>{isRecovery ? 'Back to sign in' : 'Forgot password?'}</button>}
    </AuthFrame>
  )
}

interface FrameProps {
  eyebrow: string
  title: string
  detail: string
  testId?: string
  children?: ReactNode
}

function AuthFrame({ eyebrow, title, detail, testId, children }: FrameProps) {
  return (
    <main data-testid={testId} className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center px-5 py-10" style={{ background: 'rgba(15, 11, 8, 0.96)' }}>
      <p className="font-mono" style={{ color: 'var(--text-tertiary)', fontSize: 10, letterSpacing: '0.22em' }}>{eyebrow}</p>
      <h1 className="serif-display" style={{ color: 'var(--text-primary)', fontSize: 34, fontWeight: 400, marginTop: 12 }}>{title}</h1>
      <p className="serif-eyebrow" style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 10, marginBottom: 24 }}>{detail}</p>
      {children}
    </main>
  )
}
