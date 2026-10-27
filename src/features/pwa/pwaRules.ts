// When the app registers its service worker. Pure, so it runs under `node --test`.

/** localStorage key that turns the service worker on under automation (PWA tests only). */
export const FORCE_SERVICE_WORKER_KEY = 'trip:service-worker'

export interface ServiceWorkerEnvironment {
  /** A production build (`import.meta.env.PROD`). */
  production: boolean
  supported: boolean
  /** `navigator.webdriver`: Playwright and other automation. */
  automated: boolean
  /** localStorage[FORCE_SERVICE_WORKER_KEY] === 'on'. */
  forced: boolean
}

/**
 * Production builds register the worker, except under automation: a worker
 * would sit between the page and the network and bypass Playwright's route
 * mocks. PWA tests opt back in with FORCE_SERVICE_WORKER_KEY.
 */
export function shouldRegisterServiceWorker(env: ServiceWorkerEnvironment): boolean {
  return env.production && env.supported && (!env.automated || env.forced)
}
