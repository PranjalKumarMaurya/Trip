import { type ChangeEvent, type FormEvent, type ReactNode, useMemo, useRef, useState } from 'react'
import { NeonBtn } from '../../components/ui/NeonBtn'
import { NeonInput } from '../../components/ui/NeonInput'
import { BootstrapGroupError, bootstrapGroup, createBootstrapRequestId } from './bootstrapGroup'

type FormValues = {
  tripName: string
  destination: string
  startDate: string
  endDate: string
  timezone: string
  accountingCurrency: string
  displayCurrencies: string
}

type FieldName = keyof FormValues
type FormErrors = Partial<Record<FieldName, string>>
type SubmissionState = 'idle' | 'validating' | 'submitting' | 'retryable-failure' | 'conflict' | 'safe-failure' | 'success'

const timezoneSuggestions = ['America/New_York', 'America/Los_Angeles', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney', 'Europe/London']

const fieldLabels: Record<FieldName, string> = {
  tripName: 'Trip name',
  destination: 'Destination',
  startDate: 'Start date',
  endDate: 'End date',
  timezone: 'IANA timezone',
  accountingCurrency: 'Accounting currency',
  displayCurrencies: 'Display currencies',
}

function parseDisplayCurrencies(value: string): string[] {
  return value.split(',').map((code) => code.trim().toUpperCase()).filter(Boolean)
}

function isUsableTimezone(value: string): boolean {
  if (!/^[A-Za-z][A-Za-z0-9_+\-]*(?:\/[A-Za-z0-9_+\-]+)+$/.test(value)) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format()
    return true
  } catch {
    return false
  }
}

export function validateBootstrapForm(values: FormValues): FormErrors {
  const errors: FormErrors = {}
  const accountingCurrency = values.accountingCurrency.trim().toUpperCase()
  const displayCurrencies = parseDisplayCurrencies(values.displayCurrencies)

  if (!values.tripName.trim()) errors.tripName = 'Enter a trip name.'
  if (!values.destination.trim()) errors.destination = 'Enter a destination.'
  if (!values.startDate) errors.startDate = 'Choose a start date.'
  if (!values.endDate) errors.endDate = 'Choose an end date.'
  if (values.startDate && values.endDate && values.endDate < values.startDate) errors.endDate = 'End date must be on or after the start date.'
  if (!values.timezone.trim()) errors.timezone = 'Enter an IANA timezone.'
  else if (!isUsableTimezone(values.timezone.trim())) errors.timezone = 'Enter a recognised IANA timezone.'
  if (!accountingCurrency) errors.accountingCurrency = 'Choose an accounting currency.'
  else if (!/^[A-Z]{3}$/.test(accountingCurrency)) errors.accountingCurrency = 'Use a three-letter ISO 4217 code.'
  if (!displayCurrencies.length) errors.displayCurrencies = 'Add at least one display currency.'
  else if (displayCurrencies.some((code) => !/^[A-Z]{3}$/.test(code))) errors.displayCurrencies = 'Use three-letter ISO 4217 codes.'
  else if (new Set(displayCurrencies).size !== displayCurrencies.length) errors.displayCurrencies = 'Each display currency can appear only once.'
  else if (accountingCurrency && !errors.accountingCurrency && !displayCurrencies.includes(accountingCurrency)) {
    errors.displayCurrencies = 'Include the accounting currency in the display set.'
  }

  return errors
}

