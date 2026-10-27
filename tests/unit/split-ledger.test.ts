import assert from 'node:assert/strict'
import test from 'node:test'

import {
  computeBalances, computeGroupTotals, followsEqualRule, parseLedger, suggestSettlements, type LedgerExpense,
  type LedgerSettlement,
} from '../../src/features/split/ledger.ts'
import { splitErrorMessage } from '../../src/features/split/splitErrors.ts'
import { fetchLiveRate } from '../../src/features/split/fxRate.ts'

const [ana, ben, cara, dev] = ['a1', 'b2', 'c3', 'd4']

function expense(id: string, total: bigint, payers: [string, bigint][], shares: [string, bigint][]): LedgerExpense {
  return {
    id, description: id, category: null, originalAmount: total, originalCurrency: 'INR', accountingAmount: total,
    accountingCurrency: 'INR', fxRate: null, fxSource: null, fxCapturedAt: null, splitMethod: 'exact', createdBy: ana,
    version: 1, createdAt: '', updatedAt: '',
    payers: payers.map(([memberId, amount]) => ({ memberId, amount })),
    shares: shares.map(([memberId, amount]) => ({ memberId, amount })),
  }
}

const settlement = (from: string, to: string, amount: bigint): LedgerSettlement =>
  ({ id: `${from}-${to}`, fromMember: from, toMember: to, amount, currency: 'INR', note: null, recordedBy: from, createdAt: '' })

test('balances are paid minus owed, plus settlements paid, minus received', () => {
  // Dinner 900.00: Ana paid 600, Ben 300; split equally 300 each.
  const dinner = expense('dinner', 90000n, [[ana, 60000n], [ben, 30000n]], [[ana, 30000n], [ben, 30000n], [cara, 30000n]])
  const balances = computeBalances([dinner], [], [ana, ben, cara, dev])
  assert.deepEqual([...balances], [[ana, 30000n], [ben, 0n], [cara, -30000n], [dev, 0n]])
  const settled = computeBalances([dinner], [settlement(cara, ana, 30000n)], [ana, ben, cara])
  assert.deepEqual([...settled.values()], [0n, 0n, 0n])
  // The sum of all balances is always exactly zero.
  const partial = computeBalances([dinner], [settlement(cara, ana, 12345n)])
  assert.equal([...partial.values()].reduce((sum, value) => sum + value, 0n), 0n)
})

test('group totals exclude settlements', () => {
  const dinner = expense('dinner', 90000n, [[ana, 60000n], [ben, 30000n]], [[ana, 30000n], [ben, 30000n], [cara, 30000n]])
  const taxi = expense('taxi', 10001n, [[cara, 10001n]], [[ana, 3334n], [ben, 3334n], [cara, 3333n]])
  const totals = computeGroupTotals([dinner, taxi], [ana, ben, cara, dev])
  assert.equal(totals.total, 100001n)
  assert.deepEqual(totals.members.get(ana), { paid: 60000n, share: 33334n, net: 26666n })
  assert.deepEqual(totals.members.get(cara), { paid: 10001n, share: 33333n, net: -23332n })
  assert.deepEqual(totals.members.get(dev), { paid: 0n, share: 0n, net: 0n })
})

test('settle-up suggestions are greedy, deterministic, and clear every balance', () => {
  const balances = new Map([[ana, 50000n], [ben, -20000n], [cara, -30000n], [dev, 0n]])
  assert.deepEqual(suggestSettlements(balances), [
    { from: cara, to: ana, amount: 30000n },
    { from: ben, to: ana, amount: 20000n },
  ])
  // Two creditors, two debtors: at most n - 1 transfers, exact to the paisa.
  const mixed = new Map([[ana, 33334n], [ben, 33333n], [cara, -33333n], [dev, -33334n]])
  const transfers = suggestSettlements(mixed)
  assert.deepEqual(transfers, [
    { from: dev, to: ana, amount: 33334n },
    { from: cara, to: ben, amount: 33333n },
  ])
  const after = new Map(mixed)
  for (const transfer of transfers) {
    after.set(transfer.from, after.get(transfer.from)! + transfer.amount)
    after.set(transfer.to, after.get(transfer.to)! - transfer.amount)
  }
  assert.deepEqual([...after.values()], [0n, 0n, 0n, 0n])
  // Ties break by member id, never by name.
  assert.deepEqual(suggestSettlements(new Map([[ben, 100n], [ana, 100n], [cara, -200n]])), [
    { from: cara, to: ana, amount: 100n }, { from: cara, to: ben, amount: 100n },
  ])
  assert.deepEqual(suggestSettlements(new Map([[ana, 0n], [ben, 0n]])), [])
  // Optional dust threshold ignores tiny balances.
  assert.deepEqual(suggestSettlements(new Map([[ana, 1n], [ben, -1n]]), 1n), [])
})

