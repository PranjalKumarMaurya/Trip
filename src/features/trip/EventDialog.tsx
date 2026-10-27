import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { NeonBtn } from '../../components/ui/NeonBtn'
import { NeonInput } from '../../components/ui/NeonInput'
import type { RosterMember } from '../groups/useGroupRoster'
import {
  EVENT_TYPES, emptyEventForm, validateEventForm,
  type EventFormErrors, type EventFormField, type EventFormValues, type EventPayload, type TripEvent,
} from './itinerary'
import { EventSaveError } from './tripEventsApi'
import { isoToZonedInput, timeZoneCity } from './tripTime'

function formFromEvent(event: TripEvent, timeZone: string): EventFormValues {
  return {
    eventType: event.event_type,
    title: event.title,
    startsAt: isoToZonedInput(event.starts_at, timeZone),
    endsAt: isoToZonedInput(event.ends_at, timeZone),
    location: event.location ?? '',
    locationTo: event.location_to ?? '',
    mapUrl: event.map_url ?? '',
    notes: event.notes ?? '',
    depCode: event.dep_code ?? '',
    arrCode: event.arr_code ?? '',
    flightNo: event.flight_no ?? '',
    airline: event.airline ?? '',
    terminal: event.terminal ?? '',
    bookingRef: event.booking_ref ?? '',
  }
}

const overlay: CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(15, 11, 8, 0.82)', backdropFilter: 'blur(14px)',
  display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: 16,
}
const sheet: CSSProperties = {
  width: '100%', maxWidth: 480, margin: 'auto', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  borderRadius: 20, padding: 22,
}
const textareaStyle: CSSProperties = {
  background: 'rgba(245,241,235,0.035)', border: '1px solid var(--border)', color: 'var(--text-primary)',
  borderRadius: 12, padding: '10px 14px', fontSize: 14, width: '100%', minHeight: 72, outline: 'none',
}

export type SaveEvent = (payload: EventPayload, audience: string[], overwrite: boolean) => Promise<void>

