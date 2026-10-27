import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Field } from '../../components/ui/Field'
import { NeonBtn } from '../../components/ui/NeonBtn'
import { NeonInput } from '../../components/ui/NeonInput'
import { NeonSelect } from '../../components/ui/NeonSelect'
import { Sheet } from '../../components/ui/Sheet'
import { Switch } from '../../components/ui/Switch'
import type { MyGroupAccess } from '../groups/myGroupAccess'
import { TripCurrencyFields } from '../onboarding/CurrencyFields'
import {
  type BootstrapFieldName, type BootstrapFormValues, TRIP_CURRENCIES, currencyName, displayCurrencySet, formatTripDates,
  supportedTimezones, timezoneLabel, validateBootstrapForm,
} from '../onboarding/tripSettings'
import {
  type TripSettingsErrorCode, TripSettingsError, loadCurrencyLocked, loadDisplayCurrencies, tripSettingsErrorMessage,
  updateTripSettings,
} from './tripSettingsApi'

type FormState = Omit<BootstrapFormValues, 'displayCurrencies'> & { international: boolean; extraCurrencies: string[] }

const inputStyle = { fontSize: 16, minHeight: 44 } as const

let timezoneChoices: { value: string; label: string }[] | null = null
function timezoneOptions() {
  timezoneChoices ??= supportedTimezones().map((zone) => ({ value: zone, label: timezoneLabel(zone) }))
  return timezoneChoices
}

function toValues(form: FormState): BootstrapFormValues {
  const { international, extraCurrencies, ...rest } = form
  return { ...rest, displayCurrencies: international ? displayCurrencySet(form.accountingCurrency, extraCurrencies) : [form.accountingCurrency] }
}

/**
 * Trip settings, opened from the workspace header. Owners edit the Trip; Members
 * see the same facts read-only as "Trip details".
 */
export function TripSettingsSheet({ trip, onClose, onSaved }: {
  trip: MyGroupAccess
  onClose: () => void
  /** The server confirmed a change (or refused because the role changed): re-read the Trip. */
  onSaved: () => void
}) {
  const [display, setDisplay] = useState<string[] | null>(null)
  const [locked, setLocked] = useState<boolean | null>(null)
  const owner = trip.role === 'owner'

  useEffect(() => {
    let active = true
    void loadDisplayCurrencies(trip.groupId).then(
      (codes) => { if (active) setDisplay(codes) },
      () => { if (active) setDisplay([trip.accountingCurrency]) },
    )
    if (owner) {
      void loadCurrencyLocked(trip.groupId).then(
        (value) => { if (active) setLocked(value) },
        // If we cannot tell, the server still refuses a locked change with a clear message.
        () => { if (active) setLocked(false) },
      )
    }
    return () => { active = false }
  }, [trip.groupId, trip.accountingCurrency, owner])

  return (
    <Sheet title={owner ? 'Trip settings' : 'Trip details'} testId="trip-settings-sheet" onClose={onClose}>
      {display === null || (owner && locked === null)
        ? <p role="status" className="flex items-center gap-3 py-4" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          <span className="spinner" aria-hidden="true" />Loading
        </p>
        : owner
          ? <SettingsForm trip={trip} display={display} currencyLocked={Boolean(locked)} onClose={onClose} onSaved={onSaved} />
          : <TripDetails trip={trip} display={display} />}
    </Sheet>
  )
}

function TripDetails({ trip, display }: { trip: MyGroupAccess; display: string[] }) {
  const extras = display.filter((code) => code !== trip.accountingCurrency)
  return (
    <div data-testid="trip-details">
      <dl className="details-list">
        <dt>Trip name</dt><dd>{trip.tripName}</dd>
        <dt>Destination</dt><dd>{trip.destination}</dd>
        <dt>Dates</dt><dd>{formatTripDates(trip.startDate, trip.endDate)}</dd>
        <dt>Timezone</dt><dd>{timezoneLabel(trip.timezone)}</dd>
        <dt>International</dt><dd>{trip.isInternational ? 'Yes' : 'No'}</dd>
        <dt>Trip currency</dt><dd>{trip.accountingCurrency} · {currencyName(trip.accountingCurrency)}</dd>
        {trip.isInternational && extras.length > 0 && <><dt>Also shown in</dt><dd>{extras.join(', ')}</dd></>}
      </dl>
      <p className="notice mt-5">Only an Owner can change these.</p>
    </div>
  )
}

