import { supabase } from '../../lib/supabase'
import type { ExpenseRequest } from './expenseDraft'
import { parseLedger, type Ledger } from './ledger'

/** A failed Split RPC; `code` is the server's split_* message or SQLSTATE. */
export class SplitRequestError extends Error {
  readonly code: string
  constructor(code: string) {
    super(code)
    this.code = code
  }
}

function fail(error: { message?: string; code?: string } | null): never {
  const message = error?.message ?? ''
  throw new SplitRequestError(/^split_[a-z_]+$/u.test(message) ? message : (error?.code ?? 'request_failed'))
}

export async function loadLedger(groupId: string): Promise<Ledger> {
  const { data, error } = await supabase.rpc('get_split_ledger', { p_group_id: groupId })
  if (error) fail(error)
  return parseLedger(data)
}

const optional = (value: string | null) => value ?? undefined

export async function commitExpense(groupId: string, request: ExpenseRequest, requestId: string): Promise<string> {
  const { data, error } = await supabase.rpc('commit_expense', {
    p_group_id: groupId,
    p_description: request.description,
    p_original_amount: request.originalAmount,
    p_original_currency: request.originalCurrency,
    p_split_method: request.splitMethod,
    p_payers: request.payers,
    p_shares: request.shares,
    p_category: optional(request.category),
    p_fx_rate: optional(request.fxRate),
    p_fx_source: optional(request.fxSource),
    p_request_id: requestId,
  })
  if (error) fail(error)
  return data
}

export async function updateExpense(expenseId: string, version: number, request: ExpenseRequest): Promise<number> {
  const { data, error } = await supabase.rpc('update_expense', {
    p_expense_id: expenseId,
    p_expected_version: version,
    p_description: request.description,
    p_original_amount: request.originalAmount,
    p_original_currency: request.originalCurrency,
    p_split_method: request.splitMethod,
    p_payers: request.payers,
    p_shares: request.shares,
    p_category: optional(request.category),
    p_fx_rate: optional(request.fxRate),
    p_fx_source: optional(request.fxSource),
  })
  if (error) fail(error)
  return data
}

export async function deleteExpense(expenseId: string, version: number): Promise<void> {
  const { error } = await supabase.rpc('delete_expense', { p_expense_id: expenseId, p_expected_version: version })
  if (error) fail(error)
}

export async function recordSettlement(groupId: string, settlement: {
  from: string; to: string; amount: string; note: string | null
}, requestId: string): Promise<string> {
  const { data, error } = await supabase.rpc('record_settlement', {
    p_group_id: groupId,
    p_from_member: settlement.from,
    p_to_member: settlement.to,
    p_amount: settlement.amount,
    p_note: optional(settlement.note),
    p_request_id: requestId,
  })
  if (error) fail(error)
  return data
}

export async function deleteSettlement(settlementId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_settlement', { p_settlement_id: settlementId })
  if (error) fail(error)
}
