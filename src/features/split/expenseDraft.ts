// Add/Edit expense form state -> validated, exactly reconciling RPC request.
// Payer and exact-share inputs are typed in the expense's own currency; they
// are carried into the accounting currency by largest-remainder allocation so
// the stored rows still sum exactly to the converted total. Equal, percent and
// shares splits are applied to the accounting total directly, by the same rules
// the server re-checks.
import { isWeighted, type FxSource, type LedgerExpense, type SplitMethod } from './ledger.ts'
import {
  allocateProportionally, byMemberId, convertAmount, equalSplit, formatPercent, FULL_PERCENT, MAX_SHARE_WEIGHT,
  minorUnits, parseAmount, parsePercent, parseRate, parseShareWeight, sumLines, toDecimalString, weightedSplit,
  type MoneyLine, type WeightLine,
} from './money.ts'

export const CATEGORIES = [
  { id: 'food', label: 'Food & drink' },
  { id: 'transport', label: 'Transport' },
  { id: 'stay', label: 'Stay' },
  { id: 'activity', label: 'Activity' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'other', label: 'Other' },
] as const

export interface ExpenseDraft {
  description: string
  category: string
  amount: string
  currency: string
  rate: string
  rateSource: FxSource
  payerMode: 'single' | 'multiple'
  payerId: string
  payerAmounts: Record<string, string>
  splitMode: SplitMethod
  included: string[]
  shareAmounts: Record<string, string>
  /** Percent split: each person's percent as typed ("33.33"); blank or 0 leaves them out. */
  sharePercents: Record<string, string>
  /** Shares split: each person's whole number of shares; blank or 0 leaves them out. */
  shareWeights: Record<string, string>
}

export interface DraftContext {
  accountingCurrency: string
  /** Active members who can pay or share, in display order. */
  memberIds: readonly string[]
}

export interface ExpenseRequest {
  description: string
  category: string | null
  originalAmount: string
  originalCurrency: string
  fxRate: string | null
  fxSource: FxSource | null
  splitMethod: SplitMethod
  payers: { member_id: string; amount: string }[]
  /** `weight` is sent for percent ("33.33") and shares ("2") splits only. */
  shares: { member_id: string; amount: string; weight?: string }[]
}

export type DraftField = 'description' | 'amount' | 'currency' | 'rate' | 'payers' | 'shares'

export interface TotalCheck {
  /** Entered and required totals, in the expense's own currency minor units. */
  entered: bigint
  required: bigint
  matches: boolean
}

export interface DraftEvaluation {
  errors: Partial<Record<DraftField, string>>
  currency: string
  originalMinor: bigint | null
  accountingMinor: bigint | null
  payerCheck: TotalCheck | null
  shareCheck: TotalCheck | null
  /** Percent split: entered and required percent, in basis points (100% = 10000). */
  percentCheck: TotalCheck | null
  /** Shares split: the total number of shares entered. */
  shareCount: bigint | null
  /** Accounting lines that will be stored, when the draft is valid. */
  payers: MoneyLine[]
  shares: MoneyLine[]
  request: ExpenseRequest | null
}

export function emptyDraft(context: DraftContext, me: string): ExpenseDraft {
  return {
    description: '',
    category: '',
    amount: '',
    currency: context.accountingCurrency,
    rate: '',
    rateSource: 'manual',
    payerMode: 'single',
    payerId: context.memberIds.includes(me) ? me : (context.memberIds[0] ?? ''),
    payerAmounts: {},
    splitMode: 'equal',
    included: [...context.memberIds],
    shareAmounts: {},
    sharePercents: {},
    shareWeights: {},
  }
}

/**
 * Change the split mode, keeping every mode's own inputs. Switching to shares
 * with none entered starts everyone in the equal-split list at 1 share.
 */
export function switchSplitMode(draft: ExpenseDraft, splitMode: SplitMethod): ExpenseDraft {
  const hasWeights = Object.values(draft.shareWeights).some((value) => value.trim() !== '')
  if (splitMode !== 'shares' || hasWeights) return { ...draft, splitMode }
  return { ...draft, splitMode, shareWeights: Object.fromEntries(draft.included.map((id) => [id, '1'])) }
}

const currencyCode = (value: string) => value.trim().toUpperCase()

/** Typed per-person amounts in the expense currency; blank counts as zero. */
function enteredLines(amounts: Record<string, string>, memberIds: readonly string[], decimals: number): MoneyLine[] | null {
  const lines: MoneyLine[] = []
  for (const memberId of memberIds) {
    const raw = (amounts[memberId] ?? '').trim()
    if (!raw) continue
    const amount = parseAmount(raw, decimals)
    if (amount === null) return null
    if (amount > 0n) lines.push({ memberId, amount })
  }
  return lines
}