/** Add or edit an itinerary event. Typed times are Trip-timezone wall-clock times. */
export function EventDialog({ event, initialAudience, tripTimeZone, roster, onSave, onClose }: {
  event: TripEvent | null
  initialAudience: string[]
  tripTimeZone: string
  roster: RosterMember[]
  onSave: SaveEvent
  onClose: () => void
}) {
  const titleId = useId()
  const [values, setValues] = useState<EventFormValues>(() => event ? formFromEvent(event, tripTimeZone) : emptyEventForm)
  const [audience, setAudience] = useState<string[]>(initialAudience)
  const [errors, setErrors] = useState<EventFormErrors>({})
  const [saving, setSaving] = useState(false)
  const [problem, setProblem] = useState<'conflict' | 'removed' | 'failed' | null>(null)
  const firstField = useRef<HTMLSelectElement>(null)
  const activeMembers = roster.filter((member) => member.status === 'active')

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    firstField.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      opener?.focus?.()
    }
  }, [])

  const set = (field: EventFormField) => (value: string) => setValues((current) => ({ ...current, [field]: value }))

  const save = async (overwrite: boolean) => {
    const result = validateEventForm(values, tripTimeZone)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    setSaving(true)
    setProblem(null)
    try {
      await onSave(result.payload, audience, overwrite)
    } catch (error) {
      setProblem(error instanceof EventSaveError ? error.kind : 'failed')
      setSaving(false)
    }
  }

  const submit = (formEvent: FormEvent) => {
    formEvent.preventDefault()
    if (!saving) void save(false)
  }

  const isFlight = values.eventType === 'flight'
  const zone = `${timeZoneCity(tripTimeZone)} time`

  return (
    <div style={overlay} onClick={onClose} onKeyDown={(keyEvent) => { if (keyEvent.key === 'Escape') onClose() }}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} style={sheet} onClick={(clickEvent) => clickEvent.stopPropagation()} className="animate-slide-up">
        <div className="mb-4 flex items-center justify-between">
          <h2 id={titleId} className="serif-display" style={{ fontSize: 22, color: 'var(--text-primary)' }}>{event ? 'Edit event' : 'Add event'}</h2>
          <button type="button" aria-label="Close" onClick={onClose} style={{ color: 'var(--text-tertiary)', fontSize: 18 }}>✕</button>
        </div>
        <form onSubmit={submit} aria-label={event ? 'Edit event' : 'Add event'} className="flex flex-col gap-3.5" noValidate>
          {Object.keys(errors).length > 0 && <p role="alert" className="text-sm" style={{ color: 'var(--accent)' }}>Check the highlighted fields.</p>}
          <Field label="Type" error={errors.eventType}>
            <select ref={firstField} aria-label="Type" value={values.eventType} onChange={(change) => set('eventType')(change.target.value)}
              className="rounded-xl px-3.5 py-2.5 text-sm" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              {EVENT_TYPES.map((entry) => <option key={entry.type} value={entry.type}>{entry.icon} {entry.label}</option>)}
            </select>
          </Field>
          <Field label="Title" error={errors.title}>
            <NeonInput aria-label="Title" value={values.title} maxLength={140} onChange={(change) => set('title')(change.target.value)} placeholder="Surf lesson, hotel check-in…" />
          </Field>
          <div className="flex flex-col gap-3.5">
            <Field label="Starts" hint={zone} error={errors.startsAt}>
              <NeonInput aria-label="Starts" type="datetime-local" value={values.startsAt} onChange={(change) => set('startsAt')(change.target.value)} />
            </Field>
            <Field label="Ends (optional)" hint={zone} error={errors.endsAt}>
              <NeonInput aria-label="Ends" type="datetime-local" value={values.endsAt} onChange={(change) => set('endsAt')(change.target.value)} />
            </Field>
          </div>
          <Field label="Location (optional)">
            <NeonInput aria-label="Location" value={values.location} onChange={(change) => set('location')(change.target.value)} />
          </Field>
          <Field label="To (optional)" hint="For flights, ferries and transfers">
            <NeonInput aria-label="Destination location" value={values.locationTo} onChange={(change) => set('locationTo')(change.target.value)} />
          </Field>
          {isFlight && (
            <fieldset className="grid grid-cols-2 gap-3">
              <legend className="mb-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>Flight details</legend>
              <Field label="From airport" error={errors.depCode}>
                <NeonInput aria-label="Departure airport code" value={values.depCode} maxLength={5} onChange={(change) => set('depCode')(change.target.value)} placeholder="BOM" />
              </Field>
              <Field label="To airport" error={errors.arrCode}>
                <NeonInput aria-label="Arrival airport code" value={values.arrCode} maxLength={5} onChange={(change) => set('arrCode')(change.target.value)} placeholder="DPS" />
              </Field>
              <Field label="Flight number">
                <NeonInput aria-label="Flight number" value={values.flightNo} maxLength={12} onChange={(change) => set('flightNo')(change.target.value)} placeholder="6E 1601" />
              </Field>
              <Field label="Airline">
                <NeonInput aria-label="Airline" value={values.airline} onChange={(change) => set('airline')(change.target.value)} />
              </Field>
              <Field label="Terminal">
                <NeonInput aria-label="Terminal" value={values.terminal} maxLength={12} onChange={(change) => set('terminal')(change.target.value)} />
              </Field>
            </fieldset>
          )}
          <Field label="Booking reference (optional)">
            <NeonInput aria-label="Booking reference" value={values.bookingRef} onChange={(change) => set('bookingRef')(change.target.value)} />
          </Field>
          <Field label="Map link (optional)" error={errors.mapUrl}>
            <NeonInput aria-label="Map link" type="url" inputMode="url" value={values.mapUrl} onChange={(change) => set('mapUrl')(change.target.value)} placeholder="https://maps.app.goo.gl/…" />
          </Field>
          <Field label="Notes (optional)">
            <textarea aria-label="Notes" value={values.notes} onChange={(change) => set('notes')(change.target.value)} style={textareaStyle} />
          </Field>
          {activeMembers.length > 1 && (
            <fieldset>
              <legend className="text-sm" style={{ color: 'var(--text-secondary)' }}>Who&rsquo;s on this</legend>
              <p className="font-mono mt-0.5" style={{ color: 'var(--text-tertiary)', fontSize: 10, letterSpacing: '0.08em' }}>Leave all unticked for everyone. Everyone can still see it.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeMembers.map((member) => (
                  <label key={member.groupMemberId} className="pill cursor-pointer" style={{ color: audience.includes(member.groupMemberId) ? 'var(--accent)' : 'var(--text-secondary)' }}>
                    <input type="checkbox" checked={audience.includes(member.groupMemberId)}
                      onChange={(change) => setAudience((current) => change.target.checked
                        ? [...current, member.groupMemberId]
                        : current.filter((id) => id !== member.groupMemberId))} />
                    {member.displayName}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {problem === 'conflict' && (
            <div role="alert" className="surface px-3.5 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Someone else changed this event while you were editing. Your changes are still here.
              <div className="mt-2 flex gap-2">
                <NeonBtn type="button" variant="outline" disabled={saving} onClick={() => void save(true)}>Save mine anyway</NeonBtn>
                <NeonBtn type="button" variant="ghost" onClick={onClose}>Discard mine</NeonBtn>
              </div>
            </div>
          )}
          {problem === 'removed' && <p role="alert" className="text-sm" style={{ color: 'var(--accent)' }}>Someone else deleted this event. Nothing was saved.</p>}
          {problem === 'failed' && <p role="alert" className="text-sm" style={{ color: 'var(--accent)' }}>Could not save. Check your connection and try again.</p>}

          <div className="mt-1 flex gap-2">
            <NeonBtn type="submit" disabled={saving || problem === 'removed'} className="flex-1">{saving ? 'Saving…' : event ? 'Save changes' : 'Add event'}</NeonBtn>
            <NeonBtn type="button" variant="ghost" onClick={onClose}>Cancel</NeonBtn>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
      <span>{label}</span>
      {children}
      {hint && !error && <span className="font-mono" style={{ color: 'var(--text-tertiary)', fontSize: 10, letterSpacing: '0.08em' }}>{hint}</span>}
      {error && <span role="alert" style={{ color: 'var(--accent)', fontSize: 12 }}>{error}</span>}
    </label>
  )
}
