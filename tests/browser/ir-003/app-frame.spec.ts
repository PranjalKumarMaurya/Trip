import { expect, test, type Page } from '@playwright/test'
import { openTripSwitcher, switchTrip } from '../support/trip-frame'

// UI wiring only: the workspace frame around the Trip tabs, with synthetic responses.
const localBrowserHost = `127.0.0.1:${process.env.TRIP_WEB_PORT ?? '4173'}`
const accountId = 'a3000000-0000-4000-8000-000000000001'
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
const trip = (groupId: string, role: 'owner' | 'member', tripName: string, destination: string) => ({
  group_id: groupId, group_member_id: `${groupId.slice(0, -1)}9`, role, trip_name: tripName, destination,
  start_date: '2026-11-01', end_date: '2026-11-07', timezone: 'Asia/Makassar', accounting_currency: 'INR',
})

async function openWorkspace(page: Page) {
  const payload = Buffer.from(JSON.stringify({ sub: accountId, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')
  await page.addInitScript((session) => {
    localStorage.setItem('sb-127-auth-token', JSON.stringify(session))
    localStorage.setItem('sb-127.0.0.1-auth-token', JSON.stringify(session))
  }, {
    access_token: `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`, refresh_token: 'synthetic-refresh', token_type: 'bearer',
    expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: accountId, aud: 'authenticated', role: 'authenticated', email: 'partha@example.test', app_metadata: {}, user_metadata: {} },
  })
  await page.route('**/*', (route) => new URL(route.request().url()).host === localBrowserHost
    ? route.continue() : route.abort('blockedbyclient'))
  await page.route('**/rest/v1/profiles*', (route) => route.fulfill(json([{ id: 'p', display_name: 'Partha' }])))
  await page.route('**/rest/v1/rpc/get_my_group_access', (route) => route.fulfill(json([
    trip('b3000000-0000-4000-8000-000000000001', 'owner', 'Bali bachelor', 'Bali, Indonesia'),
    trip('b3000000-0000-4000-8000-000000000002', 'member', 'Goa weekend', 'Goa'),
  ])))
  await page.route('**/rest/v1/rpc/get_my_archived_groups', (route) => route.fulfill(json([])))
  await page.route('**/auth/v1/logout*', (route) => route.fulfill({ status: 204, body: '' }))
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('group-workspace').getByRole('heading', { name: 'Bali bachelor' })).toBeVisible()
}

test('the workspace is an app shell: compact top bar and a one-row bottom tab bar', async ({ page }) => {
  await openWorkspace(page)
  const header = page.getByTestId('group-workspace').locator('header')
  await expect(header).toContainText('Bali, Indonesia · Owner')
  await expect(header).not.toContainText(/\bGroups?\b|IANA|Supabase|Refresh|Sign out/)

  const tabs = page.getByRole('tablist', { name: 'Trip sections' }).getByRole('tab')
  await expect(tabs).toHaveText(['Trip', 'Todos', 'Split', 'Scan', 'FX', 'Crew'])
  await expect(page.getByRole('tab', { name: 'Trip' })).toHaveAttribute('aria-selected', 'true')
  const boxes = await tabs.evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().toJSON() as DOMRect))
  const viewport = page.viewportSize()!
  for (const box of boxes) {
    expect(box.top).toBe(boxes[0].top)
    expect(box.height).toBeGreaterThanOrEqual(44)
    expect(box.bottom).toBeLessThanOrEqual(viewport.height)
  }
  expect(boxes[0].top).toBeGreaterThan(viewport.height - 80)

  // Arrow keys move between tabs; the panel follows.
  await page.getByRole('tab', { name: 'Trip' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Todos' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tab', { name: 'Todos' })).toBeFocused()

  // Scrolled to the end, the last content clears the fixed tab bar.
  await page.getByRole('tab', { name: 'Crew' }).click()
  await expect(page.getByTestId('crew-tab')).toBeVisible()
  const clearance = await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight)
    const panel = document.getElementById('trip-tab-panel')!
    const bar = document.querySelector('.tab-bar')!.getBoundingClientRect()
    const last = [...panel.querySelectorAll('*')].reduce((bottom, node) => Math.max(bottom, node.getBoundingClientRect().bottom), 0)
    return bar.top - last
  })
  expect(clearance).toBeGreaterThanOrEqual(0)
})

test('Trips and account live in sheets; switching Trips resets the tabs', async ({ page }) => {
  await openWorkspace(page)
  await page.getByRole('tab', { name: 'Crew' }).click()

  const trips = await openTripSwitcher(page)
  await expect(trips.getByRole('button')).toHaveText([/Bali bachelor/, /Goa weekend/])
  await expect(trips.getByRole('button', { name: 'Bali bachelor' })).toHaveAttribute('aria-current', 'true')
  await expect(page.getByTestId('trips-sheet').getByRole('button', { name: 'Create another Trip' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('trips-sheet')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Trips', exact: true })).toBeFocused()

  await switchTrip(page, 'Goa weekend')
  await expect(page.getByTestId('group-workspace').getByRole('heading', { name: 'Goa weekend' })).toBeVisible()
  await expect(page.getByTestId('group-workspace').locator('header')).toContainText('Goa · Member')
  await expect(page.getByRole('tab', { name: 'Trip' })).toHaveAttribute('aria-selected', 'true')

  await page.getByRole('button', { name: 'Account', exact: true }).click()
  const account = page.getByTestId('account-sheet')
  await expect(account).toContainText('Partha')
  await expect(account).toContainText('partha@example.test')
  await expect(account.getByRole('button', { name: 'Refresh Trips' })).toBeVisible()
  await account.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})