function SettingsForm({ trip, display, currencyLocked, onClose, onSaved }: {
  trip: MyGroupAccess
  display: string[]
  currencyLocked: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<FormState>(() => ({
    tripName: trip.tripName,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
    timezone: trip.timezone,
    accountingCurrency: trip.accountingCurrency,
    international: trip.isInternational,
    extraCurrencies: display.filter((code) => code !== trip.accountingCurrency),
  }))
  const [attempted, setAttempted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState<TripSettingsErrorCode | null>(null)
  // One request id per attempt; a retry of the same, unedited attempt reuses it.
  const requestId = useRef<string | null>(null)
  const values = toValues(form)
  const errors = validateBootstrapForm(values)
  const show = (field: BootstrapFieldName) => (attempted ? errors[field] : undefined)
  const timezones = useMemo(() => {
    const options = timezoneOptions()
    return options.some((option) => option.value === form.timezone) ? options : [{ value: form.timezone, label: form.timezone }, ...options]
  }, [form.timezone])

  const update = (changes: Partial<FormState>) => {
    if (saving) return
    requestId.current = null
    setFailure(null)
    setForm((current) => ({ ...current, ...changes }))
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    setAttempted(true)
    if (Object.keys(errors).length) return
    requestId.current ??= crypto.randomUUID()
    setSaving(true)
    setFailure(null)
    try {
      await updateTripSettings(trip.groupId, {
        trip_name: values.tripName.trim(),
        destination: values.destination.trim(),
        start_date: values.startDate,
        end_date: values.endDate,
        timezone: values.timezone,
        is_international: form.international,
        accounting_currency: values.accountingCurrency,
        display_currency_codes: values.displayCurrencies,
      }, requestId.current)
      // Close first: the refreshed Trip then shows the change in the header and tabs.
      onClose()
      onSaved()
    } catch (error) {
      const code = error instanceof TripSettingsError ? error.code : 'retryable'
      setFailure(code)
      setSaving(false)
      if (code === 'not_authorized') onSaved()
    }
  }

  const currencyHint = currencyLocked
    ? `Locked: expenses or payments are already recorded in ${trip.accountingCurrency}, and changing it would break the balances.`
    : 'Used to split expenses. It can change only until the first expense or payment.'

  return (
    <form onSubmit={(event) => void submit(event)} aria-label="Trip settings" aria-busy={saving} noValidate className="flex flex-col gap-5">
      {attempted && Object.keys(errors).length > 0 && <p role="alert" className="notice notice--error">Check the highlighted fields.</p>}
      <Field id="settings-name" label="Trip name" error={show('tripName')}>
        <NeonInput value={form.tripName} onChange={(event) => update({ tripName: event.target.value })} disabled={saving} autoComplete="off" style={inputStyle} />
      </Field>
      <Field id="settings-destination" label="Destination" error={show('destination')}>
        <NeonInput value={form.destination} onChange={(event) => update({ destination: event.target.value })} disabled={saving} autoComplete="off" style={inputStyle} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id="settings-start" label="Start date" error={show('startDate')}>
          <NeonInput type="date" value={form.startDate} onChange={(event) => update({ startDate: event.target.value })} disabled={saving} style={inputStyle} />
        </Field>
        <Field id="settings-end" label="End date" error={show('endDate')}>
          <NeonInput type="date" value={form.endDate} min={form.startDate || undefined} onChange={(event) => update({ endDate: event.target.value })} disabled={saving} style={inputStyle} />
        </Field>
      </div>
      <Field id="settings-timezone" label="Timezone" hint="Plans and flights show in this time." error={show('timezone')}>
        <NeonSelect value={form.timezone} onChange={(event) => update({ timezone: event.target.value })} disabled={saving}>
          {timezones.map((zone) => <option key={zone.value} value={zone.value}>{zone.label}</option>)}
        </NeonSelect>
      </Field>
      <Switch label="International trip?" checked={form.international} disabled={saving}
        hint={form.international ? 'Expenses can be in other currencies, and the FX tab is on.' : 'Everything is in the Trip currency; currency choices and the FX tab are hidden.'}
        onChange={(international) => update({ international })} />
      {form.international
        ? <TripCurrencyFields idPrefix="settings" currency={form.accountingCurrency} extras={form.extraCurrencies}
          onCurrency={(code) => update({ accountingCurrency: code, extraCurrencies: form.extraCurrencies.filter((extra) => extra !== code) })}
          onExtras={(extraCurrencies) => update({ extraCurrencies })} disabled={saving} currencyDisabled={currencyLocked}
          currencyHint={currencyHint} currencyError={show('accountingCurrency')} displayError={show('displayCurrencies')}
          openExtras={Boolean(show('displayCurrencies'))} />
        : <Field id="settings-currency" label="Trip currency" hint={currencyHint} error={show('accountingCurrency')}>
          <NeonSelect value={form.accountingCurrency} disabled={saving || currencyLocked}
            onChange={(event) => update({ accountingCurrency: event.target.value })}>
            {currencyOptions(form.accountingCurrency).map((code) => <option key={code} value={code}>{code} · {currencyName(code)}</option>)}
          </NeonSelect>
        </Field>}

      {failure && <p role="alert" className="notice notice--error">{tripSettingsErrorMessage(failure)}</p>}
      <div className="flex flex-col gap-3">
        <NeonBtn type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? 'Saving…' : failure === 'retryable' ? 'Try again' : 'Save changes'}
        </NeonBtn>
        <NeonBtn type="button" variant="ghost" size="lg" className="w-full" disabled={saving} onClick={onClose}>Cancel</NeonBtn>
      </div>
    </form>
  )
}

/** Same short list as Create Trip, keeping a stored code it does not offer. */
function currencyOptions(current: string): readonly string[] {
  return TRIP_CURRENCIES.includes(current) ? TRIP_CURRENCIES : [current, ...TRIP_CURRENCIES]
}