/** Typed percents or shares as positive weights; blank or zero leaves a person out. Null if any is invalid. */
function enteredWeights(values: Record<string, string>, memberIds: readonly string[], parse: (raw: string) => bigint | null): WeightLine[] | null {
  const lines: WeightLine[] = []
  for (const memberId of memberIds) {
    const raw = (values[memberId] ?? '').trim()
    if (!raw) continue
    const weight = parse(raw)
    if (weight === null) return null
    if (weight > 0n) lines.push({ memberId, weight })
  }
  return lines
}

export function evaluateDraft(draft: ExpenseDraft, context: DraftContext): DraftEvaluation {
  const errors: DraftEvaluation['errors'] = {}
  const currency = currencyCode(draft.currency)
  const accounting = context.accountingCurrency
  const result: DraftEvaluation = {
    errors, currency, originalMinor: null, accountingMinor: null, payerCheck: null, shareCheck: null,
    percentCheck: null, shareCount: null, payers: [], shares: [], request: null,
  }

  const description = draft.description.trim()
  if (!description) errors.description = 'Enter a description.'
  else if (description.length > 120) errors.description = 'Keep the description to 120 characters.'

  if (!/^[A-Z]{3}$/u.test(currency)) errors.currency = 'Use a three-letter currency code, like USD.'
  const decimals = minorUnits(currency)

  const typed = draft.amount.trim()
  const original = errors.currency ? null : parseAmount(typed, decimals)
  if (!errors.currency) {
    if (/^-/u.test(typed)) errors.amount = 'Enter an amount above zero. To correct an expense, edit it instead.'
    else if (typed.includes(',')) errors.amount = 'Use a dot for decimals and no thousands separators, like 1250.50.'
    else if (original === null && /^\s*[\d.,]+\s*$/u.test(typed) && decimals === 0) errors.amount = `${currency} amounts have no decimal places.`
    else if (original === null && /^\s*[\d.,]+\s*$/u.test(typed)) errors.amount = `${currency} amounts have at most ${decimals} decimal places.`
    else if (original === null || original <= 0n) errors.amount = 'Enter an amount above zero.'
    else if (original >= 10n ** BigInt(12 + decimals)) errors.amount = 'That amount is too large.'
  }
  result.originalMinor = errors.amount || errors.currency ? null : original

  const converts = !errors.currency && currency !== accounting
  const rate = converts ? parseRate(draft.rate) : null
  if (converts && rate === null) {
    errors.rate = draft.rate.trim()
      ? 'Use a rate above zero with at most 12 decimal places.'
      : `Enter how many ${accounting} one ${currency} is worth.`
  }

  if (result.originalMinor !== null && (!converts || rate !== null)) {
    const accountingMinor = converts && rate ? convertAmount(result.originalMinor, currency, rate, accounting) : result.originalMinor
    if (accountingMinor <= 0n) errors.amount = `That converts to less than one ${accounting} minor unit.`
    else result.accountingMinor = accountingMinor
  }

  const total = result.originalMinor
  const accountingTotal = result.accountingMinor
  const toAccounting = (lines: MoneyLine[]) => (accountingTotal === null ? [] : converts
    ? allocateProportionally(accountingTotal, lines).filter((line) => line.amount > 0n)
    : [...lines].sort((a, b) => byMemberId(a.memberId, b.memberId)))

  // Payers.
  if (draft.payerMode === 'single') {
    if (!context.memberIds.includes(draft.payerId)) errors.payers = 'Choose who paid.'
    else if (accountingTotal !== null) result.payers = [{ memberId: draft.payerId, amount: accountingTotal }]
  } else {
    const lines = errors.currency ? null : enteredLines(draft.payerAmounts, context.memberIds, decimals)
    if (lines === null) errors.payers = `Use ${currency} amounts with a dot and at most ${decimals} decimal places.`
    else if (!lines.length) errors.payers = 'Enter how much each person paid, or switch to one payer.'
    else if (total !== null) {
      const entered = sumLines(lines)
      result.payerCheck = { entered, required: total, matches: entered === total }
      if (entered !== total) errors.payers = 'Payer amounts must add up to the total.'
      else result.payers = toAccounting(lines)
    }
  }

  // Shares.
  let weights: WeightLine[] = []
  if (draft.splitMode === 'equal') {
    const people = draft.included.filter((id) => context.memberIds.includes(id))
    if (!people.length) errors.shares = 'Choose at least one person to split with.'
    else if (accountingTotal !== null) result.shares = equalSplit(accountingTotal, people)
  } else if (draft.splitMode === 'percent') {
    const lines = enteredWeights(draft.sharePercents, context.memberIds, parsePercent)
    if (lines === null) errors.shares = 'Use percents from 0 to 100 with at most 2 decimal places, like 33.33.'
    else {
      const entered = lines.reduce((total, line) => total + line.weight, 0n)
      result.percentCheck = { entered, required: FULL_PERCENT, matches: entered === FULL_PERCENT }
      if (!lines.length) errors.shares = 'Enter each person’s percent, or split equally.'
      else if (entered !== FULL_PERCENT) errors.shares = 'Percents must add up to 100%.'
      else {
        weights = lines
        if (accountingTotal !== null) result.shares = weightedSplit(accountingTotal, lines)
      }
    }
  } else if (draft.splitMode === 'shares') {
    const lines = enteredWeights(draft.shareWeights, context.memberIds, parseShareWeight)
    if (lines === null) errors.shares = `Use whole numbers of shares from 0 to ${MAX_SHARE_WEIGHT}, like 1 or 2.`
    else if (!lines.length) errors.shares = 'Give at least one person a share, or split equally.'
    else {
      weights = lines
      result.shareCount = lines.reduce((total, line) => total + line.weight, 0n)
      if (accountingTotal !== null) result.shares = weightedSplit(accountingTotal, lines)
    }
  } else {
    const lines = errors.currency ? null : enteredLines(draft.shareAmounts, context.memberIds, decimals)
    if (lines === null) errors.shares = `Use ${currency} amounts with a dot and at most ${decimals} decimal places.`
    else if (!lines.length) errors.shares = 'Enter each person’s share, or split equally.'
    else if (total !== null) {
      const entered = sumLines(lines)
      result.shareCheck = { entered, required: total, matches: entered === total }
      if (entered !== total) errors.shares = 'Shares must add up to the total.'
      else result.shares = toAccounting(lines)
    }
  }

  if (Object.keys(errors).length || accountingTotal === null || result.originalMinor === null) return result
  const accountingDecimals = minorUnits(accounting)
  const wire = (lines: MoneyLine[]) => lines.map((line) => ({ member_id: line.memberId, amount: toDecimalString(line.amount, accountingDecimals) }))
  const weightOf = new Map(weights.map((line) => [line.memberId, line.weight]))
  const weightText = (weight: bigint) => (draft.splitMode === 'percent' ? formatPercent(weight) : weight.toString())
  result.request = {
    description,
    category: CATEGORIES.some((entry) => entry.id === draft.category) ? draft.category : null,
    originalAmount: toDecimalString(result.originalMinor, decimals),
    originalCurrency: currency,
    fxRate: converts ? rate : null,
    fxSource: converts ? draft.rateSource : null,
    splitMethod: draft.splitMode,
    payers: wire(result.payers),
    shares: isWeighted(draft.splitMode)
      ? wire(result.shares).map((line) => ({ ...line, weight: weightText(weightOf.get(line.member_id) ?? 0n) }))
      : wire(result.shares),
  }
  return result
}

