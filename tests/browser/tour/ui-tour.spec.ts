import { mkdirSync } from 'node:fs'
import { closeTripSwitcher, openTripSwitcher, setTripSettings } from '../support/trip-frame'
import { expect, test, type Page } from '@playwright/test'

// Visual tour: screenshots every main screen with realistic data for UI review.
// Run with `npm run test:ui:tour`; images land in TRIP_TOUR_DIR (default artifacts/ui-tour).
test.skip(process.env.TRIP_UI_TOUR !== '1', 'requires the disposable stack from run-ui-tour.mjs')
test.setTimeout(240_000)

const outDir = process.env.TRIP_TOUR_DIR ?? 'artifacts/ui-tour'
const problems: string[] = []
let index = 0

async function shot(page: Page, name: string) {
  index += 1
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${outDir}/${String(index).padStart(2, '0')}-${name}.png`, fullPage: true })
}

async function step(name: string, action: () => Promise<void>) {
  try {
    await action()
  } catch (error) {
    problems.push(`${name}: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`)
  }
}

function inDays(days: number, time: string) {
  const day = new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)
  return `${day}T${time}`
}

test('tour every screen', async ({ browser }) => {
  mkdirSync(outDir, { recursive: true })
  const ownerContext = await browser.newContext({ timezoneId: 'Asia/Kolkata' })
  const friendContext = await browser.newContext({ timezoneId: 'Asia/Kolkata' })
  for (const context of [ownerContext, friendContext]) {
    await context.route('https://open.er-api.com/**', (route) => route.fulfill({
      json: { result: 'success', base_code: 'INR', time_last_update_unix: Math.floor(Date.now() / 1000), rates: { INR: 1, IDR: 188.68, USD: 0.012, EUR: 0.011 } },
    }))
  }
  const owner = await ownerContext.newPage()

  await step('auth', async () => {
    await owner.goto('/')
    await expect(owner.getByRole('button', { name: 'Create an account' })).toBeVisible()
    await shot(owner, 'sign-in')
    await owner.getByRole('button', { name: 'Forgot password?' }).click()
    await shot(owner, 'forgot-password')
    await owner.goto('/')
    await owner.getByRole('button', { name: 'Create an account' }).click()
    await shot(owner, 'create-account')
    await owner.getByLabel('Display name').fill('Partha')
    await owner.getByLabel('Email').fill('partha@example.test')
    await owner.getByLabel('Password').fill('LongerPass123!')
    await owner.getByRole('button', { name: 'Create account' }).click()
  })

  await step('onboarding', async () => {
    await expect(owner.getByTestId('bootstrap-onboarding')).toBeVisible()
    await shot(owner, 'onboarding-empty')
    await owner.getByLabel('Trip name').fill('Bali bachelor')
    await owner.getByLabel('Destination').fill('Bali, Indonesia')
    await owner.getByLabel('Start date').fill(inDays(5, '00:00').slice(0, 10))
    await owner.getByLabel('End date').fill(inDays(11, '00:00').slice(0, 10))
    await setTripSettings(owner, { timezone: 'Asia/Makassar', currency: 'INR', alsoShow: ['IDR'] })
    await shot(owner, 'onboarding-filled')
    await owner.getByRole('button', { name: 'Create Trip' }).click()
    await expect(owner.getByRole('button', { name: 'Open Trip' })).toBeVisible()
    await shot(owner, 'trip-created')
    await owner.getByRole('button', { name: 'Open Trip' }).click()
    await expect(owner.getByTestId('group-workspace')).toBeVisible()
  })

  await step('trip-tab', async () => {
    await shot(owner, 'trip-empty')
    await owner.getByRole('button', { name: 'Add event' }).click()
    const dialog = owner.getByRole('dialog', { name: 'Add event' })
    await shot(owner, 'trip-add-event-dialog')
    await dialog.getByLabel('Type').selectOption('flight')
    await dialog.getByLabel('Title', { exact: true }).fill('IndiGo to Bali')
    await dialog.getByLabel('Starts', { exact: true }).fill(inDays(5, '06:15'))
    await dialog.getByRole('button', { name: 'Add event' }).click()
    await expect(dialog).toHaveCount(0)
    await owner.getByRole('button', { name: 'Add event' }).click()
    await dialog.getByLabel('Type').selectOption('hotel')
    await dialog.getByLabel('Title', { exact: true }).fill('W Bali – Seminyak')
    await dialog.getByLabel('Starts', { exact: true }).fill(inDays(5, '15:00'))
    await dialog.getByRole('button', { name: 'Add event' }).click()
    await expect(dialog).toHaveCount(0)
    await shot(owner, 'trip-with-events')
  })

  await step('todos-tab', async () => {
    await owner.getByRole('tab', { name: 'Todos' }).click()
    await shot(owner, 'todos-empty')
    for (const title of ['Book airport transfer', 'Buy sunscreen', 'Exchange cash']) {
      await owner.getByLabel(/new todo|add a todo|todo title/i).first().fill(title)
      await owner.keyboard.press('Enter')
    }
    await owner.getByRole('checkbox').first().check()
    await shot(owner, 'todos-with-items')
  })

  await step('split-tab', async () => {
    await owner.getByRole('tab', { name: 'Split' }).click()
    await shot(owner, 'split-empty')
    await owner.getByRole('button', { name: 'Add expense' }).click()
    const form = owner.getByRole('dialog', { name: 'Add expense' })
    await form.getByLabel('Description').fill('Beach club dinner')
    await form.getByLabel('Total amount').fill('4500')
    await shot(owner, 'split-add-expense-dialog')
    await form.getByRole('button', { name: 'Save expense' }).click()
    await expect(form).toHaveCount(0)
    await shot(owner, 'split-with-expense')
  })

  await step('scan-tab', async () => {
    await owner.getByRole('tab', { name: 'Scan' }).click()
    await shot(owner, 'scan')
  })

  await step('fx-tab', async () => {
    await owner.getByRole('tab', { name: 'FX' }).click()
    await shot(owner, 'fx')
  })

  let link = ''
  await step('crew-tab', async () => {
    await owner.getByRole('tab', { name: 'Crew' }).click()
    await shot(owner, 'crew-owner')
    await owner.getByLabel('Friend’s email').fill('astitva@example.test')
    await owner.getByRole('button', { name: 'Create link' }).click()
    link = await owner.getByLabel('Invitation link').inputValue()
    await shot(owner, 'crew-invite-link')
  })

  await step('frame', async () => {
    await openTripSwitcher(owner)
    await shot(owner, 'trips-sheet')
    await closeTripSwitcher(owner)
    await owner.getByRole('button', { name: 'Account', exact: true }).click()
    await shot(owner, 'account-menu')
    await owner.keyboard.press('Escape')
    await expect(owner.getByTestId('account-sheet')).toHaveCount(0)
  })

  const friend = await friendContext.newPage()
  await step('friend-join', async () => {
    await friend.goto(link)
    await expect(friend.getByTestId('invitation-entry')).toBeVisible()
    await shot(friend, 'invite-entry-signed-out')
    await friend.getByRole('button', { name: 'Continue', exact: true }).click()
    await shot(friend, 'invite-auth')
    await friend.getByRole('button', { name: 'Create an account' }).click()
    await friend.getByLabel('Display name').fill('Astitva')
    await friend.getByLabel('Email').fill('astitva@example.test')
    await friend.getByLabel('Password').fill('LongerPass123!')
    await friend.getByRole('button', { name: 'Create account' }).click()
    await expect(friend.getByRole('button', { name: 'Confirm and join' })).toBeVisible()
    await shot(friend, 'invite-confirm-join')
    await friend.getByRole('button', { name: 'Confirm and join' }).click()
    await expect(friend.getByTestId('invitation-entry')).toContainText('You joined Bali bachelor.')
    await shot(friend, 'invite-joined')
    await friend.getByRole('button', { name: 'Open Trip' }).click()
    await expect(friend.getByTestId('group-workspace')).toBeVisible()
    await shot(friend, 'friend-trip')
    await friend.getByRole('tab', { name: 'Split' }).click()
    await shot(friend, 'friend-split')
    await friend.getByRole('tab', { name: 'Crew' }).click()
    await shot(friend, 'friend-crew')
  })

  await step('owner-after-join', async () => {
    await owner.getByRole('button', { name: 'Refresh crew' }).click().catch(() => undefined)
    await shot(owner, 'crew-owner-with-friend')
  })

  await ownerContext.close()
  await friendContext.close()
  console.log(JSON.stringify({ screenshots: index, problems }))
})
