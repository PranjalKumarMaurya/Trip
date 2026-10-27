import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  MINOR_UNIT_EXCEPTIONS, allocateProportionally, convertAmount, equalSplit, formatMoney, minorUnits, parseAmount,
  parseRate, rateFromNumber, sumLines, toDecimalString,
} from '../../src/features/split/money.ts'

const ids = ['c-member', 'a-member', 'b-member']

test('minor units follow ISO 4217: 0, 2 (default), 3 and 4 decimals', () => {
  assert.equal(minorUnits('JPY'), 0)
  assert.equal(minorUnits('krw'), 0)
  assert.equal(minorUnits('INR'), 2)
  assert.equal(minorUnits('IDR'), 2)
  assert.equal(minorUnits('USD'), 2)
  assert.equal(minorUnits('XAU'), 2)
  for (const code of ['BHD', 'KWD', 'OMR', 'TND', 'JOD', 'IQD', 'LYD']) assert.equal(minorUnits(code), 3, code)
  assert.equal(minorUnits('CLF'), 4)
})

test('the minor-unit table matches the database function in migration 040', () => {
  const sql = readFileSync(new URL('../../supabase/migrations/040_split_ledger_tables.sql', import.meta.url), 'utf8')
  const body = sql.slice(sql.indexOf('split_currency_minor_units(p_code text)'), sql.indexOf('$$;'))
  for (const [decimals, codes] of Object.entries(MINOR_UNIT_EXCEPTIONS)) {
    const clause = new RegExp(`WHEN p_code IN \\(([^)]*)\\) THEN ${decimals}`, 'u').exec(body)
    assert.ok(clause, `missing ${decimals}-decimal clause`)
    const sqlCodes = [...clause[1].matchAll(/'([A-Z]{3})'/gu)].map((match) => match[1]).sort()
    assert.deepEqual(sqlCodes, [...codes].sort(), `${decimals}-decimal codes differ`)
  }
  assert.match(body, /ELSE 2/u)
})

test('amounts parse exactly into minor units and reject extra decimals', () => {
  assert.equal(parseAmount('100', 2), 10000n)
  assert.equal(parseAmount('100.5', 2), 10050n)
  assert.equal(parseAmount(' 1 234.56 ', 2), 123456n)
  assert.equal(parseAmount('12,50', 2), null)
  assert.equal(parseAmount('1,250', 2), null)
  assert.equal(parseAmount('.5', 2), 50n)
  assert.equal(parseAmount('0.1', 2), 10n)
  assert.equal(parseAmount('1000', 0), 1000n)
  assert.equal(parseAmount('1000.5', 0), null)
  assert.equal(parseAmount('1.0005', 3), null)
  assert.equal(parseAmount('1.234', 3), 1234n)
  assert.equal(parseAmount('33.335', 2), null)
  assert.equal(parseAmount('-1', 2), null)
  assert.equal(parseAmount('abc', 2), null)
  assert.equal(parseAmount('', 2), null)
  // 0.1 + 0.2 is exact here, unlike floats.
  assert.equal(parseAmount('0.1', 2)! + parseAmount('0.2', 2)!, parseAmount('0.3', 2))
})

test('decimal strings round-trip with the currency precision', () => {
  assert.equal(toDecimalString(3334n, 2), '33.34')
  assert.equal(toDecimalString(5n, 2), '0.05')
  assert.equal(toDecimalString(334n, 0), '334')
  assert.equal(toDecimalString(3334n, 3), '3.334')
  assert.equal(toDecimalString(-150n, 2), '-1.50')
})

