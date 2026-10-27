// Reference exchange rates for the FX tab: fetch, validate, cache, convert, format.
// Pure apart from the injected fetch and storage, so it runs under `node --test`.
// These rates are for quick conversions only; Split records its own FX.

export interface RateTable {
  base: string
  /** Units of each currency per 1 `base`; `rates[base] === 1`. */
  rates: Record<string, number>
  /** When the provider last updated the rates (ms since epoch), if it said. */
  providerUpdatedAt: number | null
  /** When this device fetched them (ms since epoch). */
  fetchedAt: number
}

export class FxError extends Error {}

export const RATES_PROVIDER_URL = 'https://www.exchangerate-api.com'
export const ratesUrl = (base: string) => `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`
/** Rates change daily; don't refetch on every visit. */
export const AUTO_REFRESH_AFTER_MS = 60 * 60 * 1000
export const STALE_AFTER_MS = 36 * 60 * 60 * 1000

export const isCurrencyCode = (value: unknown): value is string => typeof value === 'string' && /^[A-Z]{3}$/u.test(value)

/** Validate an open.er-api.com `latest` response. */
export function parseRatesResponse(body: unknown, base: string, now: number): RateTable | null {
  if (!body || typeof body !== 'object') return null
  const data = body as { result?: unknown; base_code?: unknown; rates?: unknown; time_last_update_unix?: unknown }
  if (data.result !== 'success' || data.base_code !== base || !data.rates || typeof data.rates !== 'object') return null
  const rates: Record<string, number> = {}
  for (const [code, value] of Object.entries(data.rates as Record<string, unknown>)) {
    if (isCurrencyCode(code) && typeof value === 'number' && Number.isFinite(value) && value > 0) rates[code] = value
  }
  if (rates[base] !== 1) return null
  const updated = typeof data.time_last_update_unix === 'number' && data.time_last_update_unix > 0 ? data.time_last_update_unix * 1000 : null
  return { base, rates, providerUpdatedAt: updated, fetchedAt: now }
}

export async function fetchLiveRates(base: string, { fetchImpl = fetch, now = Date.now }: { fetchImpl?: typeof fetch; now?: () => number } = {}): Promise<RateTable> {
  if (!isCurrencyCode(base)) throw new FxError('invalid_currency')
  let body: unknown
  try {
    const response = await fetchImpl(ratesUrl(base), { headers: { Accept: 'application/json' } })
    if (!response.ok) throw new FxError('rates_unavailable')
    body = await response.json()
  } catch {
    throw new FxError('rates_unavailable')
  }
  const table = parseRatesResponse(body, base, now())
  if (!table) throw new FxError('rates_unavailable')
  return table
}

type ReadableStorage = Pick<Storage, 'getItem'>
type WritableStorage = Pick<Storage, 'setItem'>

export const ratesCacheKey = (base: string) => `trip-fx-rates:v1:${base}`

/** Last good rates for `base`, or null. Never throws (private mode, quota, corrupt data). */
export function readCachedRates(storage: ReadableStorage | null | undefined, base: string): RateTable | null {
  try {
    const raw = storage?.getItem(ratesCacheKey(base))
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<RateTable>
    if (value.base !== base || typeof value.fetchedAt !== 'number' || !value.rates) return null
    const table = parseRatesResponse({ result: 'success', base_code: base, rates: value.rates,
      time_last_update_unix: value.providerUpdatedAt ? value.providerUpdatedAt / 1000 : undefined }, base, value.fetchedAt)
    return table
  } catch {
    return null
  }
}

export function writeCachedRates(storage: WritableStorage | null | undefined, table: RateTable): boolean {
  try {
    storage?.setItem(ratesCacheKey(table.base), JSON.stringify(table))
    return Boolean(storage)
  } catch {
    return false
  }
}

/** The browser's localStorage, or null where it is unavailable. */
export function browserStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

/** Units of `to` per 1 `from`, via the table's base. */
export function rateBetween(table: RateTable | null, from: string, to: string): number | null {
  if (!table) return null
  const fromRate = table.rates[from]
  const toRate = table.rates[to]
  return fromRate && toRate ? toRate / fromRate : null
}

/** Parse what a person typed: `1,250.50`, `1 250`, `.5`. Negative or junk is null. */
export function parseAmount(input: string): number | null {
  const text = input.replace(/[\s,_]/gu, '')
  if (!/^(\d+\.?\d*|\.\d+)$/u.test(text)) return null
  const value = Number(text)
  return Number.isFinite(value) ? value : null
}

export function fractionDigits(currency: string, value: number): number {
  if (Math.abs(value) >= 1000) return 0
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2
  } catch {
    return 2
  }
}

/** Plain value for an input field: rounded to the currency's minor units, no grouping or trailing zeros. */
export function formatInputAmount(value: number, currency: string): string {
  if (!Number.isFinite(value)) return ''
  const fixed = value.toFixed(fractionDigits(currency, value))
  return fixed.includes('.') ? fixed.replace(/\.?0+$/u, '') : fixed
}

export function formatMoney(value: number, currency: string, locale?: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: fractionDigits(currency, value), minimumFractionDigits: 0 }).format(value)
  } catch {
    return `${formatInputAmount(value, currency)} ${currency}`
  }
}

export function formatRate(rate: number, locale?: string): string {
  return new Intl.NumberFormat(locale, { maximumSignificantDigits: rate >= 1000 ? 7 : 5 }).format(rate)
}

function nice(value: number): number {
  const exponent = Math.floor(Math.log10(value))
  const scale = 10 ** exponent
  const step = [1, 2, 5, 10].reduce((best, candidate) =>
    Math.abs(Math.log10(candidate * scale) - Math.log10(value)) < Math.abs(Math.log10(best * scale) - Math.log10(value)) ? candidate : best)
  return step * scale
}

/** Round amounts worth roughly 5–200 US dollars, in `currency`. */
export function quickAmounts(currency: string, table: RateTable | null): number[] {
  const perUsd = rateBetween(table, 'USD', currency)
  if (!perUsd) return [10, 50, 100, 500, 1000]
  return [...new Set([5, 10, 25, 50, 100, 200].map((usd) => nice(usd * perUsd)))]
}

/** Pick the currency shown against the accounting currency. */
export function chooseCounterCurrency({ accounting, remembered, displayCurrencies = [], destination = '', available }: {
  accounting: string
  remembered?: string | null
  displayCurrencies?: string[]
  destination?: string
  available?: string[] | null
}): string {
  const usable = (code: unknown): code is string => isCurrencyCode(code) && code !== accounting && (!available || available.includes(code))
  if (usable(remembered)) return remembered
  const fromConfig = displayCurrencies.find(usable)
  if (fromConfig) return fromConfig
  if (/\b(bali|indonesia)\b/iu.test(destination) && usable('IDR')) return 'IDR'
  return accounting === 'USD' ? 'EUR' : 'USD'
}

export function counterCacheKey(groupId: string) {
  return `trip-fx-counter:v1:${groupId}`
}

export function readRemembered(storage: ReadableStorage | null | undefined, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null
  } catch {
    return null
  }
}

export function remember(storage: WritableStorage | null | undefined, key: string, value: string): void {
  try {
    storage?.setItem(key, value)
  } catch {
    /* per-device convenience only */
  }
}
