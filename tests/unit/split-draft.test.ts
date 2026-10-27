import assert from 'node:assert/strict'
import test from 'node:test'

import { draftFromExpense, emptyDraft, evaluateDraft, type ExpenseDraft } from '../../src/features/split/expenseDraft.ts'
import { parseLedger } from '../../src/features/split/ledger.ts'

const [ana, ben, cara] = ['a1000000-0000-4000-8000-000000000000', 'b2000000-0000-4000-8000-000000000000', 'c3000000-0000-4000-8000-000000000000']
const inr = { accountingCurrency: 'INR', memberIds: [cara, ana, ben] }
const draft = (changes: Partial<ExpenseDraft>, context = inr): ExpenseDraft => ({ ...emptyDraft(context, ana), description: 'Dinner', ...changes })

test('a new draft defaults to me paying, split equally among everyone', () => {
  const fresh = emptyDraft(inr, ana)
  assert.equal(fresh.payerId, ana)
  assert.equal(fresh.currency, 'INR')
  assert.deepEqual(fresh.included, [cara, ana, ben])
})

test('equal split request: 100.00 among three with the extra paisa by member id', () => {
  const result = evaluateDraft(draft({ amount: '100' }), inr)
  assert.deepEqual(result.errors, {})
  assert.deepEqual(result.request, {
    description: 'Dinner', category: null, originalAmount: '100.00', originalCurrency: 'INR', fxRate: null, fxSource: null,
    splitMethod: 'equal',
    payers: [{ member_id: ana, amount: '100.00' }],
    shares: [{ member_id: ana, amount: '33.34' }, { member_id: ben, amount: '33.33' }, { member_id: cara, amount: '33.33' }],
  })
})

test('multiple payers must add up to the total; blank counts as zero', () => {
  const short = evaluateDraft(draft({ amount: '900', payerMode: 'multiple', payerAmounts: { [ana]: '600', [ben]: '299.99' } }), inr)
  assert.equal(short.errors.payers, 'Payer amounts must add up to the total.')
  assert.deepEqual(short.payerCheck, { entered: 89999n, required: 90000n, matches: false })
  assert.equal(short.request, null)
  const ok = evaluateDraft(draft({ amount: '900', payerMode: 'multiple', payerAmounts: { [ana]: '600', [ben]: '300', [cara]: '' } }), inr)
  assert.deepEqual(ok.request?.payers, [{ member_id: ana, amount: '600.00' }, { member_id: ben, amount: '300.00' }])
  assert.deepEqual(ok.shareCheck, null)
  assert.equal(evaluateDraft(draft({ amount: '900', payerMode: 'multiple', payerAmounts: {} }), inr).errors.payers,
    'Enter how much each person paid, or switch to one payer.')
})

test('exact shares are checked independently of payers', () => {
  const result = evaluateDraft(draft({
    amount: '900', payerMode: 'multiple', payerAmounts: { [ana]: '450', [ben]: '450' },
    splitMode: 'exact', shareAmounts: { [ana]: '200', [ben]: '300', [cara]: '400.01' },
  }), inr)
  assert.equal(result.errors.payers, undefined)
  assert.equal(result.errors.shares, 'Shares must add up to the total.')
  assert.deepEqual(result.shareCheck, { entered: 90001n, required: 90000n, matches: false })
  const fixed = evaluateDraft(draft({ amount: '900', splitMode: 'exact', shareAmounts: { [ana]: '200', [ben]: '300', [cara]: '400' } }), inr)
  assert.equal(fixed.request?.splitMethod, 'exact')
  assert.deepEqual(fixed.request?.shares.map((share) => share.amount), ['200.00', '300.00', '400.00'])
})