test('equal split gives leftover minor units to the lowest member ids', () => {
  assert.deepEqual(equalSplit(10000n, ids), [
    { memberId: 'a-member', amount: 3334n }, { memberId: 'b-member', amount: 3333n }, { memberId: 'c-member', amount: 3333n },
  ])
  assert.deepEqual(equalSplit(10001n, ids).map((line) => line.amount), [3334n, 3334n, 3333n])
  assert.deepEqual(equalSplit(9999n, ids).map((line) => line.amount), [3333n, 3333n, 3333n])
  // JPY: 1000 / 3 with no decimals; KWD: 10.000 / 3 with three.
  assert.deepEqual(equalSplit(1000n, ids).map((line) => line.amount), [334n, 333n, 333n])
  assert.deepEqual(equalSplit(10000n, ids).map((line) => toDecimalString(line.amount, 3)), ['3.334', '3.333', '3.333'])
  assert.deepEqual(equalSplit(1n, ids).map((line) => line.amount), [1n, 0n, 0n])
  assert.deepEqual(equalSplit(500n, []), [])
  // Same answer however the people are listed.
  assert.deepEqual(equalSplit(10000n, ['b-member', 'c-member', 'a-member']), equalSplit(10000n, ids))
  assert.equal(sumLines(equalSplit(123457n, ['x', 'y', 'z', 'w', 'v', 'u', 't'])), 123457n)
})

test('uuid order is lowercase hex order, as in PostgreSQL', () => {
  const upper = 'B0000000-0000-4000-8000-000000000001'
  const lower = 'a0000000-0000-4000-8000-000000000002'
  assert.deepEqual(equalSplit(101n, [upper, lower]).map((line) => line.memberId), [lower, upper])
})

test('conversion rounds original x rate half up to the accounting minor unit', () => {
  // 12.34 USD at 83.123456 = 1025.74344704 INR -> 1025.74
  assert.equal(convertAmount(1234n, 'USD', '83.123456', 'INR'), 102574n)
  // 10.00 USD at 151.237 = 1512.37 JPY -> 1512
  assert.equal(convertAmount(1000n, 'USD', '151.237', 'JPY'), 1512n)
  // Half rounds up: 0.05 USD at 0.5 = 0.025 -> 0.03
  assert.equal(convertAmount(5n, 'USD', '0.5', 'EUR'), 3n)
  // 1,000,000 IDR at 0.0053 = 5300.00 INR
  assert.equal(convertAmount(100000000n, 'IDR', '0.0053', 'INR'), 530000n)
  // 1.000 KWD at 271.8 = 271.80 INR; 5 JPY at 0.0062 KWD = 0.031 KWD
  assert.equal(convertAmount(1000n, 'KWD', '271.8', 'INR'), 27180n)
  assert.equal(convertAmount(5n, 'JPY', '0.0062', 'KWD'), 31n)
  assert.throws(() => convertAmount(1n, 'USD', 'x', 'INR'))
})

test('rates normalise to at most 12 decimals', () => {
  assert.equal(parseRate('83.10'), '83.1')
  assert.equal(parseRate('0.0053'), '0.0053')
  assert.equal(parseRate('100'), '100')
  assert.equal(parseRate('0'), null)
  assert.equal(parseRate('-1'), null)
  assert.equal(parseRate('1.0000000000001'), null)
  assert.equal(parseRate('1000000000'), null)
  assert.equal(rateFromNumber(83.123456), '83.123456')
  assert.equal(rateFromNumber(0.0000194), '0.0000194')
  assert.equal(rateFromNumber(1 / 3), '0.333333333333')
  assert.equal(rateFromNumber(0), null)
  assert.equal(rateFromNumber(Number.NaN), null)
})

test('proportional allocation sums exactly, remainders to the largest fractions', () => {
  // 60/40 USD of a 1025.74 INR total.
  const lines = allocateProportionally(102574n, [{ memberId: 'b', amount: 600n }, { memberId: 'a', amount: 400n }])
  assert.deepEqual(lines, [{ memberId: 'a', amount: 41030n }, { memberId: 'b', amount: 61544n }])
  assert.equal(sumLines(lines), 102574n)
  // Three equal weights of 100.00: the leftover goes by member id.
  assert.deepEqual(allocateProportionally(10000n, [{ memberId: 'c', amount: 1n }, { memberId: 'a', amount: 1n }, { memberId: 'b', amount: 1n }])
    .map((line) => line.amount), [3334n, 3333n, 3333n])
  assert.deepEqual(allocateProportionally(100n, []), [])
})

test('money formats in the accounting currency', () => {
  assert.equal(formatMoney(15000n, 'INR', 'en-US'), '₹150.00')
  assert.equal(formatMoney(1512n, 'JPY', 'en-US'), '¥1,512')
  assert.equal(formatMoney(3334n, 'KWD', 'en-US').replace(/\s/gu, ' '), 'KWD 3.334')
})