/** Carry stored accounting lines back into the expense currency for editing. */
function toOriginal(expense: LedgerExpense, lines: MoneyLine[]): Record<string, string> {
  const decimals = minorUnits(expense.originalCurrency)
  const original = expense.originalCurrency === expense.accountingCurrency
    ? lines
    : allocateProportionally(expense.originalAmount, lines)
  return Object.fromEntries(original.map((line) => [line.memberId, toDecimalString(line.amount, decimals)]))
}

/** Stored weights back into the inputs they were typed as. */
function weightInputs(expense: LedgerExpense, method: 'percent' | 'shares'): Record<string, string> {
  if (expense.splitMethod !== method) return {}
  return Object.fromEntries(expense.shares.map((share) => [share.memberId,
    method === 'percent' ? formatPercent(share.weight ?? 0n) : (share.weight ?? 0n).toString()]))
}

export function draftFromExpense(expense: LedgerExpense, context: DraftContext): ExpenseDraft {
  const single = expense.payers.length === 1
  return {
    description: expense.description,
    category: expense.category ?? '',
    amount: toDecimalString(expense.originalAmount, minorUnits(expense.originalCurrency)),
    currency: expense.originalCurrency,
    rate: expense.fxRate ?? '',
    rateSource: expense.fxSource ?? 'manual',
    payerMode: single ? 'single' : 'multiple',
    payerId: single ? expense.payers[0].memberId : (context.memberIds[0] ?? ''),
    payerAmounts: single ? {} : toOriginal(expense, expense.payers),
    splitMode: expense.splitMethod,
    included: expense.splitMethod === 'exact' ? [...context.memberIds] : expense.shares.map((share) => share.memberId),
    shareAmounts: expense.splitMethod === 'exact' ? toOriginal(expense, expense.shares) : {},
    sharePercents: weightInputs(expense, 'percent'),
    shareWeights: weightInputs(expense, 'shares'),
  }
}

/** Everyone on the expense, for checking it only involves active members. */
export function expenseMemberIds(expense: Pick<LedgerExpense, 'payers' | 'shares'>): string[] {
  return [...new Set([...expense.payers, ...expense.shares].map((line) => line.memberId))]
}
