import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { draftFromExpense, emptyDraft, evaluateDraft, switchSplitMode, type ExpenseDraft } from '../../src/features/split/expenseDraft.ts'
import { followsSplitRule, parseLedger } from '../../src/features/split/ledger.ts'
import {
  formatPercent, parsePercent, parseShareWeight, sumLines, toDecimalString, weightedSplit, type WeightLine,
} from '../../src/features/split/money.ts'
import { splitErrorMessage } from '../../src/features/split/splitErrors.ts'

const [ana, ben, cara, dev] = ['a1000000-0000-4000-8000-000000000000', 'b2000000-0000-4000-8000-000000000000', 'c3000000-0000-4000-8000-000000000000', 'd4000000-0000-4000-8000-000000000000']
const inr = { accountingCurrency: 'INR', memberIds: [cara, ana, ben] }
const draft = (changes: Partial<ExpenseDraft>, context = inr): ExpenseDraft => ({ ...emptyDraft(context, ana), description: 'Dinner', ...changes })
const weights = (entries: [string, bigint][]): WeightLine[] => entries.map(([memberId, weight]) => ({ memberId, weight }))
const amounts = (lines: { amount: bigint }[]) => lines.map((line) => line.amount)

test('percents parse to basis points: at most 2 decimals, 0 to 100', () => {
  assert.equal(parsePercent('70'), 7000n)
  assert.equal(parsePercent('33.33'), 3333n)
  assert.equal(parsePercent(' 12.5 '), 1250n)
  assert.equal(parsePercent('.5'), 50n)
  assert.equal(parsePercent('100'), 10000n)
  assert.equal(parsePercent('100.00'), 10000n)
  assert.equal(parsePercent('0'), 0n)
  for (const bad of ['100.01', '150', '1000', '33.333', '-5', '5%', '1,5', 'abc', '', '.']) assert.equal(parsePercent(bad), null, bad)
  assert.equal(formatPercent(7000n), '70')
  assert.equal(formatPercent(1250n), '12.5')
  assert.equal(formatPercent(3333n), '33.33')
  assert.equal(formatPercent(5n), '0.05')
})

test('shares are whole numbers up to 1000', () => {
  assert.equal(parseShareWeight('2'), 2n)
  assert.equal(parseShareWeight(' 1 '), 1n)
  assert.equal(parseShareWeight('0'), 0n)
  assert.equal(parseShareWeight('1000'), 1000n)
  for (const bad of ['1001', '1.5', '2.0', '-1', 'two', '', '1e2']) assert.equal(parseShareWeight(bad), null, bad)
})

test('weighted split sums exactly; leftovers go to the largest remainders, then the lowest member id', () => {
  // 900.00 at 70/20/10 %.
  assert.deepEqual(amounts(weightedSplit(90000n, weights([[cara, 1000n], [ana, 7000n], [ben, 2000n]]))), [63000n, 18000n, 9000n])
  // 100.00 at 1:1:1 shares: one extra paisa to the lowest id, whatever the input order.
  assert.deepEqual(weightedSplit(10000n, weights([[cara, 1n], [ben, 1n], [ana, 1n]])), [
    { memberId: ana, amount: 3334n }, { memberId: ben, amount: 3333n }, { memberId: cara, amount: 3333n },
  ])
  // 10.00 at 33.33/33.33/33.34 %: the larger remainder beats a lower id.
  assert.deepEqual(amounts(weightedSplit(1000n, weights([[ana, 3333n], [ben, 3333n], [cara, 3334n]]))), [333n, 333n, 334n])
  // 0.05 at 50/50: a true tie goes to the lowest id.
  assert.deepEqual(amounts(weightedSplit(5n, weights([[dev, 5000n], [ana, 5000n]]))), [3n, 2n])
  // A couple counts double: 4500.00 at 2:1:1:1.
  assert.deepEqual(amounts(weightedSplit(450000n, weights([[ana, 2n], [ben, 1n], [cara, 1n], [dev, 1n]]))), [180000n, 90000n, 90000n, 90000n])
  // Shares can round to zero but still get a line.
  assert.deepEqual(amounts(weightedSplit(1n, weights([[ana, 1n], [ben, 1n]]))), [1n, 0n])
  // Large awkward totals still sum exactly.
  const lines = weightedSplit(123456789n, weights([[ana, 7n], [ben, 3n], [cara, 11n], [dev, 997n]]))
  assert.equal(sumLines(lines), 123456789n)
  assert.deepEqual(weightedSplit(100n, []), [])
})

