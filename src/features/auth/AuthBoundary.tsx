import { supabase } from '../../lib/supabase'
import { useEffect, useRef, useState } from 'react'
import { NeonBtn } from '../../components/ui/NeonBtn'
import { ScreenFrame } from '../../components/ui/ScreenFrame'
import { AuthEntry } from './AuthEntry'
import { useAuthSession } from './authSession'
import { BootstrapOnboarding } from '../onboarding/BootstrapOnboarding'
import { InvitationEntry } from '../invitations/InvitationEntry'
import { clearPendingInvitation, pendingInvitationFromBrowser } from '../invitations/invitationLink'
import { GroupWorkspace } from '../groups/GroupWorkspace'
import { loadMyGroupAccess, type MyGroupAccess } from '../groups/myGroupAccess'
import { ArchivedTrips } from '../crew/ArchivedTrips'

export function AuthBoundary() {
  const auth = useAuthSession()
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const [groupAccess, setGroupAccess] = useState<'idle' | 'checking' | 'none' | 'has-group' | 'error'>('idle')
  const [groups, setGroups] = useState<MyGroupAccess[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [groupReload, setGroupReload] = useState(0)
  // A workspace refresh (Crew changes, Refresh Trips, focus) re-reads Trips in the
  // background so the open tab stays mounted; `preferredGroup` is selected if listed.
  const backgroundReload = useRef(false)
  const preferredGroup = useRef<string | null>(null)
  const refreshTrips = (preferGroupId?: string) => {
    backgroundReload.current = true
    preferredGroup.current = preferGroupId ?? null
    setGroupReload((value) => value + 1)
  }
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
      setSignOutError('We could not sign you out. Check your connection and try again.')
      return
    }
    auth.markSignedOut()
  }

  const profileId = auth.status === 'authenticated-linked' ? auth.profileId : null

  useEffect(() => {
    if (!profileId) return
    const refresh = () => {
      backgroundReload.current = true
      setGroupReload((value) => value + 1)
    }
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
    const background = backgroundReload.current && groupAccess === 'has-group'
    backgroundReload.current = false
    if (!background) setGroupAccess('checking')
    const timeout = background ? undefined : window.setTimeout(() => {
      if (active) setGroupAccess('error')
    }, 1500)
    void (async () => {
      try {
        const data = await loadMyGroupAccess()
        window.clearTimeout(timeout)
        if (active) {
          const preferred = preferredGroup.current
          preferredGroup.current = null
          setGroups(data)
          setSelectedGroupId((previous) => preferred && data.some((group) => group.groupId === preferred) ? preferred
            : data.some((group) => group.groupId === previous) ? previous : data[0]?.groupId ?? null)
          setGroupAccess(data.length ? 'has-group' : 'none')
        }
      } catch {
        window.clearTimeout(timeout)
        // A failed background refresh keeps the Trips already shown.
        if (active && !background) setGroupAccess('error')
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
    return <InvitationEntry proof={inviteProof} auth={auth} onSignOut={() => void signOut()} onClose={closeInvitation} onAccepted={(groupId) => {
      clearSavedInvitation()
      // Open the Trip just joined, not whichever Trip was selected before.
      preferredGroup.current = groupId
      setGroupReload((value) => value + 1)
    }} signOutError={signOutError} />
  }
  if (auth.status === 'signed-out') {
    return <AuthEntry mode={auth.reason === 'expired' ? 'expired' : 'sign-in'} />
  }

  if (auth.status === 'authenticated-unlinked') {
    return (
      <ScreenFrame testId="workspace-unavailable" title="Your account isn’t ready yet"
        lede="We couldn’t finish setting up your account, so no Trips were opened. Sign out, then sign in again.">
        {signOutError && <p role="status" className="notice notice--error mb-4">{signOutError}</p>}
        <NeonBtn type="button" size="lg" className="w-full" onClick={() => void signOut()}>Sign out</NeonBtn>
      </ScreenFrame>
    )
  }

  if (groupAccess === 'checking' || groupAccess === 'idle') {
    return <AuthEntry mode="restoring" />
  }

  if (groupAccess === 'none' || creatingAnother) {
    return <BootstrapOnboarding onSignOut={() => void signOut()} signOutError={signOutError}
      onContinue={(groupId) => { setSelectedGroupId(groupId); setCreatingAnother(false); setGroupReload((value) => value + 1) }}
      onCancel={groupAccess === 'has-group' ? () => setCreatingAnother(false) : undefined}
      aside={groupAccess === 'none' ? <ArchivedTrips refreshKey="none" onRestored={(groupId) => refreshTrips(groupId)} /> : undefined} />
  }

  if (groupAccess === 'has-group' && selectedGroupId) {
    return <GroupWorkspace groups={groups} selectedGroupId={selectedGroupId} onSelect={setSelectedGroupId} onRefresh={refreshTrips} onCreateAnother={() => setCreatingAnother(true)} onSignOut={() => void signOut()} signOutError={signOutError}
      accountName={auth.displayName} accountEmail={auth.session.user.email} />
  }

  return (
    <ScreenFrame testId="workspace-unavailable" title="We couldn’t load your Trips"
      lede={<>Signed in as {auth.displayName}. Check your connection and try again.</>}>
      {signOutError && <p role="status" className="notice notice--error mb-4">{signOutError}</p>}
      <div className="flex flex-col gap-3">
        <NeonBtn type="button" size="lg" className="w-full" onClick={() => setGroupReload((value) => value + 1)}>Try again</NeonBtn>
        <NeonBtn type="button" variant="ghost" size="lg" className="w-full" onClick={() => void signOut()}>Sign out</NeonBtn>
      </div>
    </ScreenFrame>
  )
}