test('validation explains description, amount, precision and empty splits', () => {
  const blank = evaluateDraft(draft({ description: ' ', amount: '' }), inr)
  assert.equal(blank.errors.description, 'Enter a description.')
  assert.equal(blank.errors.amount, 'Enter an amount above zero.')
  assert.match(evaluateDraft(draft({ amount: '-5' }), inr).errors.amount ?? '', /edit it instead/u)
  assert.equal(evaluateDraft(draft({ amount: '10.005' }), inr).errors.amount, 'INR amounts have at most 2 decimal places.')
  assert.equal(evaluateDraft(draft({ amount: '0' }), inr).errors.amount, 'Enter an amount above zero.')
  assert.match(evaluateDraft(draft({ amount: '12,50' }), inr).errors.amount ?? '', /Use a dot for decimals/u)
  assert.equal(evaluateDraft(draft({ amount: '10', included: [] }), inr).errors.shares, 'Choose at least one person to split with.')
  assert.equal(evaluateDraft(draft({ amount: '10', currency: 'US' }), inr).errors.currency, 'Use a three-letter currency code, like USD.')
  const yen = { accountingCurrency: 'JPY', memberIds: [ana, ben] }
  assert.equal(evaluateDraft(draft({ amount: '10.5', currency: 'JPY' }, yen), yen).errors.amount, 'JPY amounts have no decimal places.')
  // Removed members cannot be chosen.
  assert.equal(evaluateDraft(draft({ amount: '10', payerId: 'someone-else' }), inr).errors.payers, 'Choose who paid.')
})

test('a foreign-currency expense converts with the snapshot rate and still reconciles', () => {
  const missing = evaluateDraft(draft({ amount: '12.34', currency: 'usd' }), inr)
  assert.equal(missing.errors.rate, 'Enter how many INR one USD is worth.')
  const result = evaluateDraft(draft({
    amount: '12.34', currency: 'USD', rate: '83.123456', payerMode: 'multiple',
    payerAmounts: { [ana]: '7.40', [ben]: '4.94' }, included: [ana, ben],
  }), inr)
  assert.deepEqual(result.errors, {})
  assert.equal(result.accountingMinor, 102574n)
  assert.equal(result.request?.fxRate, '83.123456')
  assert.equal(result.request?.fxSource, 'manual')
  assert.equal(result.request?.originalAmount, '12.34')
  // 7.40 + 4.94 USD carried into 1025.74 INR by largest remainder.
  assert.deepEqual(result.request?.payers, [{ member_id: ana, amount: '615.11' }, { member_id: ben, amount: '410.63' }])
  assert.deepEqual(result.request?.shares, [{ member_id: ana, amount: '512.87' }, { member_id: ben, amount: '512.87' }])
  assert.equal(evaluateDraft(draft({ amount: '1', currency: 'USD', rate: '0' }), inr).errors.rate, 'Use a rate above zero with at most 12 decimal places.')
})

test('editing reloads the stored expense, including foreign-currency payers', () => {
  const ledger = parseLedger({
    accounting_currency: 'INR',
    expenses: [{
      id: 'e1', description: 'Museum', category: 'activity', original_amount: '12.34', original_currency: 'USD',
      accounting_amount: '1025.74', accounting_currency: 'INR', fx_rate: '83.123456', fx_source: 'open.er-api.com',
      fx_captured_at: '2026-10-27T10:00:00Z', split_method: 'exact', created_by: ana, version: 3, created_at: '', updated_at: '',
      payers: [{ member_id: ana, amount: '615.11' }, { member_id: ben, amount: '410.63' }],
      shares: [{ member_id: ana, amount: '512.87' }, { member_id: ben, amount: '512.87' }],
    }],
    settlements: [],
  })
  const loaded = draftFromExpense(ledger.expenses[0], inr)
  assert.equal(loaded.amount, '12.34')
  assert.equal(loaded.rate, '83.123456')
  assert.equal(loaded.rateSource, 'open.er-api.com')
  assert.equal(loaded.payerMode, 'multiple')
  assert.deepEqual(loaded.payerAmounts, { [ana]: '7.40', [ben]: '4.94' })
  assert.deepEqual(loaded.shareAmounts, { [ana]: '6.17', [ben]: '6.17' })
  // Saving unchanged reproduces the same stored rows.
  const again = evaluateDraft(loaded, inr)
  assert.deepEqual(again.request?.payers, [{ member_id: ana, amount: '615.11' }, { member_id: ben, amount: '410.63' }])
  assert.deepEqual(again.request?.shares, [{ member_id: ana, amount: '512.87' }, { member_id: ben, amount: '512.87' }])
  assert.equal(again.request?.fxSource, 'open.er-api.com')
})
