import { expect, test, type Page } from '@playwright/test'

test.skip(process.env.TRIP_LIVE_JOURNEY !== '1', 'requires disposable local Supabase stack')

async function signUp(page: Page, name: string, email: string) {
  await page.getByRole('button', { name: 'Create an account' }).click()
  await page.getByLabel('Display name').fill(name)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('LongerPass123!')
  await page.getByRole('button', { name: 'Create account' }).click()
}

async function createTrip(page: Page, name: string, destination: string) {
  await expect(page.getByTestId('bootstrap-onboarding')).toBeVisible()
  await page.getByLabel('Trip name').fill(name)
  await page.getByLabel('Destination').fill(destination)
  await page.getByLabel('Start date').fill('2026-11-01')
  await page.getByLabel('End date').fill('2026-11-05')
  await page.getByLabel('IANA timezone').fill('Asia/Kolkata')
  await page.getByLabel('Accounting currency').fill('INR')
  await page.getByLabel('Display currencies').fill('INR')
  await page.getByRole('button', { name: 'Create Group' }).click()
  await expect(page.getByTestId('bootstrap-success-state-a')).toContainText(name)
  await page.getByRole('button', { name: 'Continue to Trip' }).click()
  await expect(page.getByTestId('group-workspace-candidate')).toContainText(name)
}

test('two real Auth accounts create, invite, join, and stay in their own Groups', async ({ browser }) => {
  const ownerContext = await browser.newContext()
  const friendContext = await browser.newContext()
  try {
    const owner = await ownerContext.newPage()
    await owner.goto('/')
    await signUp(owner, 'Owner One', 'owner-live@example.test')
    await createTrip(owner, 'Goa weekend', 'Goa')
    await owner.getByLabel('Friend’s email').fill('friend-live@example.test')
    await owner.getByRole('button', { name: 'Create link' }).click()
    const link = await owner.getByLabel('Invitation link').inputValue()
    expect(new URL(link).hash).toMatch(/^#invite=[0-9a-f]{64}$/)

    const friend = await friendContext.newPage()
    await friend.goto(link)
    await expect(friend.getByTestId('invitation-entry')).toContainText('Goa weekend · Goa')
    await friend.getByRole('button', { name: 'Continue', exact: true }).click()
    await signUp(friend, 'Friend One', 'friend-live@example.test')
    await expect(friend.getByTestId('invitation-entry')).toContainText('Join as an ordinary Member?')
    await friend.getByRole('button', { name: 'Confirm and join' }).click()
    await expect(friend.getByTestId('invitation-entry')).toContainText('Joined successfully')
    await friend.getByRole('button', { name: 'Close invitation' }).click()
    await expect(friend.getByTestId('group-workspace-candidate')).toContainText('Goa weekend')
    await expect(friend.getByTestId('invite-member')).toHaveCount(0)

    await owner.getByRole('button', { name: 'Create another Trip' }).click()
    await createTrip(owner, 'Jaipur weekend', 'Jaipur')
    await expect(owner.getByRole('navigation', { name: 'Choose a Trip' }).getByRole('button')).toHaveCount(2)
    await owner.getByRole('navigation', { name: 'Choose a Trip' }).getByRole('button', { name: 'Goa weekend' }).click()
    await expect(owner.getByTestId('group-workspace-candidate').getByRole('heading', { name: 'Goa weekend' })).toBeVisible()
    await owner.getByRole('navigation', { name: 'Choose a Trip' }).getByRole('button', { name: 'Jaipur weekend' }).click()
    await expect(owner.getByTestId('group-workspace-candidate').getByRole('heading', { name: 'Jaipur weekend' })).toBeVisible()
    await friend.getByRole('button', { name: 'Refresh Trips' }).click()
    await expect(friend.getByRole('navigation', { name: 'Choose a Trip' }).getByRole('button')).toHaveCount(1)
  } finally {
    await ownerContext.close()
    await friendContext.close()
  }
})
