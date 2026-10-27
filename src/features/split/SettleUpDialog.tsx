import { type FormEvent, useRef, useState } from 'react'
import { NeonBtn } from '../../components/ui/NeonBtn'
import type { SplitMember } from './ExpenseForm'
import type { SettlementSuggestion } from './ledger'
import { formatMoney, minorUnits, parseAmount, toDecimalString } from './money'
import { recordSettlement, SplitRequestError } from './splitApi'
import { Field, SplitDialog, inputClass, inputStyle } from './SplitDialog'
import { splitErrorMessage } from './splitErrors'

interface Pending {
  from: string
  to: string
  amount: bigint
  requestId: string
}

/**
 * Suggested transfers plus a form for any other payment. Recording is a
 * bookkeeping entry only: nothing here moves money.
 */
export function SettleUpDialog({ groupId, currency, me, isOwner, members, nameOf, suggestions, onClose, onRecorded }: {
  groupId: string
  currency: string
  me: string
  isOwner: boolean
  /** Active members; payments can only be recorded between them. */
  members: SplitMember[]
  nameOf: (id: string) => string
  suggestions: SettlementSuggestion[]
  onClose: () => void
  onRecorded: () => void
}) {
  const [pending, setPending] = useState<Pending | null>(null)
  const [note, setNote] = useState('')
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [custom, setCustom] = useState(false)
  const [form, setForm] = useState({ from: me, to: members.find((member) => member.id !== me)?.id ?? '', amount: '' })
  const [formError, setFormError] = useState<string | null>(null)
  const confirmRef = useRef<HTMLHeadingElement>(null)
  const active = new Set(members.map((member) => member.id))
  const money = (minor: bigint) => formatMoney(minor, currency)
  const canRecord = (from: string, to: string) => active.has(from) && active.has(to) && (isOwner || from === me || to === me)

  const review = (from: string, to: string, amount: bigint) => {
    setError(null)
    setDone(null)
    setNote('')
    setPending({ from, to, amount, requestId: crypto.randomUUID() })
    requestAnimationFrame(() => confirmRef.current?.focus())
  }

  const reviewCustom = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const amount = parseAmount(form.amount, minorUnits(currency))
    if (!form.from || !form.to || form.from === form.to) return setFormError('Choose two different people.')
    if (!canRecord(form.from, form.to)) return setFormError('You can record payments you made or received. A Trip Owner can record any.')
    if (amount === null || amount <= 0n) return setFormError(`Enter an amount above zero with at most ${minorUnits(currency)} decimal places.`)
    setFormError(null)
    review(form.from, form.to, amount)
  }

  const confirm = async () => {
    if (!pending || recording) return
    setRecording(true)
    setError(null)
    try {
      await recordSettlement(groupId, {
        from: pending.from, to: pending.to, amount: toDecimalString(pending.amount, minorUnits(currency)), note: note.trim() || null,
      }, pending.requestId)
      setDone(`Recorded: ${nameOf(pending.from)} paid ${nameOf(pending.to)} ${money(pending.amount)}.`)
      setPending(null)
      setCustom(false)
      setForm((current) => ({ ...current, amount: '' }))
      onRecorded()
    } catch (failure) {
      // The same request id is kept, so retrying cannot record it twice.
      setError(splitErrorMessage(failure instanceof SplitRequestError ? failure.code : null,
        'We could not record this payment. Nothing was changed, so you can try again.'))
    } finally {
      setRecording(false)
    }
  }

  return (
    <SplitDialog title="Settle up" onClose={onClose} locked={recording} testId="settle-up">
      {pending ? (
        <section aria-labelledby="settle-confirm-heading" className="flex flex-col gap-4">
          <h3 id="settle-confirm-heading" ref={confirmRef} tabIndex={-1} className="serif-display outline-none"
            style={{ color: 'var(--text-primary)', fontSize: 19 }}>
            Record that {nameOf(pending.from)} paid {nameOf(pending.to)} {money(pending.amount)}?
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            This only records a payment you made outside the app; no money moves. Everyone’s balances update, and it
            stays in the payment history.
          </p>
          <Field label="Note (optional)">
            {(control) => <input {...control} className={inputClass} style={inputStyle} value={note} maxLength={200}
              placeholder="UPI, cash…" disabled={recording} onChange={(event) => setNote(event.target.value)} />}
          </Field>
          {error && <p role="alert" className="surface px-3.5 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>{error}</p>}
          <div className="flex gap-2">
            <NeonBtn type="button" onClick={() => void confirm()} disabled={recording} className="min-h-11 flex-1">
              {recording ? 'Recording…' : error ? 'Try again' : 'Confirm payment'}
            </NeonBtn>
            <NeonBtn type="button" variant="ghost" onClick={() => setPending(null)} disabled={recording} className="min-h-11">Back</NeonBtn>
          </div>
        </section>
      ) : (
        <div className="flex flex-col gap-4">
          {done && <p role="status" className="surface px-3.5 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>{done}</p>}
          {suggestions.length === 0 ? (
            <div className="py-6 text-center" data-testid="all-settled">
              <p className="serif-display" style={{ color: 'var(--text-primary)', fontSize: 22 }}>All settled up.</p>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>Nobody owes anyone. Pour another round.</p>
            </div>
          ) : (
            <>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {suggestions.length} payment{suggestions.length === 1 ? '' : 's'} would settle everyone up.
              </p>
              <ul aria-label="Suggested payments" className="flex flex-col gap-2">
                {suggestions.map((suggestion) => {
                  const mine = suggestion.from === me || suggestion.to === me
                  return (
                    <li key={`${suggestion.from}-${suggestion.to}`} className="flex items-center gap-3 rounded-xl p-3"
                      style={{ border: `1px solid ${mine ? 'rgba(255,139,77,0.3)' : 'var(--border)'}`, background: mine ? 'rgba(255,139,77,0.07)' : 'var(--bg-card)' }}>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm" style={{ color: 'var(--text-primary)' }}>
                          {nameOf(suggestion.from)} pays {nameOf(suggestion.to)}
                        </p>
                        <p className="serif-display whitespace-nowrap" style={{ color: 'var(--text-primary)', fontSize: 16 }}>{money(suggestion.amount)}</p>
                        {!(active.has(suggestion.from) && active.has(suggestion.to)) && (
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Includes a former member, so it can’t be recorded.</p>
                        )}
                      </div>
                      {canRecord(suggestion.from, suggestion.to) && (
                        <NeonBtn type="button" className="min-h-11 shrink-0" onClick={() => review(suggestion.from, suggestion.to, suggestion.amount)}>
                          Record payment
                        </NeonBtn>
                      )}
                    </li>
                  )
                })}
              </ul>
            </>
          )}

          {custom ? (
            <form onSubmit={reviewCustom} aria-label="Record another payment" noValidate className="surface flex flex-col gap-3 px-3.5 py-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="From">
                  {(control) => (
                    <select {...control} className={inputClass} style={inputStyle} value={form.from}
                      onChange={(event) => setForm({ ...form, from: event.target.value })}>
                      {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                    </select>
                  )}
                </Field>
                <Field label="To">
                  {(control) => (
                    <select {...control} className={inputClass} style={inputStyle} value={form.to}
                      onChange={(event) => setForm({ ...form, to: event.target.value })}>
                      {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                    </select>
                  )}
                </Field>
              </div>
              <Field label={`Payment amount (${currency})`} error={formError ?? undefined}>
                {(control) => <input {...control} className={inputClass} style={inputStyle} value={form.amount} inputMode="decimal"
                  autoComplete="off" onChange={(event) => setForm({ ...form, amount: event.target.value })} />}
              </Field>
              <div className="flex gap-2">
                <NeonBtn type="submit" className="min-h-11 flex-1">Review payment</NeonBtn>
                <NeonBtn type="button" variant="ghost" className="min-h-11" onClick={() => { setCustom(false); setFormError(null) }}>Cancel</NeonBtn>
              </div>
            </form>
          ) : (
            members.length > 1 && (
              <button type="button" onClick={() => setCustom(true)} className="min-h-11 self-start text-sm" style={{ color: 'var(--accent)' }}>
                Record another payment
              </button>
            )
          )}
          <NeonBtn type="button" variant="ghost" onClick={onClose} className="min-h-11 w-full">Done</NeonBtn>
        </div>
      )}
    </SplitDialog>
  )
}
