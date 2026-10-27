// Trip ledger: parsing the server snapshot, balances, totals, and settle-up.
import {
  byMemberId, equalSplit, FULL_PERCENT, minorUnits, parseAmount, PERCENT_DECIMALS, sumLines, weightedSplit, type MoneyLine,
} from './money.ts'

export type SplitMethod = 'equal' | 'exact' | 'percent' | 'shares'
export type FxSource = 'manual' | 'open.er-api.com'

export const SPLIT_METHODS: readonly SplitMethod[] = ['equal', 'exact', 'percent', 'shares']
const isSplitMethod = (value: unknown): value is SplitMethod => SPLIT_METHODS.includes(value as SplitMethod)

/** True for the modes whose shares are computed from a stored weight per person. */
export const isWeighted = (method: SplitMethod): method is 'percent' | 'shares' => method === 'percent' || method === 'shares'

/**
 * A final share. Percent and shares splits also carry the input it came from:
 * basis points (1% = 100) for percent, the whole number of shares for shares.
 */
export interface ShareLine extends MoneyLine {
  weight?: bigint
}

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
  shares: ShareLine[]
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

/**
 * Percent and shares lines need a valid weight on every share (percents total
 * exactly 100); equal and exact lines carry none. Null when that does not hold.
 */
function parseShares(raw: unknown, decimals: number, method: SplitMethod): ShareLine[] | null {
  const lines: ShareLine[] | null = parseLines(raw, decimals)
  if (!lines || !Array.isArray(raw)) return null
  for (const [index, line] of lines.entries()) {
    const entry = raw[index] as Json
    const text = str(entry.weight)
    if (!isWeighted(method)) {
      if (entry.weight !== undefined && entry.weight !== null) return null
      continue
    }
    const weight = text === null ? null : parseAmount(text, method === 'percent' ? PERCENT_DECIMALS : 0)
    if (weight === null || weight <= 0n) return null
    line.weight = weight
  }
  if (method === 'percent' && lines.reduce((total, line) => total + (line.weight ?? 0n), 0n) !== FULL_PERCENT) return null
  return lines
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
  const splitMethod = isSplitMethod(raw.split_method) ? raw.split_method : null
  const shares = splitMethod ? parseShares(raw.shares, decimals, splitMethod) : null
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

/**
 * True when an Expense's shares are exactly what its method gives: the equal
 * rule, or the largest-remainder split of its stored percents or shares.
 * Exact splits have no rule beyond summing to the total.
 */
export function followsSplitRule(expense: Pick<LedgerExpense, 'accountingAmount' | 'shares' | 'splitMethod'>): boolean {
  if (expense.splitMethod === 'equal') return followsEqualRule(expense)
  if (!isWeighted(expense.splitMethod)) return true
  if (expense.shares.some((share) => share.weight === undefined)) return false
  const expected = weightedSplit(expense.accountingAmount, expense.shares.map((share) => ({ memberId: share.memberId, weight: share.weight ?? 0n })))
  const actual = [...expense.shares].sort((a, b) => byMemberId(a.memberId, b.memberId))
  return expected.length === actual.length && expected.every((line, index) => line.amount === actual[index].amount)
}
