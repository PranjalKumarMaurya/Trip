import { type FormEvent, useEffect, useState } from 'react'
import { Field } from '../../components/ui/Field'
import { IconBack } from '../../components/ui/icons'
import { NeonBtn } from '../../components/ui/NeonBtn'
import { NeonInput } from '../../components/ui/NeonInput'
import { ScreenFrame } from '../../components/ui/ScreenFrame'
import { supabase } from '../../lib/supabase'

type EntryMode = 'sign-in' | 'sign-up' | 'recovery' | 'reset' | 'restoring' | 'error' | 'expired'

interface AuthEntryProps {
  mode: EntryMode
  onRetry?: () => void
  contextMessage?: string
  /** Shows a "Back" link (e.g. back to the invitation that sent the user here). */
  onBack?: () => void
}

type Message = { text: string; tone: 'info' | 'error' }

// 16px text keeps phones from zooming into the field on focus.
const inputStyle = { fontSize: 16, minHeight: 48 } as const

const titles: Record<'sign-in' | 'sign-up' | 'recovery' | 'reset', { title: string; lede: string }> = {
  'sign-in': { title: 'Sign in', lede: 'Plan, split and share your group trip.' },
  'sign-up': { title: 'Create your account', lede: 'Start a Trip, or join one a friend invited you to.' },
  recovery: { title: 'Reset your password', lede: 'We’ll email you a link to choose a new one.' },
  reset: { title: 'Choose a new password', lede: 'Use at least 8 characters.' },
}

export function AuthEntry({ mode: initialMode, onRetry, contextMessage, onBack }: AuthEntryProps) {
  const [mode, setMode] = useState<EntryMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState<Message | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setMode(initialMode)
    setMessage(null)
  }, [initialMode])

  const switchMode = (next: EntryMode) => {
    setMode(next)
    setMessage(null)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(null)
    setBusy(true)

    try {
      if (mode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setMessage({ tone: 'error', text: 'We could not sign you in. Check your email and password and try again.' })
        return
      }

      if (mode === 'sign-up') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        })
        if (error) setMessage({ tone: 'error', text: 'We could not create that account. Please try again.' })
        else setMessage({ tone: 'info', text: 'Check your email — we sent you a link to confirm your account.' })
        return
      }

      if (mode === 'recovery') {
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        if (error) setMessage({ tone: 'error', text: 'We could not send a reset link. Please try again.' })
        else setMessage({ tone: 'info', text: 'If that email has an account, a reset link is on its way.' })
        return
      }

      if (mode === 'reset') {
        if (!password || password !== confirmation) {
          setMessage({ tone: 'error', text: 'Passwords must match before you continue.' })
          return
        }
        const { error } = await supabase.auth.updateUser({ password })
        if (error) setMessage({ tone: 'error', text: 'This reset link is invalid or has expired.' })
        else {
          await supabase.auth.signOut()
          setMode('sign-in')
          setMessage({ tone: 'info', text: 'Password updated. Sign in with your new password.' })
        }
      }
    } finally {
      setBusy(false)
    }
  }

  if (mode === 'restoring') {
    return (
      <ScreenFrame testId="auth-loading" title="Just a moment" lede="Getting your Trips ready…" busy>
        <div role="status" className="flex items-center gap-3" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          <span className="spinner" aria-hidden="true" />Loading
        </div>
      </ScreenFrame>
    )
  }

  if (mode === 'error') {
    return (
      <ScreenFrame title="Something went wrong" lede="We couldn’t check your account. Check your connection and try again.">
        <NeonBtn type="button" size="lg" className="w-full" onClick={onRetry}>Try again</NeonBtn>
      </ScreenFrame>
    )
  }

  if (mode === 'expired') {
    return (
      <ScreenFrame title="Your session expired" lede="Sign in again to pick up where you left off.">
        <NeonBtn type="button" size="lg" className="w-full" onClick={() => switchMode('sign-in')}>Continue to sign in</NeonBtn>
      </ScreenFrame>
    )
  }

  const isReset = mode === 'reset'
  const isRecovery = mode === 'recovery'
  const isSignup = mode === 'sign-up'
  const { title, lede } = titles[mode]
  const submitLabel = isReset ? 'Save password' : isRecovery ? 'Send reset link' : isSignup ? 'Create account' : 'Sign in'

  return (
    <ScreenFrame testId="auth-entry" title={title} lede={lede}
      top={onBack ? <button type="button" className="text-link" onClick={onBack}><IconBack size={18} />Back to invitation</button> : undefined}>
      {contextMessage && <p role="status" className="notice mb-6">{contextMessage}</p>}
      <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4" aria-label={title}>
        {isSignup && <Field id="auth-display-name" label="Display name">
          <NeonInput required autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="What friends call you" style={inputStyle} />
        </Field>}
        {!isReset && <Field id="auth-email" label="Email">
          <NeonInput required type="email" autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" style={inputStyle} />
        </Field>}
        {!isRecovery && <Field id="auth-password" label={isReset ? 'New password' : 'Password'} hint={isSignup ? 'At least 8 characters.' : undefined}>
          <NeonInput required type="password" minLength={8} autoComplete={isSignup || isReset ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} style={inputStyle} />
        </Field>}
        {isReset && <Field id="auth-confirm-password" label="Confirm password">
          <NeonInput required type="password" minLength={8} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} style={inputStyle} />
        </Field>}
        {message && <p role="status" className={`notice${message.tone === 'error' ? ' notice--error' : ''}`}>{message.text}</p>}
        <NeonBtn disabled={busy} type="submit" size="lg" className="mt-2 w-full">{busy ? 'Please wait…' : submitLabel}</NeonBtn>
      </form>

      {mode === 'sign-in' && <>
        <div className="mt-2 flex justify-center">
          <button type="button" className="text-link" onClick={() => switchMode('recovery')}>Forgot password?</button>
        </div>
        <div className="mt-6 flex items-center gap-3" aria-hidden="true">
          <span className="divider flex-1" /><span className="eyebrow">New here?</span><span className="divider flex-1" />
        </div>
        <NeonBtn type="button" variant="outline" size="lg" className="mt-5 w-full" onClick={() => switchMode('sign-up')}>Create an account</NeonBtn>
      </>}
      {isSignup && <p className="mt-4 flex flex-wrap items-center justify-center gap-x-1.5 text-sm" style={{ color: 'var(--text-tertiary)' }}>
        Already have an account?<button type="button" className="text-link" onClick={() => switchMode('sign-in')}>Sign in</button>
      </p>}
      {isRecovery && <div className="mt-2 flex justify-center">
        <button type="button" className="text-link" onClick={() => switchMode('sign-in')}>Back to sign in</button>
      </div>}
    </ScreenFrame>
  )
}
