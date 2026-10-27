import { expect, test, type Page } from '@playwright/test'

// The production build as an installable app: manifest, icons, and a service
// worker that precaches only the app shell. No Supabase stack: every request
// that leaves the preview server is refused.
const localBrowserHost = `127.0.0.1:${process.env.TRIP_WEB_PORT ?? '4173'}`

async function blockExternalTraffic(page: Page) {
  await page.route('**/*', (route) => new URL(route.request().url()).host === localBrowserHost
    ? route.continue() : route.abort('blockedbyclient'))
}

async function cachedUrls(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    const urls: string[] = []
    for (const name of await caches.keys()) {
      const cache = await caches.open(name)
      // Workbox keys revisioned files as `<url>?__WB_REVISION__=<hash>`.
      for (const request of await cache.keys()) {
        const url = new URL(request.url)
        url.searchParams.delete('__WB_REVISION__')
        urls.push(url.href)
      }
    }
    return urls
  })
}

test('the manifest, icons and service worker are served', async ({ request }) => {
  const manifest = await (await request.get('/manifest.webmanifest')).json()
  expect(manifest).toMatchObject({
    name: 'Trip', short_name: 'Trip', display: 'standalone', start_url: '/', theme_color: '#0F0B08', background_color: '#0F0B08',
  })
  const icons = manifest.icons as { src: string; sizes: string; purpose: string }[]
  for (const size of ['192x192', '512x512']) {
    expect(icons.some((icon) => icon.sizes === size && icon.purpose === 'any')).toBe(true)
    expect(icons.some((icon) => icon.sizes === size && icon.purpose === 'maskable')).toBe(true)
  }
  for (const path of [...icons.map((icon) => `/${icon.src}`), '/apple-touch-icon.png', '/icon.svg']) {
    const response = await request.get(path)
    expect(response.status(), path).toBe(200)
    expect(response.headers()['content-type'], path).toMatch(/^image\//u)
  }
  const worker = await (await request.get('/sw.js')).text()
  expect(worker).toContain('precacheAndRoute')
  // App shell only: no runtime caching routes besides the navigation fallback.
  expect(worker).not.toMatch(/NetworkFirst|CacheFirst|StaleWhileRevalidate|supabase/iu)
})

test('under automation no service worker is registered, so route mocks keep working', async ({ page }) => {
  await blockExternalTraffic(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await page.waitForTimeout(500)
  expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)).toBe(0)
})

test('opens offline from the cached app shell and says it is offline', async ({ page, context }) => {
  await page.addInitScript(() => localStorage.setItem('trip:service-worker', 'on'))
  await blockExternalTraffic(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  await expect.poll(async () => (await cachedUrls(page)).length).toBeGreaterThan(5)

  // Only this origin's build output is cached: never Supabase, the API, Auth or documents.
  const origin = `http://${localBrowserHost}`
  const urls = await cachedUrls(page)
  expect(urls).toContain(`${origin}/index.html`)
  for (const url of urls) {
    expect(url.startsWith(`${origin}/`), url).toBe(true)
    expect(new URL(url).pathname, url).toMatch(/^\/(index\.html|manifest\.webmanifest|icon\.svg|[\w-]+\.png|assets\/[\w.-]+\.(js|css))$/u)
  }

  await expect(page.getByTestId('offline-notice')).toHaveCount(0)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await expect(page.getByTestId('offline-notice')).toContainText('You’re offline')
  // A deep link opens the same shell.
  await page.goto('/some/deep/link')
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()

  await context.setOffline(false)
  await expect(page.getByTestId('offline-notice')).toHaveCount(0)
})
