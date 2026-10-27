// Trip ledger: parsing the server snapshot, balances, totals, and settle-up.
import { byMemberId, equalSplit, minorUnits, parseAmount, sumLines, type MoneyLine } from './money.ts'

export type SplitMethod = 'equal' | 'exact'
export type FxSource = 'manual' | 'open.er-api.com'

export interface LedgerExpense {
  id: string
  description: string
  category: string | null
  originalAmount: bigint
  originalCurrency: string
  accountingAmount: bigint
  accountingCurrency: string
  fxRate: string | null
  fxSource: FxSource | null
  fxCapturedAt: string | null
  splitMethod: SplitMethod
  createdBy: string
  version: number
  createdAt: string
  updatedAt: string
  payers: MoneyLine[]
  shares: MoneyLine[]
}

export interface LedgerSettlement {
  id: string
  fromMember: string
  toMember: string
  amount: bigint
  currency: string
  note: string | null
  recordedBy: string
  createdAt: string
}

export interface Ledger {
  accountingCurrency: string
  expenses: LedgerExpense[]
  settlements: LedgerSettlement[]
  /** Rows that do not reconcile in the Trip's accounting currency; kept out of every figure. */
  heldOut: string[]
}

type Json = Record<string, unknown>
const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value)
const str = (value: unknown): string | null => (typeof value === 'string' ? value : null)

function parseLines(raw: unknown, decimals: number): MoneyLine[] | null {
  if (!Array.isArray(raw)) return null
  const lines: MoneyLine[] = []
  for (const entry of raw) {
    if (!isObject(entry)) return null
    const memberId = str(entry.member_id)
    const amount = parseAmount(str(entry.amount) ?? '', decimals)
    if (!memberId || amount === null) return null
    lines.push({ memberId, amount })
  }
  return lines
}

/** True when payers and shares each exist and sum exactly to the accounting amount. */
export function isReconciled(expense: Pick<LedgerExpense, 'accountingAmount' | 'payers' | 'shares'>): boolean {
  return expense.payers.length > 0 && expense.shares.length > 0
    && sumLines(expense.payers) === expense.accountingAmount && sumLines(expense.shares) === expense.accountingAmount
}

function parseExpense(raw: unknown): LedgerExpense | null {
  if (!isObject(raw)) return null
  const originalCurrency = str(raw.original_currency)
  const accountingCurrency = str(raw.accounting_currency)
  const id = str(raw.id)
  if (!originalCurrency || !accountingCurrency || !id) return null
  const decimals = minorUnits(accountingCurrency)
  const originalAmount = parseAmount(str(raw.original_amount) ?? '', minorUnits(originalCurrency))
  const accountingAmount = parseAmount(str(raw.accounting_amount) ?? '', decimals)
  const payers = parseLines(raw.payers, decimals)
  const shares = parseLines(raw.shares, decimals)
  const splitMethod = raw.split_method === 'equal' || raw.split_method === 'exact' ? raw.split_method : null
  const fxSource = raw.fx_source === 'manual' || raw.fx_source === 'open.er-api.com' ? raw.fx_source : null
  const createdBy = str(raw.created_by)
  if (originalAmount === null || accountingAmount === null || !payers || !shares || !splitMethod || !createdBy) return null
  return {
    id,
    description: str(raw.description) ?? '',
    category: str(raw.category),
    originalAmount,
    originalCurrency,
    accountingAmount,
    accountingCurrency,
    fxRate: str(raw.fx_rate),
    fxSource,
    fxCapturedAt: str(raw.fx_captured_at),
    splitMethod,
    createdBy,
    version: typeof raw.version === 'number' ? raw.version : 0,
    createdAt: str(raw.created_at) ?? '',
    updatedAt: str(raw.updated_at) ?? '',
    payers,
    shares,
  }
}

function parseSettlement(raw: unknown): LedgerSettlement | null {
  if (!isObject(raw)) return null
  const currency = str(raw.currency)
  const id = str(raw.id)
  const fromMember = str(raw.from_member)
  const toMember = str(raw.to_member)
  const recordedBy = str(raw.recorded_by)
  if (!currency || !id || !fromMember || !toMember || !recordedBy) return null
  const amount = parseAmount(str(raw.amount) ?? '', minorUnits(currency))
  if (amount === null) return null
  return { id, fromMember, toMember, amount, currency, note: str(raw.note), recordedBy, createdAt: str(raw.created_at) ?? '' }
}

