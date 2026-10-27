import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  FALLBACK_TIMEZONES, LEGACY_TIMEZONES, TRIP_CURRENCIES, canonicalTimezone, currencyName, defaultTripCurrency,
  displayCurrencySet, formatTripDates, supportedTimezones, timezoneLabel, timezoneOffset, validateBootstrapForm,
  type BootstrapFormValues,
} from '../../src/features/onboarding/tripSettings.ts'

const serverTimezones = new Set([...readFileSync('supabase/migrations/011_ir002_timezone_reference.sql', 'utf8')
  .matchAll(/\('([A-Za-z0-9_+\-/]+)'\)/g)].map((match) => match[1]))
const serverCurrencies = new Set([...readFileSync('supabase/migrations/007_ir002_configuration_archive_audit.sql', 'utf8')
  .matchAll(/\('([A-Z]{3})'\)/g)].map((match) => match[1]))

const valid: BootstrapFormValues = {
  tripName: 'Northern lights', destination: 'Tromsø', startDate: '2027-01-11', endDate: '2027-01-18',
  timezone: 'Europe/Oslo', accountingCurrency: 'NOK', displayCurrencies: ['NOK', 'EUR'],
}

test('every zone and currency the form can offer is accepted by the server', () => {
  assert.ok(serverTimezones.size > 500 && serverCurrencies.size > 150)
  for (const zone of [...FALLBACK_TIMEZONES, ...Object.values(LEGACY_TIMEZONES), ...supportedTimezones()]) {
    assert.ok(serverTimezones.has(zone), zone)
  }
  for (const code of TRIP_CURRENCIES) assert.ok(serverCurrencies.has(code), code)
})

test('timezones use current names, sorted, and fall back to a short list', () => {
  assert.equal(canonicalTimezone('Asia/Calcutta'), 'Asia/Kolkata')
  assert.equal(canonicalTimezone('Europe/Kiev'), 'Europe/Kyiv')
  assert.equal(canonicalTimezone('UTC'), 'Etc/UTC')
  const zones = supportedTimezones()
  assert.ok(zones.includes('Asia/Kolkata') && zones.includes('Asia/Makassar') && zones.includes('Europe/Oslo'))
  assert.ok(!zones.includes('Asia/Calcutta'))
  assert.deepEqual(zones, [...zones].sort((left, right) => left.localeCompare(right)))
  assert.deepEqual(supportedTimezones({}), [...FALLBACK_TIMEZONES].sort((left, right) => left.localeCompare(right)))
  assert.deepEqual(supportedTimezones({ supportedValuesOf: () => ['Asia/Calcutta', 'Not/AZone'] }),
    supportedTimezones({}))
})

test('timezone labels show the UTC offset', () => {
  const winter = new Date('2027-01-15T12:00:00Z')
  assert.equal(timezoneLabel('Asia/Makassar', winter), 'Asia/Makassar (UTC+08:00)')
  assert.equal(timezoneLabel('Asia/Kolkata', winter), 'Asia/Kolkata (UTC+05:30)')
  assert.equal(timezoneLabel('America/New_York', winter), 'America/New York (UTC-05:00)')
  assert.equal(timezoneOffset('Etc/UTC', winter), 'UTC+00:00')
  assert.equal(timezoneOffset('Not/AZone', winter), '')
})

test('the Trip currency defaults from the browser language region, else INR', () => {
  assert.equal(defaultTripCurrency(['en-IN']), 'INR')
  assert.equal(defaultTripCurrency(['en-US']), 'USD')
  assert.equal(defaultTripCurrency(['de-DE']), 'EUR')
  assert.equal(defaultTripCurrency(['id-ID', 'en-US']), 'IDR')
  assert.equal(defaultTripCurrency(['en', 'fr']), 'INR')
  assert.equal(defaultTripCurrency(['not a tag']), 'INR')
  assert.equal(defaultTripCurrency([]), 'INR')
  assert.equal(currencyName('IDR', 'en'), 'Indonesian Rupiah')
})

test('the display set always starts with the Trip currency and has no duplicates', () => {
  assert.deepEqual(displayCurrencySet('NOK', []), ['NOK'])
  assert.deepEqual(displayCurrencySet('NOK', ['EUR', 'NOK', 'EUR', '']), ['NOK', 'EUR'])
})

test('validation names each missing or inconsistent field in plain words', () => {
  assert.deepEqual(validateBootstrapForm(valid), {})
  assert.deepEqual(validateBootstrapForm({ ...valid, tripName: ' ', destination: '', startDate: '', endDate: '', timezone: '', accountingCurrency: '', displayCurrencies: [] }), {
    tripName: 'Enter a trip name.',
    destination: 'Enter a destination.',
    startDate: 'Choose a start date.',
    endDate: 'Choose an end date.',
    timezone: 'Choose a timezone.',
    accountingCurrency: 'Choose a Trip currency.',
    displayCurrencies: 'Choose at least one currency.',
  })
  assert.equal(validateBootstrapForm({ ...valid, endDate: '2027-01-01' }).endDate, 'End date must be on or after the start date.')
  assert.equal(validateBootstrapForm({ ...valid, timezone: 'UTC' }).timezone, 'Choose a timezone from the list.')
  assert.equal(validateBootstrapForm({ ...valid, accountingCurrency: 'KRONE' }).accountingCurrency, 'Choose a currency from the list.')
  assert.equal(validateBootstrapForm({ ...valid, displayCurrencies: ['EUR'] }).displayCurrencies, 'Include the Trip currency.')
  assert.equal(validateBootstrapForm({ ...valid, displayCurrencies: ['NOK', 'NOK'] }).displayCurrencies, 'Each currency can appear only once.')
  for (const message of Object.values(validateBootstrapForm({ ...valid, tripName: '', timezone: 'UTC', displayCurrencies: ['EUR'] }))) {
    assert.doesNotMatch(message ?? '', /IANA|ISO|accounting|Group/i)
  }
})

test('Trip dates read as one range', () => {
  assert.match(formatTripDates('2027-01-11', '2027-01-18'), /11.*18.*2027/)
})
