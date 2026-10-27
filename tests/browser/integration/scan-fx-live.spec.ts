import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { setTripSettings } from '../support/trip-frame'

// Real local stack (Auth, PostgREST, Storage, Edge runtime with the stub
// extractor); only the public FX rates endpoint is mocked.
test.skip(process.env.TRIP_SCAN_FX_LIVE !== '1', 'requires the disposable scan-fx-live stack (npm run test:scan:live)')

const apiUrl = process.env.VITE_SUPABASE_URL ?? ''
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
const pdf = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n')
const inrRates = { result: 'success', base_code: 'INR', time_last_update_unix: 1793145600, rates: { INR: 1, IDR: 190, USD: 0.012, EUR: 0.011 } }

async function mockRates(context: BrowserContext, mode: { online: boolean }) {
  await context.route('https://open.er-api.com/**', (route) => mode.online
    ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(inrRates) })
    : route.abort('internetdisconnected'))
}

async function signUpWithTrip(page: Page, name: string, email: string, trip: { name: string; destination: string }) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Create an account' }).click()
  await page.getByLabel('Display name').fill(name)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('LongerPass123!')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByTestId('bootstrap-onboarding')).toBeVisible()
  await page.getByLabel('Trip name').fill(trip.name)
  await page.getByLabel('Destination').fill(trip.destination)
  await page.getByLabel('Start date').fill('2026-11-01')
  await page.getByLabel('End date').fill('2026-11-05')
  await setTripSettings(page, { timezone: 'Asia/Kolkata', currency: 'INR', alsoShow: ['IDR'] })
  await page.getByRole('button', { name: 'Create Trip' }).click()
  await page.getByRole('button', { name: 'Open Trip' }).click()
  await expect(page.getByTestId('group-workspace')).toContainText(trip.name)
}

/** The signed-in user's access token, read from the app's own session storage. */
const accessToken = (page: Page) => page.evaluate(() => {
  const key = Object.keys(localStorage).find((name) => name.endsWith('-auth-token'))
  return key ? (JSON.parse(localStorage.getItem(key) ?? '{}') as { access_token?: string }).access_token ?? '' : ''
})