test('weighted split in 0-, 2- and 3-decimal currencies', () => {
  // JPY 1000 at 2:1 -> 666 r2, 333 r1 -> 667, 333.
  assert.deepEqual(amounts(weightedSplit(1000n, weights([[ana, 2n], [ben, 1n]]))), [667n, 333n])
  // JPY 1000 at 33.33/33.33/33.34 % -> 333, 333, 334.
  assert.deepEqual(amounts(weightedSplit(1000n, weights([[ana, 3333n], [ben, 3333n], [cara, 3334n]]))), [333n, 333n, 334n])
  // INR 300.00 at 66.67/33.33 % -> 200.01, 99.99.
  assert.deepEqual(weightedSplit(30000n, weights([[ana, 6667n], [ben, 3333n]])).map((line) => toDecimalString(line.amount, 2)), ['200.01', '99.99'])
  // KWD 10.000 at 1:1:1 -> 3.334, 3.333, 3.333; KWD 1.000 at 66.67/33.33 % -> 0.667, 0.333.
  assert.deepEqual(weightedSplit(10000n, weights([[ana, 1n], [ben, 1n], [cara, 1n]])).map((line) => toDecimalString(line.amount, 3)), ['3.334', '3.333', '3.333'])
  assert.deepEqual(weightedSplit(1000n, weights([[ana, 6667n], [ben, 3333n]])).map((line) => toDecimalString(line.amount, 3)), ['0.667', '0.333'])
})

test('the rule and the method list match migration 042', () => {
  const sql = readFileSync(new URL('../../supabase/migrations/042_split_percent_shares.sql', import.meta.url), 'utf8')
  assert.match(sql, /split_method IN \('equal', 'exact', 'percent', 'shares'\)/u)
  assert.match(sql, /ORDER BY part\.remainder DESC, part\.id/u)
  assert.match(sql, /v_weight < 1 OR v_weight > 1000/u)
})

test('percent draft: live check, exact rows with their percents, and errors', () => {
  const partial = evaluateDraft(draft({ amount: '900', splitMode: 'percent', sharePercents: { [ana]: '30' } }), inr)
  assert.deepEqual(partial.percentCheck, { entered: 3000n, required: 10000n, matches: false })
  assert.equal(partial.errors.shares, 'Percents must add up to 100%.')
  assert.equal(partial.request, null)
  const over = evaluateDraft(draft({ amount: '900', splitMode: 'percent', sharePercents: { [ana]: '70', [ben]: '40' } }), inr)
  assert.equal(over.percentCheck?.entered, 11000n)
  const ok = evaluateDraft(draft({ amount: '900', splitMode: 'percent', sharePercents: { [ana]: '70', [ben]: '20', [cara]: '10', [dev]: '50' } }), inr)
  assert.deepEqual(ok.errors, {})
  assert.equal(ok.request?.splitMethod, 'percent')
  // Only current members count; rows go out in member id order with the percent typed.
  assert.deepEqual(ok.request?.shares, [
    { member_id: ana, amount: '630.00', weight: '70' }, { member_id: ben, amount: '180.00', weight: '20' }, { member_id: cara, amount: '90.00', weight: '10' },
  ])
  // Blank and zero leave a person out.
  const two = evaluateDraft(draft({ amount: '0.05', splitMode: 'percent', sharePercents: { [ana]: '50', [ben]: '0', [cara]: '50.00' } }), inr)
  assert.deepEqual(two.request?.shares, [{ member_id: ana, amount: '0.03', weight: '50' }, { member_id: cara, amount: '0.02', weight: '50' }])
  assert.equal(evaluateDraft(draft({ amount: '900', splitMode: 'percent', sharePercents: { [ana]: '33.333' } }), inr).errors.shares,
    'Use percents from 0 to 100 with at most 2 decimal places, like 33.33.')
  assert.equal(evaluateDraft(draft({ amount: '900', splitMode: 'percent', sharePercents: {} }), inr).errors.shares,
    'Enter each person’s percent, or split equally.')
})

