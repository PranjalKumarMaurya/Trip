import { type ChangeEvent, type FormEvent, useMemo, useRef, useState } from 'react'
import { Field } from '../../components/ui/Field'
import { IconBack } from '../../components/ui/icons'
import { NeonBtn } from '../../components/ui/NeonBtn'
import { NeonInput } from '../../components/ui/NeonInput'
import { NeonSelect } from '../../components/ui/NeonSelect'
import { ScreenFrame } from '../../components/ui/ScreenFrame'
import { Switch } from '../../components/ui/Switch'
import { BootstrapGroupError, bootstrapGroup, createBootstrapRequestId } from './bootstrapGroup'
import { TripCurrencyFields } from './CurrencyFields'
import {
  type BootstrapFieldName, type BootstrapFormErrors, type BootstrapFormValues,
  browserTimezone, currencyName, defaultTripCurrency, displayCurrencySet, formatTripDates,
  supportedTimezones, timezoneLabel, validateBootstrapForm,
} from './tripSettings'

type SubmissionState = 'idle' | 'validating' | 'submitting' | 'retryable-failure' | 'conflict' | 'safe-failure' | 'success'

/**
 * Form state. `accountingCurrency` and `extraCurrencies` are the International
 * choices; a domestic Trip always uses `domesticCurrency` alone.
 */
type FormState = Omit<BootstrapFormValues, 'displayCurrencies'> & { extraCurrencies: string[]; international: boolean }
type ConfirmedTrip = { groupId: string; tripName: string; destination: string; startDate: string; endDate: string }

const allFields: BootstrapFieldName[] = ['tripName', 'destination', 'startDate', 'endDate', 'timezone', 'accountingCurrency', 'displayCurrencies']
const inputStyle = { fontSize: 16, minHeight: 44 } as const

let timezoneChoices: { value: string; label: string }[] | null = null
function timezoneOptions() {
  timezoneChoices ??= supportedTimezones().map((zone) => ({ value: zone, label: timezoneLabel(zone) }))
  return timezoneChoices
}

function browserLanguages(): string[] {
  if (typeof navigator === 'undefined') return []
  return navigator.languages?.length ? [...navigator.languages] : navigator.language ? [navigator.language] : []
}

function toValues(form: FormState, domesticCurrency: string): BootstrapFormValues {
  const { extraCurrencies, international, ...rest } = form
  return international
    ? { ...rest, displayCurrencies: displayCurrencySet(form.accountingCurrency, extraCurrencies) }
    : { ...rest, accountingCurrency: domesticCurrency, displayCurrencies: [domesticCurrency] }
}

