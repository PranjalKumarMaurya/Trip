import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

export type AuthSessionState =
  | { status: 'loading' }
  | { status: 'signed-out'; reason: 'initial' | 'expired' | 'signed-out' | 'recovery' }
  | { status: 'authenticated-linked'; session: Session; profileId: string; displayName: string }
  | { status: 'authenticated-unlinked'; session: Session }
  | { status: 'error' }

async function loadSessionState(session: Session): Promise<AuthSessionState> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('auth_user_id', session.user.id)
    .maybeSingle()

  if (error) return { status: 'error' }
  if (!data) return { status: 'authenticated-unlinked', session }

  return {
    status: 'authenticated-linked',
    session,
    profileId: data.id,
    displayName: data.display_name,
  }
}

export function useAuthSession(): AuthSessionState & { retry: () => void; markSignedOut: () => void } {
  const [state, setState] = useState<AuthSessionState>({ status: 'loading' })
  const [retryToken, setRetryToken] = useState(0)
  const manualSignOut = useRef(false)

  const retry = useCallback(() => setRetryToken((value) => value + 1), [])
  const markSignedOut = useCallback(() => {
    manualSignOut.current = true
    setState({ status: 'signed-out', reason: 'signed-out' })
  }, [])

  useEffect(() => {
    let active = true

    const applySession = async (session: Session | null, expired = false) => {
      if (!session) {
        if (active) setState({ status: 'signed-out', reason: expired ? 'expired' : 'initial' })
        return
      }

      const next = await loadSessionState(session)
      if (active) setState(next)
    }

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        if (active) setState({ status: 'error' })
        return
      }
      void applySession(data.session)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        void applySession(session)
        return
      }
      if (event === 'SIGNED_OUT') {
        if (active) setState({ status: 'signed-out', reason: manualSignOut.current ? 'signed-out' : 'expired' })
        manualSignOut.current = false
        return
      }
      if (event === 'PASSWORD_RECOVERY') {
        if (active) setState({ status: 'signed-out', reason: 'recovery' })
      }
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [retryToken])

  return { ...state, retry, markSignedOut }
}
