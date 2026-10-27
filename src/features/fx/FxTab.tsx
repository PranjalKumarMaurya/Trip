import { useCallback, useEffect, useMemo, useState } from 'react'
import { NeonInput } from '../../components/ui/NeonInput'
import { supabase } from '../../lib/supabase'
import type { TripTabProps } from '../workspace/tripTab'
import { BALI_PRICE_GUIDE, showsBaliGuide } from './baliPriceGuide'
import {
  AUTO_REFRESH_AFTER_MS, RATES_PROVIDER_URL, STALE_AFTER_MS, type RateTable, browserStorage, chooseCounterCurrency,
  counterCacheKey, fetchLiveRates, formatInputAmount, formatMoney, formatRate, parseAmount, quickAmounts, rateBetween,
  readCachedRates, readRemembered, remember, writeCachedRates,
} from './fxRates'

const COMMON_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'IDR', 'SGD', 'THB', 'AUD', 'JPY', 'AED', 'MYR', 'VND']

type Side = 'accounting' | 'counter'
type RatesState = { table: RateTable | null; source: 'live' | 'saved' | null; status: 'loading' | 'idle' | 'error' }

export function FxTab({ trip }: TripTabProps) {
  const accounting = trip.accountingCurrency
  const storage = useMemo(() => browserStorage(), [])
  const [rates, setRates] = useState<RatesState>(() => {
    const saved = readCachedRates(storage, accounting)
    return { table: saved, source: saved ? 'saved' : null, status: 'idle' }
  })
  const [displayCurrencies, setDisplayCurrencies] = useState<string[]>([])
  const [chosen, setChosen] = useState<string | null>(() => readRemembered(storage, counterCacheKey(trip.groupId)))
  const [amounts, setAmounts] = useState<{ accounting: string; counter: string; edited: Side }>({ accounting: '100', counter: '', edited: 'accounting' })

  const refresh = useCallback(async () => {
    setRates((current) => ({ ...current, status: 'loading' }))
    try {
      const table = await fetchLiveRates(accounting)
      writeCachedRates(storage, table)
      setRates({ table, source: 'live', status: 'idle' })
    } catch {
      setRates((current) => ({ ...current, status: 'error' }))
    }
  }, [accounting, storage])

  useEffect(() => {
    const saved = readCachedRates(storage, accounting)
    if (!saved || Date.now() - saved.fetchedAt > AUTO_REFRESH_AFTER_MS) void refresh()
  }, [accounting, storage, refresh])

  // Display currencies are read only if RLS allows it; otherwise any ISO code can be picked.
  useEffect(() => {
    let active = true
    void supabase.from('group_configuration_display_currencies').select('currency_code').eq('group_id', trip.groupId)
      .then(({ data, error }) => {
        if (active && !error && data) setDisplayCurrencies(data.map((row) => row.currency_code))
      })
    return () => { active = false }
  }, [trip.groupId])

  const available = rates.table ? Object.keys(rates.table.rates) : null
  const counter = chooseCounterCurrency({ accounting, remembered: chosen, displayCurrencies, destination: trip.destination, available })
  const rate = rateBetween(rates.table, accounting, counter)

  // Keep the side the person did not type in up to date with the current rate.
  const shown = useMemo(() => {
    if (!rate) return amounts
    if (amounts.edited === 'accounting') {
      const value = parseAmount(amounts.accounting)
      return { ...amounts, counter: value === null ? '' : formatInputAmount(value * rate, counter) }
    }
    const value = parseAmount(amounts.counter)
    return { ...amounts, accounting: value === null ? '' : formatInputAmount(value / rate, accounting) }
  }, [amounts, rate, counter, accounting])

  const pick = (code: string) => {
    setChosen(code)
    remember(storage, counterCacheKey(trip.groupId), code)
    setAmounts((current) => current.edited === 'counter' ? { ...current, accounting: shown.accounting, edited: 'accounting' } : current)
  }

  const options = useMemo(() => {
    const codes = [...displayCurrencies, ...(available ?? COMMON_CURRENCIES).slice().sort()]
    return [...new Set([counter, ...codes])].filter((code) => code !== accounting)
  }, [displayCurrencies, available, counter, accounting])

  const timeFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  const stale = rates.table ? Date.now() - rates.table.fetchedAt > STALE_AFTER_MS : false
  const statusText = rates.status === 'loading'
    ? 'Fetching live rates…'
    : !rates.table
      ? rates.status === 'error' ? 'No rates yet. Connect to the internet and refresh.' : 'Fetching live rates…'
      : rates.status === 'error'
        ? `Offline. Showing saved rates from ${timeFormat.format(rates.table.fetchedAt)}.`
        : `${rates.source === 'live' ? 'Live' : 'Saved'} rates, updated ${timeFormat.format(rates.table.providerUpdatedAt ?? rates.table.fetchedAt)}${stale ? ' (may be out of date)' : ''}.`

  const guideTarget = accounting === 'IDR' ? counter : accounting
  const guideRate = rateBetween(rates.table, 'IDR', guideTarget)

  return (
    <section data-testid="fx-tab" className="flex flex-col gap-6">
      <div className="surface px-4 py-5">
        <h2 className="serif-display" style={{ color: 'var(--text-primary)', fontSize: 25 }}>FX</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Quick reference conversions for {trip.tripName}. Split keeps its own exchange rates.</p>

        <div className="mt-5 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <span>{accounting} · Trip currency</span>
            <NeonInput aria-label={`Amount in ${accounting}`} inputMode="decimal" autoComplete="off" value={shown.accounting}
              onChange={(event) => setAmounts({ accounting: event.target.value, counter: shown.counter, edited: 'accounting' })}
              style={{ fontSize: 20, fontFamily: 'var(--font-display)' }} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <span>Convert to</span>
            <select aria-label="Other currency" value={counter} onChange={(event) => pick(event.target.value)}
              className="w-full rounded-md px-3 py-2.5" style={{ background: 'rgba(245,241,235,0.035)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              {options.map((code) => <option key={code} value={code}>{code}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <span>{counter}</span>
            <NeonInput aria-label={`Amount in ${counter}`} inputMode="decimal" autoComplete="off" value={shown.counter}
              onChange={(event) => setAmounts({ accounting: shown.accounting, counter: event.target.value, edited: 'counter' })}
              disabled={!rate} style={{ fontSize: 20, fontFamily: 'var(--font-display)' }} />
          </label>
        </div>

        <p data-testid="fx-rate" className="mt-4 font-mono" style={{ color: 'var(--text-primary)', fontSize: 12 }}>
          {rate ? `1 ${accounting} = ${formatRate(rate)} ${counter} · 1 ${counter} = ${formatRate(1 / rate)} ${accounting}` : `No ${accounting} → ${counter} rate available.`}
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p role="status" data-testid="fx-status" className="text-xs" style={{ color: rates.status === 'error' ? 'var(--accent)' : 'var(--text-tertiary)' }}>{statusText}</p>
          <button type="button" onClick={() => void refresh()} disabled={rates.status === 'loading'} className="shrink-0 text-sm" style={{ color: 'var(--accent)' }}>
            {rates.status === 'loading' ? 'Refreshing…' : 'Refresh rates'}
          </button>
        </div>
      </div>

      <section aria-label="Quick amounts" className="flex flex-col gap-3">
        <QuickChips label={accounting} amounts={quickAmounts(accounting, rates.table)} onPick={(value) => setAmounts({ accounting: String(value), counter: '', edited: 'accounting' })} />
        {rate && <QuickChips label={counter} amounts={quickAmounts(counter, rates.table)} onPick={(value) => setAmounts({ accounting: '', counter: String(value), edited: 'counter' })} />}
      </section>

      {showsBaliGuide(trip.destination) && (
        <section data-testid="fx-bali-guide" aria-labelledby="fx-bali-heading" className="surface px-4 py-5">
          <h2 id="fx-bali-heading" className="serif-display" style={{ color: 'var(--text-primary)', fontSize: 22 }}>Bali price guide</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {BALI_PRICE_GUIDE.map((item) => (
              <li key={item.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                  {item.note && <span className="block text-xs" style={{ color: 'var(--text-tertiary)' }}>{item.note}</span>}
                </span>
                <span className="shrink-0 text-right">
                  <span className="block" style={{ color: 'var(--text-primary)' }}>{formatMoney(item.idr, 'IDR')}</span>
                  {guideRate && guideTarget !== 'IDR' && <span className="block font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>≈ {formatMoney(item.idr * guideRate, guideTarget)}</span>}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>Indicative prices. Tip around 10%.</p>
        </section>
      )}

      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        <a href={RATES_PROVIDER_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }}>Rates by Exchange Rate API</a>. Mid-market reference rates, not a quote.
      </p>
    </section>
  )
}

function QuickChips({ label, amounts, onPick }: { label: string; amounts: number[]; onPick: (value: number) => void }) {
  return (
    <div>
      <p className="mb-2 font-mono" style={{ color: 'var(--text-tertiary)', fontSize: 10, letterSpacing: '0.16em' }}>QUICK · {label}</p>
      <div className="flex flex-wrap gap-2">
        {amounts.map((value) => (
          <button key={value} type="button" onClick={() => onPick(value)} aria-label={`Convert ${formatMoney(value, label)}`}
            className="rounded-full border px-3 py-1.5 text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            {formatMoney(value, label)}
          </button>
        ))}
      </div>
    </div>
  )
}
