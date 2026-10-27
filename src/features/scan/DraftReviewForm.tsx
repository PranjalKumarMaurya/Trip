import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { NeonBtn } from '../../components/ui/NeonBtn'
import { NeonInput } from '../../components/ui/NeonInput'
import {
  EVENT_TYPES, EVENT_TYPE_LABELS, WARNING_MESSAGES, type EventDraft, type EventForm, type EventInput, type FormErrors,
  draftToForm, formToEventInput,
} from './scanRules'

const COMMON_ZONES = ['Asia/Kolkata', 'Asia/Makassar', 'Asia/Jakarta', 'Asia/Singapore', 'Asia/Bangkok', 'Asia/Dubai',
  'Asia/Tokyo', 'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles', 'Australia/Sydney', 'UTC']

const fieldStyle = { color: 'var(--text-secondary)' }
const selectStyle = {
  background: 'rgba(245,241,235,0.035)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 14, colorScheme: 'dark',
} as const
const dateStyle = { colorScheme: 'dark' } as const

export function DraftReviewForm({ draft, fileName, notice, tripTimezone, saving, saveError, onSubmit, onCancel, onRetryRead }: {
  draft: EventDraft
  fileName: string
  notice: string | null
  tripTimezone: string
  saving: boolean
  saveError: string | null
  onSubmit: (input: EventInput) => void
  onCancel: () => void
  onRetryRead?: () => void
}) {
  const [form, setForm] = useState<EventForm>(() => draftToForm(draft))
  const [errors, setErrors] = useState<FormErrors>({})
  const headingRef = useRef<HTMLHeadingElement>(null)
  // Move focus (and the viewport on phones) to the form when it opens.
  useEffect(() => { headingRef.current?.focus() }, [])
  const set = (field: keyof EventForm) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((current) => ({ ...current, [field]: event.target.value }))

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    const result = formToEventInput(form)
    setErrors(result.errors)
    if (result.input) onSubmit(result.input)
  }

  const flight = form.eventType === 'flight'
  const journey = flight || form.eventType === 'ferry' || form.eventType === 'transport'
  const zones = [...new Set([tripTimezone, draft.startTimezone, draft.endTimezone, ...COMMON_ZONES])]

  return (
    <section data-testid="scan-review" aria-label="Review booking" className="surface px-4 py-5">
      <h2 ref={headingRef} tabIndex={-1} className="serif-display outline-none" style={{ color: 'var(--text-primary)', fontSize: 25 }}>Review booking</h2>
      <p className="mt-1 truncate" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>From {fileName}</p>
      {notice && <p role="status" className="mt-3 rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>{notice}</p>}
      {draft.warnings.length > 0 && (
        <ul aria-label="Check these details" className="mt-3 flex list-disc flex-col gap-1 pl-5 text-sm" style={{ color: 'var(--accent)' }}>
          {[...new Set(draft.warnings.map((warning) => WARNING_MESSAGES[warning]))].map((message) => <li key={message}>{message}</li>)}
        </ul>
      )}
      <form onSubmit={submit} aria-busy={saving} className="mt-4 flex flex-col gap-4" noValidate>
        {Object.keys(errors).length > 0 && <p role="alert" className="text-sm" style={{ color: 'var(--accent)' }}>Fix the highlighted fields before adding this to the itinerary.</p>}
        <Field label="Type" error={errors.eventType}>
          <select aria-label="Type" value={form.eventType} onChange={set('eventType')} disabled={saving} className="w-full rounded-md px-3 py-2.5" style={selectStyle}>
            {EVENT_TYPES.map((type) => <option key={type} value={type}>{EVENT_TYPE_LABELS[type]}</option>)}
          </select>
        </Field>
        <Field label="Title" error={errors.title}>
          <NeonInput aria-label="Title" value={form.title} onChange={set('title')} disabled={saving} maxLength={200} />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Starts" error={errors.startLocal}>
            <NeonInput aria-label="Starts" type="datetime-local" value={form.startLocal} onChange={set('startLocal')} disabled={saving} style={dateStyle} />
          </Field>
          <Field label="Start timezone" error={errors.startTimezone}>
            <NeonInput aria-label="Start timezone" list="scan-timezones" value={form.startTimezone} onChange={set('startTimezone')} disabled={saving} />
          </Field>
          <Field label="Ends (optional)" error={errors.endLocal}>
            <NeonInput aria-label="Ends" type="datetime-local" value={form.endLocal} onChange={set('endLocal')} disabled={saving} style={dateStyle} />
          </Field>
          <Field label="End timezone" error={errors.endTimezone}>
            <NeonInput aria-label="End timezone" list="scan-timezones" value={form.endTimezone} onChange={set('endTimezone')} disabled={saving} />
          </Field>
        </div>
        <datalist id="scan-timezones">{zones.map((zone) => <option key={zone} value={zone} />)}</datalist>
        <Field label={journey ? 'From' : 'Location'}>
          <NeonInput aria-label={journey ? 'From' : 'Location'} value={form.location} onChange={set('location')} disabled={saving} />
        </Field>
        {journey && (
          <Field label="To">
            <NeonInput aria-label="To" value={form.locationTo} onChange={set('locationTo')} disabled={saving} />
          </Field>
        )}
        {flight && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Departure airport" error={errors.depCode}>
              <NeonInput aria-label="Departure airport" value={form.depCode} onChange={set('depCode')} disabled={saving} maxLength={3} autoCapitalize="characters" />
            </Field>
            <Field label="Arrival airport" error={errors.arrCode}>
              <NeonInput aria-label="Arrival airport" value={form.arrCode} onChange={set('arrCode')} disabled={saving} maxLength={3} autoCapitalize="characters" />
            </Field>
            <Field label="Flight number">
              <NeonInput aria-label="Flight number" value={form.flightNo} onChange={set('flightNo')} disabled={saving} maxLength={20} />
            </Field>
            <Field label="Airline">
              <NeonInput aria-label="Airline" value={form.airline} onChange={set('airline')} disabled={saving} maxLength={80} />
            </Field>
            <Field label="Terminal">
              <NeonInput aria-label="Terminal" value={form.terminal} onChange={set('terminal')} disabled={saving} maxLength={40} />
            </Field>
          </div>
        )}
        <Field label="Booking reference">
          <NeonInput aria-label="Booking reference" value={form.bookingRef} onChange={set('bookingRef')} disabled={saving} maxLength={40} />
        </Field>
        <Field label="Notes">
          <textarea aria-label="Notes" value={form.notes} onChange={set('notes')} disabled={saving} rows={3} maxLength={1000}
            className="w-full rounded-md px-3.5 py-2.5" style={selectStyle} />
        </Field>
        {saveError && <p role="alert" className="text-sm" style={{ color: 'var(--accent)' }}>{saveError}</p>}
        <NeonBtn type="submit" disabled={saving} className="w-full">{saving ? 'Adding…' : 'Add to itinerary'}</NeonBtn>
        <div className="flex flex-wrap justify-between gap-3">
          <button type="button" onClick={onCancel} disabled={saving} style={{ color: 'var(--text-secondary)' }}>Not now</button>
          {onRetryRead && <button type="button" onClick={onRetryRead} disabled={saving} style={{ color: 'var(--text-secondary)' }}>Try reading again</button>}
        </div>
      </form>
    </section>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm" style={fieldStyle}>
      <span>{label}</span>
      {children}
      {error && <span role="alert" style={{ color: 'var(--accent)', fontSize: 12 }}>{error}</span>}
    </label>
  )
}
