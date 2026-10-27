import assert from 'node:assert/strict'
import test from 'node:test'

import { isUpiId, upiNote, upiPayLink } from '../../src/features/split/upi.ts'

test('the UPI link carries payee, name, amount with 2 decimals, INR and a note, all URL-encoded', () => {
  assert.equal(
    upiPayLink({ upiId: 'friend.one@okaxis', name: 'Friend One', amountMinor: 198000n, note: 'Goa weekend settle-up' }),
    'upi://pay?pa=friend.one%40okaxis&pn=Friend%20One&am=1980.00&cu=INR&tn=Goa%20weekend%20settle-up',
  )
  assert.equal(
    upiPayLink({ upiId: 'a_b-c@ybl', name: ' Zoë & “Raj” ', amountMinor: 5n, note: 'Trip #1 / 50%' }),
    'upi://pay?pa=a_b-c%40ybl&pn=Zo%C3%AB%20%26%20%E2%80%9CRaj%E2%80%9D&am=0.05&cu=INR&tn=Trip%20%231%20%2F%2050%25',
  )
  assert.throws(() => upiPayLink({ upiId: 'not a upi', name: 'X', amountMinor: 100n, note: '' }))
  assert.throws(() => upiPayLink({ upiId: 'x@ybl', name: 'X', amountMinor: 0n, note: '' }))
})

test('UPI IDs follow the profile check from migration 025', () => {
  for (const good of ['friend.one@okaxis', 'ab@ybl', '9876543210@paytm', 'a_b-c.d@icici1']) assert.equal(isUpiId(good), true, good)
  for (const bad of ['', 'a@ybl', 'no-at-sign', 'x@1bank', 'two words@ybl', 'x@ybl&am=1', null, undefined]) assert.equal(isUpiId(bad), false, String(bad))
})

test('the note names the Trip and stays short', () => {
  assert.equal(upiNote('Goa weekend'), 'Goa weekend settle-up')
  assert.equal(upiNote('  Bali   bachelor  '), 'Bali bachelor settle-up')
  const long = upiNote('A very long Trip name that goes on and on and on')
  assert.ok(long.length <= 40 && long.startsWith('A very long Trip name'))
  assert.ok(long.endsWith('…'))
})
