import { spawnSync } from 'node:child_process'
import { expect, test, type Browser, type Locator, type Page } from '@playwright/test'
import { setTripSettings } from '../support/trip-frame'

test.skip(process.env.TRIP_SPLIT_MODES_LIVE !== '1', 'requires disposable local Supabase stack (npm run test:split:modes:live)')
test.use({ locale: 'en-US', timezoneId: 'Asia/Kolkata' })

// Realtime delivery and the re-read that follows can take a moment.
const live = { timeout: 15_000 }
const shots = process.env.TRIP_SPLIT_SHOTS
// TRIP_SPLIT_SHOTS=<dir> saves the dialogs as screenshots for a visual review.
const shot = async (dialog: Locator, name: string) => { if (shots) await dialog.screenshot({ path: `${shots}/${name}.png` }) }

// --- Setup helpers: sign up, create a Trip, invite and join. Kept small so they
// can follow changes to the signup / Trips home screens. ---

async function signUp(page: Page, name: string, email: string) {
  await page.getByRole('button', { name: 'Create an account' }).click()
  await page.getByLabel('Display name').fill(name)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('LongerPass123!')
  await page.getByRole('button', { name: 'Create account' }).click()
}

async function createTrip(page: Page, name: string) {
  await expect(page.getByTestId('bootstrap-onboarding')).toBeVisible()
  await page.getByLabel('Trip name').fill(name)
  await page.getByLabel('Destination').fill('Goa')
  await page.getByLabel('Start date').fill('2026-11-01')
  await page.getByLabel('End date').fill('2026-11-05')
  await setTripSettings(page, { timezone: 'Asia/Kolkata', currency: 'INR' })
  await page.getByRole('button', { name: 'Create Trip' }).click()
  await page.getByRole('button', { name: 'Open Trip' }).click()
  await expect(page.getByTestId('group-workspace')).toContainText(name)
}

/** The owner invites `email`; a new browser context signs up through the link and opens the Trip. */
async function inviteAndJoin(browser: Browser, owner: Page, tripName: string, name: string, email: string) {
  await owner.getByRole('tab', { name: 'Crew' }).click()
  await owner.getByLabel('Friend’s email').fill(email)
  await owner.getByRole('button', { name: 'Create link' }).click()
  const link = await owner.getByLabel('Invitation link').inputValue()
  const context = await browser.newContext()
  const friend = await context.newPage()
  await friend.goto(link)
  await friend.getByRole('button', { name: 'Continue', exact: true }).click()
  await signUp(friend, name, email)
  await friend.getByRole('button', { name: 'Confirm and join' }).click()
  await expect(friend.getByTestId('invitation-entry')).toContainText(`You joined ${tripName}.`)
  await friend.getByRole('button', { name: 'Open Trip' }).click()
  return { context, friend }
}

/** Stand-in for the Profile screen: set a user's UPI ID directly in the disposable stack. */
function setUpiId(email: string, upiId: string) {
  const result = spawnSync('psql', ['--no-psqlrc', '--quiet', '--set', 'ON_ERROR_STOP=1', '--host', '127.0.0.1',
    '--port', process.env.TRIP_SPLIT_DB_PORT ?? '', '--username', 'postgres', '--dbname', 'postgres'], {
    encoding: 'utf8', env: { ...process.env, PGPASSWORD: 'postgres' },
    input: `UPDATE public.profiles SET upi_id = '${upiId}'
      WHERE auth_user_id = (SELECT id FROM auth.users WHERE email = '${email}');`,
  })
  if (result.status !== 0) throw new Error(`set-upi-id-failed: ${result.stderr}`)
}

// --- Split helpers ---

async function expectBalance(page: Page, heading: string, amount: string) {
  await expect(page.getByRole('heading', { name: heading, exact: true }), `${heading} ${amount}`).toBeVisible(live)
  await expect(page.getByTestId('split-my-balance')).toHaveText(amount, live)
}

const expenseCard = (page: Page, description: string): Locator =>
  page.getByRole('list', { name: 'Expenses' }).getByRole('article', { name: description, exact: true })