export function BootstrapOnboarding({ onSignOut, signOutError }: { onSignOut: () => void; signOutError?: string | null }) {
  const [values, setValues] = useState<FormValues>({
    tripName: '',
    destination: '',
    startDate: '',
    endDate: '',
    timezone: '',
    accountingCurrency: '',
    displayCurrencies: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({})
  const [state, setState] = useState<SubmissionState>('idle')
  const [confirmedTripName, setConfirmedTripName] = useState('')
  const requestIdRef = useRef<string | null>(null)

  const displayCurrencies = useMemo(() => parseDisplayCurrencies(values.displayCurrencies), [values.displayCurrencies])
  const formIsInert = state === 'submitting' || state === 'success'
  const requiresEditedRequest = state === 'conflict'
  const message = state === 'retryable-failure'
    ? 'We could not confirm the result. Nothing new will be created when you retry this same submission.'
    : state === 'conflict'
      ? 'This submission does not match an earlier request. Review the details before starting a new submission.'
      : state === 'safe-failure'
        ? 'We could not create this Group. Review the details and try again.'
        : null

  const updateValue = (field: FieldName) => (event: ChangeEvent<HTMLInputElement>) => {
    if (formIsInert) return
    if (requestIdRef.current) requestIdRef.current = null
    setValues((current) => ({ ...current, [field]: event.target.value }))
    if (state !== 'idle') setState('idle')
  }

  const validateField = (field: FieldName) => {
    setTouched((current) => ({ ...current, [field]: true }))
    setErrors(validateBootstrapForm(values))
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (formIsInert) return

    setState('validating')
    const nextErrors = validateBootstrapForm(values)
    setErrors(nextErrors)
    setTouched(Object.fromEntries(Object.keys(fieldLabels).map((field) => [field, true])) as Record<FieldName, boolean>)
    if (Object.keys(nextErrors).length) {
      setState('idle')
      return
    }

    const requestId = requestIdRef.current ?? createBootstrapRequestId()
    requestIdRef.current = requestId
    setState('submitting')

    try {
      await bootstrapGroup({
        tripName: values.tripName,
        destination: values.destination,
        startDate: values.startDate,
        endDate: values.endDate,
        timezone: values.timezone,
        accountingCurrency: values.accountingCurrency,
        displayCurrencyCodes: displayCurrencies,
      }, requestId)
      setConfirmedTripName(values.tripName.trim())
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

  if (state === 'success') {
    return <BootstrapSuccess tripName={confirmedTripName} />
  }

  return (
    <main data-testid="bootstrap-onboarding" className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-5 py-10" style={{ background: 'rgba(15, 11, 8, 0.96)' }}>
      <p className="font-mono" style={{ color: 'var(--text-tertiary)', fontSize: 10, letterSpacing: '0.22em' }}>NEW TRIP</p>
      <h1 className="serif-display" style={{ color: 'var(--text-primary)', fontSize: 34, fontWeight: 400, marginTop: 12 }}>Create your Group</h1>
      <p className="serif-eyebrow" style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 10, marginBottom: 24 }}>Set the trip details that travel with this Group.</p>
      <button type="button" onClick={onSignOut} className="self-start text-sm" style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Sign out</button>
      {signOutError && <p role="status" style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>{signOutError}</p>}

      <form onSubmit={(event) => void submit(event)} aria-label="Create Group" aria-busy={formIsInert} className="flex flex-col gap-4">
        {message && <p role="alert" data-testid="bootstrap-status" className="surface px-3.5 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{message}</p>}
        {Object.keys(errors).length > 0 && <p role="alert" className="surface px-3.5 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>Review the highlighted fields before creating the Group.</p>}
        <FormField label="Trip name" error={touched.tripName ? errors.tripName : undefined}>
          <NeonInput aria-label="Trip name" value={values.tripName} onChange={updateValue('tripName')} onBlur={() => validateField('tripName')} disabled={formIsInert} />
        </FormField>
        <FormField label="Destination" error={touched.destination ? errors.destination : undefined}>
          <NeonInput aria-label="Destination" value={values.destination} onChange={updateValue('destination')} onBlur={() => validateField('destination')} disabled={formIsInert} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Start date" error={touched.startDate ? errors.startDate : undefined}>
            <NeonInput aria-label="Start date" type="date" value={values.startDate} onChange={updateValue('startDate')} onBlur={() => validateField('startDate')} disabled={formIsInert} />
          </FormField>
          <FormField label="End date" error={touched.endDate ? errors.endDate : undefined}>
            <NeonInput aria-label="End date" type="date" value={values.endDate} onChange={updateValue('endDate')} onBlur={() => validateField('endDate')} disabled={formIsInert} />
          </FormField>
        </div>
        <FormField label="IANA timezone" hint="For example, Asia/Kolkata" error={touched.timezone ? errors.timezone : undefined}>
          <NeonInput aria-label="IANA timezone" list="iana-timezones" value={values.timezone} onChange={updateValue('timezone')} onBlur={() => validateField('timezone')} disabled={formIsInert} />
          <datalist id="iana-timezones">{timezoneSuggestions.map((timezone) => <option key={timezone} value={timezone} />)}</datalist>
        </FormField>
        <FormField label="Accounting currency" hint="Three-letter ISO 4217 code" error={touched.accountingCurrency ? errors.accountingCurrency : undefined}>
          <NeonInput aria-label="Accounting currency" maxLength={3} value={values.accountingCurrency} onChange={updateValue('accountingCurrency')} onBlur={() => validateField('accountingCurrency')} disabled={formIsInert} />
        </FormField>
        <FormField label="Display currencies" hint="Comma-separated ISO 4217 codes" error={touched.displayCurrencies ? errors.displayCurrencies : undefined}>
          <NeonInput aria-label="Display currencies" value={values.displayCurrencies} onChange={updateValue('displayCurrencies')} onBlur={() => validateField('displayCurrencies')} disabled={formIsInert} />
        </FormField>
        <NeonBtn type="submit" disabled={formIsInert || requiresEditedRequest} className="mt-2 w-full">{state === 'submitting' ? 'Creating Group…' : state === 'retryable-failure' ? 'Retry creating Group' : requiresEditedRequest ? 'Review details to continue' : 'Create Group'}</NeonBtn>
        {state === 'submitting' && <p role="status" className="font-mono text-center" style={{ color: 'var(--text-tertiary)', fontSize: 10, letterSpacing: '0.12em' }}>CREATING GROUP</p>}
      </form>
    </main>
  )
}

function FormField({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
      <span>{label}</span>
      {children}
      {hint && !error && <span className="font-mono" style={{ color: 'var(--text-tertiary)', fontSize: 10, letterSpacing: '0.08em' }}>{hint}</span>}
      {error && <span role="alert" style={{ color: 'var(--accent)', fontSize: 12 }}>{error}</span>}
    </label>
  )
}

function BootstrapSuccess({ tripName }: { tripName: string }) {
  return (
    <main data-testid="bootstrap-success-state-a" className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center px-5 py-10" style={{ background: 'rgba(15, 11, 8, 0.96)' }}>
      <p className="font-mono" style={{ color: 'var(--text-tertiary)', fontSize: 10, letterSpacing: '0.22em' }}>GROUP CONFIRMED</p>
      <h1 className="serif-display" style={{ color: 'var(--text-primary)', fontSize: 34, fontWeight: 400, marginTop: 12 }}>{tripName}</h1>
      <span className="pill mt-5 w-fit" style={{ borderColor: 'rgba(255, 139, 77, 0.45)', color: 'var(--accent)' }}>GROUP CREATED</span>
      <section aria-label="Invitation status" className="surface mt-5 px-4 py-4">
        <p className="font-mono" style={{ color: 'var(--text-tertiary)', fontSize: 10, letterSpacing: '0.16em' }}>INVITATION STATUS</p>
        <p className="serif-eyebrow mt-2" style={{ color: 'var(--text-secondary)', fontSize: 16 }}>No Invitation has been issued yet.</p>
      </section>
    </main>
  )
}