test('the ledger parser keeps exact amounts and holds out rows that do not reconcile', () => {
  const ledger = parseLedger({
    accounting_currency: 'INR',
    expenses: [
      {
        id: 'e1', description: 'Museum', category: 'activity', original_amount: '12.34', original_currency: 'USD',
        accounting_amount: '1025.74', accounting_currency: 'INR', fx_rate: '83.123456', fx_source: 'manual',
        fx_captured_at: '2026-10-27T10:00:00Z', split_method: 'equal', created_by: ana, version: 2,
        created_at: '2026-10-27T10:00:00Z', updated_at: '2026-10-27T10:00:00Z',
        payers: [{ member_id: ana, amount: '1025.74' }],
        shares: [{ member_id: ana, amount: '512.87' }, { member_id: ben, amount: '512.87' }],
      },
      {
        id: 'broken', description: 'Bad', original_amount: '10.00', original_currency: 'INR', accounting_amount: '10.00',
        accounting_currency: 'INR', split_method: 'exact', created_by: ana,
        payers: [{ member_id: ana, amount: '10.00' }], shares: [{ member_id: ana, amount: '9.99' }],
      },
      {
        id: 'other-currency', description: 'Old', original_amount: '10.00', original_currency: 'USD', accounting_amount: '10.00',
        accounting_currency: 'USD', split_method: 'exact', created_by: ana,
        payers: [{ member_id: ana, amount: '10.00' }], shares: [{ member_id: ana, amount: '10.00' }],
      },
    ],
    settlements: [{ id: 's1', from_member: ben, to_member: ana, amount: '512.87', currency: 'INR', note: null, recorded_by: ben, created_at: '' }],
  })
  assert.equal(ledger.expenses.length, 1)
  assert.deepEqual(ledger.heldOut, ['broken', 'other-currency'])
  const [museum] = ledger.expenses
  assert.equal(museum.originalAmount, 1234n)
  assert.equal(museum.accountingAmount, 102574n)
  assert.equal(museum.fxRate, '83.123456')
  assert.equal(followsEqualRule(museum), true)
  assert.equal(ledger.settlements[0].amount, 51287n)
  assert.deepEqual([...computeBalances(ledger.expenses, ledger.settlements, [ana, ben]).values()], [0n, 0n])
  assert.throws(() => parseLedger(null))
})

test('server error codes map to plain language', () => {
  assert.match(splitErrorMessage('split_payers_total_mismatch'), /add up to the total/u)
  assert.match(splitErrorMessage('split_not_allowed'), /Trip Owner/u)
  assert.match(splitErrorMessage('something_else'), /Nothing was changed/u)
  assert.match(splitErrorMessage(undefined), /Nothing was changed/u)
})

test('the live rate is read from open.er-api.com and normalised', async () => {
  const requested: string[] = []
  const live = await fetchLiveRate('USD', 'INR', async (url) => {
    requested.push(url)
    return { ok: true, json: async () => ({ result: 'success', time_last_update_utc: 'Tue, 27 Oct 2026 00:02:31 +0000', rates: { INR: 83.123456 } }) }
  })
  assert.deepEqual(requested, ['https://open.er-api.com/v6/latest/USD'])
  assert.deepEqual(live, { rate: '83.123456', asOf: 'Tue, 27 Oct 2026 00:02:31 +0000' })
  await assert.rejects(fetchLiveRate('USD', 'XYZ', async () => ({ ok: true, json: async () => ({ result: 'success', rates: {} }) })))
  await assert.rejects(fetchLiveRate('USD', 'INR', async () => ({ ok: false, json: async () => ({}) })))
  await assert.rejects(fetchLiveRate('usd', 'INR'))
})
