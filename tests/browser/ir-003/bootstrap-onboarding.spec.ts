import { expect, test, type Page, type Route } from '@playwright/test'

const localBrowserHost = '127.0.0.1:4173'

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
  await page.route('**/rest/v1/groups*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }))
}

async function fillValidBootstrapForm(page: Page) {
  await page.getByLabel('Trip name').fill('Northern lights')
  await page.getByLabel('Destination').fill('Tromsø')
  await page.getByLabel('Start date').fill('2027-01-11')
  await page.getByLabel('End date').fill('2027-01-18')
  await page.getByLabel('IANA timezone').fill('Europe/Oslo')
  await page.getByLabel('Accounting currency').fill('NOK')
  await page.getByLabel('Display currencies').fill('NOK, EUR')
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
  await page.getByRole('button', { name: 'Create Group' }).click()
  await expect(page.getByText('Enter a trip name.')).toBeVisible()
  await expect(page.getByText('Enter a destination.')).toBeVisible()
  await expect(page.getByText('Choose a start date.')).toBeVisible()
  await expect(page.getByText('Choose an end date.')).toBeVisible()
  await expect(page.getByText('Enter an IANA timezone.')).toBeVisible()
  await expect(page.getByText('Choose an accounting currency.')).toBeVisible()
  await expect(page.getByText('Add at least one display currency.')).toBeVisible()

  await page.getByLabel('Start date').fill('2027-02-01')
  await page.getByLabel('End date').fill('2027-01-01')
  await page.getByLabel('Accounting currency').fill('NOK')
  await page.getByLabel('Display currencies').fill('EUR')
  await page.getByRole('button', { name: 'Create Group' }).click()
  await expect(page.getByText('End date must be on or after the start date.')).toBeVisible()
  await expect(page.getByText('Include the accounting currency in the display set.')).toBeVisible()

  await page.setViewportSize({ width: 1280, height: 720 })
  await expect(page.getByTestId('bootstrap-onboarding')).toHaveCSS('max-width', '480px')
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
  await page.getByRole('button', { name: 'Create Group' }).click()

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
  await expect(page.getByText('GROUP CREATED')).toBeVisible()
  await expect(page.getByText('No Invitation has been issued yet.')).toBeVisible()
  await expect(page.getByRole('button')).toHaveCount(0)
  await expect(page.getByText(/copy|share|join|recipient/i)).toHaveCount(0)
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
  await page.getByRole('button', { name: 'Create Group' }).click()
  await expect.poll(() => rpcCalls.length).toBe(1)
  const submit = page.getByRole('button', { name: 'Creating Group…' })
  await expect(submit).toBeDisabled()
  await submit.evaluate((button: HTMLButtonElement) => button.click())
  expect(rpcCalls).toHaveLength(1)

  releaseFirstResponse?.()
  await expect(page.getByRole('button', { name: 'Retry creating Group' })).toBeVisible()
  await page.getByRole('button', { name: 'Retry creating Group' }).click()
  await expect(page.getByTestId('bootstrap-success-state-a')).toBeVisible()
  expect(rpcCalls).toHaveLength(2)
  expect(rpcCalls[1].request_id).toBe(rpcCalls[0].request_id)
})

test('IR-003 presents an idempotency mismatch as a safe non-retryable state', async ({ page }) => {
  await installEligibleAccount(page)
  await page.route('**/rest/v1/rpc/bootstrap_group', (route) => route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ message: 'idempotency_conflict' }) }))
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await fillValidBootstrapForm(page)
  await page.getByRole('button', { name: 'Create Group' }).click()

  await expect(page.getByTestId('bootstrap-status')).toContainText('does not match an earlier request')
  await expect(page.getByRole('button', { name: 'Review details to continue' })).toBeDisabled()
  await expect(page.getByText(/constraint|database|profile|auth user/i)).toHaveCount(0)
})
