import { supabase } from '../../lib/supabase'

export interface MyGroupAccess {
  groupId: string
  role: 'owner' | 'member'
  tripName: string
  destination: string
}

export async function loadMyGroupAccess(): Promise<MyGroupAccess[]> {
  const { data, error } = await supabase.rpc('get_my_group_access')
  if (error || !Array.isArray(data)) throw new Error('group_access_unavailable')
  return data.map((row) => {
    if (row.role !== 'owner' && row.role !== 'member') throw new Error('group_access_unavailable')
    return {
      groupId: row.group_id,
      role: row.role,
      tripName: row.trip_name,
      destination: row.destination,
    }
  })
}
