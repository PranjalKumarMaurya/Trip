import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { NeonBtn } from '../../components/ui/NeonBtn'
import {
  CATEGORIES, draftFromExpense, emptyDraft, evaluateDraft, switchSplitMode, type DraftField, type ExpenseDraft, type TotalCheck,
} from './expenseDraft'
import { fetchLiveRate } from './fxRate'
import type { LedgerExpense } from './ledger'
import { equalSplit, formatMoney, type MoneyLine } from './money'
import { commitExpense, SplitRequestError, updateExpense } from './splitApi'
import { Field, SplitDialog, inputClass, inputStyle } from './SplitDialog'
import { splitErrorMessage } from './splitErrors'
import { SPLIT_OPTIONS, WeightFields } from './SplitWeights'

const COMMON_CURRENCIES = ['INR', 'IDR', 'USD', 'EUR', 'GBP', 'SGD', 'THB', 'AED', 'JPY', 'AUD', 'MYR', 'VND', 'LKR', 'NPR']

export interface SplitMember {
  id: string
  name: string
}

type RateState = { kind: 'idle' } | { kind: 'loading' } | { kind: 'live'; asOf: string | null } | { kind: 'error' }

export function ExpenseForm({ groupId, accountingCurrency, timezone, me, members, expense, onClose, onSaved, international = true }: {
  groupId: string
  accountingCurrency: string
  timezone: string
  /** Domestic Trips record everything in the Trip currency: no currency field or conversion. */
  international?: boolean
  me: string
  /** Active members, in roster order. */
  members: SplitMember[]
  /** The Expense being edited, or null to add one. */
  expense: LedgerExpense | null
  onClose: () => void
  onSaved: () => void
}) {
  const context = useMemo(() => ({ accountingCurrency, memberIds: members.map((member) => member.id) }), [accountingCurrency, members])
  const [initial] = useState<ExpenseDraft>(() => (expense ? draftFromExpense(expense, context) : emptyDraft(context, me)))
  const [draft, setDraft] = useState<ExpenseDraft>(initial)
  const [touched, setTouched] = useState<ReadonlySet<DraftField>>(new Set())
  const [attempted, setAttempted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [rateState, setRateState] = useState<RateState>({ kind: 'idle' })
  // One request id per form: a retry after a lost response returns the same Expense.
  const requestId = useRef(crypto.randomUUID())
  const seenMembers = useRef(new Set(context.memberIds))

  // People who appear while a new expense is open (the roster refreshes when it
  // opens) are included in an equal split, and the payer defaults to me.
  useEffect(() => {
    const joined = context.memberIds.filter((id) => !seenMembers.current.has(id))
    joined.forEach((id) => seenMembers.current.add(id))
    if (expense || !joined.length) return
    setDraft((current) => ({
      ...current,
      included: [...current.included, ...joined],
      payerId: context.memberIds.includes(current.payerId) ? current.payerId : (context.memberIds.includes(me) ? me : context.memberIds[0]),
    }))
  }, [context.memberIds, expense, me])

  const evaluation = evaluateDraft(draft, context)
  const currency = evaluation.currency
  const converts = !evaluation.errors.currency && currency !== accountingCurrency
  // Domestic: the currency is always the Trip currency. An older expense in another
  // currency (from when the Trip was international) still shows its conversion.
  const showCurrency = international || initial.currency !== accountingCurrency
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial)
  const show = (field: DraftField) => (attempted || touched.has(field) ? evaluation.errors[field] : undefined)
  const touch = (field: DraftField) => () => setTouched((current) => new Set(current).add(field))
  const update = (changes: Partial<ExpenseDraft>) => {
    if (saving) return
    setServerError(null)
    setDraft((current) => ({ ...current, ...changes }))
  }
  const money = (minor: bigint, code = currency) => formatMoney(minor, code)

  const requestClose = () => {
    if (saving) return
    if (dirty) setConfirmDiscard(true)
    else onClose()
  }

  // Returning to an edited expense's own currency restores its stored snapshot.
  const changeCurrency = (code: string) => {
    setRateState({ kind: 'idle' })
    const original = expense && code === expense.originalCurrency
    update({ currency: code, rate: original ? (expense.fxRate ?? '') : '', rateSource: original ? (expense.fxSource ?? 'manual') : 'manual' })
  }

  const fetchRate = async () => {
    setRateState({ kind: 'loading' })
    try {
      const live = await fetchLiveRate(currency, accountingCurrency)
      setDraft((current) => ({ ...current, rate: live.rate, rateSource: 'open.er-api.com' }))
      setRateState({ kind: 'live', asOf: live.asOf })
    } catch {
      setRateState({ kind: 'error' })
    }
  }

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    setAttempted(true)
    setServerError(null)
    const request = evaluation.request
    if (!request) return
    setSaving(true)
    try {
      if (expense) await updateExpense(expense.id, expense.version, request)
      else await commitExpense(groupId, request, requestId.current)
      onSaved()
    } catch (error) {
      setServerError(splitErrorMessage(error instanceof SplitRequestError ? error.code : null))
      setSaving(false)
    }
  }

  const keepsSnapshot = expense?.fxRate && expense.fxCapturedAt && converts
    && currency === expense.originalCurrency && draft.rate === expense.fxRate && draft.rateSource === expense.fxSource
  const perHead = draft.splitMode === 'equal' && evaluation.shares.length ? range(evaluation.shares) : null
  const originalPerHead = converts && perHead && evaluation.originalMinor !== null
    ? range(equalSplit(evaluation.originalMinor, evaluation.shares.map((line) => line.memberId)))
    : null

  return (
    <SplitDialog title={expense ? 'Edit expense' : 'Add expense'} onClose={requestClose} locked={saving} testId="expense-form">
      {confirmDiscard ? (
        <section aria-label="Discard changes" className="flex flex-col gap-4">
          <p style={{ color: 'var(--text-secondary)' }}>Discard what you’ve entered? Nothing has been saved.</p>
          <div className="flex gap-2">
            <NeonBtn type="button" onClick={onClose} className="flex-1">Discard</NeonBtn>
            <NeonBtn type="button" variant="ghost" onClick={() => setConfirmDiscard(false)} className="flex-1">Keep editing</NeonBtn>
          </div>
        </section>
      ) : (
        <form onSubmit={(event) => void save(event)} aria-label={expense ? 'Edit expense' : 'Add expense'} aria-busy={saving}
          noValidate className="flex flex-col gap-4">
          <fieldset disabled={saving} className="flex flex-col gap-4">
            <Field label="Description" error={show('description')}>
              {(control) => <input {...control} className={inputClass} style={inputStyle} value={draft.description}
                maxLength={120} placeholder="Dinner, ferry, villa…" onChange={(event) => update({ description: event.target.value })}
                onBlur={touch('description')} />}
            </Field>
            <div className={showCurrency ? 'grid grid-cols-[1fr_96px] gap-3' : 'grid grid-cols-1 gap-3'}>
              <Field label="Total amount" error={show('amount')}>
                {(control) => <input {...control} className={inputClass} style={inputStyle} value={draft.amount} inputMode="decimal"
                  autoComplete="off" placeholder="0.00" onChange={(event) => update({ amount: event.target.value })} onBlur={touch('amount')} />}
              </Field>
              {showCurrency && <Field label="Currency" error={show('currency')}>
                {(control) => <input {...control} className={inputClass} style={inputStyle} value={draft.currency} maxLength={3}
                  list="split-currencies" autoComplete="off"
                  onChange={(event) => changeCurrency(event.target.value.toUpperCase())}
                  onBlur={touch('currency')} />}
              </Field>}
              {showCurrency && <datalist id="split-currencies">{COMMON_CURRENCIES.map((code) => <option key={code} value={code} />)}</datalist>}
            </div>

            {showCurrency && converts && (
              <div className="surface flex flex-col gap-2 px-3.5 py-3">
                <Field label={`Exchange rate: ${accountingCurrency} for 1 ${currency}`} error={show('rate')}
                  hint={rateHint(rateState, keepsSnapshot ? expense : null, timezone)}>
                  {(control) => <input {...control} className={inputClass} style={inputStyle} value={draft.rate} inputMode="decimal"
                    autoComplete="off" placeholder="e.g. 83.12"
                    onChange={(event) => { setRateState({ kind: 'idle' }); update({ rate: event.target.value, rateSource: 'manual' }) }}
                    onBlur={touch('rate')} />}
                </Field>
                <div className="flex items-center justify-between gap-3">
                  <button type="button" onClick={() => void fetchRate()} disabled={rateState.kind === 'loading'}
                    className="min-h-11 text-sm" style={{ color: 'var(--accent)' }}>
                    {rateState.kind === 'loading' ? 'Fetching rate…' : 'Use live rate'}
                  </button>
                  {evaluation.accountingMinor !== null && (
                    <p className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: 12 }} data-testid="converted-amount">
                      = {money(evaluation.accountingMinor, accountingCurrency)}
                    </p>
                  )}
                </div>
              </div>
            )}

            <Field label="Category">
              {(control) => (
                <select {...control} className={inputClass} style={inputStyle} value={draft.category}
                  onChange={(event) => update({ category: event.target.value })}>
                  <option value="">No category</option>
                  {CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
                </select>
              )}
            </Field>

            <Choice legend="Paid by" name="payer-mode" value={draft.payerMode}
              options={[{ value: 'single', label: 'One person' }, { value: 'multiple', label: 'Several people' }]}
              onChange={(payerMode) => update({ payerMode })}>
              {draft.payerMode === 'single' ? (
                <Field label="Who paid" error={show('payers')}>
                  {(control) => (
                    <select {...control} className={inputClass} style={inputStyle} value={draft.payerId}
                      onChange={(event) => update({ payerId: event.target.value })}>
                      {members.map((member) => <option key={member.id} value={member.id}>{member.name}{member.id === me ? ' (you)' : ''}</option>)}
                    </select>
                  )}
                </Field>
              ) : (
                <AmountList label="Paid by" members={members} currency={currency} values={draft.payerAmounts}
                  onChange={(payerAmounts) => update({ payerAmounts })} />
              )}
              {draft.payerMode === 'multiple' && (
                <TotalStrip check={evaluation.payerCheck} what="Paid" matchText="Payer amounts match the total." money={money}
                  error={show('payers')} />
              )}
            </Choice>

            <Choice legend="Split" name="split-mode" value={draft.splitMode} options={SPLIT_OPTIONS}
              onChange={(splitMode) => update(switchSplitMode(draft, splitMode))}>
              {draft.splitMode === 'percent' || draft.splitMode === 'shares' ? (
                <WeightFields mode={draft.splitMode} members={members} evaluation={evaluation} currency={currency}
                  accountingCurrency={accountingCurrency} money={money} error={evaluation.errors.shares}
                  values={draft.splitMode === 'percent' ? draft.sharePercents : draft.shareWeights}
                  onChange={(values) => update(draft.splitMode === 'percent' ? { sharePercents: values } : { shareWeights: values })} />
              ) : draft.splitMode === 'equal' ? (
                <>
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Split between</span>
                    <span className="flex gap-3 text-sm">
                      <button type="button" className="min-h-11" style={{ color: 'var(--accent)' }}
                        onClick={() => update({ included: members.map((member) => member.id) })}>Everyone</button>
                      <button type="button" className="min-h-11" style={{ color: 'var(--text-secondary)' }}
                        onClick={() => update({ included: [] })}>No one</button>
                    </span>
                  </div>
                  <ul className="flex flex-col gap-1" aria-label="People sharing this expense">
                    {members.map((member) => (
                      <li key={member.id}>
                        <label className="flex min-h-11 items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                          <input type="checkbox" style={{ accentColor: 'var(--accent)', width: 18, height: 18 }}
                            checked={draft.included.includes(member.id)}
                            onChange={(event) => update({
                              included: event.target.checked
                                ? [...draft.included, member.id]
                                : draft.included.filter((id) => id !== member.id),
                            })} />
                          {member.name}
                        </label>
                      </li>
                    ))}
                  </ul>
                  {show('shares') && <p role="alert" style={{ color: 'var(--accent)', fontSize: 12 }}>{show('shares')}</p>}
                  {perHead && (
                    <p role="status" className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                      {rangeText(perHead, (minor) => money(minor, accountingCurrency))} each
                      {originalPerHead ? ` (${rangeText(originalPerHead, money)})` : ''}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <AmountList label="Share for" members={members} currency={currency} values={draft.shareAmounts}
                    onChange={(shareAmounts) => update({ shareAmounts })} />
                  <TotalStrip check={evaluation.shareCheck} what="Shared" matchText="Shares match the total." money={money}
                    error={show('shares')} />
                </>
              )}
            </Choice>
          </fieldset>

          {serverError && (
            <p role="alert" className="surface px-3.5 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>{serverError}</p>
          )}
          {attempted && !evaluation.request && !serverError && (
            <p role="alert" className="text-sm" style={{ color: 'var(--accent)' }}>Check the highlighted fields.</p>
          )}
          <div className="flex gap-2">
            <NeonBtn type="submit" disabled={saving} className="min-h-11 flex-1">
              {saving ? 'Saving…' : expense ? 'Save changes' : 'Save expense'}
            </NeonBtn>
            <NeonBtn type="button" variant="ghost" disabled={saving} onClick={requestClose} className="min-h-11">Cancel</NeonBtn>
          </div>
        </form>
      )}
    </SplitDialog>
  )
}