export function BootstrapOnboarding({ onContinue, onBack, homeCurrency }: {
  onContinue?: (groupId: string) => void
  /** Back to the Trips home without creating a Trip. */
  onBack?: () => void
  /** The person's profile home currency, used for domestic Trips when set. */
  homeCurrency?: string | null
}) {
  const deviceCurrency = useMemo(() => defaultTripCurrency(browserLanguages(), browserTimezone()), [])
  const domesticCurrency = homeCurrency || deviceCurrency
  const [form, setForm] = useState<FormState>(() => ({
    tripName: '',
    destination: '',
    startDate: '',
    endDate: '',
    timezone: browserTimezone(),
    accountingCurrency: domesticCurrency,
    extraCurrencies: [],
    international: false,
  }))
  const [errors, setErrors] = useState<BootstrapFormErrors>({})
  const [touched, setTouched] = useState<Partial<Record<BootstrapFieldName, boolean>>>({})
  const [attempted, setAttempted] = useState(false)
  const [state, setState] = useState<SubmissionState>('idle')
  const [confirmed, setConfirmed] = useState<ConfirmedTrip | null>(null)
  const requestIdRef = useRef<string | null>(null)

  const timezones = useMemo(() => {
    const options = timezoneOptions()
    // Keep a value the list does not know (should not happen) selectable rather than silently changing it.
    return form.timezone && !options.some((option) => option.value === form.timezone)
      ? [{ value: form.timezone, label: form.timezone }, ...options] : options
  }, [form.timezone])
  const values = toValues(form, domesticCurrency)
  const formIsInert = state === 'submitting' || state === 'success'
  const requiresEditedRequest = state === 'conflict'
  const message = state === 'retryable-failure'
    ? 'We couldn’t confirm whether your Trip was created. Try again — it won’t be created twice.'
    : state === 'conflict'
      ? 'These details don’t match your earlier attempt. Change something, then create the Trip.'
      : state === 'safe-failure'
        ? 'We couldn’t create this Trip. Check the details and try again.'
        : null
  const fieldError = (field: BootstrapFieldName) => touched[field] || attempted ? errors[field] : undefined
  const hasVisibleErrors = attempted && Object.keys(errors).length > 0

  const update = (next: Partial<FormState>) => {
    if (formIsInert) return
    // An edited submission is a new request; an unchanged retry keeps its request id.
    if (requestIdRef.current) requestIdRef.current = null
    const merged = { ...form, ...next }
    setForm(merged)
    if (attempted || Object.keys(errors).length) setErrors(validateBootstrapForm(toValues(merged, domesticCurrency)))
    if (state !== 'idle') setState('idle')
  }

  const onText = (field: 'tripName' | 'destination' | 'startDate' | 'endDate' | 'timezone') =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => update({ [field]: event.target.value } as Partial<FormState>)
  const currencyChosen = useRef(false)
  const onCurrency = (code: string) => {
    currencyChosen.current = true
    update({ accountingCurrency: code, extraCurrencies: form.extraCurrencies.filter((extra) => extra !== code) })
  }

  const validateField = (field: BootstrapFieldName) => {
    setTouched((current) => ({ ...current, [field]: true }))
    setErrors(validateBootstrapForm(values))
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (formIsInert) return

    setState('validating')
    setAttempted(true)
    const nextErrors = validateBootstrapForm(values)
    setErrors(nextErrors)
    setTouched(Object.fromEntries(allFields.map((field) => [field, true])))
    if (Object.keys(nextErrors).length) {
      setState('idle')
      return
    }

    const requestId = requestIdRef.current ?? createBootstrapRequestId()
    requestIdRef.current = requestId
    setState('submitting')

    try {
      const result = await bootstrapGroup({
        tripName: values.tripName,
        destination: values.destination,
        startDate: values.startDate,
        endDate: values.endDate,
        timezone: values.timezone,
        accountingCurrency: values.accountingCurrency,
        displayCurrencyCodes: values.displayCurrencies,
        isInternational: form.international,
      }, requestId)
      setConfirmed({
        groupId: result.groupId,
        tripName: values.tripName.trim(),
        destination: values.destination.trim(),
        startDate: values.startDate,
        endDate: values.endDate,
      })
      setState('success')
    } catch (error) {
      if (!(error instanceof BootstrapGroupError)) {
        setState('retryable-failure')
      } else if (error.kind === 'conflict') {
        setState('conflict')
      } else if (error.kind === 'safe') {
        setState('safe-failure')
      } else {
        setState('retryable-failure')
      }
    }
  }

  if (state === 'success' && confirmed) {
    return <BootstrapSuccess trip={confirmed} onContinue={onContinue ? () => onContinue(confirmed.groupId) : undefined} />
  }

  return (
    <ScreenFrame testId="bootstrap-onboarding" centered={false}
      eyebrow={<p className="eyebrow">New Trip</p>}
      title="Create your Trip"
      lede="Add the basics. You can invite friends once it’s created."
      top={onBack ? <button type="button" className="text-link" onClick={onBack}><IconBack size={18} />Trips</button> : undefined}>
      <form onSubmit={(event) => void submit(event)} aria-label="Create Trip" aria-busy={formIsInert} className="flex flex-col gap-5" noValidate>
        {message && <p role="alert" data-testid="bootstrap-status" className="notice notice--error">{message}</p>}
        {hasVisibleErrors && <p role="alert" className="notice notice--error">Check the highlighted fields.</p>}
        <Field id="trip-name" label="Trip name" error={fieldError('tripName')}>
          <NeonInput value={form.tripName} onChange={onText('tripName')} onBlur={() => validateField('tripName')} disabled={formIsInert}
            placeholder="e.g. Goa weekend" autoComplete="off" style={inputStyle} />
        </Field>
        <Field id="trip-destination" label="Destination" error={fieldError('destination')}>
          <NeonInput value={form.destination} onChange={onText('destination')} onBlur={() => validateField('destination')} disabled={formIsInert}
            placeholder="e.g. Bali, Indonesia" autoComplete="off" style={inputStyle} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="trip-start" label="Start date" error={fieldError('startDate')}>
            <NeonInput type="date" className={form.startDate ? '' : 'is-empty'} value={form.startDate} onChange={onText('startDate')} onBlur={() => validateField('startDate')} disabled={formIsInert} style={inputStyle} />
          </Field>
          <Field id="trip-end" label="End date" error={fieldError('endDate')}>
            <NeonInput type="date" className={form.endDate ? '' : 'is-empty'} value={form.endDate} min={form.startDate || undefined} onChange={onText('endDate')} onBlur={() => validateField('endDate')} disabled={formIsInert} style={inputStyle} />
          </Field>
        </div>
        <Field id="trip-timezone" label="Timezone" hint="Plans and flights show in this time." error={fieldError('timezone')}>
          <NeonSelect value={form.timezone} onChange={onText('timezone')} onBlur={() => validateField('timezone')} disabled={formIsInert}>
            {!form.timezone && <option value="">Choose a timezone</option>}
            {timezones.map((zone) => <option key={zone.value} value={zone.value}>{zone.label}</option>)}
          </NeonSelect>
        </Field>

        <Switch label="International trip?" checked={form.international} disabled={formIsInert}
          hint={form.international ? 'Pick the Trip currency, convert other currencies, and use the FX tab.'
            : `Everything is in ${domesticCurrency} · ${currencyName(domesticCurrency)}. Turn on for travel abroad.`}
          onChange={(international) => update(international && !currencyChosen.current
            ? { international, accountingCurrency: domesticCurrency } : { international })} />
        {form.international && <TripCurrencyFields idPrefix="trip" currency={form.accountingCurrency} extras={form.extraCurrencies}
          onCurrency={onCurrency} onExtras={(extraCurrencies) => update({ extraCurrencies })} disabled={formIsInert}
          currencyError={fieldError('accountingCurrency')} displayError={fieldError('displayCurrencies')}
          openExtras={Boolean(fieldError('displayCurrencies'))} />}

        <NeonBtn type="submit" size="lg" disabled={formIsInert || requiresEditedRequest} className="mt-2 w-full">
          {state === 'submitting' ? 'Creating Trip…' : state === 'retryable-failure' ? 'Retry creating Trip' : requiresEditedRequest ? 'Review details to continue' : 'Create Trip'}
        </NeonBtn>
      </form>
    </ScreenFrame>
  )
}

function BootstrapSuccess({ trip, onContinue }: { trip: ConfirmedTrip; onContinue?: () => void }) {
  return (
    <ScreenFrame testId="bootstrap-success-state-a" eyebrow={<p className="eyebrow" style={{ color: 'var(--accent)' }}>Trip created</p>}
      title={trip.tripName} lede={<>{trip.destination} · {formatTripDates(trip.startDate, trip.endDate)}</>}>
      <p className="notice">You’re the Owner. Invite friends from the Crew tab when you’re ready.</p>
      {onContinue && <NeonBtn type="button" size="lg" onClick={onContinue} className="mt-6 w-full">Open Trip</NeonBtn>}
    </ScreenFrame>
  )
}
