import assert from 'node:assert/strict'
import test from 'node:test'

import { sharedDetails, telHref } from '../../src/features/crew/crewInfo.ts'

const empty = { phone: null, emergencyContact: null, dietaryNotes: null, upiId: null }

test('only the fields a member set are shown, in a fixed order', () => {
  assert.deepEqual(sharedDetails(undefined), [])
  assert.deepEqual(sharedDetails(empty), [])
  assert.deepEqual(sharedDetails({ ...empty, phone: '  ', dietaryNotes: '' }), [])
  assert.deepEqual(sharedDetails({
    upiId: 'farah@okaxis', dietaryNotes: ' Vegetarian, no peanuts ', emergencyContact: 'Mum · +91 98100 00000', phone: '+91 98765 43210',
  }), [
    { key: 'phone', label: 'Phone', value: '+91 98765 43210', href: 'tel:+919876543210' },
    { key: 'emergency', label: 'Emergency contact', value: 'Mum · +91 98100 00000' },
    { key: 'dietary', label: 'Dietary needs', value: 'Vegetarian, no peanuts' },
    { key: 'upi', label: 'UPI ID', value: 'farah@okaxis', copyable: true },
  ])
})

test('phone numbers become tel: links only when they look dialable', () => {
  assert.equal(telHref('(022) 2345-6789'), 'tel:02223456789')
  assert.equal(telHref('+1 (415) 555-0100'), 'tel:+14155550100')
  assert.equal(telHref('12-34'), null)
  assert.deepEqual(sharedDetails({ ...empty, phone: '123' }), [{ key: 'phone', label: 'Phone', value: '123' }])
})
