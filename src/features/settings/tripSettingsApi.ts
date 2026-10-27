import { supabase } from '../../lib/supabase'

/** Exactly what update_trip_settings (migration 070) accepts. */
export type TripSettingsPayload = {
  trip_name: string
  destination: string
  start_date: string
  end_date: string
  timezone: string
  is_international: boolean
  accounting_currency: string
  display_currency_codes: string[]
}

export type TripSettingsErrorCode = 'not_authorized' | 'currency_locked' | 'invalid_request' | 'retryable'

export class TripSettingsError extends Error {
  constructor(readonly code: TripSettingsErrorCode) {
    super(code)
  }
}

export async function updateTripSettings(groupId: string, settings: TripSettingsPayload, requestId: string): Promise<'updated' | 'unchanged'> {
  const { data, error } = await supabase.rpc('update_trip_settings', { p_group_id: groupId, p_settings: settings, p_request_id: requestId })
  if (error) {
    const code = error.message
    throw new TripSettingsError(code === 'not_authorized' || code === 'currency_locked' || code === 'invalid_request'
      ? code : code === 'idempotency_conflict' ? 'invalid_request' : 'retryable')
  }
  const outcome = data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>).outcome : null
  if (outcome === 'unchanged') return 'unchanged'
  if (outcome === 'updated' || outcome === 'already_completed') return 'updated'
  throw new TripSettingsError('retryable')
}

/** The Trip's display currencies (any active member may read them). */
export async function loadDisplayCurrencies(groupId: string): Promise<string[]> {
  const { data, error } = await supabase.from('group_configuration_display_currencies').select('currency_code').eq('group_id', groupId)
  if (error || !Array.isArray(data)) throw new TripSettingsError('retryable')
  return data.map((row) => row.currency_code).sort()
}

/** True once any Expense or payment is recorded: the Trip currency can no longer change. */
export async function loadCurrencyLocked(groupId: string): Promise<boolean> {
  const [expenses, settlements] = await Promise.all([
    supabase.from('trip_expenses').select('id', { count: 'exact', head: true }).eq('group_id', groupId),
    supabase.from('trip_settlements').select('id', { count: 'exact', head: true }).eq('group_id', groupId),
  ])
  if (expenses.error || settlements.error) throw new TripSettingsError('retryable')
  return (expenses.count ?? 0) + (settlements.count ?? 0) > 0
}

export function tripSettingsErrorMessage(code: TripSettingsErrorCode): string {
  if (code === 'not_authorized') return 'Only an Owner can change Trip settings. Your role may have changed, so the Trip was refreshed.'
  if (code === 'currency_locked') return 'Expenses or payments are already recorded, so the Trip currency can’t change. Everything else can.'
  if (code === 'invalid_request') return 'Check the details and try again.'
  return 'We couldn’t confirm the change. Try again — it won’t be applied twice.'
}
