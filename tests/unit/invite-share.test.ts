import assert from 'node:assert/strict'
import test from 'node:test'

import { canNativeShare, inviteShare } from '../../src/features/invitations/inviteShare.ts'

const url = `http://127.0.0.1:4173/#invite=${'a'.repeat(64)}`

test('the invitation message names the Trip, the recipient and the one-time rule', () => {
  const share = inviteShare({ tripName: ' Bali bachelor ', url, recipient: 'friend@example.test' })
  assert.equal(share.message, `Join our Trip “Bali bachelor”: ${url} — it’s for friend@example.test and works once.`)
  assert.deepEqual(share.share, {
    title: 'Join Bali bachelor',
    text: 'Join our Trip “Bali bachelor” — it’s for friend@example.test and works once.',
    url,
  })
  assert.equal(share.whatsAppUrl, `https://wa.me/?text=${encodeURIComponent(share.message)}`)
  assert.equal(decodeURIComponent(new URL(share.whatsAppUrl).searchParams.get('text') ?? ''), share.message)
  // The fragment survives the round trip intact.
  assert.ok(new URL(share.whatsAppUrl).searchParams.get('text')?.includes(`#invite=${'a'.repeat(64)}`))
})

test('without a Trip name the message still reads well', () => {
  assert.equal(inviteShare({ url, recipient: 'x@example.test' }).message, `Join our Trip: ${url} — it’s for x@example.test and works once.`)
  assert.equal(inviteShare({ tripName: '  ', url, recipient: 'x@example.test' }).share.title, 'Join our Trip')
})

test('the native share button appears only where the browser can share', () => {
  const data = { title: 't', text: 'x', url }
  assert.equal(canNativeShare(undefined, data), false)
  assert.equal(canNativeShare({}, data), false)
  assert.equal(canNativeShare({ share: async () => {} }, data), true)
  assert.equal(canNativeShare({ share: async () => {}, canShare: () => false }, data), false)
  assert.equal(canNativeShare({ share: async () => {}, canShare: () => { throw new Error('nope') } }, data), false)
})
