import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

export type AuthSessionState =
  | { status: 'loading' }
  | { status: 'signed-out'; reason: 'initial' | 'expired' | 'signed-out' | 'recovery' | 'deleted' }
  | { status: 'authenticated-linked'; session: Session; profileId: string; displayName: string }
  | { status: 'authenticated-unlinked'; session: Session }
  | { status: 'error' }

export interface ProfileResolutionToken {
  generation: number
  userId: string
}

export interface ProfileResolutionController {
  currentGeneration: () => number
  isGenerationCurrent: (generation: number) => boolean
  beginProfileResolution: (userId: string) => ProfileResolutionToken
  isCurrent: (token: ProfileResolutionToken) => boolean
  invalidate: () => void
  dispose: () => void
}

export function createProfileResolutionController(): ProfileResolutionController {
  let active = true
  let generation = 0
  let currentUserId: string | null = null

  const invalidate = () => {
    generation += 1
    currentUserId = null
  }

  return {
    currentGeneration: () => generation,
    isGenerationCurrent: (candidateGeneration) => active && candidateGeneration === generation,
    beginProfileResolution: (userId) => {
      generation += 1
      currentUserId = userId
      return { generation, userId }
    },
    isCurrent: (token) => active && token.generation === generation && token.userId === currentUserId,
    invalidate,
    dispose: () => {
      active = false
      invalidate()
    },
  }
}

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

type ManualSignOut = 'signed-out' | 'deleted'

export function useAuthSession(): AuthSessionState & { retry: () => void; markSignedOut: (reason?: ManualSignOut) => void } {
  const [state, setState] = useState<AuthSessionState>({ status: 'loading' })
  const [retryToken, setRetryToken] = useState(0)
  // Why the app itself signed out (sign out, or the account was deleted); null means the session ended on its own.
  const manualSignOut = useRef<ManualSignOut | null>(null)
  const controllerRef = useRef<ProfileResolutionController | null>(null)

  const retry = useCallback(() => setRetryToken((value) => value + 1), [])
  const markSignedOut = useCallback((reason: ManualSignOut = 'signed-out') => {
    manualSignOut.current = reason
    controllerRef.current?.invalidate()
    setState({ status: 'signed-out', reason })
  }, [])

  useEffect(() => {
    const controller = createProfileResolutionController()
    controllerRef.current = controller

    const applySession = async (session: Session | null, expired = false) => {
      if (!session) {
        controller.invalidate()
        if (controller.isGenerationCurrent(controller.currentGeneration())) {
          setState({ status: 'signed-out', reason: expired ? 'expired' : 'initial' })
        }
        return
      }

      const resolution = controller.beginProfileResolution(session.user.id)
      const next = await loadSessionState(session)
      if (controller.isCurrent(resolution)) setState(next)
    }

    const initialGeneration = controller.currentGeneration()
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!controller.isGenerationCurrent(initialGeneration)) return
      if (error) {
        setState({ status: 'error' })
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
        void applySession(null, !manualSignOut.current)
        setState({ status: 'signed-out', reason: manualSignOut.current ?? 'expired' })
        manualSignOut.current = null
        return
      }
      if (event === 'PASSWORD_RECOVERY') {
        controller.invalidate()
        if (controller.isGenerationCurrent(controller.currentGeneration())) {
          setState({ status: 'signed-out', reason: 'recovery' })
        }
      }
    })

    return () => {
      controller.dispose()
      if (controllerRef.current === controller) controllerRef.current = null
      subscription.subscription.unsubscribe()
    }
  }, [retryToken])

  return { ...state, retry, markSignedOut }
}
