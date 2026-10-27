import { expect, test, type Page, type Route } from '@playwright/test'
import { setTripSettings } from '../support/trip-frame'

const localBrowserHost = `127.0.0.1:${process.env.TRIP_WEB_PORT ?? '4173'}`

// The timezone defaults to the device zone (under its current IANA name), the currency to the locale's.
test.use({ timezoneId: 'Asia/Kolkata', locale: 'en-IN' })

function syntheticSession(accountId: string) {
  const payload = Buffer.from(JSON.stringify({ sub: accountId, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')
  return {
    access_token: `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`,
    refresh_token: 'synthetic-refresh',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: accountId, aud: 'authenticated', role: 'authenticated', email: 'synthetic@example.test', app_metadata: {}, user_metadata: {} },
  }
}

async function installEligibleAccount(page: Page) {
  const accountId = '00000000-0000-4000-8000-0000000003a1'
  await page.addInitScript(({ id, session }) => {
    localStorage.setItem('sb-127-auth-token', JSON.stringify(session))
    localStorage.setItem('sb-127.0.0.1-auth-token', JSON.stringify(session))
    localStorage.setItem('ir003-test-account', id)
  }, { id: accountId, session: syntheticSession(accountId) })
  await page.route('**/rest/v1/profiles*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: '00000000-0000-4000-8000-0000000003a2', display_name: 'Synthetic Creator' }]) }))
  await page.route('**/rest/v1/rpc/get_my_group_access', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }))
}

async function fillValidBootstrapForm(page: Page) {
  await page.getByLabel('Trip name').fill('Northern lights')
  await page.getByLabel('Destination').fill('Tromsø')
  await page.getByLabel('Start date').fill('2027-01-11')
  await page.getByLabel('End date').fill('2027-01-18')
  await setTripSettings(page, { timezone: 'Europe/Oslo', currency: 'NOK', alsoShow: ['EUR'] })
}

test.beforeEach(async ({ page }) => {
  await page.route('**/*', async (route) => {
    if (new URL(route.request().url()).host === localBrowserHost) {
      await route.continue()
      return
    }
    await route.abort('blockedbyclient')
  })
})

test('IR-003 eligible signed-in user reaches the bootstrap form and receives client validation', async ({ page }) => {
  await installEligibleAccount(page)
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await expect(page.getByTestId('bootstrap-onboarding')).toBeVisible()
  // Timezone and currency are chosen from lists with sensible defaults; no free-text codes or jargon.
  await expect(page.getByLabel('Timezone')).toHaveValue('Asia/Kolkata')
  await expect(page.getByLabel('Timezone').locator('option:checked')).toHaveText('Asia/Kolkata (UTC+05:30)')
  await expect(page.getByLabel('Trip currency')).toHaveValue('INR')
  await expect(page.getByLabel('Trip currency').locator('option[value="IDR"]')).toHaveText('IDR · Indonesian Rupiah')
  await expect(page.getByText('Used to split expenses')).toBeVisible()
  await expect(page.getByTestId('bootstrap-onboarding')).not.toContainText(/IANA|ISO 4217|accounting currency|Group/)

  await page.getByRole('button', { name: 'Create Trip' }).click()
  await expect(page.getByText('Check the highlighted fields.')).toBeVisible()
  await expect(page.getByText('Enter a trip name.')).toBeVisible()
  await expect(page.getByText('Enter a destination.')).toBeVisible()
  await expect(page.getByText('Choose a start date.')).toBeVisible()
  await expect(page.getByText('Choose an end date.')).toBeVisible()

  await page.getByLabel('Start date').fill('2027-02-01')
  await page.getByLabel('End date').fill('2027-01-01')
  await page.getByRole('button', { name: 'Create Trip' }).click()
  await expect(page.getByText('End date must be on or after the start date.')).toBeVisible()

  // The Trip currency is always in the display set and cannot be added twice.
  await page.getByLabel('Trip currency').selectOption('NOK')
  await page.getByRole('button', { name: 'More options' }).click()
  const shown = page.getByRole('list', { name: 'Currencies shown' }).getByRole('listitem')
  await expect(shown).toHaveText(['NOK'])
  await expect(page.getByLabel('Also show amounts in').locator('option[value="NOK"]')).toHaveCount(0)
  await page.getByLabel('Also show amounts in').selectOption('EUR')
  await expect(shown).toHaveText(['NOK', 'EUR'])
  await page.getByRole('button', { name: 'Remove EUR' }).click()
  await expect(shown).toHaveText(['NOK'])

  await page.setViewportSize({ width: 1280, height: 720 })
  await expect(page.getByTestId('bootstrap-onboarding')).toHaveCSS('max-width', '480px')
})

test('IR-003 new user can sign out from the Create Trip screen', async ({ page }) => {
  await installEligibleAccount(page)
  await page.route('**/auth/v1/logout*', (route) => route.fulfill({ status: 204, body: '' }))
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('bootstrap-onboarding')).toBeVisible()
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})

