import { supabase } from '../../lib/supabase'
import { useEffect, useState } from 'react'
import { AuthEntry } from './AuthEntry'
import { useAuthSession } from './authSession'
import { BootstrapOnboarding } from '../onboarding/BootstrapOnboarding'
import { InvitationEntry } from '../invitations/InvitationEntry'
import { clearPendingInvitation, pendingInvitationFromBrowser } from '../invitations/invitationLink'
import { GroupWorkspace } from '../groups/GroupWorkspace'
import { loadMyGroupAccess, type MyGroupAccess } from '../groups/myGroupAccess'

export function AuthBoundary() {
  const auth = useAuthSession()
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const [groupAccess, setGroupAccess] = useState<'idle' | 'checking' | 'none' | 'has-group' | 'error'>('idle')
  const [groups, setGroups] = useState<MyGroupAccess[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [groupReload, setGroupReload] = useState(0)
  const [creatingAnother, setCreatingAnother] = useState(false)
  const [inviteProof, setInviteProof] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    let storage: Storage | null = null
    try { storage = window.localStorage } catch { /* private browsing may deny storage */ }
    return pendingInvitationFromBrowser(window.location.hash, storage).proof
  })

  useEffect(() => {
    const onHashChange = () => {
      if (!window.location.hash.startsWith('#invite=')) return
      let storage: Storage | null = null
      try { storage = window.localStorage } catch { /* private browsing may deny storage */ }
      setInviteProof(pendingInvitationFromBrowser(window.location.hash, storage).proof)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const clearSavedInvitation = () => {
    try { clearPendingInvitation(window.localStorage) } catch { /* storage may be unavailable */ }
    if (window.location.hash.startsWith('#invite=')) {
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
    }
  }

  const closeInvitation = () => {
    clearSavedInvitation()
    setInviteProof(null)
  }

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
    if (!profileId) return
    const refresh = () => setGroupReload((value) => value + 1)
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [profileId])

  useEffect(() => {
    if (!profileId) {
      setGroupAccess('idle')
      setGroups([])
      setSelectedGroupId(null)
      setCreatingAnother(false)
      return
    }
    let active = true
    setGroupAccess('checking')
    const timeout = window.setTimeout(() => {
      if (active) setGroupAccess('error')
    }, 1500)
    void (async () => {
      try {
        const data = await loadMyGroupAccess()
        window.clearTimeout(timeout)
        if (active) {
          setGroups(data)
          setSelectedGroupId((previous) => data.some((group) => group.groupId === previous)
            ? previous : data[0]?.groupId ?? null)
          setGroupAccess(data.length ? 'has-group' : 'none')
        }
      } catch {
        window.clearTimeout(timeout)
        if (active) setGroupAccess('error')
      }
    })()
    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [profileId, groupReload])

  if (auth.status === 'loading') return <AuthEntry mode="restoring" />
  if (auth.status === 'error') return <AuthEntry mode="error" onRetry={auth.retry} />
  if (auth.status === 'signed-out' && auth.reason === 'recovery') return <AuthEntry mode="reset" />
  if (inviteProof) {
    return <InvitationEntry proof={inviteProof} auth={auth} onSignOut={() => void signOut()} onClose={closeInvitation} onAccepted={() => { clearSavedInvitation(); setGroupReload((value) => value + 1) }} signOutError={signOutError} />
  }
  if (auth.status === 'signed-out') {
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

  if (groupAccess === 'none' || creatingAnother) {
    return <BootstrapOnboarding onSignOut={() => void signOut()} signOutError={signOutError} onContinue={(groupId) => { setSelectedGroupId(groupId); setCreatingAnother(false); setGroupReload((value) => value + 1) }} />
  }

  if (groupAccess === 'has-group' && selectedGroupId) {
    return <GroupWorkspace groups={groups} selectedGroupId={selectedGroupId} onSelect={setSelectedGroupId} onRefresh={() => setGroupReload((value) => value + 1)} onCreateAnother={() => setCreatingAnother(true)} onSignOut={() => void signOut()} signOutError={signOutError} />
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
