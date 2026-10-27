/**
 * Pure helpers for the Create Trip form: timezone and currency choices with
 * friendly labels, sensible defaults, and the client-side validation. The
 * server (`bootstrap_group`) re-validates everything; these only keep the
 * form honest and readable.
 */

export interface BootstrapFormValues {
  tripName: string
  destination: string
  startDate: string
  endDate: string
  timezone: string
  accountingCurrency: string
  /** Full display set sent to the server; always includes the Trip currency. */
  displayCurrencies: string[]
}

export type BootstrapFieldName = keyof BootstrapFormValues
export type BootstrapFormErrors = Partial<Record<BootstrapFieldName, string>>

const timezonePattern = /^[A-Za-z][A-Za-z0-9_+\-]*(?:\/[A-Za-z0-9_+\-]+)+$/
const currencyPattern = /^[A-Z]{3}$/

/**
 * Browsers (Chromium, Node) list some zones under their old names. Show the
 * current name instead; the server accepts both.
 */
export const LEGACY_TIMEZONES: Readonly<Record<string, string>> = {
  'Africa/Asmera': 'Africa/Asmara',
  'America/Buenos_Aires': 'America/Argentina/Buenos_Aires',
  'America/Catamarca': 'America/Argentina/Catamarca',
  'America/Coral_Harbour': 'America/Atikokan',
  'America/Cordoba': 'America/Argentina/Cordoba',
  'America/Godthab': 'America/Nuuk',
  'America/Indianapolis': 'America/Indiana/Indianapolis',
  'America/Jujuy': 'America/Argentina/Jujuy',
  'America/Louisville': 'America/Kentucky/Louisville',
  'America/Mendoza': 'America/Argentina/Mendoza',
  'Asia/Calcutta': 'Asia/Kolkata',
  'Asia/Katmandu': 'Asia/Kathmandu',
  'Asia/Rangoon': 'Asia/Yangon',
  'Asia/Saigon': 'Asia/Ho_Chi_Minh',
  'Atlantic/Faeroe': 'Atlantic/Faroe',
  'Europe/Kiev': 'Europe/Kyiv',
  'Pacific/Enderbury': 'Pacific/Kanton',
  'Pacific/Ponape': 'Pacific/Pohnpei',
  'Pacific/Truk': 'Pacific/Chuuk',
  UTC: 'Etc/UTC',
  GMT: 'Etc/UTC',
  'Etc/GMT': 'Etc/UTC',
  'Etc/UCT': 'Etc/UTC',
}

/** Used when the browser cannot list its zones, and always offered. */
export const FALLBACK_TIMEZONES: readonly string[] = [
  'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/New_York', 'America/Sao_Paulo',
  'America/Toronto', 'Asia/Bangkok', 'Asia/Colombo', 'Asia/Dubai', 'Asia/Ho_Chi_Minh', 'Asia/Hong_Kong',
  'Asia/Jakarta', 'Asia/Kathmandu', 'Asia/Kolkata', 'Asia/Kuala_Lumpur', 'Asia/Makassar', 'Asia/Manila',
  'Asia/Seoul', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Melbourne', 'Australia/Perth', 'Australia/Sydney',
  'Etc/UTC', 'Europe/Amsterdam', 'Europe/Berlin', 'Europe/Istanbul', 'Europe/Lisbon', 'Europe/London',
  'Europe/Madrid', 'Europe/Oslo', 'Europe/Paris', 'Europe/Rome', 'Europe/Zurich', 'Indian/Maldives',
  'Pacific/Auckland',
]

export function canonicalTimezone(zone: string): string {
  return LEGACY_TIMEZONES[zone] ?? zone
}

export function isUsableTimezone(value: string): boolean {
  if (!timezonePattern.test(value)) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format()
    return true
  } catch {
    return false
  }
}

type IntlLike = { supportedValuesOf?: (key: 'timeZone') => string[] }

/** Every zone the browser knows, under current names, sorted. */
export function supportedTimezones(intl: IntlLike = Intl as unknown as IntlLike): string[] {
  let listed: string[] = []
  try {
    listed = typeof intl.supportedValuesOf === 'function' ? intl.supportedValuesOf('timeZone') : []
  } catch {
    listed = []
  }
  const zones = new Set<string>()
  for (const zone of [...listed, ...FALLBACK_TIMEZONES]) {
    const canonical = canonicalTimezone(zone)
    if (isUsableTimezone(canonical)) zones.add(canonical)
  }
  return [...zones].sort((left, right) => left.localeCompare(right))
}

