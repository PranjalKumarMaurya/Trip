import { supabase } from '../../lib/supabase'

export interface MyGroupAccess {
  groupId: string
  /** The caller's stable Participant identity (`group_members.id`) in this Trip. */
  groupMemberId: string
  role: 'owner' | 'member'
  tripName: string
  destination: string
  startDate: string
  endDate: string
  timezone: string
  accountingCurrency: string
}

export async function loadMyGroupAccess(): Promise<MyGroupAccess[]> {
  const { data, error } = await supabase.rpc('get_my_group_access')
  if (error || !Array.isArray(data)) throw new Error('group_access_unavailable')
  return data.map((row) => {
    if (row.role !== 'owner' && row.role !== 'member') throw new Error('group_access_unavailable')
    return {
      groupId: row.group_id,
      groupMemberId: row.group_member_id,
      role: row.role,
      tripName: row.trip_name,
      destination: row.destination,
      startDate: row.start_date,
      endDate: row.end_date,
      timezone: row.timezone,
      accountingCurrency: row.accounting_currency,
    }
  })
}
