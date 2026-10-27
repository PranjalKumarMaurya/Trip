import assert from 'node:assert/strict'
import test from 'node:test'

import { showsBaliGuide } from '../../src/features/fx/baliPriceGuide.ts'
import {
  chooseCounterCurrency, fetchLiveRates, formatInputAmount, formatMoney, parseAmount, parseRatesResponse, quickAmounts,
  rateBetween, ratesCacheKey, ratesUrl, readCachedRates, writeCachedRates,
} from '../../src/features/fx/fxRates.ts'

const response = {
  result: 'success', base_code: 'INR', time_last_update_unix: 1793145600,
  rates: { INR: 1, IDR: 188.5, USD: 0.0119, EUR: 0.011, BAD: -1, xx: 3, NAN: 'x' },
}
const now = 1793150000000

function memoryStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed))
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value) },
  }
}

test('provider responses are validated and junk rates dropped', () => {
  const table = parseRatesResponse(response, 'INR', now)
  assert.ok(table)
  assert.deepEqual(Object.keys(table.rates).sort(), ['EUR', 'IDR', 'INR', 'USD'])
  assert.equal(table.providerUpdatedAt, 1793145600000)
  assert.equal(table.fetchedAt, now)
  assert.equal(parseRatesResponse({ ...response, result: 'error' }, 'INR', now), null)
  assert.equal(parseRatesResponse({ ...response, base_code: 'USD' }, 'INR', now), null, 'base mismatch')
  assert.equal(parseRatesResponse({ ...response, rates: { IDR: 188 } }, 'INR', now), null, 'base missing')
  assert.equal(parseRatesResponse('nope', 'INR', now), null)
})

test('conversion works in both directions and across the base', () => {
  const table = parseRatesResponse(response, 'INR', now)
  assert.equal(rateBetween(table, 'INR', 'IDR'), 188.5)
  assert.equal(rateBetween(table, 'IDR', 'INR'), 1 / 188.5)
  assert.ok(Math.abs((rateBetween(table, 'USD', 'IDR') ?? 0) - 188.5 / 0.0119) < 1e-6)
  assert.equal(rateBetween(table, 'INR', 'GBP'), null)
  assert.equal(rateBetween(null, 'INR', 'IDR'), null)
  assert.equal(formatInputAmount(1000 * 188.5, 'IDR'), '188500')
  assert.equal(formatInputAmount(100000 / 188.5, 'INR'), '530.5')
  assert.equal(formatInputAmount(12.3456, 'USD'), '12.35')
  assert.equal(formatInputAmount(5, 'JPY'), '5')
})

test('typed amounts are parsed leniently but never negative', () => {
  assert.equal(parseAmount('1,250.50'), 1250.5)
  assert.equal(parseAmount(' 1 000 '), 1000)
  assert.equal(parseAmount('.5'), 0.5)
  assert.equal(parseAmount('-5'), null)
  assert.equal(parseAmount('12abc'), null)
  assert.equal(parseAmount(''), null)
})

test('rates are fetched from the provider for the accounting currency', async () => {
  const urls: string[] = []
  const fetchImpl = (async (url: string) => {
    urls.push(url)
    return new Response(JSON.stringify(response), { status: 200 })
  }) as unknown as typeof fetch
  const table = await fetchLiveRates('INR', { fetchImpl, now: () => now })
  assert.deepEqual(urls, ['https://open.er-api.com/v6/latest/INR'])
  assert.equal(table.rates.IDR, 188.5)
  assert.equal(ratesUrl('USD'), 'https://open.er-api.com/v6/latest/USD')
  const offline = (async () => { throw new TypeError('Failed to fetch') }) as unknown as typeof fetch
  await assert.rejects(fetchLiveRates('INR', { fetchImpl: offline }), /rates_unavailable/u)
  const serverError = (async () => new Response('busy', { status: 503 })) as unknown as typeof fetch
  await assert.rejects(fetchLiveRates('INR', { fetchImpl: serverError }), /rates_unavailable/u)
  await assert.rejects(fetchLiveRates('inr', { fetchImpl }), /invalid_currency/u)
})

test('last good rates are cached per base and survive broken storage', () => {
  const table = parseRatesResponse(response, 'INR', now)
  assert.ok(table)
  const storage = memoryStorage()
  assert.equal(writeCachedRates(storage, table), true)
  assert.ok(storage.data.has(ratesCacheKey('INR')))
  assert.deepEqual(readCachedRates(storage, 'INR'), table)
  assert.equal(readCachedRates(storage, 'USD'), null)
  assert.equal(readCachedRates(memoryStorage({ [ratesCacheKey('INR')]: '{not json' }), 'INR'), null)
  assert.equal(readCachedRates(memoryStorage({ [ratesCacheKey('INR')]: JSON.stringify({ ...table, rates: { IDR: 1 } }) }), 'INR'), null)
  const throwing = {
    getItem: () => { throw new Error('SecurityError') },
    setItem: () => { throw new Error('QuotaExceededError') },
  }
  assert.equal(readCachedRates(throwing, 'INR'), null)
  assert.equal(writeCachedRates(throwing, table), false)
  assert.equal(readCachedRates(null, 'INR'), null)
})

test('the counter currency prefers a remembered pick, then Trip display currencies', () => {
  const available = ['INR', 'IDR', 'USD', 'EUR']
  assert.equal(chooseCounterCurrency({ accounting: 'INR', remembered: 'EUR', displayCurrencies: ['IDR'], available }), 'EUR')
  assert.equal(chooseCounterCurrency({ accounting: 'INR', remembered: 'GBP', displayCurrencies: ['INR', 'IDR'], available }), 'IDR')
  assert.equal(chooseCounterCurrency({ accounting: 'INR', destination: 'Ubud, Bali', available }), 'IDR')
  assert.equal(chooseCounterCurrency({ accounting: 'INR', destination: 'Goa', available }), 'USD')
  assert.equal(chooseCounterCurrency({ accounting: 'USD', available: null }), 'EUR')
  assert.equal(chooseCounterCurrency({ accounting: 'INR', remembered: 'INR' }), 'USD')
})

test('quick amounts are round numbers sized to the currency', () => {
  const table = parseRatesResponse({ result: 'success', base_code: 'USD', rates: { USD: 1, INR: 83, IDR: 15800 } }, 'USD', now)
  assert.deepEqual(quickAmounts('USD', table), [5, 10, 20, 50, 100, 200])
  assert.deepEqual(quickAmounts('INR', table), [500, 1000, 2000, 5000, 10000, 20000])
  assert.ok(quickAmounts('IDR', table).every((value) => value >= 50000 && /^[125]0+$/u.test(String(value))))
  assert.deepEqual(quickAmounts('INR', null), [10, 50, 100, 500, 1000])
})

test('money formatting and the Bali guide switch', () => {
  assert.match(formatMoney(55000, 'IDR', 'en-US'), /^IDR\s?55,000$/u)
  assert.equal(formatMoney(12.5, 'USD', 'en-US'), '$12.5')
  assert.equal(showsBaliGuide('Seminyak, Bali'), true)
  assert.equal(showsBaliGuide('BALI'), true)
  assert.equal(showsBaliGuide('Goa'), false)
  assert.equal(showsBaliGuide('Balikpapan'), false)
})