/** The device's own zone under its current name, or '' if it is not a usable IANA zone. */
export function browserTimezone(): string {
  try {
    const zone = canonicalTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone ?? '')
    return isUsableTimezone(zone) ? zone : ''
  } catch {
    return ''
  }
}

/** "UTC+08:00" for Asia/Makassar, "UTC+00:00" for Etc/UTC; '' if the engine cannot say. */
export function timezoneOffset(zone: string, at: Date = new Date()): string {
  try {
    const options = { timeZone: zone, timeZoneName: 'longOffset' } as Intl.DateTimeFormatOptions
    const name = new Intl.DateTimeFormat('en-US', options).formatToParts(at)
      .find((part) => part.type === 'timeZoneName')?.value ?? ''
    const match = /^GMT(?:([+\-−])(\d{1,2}):?(\d{2})?)?$/u.exec(name)
    if (!match) return ''
    if (!match[1]) return 'UTC+00:00'
    const sign = match[1] === '+' ? '+' : '-'
    return `UTC${sign}${match[2].padStart(2, '0')}:${match[3] ?? '00'}`
  } catch {
    return ''
  }
}

/** "Asia/Makassar (UTC+08:00)"; underscores read as spaces. */
export function timezoneLabel(zone: string, at: Date = new Date()): string {
  const offset = timezoneOffset(zone, at)
  const name = zone.replace(/_/g, ' ')
  return offset ? `${name} (${offset})` : name
}

/** Common Trip currencies (all in the server's ISO 4217 table), alphabetical. */
export const TRIP_CURRENCIES: readonly string[] = [
  'AED', 'AUD', 'BDT', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD', 'IDR', 'ILS',
  'INR', 'JPY', 'KES', 'KRW', 'LKR', 'MVR', 'MXN', 'MYR', 'NOK', 'NPR', 'NZD', 'PHP', 'PKR', 'PLN',
  'QAR', 'SAR', 'SEK', 'SGD', 'THB', 'TRY', 'TWD', 'USD', 'VND', 'ZAR',
]

const euroRegions = ['AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK']

const regionCurrency: Readonly<Record<string, string>> = {
  ...Object.fromEntries(euroRegions.map((region) => [region, 'EUR'])),
  AE: 'AED', AU: 'AUD', BD: 'BDT', BR: 'BRL', CA: 'CAD', CH: 'CHF', CN: 'CNY', CZ: 'CZK', DK: 'DKK',
  GB: 'GBP', HK: 'HKD', ID: 'IDR', IL: 'ILS', IN: 'INR', JP: 'JPY', KE: 'KES', KR: 'KRW', LK: 'LKR',
  MV: 'MVR', MX: 'MXN', MY: 'MYR', NO: 'NOK', NP: 'NPR', NZ: 'NZD', PH: 'PHP', PK: 'PKR', PL: 'PLN',
  QA: 'QAR', SA: 'SAR', SE: 'SEK', SG: 'SGD', TH: 'THB', TR: 'TRY', TW: 'TWD', US: 'USD', VN: 'VND',
  ZA: 'ZAR',
}

// Where the device clock is set says more about home currency than the UI language
// (many people outside the US browse in en-US).
const timezoneRegion: Readonly<Record<string, string>> = {
  'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Jakarta': 'ID', 'Asia/Makassar': 'ID', 'Asia/Jayapura': 'ID',
  'Asia/Pontianak': 'ID', 'Asia/Singapore': 'SG', 'Asia/Bangkok': 'TH', 'Asia/Dubai': 'AE', 'Asia/Kathmandu': 'NP',
  'Asia/Katmandu': 'NP', 'Asia/Colombo': 'LK', 'Asia/Dhaka': 'BD', 'Asia/Karachi': 'PK', 'Asia/Kuala_Lumpur': 'MY',
  'Asia/Ho_Chi_Minh': 'VN', 'Asia/Saigon': 'VN', 'Asia/Manila': 'PH', 'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR',
  'Asia/Shanghai': 'CN', 'Asia/Hong_Kong': 'HK', 'Asia/Taipei': 'TW', 'Asia/Qatar': 'QA', 'Asia/Riyadh': 'SA',
  'Asia/Jerusalem': 'IL', 'Indian/Maldives': 'MV', 'Europe/London': 'GB', 'Europe/Zurich': 'CH', 'Europe/Oslo': 'NO',
  'Europe/Stockholm': 'SE', 'Europe/Copenhagen': 'DK', 'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ',
  'Europe/Istanbul': 'TR', 'Europe/Berlin': 'DE', 'Europe/Paris': 'FR', 'Europe/Madrid': 'ES', 'Europe/Rome': 'IT',
  'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE', 'Europe/Vienna': 'AT', 'Europe/Lisbon': 'PT', 'Europe/Dublin': 'IE',
  'Europe/Athens': 'GR', 'Europe/Helsinki': 'FI', 'America/New_York': 'US', 'America/Chicago': 'US',
  'America/Denver': 'US', 'America/Los_Angeles': 'US', 'America/Phoenix': 'US', 'America/Toronto': 'CA',
  'America/Vancouver': 'CA', 'America/Mexico_City': 'MX', 'America/Sao_Paulo': 'BR', 'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU', 'Australia/Perth': 'AU', 'Pacific/Auckland': 'NZ',
  'Africa/Johannesburg': 'ZA', 'Africa/Nairobi': 'KE',
}

