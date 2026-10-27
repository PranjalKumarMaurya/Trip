import assert from 'node:assert/strict'
import test from 'node:test'
import {
  clearPendingInvitation, invitationShareUrl, pendingInvitationFromBrowser,
} from '../../src/features/invitations/invitationLink.ts'

const proof = 'a'.repeat(64)

function memoryStorage() {
  const data = new Map()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => { data.set(key, value) },
    removeItem: (key) => { data.delete(key) },
  }
}

test('manual share URL carries only the opaque proof in its fragment', () => {
  assert.equal(invitationShareUrl('https://trip.example/?old=1', proof),
    `https://trip.example/#invite=${proof}`)
  assert.throws(() => invitationShareUrl('https://trip.example/', 'bad'))
})

test('invitation survives an authentication callback in another tab', () => {
  const storage = memoryStorage()
  assert.equal(pendingInvitationFromBrowser(`#invite=${proof}`, storage, 1000).proof, proof)
  assert.equal(pendingInvitationFromBrowser('#access_token=auth-result', storage, 2000).proof, proof)
  clearPendingInvitation(storage)
  assert.equal(pendingInvitationFromBrowser('', storage, 3000).proof, null)
})

test('invalid and stale invitations do not revive an older proof', () => {
  const storage = memoryStorage()
  pendingInvitationFromBrowser(`#invite=${proof}`, storage, 1000)
  assert.equal(pendingInvitationFromBrowser('#invite=bad', storage, 2000).proof, null)
  assert.equal(pendingInvitationFromBrowser('', storage, 3000).proof, null)
  pendingInvitationFromBrowser(`#invite=${proof}`, storage, 1000)
  assert.equal(pendingInvitationFromBrowser('', storage, 8 * 24 * 60 * 60 * 1000).proof, null)
})