test('shares draft: whole numbers, total share count, and exact rows', () => {
  const result = evaluateDraft(draft({ amount: '4500', splitMode: 'shares', shareWeights: { [ana]: '2', [ben]: '1', [cara]: '2' } }), inr)
  assert.deepEqual(result.errors, {})
  assert.equal(result.shareCount, 5n)
  assert.deepEqual(result.request?.shares, [
    { member_id: ana, amount: '1800.00', weight: '2' }, { member_id: ben, amount: '900.00', weight: '1' }, { member_id: cara, amount: '1800.00', weight: '2' },
  ])
  assert.equal(evaluateDraft(draft({ amount: '10', splitMode: 'shares', shareWeights: { [ana]: '1.5' } }), inr).errors.shares,
    'Use whole numbers of shares from 0 to 1000, like 1 or 2.')
  assert.equal(evaluateDraft(draft({ amount: '10', splitMode: 'shares', shareWeights: { [ana]: '0', [ben]: '' } }), inr).errors.shares,
    'Give at least one person a share, or split equally.')
  // Yen: no decimals.
  const yen = { accountingCurrency: 'JPY', memberIds: [ana, ben] }
  const yenResult = evaluateDraft(draft({ amount: '1000', currency: 'JPY', splitMode: 'shares', shareWeights: { [ana]: '2', [ben]: '1' } }, yen), yen)
  assert.deepEqual(yenResult.request?.shares.map((share) => share.amount), ['667', '333'])
})

test('a converted expense applies percents and shares to the accounting total', () => {
  // 12.34 USD at 83.123456 = 1025.74 INR, 2:1 shares -> 683.83, 341.91.
  const result = evaluateDraft(draft({ amount: '12.34', currency: 'USD', rate: '83.123456', splitMode: 'shares', shareWeights: { [ana]: '2', [ben]: '1' } }), inr)
  assert.deepEqual(result.request?.shares, [{ member_id: ana, amount: '683.83', weight: '2' }, { member_id: ben, amount: '341.91', weight: '1' }])
  assert.equal(result.request?.originalAmount, '12.34')
})

test('switching to shares starts the equal-split people at 1 share; other inputs are kept', () => {
  const base = draft({ amount: '100', included: [ana, ben] })
  const shares = switchSplitMode(base, 'shares')
  assert.deepEqual(shares.shareWeights, { [ana]: '1', [ben]: '1' })
  const typed = switchSplitMode({ ...shares, shareWeights: { [ana]: '3' } }, 'percent')
  assert.equal(typed.splitMode, 'percent')
  assert.deepEqual(switchSplitMode(typed, 'shares').shareWeights, { [ana]: '3' })
  assert.deepEqual(switchSplitMode(base, 'percent').sharePercents, {})
})

