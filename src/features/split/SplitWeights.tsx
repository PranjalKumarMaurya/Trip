// Percent and shares inputs for the expense form: one field per person, the
// amount each person will owe, and a live summary ("70% left", "5 shares ·
// ₹900.00 per share"). The amounts shown are exactly the rows that are saved.
import { useId } from 'react'
import type { DraftEvaluation } from './expenseDraft'
import type { SplitMethod } from './ledger'
import { formatPercent, FULL_PERCENT } from './money'
import { inputClass, inputStyle } from './SplitDialog'

export const SPLIT_OPTIONS: { value: SplitMethod; label: string }[] = [
  { value: 'equal', label: 'Equally' },
  { value: 'exact', label: 'Exact amounts' },
  { value: 'percent', label: 'Percentages' },
  { value: 'shares', label: 'Shares' },
]

export function WeightFields({ mode, members, values, onChange, evaluation, currency, accountingCurrency, money, error }: {
  mode: 'percent' | 'shares'
  members: { id: string; name: string }[]
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
  evaluation: DraftEvaluation
  /** The expense's own currency, and the Trip's, for the per-share figure. */
  currency: string
  accountingCurrency: string
  money: (minor: bigint, currency?: string) => string
  /** The shares error; shown live when there is no total to summarise. */
  error?: string
}) {
  const baseId = useId()
  const amounts = new Map(evaluation.shares.map((line) => [line.memberId, line.amount]))
  const percent = mode === 'percent'
  return (
    <>
      <ul className="flex flex-col gap-2" aria-label={percent ? 'Percent for each person' : 'Shares for each person'}>
        {members.map((member, index) => {
          const amount = amounts.get(member.id)
          const amountId = `${baseId}-${index}`
          return (
            <li key={member.id} className="grid grid-cols-[1fr_88px_48px] items-center gap-2">
              <span className="min-w-0">
                <span aria-hidden="true" className="block truncate text-sm" style={{ color: 'var(--text-primary)' }}>{member.name}</span>
                {amount !== undefined && (
                  <span id={amountId} className="block font-mono" style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>
                    {money(amount, accountingCurrency)}
                  </span>
                )}
              </span>
              <input aria-label={`${percent ? 'Percent' : 'Shares'} for ${member.name}`} className={inputClass} style={inputStyle}
                inputMode={percent ? 'decimal' : 'numeric'} autoComplete="off" placeholder="0" value={values[member.id] ?? ''}
                aria-describedby={amount !== undefined ? amountId : undefined}
                onChange={(event) => onChange({ ...values, [member.id]: event.target.value })} />
              <span className="font-mono" style={{ color: 'var(--text-tertiary)', fontSize: percent ? 13 : 11 }}>{percent ? '%' : 'shares'}</span>
            </li>
          )
        })}
      </ul>
      {percent
        ? <PercentSummary evaluation={evaluation} error={error} />
        : <SharesSummary evaluation={evaluation} currency={currency} accountingCurrency={accountingCurrency} money={money} error={error} />}
    </>
  )
}

function Strip({ ok, children }: { ok: boolean; children: string }) {
  return (
    <p role="status" className="rounded-lg px-3 py-2 text-xs" data-testid="split-weight-summary"
      style={{
        color: ok ? 'var(--text-primary)' : 'var(--accent)',
        border: `1px solid ${ok ? 'var(--border-strong)' : 'rgba(255,139,77,0.4)'}`,
        background: ok ? 'transparent' : 'var(--accent-soft)',
      }}>
      {children}
    </p>
  )
}

function PercentSummary({ evaluation, error }: { evaluation: DraftEvaluation; error?: string }) {
  const check = evaluation.percentCheck
  if (!check) return error ? <Strip ok={false}>{error}</Strip> : null
  if (check.matches) return <Strip ok>Percentages add up to 100%.</Strip>
  const gap = check.entered < FULL_PERCENT ? `${formatPercent(FULL_PERCENT - check.entered)}% left` : `${formatPercent(check.entered - FULL_PERCENT)}% too much`
  return <Strip ok={false}>{`${formatPercent(check.entered)}% of 100% · ${gap}`}</Strip>
}

/** "5 shares · ₹900.00 per share"; "about" when the total does not divide evenly. */
function SharesSummary({ evaluation, currency, accountingCurrency, money, error }: {
  evaluation: DraftEvaluation
  currency: string
  accountingCurrency: string
  money: (minor: bigint, currency?: string) => string
  error?: string
}) {
  const count = evaluation.shareCount
  if (count === null || count <= 0n) return error ? <Strip ok={false}>{error}</Strip> : null
  const label = `${count} share${count === 1n ? '' : 's'}`
  if (evaluation.accountingMinor === null) return <Strip ok>{label}</Strip>
  const per = (total: bigint, code: string) => `${total % count === 0n ? '' : 'about '}${money(divideHalfUp(total, count), code)}`
  const converts = currency !== accountingCurrency && evaluation.originalMinor !== null
  const original = converts && evaluation.originalMinor !== null ? ` (${per(evaluation.originalMinor, currency)})` : ''
  return <Strip ok>{`${label} · ${per(evaluation.accountingMinor, accountingCurrency)} per share${original}`}</Strip>
}

const divideHalfUp = (numerator: bigint, denominator: bigint) => (numerator * 2n + denominator) / (denominator * 2n)
