// Exact money math for the Split tab. Amounts are bigint counts of a currency's
// minor units (paise, cents, yen); decimal strings cross the API. No floats.

/**
 * ISO 4217 minor units (List One, 2026-01-01). Every code not listed uses 2,
 * including fund and metal codes whose ISO minor unit is "N.A.". Mirrors
 * trip_private.split_currency_minor_units in migration 040.
 */
export const MINOR_UNIT_EXCEPTIONS: Readonly<Record<0 | 3 | 4, readonly string[]>> = {
  0: ['BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW', 'PYG', 'RWF', 'UGX', 'UYI', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'],
  3: ['BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND'],
  4: ['CLF', 'UYW'],
}

/** Decimal places stored for an FX rate (1 original unit = rate accounting units). */
export const RATE_DECIMALS = 12

export function minorUnits(currency: string): number {
  const code = currency.toUpperCase()
  if (MINOR_UNIT_EXCEPTIONS[0].includes(code)) return 0
  if (MINOR_UNIT_EXCEPTIONS[3].includes(code)) return 3
  if (MINOR_UNIT_EXCEPTIONS[4].includes(code)) return 4
  return 2
}

const pow10 = (exponent: number): bigint => 10n ** BigInt(exponent)

/**
 * Parse a non-negative decimal with a dot separator ("1234.5", "1 234.50")
 * into minor units. Commas are rejected: "12,50" and "1,250" are ambiguous.
 * Returns null when it is not a number or has more decimals than allowed.
 */
export function parseAmount(input: string, decimals: number): bigint | null {
  const value = input.trim().replace(/[\s_]/gu, '')
  const match = /^(\d+)(?:\.(\d*))?$/u.exec(value) ?? /^()\.(\d+)$/u.exec(value)
  if (!match) return null
  const [, whole, fraction = ''] = match
  if (fraction.length > decimals) return null
  return BigInt(whole || '0') * pow10(decimals) + BigInt(fraction.padEnd(decimals, '0') || '0')
}

/** Minor units as a plain decimal string with exactly `decimals` places: 1234.50. */
export function toDecimalString(minor: bigint, decimals: number): string {
  const negative = minor < 0n
  const digits = (negative ? -minor : minor).toString().padStart(decimals + 1, '0')
  const whole = decimals ? digits.slice(0, -decimals) : digits
  const fraction = decimals ? `.${digits.slice(-decimals)}` : ''
  return `${negative ? '-' : ''}${whole}${fraction}`
}

/** Locale money text in a currency, e.g. ₹1,234.50. Display only. */
export function formatMoney(minor: bigint, currency: string, locale?: string): string {
  const decimals = minorUnits(currency)
  const text = toDecimalString(minor, decimals)
  try {
    // Values stay below 10^12 major units, so the Number is exact to the cent here.
    return new Intl.NumberFormat(locale, {
      style: 'currency', currency, minimumFractionDigits: decimals, maximumFractionDigits: decimals,
    }).format(Number(text))
  } catch {
    return `${currency} ${text}`
  }
}

/** A rational FX rate: rate = units / 10^RATE_DECIMALS. */
function rateUnits(rate: string): bigint | null {
  return parseAmount(rate, RATE_DECIMALS)
}

/**
 * Normalise a typed rate ("83.10", "0.0053") to the stored form with at most
 * 12 decimals and no padding zeros. Null when not a positive decimal.
 */
export function parseRate(input: string): string | null {
  const units = rateUnits(input)
  if (units === null || units <= 0n || units >= pow10(9 + RATE_DECIMALS)) return null
  return toDecimalString(units, RATE_DECIMALS).replace(/\.?0+$/u, '')
}

/** A float rate from a reference API, rounded to 12 decimals. */
export function rateFromNumber(value: number): string | null {
  if (!Number.isFinite(value) || value <= 0 || value >= 1e9) return null
  return parseRate(value.toFixed(RATE_DECIMALS))
}

/** Divide non-negative `numerator` by `denominator`, rounding half up. */
function divideHalfUp(numerator: bigint, denominator: bigint): bigint {
  return (numerator * 2n + denominator) / (denominator * 2n)
}

/**
 * Convert original minor units to accounting minor units: original x rate,
 * rounded half away from zero (amounts are positive) to the accounting
 * currency's minor unit. Matches PostgreSQL round(numeric, n).
 */
export function convertAmount(originalMinor: bigint, originalCurrency: string, rate: string, accountingCurrency: string): bigint {
  const units = rateUnits(rate)
  if (units === null) throw new Error('invalid_rate')
  const exponent = minorUnits(originalCurrency) + RATE_DECIMALS - minorUnits(accountingCurrency)
  return divideHalfUp(originalMinor * units, pow10(exponent))
}

export interface MoneyLine {
  memberId: string
  amount: bigint
}

/** Stable person order for remainders: group_members.id ascending (lowercase UUID text). */
export function byMemberId(left: string, right: string): number {
  const a = left.toLowerCase()
  const b = right.toLowerCase()
  return a < b ? -1 : a > b ? 1 : 0
}

/**
 * Equal split: everyone gets floor(total / n) minor units and the leftover
 * total mod n units go one each to the first people by member id. 100.00 / 3
 * gives 33.34, 33.33, 33.33. Lines are returned in member id order.
 */
export function equalSplit(totalMinor: bigint, memberIds: readonly string[]): MoneyLine[] {
  const people = [...new Set(memberIds)].sort(byMemberId)
  if (!people.length) return []
  const count = BigInt(people.length)
  const base = totalMinor / count
  const extra = totalMinor % count
  return people.map((memberId, index) => ({ memberId, amount: base + (BigInt(index) < extra ? 1n : 0n) }))
}

/**
 * Split `totalMinor` in proportion to integer weights (largest remainder):
 * each gets floor(total x weight / sum); leftover units go to the largest
 * remainders, ties by member id. Used to carry original-currency payer and
 * share amounts into the accounting currency so they still sum exactly.
 */
export function allocateProportionally(totalMinor: bigint, weights: readonly MoneyLine[]): MoneyLine[] {
  const sum = weights.reduce((total, line) => total + line.amount, 0n)
  if (sum <= 0n) return []
  const parts = weights.map((line) => ({
    memberId: line.memberId,
    amount: (totalMinor * line.amount) / sum,
    remainder: (totalMinor * line.amount) % sum,
  }))
  let leftover = totalMinor - parts.reduce((total, part) => total + part.amount, 0n)
  const order = [...parts].sort((a, b) => (a.remainder === b.remainder ? byMemberId(a.memberId, b.memberId) : a.remainder > b.remainder ? -1 : 1))
  for (const part of order) {
    if (leftover <= 0n) break
    part.amount += 1n
    leftover -= 1n
  }
  return parts.map(({ memberId, amount }) => ({ memberId, amount })).sort((a, b) => byMemberId(a.memberId, b.memberId))
}

export const sumLines = (lines: readonly MoneyLine[]): bigint => lines.reduce((total, line) => total + line.amount, 0n)

/** Percent inputs have at most 2 decimals; they are handled as basis points (1% = 100). */
export const PERCENT_DECIMALS = 2
export const FULL_PERCENT = 10000n
/** Shares are whole numbers from 1 to this; mirrors trip_private.split_parse_weight (migration 042). */
export const MAX_SHARE_WEIGHT = 1000n

/** A percent (0 to 100, at most 2 decimals) as basis points: "33.33" -> 3333. Null when invalid. */
export function parsePercent(input: string): bigint | null {
  const value = input.trim()
  if (!/^\d{0,3}(?:\.\d{0,2})?$/u.test(value) || !/\d/u.test(value)) return null
  const units = parseAmount(value, PERCENT_DECIMALS)
  return units !== null && units <= FULL_PERCENT ? units : null
}

/** Basis points as a short percent string without padding zeros: 7000 -> "70", 1250 -> "12.5". */
export function formatPercent(basisPoints: bigint): string {
  return toDecimalString(basisPoints, PERCENT_DECIMALS).replace(/\.?0+$/u, '')
}

/** A whole number of shares from 0 to MAX_SHARE_WEIGHT. Null when invalid. */
export function parseShareWeight(input: string): bigint | null {
  const value = input.trim()
  if (!/^\d{1,4}$/u.test(value)) return null
  const weight = BigInt(value)
  return weight <= MAX_SHARE_WEIGHT ? weight : null
}

export interface WeightLine {
  memberId: string
  /** Basis points for a percent split, a whole number of shares for a shares split. */
  weight: bigint
}

/**
 * Percent and shares splits: `totalMinor` in proportion to positive integer
 * weights by largest remainder. Everyone gets floor(T x w / W); the leftover
 * T - sum(floor) minor units go one each to the largest remainders
 * (T x w mod W), ties to the lower group_members.id. Every weighted person gets
 * a line (possibly zero), so the lines always sum exactly to the total.
 * 100.00 at 1:1:1 -> 33.34, 33.33, 33.33. Mirrors
 * trip_private.split_weighted_amounts in migration 042.
 */
export function weightedSplit(totalMinor: bigint, weights: readonly WeightLine[]): MoneyLine[] {
  return allocateProportionally(totalMinor, weights.map((line) => ({ memberId: line.memberId, amount: line.weight })))
}
