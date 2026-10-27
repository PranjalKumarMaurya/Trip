import { expect, test, type Locator, type Page } from '@playwright/test'
import { createTrip as createTripFromHome, signUp } from '../support/trip-frame'

test.skip(process.env.TRIP_SPLIT_LIVE !== '1', 'requires disposable local Supabase stack (npm run test:split:live)')
test.use({ locale: 'en-US', timezoneId: 'Asia/Kolkata' })

// Realtime delivery and the re-read that follows can take a moment.
const live = { timeout: 15_000 }

// An International Trip in INR, so the USD expense below can convert.
const createTrip = (page: Page, name: string) =>
  createTripFromHome(page, { name, destination: 'Goa', international: true, currency: 'INR' })

async function expectBalance(page: Page, heading: string, amount: string) {
  await expect(page.getByRole('heading', { name: heading, exact: true }), `${heading} ${amount}`).toBeVisible(live)
  await expect(page.getByTestId('split-my-balance')).toHaveText(amount, live)
}

const expenseCard = (page: Page, description: string): Locator =>
  page.getByRole('list', { name: 'Expenses' }).getByRole('article', { name: description, exact: true })

test('two members add, settle, edit and delete expenses and see each other’s changes live', async ({ browser }) => {
  test.setTimeout(240_000)
  const ownerContext = await browser.newContext()
  const friendContext = await browser.newContext()
  try {
    // Owner creates the Trip and invites a friend, who signs up and joins.
    const owner = await ownerContext.newPage()
    await owner.goto('/')
    await signUp(owner, 'Owner One', 'split-owner@example.test')
    await createTrip(owner, 'Goa weekend')
    await owner.getByRole('tab', { name: 'Crew' }).click()
    await owner.getByLabel('Friend’s email').fill('split-friend@example.test')
    await owner.getByRole('button', { name: 'Create link' }).click()
    const link = await owner.getByLabel('Invitation link').inputValue()

    const friend = await friendContext.newPage()
    await friend.goto(link)
    await friend.getByRole('button', { name: 'Continue', exact: true }).click()
    await signUp(friend, 'Friend One', 'split-friend@example.test')
    await friend.getByRole('button', { name: 'Confirm and join' }).click()
    await expect(friend.getByTestId('invitation-entry')).toContainText('You joined Goa weekend.')
    await friend.getByRole('button', { name: 'Open Trip' }).click()

    for (const page of [owner, friend]) {
      await page.getByRole('tab', { name: 'Split' }).click()
      await expect(page.getByTestId('split-currency')).toHaveText('AMOUNTS IN INR')
      await expectBalance(page, 'All settled up', '₹0.00')
      await expect(page.getByTestId('expenses-empty')).toBeVisible()
    }

    // Owner adds a 900.00 dinner paid by both (600 + 300), split equally.
    await owner.getByRole('button', { name: 'Add expense' }).click()
    let form = owner.getByRole('dialog', { name: 'Add expense' })
    await form.getByLabel('Description').fill('Dinner')
    await form.getByLabel('Total amount').fill('900')
    await form.getByRole('radio', { name: 'Several people' }).check()
    await form.getByLabel('Paid by Owner One').fill('600')
    await expect(form.getByRole('status').first()).toContainText('₹300.00 left')
    await form.getByLabel('Paid by Friend One').fill('300')
    await expect(form.getByText('Payer amounts match the total.')).toBeVisible()
    await expect(form.getByText('₹450.00 each')).toBeVisible()
    await form.getByRole('button', { name: 'Save expense' }).click()
    await expect(form).toHaveCount(0)
    await expectBalance(owner, 'You’re owed', '₹150.00')
    await expect(expenseCard(owner, 'Dinner')).toContainText('Paid by Owner One and Friend One')
    await expect(owner.getByTestId('split-total-spend')).toHaveText('₹900.00 spent')

    // The friend sees it without reloading and cannot change the owner's expense.
    await expect(expenseCard(friend, 'Dinner')).toContainText('₹900.00', live)
    await expectBalance(friend, 'You owe', '₹150.00')
    await expect(friend.getByRole('button', { name: 'Edit Dinner' })).toHaveCount(0)
    await expect(friend.getByRole('button', { name: 'Delete Dinner' })).toHaveCount(0)

    // The friend records paying the owner back (bookkeeping only).
    await friend.getByRole('button', { name: 'Settle up' }).click()
    const settle = friend.getByRole('dialog', { name: 'Settle up' })
    const suggestion = settle.getByRole('list', { name: 'Suggested payments' }).getByRole('listitem')
    await expect(suggestion).toHaveCount(1)
    await expect(suggestion).toContainText('Friend One pays Owner One')
    await expect(suggestion).toContainText('₹150.00')
    await suggestion.getByRole('button', { name: 'Record payment', exact: true }).click()
    await expect(settle.getByRole('heading', { name: 'Record that Friend One paid Owner One ₹150.00?' })).toBeVisible()
    await settle.getByLabel('Note (optional)').fill('UPI')
    await settle.getByRole('button', { name: 'Confirm payment' }).click()
    await expect(settle.getByRole('status')).toHaveText('Recorded: Friend One paid Owner One ₹150.00.')
    await expect(settle.getByTestId('all-settled')).toBeVisible(live)
    await settle.getByRole('button', { name: 'Done' }).click()
    await expectBalance(friend, 'All settled up', '₹0.00')
    await expectBalance(owner, 'All settled up', '₹0.00')
    await expect(owner.getByRole('list', { name: 'Payments' })).toContainText('Friend One paid Owner One', live)
    await expect(owner.getByRole('list', { name: 'Payments' })).toContainText('UPI · Recorded by Friend One')

    // Owner (the creator) edits the dinner: 1200.00, owner paid 900.
    await expenseCard(owner, 'Dinner').getByRole('button', { name: 'Edit Dinner' }).click()
    form = owner.getByRole('dialog', { name: 'Edit expense' })
    await expect(form.getByLabel('Paid by Friend One')).toHaveValue('300.00')
    await form.getByLabel('Total amount').fill('1200')
    await form.getByLabel('Paid by Owner One').fill('900')
    await expect(form.getByText('₹600.00 each')).toBeVisible()
    await form.getByRole('button', { name: 'Save changes' }).click()
    await expect(form).toHaveCount(0)
    await expectBalance(owner, 'You’re owed', '₹150.00')
    await expect(expenseCard(friend, 'Dinner')).toContainText('₹1,200.00', live)
    await expectBalance(friend, 'You owe', '₹150.00')
    await expect(expenseCard(friend, 'Dinner')).toContainText('edited')

    // A USD expense converts once with a live reference rate, which is then stored.
    await owner.route('https://open.er-api.com/v6/latest/USD', (route) => route.fulfill({
      headers: { 'access-control-allow-origin': '*' },
      json: { result: 'success', time_last_update_utc: 'Tue, 27 Oct 2026 00:02:31 +0000', rates: { INR: 83.123456, USD: 1 } },
    }))
    await owner.getByRole('button', { name: 'Add expense' }).click()
    form = owner.getByRole('dialog', { name: 'Add expense' })
    await form.getByLabel('Description').fill('Museum')
    await form.getByLabel('Total amount').fill('12.34')
    await form.getByLabel('Currency').fill('USD')
    await form.getByRole('button', { name: 'Use live rate' }).click()
    await expect(form.getByLabel('Exchange rate: INR for 1 USD')).toHaveValue('83.123456')
    await expect(form.getByTestId('converted-amount')).toHaveText('= ₹1,025.74')
    await form.getByRole('button', { name: 'Save expense' }).click()
    await expect(form).toHaveCount(0)
    await expect(expenseCard(owner, 'Museum')).toContainText('$12.34')
    await expect(expenseCard(owner, 'Museum')).toContainText('1 USD = 83.123456 INR · live rate from open.er-api.com')
    await expectBalance(owner, 'You’re owed', '₹662.87')
    await expectBalance(friend, 'You owe', '₹662.87')

    // The friend adds, edits and deletes their own expense.
    await friend.getByRole('button', { name: 'Add expense' }).click()
    form = friend.getByRole('dialog', { name: 'Add expense' })
    await form.getByLabel('Description').fill('Taxi')
    await form.getByLabel('Total amount').fill('100')
    await form.getByRole('radio', { name: 'Exact amounts' }).check()
    await form.getByLabel('Share for Owner One').fill('100')
    await form.getByRole('button', { name: 'Save expense' }).click()
    await expect(form).toHaveCount(0)
    await expectBalance(friend, 'You owe', '₹562.87')
    await expenseCard(friend, 'Taxi').getByRole('button', { name: 'Edit Taxi' }).click()
    form = friend.getByRole('dialog', { name: 'Edit expense' })
    await form.getByLabel('Total amount').fill('120')
    await form.getByLabel('Share for Owner One').fill('120')
    await form.getByRole('button', { name: 'Save changes' }).click()
    await expect(form).toHaveCount(0)
    await expectBalance(owner, 'You’re owed', '₹542.87')
    await expenseCard(friend, 'Taxi').getByRole('button', { name: 'Delete Taxi' }).click()
    await expenseCard(friend, 'Taxi').getByRole('button', { name: 'Delete expense' }).click()
    await expect(expenseCard(owner, 'Taxi')).toHaveCount(0, live)
    await expectBalance(owner, 'You’re owed', '₹662.87')

    // Owner deletes both expenses; only the recorded payment is left.
    for (const description of ['Museum', 'Dinner']) {
      await expenseCard(owner, description).getByRole('button', { name: `Delete ${description}` }).click()
      await expenseCard(owner, description).getByRole('button', { name: 'Delete expense' }).click()
      await expect(expenseCard(friend, description)).toHaveCount(0, live)
    }
    await expectBalance(owner, 'You owe', '₹150.00')
    await expectBalance(friend, 'You’re owed', '₹150.00')

    // The friend deletes the payment they recorded; everyone is even again.
    const payments = friend.getByRole('list', { name: 'Payments' })
    await payments.getByRole('button', { name: 'Delete payment: Friend One paid Owner One' }).click()
    await payments.getByRole('button', { name: 'Delete payment', exact: true }).click()
    await expectBalance(friend, 'All settled up', '₹0.00')
    await expectBalance(owner, 'All settled up', '₹0.00')
    await expect(owner.getByTestId('expenses-empty')).toBeVisible()
  } finally {
    await ownerContext.close()
    await friendContext.close()
  }
})