test('editing restores the percent or shares inputs and saves the same rows', () => {
  const ledger = parseLedger({
    accounting_currency: 'INR',
    expenses: [
      {
        id: 'p1', description: 'Dinner', category: null, original_amount: '900.00', original_currency: 'INR', accounting_amount: '900.00',
        accounting_currency: 'INR', fx_rate: null, fx_source: null, fx_captured_at: null, split_method: 'percent', created_by: ana,
        version: 2, created_at: '', updated_at: '', payers: [{ member_id: ana, amount: '900.00' }],
        shares: [{ member_id: ana, amount: '630.00', weight: '70' }, { member_id: ben, amount: '180.00', weight: '20.00' }, { member_id: cara, amount: '90.00', weight: '10' }],
      },
      {
        id: 's1', description: 'Villa', category: 'stay', original_amount: '4500.00', original_currency: 'INR', accounting_amount: '4500.00',
        accounting_currency: 'INR', fx_rate: null, fx_source: null, fx_captured_at: null, split_method: 'shares', created_by: ana,
        version: 1, created_at: '', updated_at: '', payers: [{ member_id: ben, amount: '4500.00' }],
        shares: [{ member_id: ana, amount: '1800.00', weight: '2' }, { member_id: ben, amount: '2700.00', weight: '3' }],
      },
    ],
    settlements: [],
  })
  assert.deepEqual(ledger.heldOut, [])
  const [percentExpense, sharesExpense] = ledger.expenses
  assert.equal(followsSplitRule(percentExpense), true)
  assert.equal(followsSplitRule(sharesExpense), true)
  const percentDraft = draftFromExpense(percentExpense, inr)
  assert.equal(percentDraft.splitMode, 'percent')
  assert.deepEqual(percentDraft.sharePercents, { [ana]: '70', [ben]: '20', [cara]: '10' })
  assert.deepEqual(evaluateDraft(percentDraft, inr).request?.shares.map((share) => [share.amount, share.weight]),
    [['630.00', '70'], ['180.00', '20'], ['90.00', '10']])
  const sharesDraft = draftFromExpense(sharesExpense, inr)
  assert.equal(sharesDraft.splitMode, 'shares')
  assert.deepEqual(sharesDraft.shareWeights, { [ana]: '2', [ben]: '3' })
  assert.deepEqual(sharesDraft.included, [ana, ben])
  assert.deepEqual(evaluateDraft(sharesDraft, inr).request?.shares.map((share) => share.amount), ['1800.00', '2700.00'])
  // Switching an edited percent expense to exact amounts sends no weights.
  const exact = evaluateDraft({ ...percentDraft, splitMode: 'exact', shareAmounts: { [ana]: '900' } }, inr)
  assert.deepEqual(exact.request?.shares, [{ member_id: ana, amount: '900.00' }])
})

test('weighted expenses without valid stored inputs are held out', () => {
  const base = {
    description: 'x', category: null, original_amount: '10.00', original_currency: 'INR', accounting_amount: '10.00',
    accounting_currency: 'INR', fx_rate: null, fx_source: null, fx_captured_at: null, created_by: ana, version: 1, created_at: '', updated_at: '',
    payers: [{ member_id: ana, amount: '10.00' }],
  }
  const ledger = parseLedger({
    accounting_currency: 'INR',
    expenses: [
      { ...base, id: 'no-weight', split_method: 'shares', shares: [{ member_id: ana, amount: '10.00', weight: null }] },
      { ...base, id: 'percent-99', split_method: 'percent', shares: [{ member_id: ana, amount: '10.00', weight: '99' }] },
      { ...base, id: 'exact-weighted', split_method: 'exact', shares: [{ member_id: ana, amount: '10.00', weight: '1' }] },
      { ...base, id: 'unknown', split_method: 'ratio', shares: [{ member_id: ana, amount: '10.00' }] },
      { ...base, id: 'fine', split_method: 'shares', shares: [{ member_id: ana, amount: '5.00', weight: '1' }, { member_id: ben, amount: '5.00', weight: '1' }] },
    ],
    settlements: [],
  })
  assert.deepEqual(ledger.heldOut, ['no-weight', 'percent-99', 'exact-weighted', 'unknown'])
  assert.deepEqual(ledger.expenses.map((expense) => expense.id), ['fine'])
  assert.deepEqual(ledger.expenses[0].shares.map((share) => share.weight), [1n, 1n])
  // A stored split that does not follow its weights is detectable.
  assert.equal(followsSplitRule({ ...ledger.expenses[0], shares: [{ memberId: ana, amount: 600n, weight: 1n }, { memberId: ben, amount: 400n, weight: 1n }] }), false)
})

test('server rejections for percent and shares have plain messages', () => {
  assert.equal(splitErrorMessage('split_percent_total'), 'Percents must add up to 100%.')
  assert.match(splitErrorMessage('split_invalid_shares'), /whole numbers/u)
  assert.match(splitErrorMessage('split_percent_mismatch'), /could not split/u)
})
