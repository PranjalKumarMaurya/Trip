// Live reference rate, captured once when an expense is entered. The stored
// snapshot is never refreshed afterwards.
import { rateFromNumber } from './money.ts'

export const LIVE_RATE_SOURCE = 'open.er-api.com'

export interface LiveRate {
  rate: string
  asOf: string | null
}

type FetchLike = (url: string) => Promise<{ ok: boolean; json: () => Promise<unknown> }>

/** How many `quote` units one `base` unit buys, rounded to 12 decimals. */
export async function fetchLiveRate(base: string, quote: string, fetchImpl: FetchLike = (url) => fetch(url)): Promise<LiveRate> {
  if (!/^[A-Z]{3}$/u.test(base) || !/^[A-Z]{3}$/u.test(quote)) throw new Error('rate_unavailable')
  const response = await fetchImpl(`https://open.er-api.com/v6/latest/${base}`)
  if (!response.ok) throw new Error('rate_unavailable')
  const body = await response.json()
  if (typeof body !== 'object' || body === null) throw new Error('rate_unavailable')
  const { result, rates, time_last_update_utc: asOf } = body as { result?: unknown; rates?: Record<string, unknown>; time_last_update_utc?: unknown }
  const value = rates?.[quote]
  const rate = result === 'success' && typeof value === 'number' ? rateFromNumber(value) : null
  if (!rate) throw new Error('rate_unavailable')
  return { rate, asOf: typeof asOf === 'string' ? asOf : null }
}
