import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export interface RosterMember {
  /** Stable Participant identity (`group_members.id`); use it in every Trip record. */
  groupMemberId: string
  displayName: string
  role: 'owner' | 'member'
  status: 'active' | 'inactive'
}

export function useGroupRoster(groupId: string) {
  const [roster, setRoster] = useState<RosterMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    void supabase.rpc('get_group_roster', { p_group_id: groupId }).then(({ data, error: rpcError }) => {
      if (!active) return
      if (rpcError || !Array.isArray(data)) {
        setError(true)
        setRoster([])
      } else {
        setError(false)
        setRoster(data.flatMap((row) => (row.role === 'owner' || row.role === 'member')
          && (row.status === 'active' || row.status === 'inactive')
          ? [{ groupMemberId: row.participant_id, displayName: row.display_name, role: row.role, status: row.status }]
          : []))
      }
      setLoading(false)
    })
    return () => { active = false }
  }, [groupId, reloadCount])

  const reload = useCallback(() => setReloadCount((value) => value + 1), [])
  return { roster, loading, error, reload }
}
