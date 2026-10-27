import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

test.skip(process.env.TRIP_LIVE_JOURNEY !== '1' || process.env.TRIP_VERIFY_EMAIL !== '1',
  'requires disposable local Supabase stack with mailbox confirmation')

// The local Supabase stack's test mailbox is Mailpit: search by recipient, then read each message.
async function confirmationLink(request: APIRequestContext, email: string): Promise<string> {
  const mailboxBase = 'http://127.0.0.1:58524'
  let diagnostic = 'no-mailbox-response'
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const search = await request.get(`${mailboxBase}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`)
    diagnostic = `search-${search.status()}`
    if (search.ok()) {
      const listing: unknown = await search.json()
      const messages = listing && typeof listing === 'object' && 'messages' in listing && Array.isArray(listing.messages)
        ? listing.messages as unknown[]
        : []
      diagnostic = `messages-${messages.length}`
      for (const message of messages) {
        if (!message || typeof message !== 'object' || !('ID' in message) || typeof message.ID !== 'string') continue
        const detail = await request.get(`${mailboxBase}/api/v1/message/${encodeURIComponent(message.ID)}`)
        diagnostic = `detail-${detail.status()}`
        if (!detail.ok()) continue
        const body = JSON.stringify(await detail.json()).replace(/&amp;/gu, '&').replace(/\\u0026/gu, '&')
        const candidates = body.match(/https?:\/\/[^\s"<>\\]+/gu) ?? []
        diagnostic = `links-${candidates.length}`
        for (const candidate of candidates) {
          const link = candidate.replace(/\\\//gu, '/')
          try {
            const parsed = new URL(link)
            if (parsed.hostname === '127.0.0.1' && parsed.port === '58521'
              && parsed.pathname === '/auth/v1/verify') return parsed.toString()
          } catch { /* ignore non-URL message text */ }
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`confirmation-link-unavailable-${diagnostic}`)
}

async function signUp(page: Page, name: string, email: string) {
  await page.getByRole('button', { name: 'Create an account' }).click()
  await page.getByLabel('Display name').fill(name)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('LongerPass123!')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByTestId('auth-entry')).toContainText('Check your email')
}

test('verification emails return Owner and invited friend to the right journey', async ({ browser, request }) => {
  const ownerEmail = 'owner-verify@example.test'
  const friendEmail = 'friend-verify@example.test'
  const ownerContext = await browser.newContext()
  const friendContext = await browser.newContext()
  try {
    const owner = await ownerContext.newPage()
    await owner.goto('/')
    await signUp(owner, 'Owner Verified', ownerEmail)
    await owner.goto(await confirmationLink(request, ownerEmail))
    await expect(owner.getByTestId('bootstrap-onboarding')).toBeVisible()
    await owner.getByLabel('Trip name').fill('Verified Goa')
    await owner.getByLabel('Destination').fill('Goa')
    await owner.getByLabel('Start date').fill('2026-11-01')
    await owner.getByLabel('End date').fill('2026-11-05')
    await owner.getByLabel('IANA timezone').fill('Asia/Kolkata')
    await owner.getByLabel('Accounting currency').fill('INR')
    await owner.getByLabel('Display currencies').fill('INR')
    await owner.getByRole('button', { name: 'Create Group' }).click()
    await expect(owner.getByTestId('bootstrap-success-state-a')).toBeVisible()
    await owner.getByRole('button', { name: 'Continue to Trip' }).click()
    await owner.getByRole('tab', { name: 'Crew' }).click()
    await owner.getByLabel('Friend’s email').fill(friendEmail)
    await owner.getByRole('button', { name: 'Create link' }).click()
    const invitationLink = await owner.getByLabel('Invitation link').inputValue()

    const friend = await friendContext.newPage()
    await friend.goto(invitationLink)
    await expect(friend.getByTestId('invitation-entry')).toContainText('Verified Goa · Goa')
    await friend.getByRole('button', { name: 'Continue', exact: true }).click()
    await signUp(friend, 'Friend Verified', friendEmail)
    const verificationTab = await friendContext.newPage()
    await verificationTab.goto(await confirmationLink(request, friendEmail))
    await expect(verificationTab.getByTestId('invitation-entry')).toContainText('Join as an ordinary Member?')
    await verificationTab.getByRole('button', { name: 'Confirm and join' }).click()
    await expect(verificationTab.getByTestId('invitation-entry')).toContainText('Joined successfully')
    await verificationTab.getByRole('button', { name: 'Close invitation' }).click()
    await expect(verificationTab.getByTestId('group-workspace')).toContainText('Verified Goa')
  } finally {
    await ownerContext.close()
    await friendContext.close()
  }
})
