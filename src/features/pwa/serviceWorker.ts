/// <reference types="vite-plugin-pwa/client" />
import { registerSW } from 'virtual:pwa-register'
import { FORCE_SERVICE_WORKER_KEY, shouldRegisterServiceWorker } from './pwaRules'

const UPDATE_CHECK_MS = 60 * 60 * 1000
const listeners = new Set<() => void>()
let updateAvailable = false
let applyUpdate: ((reloadPage?: boolean) => Promise<void>) | null = null

function emit() {
  for (const listener of listeners) listener()
}

function forced(): boolean {
  try {
    return window.localStorage.getItem(FORCE_SERVICE_WORKER_KEY) === 'on'
  } catch {
    return false
  }
}

/** Register the app-shell worker. A new version waits until the person chooses Reload. */
export function startServiceWorker() {
  if (!shouldRegisterServiceWorker({
    production: import.meta.env.PROD,
    supported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    automated: typeof navigator !== 'undefined' && navigator.webdriver === true,
    forced: forced(),
  })) return
  applyUpdate = registerSW({
    onNeedRefresh() {
      updateAvailable = true
      emit()
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return
      window.setInterval(() => { if (navigator.onLine) registration.update().catch(() => {}) }, UPDATE_CHECK_MS)
    },
  })
}

export function subscribeToUpdates(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export const isUpdateAvailable = () => updateAvailable

/** Activate the waiting worker; the page reloads once it takes over. */
export function reloadForUpdate() {
  void applyUpdate?.(true)
}

export function dismissUpdate() {
  updateAvailable = false
  emit()
}
