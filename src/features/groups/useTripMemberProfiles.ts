import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

/** What active members of a Trip share with each other (migration 025). */
export interface TripMemberProfile {
  groupMemberId: string
  displayName: string
  avatarEmoji: string | null
  avatarPath: string | null
  upiId: string | null
  phone: string | null
  emergencyContact: string | null
  dietaryNotes: string | null
}

export function useTripMemberProfiles(groupId: string) {
  const [profiles, setProfiles] = useState<TripMemberProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    void supabase.rpc('get_trip_member_profiles', { p_group_id: groupId }).then(({ data, error: rpcError }) => {
      if (!active) return
      setError(Boolean(rpcError) || !Array.isArray(data))
      setProfiles(Array.isArray(data) ? data.map((row) => ({
        groupMemberId: row.group_member_id,
        displayName: row.display_name,
        avatarEmoji: row.avatar_emoji,
        avatarPath: row.avatar_path,
        upiId: row.upi_id,
        phone: row.phone,
        emergencyContact: row.emergency_contact,
        dietaryNotes: row.dietary_notes,
      })) : [])
      setLoading(false)
    })
    return () => { active = false }
  }, [groupId, reloadCount])

  const reload = useCallback(() => setReloadCount((value) => value + 1), [])
  return { profiles, loading, error, reload }
}
