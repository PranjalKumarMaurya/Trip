import { supabase } from '../../lib/supabase'

export interface MyGroupAccess {
  groupId: string
  role: 'owner' | 'member'
  tripName: string
  destination: string
}

export async function loadMyGroupAccess(): Promise<MyGroupAccess[]> {
  // Journey candidate only; replace this cast after generated types include migration 022.
  const client = supabase as unknown as {
    rpc: (name: string) => Promise<{ data: unknown; error: unknown }>
  }
  const { data, error } = await client.rpc('get_my_group_access')
  if (error || !Array.isArray(data)) throw new Error('group_access_unavailable')
  return data.map((row: unknown) => {
    if (!row || typeof row !== 'object') throw new Error('group_access_unavailable')
    const item = row as Record<string, unknown>
    if (typeof item.group_id !== 'string' || (item.role !== 'owner' && item.role !== 'member')
      || typeof item.trip_name !== 'string' || typeof item.destination !== 'string') {
      throw new Error('group_access_unavailable')
    }
    return {
      groupId: item.group_id,
      role: item.role,
      tripName: item.trip_name,
      destination: item.destination,
    }
  })
}
