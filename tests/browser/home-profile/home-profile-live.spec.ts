import { expect, test, type Page } from '@playwright/test'
import { TEST_PASSWORD, createTrip, goToTrips, openProfile, openTrip, signUp, tripsHome, workspace } from '../support/trip-frame'

// Real stack (npm run test:home:live): Trips home, Profile, Trip settings, and
// domestic vs International Trips, with two signed-up accounts.
test.skip(process.env.TRIP_HOME_LIVE !== '1', 'requires the disposable stack from run-home-profile-live.mjs')
test.use({ timezoneId: 'Asia/Kolkata', locale: 'en-IN' })
test.setTimeout(300_000)

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')

/** "YYYY-MM-DD", `days` from today in Asia/Kolkata (the Trips' timezone). */
function day(days: number) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(Date.now() + days * 86_400_000))
}

const tabs = (page: Page) => page.getByRole('tablist', { name: 'Trip sections' }).getByRole('tab')
const card = (page: Page, name: string) => tripsHome(page).getByRole('button', { name, exact: true })

async function signIn(page: Page, email: string, password: string) {
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
}

test('Trips home, Profile, Trip settings and domestic vs International Trips', async ({ browser }) => {
  const ownerContext = await browser.newContext()
  const friendContext = await browser.newContext()
  try {
    // ---- Empty Trips home --------------------------------------------------
    const owner = await ownerContext.newPage()
    await owner.goto('/')
    await signUp(owner, 'Olive Owner', 'olive-home@example.test')
    await expect(owner.getByTestId('trips-empty')).toContainText('No Trips yet')
    await expect(owner.getByRole('button', { name: 'Create your first Trip' })).toBeVisible()
    await owner.getByLabel('Have an invite link?').fill('https://example.test/not-an-invite')
    await owner.getByRole('button', { name: 'Open invite' }).click()
    await expect(owner.getByText('That doesn’t look like a Trip invite link.', { exact: false })).toBeVisible()

    // ---- Profile ---------------------------------------------------------------
    await openProfile(owner)
    const profile = owner.getByTestId('profile-screen')
    await expect(profile.getByTestId('profile-email')).toHaveText('olive-home@example.test')
    await expect(profile.getByTestId('app-version')).toHaveText(/^Version \d+\.\d+\.\d+$/u)
    await expect(profile.getByRole('link', { name: 'Help & feedback' })).toHaveAttribute('href', /^mailto:help@example\.test\?subject=/u)
    await profile.getByLabel('Home currency').selectOption('SGD')
    await profile.getByLabel('UPI ID').fill('not a upi')
    await profile.getByRole('button', { name: 'Save details' }).click()
    await expect(profile.getByText('Use a UPI ID like name@okbank.')).toBeVisible()
    await profile.getByLabel('UPI ID').fill('olive@okaxis')
    await expect(profile.getByText('Friends can pay you from Split')).toBeVisible()
    await expect(profile.getByText('Visible only to people in your Trips')).toBeVisible()
    await profile.getByLabel('Phone').fill('+65 9123 4567')
    await profile.getByLabel('Emergency contact').fill('Oscar · +65 9000 0000')
    await profile.getByLabel('Dietary needs or allergies').fill('No peanuts')
    await profile.getByRole('button', { name: 'Save details' }).click()
    await expect(profile.getByRole('status').filter({ hasText: 'Saved.' })).toBeVisible()

    // Emoji avatar, then a photo (private bucket, signed URL), then back to the emoji.
    await profile.getByRole('button', { name: 'Use 🦊 as your avatar' }).click()
    await expect(profile.getByRole('button', { name: 'Use 🦊 as your avatar' })).toHaveAttribute('aria-pressed', 'true')
    await profile.getByLabel('Profile photo file').setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: png })
    await expect(profile.getByText('Photo updated.')).toBeVisible()
    const photo = profile.getByTestId('avatar-editor').locator('img')
    await expect(photo).toHaveAttribute('src', /\/storage\/v1\/object\/sign\/avatars\//u)
    await expect.poll(() => photo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
    await profile.getByRole('button', { name: 'Remove photo' }).click()
    await expect(profile.getByText('Photo removed.')).toBeVisible()
    await expect(photo).toHaveCount(0)
    await profile.getByRole('button', { name: 'Use 🦊 as your avatar' }).click()

    // Change password: the current one is checked first.
    await profile.getByRole('button', { name: 'Change password' }).click()
    const passwordSheet = owner.getByTestId('change-password-sheet')
    await passwordSheet.getByLabel('Current password').fill('WrongPass123!')
    await passwordSheet.getByLabel('New password', { exact: true }).fill('EvenLongerPass456!')
    await passwordSheet.getByLabel('Confirm new password').fill('EvenLongerPass456!')
    await passwordSheet.getByRole('button', { name: 'Change password' }).click()
    await expect(passwordSheet.getByText('That’s not your current password.')).toBeVisible()
    await passwordSheet.getByLabel('Current password').fill(TEST_PASSWORD)
    await passwordSheet.getByRole('button', { name: 'Change password' }).click()
    await expect(passwordSheet.getByRole('status')).toHaveText('Password changed. Use it the next time you sign in.')
    await passwordSheet.getByRole('button', { name: 'Done' }).click()

    // Change email: the confirmation goes to the new address.
    await profile.getByRole('button', { name: 'Change email' }).click()
    const emailSheet = owner.getByTestId('change-email-sheet')
    await emailSheet.getByLabel('New email').fill('olive-home-new@example.test')
    await emailSheet.getByRole('button', { name: 'Send confirmation link' }).click()
    await expect(emailSheet.getByRole('status')).toContainText('olive-home-new@example.test')
    await emailSheet.getByRole('button', { name: 'Done' }).click()

    // ---- Create Trip: domestic by default, home currency ----------------------
    await goToTrips(owner)
    await expect(owner.getByRole('button', { name: 'Profile', exact: true })).toContainText('🦊')
    await tripsHome(owner).getByRole('button', { name: 'Create Trip', exact: true }).click()
    await expect(owner.getByRole('switch', { name: 'International trip?' })).toHaveAttribute('aria-checked', 'false')
    await expect(owner.getByRole('switch', { name: 'International trip?' })).toHaveAccessibleDescription(/SGD/u)
    await expect(owner.getByLabel('Trip currency')).toHaveCount(0)
    await owner.getByRole('button', { name: 'Trips', exact: true }).click()
    await createTrip(owner, { name: 'Goa weekend', destination: 'Goa', startDate: day(5), endDate: day(8) })

    // A domestic Trip has no FX tab and no currency choice in Split.
    await expect(tabs(owner)).toHaveText(['Trip', 'Todos', 'Split', 'Scan', 'Crew'])
    await owner.getByRole('tab', { name: 'Split' }).click()
    await expect(owner.getByTestId('split-currency')).toHaveText('AMOUNTS IN SGD')
    await owner.getByRole('button', { name: 'Add expense' }).click()
    let form = owner.getByRole('dialog', { name: 'Add expense' })
    await expect(form.getByLabel('Total amount')).toBeVisible()
    await expect(form.getByLabel('Currency')).toHaveCount(0)
    await form.getByLabel('Description').fill('Snacks')
    await form.getByLabel('Total amount').fill('40')
    await form.getByRole('button', { name: 'Save expense' }).click()
    await expect(form).toHaveCount(0)

    // ---- Trip settings (Owner) -----------------------------------------------
    await workspace(owner).getByRole('button', { name: 'Trip settings' }).click()
    const settings = owner.getByTestId('trip-settings-sheet')
    await expect(settings.getByLabel('Trip name')).toHaveValue('Goa weekend')
    await settings.getByLabel('Trip name').fill('Goa long weekend')
    await settings.getByLabel('End date').fill(day(9))
    await settings.getByRole('switch', { name: 'International trip?' }).click()
    // Money is recorded, so the Trip currency is locked and says why.
    await expect(settings.getByLabel('Trip currency')).toBeDisabled()
    await expect(settings.getByLabel('Trip currency')).toHaveAccessibleDescription(/Locked: expenses or payments are already recorded in SGD/u)
    await settings.getByRole('button', { name: 'More options' }).click()
    await settings.getByLabel('Also show amounts in').selectOption('INR')
    await settings.getByRole('button', { name: 'Save changes' }).click()
    await expect(settings).toHaveCount(0)
    await expect(workspace(owner).getByRole('heading', { name: 'Goa long weekend', exact: true })).toBeVisible()
    await expect(tabs(owner)).toHaveText(['Trip', 'Todos', 'Split', 'Scan', 'FX', 'Crew'])
    // International now: Split offers other currencies.
    await owner.getByRole('tab', { name: 'Split' }).click()
    await owner.getByRole('button', { name: 'Add expense' }).click()
    form = owner.getByRole('dialog', { name: 'Add expense' })
    await expect(form.getByLabel('Currency')).toHaveValue('SGD')
    await form.getByRole('button', { name: 'Cancel' }).click()

    // ---- More Trips; the home groups them -------------------------------------
    await createTrip(owner, { name: 'Bali crew', destination: 'Bali', startDate: day(-1), endDate: day(3), international: true, currency: 'IDR', alsoShow: ['SGD'] })
    await expect(tabs(owner)).toContainText(['FX'])
    await createTrip(owner, { name: 'Old Pune trip', destination: 'Pune', startDate: day(-20), endDate: day(-15) })
    await goToTrips(owner)
    for (const [section, name] of [['Ongoing', 'Bali crew'], ['Upcoming', 'Goa long weekend'], ['Past', 'Old Pune trip']] as const) {
      await expect(tripsHome(owner).getByRole('region', { name: section }).getByTestId('trip-card')).toHaveText([new RegExp(name, 'u')])
    }
    await expect(card(owner, 'Bali crew')).toHaveAccessibleDescription(/Day 2 of 5 · Owner · 1 person/u)
    await expect(card(owner, 'Goa long weekend')).toHaveAccessibleDescription(/in 5 days · Owner · 1 person/u)
    await expect(card(owner, 'Old Pune trip')).toHaveAccessibleDescription(/Ended .* · Owner/u)

    // ---- A friend joins by pasting the invite link on her empty home ------------
    await openTrip(owner, 'Goa long weekend')
    await owner.getByRole('tab', { name: 'Crew' }).click()
    await owner.getByLabel('Friend’s email').fill('farah-home@example.test')
    await owner.getByRole('button', { name: 'Create link' }).click()
    const link = await owner.getByLabel('Invitation link').inputValue()

    const friend = await friendContext.newPage()
    await friend.goto('/')
    await signUp(friend, 'Farah Friend', 'farah-home@example.test')
    await expect(friend.getByTestId('trips-empty')).toBeVisible()
    await friend.getByLabel('Have an invite link?').fill(link)
    await friend.getByRole('button', { name: 'Open invite' }).click()
    await expect(friend.getByTestId('invitation-entry')).toContainText('Join Goa long weekend as a member?')
    await friend.getByRole('button', { name: 'Confirm and join' }).click()
    await friend.getByRole('button', { name: 'Open Trip' }).click()
    await expect(workspace(friend).getByRole('heading', { name: 'Goa long weekend', exact: true })).toBeVisible()

    // A Member sees read-only Trip details, never the settings form.
    await workspace(friend).getByRole('button', { name: 'Trip details' }).click()
    const details = friend.getByTestId('trip-settings-sheet')
    await expect(details.getByTestId('trip-details')).toContainText('Goa long weekend')
    await expect(details.getByTestId('trip-details')).toContainText('Also shown in')
    await expect(details.getByTestId('trip-details')).toContainText('INR')
    await expect(details.getByRole('textbox')).toHaveCount(0)
    await expect(details.getByRole('button', { name: 'Save changes' })).toHaveCount(0)
    await details.getByRole('button', { name: 'Close' }).click()
    await goToTrips(friend)
    await expect(card(friend, 'Goa long weekend')).toHaveAccessibleDescription(/Member · 2 people/u)

    // ---- Delete account -------------------------------------------------------------
    // Olive is the only Owner of her Trips, so she is told to hand over first.
    await goToTrips(owner)
    await openProfile(owner)
    await owner.getByRole('button', { name: 'Delete account' }).click()
    const blocked = owner.getByTestId('delete-account-blocked')
    await expect(blocked).toContainText('You’re the only Owner')
    await expect(blocked.getByRole('list', { name: 'Trips that need another Owner' }).getByRole('listitem'))
      .toHaveText(['Bali crew', 'Goa long weekend', 'Old Pune trip'])
    await blocked.getByRole('button', { name: 'OK' }).click()

    // Farah deletes her account; she leaves the Trip and can no longer sign in.
    await openProfile(friend)
    await friend.getByTestId('profile-screen').getByRole('button', { name: 'Delete account' }).click()
    const confirm = friend.getByTestId('delete-account-sheet')
    await expect(confirm.getByRole('button', { name: 'Delete my account' })).toBeDisabled()
    await confirm.getByLabel('Type DELETE to confirm').fill('DELETE')
    await confirm.getByRole('button', { name: 'Delete my account' }).click()
    await expect(friend.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    await expect(friend.getByText('Your account was deleted.', { exact: false })).toBeVisible()
    await signIn(friend, 'farah-home@example.test', TEST_PASSWORD)
    await expect(friend.getByText('We could not sign you in.', { exact: false })).toBeVisible()

    await goToTrips(owner)
    await openTrip(owner, 'Goa long weekend')
    await owner.getByRole('tab', { name: 'Crew' }).click()
    await owner.getByRole('button', { name: 'Refresh crew' }).click()
    await expect(owner.getByRole('list', { name: 'Trip members' })).not.toContainText('Farah Friend')
    await goToTrips(owner)
    await expect(card(owner, 'Goa long weekend')).toHaveAccessibleDescription(/Owner · 1 person/u)

    // ---- Sign out from Profile, sign in with the new password --------------------
    await openProfile(owner)
    const currentEmail = (await owner.getByTestId('profile-email').innerText()).trim()
    await owner.getByTestId('profile-screen').getByRole('button', { name: 'Sign out' }).click()
    await expect(owner.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    await signIn(owner, currentEmail, 'EvenLongerPass456!')
    await expect(tripsHome(owner)).toBeVisible()
    await expect(tripsHome(owner).getByTestId('trip-card')).toHaveCount(3)
  } finally {
    await ownerContext.close()
    await friendContext.close()
  }
})
