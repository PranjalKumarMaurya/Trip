import { supabase } from '../../lib/supabase'
import { useEffect, useState } from 'react'
import { AuthEntry } from './AuthEntry'
import { useAuthSession } from './authSession'
import { BootstrapOnboarding } from '../onboarding/BootstrapOnboarding'

export function AuthBoundary() {
  const auth = useAuthSession()
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const [groupAccess, setGroupAccess] = useState<'idle' | 'checking' | 'none' | 'has-group' | 'error'>('idle')

  const signOut = async () => {
    setSignOutError(null)
    const { error } = await supabase.auth.signOut()
    if (error) {
      setSignOutError('We could not sign you out. Your workspace remains closed; please try again.')
      return
    }
    auth.markSignedOut()
  }

  const profileId = auth.status === 'authenticated-linked' ? auth.profileId : null

  useEffect(() => {
    if (!profileId) {
      setGroupAccess('idle')
      return
    }
    let active = true
    setGroupAccess('checking')
    const timeout = window.setTimeout(() => {
      if (active) setGroupAccess('error')
    }, 1500)
    void (async () => {
      try {
        const { data, error } = await supabase.from('groups').select('id').limit(1)
        window.clearTimeout(timeout)
        if (active) setGroupAccess(error ? 'error' : data?.length ? 'has-group' : 'none')
      } catch {
        window.clearTimeout(timeout)
        if (active) setGroupAccess('error')
      }
    })()
    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [profileId])

  if (auth.status === 'loading') return <AuthEntry mode="restoring" />
  if (auth.status === 'error') return <AuthEntry mode="error" onRetry={auth.retry} />
  if (auth.status === 'signed-out') {
    if (auth.reason === 'recovery') return <AuthEntry mode="reset" />
    return <AuthEntry mode={auth.reason === 'expired' ? 'expired' : 'sign-in'} />
  }

  if (auth.status === 'authenticated-unlinked') {
    return (
      <section data-testid="workspace-unavailable" className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center px-5 py-10">
        <p className="font-mono" style={{ color: 'var(--text-tertiary)', fontSize: 10, letterSpacing: '0.22em' }}>ACCOUNT NOT READY</p>
        <h1 className="serif-display" style={{ color: 'var(--text-primary)', fontSize: 34, fontWeight: 400, marginTop: 12 }}>Workspace unavailable</h1>
        <p className="serif-eyebrow" style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 10 }}>This account has no linked Profile. No Trip data was opened.</p>
        {signOutError && <p role="status" style={{ color: 'var(--text-secondary)', marginTop: 16 }}>{signOutError}</p>}
        <button type="button" onClick={() => void signOut()} style={{ color: 'var(--text-secondary)', marginTop: 24 }}>Sign out</button>
      </section>
    )
  }

  if (groupAccess === 'checking' || groupAccess === 'idle') {
    return <AuthEntry mode="restoring" />
  }

  if (groupAccess === 'none') {
    return <BootstrapOnboarding onSignOut={() => void signOut()} signOutError={signOutError} />
  }

  return (
    <section data-testid="workspace-unavailable" className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center px-5 py-10">
      <p className="font-mono" style={{ color: 'var(--text-tertiary)', fontSize: 10, letterSpacing: '0.22em' }}>AUTHENTICATED ACCOUNT</p>
      <h1 className="serif-display" style={{ color: 'var(--text-primary)', fontSize: 34, fontWeight: 400, marginTop: 12 }}>Workspace unavailable</h1>
      <p className="serif-eyebrow" style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 10 }}>Signed in as {auth.displayName}. Group access is not available yet, so no legacy Trip data was opened.</p>
      {signOutError && <p role="status" style={{ color: 'var(--text-secondary)', marginTop: 16 }}>{signOutError}</p>}
      <button type="button" onClick={() => void signOut()} style={{ color: 'var(--text-secondary)', marginTop: 24 }}>Sign out</button>
    </section>
  )
}
