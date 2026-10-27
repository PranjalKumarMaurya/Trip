import { type ReactNode, useId, useMemo, useState } from 'react'
import { Field } from '../../components/ui/Field'
import { IconClose } from '../../components/ui/icons'
import { NeonSelect } from '../../components/ui/NeonSelect'
import { TRIP_CURRENCIES, currencyName } from './tripSettings'

/**
 * Trip currency plus the optional extra display currencies ("More options"),
 * shared by Create Trip and Trip settings for International Trips.
 */
export function TripCurrencyFields({
  idPrefix, currency, extras, onCurrency, onExtras, disabled, currencyDisabled, currencyHint, currencyError, displayError,
  openExtras = false,
}: {
  idPrefix: string
  currency: string
  extras: string[]
  onCurrency: (code: string) => void
  onExtras: (codes: string[]) => void
  disabled?: boolean
  /** The Trip currency cannot change (e.g. money is recorded); `currencyHint` says why. */
  currencyDisabled?: boolean
  currencyHint?: ReactNode
  currencyError?: string
  displayError?: string
  /** Open "More options" (e.g. to show a display-currency error). */
  openExtras?: boolean
}) {
  const [showMore, setShowMore] = useState(false)
  const moreId = useId()
  const currencies = useMemo(() => TRIP_CURRENCIES.map((code) => ({ code, name: currencyName(code) })), [])
  // Keep a stored code the short list does not offer selectable rather than silently changing it.
  const choices = currency && !TRIP_CURRENCIES.includes(currency) ? [{ code: currency, name: currencyName(currency) }, ...currencies] : currencies
  const shownExtras = extras.filter((code) => code !== currency)
  const addable = choices.filter(({ code }) => code !== currency && !shownExtras.includes(code))
  const open = showMore || openExtras

  return (
    <>
      <Field id={`${idPrefix}-currency`} label="Trip currency" hint={currencyHint ?? 'Used to split expenses'} error={currencyError}>
        <NeonSelect value={currency} disabled={disabled || currencyDisabled}
          onChange={(event) => onCurrency(event.target.value)}>
          {!currency && <option value="">Choose a currency</option>}
          {choices.map(({ code, name }) => <option key={code} value={code}>{code} · {name}</option>)}
        </NeonSelect>
      </Field>

      <div>
        <button type="button" className="text-link" aria-expanded={open} aria-controls={moreId} onClick={() => setShowMore(!open)}>
          {open ? 'Fewer options' : 'More options'}
          {!open && shownExtras.length > 0 && <span style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}>· also {shownExtras.join(', ')}</span>}
        </button>
        <div id={moreId} hidden={!open} className="mt-2">
          <Field id={`${idPrefix}-extra-currency`} label="Also show amounts in" optional
            hint={`Amounts are always shown in ${currency || 'the Trip currency'}.`} error={displayError}>
            <NeonSelect value="" disabled={disabled || addable.length === 0}
              onChange={(event) => { if (event.target.value) onExtras([...shownExtras, event.target.value]) }}>
              <option value="">Add a currency</option>
              {addable.map(({ code, name }) => <option key={code} value={code}>{code} · {name}</option>)}
            </NeonSelect>
          </Field>
          <ul aria-label="Currencies shown" className="mt-3 flex flex-wrap gap-2">
            {currency && <li className="chip chip--locked" title={currencyName(currency)}>{currency}</li>}
            {shownExtras.map((code) => (
              <li key={code} className="chip" title={currencyName(code)}>
                {code}
                <button type="button" className="chip__remove" aria-label={`Remove ${code}`} disabled={disabled}
                  onClick={() => onExtras(shownExtras.filter((extra) => extra !== code))}>
                  <IconClose size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
