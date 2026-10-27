import { expect, test, type Page } from '@playwright/test'
import { createTrip as createTripFromHome, expectTripCount, goToTrips, openTrip, refreshTrips, signUp, switchTrip, tripsHome } from '../support/trip-frame'

test.skip(process.env.TRIP_CREW_LIVE !== '1', 'requires disposable local Supabase stack (npm run test:crew:live)')

// Signup -> Trips home -> + -> Create Trip -> Open Trip.
const createTrip = (page: Page, name: string, destination: string) => createTripFromHome(page, { name, destination })

async function invite(page: Page, email: string) {
  await page.getByLabel('Friend’s email').fill(email)
  await page.getByRole('button', { name: 'Create link' }).click()
  const link = await page.getByLabel('Invitation link').inputValue()
  expect(new URL(link).hash).toMatch(/^#invite=[0-9a-f]{64}$/)
  return link
}

async function joinWithLink(page: Page, link: string) {
  await page.goto(link)
  await expect(page.getByTestId('invitation-entry')).toContainText('Join Goa weekend as a member?')
  await page.getByRole('button', { name: 'Confirm and join' }).click()
  await expect(page.getByTestId('invitation-entry')).toContainText('You joined Goa weekend.')
  await page.getByRole('button', { name: 'Open Trip' }).click()
  await expect(page.getByTestId('group-workspace')).toContainText('Goa weekend')
}

const crew = (page: Page) => page.getByTestId('crew-tab')
const memberRow = (page: Page, name: string) =>
  page.getByRole('list', { name: 'Trip members' }).getByRole('listitem').filter({ hasText: name })

/** Open a person's sheet, choose an action, confirm it, and return the success text. */
async function manage(page: Page, name: string, action: string) {
  await crew(page).getByRole('button', { name: `Manage ${name}` }).click()
  const sheet = page.getByTestId('member-actions-sheet')
  await sheet.getByRole('button', { name: action }).click()
  await expect(sheet.getByRole('button', { name: 'Cancel' })).toBeVisible()
  await sheet.getByRole('button', { name: action }).click()
  await expect(sheet.getByRole('button', { name: 'Done' })).toBeVisible()
  const message = await sheet.getByRole('status').innerText()
  await sheet.getByRole('button', { name: 'Done' }).click()
  await expect(sheet).toHaveCount(0)
  return message
}

/** Confirm a single-action sheet opened by `trigger` and return its success text. */
async function confirmSheet(page: Page, trigger: string, confirm = trigger) {
  await crew(page).getByRole('button', { name: trigger }).click()
  const sheet = page.getByRole('dialog')
  await sheet.getByRole('button', { name: confirm }).click()
  await expect(sheet.getByRole('button', { name: 'Done' })).toBeVisible()
  const message = await sheet.getByRole('status').innerText()
  await sheet.getByRole('button', { name: 'Done' }).click()
  return message
}

test('Owner manages invitations, roles, leaving, removal, archive and restore against a real stack', async ({ browser }) => {
  test.setTimeout(300_000)
  const ownerContext = await browser.newContext()
  const friendContext = await browser.newContext()
  try {
    // Olive creates two Trips. Archiving one keeps her in the other, where she restores it.
    const owner = await ownerContext.newPage()
    await owner.goto('/')
    await signUp(owner, 'Olive Owner', 'olive-crew@example.test')
    await createTrip(owner, 'Goa weekend', 'Goa')
    await createTrip(owner, 'Jaipur weekend', 'Jaipur')
    await owner.getByRole('tab', { name: 'Crew' }).click()
    expect(await confirmSheet(owner, 'Archive Trip')).toContain('Jaipur weekend is archived')
    // The archived Trip closes and the Trips home lists it under Archived Trips.
    await expect(tripsHome(owner)).toBeVisible()
    await expect(tripsHome(owner).getByTestId('trip-card')).toHaveCount(1)
    const archived = owner.getByTestId('archived-trips')
    await expect(archived).toContainText('Jaipur weekend')
    await archived.getByRole('button', { name: 'Restore Jaipur weekend' }).click()
    const restore = owner.getByTestId('restore-trip-sheet')
    await restore.getByRole('button', { name: 'Restore Trip' }).click()
    await expect(restore.getByRole('status')).toHaveText('Jaipur weekend is active again.')
    await restore.getByRole('button', { name: 'Done' }).click()
    await expect(owner.getByTestId('group-workspace').getByRole('heading', { name: 'Jaipur weekend' })).toBeVisible()
    await expectTripCount(owner, 2)
    await expect(owner.getByTestId('archived-trips')).toHaveCount(0)
    await switchTrip(owner, 'Goa weekend')
    await expect(owner.getByTestId('group-workspace').getByRole('heading', { name: 'Goa weekend' })).toBeVisible()

    // Two invitations from the UI; the list shows recipients and status, never the link.
    await owner.getByRole('tab', { name: 'Crew' }).click()
    const farahLink = await invite(owner, 'farah-crew@example.test')
    await owner.getByRole('button', { name: 'Invite someone else' }).click()
    await expect(owner.getByLabel('Invitation link')).toHaveCount(0)
    await invite(owner, 'gita-crew@example.test')
    const pending = owner.getByRole('list', { name: 'Pending invitations' })
    await expect(pending.getByRole('listitem')).toHaveCount(2)
    await expect(owner.getByTestId('invitation-list')).toContainText('2 live links')
    await expect(owner.getByTestId('invitation-list')).not.toContainText(/[0-9a-f]{64}/)

    // Farah joins with her link.
    const friend = await friendContext.newPage()
    await friend.goto(farahLink)
    await expect(friend.getByTestId('invitation-entry')).toContainText('Goa weekend · Goa')
    await friend.getByRole('button', { name: 'Continue', exact: true }).click()
    await signUp(friend, 'Farah Friend', 'farah-crew@example.test')
    await expect(friend.getByTestId('invitation-entry')).toContainText('Join Goa weekend as a member?')
    await friend.getByRole('button', { name: 'Confirm and join' }).click()
    await expect(friend.getByTestId('invitation-entry')).toContainText('You joined Goa weekend.')
    await friend.getByRole('button', { name: 'Open Trip' }).click()
    await expect(friend.getByTestId('group-workspace')).toContainText('Goa weekend')
    await friend.getByRole('tab', { name: 'Crew' }).click()
    await expect(friend.getByTestId('invite-member')).toHaveCount(0)
    await expect(friend.getByTestId('invitation-list')).toHaveCount(0)
    await expect(crew(friend).getByRole('button', { name: /^Manage / })).toHaveCount(0)
    await expect(crew(friend).getByRole('button', { name: 'Archive Trip' })).toHaveCount(0)

    // Olive sees Farah, then revokes Gita's pending invitation.
    await crew(owner).getByRole('button', { name: 'Refresh crew' }).click()
    await expect(memberRow(owner, 'Farah Friend')).toContainText('Member')
    await expect(pending.getByRole('listitem')).toHaveCount(1)
    await owner.getByRole('button', { name: 'Revoke invitation for gita-crew@example.test' }).click()
    const revoke = owner.getByRole('dialog', { name: 'Revoke the invitation for gita-crew@example.test?' })
    await revoke.getByRole('button', { name: 'Revoke invitation' }).click()
    await expect(revoke.getByRole('status')).toHaveText('Invitation revoked. The link no longer works.')
    await revoke.getByRole('button', { name: 'Done' }).click()
    await expect(owner.getByText('No pending invitations.')).toBeVisible()
    await owner.getByText('Past invitations (2)').click()
    const past = owner.getByRole('list', { name: 'Past invitations' })
    await expect(past.getByRole('listitem').filter({ hasText: 'gita-crew@example.test' })).toContainText('Revoked')
    await expect(past.getByRole('listitem').filter({ hasText: 'farah-crew@example.test' })).toContainText('Joined')

    // As the only Owner, Olive is told to hand over before leaving.
    await crew(owner).getByRole('button', { name: 'Leave Trip' }).click()
    const blocked = owner.getByRole('dialog')
    await expect(blocked).toContainText('You are the only Owner')
    await expect(blocked.getByRole('button', { name: 'Leave Trip' })).toHaveCount(0)
    await blocked.getByRole('button', { name: 'Close' }).click()

    // Promote Farah; a second Olive tab opened now keeps that (soon stale) view.
    expect(await manage(owner, 'Farah Friend', 'Make Owner')).toBe('Farah Friend is now an Owner.')
    await expect(memberRow(owner, 'Farah Friend')).toContainText('Owner')
    const staleOwner = await ownerContext.newPage()
    await staleOwner.goto('/')
    await openTrip(staleOwner, 'Goa weekend')
    await staleOwner.getByRole('tab', { name: 'Crew' }).click()
    await expect(memberRow(staleOwner, 'Farah Friend')).toContainText('Owner')

    // Demote Farah back. The stale tab still offers Leave; the server refuses the last Owner.
    expect(await manage(owner, 'Farah Friend', 'Make Member')).toBe('Farah Friend is now a Member.')
    await expect(memberRow(owner, 'Farah Friend')).toContainText('Member')
    await crew(staleOwner).getByRole('button', { name: 'Leave Trip' }).click()
    const staleLeave = staleOwner.getByRole('dialog')
    await staleLeave.getByRole('button', { name: 'Leave Trip' }).click()
    await expect(staleLeave.getByRole('alert')).toHaveText('You are the last Owner. Make another member an Owner, or transfer ownership, before you leave.')
    await staleLeave.getByRole('button', { name: 'Close' }).click()
    await expect(memberRow(staleOwner, 'Farah Friend')).toContainText('Member')
    await staleOwner.close()

    // Farah leaves and loses the Trip; Olive sees her as a former member.
    expect(await confirmSheet(friend, 'Leave Trip')).toBe('You left Goa weekend.')
    await expect(friend.getByTestId('trips-empty')).toBeVisible()
    await expect(friend.getByTestId('archived-trips')).toHaveCount(0)
    await crew(owner).getByRole('button', { name: 'Refresh crew' }).click()
    await expect(memberRow(owner, 'Farah Friend')).toHaveCount(0)
    await expect(owner.getByText('Former members (1)')).toBeVisible()

    // Olive invites Farah back, then transfers ownership to her and becomes a Member.
    await owner.getByRole('button', { name: 'Invite someone else' }).click()
    await joinWithLink(friend, await invite(owner, 'farah-crew@example.test'))
    await crew(owner).getByRole('button', { name: 'Refresh crew' }).click()
    expect(await manage(owner, 'Farah Friend', 'Transfer ownership')).toBe('Farah Friend is now an Owner. You are a Member.')
    await expect(owner.getByTestId('group-workspace')).toContainText('Goa · Member')
    await expect(owner.getByTestId('invite-member')).toHaveCount(0)
    await expect(memberRow(owner, 'Farah Friend')).toContainText('Owner')
    await expect(memberRow(owner, 'Olive Owner')).toContainText('Member')

    // Farah, now the Owner, removes Olive, who keeps only her other Trip.
    await refreshTrips(friend)
    await expect(friend.getByTestId('group-workspace')).toContainText('Goa · Owner')
    await friend.getByRole('tab', { name: 'Crew' }).click()
    expect(await manage(friend, 'Olive Owner', 'Remove from Trip')).toBe('Olive Owner was removed. Their history stays in the Trip.')
    await expect(memberRow(friend, 'Olive Owner')).toHaveCount(0)
    await goToTrips(owner)
    await expectTripCount(owner, 1)
    await openTrip(owner, 'Jaipur weekend')

    // Farah archives her only Trip, lands on the empty Trips home with its restore entry, and restores it.
    expect(await confirmSheet(friend, 'Archive Trip')).toContain('Goa weekend is archived')
    await expect(friend.getByTestId('trips-empty')).toBeVisible()
    const friendArchived = friend.getByTestId('archived-trips')
    await expect(friendArchived).toContainText('Goa weekend')
    await friendArchived.getByRole('button', { name: 'Restore Goa weekend' }).click()
    const friendRestore = friend.getByTestId('restore-trip-sheet')
    await friendRestore.getByRole('button', { name: 'Restore Trip' }).click()
    await expect(friendRestore.getByRole('status')).toHaveText('Goa weekend is active again.')
    await friendRestore.getByRole('button', { name: 'Done' }).click()
    await expect(friend.getByTestId('group-workspace').getByRole('heading', { name: 'Goa weekend' })).toBeVisible()
    await expect(friend.getByTestId('group-workspace')).toContainText('Goa · Owner')
  } finally {
    await ownerContext.close()
    await friendContext.close()
  }
})