function range(lines: MoneyLine[]): { min: bigint; max: bigint } {
  return lines.reduce((acc, line) => ({
    min: line.amount < acc.min ? line.amount : acc.min,
    max: line.amount > acc.max ? line.amount : acc.max,
  }), { min: lines[0].amount, max: lines[0].amount })
}

function rangeText({ min, max }: { min: bigint; max: bigint }, money: (minor: bigint) => string): string {
  return min === max ? money(min) : `${money(min)}–${money(max)}`
}

function rateHint(state: RateState, kept: LedgerExpense | null, timezone: string): string | undefined {
  if (state.kind === 'live') return `Live reference rate from open.er-api.com${state.asOf ? `, updated ${state.asOf}` : ''}. It is saved with this expense and never changes later.`
  if (state.kind === 'error') return 'Could not fetch a live rate. Enter the rate you were charged.'
  if (kept?.fxCapturedAt) return `Rate captured ${formatWhen(kept.fxCapturedAt, timezone)}. Keeping it leaves the recorded conversion unchanged.`
  return 'Use the rate you were charged, or fetch a live reference rate.'
}

export function formatWhen(iso: string, timezone: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { timeZone: timezone, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
      .format(new Date(iso))
  } catch {
    return iso
  }
}

function Choice<T extends string>({ legend, name, value, options, onChange, children }: {
  legend: string
  name: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  children: ReactNode
}) {
  return (
    <fieldset className="surface flex flex-col gap-3 px-3.5 py-3">
      <legend className="sr-only">{legend}</legend>
      <span aria-hidden="true" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{legend}</span>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const checked = value === option.value
          return (
            <label key={option.value} className="flex min-h-11 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-2 text-[13px]"
              style={{
                borderColor: checked ? 'var(--accent)' : 'var(--border)',
                background: checked ? 'var(--accent-soft)' : 'transparent',
                color: checked ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}>
              <input type="radio" name={name} value={option.value} checked={checked}
                onChange={() => onChange(option.value)} style={{ accentColor: 'var(--accent)' }} />
              {option.label}
            </label>
          )
        })}
      </div>
      {children}
    </fieldset>
  )
}