test('percent and shares splits, edits, and paying back via a UPI link', async ({ browser }) => {
  test.setTimeout(240_000)
  const ownerContext = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] })
  let friendContext: Awaited<ReturnType<typeof inviteAndJoin>>['context'] | null = null
  try {
    const owner = await ownerContext.newPage()
    await owner.goto('/')
    await signUp(owner, 'Owner One', 'modes-owner@example.test')
    await createTrip(owner, 'Goa weekend')
    const joined = await inviteAndJoin(browser, owner, 'Goa weekend', 'Friend One', 'modes-friend@example.test')
    friendContext = joined.context
    const friend = joined.friend
    for (const page of [owner, friend]) {
      await page.getByRole('tab', { name: 'Split' }).click()
      await expectBalance(page, 'All settled up', '₹0.00')
    }

    // Owner pays a 900.00 dinner split 70/30 by percent.
    await owner.getByRole('button', { name: 'Add expense' }).click()
    let form = owner.getByRole('dialog', { name: 'Add expense' })
    await form.getByLabel('Description').fill('Dinner')
    await form.getByLabel('Total amount').fill('900')
    await form.getByRole('radio', { name: 'Percentages' }).check()
    const summary = form.getByTestId('split-weight-summary')
    await expect(summary).toHaveText('0% of 100% · 100% left')
    await form.getByLabel('Percent for Friend One').fill('30')
    await expect(summary).toHaveText('30% of 100% · 70% left')
    await form.getByLabel('Percent for Owner One').fill('80')
    await expect(summary).toHaveText('110% of 100% · 10% too much')
    await form.getByLabel('Percent for Owner One').fill('70')
    await expect(summary).toHaveText('Percentages add up to 100%.')
    const percentList = form.getByRole('list', { name: 'Percent for each person' })
    await expect(percentList).toContainText('₹630.00')
    await expect(percentList).toContainText('₹270.00')
    await shot(form, '1-percent-form')
    await form.getByRole('button', { name: 'Save expense' }).click()
    await expect(form).toHaveCount(0)
    await expect(expenseCard(owner, 'Dinner')).toContainText('split by percent between 2')
    await expectBalance(owner, 'You’re owed', '₹270.00')
    await expectBalance(friend, 'You owe', '₹270.00')

    // The friend pays a 4500.00 villa by shares: 3 for the owner's group, 2 for theirs.
    await friend.getByRole('button', { name: 'Add expense' }).click()
    form = friend.getByRole('dialog', { name: 'Add expense' })
    await form.getByLabel('Description').fill('Villa')
    await form.getByLabel('Total amount').fill('4500')
    await form.getByRole('radio', { name: 'Shares' }).check()
    // Everyone in the equal split starts at one share.
    await expect(form.getByLabel('Shares for Owner One')).toHaveValue('1')
    await expect(form.getByLabel('Shares for Friend One')).toHaveValue('1')
    await expect(form.getByTestId('split-weight-summary')).toHaveText('2 shares · ₹2,250.00 per share')
    await form.getByLabel('Shares for Owner One').fill('3')
    await form.getByLabel('Shares for Friend One').fill('2')
    await expect(form.getByTestId('split-weight-summary')).toHaveText('5 shares · ₹900.00 per share')
    await expect(form.getByRole('list', { name: 'Shares for each person' })).toContainText('₹2,700.00')
    await shot(form, '2-shares-form')
    await form.getByRole('button', { name: 'Save expense' }).click()
    await expect(form).toHaveCount(0)
    await expect(expenseCard(friend, 'Villa')).toContainText('split by shares between 2')
    await expectBalance(friend, 'You’re owed', '₹2,430.00')
    await expectBalance(owner, 'You owe', '₹2,430.00')

    // Editing restores the mode and the inputs; the friend changes the owner to 2 shares.
    await expenseCard(friend, 'Villa').getByRole('button', { name: 'Edit Villa' }).click()
    form = friend.getByRole('dialog', { name: 'Edit expense' })
    await expect(form.getByRole('radio', { name: 'Shares' })).toBeChecked()
    await expect(form.getByLabel('Shares for Owner One')).toHaveValue('3')
    await expect(form.getByLabel('Shares for Friend One')).toHaveValue('2')
    await form.getByLabel('Shares for Owner One').fill('2')
    await expect(form.getByTestId('split-weight-summary')).toHaveText('4 shares · ₹1,125.00 per share')
    await form.getByRole('button', { name: 'Save changes' }).click()
    await expect(form).toHaveCount(0)
    await expectBalance(owner, 'You owe', '₹1,980.00')
    await expenseCard(owner, 'Villa').getByText('Breakdown').click()
    await expect(expenseCard(owner, 'Villa')).toContainText('Owner One’s share (2 shares)')

    await expenseCard(owner, 'Dinner').getByRole('button', { name: 'Edit Dinner' }).click()
    form = owner.getByRole('dialog', { name: 'Edit expense' })
    await expect(form.getByRole('radio', { name: 'Percentages' })).toBeChecked()
    await expect(form.getByLabel('Percent for Owner One')).toHaveValue('70')
    await expect(form.getByLabel('Percent for Friend One')).toHaveValue('30')
    await expect(form.getByTestId('split-weight-summary')).toHaveText('Percentages add up to 100%.')
    await form.getByRole('button', { name: 'Cancel' }).click()
    await expect(form).toHaveCount(0)

    // Without a UPI ID there is no link, just a note.
    await owner.getByRole('button', { name: 'Settle up' }).click()
    let settle = owner.getByRole('dialog', { name: 'Settle up' })
    let suggestion = settle.getByRole('list', { name: 'Suggested payments' }).getByRole('listitem')
    await expect(suggestion).toContainText('Owner One pays Friend One')
    await expect(suggestion).toContainText('Friend One hasn’t added a UPI ID.')
    await expect(suggestion.getByRole('link')).toHaveCount(0)
    await settle.getByRole('button', { name: 'Done' }).click()

    // The friend adds a UPI ID; the owner (who owes) now gets a UPI deep link.
    setUpiId('modes-friend@example.test', 'friend.one@okaxis')
    await owner.getByRole('button', { name: 'Settle up' }).click()
    settle = owner.getByRole('dialog', { name: 'Settle up' })
    suggestion = settle.getByRole('list', { name: 'Suggested payments' }).getByRole('listitem')
    const pay = suggestion.getByRole('link', { name: 'Pay ₹1,980.00 via UPI' })
    await expect(pay).toHaveAttribute('href', 'upi://pay?pa=friend.one%40okaxis&pn=Friend%20One&am=1980.00&cu=INR&tn=Goa%20weekend%20settle-up')
    await expect(suggestion.getByTestId('upi-id')).toHaveText('friend.one@okaxis')
    await suggestion.getByRole('button', { name: 'Copy Friend One’s UPI ID' }).click()
    await expect(suggestion.getByRole('button', { name: 'Copy Friend One’s UPI ID' })).toHaveText('Copied')
    expect(await owner.evaluate(() => navigator.clipboard.readText())).toBe('friend.one@okaxis')
    await shot(settle, '3-upi-link')

    // The receiver never sees a pay link for money owed to them.
    await friend.getByRole('button', { name: 'Settle up' }).click()
    const friendSettle = friend.getByRole('dialog', { name: 'Settle up' })
    await expect(friendSettle.getByRole('list', { name: 'Suggested payments' })).toContainText('Owner One pays Friend One')
    await expect(friendSettle.getByRole('link')).toHaveCount(0)
    await friendSettle.getByRole('button', { name: 'Done' }).click()

    // Using the link only asks; "Not yet" records nothing.
    await pay.click()
    await expect(owner).toHaveURL(/127\.0\.0\.1/u)
    const check = suggestion.getByRole('group', { name: 'Did the payment go through?' })
    await expect(check).toBeVisible()
    await expect(check).toContainText('You opened a UPI payment of ₹1,980.00 to Friend One.')
    await shot(settle, '4-upi-check')
    await check.getByRole('button', { name: 'Not yet' }).click()
    await expect(check).toHaveCount(0)
    await expect(pay).toBeVisible()
    await expectBalance(friend, 'You’re owed', '₹1,980.00')

    // Second try: it went through, so the owner records it through the usual confirmation.
    await pay.click()
    await check.getByRole('button', { name: 'Record payment' }).click()
    await expect(settle.getByRole('heading', { name: 'Record that Owner One paid Friend One ₹1,980.00?' })).toBeVisible()
    await expect(settle.getByLabel('Note (optional)')).toHaveValue('UPI')
    await settle.getByRole('button', { name: 'Confirm payment' }).click()
    await expect(settle.getByRole('status')).toHaveText('Recorded: Owner One paid Friend One ₹1,980.00.')
    await expect(settle.getByTestId('all-settled')).toBeVisible(live)
    await settle.getByRole('button', { name: 'Done' }).click()
    await expectBalance(owner, 'All settled up', '₹0.00')
    await expectBalance(friend, 'All settled up', '₹0.00')
    await expect(friend.getByRole('list', { name: 'Payments' })).toContainText('UPI · Recorded by Owner One', live)
  } finally {
    await ownerContext.close()
    await friendContext?.close()
  }
})