/** Parse get_split_ledger output. Anything malformed is held out, never guessed at. */
export function parseLedger(raw: unknown): Ledger {
  if (!isObject(raw) || typeof raw.accounting_currency !== 'string') throw new Error('ledger_malformed')
  const accountingCurrency = raw.accounting_currency
  const heldOut: string[] = []
  const expenses: LedgerExpense[] = []
  for (const entry of Array.isArray(raw.expenses) ? raw.expenses : []) {
    const expense = parseExpense(entry)
    if (expense && expense.accountingCurrency === accountingCurrency && isReconciled(expense)) expenses.push(expense)
    else heldOut.push(isObject(entry) && typeof entry.id === 'string' ? entry.id : 'unknown')
  }
  const settlements: LedgerSettlement[] = []
  for (const entry of Array.isArray(raw.settlements) ? raw.settlements : []) {
    const settlement = parseSettlement(entry)
    if (settlement && settlement.currency === accountingCurrency) settlements.push(settlement)
    else heldOut.push(isObject(entry) && typeof entry.id === 'string' ? entry.id : 'unknown')
  }
  return { accountingCurrency, expenses, settlements, heldOut }
}

const add = (map: Map<string, bigint>, key: string, amount: bigint) => map.set(key, (map.get(key) ?? 0n) + amount)

/**
 * Net balance per member in accounting minor units: paid - owed, plus
 * settlements paid, minus settlements received. Positive means the group owes
 * them. Every member id in `memberIds` appears, even at zero.
 */
export function computeBalances(
  expenses: readonly LedgerExpense[],
  settlements: readonly LedgerSettlement[],
  memberIds: readonly string[] = [],
): Map<string, bigint> {
  const balances = new Map<string, bigint>(memberIds.map((id) => [id, 0n]))
  for (const expense of expenses) {
    for (const payer of expense.payers) add(balances, payer.memberId, payer.amount)
    for (const share of expense.shares) add(balances, share.memberId, -share.amount)
  }
  for (const settlement of settlements) {
    add(balances, settlement.fromMember, settlement.amount)
    add(balances, settlement.toMember, -settlement.amount)
  }
  return balances
}

export interface MemberTotals {
  paid: bigint
  share: bigint
  /** paid - share; excludes settlements (the balance includes them). */
  net: bigint
}

export function computeGroupTotals(expenses: readonly LedgerExpense[], memberIds: readonly string[] = []) {
  const members = new Map<string, MemberTotals>(memberIds.map((id) => [id, { paid: 0n, share: 0n, net: 0n }]))
  const entry = (id: string) => {
    const current = members.get(id) ?? { paid: 0n, share: 0n, net: 0n }
    members.set(id, current)
    return current
  }
  let total = 0n
  for (const expense of expenses) {
    total += expense.accountingAmount
    for (const payer of expense.payers) entry(payer.memberId).paid += payer.amount
    for (const share of expense.shares) entry(share.memberId).share += share.amount
  }
  for (const value of members.values()) value.net = value.paid - value.share
  return { total, members }
}

export interface SettlementSuggestion {
  from: string
  to: string
  amount: bigint
}

/**
 * Greedy settle-up: repeatedly the largest debtor pays the largest creditor
 * the smaller of the two amounts (ties by member id), so at most n - 1
 * transfers. Balances whose size is at most `dust` minor units are ignored;
 * with exact minor units the default 0 leaves nothing behind.
 */
export function suggestSettlements(balances: ReadonlyMap<string, bigint>, dust = 0n): SettlementSuggestion[] {
  const order = (a: { id: string; amount: bigint }, b: { id: string; amount: bigint }) =>
    a.amount === b.amount ? byMemberId(a.id, b.id) : a.amount > b.amount ? -1 : 1
  const creditors = [...balances].filter(([, amount]) => amount > dust).map(([id, amount]) => ({ id, amount }))
  const debtors = [...balances].filter(([, amount]) => amount < -dust).map(([id, amount]) => ({ id, amount: -amount }))
  const suggestions: SettlementSuggestion[] = []
  while (creditors.length && debtors.length) {
    creditors.sort(order)
    debtors.sort(order)
    const creditor = creditors[0]
    const debtor = debtors[0]
    const amount = debtor.amount < creditor.amount ? debtor.amount : creditor.amount
    suggestions.push({ from: debtor.id, to: creditor.id, amount })
    creditor.amount -= amount
    debtor.amount -= amount
    if (creditor.amount <= dust) creditors.shift()
    if (debtor.amount <= dust) debtors.shift()
  }
  return suggestions
}

/** True when an equal-split Expense's shares follow the documented remainder rule. */
export function followsEqualRule(expense: Pick<LedgerExpense, 'accountingAmount' | 'shares'>): boolean {
  const expected = equalSplit(expense.accountingAmount, expense.shares.map((share) => share.memberId))
  const actual = [...expense.shares].sort((a, b) => byMemberId(a.memberId, b.memberId))
  return expected.length === actual.length && expected.every((line, index) => line.amount === actual[index].amount)
}
