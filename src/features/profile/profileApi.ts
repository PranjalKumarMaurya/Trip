import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { ProfileChanges } from './profileRules'

/** The signed-in person's own profile row (RLS: only their own). */
export interface MyProfile {
  id: string
  displayName: string
  avatarEmoji: string | null
  avatarPath: string | null
  homeCurrency: string | null
  upiId: string | null
  phone: string | null
  emergencyContact: string | null
  dietaryNotes: string | null
}

export class ProfileRequestError extends Error {
  constructor(readonly code: string) {
    super(code)
  }
}

const columns = 'id, display_name, avatar_emoji, avatar_path, home_currency, upi_id, phone, emergency_contact, dietary_notes'
const text = (value: unknown) => (typeof value === 'string' && value ? value : null)

export async function loadMyProfile(userId: string): Promise<MyProfile> {
  const { data, error } = await supabase.from('profiles').select(columns).eq('auth_user_id', userId).maybeSingle()
  if (error || !data) throw new ProfileRequestError('profile_unavailable')
  // Older or partial responses may omit the newer columns; treat them as unset.
  const row = data as Record<string, unknown>
  return {
    id: String(row.id),
    displayName: typeof row.display_name === 'string' ? row.display_name : '',
    avatarEmoji: text(row.avatar_emoji),
    avatarPath: text(row.avatar_path),
    homeCurrency: text(row.home_currency),
    upiId: text(row.upi_id),
    phone: text(row.phone),
    emergencyContact: text(row.emergency_contact),
    dietaryNotes: text(row.dietary_notes),
  }
}

type ProfileUpdate = Partial<ProfileChanges> & { avatar_emoji?: string | null; avatar_path?: string | null }

export async function updateMyProfile(profileId: string, changes: ProfileUpdate): Promise<void> {
  const { data, error } = await supabase.from('profiles').update(changes).eq('id', profileId).select('id')
  if (error) throw new ProfileRequestError(error.code === '23514' ? 'invalid_value' : 'save_failed')
  if (!Array.isArray(data) || data.length !== 1) throw new ProfileRequestError('save_failed')
}

/** Own profile for headers, Create Trip defaults and the Profile screen. */
export function useMyProfile(userId: string | null) {
  const [profile, setProfile] = useState<MyProfile | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setStatus('idle')
      return
    }
    let active = true
    setStatus((current) => (current === 'ready' ? current : 'loading'))
    void loadMyProfile(userId).then(
      (next) => { if (active) { setProfile(next); setStatus('ready') } },
      () => { if (active) setStatus((current) => (current === 'ready' ? current : 'error')) },
    )
    return () => { active = false }
  }, [userId, reloadCount])

  const reload = useCallback(() => setReloadCount((value) => value + 1), [])
  /** Apply a saved change locally without waiting for a re-read. */
  const patch = useCallback((changes: Partial<MyProfile>) => {
    setProfile((current) => (current ? { ...current, ...changes } : current))
  }, [])
  return { profile, status, reload, patch }
}
