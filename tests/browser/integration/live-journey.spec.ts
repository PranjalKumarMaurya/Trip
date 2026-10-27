import { expect, test, type Page } from '@playwright/test'
import { createTrip as createTripFromHome, expectTripCount, refreshTrips, signUp, switchTrip } from '../support/trip-frame'

test.skip(process.env.TRIP_LIVE_JOURNEY !== '1', 'requires disposable local Supabase stack')

// Signup -> Trips home -> + -> Create Trip -> Open Trip.
const createTrip = (page: Page, name: string, destination: string) => createTripFromHome(page, { name, destination })

test('two real Auth accounts create, invite, join, and stay in their own Groups', async ({ browser }) => {
  const ownerContext = await browser.newContext()
  const friendContext = await browser.newContext()
  try {
    const owner = await ownerContext.newPage()
    await owner.goto('/')
    await signUp(owner, 'Owner One', 'owner-live@example.test')
    await expect(owner.getByTestId('trips-empty')).toBeVisible()
    await createTrip(owner, 'Goa weekend', 'Goa')
    await owner.getByRole('tab', { name: 'Crew' }).click()
    await owner.getByLabel('Friend’s email').fill('friend-live@example.test')
    await owner.getByRole('button', { name: 'Create link' }).click()
    const link = await owner.getByLabel('Invitation link').inputValue()
    expect(new URL(link).hash).toMatch(/^#invite=[0-9a-f]{64}$/)

    const friend = await friendContext.newPage()
    await friend.goto(link)
    await expect(friend.getByTestId('invitation-entry')).toContainText('Goa weekend · Goa')
    await friend.getByRole('button', { name: 'Continue', exact: true }).click()
    await signUp(friend, 'Friend One', 'friend-live@example.test')
    await expect(friend.getByTestId('invitation-entry')).toContainText('Join Goa weekend as a member?')
    await friend.getByRole('button', { name: 'Confirm and join' }).click()
    await expect(friend.getByTestId('invitation-entry')).toContainText('You joined Goa weekend.')
    await friend.getByRole('button', { name: 'Open Trip' }).click()
    await expect(friend.getByTestId('group-workspace')).toContainText('Goa weekend')
    await friend.getByRole('tab', { name: 'Crew' }).click()
    await expect(friend.getByTestId('invite-member')).toHaveCount(0)

    await createTrip(owner, 'Jaipur weekend', 'Jaipur')
    await expectTripCount(owner, 2)
    await switchTrip(owner, 'Goa weekend')
    await expect(owner.getByTestId('group-workspace').getByRole('heading', { name: 'Goa weekend' })).toBeVisible()
    await switchTrip(owner, 'Jaipur weekend')
    await expect(owner.getByTestId('group-workspace').getByRole('heading', { name: 'Jaipur weekend' })).toBeVisible()
    await refreshTrips(friend)
    await expectTripCount(friend, 1)
  } finally {
    await ownerContext.close()
    await friendContext.close()
  }
})
