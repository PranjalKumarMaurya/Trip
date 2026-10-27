import { expect, test, type Page } from '@playwright/test'

const ownerId = 'a5000000-0000-4000-8000-000000000001'
const friendId = 'a5000000-0000-4000-8000-000000000002'
const groupId = 'b5000000-0000-4000-8000-000000000001'
const proof = 'a'.repeat(64)
const access = (role: 'owner' | 'member') => ({ group_id: groupId, role, trip_name: 'Goa weekend', destination: 'Goa' })

function syntheticSession(accountId: string, email: string) {
  const payload = Buffer.from(JSON.stringify({ sub: accountId, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')
  return {
    access_token: `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`,
    refresh_token: 'synthetic-refresh',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: accountId, aud: 'authenticated', role: 'authenticated', email, app_metadata: {}, user_metadata: {} },
  }
}

async function mockAccount(page: Page, accountId: string, email: string, memberships: () => unknown[]) {
  await page.addInitScript((session) => {
    localStorage.setItem('sb-127-auth-token', JSON.stringify(session))
    localStorage.setItem('sb-127.0.0.1-auth-token', JSON.stringify(session))
  }, syntheticSession(accountId, email))
  await page.route('**/*', async (route) => {
    if (new URL(route.request().url()).host === `127.0.0.1:${process.env.TRIP_WEB_PORT ?? '4173'}`) await route.continue()
    else await route.abort('blockedbyclient')
  })
  await page.route('**/rest/v1/profiles*', (route) => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify([{ id: accountId, display_name: email.split('@')[0] }]),
  }))
  await page.route('**/rest/v1/rpc/get_my_group_access', (route) => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(memberships()),
  }))
}

test('staged owner creates Trip and link; recipient joins after confirmation', async ({ browser }) => {
  // UI wiring only: every Auth/Profile/RPC response below is synthetic.
  let ownerHasGroup = false
  let friendHasGroup = false
  const ownerContext = await browser.newContext()
  const friendContext = await browser.newContext()
  try {
    const owner = await ownerContext.newPage()
    await mockAccount(owner, ownerId, 'owner@example.test', () => ownerHasGroup ? [access('owner')] : [])
    await owner.route('**/rest/v1/rpc/bootstrap_group', async (route) => {
      const request = route.request().postDataJSON() as { request_id: string }
      ownerHasGroup = true
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{
        outcome: 'completed', group_id: groupId, request_id: request.request_id,
      }]) })
    })
    await owner.route('**/rest/v1/rpc/create_invitation', async (route) => {
      const request = route.request().postDataJSON() as { request_id: string; recipient_request: { email: string } }
      expect(request.recipient_request.email).toBe('friend@example.test')
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        outcome: 'created', invitation_id: 'c5000000-0000-4000-8000-000000000001', proof,
        request_id: request.request_id,
      }) })
    })
    await owner.goto('/')
    await expect(owner.getByTestId('bootstrap-onboarding')).toBeVisible()
    await owner.getByLabel('Trip name').fill('Goa weekend')
    await owner.getByLabel('Destination').fill('Goa')
    await owner.getByLabel('Start date').fill('2026-11-01')
    await owner.getByLabel('End date').fill('2026-11-05')
    await owner.getByLabel('IANA timezone').fill('Asia/Kolkata')
    await owner.getByLabel('Accounting currency').fill('INR')
    await owner.getByLabel('Display currencies').fill('INR')
    await owner.getByRole('button', { name: 'Create Group' }).click()
    await expect(owner.getByTestId('bootstrap-success-state-a')).toBeVisible()
    await owner.getByRole('button', { name: 'Continue to Trip' }).click()
    await expect(owner.getByTestId('group-workspace')).toContainText('Goa weekend')
    await owner.getByRole('tab', { name: 'Crew' }).click()
    await owner.getByLabel('Friend’s email').fill('friend@example.test')
    await owner.getByRole('button', { name: 'Create link' }).click()
    const invitationLink = await owner.getByLabel('Invitation link').inputValue()
    expect(new URL(invitationLink).hash).toBe(`#invite=${proof}`)

    const friend = await friendContext.newPage()
    await mockAccount(friend, friendId, 'friend@example.test', () => friendHasGroup ? [access('member')] : [])
    await friend.route('**/rest/v1/rpc/inspect_invitation', (route) => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify({
        outcome: 'ready', trip_name: 'Goa weekend', destination: 'Goa',
        start_date: '2026-11-01', end_date: '2026-11-05', expires_at: '2026-11-08T00:00:00Z',
      }),
    }))
    await friend.route('**/rest/v1/rpc/accept_invitation', async (route) => {
      const request = route.request().postDataJSON() as { request_id: string; invitation_proof: string }
      expect(request.invitation_proof).toBe(proof)
      friendHasGroup = true
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        outcome: 'accepted', group_id: groupId, request_id: request.request_id,
      }) })
    })
    await friend.goto(invitationLink)
    await expect(friend.getByTestId('invitation-entry')).toContainText('Goa weekend · Goa')
    await friend.getByRole('button', { name: 'Confirm and join' }).click()
    await expect(friend.getByTestId('invitation-entry')).toContainText('Joined successfully')
    await friend.getByRole('button', { name: 'Close invitation' }).click()
    await expect(friend.getByTestId('group-workspace')).toContainText('Goa weekend')
    await friend.getByRole('tab', { name: 'Crew' }).click()
    await expect(friend.getByTestId('invite-member')).toHaveCount(0)
  } finally {
    await ownerContext.close()
    await friendContext.close()
  }
})
