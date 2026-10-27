import { supabase } from '../../lib/supabase'

export interface BootstrapGroupInput {
  tripName: string
  destination: string
  startDate: string
  endDate: string
  timezone: string
  accountingCurrency: string
  displayCurrencyCodes: string[]
}

export interface BootstrapGroupResult {
  outcome: 'completed'
  groupId: string
  requestId: string
}

export type BootstrapFailureKind = 'retryable' | 'conflict' | 'safe'

export class BootstrapGroupError extends Error {
  constructor(readonly kind: BootstrapFailureKind) {
    super(kind)
  }
}

export function createBootstrapRequestId(): string {
  return crypto.randomUUID()
}

function safeFailureKind(message: string | undefined): BootstrapFailureKind {
  if (message === 'idempotency_conflict') return 'conflict'
  if (message === 'not_authenticated' || message === 'auth_not_verified' || message === 'profile_unavailable' || message === 'invalid_request') {
    return 'safe'
  }
  return 'retryable'
}

export async function bootstrapGroup(input: BootstrapGroupInput, requestId: string): Promise<BootstrapGroupResult> {
  const { data, error } = await supabase.rpc('bootstrap_group', {
    group_request: {
      trip_name: input.tripName.trim(),
    },
    configuration_request: {
      destination: input.destination.trim(),
      start_date: input.startDate,
      end_date: input.endDate,
      timezone: input.timezone.trim(),
      accounting_currency: input.accountingCurrency.trim().toUpperCase(),
      display_currency_codes: input.displayCurrencyCodes.map((code) => code.trim().toUpperCase()),
    },
    request_id: requestId,
  })

  if (error) throw new BootstrapGroupError(safeFailureKind(error.message))

  const result = data?.[0]
  if (!result || result.outcome !== 'completed' || !result.group_id || result.request_id !== requestId) {
    throw new BootstrapGroupError('retryable')
  }

  return {
    outcome: 'completed',
    groupId: result.group_id,
    requestId: result.request_id,
  }
}