function AmountList({ label, members, currency, values, onChange }: {
  label: string
  members: SplitMember[]
  currency: string
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
}) {
  return (
    <ul className="flex flex-col gap-2">
      {members.map((member) => (
        <li key={member.id} className="grid grid-cols-[1fr_120px_36px] items-center gap-2">
          <span aria-hidden="true" className="truncate text-sm" style={{ color: 'var(--text-primary)' }}>{member.name}</span>
          <input aria-label={`${label} ${member.name}`} className={inputClass} style={inputStyle}
            inputMode="decimal" autoComplete="off" placeholder="0" value={values[member.id] ?? ''}
            onChange={(event) => onChange({ ...values, [member.id]: event.target.value })} />
          <span className="font-mono" style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{currency}</span>
        </li>
      ))}
    </ul>
  )
}

function TotalStrip({ check, what, matchText, money, error }: {
  check: TotalCheck | null
  what: string
  matchText: string
  money: (minor: bigint) => string
  error?: string
}) {
  const matches = check?.matches ?? false
  const text = !check
    ? error
    : matches
      ? matchText
      : `${what} ${money(check.entered)} of ${money(check.required)} · ${check.entered < check.required
        ? `${money(check.required - check.entered)} left`
        : `${money(check.entered - check.required)} too much`}`
  if (!text) return null
  return (
    <p role="status" className="rounded-lg px-3 py-2 text-xs"
      style={{
        color: matches ? 'var(--text-primary)' : 'var(--accent)',
        border: `1px solid ${matches ? 'var(--border-strong)' : 'rgba(255,139,77,0.4)'}`,
        background: matches ? 'transparent' : 'var(--accent-soft)',
      }}>
      {text}
    </p>
  )
}
