import { expect, test, type Page } from '@playwright/test'

// UI wiring only: every Auth/Profile/RPC response below is synthetic.
const localBrowserHost = `127.0.0.1:${process.env.TRIP_WEB_PORT ?? '4173'}`
const accountId = 'a6000000-0000-4000-8000-000000000001'
const groupId = 'b6000000-0000-4000-8000-000000000001'
const ownMemberId = 'c6000000-0000-4000-8000-000000000001'
const friendMemberId = 'c6000000-0000-4000-8000-000000000002'

function syntheticSession() {
  const payload = Buffer.from(JSON.stringify({ sub: accountId, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')
  return {
    access_token: `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`,
    refresh_token: 'synthetic-refresh', token_type: 'bearer', expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: accountId, aud: 'authenticated', role: 'authenticated', email: 'olive@example.test', app_metadata: {}, user_metadata: {} },
  }
}

const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })

/** Install the synthetic account; register per-test RPC mocks after this (later routes win). */
async function mockTrip(page: Page, role: 'owner' | 'member', calls: string[]) {
  await page.addInitScript((session) => {
    localStorage.setItem('sb-127-auth-token', JSON.stringify(session))
    localStorage.setItem('sb-127.0.0.1-auth-token', JSON.stringify(session))
  }, syntheticSession())
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (url.host === localBrowserHost) return route.continue()
    if (url.pathname.startsWith('/rest/v1/rpc/')) calls.push(url.pathname.slice('/rest/v1/rpc/'.length))
    return route.abort('blockedbyclient')
  })
  await page.route('**/rest/v1/profiles*', (route) => route.fulfill(json([{ id: 'p', display_name: 'Olive' }])))
  await page.route('**/rest/v1/rpc/get_my_group_access', (route) => route.fulfill(json([{
    group_id: groupId, group_member_id: ownMemberId, role, trip_name: 'Goa weekend', destination: 'Goa',
    start_date: '2026-11-01', end_date: '2026-11-05', timezone: 'Asia/Kolkata', accounting_currency: 'INR',
  }])))
  await page.route('**/rest/v1/rpc/get_group_roster', (route) => {
    calls.push('get_group_roster')
    return route.fulfill(json([
      { participant_id: ownMemberId, group_id: groupId, display_name: 'Olive Owner', role, status: 'active' },
      { participant_id: friendMemberId, group_id: groupId, display_name: 'Farah Friend', role: 'member', status: 'active' },
    ]))
  })
  await page.route('**/rest/v1/rpc/list_group_invitations', (route) => {
    calls.push('list_group_invitations')
    return route.fulfill(json({ live_count: 0, items: [] }))
  })
}

async function openCrew(page: Page) {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Crew' }).click()
  await expect(page.getByRole('list', { name: 'Trip members' })).toContainText('Farah Friend')
}

test('an ambiguous failure retries with the same request id; a new action gets a fresh one', async ({ page }) => {
  const calls: string[] = []
  const requests: { request_id: string; requested_role: string; target_membership_id: string }[] = []
  await mockTrip(page, 'owner', calls)
  await page.route('**/rest/v1/rpc/change_member_role', async (route) => {
    const body = route.request().postDataJSON()
    requests.push(body)
    if (requests.length === 1) return route.abort('connectionreset')
    return route.fulfill(json({ outcome: 'changed', request_id: body.request_id, role: body.requested_role }))
  })
  await openCrew(page)

  await page.getByRole('button', { name: 'Manage Farah Friend' }).click()
  const sheet = page.getByTestId('member-actions-sheet')
  await sheet.getByRole('button', { name: 'Make Owner' }).click()
  await expect(sheet.getByRole('button', { name: 'Cancel' })).toBeFocused()
  await sheet.getByRole('button', { name: 'Make Owner' }).click()
  await expect(sheet.getByRole('alert')).toHaveText('We could not confirm this change. Retrying is safe: it will not be applied twice.')
  await sheet.getByRole('button', { name: 'Retry' }).click()
  await expect(sheet.getByRole('status')).toHaveText('Farah Friend is now an Owner.')
  expect(requests).toHaveLength(2)
  expect(requests[1].request_id).toBe(requests[0].request_id)
  expect(requests[0]).toMatchObject({ requested_role: 'owner', target_membership_id: friendMemberId, group_id: groupId })
  const rosterReads = calls.filter((name) => name === 'get_group_roster').length
  await sheet.getByRole('button', { name: 'Done' }).click()
  await expect(sheet).toHaveCount(0)
  await expect(page.getByTestId('crew-tab').getByRole('status')).toHaveText('Farah Friend is now an Owner.')
  await expect.poll(() => calls.filter((name) => name === 'get_group_roster').length).toBeGreaterThan(rosterReads)

  await page.getByRole('button', { name: 'Manage Farah Friend' }).click()
  await sheet.getByRole('button', { name: 'Make Owner' }).click()
  await sheet.getByRole('button', { name: 'Make Owner' }).click()
  await expect(sheet.getByRole('status')).toHaveText('Farah Friend is now an Owner.')
  expect(requests).toHaveLength(3)
  expect(requests[2].request_id).not.toBe(requests[0].request_id)
})

test('server refusals are explained without retry, and Escape closes an idle sheet', async ({ page }) => {
  const calls: string[] = []
  await mockTrip(page, 'owner', calls)
  await page.route('**/rest/v1/rpc/deactivate_membership', (route) => route.fulfill(json({ message: 'not_authorized', code: 'P0001' }, 400)))
  await openCrew(page)

  await page.getByRole('button', { name: 'Manage Farah Friend' }).click()
  const sheet = page.getByTestId('member-actions-sheet')
  await sheet.getByRole('button', { name: 'Remove from Trip' }).click()
  await expect(sheet).toContainText('nothing is deleted')
  await sheet.getByRole('button', { name: 'Remove from Trip' }).click()
  await expect(sheet.getByRole('alert')).toHaveText('Only an active Owner of this Trip can do that. Your role may have changed, so the crew list was refreshed.')
  await expect(sheet.getByRole('button', { name: 'Retry' })).toHaveCount(0)
  await sheet.getByRole('button', { name: 'Close' }).click()
  await expect(sheet).toHaveCount(0)

  await page.getByRole('button', { name: 'Archive Trip' }).click()
  await expect(page.getByTestId('archive-sheet')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('archive-sheet')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Archive Trip' })).toBeFocused()
})

test('a Member sees roles but no management, and never requests the invitation list', async ({ page }) => {
  const calls: string[] = []
  await mockTrip(page, 'member', calls)
  await openCrew(page)
  const crew = page.getByTestId('crew-tab')
  await expect(crew.getByRole('list', { name: 'Trip members' })).toContainText('Member')
  await expect(crew.getByRole('button', { name: /^Manage / })).toHaveCount(0)
  await expect(crew.getByRole('button', { name: 'Archive Trip' })).toHaveCount(0)
  await expect(crew.getByRole('button', { name: 'Step down to Member' })).toHaveCount(0)
  await expect(page.getByTestId('invite-member')).toHaveCount(0)
  await expect(page.getByTestId('invitation-list')).toHaveCount(0)
  await expect(crew.getByRole('button', { name: 'Leave Trip' })).toBeVisible()
  expect(calls).not.toContain('list_group_invitations')
})
