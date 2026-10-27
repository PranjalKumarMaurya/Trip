import { expect, test, type Page } from '@playwright/test'
import { goToTrips, openTrip } from '../support/trip-frame'

// UI wiring only: the workspace frame around the Trip tabs, with synthetic responses.
const localBrowserHost = `127.0.0.1:${process.env.TRIP_WEB_PORT ?? '4173'}`
const accountId = 'a3000000-0000-4000-8000-000000000001'
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
const trip = (groupId: string, role: 'owner' | 'member', tripName: string, destination: string, isInternational: boolean) => ({
  group_id: groupId, group_member_id: `${groupId.slice(0, -1)}9`, role, trip_name: tripName, destination,
  start_date: '2026-11-01', end_date: '2026-11-07', timezone: 'Asia/Makassar', accounting_currency: 'INR',
  is_international: isInternational,
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
    trip('b3000000-0000-4000-8000-000000000001', 'owner', 'Bali bachelor', 'Bali, Indonesia', true),
    trip('b3000000-0000-4000-8000-000000000002', 'member', 'Goa weekend', 'Goa', false),
  ])))
  await page.route('**/rest/v1/rpc/get_my_archived_groups', (route) => route.fulfill(json([])))
  await page.route('**/auth/v1/logout*', (route) => route.fulfill({ status: 204, body: '' }))
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  // After sign-in the Trips home comes first; the Trip opens from its card.
  await expect(page.getByTestId('trips-home')).toBeVisible()
  await openTrip(page, 'Bali bachelor')
}

test('the workspace is an app shell: compact top bar and a one-row bottom tab bar', async ({ page }) => {
  await openWorkspace(page)
  const header = page.getByTestId('group-workspace').locator('header')
  await expect(header).toContainText('Bali, Indonesia · Owner')
  await expect(header).not.toContainText(/\bGroups?\b|IANA|Supabase|Refresh|Sign out/)
  await expect(header.getByRole('button', { name: 'Trips', exact: true })).toBeVisible()
  await expect(header.getByRole('button', { name: 'Trip settings' })).toBeVisible()
  await expect(header.getByRole('button', { name: 'Profile' })).toBeVisible()

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

test('the Trips home lists Trips; back control, domestic tabs, and Profile with sign out', async ({ page }) => {
  await openWorkspace(page)
  await page.getByRole('tab', { name: 'Crew' }).click()

  await goToTrips(page)
  const home = page.getByTestId('trips-home')
  await expect(home.getByRole('button', { name: 'Create Trip', exact: true })).toBeVisible()
  await expect(home.getByTestId('trip-card')).toHaveText([/Bali bachelor/, /Goa weekend/])
  await expect(home.getByRole('button', { name: 'Goa weekend' })).toHaveAccessibleDescription(/Goa · .*Member/)

  // A domestic Trip has no FX tab; tabs start at Trip again.
  await openTrip(page, 'Goa weekend')
  await expect(page.getByTestId('group-workspace').locator('header')).toContainText('Goa · Member')
  await expect(page.getByRole('tab', { name: 'Trip' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tablist', { name: 'Trip sections' }).getByRole('tab')).toHaveText(['Trip', 'Todos', 'Split', 'Scan', 'Crew'])
  await expect(page.getByRole('button', { name: 'Trip details' })).toBeVisible()

  await page.getByRole('button', { name: 'Profile', exact: true }).click()
  const profile = page.getByTestId('profile-screen')
  await expect(profile).toContainText('Partha')
  await expect(profile).toContainText('partha@example.test')
  await expect(profile.getByRole('button', { name: 'Goa weekend' })).toBeVisible()
  await profile.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})
