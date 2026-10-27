import assert from 'node:assert/strict'
import test from 'node:test'

import { shouldRegisterServiceWorker } from '../../src/features/pwa/pwaRules.ts'

const base = { production: true, supported: true, automated: false, forced: false }

test('production browsers register the app-shell worker', () => {
  assert.equal(shouldRegisterServiceWorker(base), true)
  assert.equal(shouldRegisterServiceWorker({ ...base, production: false }), false, 'dev server')
  assert.equal(shouldRegisterServiceWorker({ ...base, supported: false }), false, 'no service worker support')
})

test('automation gets no worker unless a PWA test opts in', () => {
  assert.equal(shouldRegisterServiceWorker({ ...base, automated: true }), false)
  assert.equal(shouldRegisterServiceWorker({ ...base, automated: true, forced: true }), true)
  assert.equal(shouldRegisterServiceWorker({ ...base, production: false, automated: true, forced: true }), false)
})