test('Scan stores documents privately, drafts an Event for review, and FX converts with cached rates', async ({ browser }) => {
  const ownerContext = await browser.newContext()
  const strangerContext = await browser.newContext()
  const rates = { online: true }
  await mockRates(ownerContext, rates)
  await mockRates(strangerContext, rates)
  try {
    const owner = await ownerContext.newPage()
    await signUpWithTrip(owner, 'Scan Owner', 'scan-owner@example.test', { name: 'Bali crew', destination: 'Seminyak, Bali' })
    await owner.getByRole('tab', { name: 'Scan' }).click()
    const scan = owner.getByTestId('scan-tab')
    await expect(scan).toContainText('No documents yet')
    const fileInput = owner.getByLabel('Ticket or booking file')

    // Local checks reject unsupported and oversize files before any upload.
    await fileInput.setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') })
    await expect(scan.getByRole('alert')).toContainText('Choose a PDF, JPEG, PNG, WebP, or HEIC file.')
    await fileInput.setInputFiles({ name: 'huge.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(10 * 1024 * 1024 + 1) })
    await expect(scan.getByRole('alert')).toContainText('larger than 10 MB')
    await expect(owner.getByRole('button', { name: 'Upload and read' })).toBeDisabled()

    // Upload -> parse (stub) -> editable draft -> add to itinerary.
    await fileInput.setInputFiles({ name: 'boarding-pass.png', mimeType: 'image/png', buffer: png })
    await expect(owner.getByTestId('scan-selected-file')).toContainText('boarding-pass.png')
    await owner.getByRole('button', { name: 'Upload and read' }).click()
    const review = owner.getByTestId('scan-review')
    await expect(review).toBeVisible()
    await expect(review.getByLabel('Title')).toHaveValue('IndiGo 6E-123 · DEL → GOI')
    await expect(review.getByLabel('Starts')).toHaveValue('2026-11-01T06:15')
    await expect(review.getByLabel('Start timezone')).toHaveValue('Asia/Kolkata')
    await expect(review.getByLabel('Flight number')).toHaveValue('6E-123')
    await expect(review.getByLabel('Departure airport')).toHaveValue('DEL')
    await expect(review.getByLabel('Booking reference')).toHaveValue('STUB42')
    await review.getByLabel('Title').fill('Flight to Goa')
    await review.getByRole('button', { name: 'Add to itinerary' }).click()
    await expect(scan).toContainText('Added to the itinerary: Flight to Goa')
    const passRow = owner.getByTestId('scan-document').filter({ hasText: 'boarding-pass.png' })
    await expect(passRow).toContainText('In itinerary: Flight to Goa')
    await expect(passRow).toContainText('Scan Owner')
    await expect(passRow.getByRole('button', { name: 'Review boarding-pass.png' })).toHaveCount(0)

    // A parse failure still allows manual entry.
    await fileInput.setInputFiles({ name: 'unreadable-voucher.pdf', mimeType: 'application/pdf', buffer: pdf })
    await owner.getByRole('button', { name: 'Upload and read' }).click()
    await expect(review).toContainText('We could not read this document. Enter the details yourself.')
    await expect(review.getByLabel('Title')).toHaveValue('')
    await review.getByRole('button', { name: 'Add to itinerary' }).click()
    await expect(review.getByRole('alert').first()).toContainText('Fix the highlighted fields')
    await review.getByLabel('Type').selectOption('hotel')
    await review.getByLabel('Title').fill('Hotel check-in')
    await review.getByLabel('Starts').fill('2026-11-01T14:00')
    await review.getByRole('button', { name: 'Add to itinerary' }).click()
    await expect(scan).toContainText('Added to the itinerary: Hotel check-in')

    // View opens a short-lived signed URL for the private object.
    const popupPromise = owner.waitForEvent('popup')
    await passRow.getByRole('button', { name: 'View boarding-pass.png' }).click()
    const popup = await popupPromise
    await popup.waitForURL(/\/storage\/v1\/object\/sign\/trip-documents\//u)
    const signedUrl = popup.url()
    const objectPath = decodeURIComponent(new URL(signedUrl).pathname.split('/object/sign/trip-documents/')[1])
    const viewed = await ownerContext.request.get(signedUrl)
    expect(viewed.status()).toBe(200)
    expect(viewed.headers()['content-type']).toContain('image/png')
    await popup.close()
    // The object is not public.
    expect((await ownerContext.request.get(`${apiUrl}/storage/v1/object/public/trip-documents/${objectPath}`)).ok()).toBe(false)

    // Someone in another Trip sees nothing and cannot fetch the object directly.
    const stranger = await strangerContext.newPage()
    await signUpWithTrip(stranger, 'Other Person', 'scan-other@example.test', { name: 'Jaipur', destination: 'Jaipur' })
    await stranger.getByRole('tab', { name: 'Scan' }).click()
    await expect(stranger.getByTestId('scan-tab')).toContainText('No documents yet')
    const strangerToken = await accessToken(stranger)
    expect(strangerToken).not.toBe('')
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? ''
    const headers = { apikey: anonKey, Authorization: `Bearer ${strangerToken}` }
    const download = await strangerContext.request.get(`${apiUrl}/storage/v1/object/authenticated/trip-documents/${objectPath}`, { headers })
    expect(download.ok()).toBe(false)
    const listed = await strangerContext.request.get(`${apiUrl}/rest/v1/trip_documents?select=id`, { headers })
    expect(await listed.json()).toEqual([])
    await stranger.getByRole('tab', { name: 'FX' }).click()
    await expect(stranger.getByTestId('fx-tab')).toBeVisible()
    await expect(stranger.getByTestId('fx-bali-guide')).toHaveCount(0)

    // Delete needs confirmation; the itinerary entry made from it stays.
    await passRow.getByRole('button', { name: 'Delete boarding-pass.png' }).click()
    await passRow.getByRole('button', { name: 'Keep' }).click()
    await expect(passRow).toBeVisible()
    await passRow.getByRole('button', { name: 'Delete boarding-pass.png' }).click()
    await passRow.getByRole('button', { name: 'Delete document' }).click()
    await expect(scan).toContainText('Deleted boarding-pass.png')
    await expect(owner.getByTestId('scan-document')).toHaveCount(1)
    await expect(owner.getByTestId('scan-document')).toContainText('In itinerary: Hotel check-in')
    expect((await ownerContext.request.get(signedUrl)).ok()).toBe(false)

    // FX: accounting currency against IDR (a Bali Trip), mocked live rates, two-way input.
    await owner.getByRole('tab', { name: 'FX' }).click()
    const fx = owner.getByTestId('fx-tab')
    await expect(owner.getByTestId('fx-status')).toContainText('Live rates')
    await expect(owner.getByLabel('Other currency')).toHaveValue('IDR')
    await expect(owner.getByTestId('fx-rate')).toContainText('1 INR = 190 IDR')
    await expect(owner.getByLabel('Amount in IDR')).toHaveValue('19000')
    await owner.getByLabel('Amount in INR').fill('1,000')
    await expect(owner.getByLabel('Amount in IDR')).toHaveValue('190000')
    await owner.getByLabel('Amount in IDR').fill('380000')
    await expect(owner.getByLabel('Amount in INR')).toHaveValue('2000')
    await fx.getByRole('button', { name: /^Convert .*500/u }).first().click()
    await expect(owner.getByLabel('Amount in INR')).not.toHaveValue('2000')
    await expect(owner.getByTestId('fx-bali-guide')).toContainText('Bintang large')
    await owner.getByLabel('Other currency').selectOption('USD')
    await expect(owner.getByTestId('fx-rate')).toContainText('1 INR = 0.012 USD')

    // Offline: refresh fails but the last good rates keep working, also after a reload.
    rates.online = false
    await owner.getByRole('button', { name: 'Refresh rates' }).click()
    await expect(owner.getByTestId('fx-status')).toContainText('Offline. Showing saved rates')
    await owner.reload()
    await owner.getByRole('tab', { name: 'FX' }).click()
    await expect(owner.getByTestId('fx-status')).toContainText('Saved rates')
    await expect(owner.getByLabel('Other currency')).toHaveValue('USD')
    await owner.getByLabel('Amount in INR').fill('500')
    await expect(owner.getByLabel('Amount in USD')).toHaveValue('6')
  } finally {
    await ownerContext.close()
    await strangerContext.close()
  }
})