/**
 * Default Trip currency: the device timezone's country first (Asia/Kolkata -> INR),
 * then the first browser language that names a region (en-GB -> GBP), else INR.
 */
export function defaultTripCurrency(languages: readonly string[], timeZone?: string): string {
  const zoneCurrency = timeZone ? regionCurrency[timezoneRegion[timeZone] ?? ''] : undefined
  if (zoneCurrency && TRIP_CURRENCIES.includes(zoneCurrency)) return zoneCurrency
  for (const tag of languages) {
    try {
      const region = new Intl.Locale(tag).region
      const currency = region ? regionCurrency[region] : undefined
      if (currency && TRIP_CURRENCIES.includes(currency)) return currency
    } catch { /* ignore malformed language tags */ }
  }
  return 'INR'
}

/** "Indonesian Rupiah" for IDR; the code itself if the browser has no name. */
export function currencyName(code: string, locale?: string): string {
  try {
    return new Intl.DisplayNames(locale ? [locale] : undefined, { type: 'currency' }).of(code) ?? code
  } catch {
    return code
  }
}

/** The Trip currency first, then each extra currency once. */
export function displayCurrencySet(accountingCurrency: string, extras: readonly string[]): string[] {
  const set = accountingCurrency ? [accountingCurrency] : []
  for (const code of extras) if (code && !set.includes(code)) set.push(code)
  return set
}

/** "Nov 1 – 7, 2026" in the reader's locale, from two calendar dates. */
export function formatTripDates(startDate: string, endDate: string): string {
  const toDate = (value: string) => new Date(`${value}T00:00:00Z`)
  const format = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  try {
    const ranged = format as Intl.DateTimeFormat & { formatRange?: (start: Date, end: Date) => string }
    if (typeof ranged.formatRange === 'function') return ranged.formatRange(toDate(startDate), toDate(endDate))
    return `${format.format(toDate(startDate))} – ${format.format(toDate(endDate))}`
  } catch {
    return `${startDate} – ${endDate}`
  }
}

export function validateBootstrapForm(values: BootstrapFormValues): BootstrapFormErrors {
  const errors: BootstrapFormErrors = {}
  const timezone = values.timezone.trim()
  const accountingCurrency = values.accountingCurrency.trim().toUpperCase()
  const displayCurrencies = values.displayCurrencies.map((code) => code.trim().toUpperCase())

  if (!values.tripName.trim()) errors.tripName = 'Enter a trip name.'
  if (!values.destination.trim()) errors.destination = 'Enter a destination.'
  if (!values.startDate) errors.startDate = 'Choose a start date.'
  if (!values.endDate) errors.endDate = 'Choose an end date.'
  if (values.startDate && values.endDate && values.endDate < values.startDate) errors.endDate = 'End date must be on or after the start date.'
  if (!timezone) errors.timezone = 'Choose a timezone.'
  else if (!isUsableTimezone(timezone)) errors.timezone = 'Choose a timezone from the list.'
  if (!accountingCurrency) errors.accountingCurrency = 'Choose a Trip currency.'
  else if (!currencyPattern.test(accountingCurrency)) errors.accountingCurrency = 'Choose a currency from the list.'
  if (!displayCurrencies.length) errors.displayCurrencies = 'Choose at least one currency.'
  else if (displayCurrencies.some((code) => !currencyPattern.test(code))) errors.displayCurrencies = 'Choose currencies from the list.'
  else if (new Set(displayCurrencies).size !== displayCurrencies.length) errors.displayCurrencies = 'Each currency can appear only once.'
  else if (accountingCurrency && !errors.accountingCurrency && !displayCurrencies.includes(accountingCurrency)) {
    errors.displayCurrencies = 'Include the Trip currency.'
  }

  return errors
}
