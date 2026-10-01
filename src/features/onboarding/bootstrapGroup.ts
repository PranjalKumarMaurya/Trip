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

interface BootstrapRpcClient {
  rpc: (functionName: 'bootstrap_group', args: {
    group_request: { trip_name: string }
    configuration_request: {
      destination: string
      start_date: string
      end_date: string
      timezone: string
      accounting_currency: string
      display_currency_codes: string[]
    }
    request_id: string
  }) => Promise<{
    data: Array<{ outcome: string; group_id: string; request_id: string }> | null
    error: { message?: string } | null
  }>
}

/**
 * This is deliberately the only local escape around pre-010 generated types.
 * Integration replaces it with the generated `bootstrap_group` RPC signature
 * after applying migration 010 and refreshing src/lib/database.types.ts.
 */
const bootstrapRpc = supabase as unknown as BootstrapRpcClient

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
  const { data, error } = await bootstrapRpc.rpc('bootstrap_group', {
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