test('IR-003 sends only the frozen RPC arguments and renders terminal ONB-06 State A', async ({ page }) => {
  const rpcCalls: Record<string, unknown>[] = []
  await installEligibleAccount(page)
  await page.route('**/rest/v1/rpc/bootstrap_group', async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>
    rpcCalls.push(body)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ outcome: 'completed', group_id: '00000000-0000-4000-8000-0000000003b1', request_id: body.request_id }]),
    })
  })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await fillValidBootstrapForm(page)
  await page.getByRole('button', { name: 'Create Trip' }).click()

  await expect(page.getByTestId('bootstrap-success-state-a')).toBeVisible()
  expect(rpcCalls).toHaveLength(1)
  expect(Object.keys(rpcCalls[0]).sort()).toEqual(['configuration_request', 'group_request', 'request_id'])
  expect(rpcCalls[0]).toMatchObject({
    group_request: { trip_name: 'Northern lights' },
    configuration_request: {
      destination: 'Tromsø',
      start_date: '2027-01-11',
      end_date: '2027-01-18',
      timezone: 'Europe/Oslo',
      accounting_currency: 'NOK',
      display_currency_codes: ['NOK', 'EUR'],
    },
  })
  expect(JSON.stringify(rpcCalls[0])).not.toMatch(/actor|owner|role|profile|auth_user/i)
  await expect(page.getByText('Trip created')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Northern lights' })).toBeVisible()
  await expect(page.getByTestId('bootstrap-success-state-a')).toContainText('Tromsø · 11–18 Jan 2027')
  // No invitation is created with the Trip; friends are invited later from the Crew tab.
  await expect(page.getByText('Invite friends from the Crew tab when you’re ready.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open Trip' })).toBeVisible()
  await expect(page.getByText(/copy|share|join|recipient|group/i)).toHaveCount(0)
})

test('IR-003 blocks duplicate submits and retries an ambiguous response with the original request id', async ({ page }) => {
  const rpcCalls: Record<string, unknown>[] = []
  let releaseFirstResponse: (() => void) | undefined
  await installEligibleAccount(page)
  await page.route('**/rest/v1/rpc/bootstrap_group', async (route: Route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>
    rpcCalls.push(body)
    if (rpcCalls.length === 1) {
      await new Promise<void>((resolve) => { releaseFirstResponse = resolve })
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'operation_failed' }) })
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ outcome: 'completed', group_id: '00000000-0000-4000-8000-0000000003b2', request_id: body.request_id }]) })
  })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await fillValidBootstrapForm(page)
  await page.getByRole('button', { name: 'Create Trip' }).click()
  await expect.poll(() => rpcCalls.length).toBe(1)
  const submit = page.getByRole('button', { name: 'Creating Trip…' })
  await expect(submit).toBeDisabled()
  await submit.evaluate((button: HTMLButtonElement) => button.click())
  expect(rpcCalls).toHaveLength(1)

  releaseFirstResponse?.()
  await expect(page.getByRole('button', { name: 'Retry creating Trip' })).toBeVisible()
  await page.getByRole('button', { name: 'Retry creating Trip' }).click()
  await expect(page.getByTestId('bootstrap-success-state-a')).toBeVisible()
  expect(rpcCalls).toHaveLength(2)
  expect(rpcCalls[1].request_id).toBe(rpcCalls[0].request_id)
})

test('IR-003 presents an idempotency mismatch as a safe non-retryable state', async ({ page }) => {
  await installEligibleAccount(page)
  await page.route('**/rest/v1/rpc/bootstrap_group', (route) => route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ message: 'idempotency_conflict' }) }))
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await fillValidBootstrapForm(page)
  await page.getByRole('button', { name: 'Create Trip' }).click()

  await expect(page.getByTestId('bootstrap-status')).toContainText('don’t match your earlier attempt')
  await expect(page.getByRole('button', { name: 'Review details to continue' })).toBeDisabled()
  await page.getByLabel('Trip name').fill('Northern lights revised')
  await expect(page.getByRole('button', { name: 'Create Trip' })).toBeEnabled()
  await expect(page.getByText(/constraint|database|profile|auth user/i)).toHaveCount(0)
})
