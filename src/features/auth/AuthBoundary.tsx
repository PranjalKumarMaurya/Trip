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
import { TripsHome } from '../home/TripsHome'
import { useMyProfile } from '../profile/profileApi'
import { ProfileScreen } from '../profile/ProfileScreen'

/**
 * Signed-in screens. After sign-in the Trips home always comes first; from there
 * the person opens a Trip, creates one, or opens Profile. An invite link opens
 * the invitation screen first, and joining opens that Trip.
 */
type View =
  | { kind: 'home' }
  | { kind: 'trip'; groupId: string }
  | { kind: 'create' }
  | { kind: 'profile'; from: { kind: 'home' } | { kind: 'trip'; groupId: string } }

// The Trip open in this browser tab, so a reload returns to it (cleared on sign-out).
const openTripKey = 'trip:open-trip:v1'
function readOpenTrip(): string | null {
  try { return window.sessionStorage.getItem(openTripKey) } catch { return null }
}
function writeOpenTrip(groupId: string | null) {
  try {
    if (groupId) window.sessionStorage.setItem(openTripKey, groupId)
    else window.sessionStorage.removeItem(openTripKey)
  } catch { /* storage may be unavailable; a reload then shows the Trips home */ }
}

export function AuthBoundary() {
  const auth = useAuthSession()
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const [groupAccess, setGroupAccess] = useState<'idle' | 'checking' | 'ready' | 'error'>('idle')
  const [groups, setGroups] = useState<MyGroupAccess[]>([])
  const [view, setView] = useState<View>({ kind: 'home' })
  const [groupReload, setGroupReload] = useState(0)
  // A refresh (Crew changes, settings, focus, back to the Trips home) re-reads Trips in
  // the background so the open screen stays mounted.
  const backgroundReload = useRef(false)
  // A Trip to open once the next load lists it (just created, joined, or restored).
  const pendingOpen = useRef<string | null>(null)
  // The Trip this tab had open before a reload; restored once, on the first load.
  const restoreTrip = useRef<string | null>(readOpenTrip())
  const refreshTrips = () => {
    backgroundReload.current = true
    setGroupReload((value) => value + 1)
  }
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

  useEffect(() => {
    if (view.kind === 'trip') writeOpenTrip(view.groupId)
    else if (view.kind === 'home') writeOpenTrip(null)
  }, [view])

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

  const goHome = () => {
    setView({ kind: 'home' })
    refreshTrips()
  }

  /** Open a Trip; one not listed yet (or `reload`) opens after the Trip list is re-read. */
  const openTrip = (groupId: string, { reload = false }: { reload?: boolean } = {}) => {
    if (reload || !groups.some((group) => group.groupId === groupId)) {
      pendingOpen.current = groupId
      refreshTrips()
    }
    setView({ kind: 'trip', groupId })
  }

  const resetSignedIn = () => {
    restoreTrip.current = null
    pendingOpen.current = null
    writeOpenTrip(null)
    setView({ kind: 'home' })
  }

  const signOut = async () => {
    setSignOutError(null)
    const { error } = await supabase.auth.signOut()
    if (error) {
      setSignOutError('We could not sign you out. Check your connection and try again.')
      return
    }
    resetSignedIn()
    auth.markSignedOut()
  }

  const accountDeleted = () => {
    resetSignedIn()
    auth.markSignedOut('deleted')
    // The account no longer exists on the server, so only the local session is cleared.
    void supabase.auth.signOut({ scope: 'local' })
  }

  const profileId = auth.status === 'authenticated-linked' ? auth.profileId : null
  const userId = auth.status === 'authenticated-linked' ? auth.session.user.id : null
  const myProfile = useMyProfile(userId)

  useEffect(() => {
    if (!profileId) return
    window.addEventListener('focus', refreshTrips)
    return () => window.removeEventListener('focus', refreshTrips)
  }, [profileId])

  useEffect(() => {
    if (!profileId) {
      setGroupAccess('idle')
      setGroups([])
      return
    }
    let active = true
    const background = backgroundReload.current && groupAccess === 'ready'
    backgroundReload.current = false
    // This load was started for the Trip waiting to open (if any), so it settles that Trip.
    const pendingAtStart = pendingOpen.current
    if (!background) setGroupAccess('checking')
    const timeout = background ? undefined : window.setTimeout(() => {
      if (active) setGroupAccess('error')
    }, 1500)
    void (async () => {
      try {
        const data = await loadMyGroupAccess()
        window.clearTimeout(timeout)
        if (!active) return
        const listed = (groupId: string) => data.some((group) => group.groupId === groupId)
        if (pendingAtStart && pendingOpen.current === pendingAtStart) pendingOpen.current = null
        const stillPending = pendingOpen.current
        const restore = restoreTrip.current
        restoreTrip.current = null
        setGroups(data)
        setGroupAccess('ready')
        setView((current) => {
          if (restore && current.kind === 'home' && listed(restore)) return { kind: 'trip', groupId: restore }
          // An open Trip the person lost (left, removed, archived) returns to the Trips home.
          if (current.kind === 'trip' && !listed(current.groupId) && current.groupId !== stillPending) return { kind: 'home' }
          return current
        })
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
    return <InvitationEntry proof={inviteProof} auth={auth} onSignOut={() => void signOut()} onClose={closeInvitation}
      onAccepted={() => {
        clearSavedInvitation()
        refreshTrips()
      }}
      onOpenTrip={(groupId) => {
        closeInvitation()
        openTrip(groupId, { reload: true })
      }} signOutError={signOutError} />
  }
  if (auth.status === 'signed-out') {
    return <AuthEntry mode={auth.reason === 'expired' ? 'expired' : 'sign-in'}
      contextMessage={auth.reason === 'deleted' ? 'Your account was deleted. Thanks for travelling with us.' : undefined} />
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

  if (groupAccess === 'error') {
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

  const accountName = myProfile.profile?.displayName || auth.displayName

  if (view.kind === 'profile') {
    const from = view.from
    const back = from.kind === 'trip' ? groups.find((group) => group.groupId === from.groupId) : undefined
    return <ProfileScreen userId={auth.session.user.id} email={auth.session.user.email} profile={myProfile.profile}
      profileStatus={myProfile.status} onProfileChanged={myProfile.patch} onReload={myProfile.reload}
      onBack={() => (back ? setView({ kind: 'trip', groupId: back.groupId }) : goHome())} backLabel={back ? back.tripName : 'Trips'}
      onSignOut={() => void signOut()} signOutError={signOutError} onAccountDeleted={accountDeleted} />
  }

  if (view.kind === 'create') {
    return <BootstrapOnboarding onBack={goHome} homeCurrency={myProfile.profile?.homeCurrency}
      onContinue={(groupId) => openTrip(groupId, { reload: true })} />
  }

  if (view.kind === 'trip') {
    const trip = groups.find((group) => group.groupId === view.groupId)
    // Waiting for the Trip list that includes a just-created or just-joined Trip.
    if (!trip) return <AuthEntry mode="restoring" />
    return <GroupWorkspace trip={trip} onBack={goHome} onRefresh={refreshTrips} profile={myProfile.profile} accountName={accountName}
      onOpenProfile={() => setView({ kind: 'profile', from: { kind: 'trip', groupId: trip.groupId } })} />
  }

  return <TripsHome trips={groups} profile={myProfile.profile} accountName={accountName}
    onCreate={() => setView({ kind: 'create' })} onOpenTrip={openTrip}
    onOpenProfile={() => setView({ kind: 'profile', from: { kind: 'home' } })}
    onInvite={(proof) => {
      let storage: Storage | null = null
      try { storage = window.localStorage } catch { /* private browsing may deny storage */ }
      setInviteProof(pendingInvitationFromBrowser(`#invite=${proof}`, storage).proof)
    }} />
}
