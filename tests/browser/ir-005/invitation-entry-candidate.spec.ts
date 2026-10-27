import { expect, test, type Page } from '@playwright/test'

const proof = 'a'.repeat(64)
const groupId = 'b5000000-0000-4000-8000-000000000001'
const accountId = 'a5000000-0000-4000-8000-000000000002'

function syntheticSession() {
  const payload = Buffer.from(JSON.stringify({ sub: accountId, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')
  return {
    access_token: `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`,
    refresh_token: 'synthetic-refresh',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: accountId, aud: 'authenticated', role: 'authenticated', email: 'friend@example.test', app_metadata: {}, user_metadata: {} },
  }
}

async function mockInspection(page: Page, outcome: 'continue' | 'ready') {
  await page.route('**/rest/v1/rpc/inspect_invitation', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      outcome, trip_name: 'Trip A', destination: 'Goa', start_date: '2026-11-01',
      end_date: '2026-11-05', expires_at: '2026-11-06T00:00:00Z',
    }) })
  })
}

test.beforeEach(async ({ page }) => {
  await page.route('**/*', async (route) => {
    if (new URL(route.request().url()).host === `127.0.0.1:${process.env.TRIP_WEB_PORT ?? '4173'}`) {
      await route.continue()
      return
    }
    await route.abort('blockedbyclient')
  })
})

test('signed-out friend retains invite through the sign-in path', async ({ page }) => {
  await mockInspection(page, 'continue')
  await page.goto(`/#invite=${proof}`)
  await expect(page.getByTestId('invitation-entry')).toContainText('invited to Trip A · Goa')
  await expect(page.getByTestId('invitation-entry')).toContainText('You join only after you confirm')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(page.getByTestId('auth-entry')).toContainText('Sign in or create an account to join Trip A.')
  await page.getByRole('button', { name: 'Back to invitation' }).click()
  await expect(page.getByTestId('invitation-entry')).toContainText('invited to Trip A · Goa')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.goto('/')
  await expect(page.getByTestId('invitation-entry')).toContainText('invited to Trip A · Goa')
})

test('verified friend confirms once; unknown response retries the same request', async ({ page }) => {
  await page.addInitScript((session) => {
    localStorage.setItem('sb-127-auth-token', JSON.stringify(session))
    localStorage.setItem('sb-127.0.0.1-auth-token', JSON.stringify(session))
  }, syntheticSession())
  await page.route('**/rest/v1/profiles*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: accountId, display_name: 'Friend' }]) })
  })
  await mockInspection(page, 'ready')
  const requestIds: string[] = []
  await page.route('**/rest/v1/rpc/accept_invitation', async (route) => {
    const request = route.request().postDataJSON() as { request_id: string }
    requestIds.push(request.request_id)
    if (requestIds.length === 1) {
      await route.abort('failed')
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      outcome: 'already_completed', group_id: groupId, request_id: request.request_id,
    }) })
  })
  await page.goto(`/#invite=${proof}`)
  await expect(page.getByTestId('invitation-entry')).toContainText('Join Trip A as a member?')
  await page.getByRole('button', { name: 'Confirm and join' }).click()
  await expect(page.getByRole('alert')).toContainText('safe to try again')
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByTestId('invitation-entry')).toContainText('You joined Trip A.')
  await expect(page.getByRole('button', { name: 'Open Trip' })).toBeVisible()
  expect(requestIds).toHaveLength(2)
  expect(requestIds[0]).toBe(requestIds[1])
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('')
  expect(await page.evaluate(() => localStorage.getItem('trip:pending-invitation:v1'))).toBeNull()
})

for (const [outcome, message] of [
  ['expired', 'This invite has expired'],
  ['revoked', 'This invite was cancelled'],
  ['used', 'This invite has already been used'],
  ['invalid', 'This invite link doesn’t work'],
] as const) {
  test(`a ${outcome} invite explains itself and offers a way on`, async ({ page }) => {
    await page.route('**/rest/v1/rpc/inspect_invitation', (route) => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify({ outcome }),
    }))
    await page.goto(`/#invite=${proof}`)
    await expect(page.getByRole('heading', { name: message })).toBeVisible()
    await page.getByRole('button', { name: 'Go to sign in' }).click()
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })
}
