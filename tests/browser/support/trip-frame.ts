import { expect, type Page } from '@playwright/test'

// Shared steps for the app frame (Create Trip form, Trip switcher, account menu),
// so specs do not each depend on how those controls are laid out.

/** Pick the Trip timezone and currency; `alsoShow` adds display currencies beyond the Trip currency. */
export async function setTripSettings(page: Page, { timezone, currency, alsoShow = [] }: {
  timezone: string
  currency: string
  alsoShow?: string[]
}) {
  await page.getByLabel('Timezone').selectOption(timezone)
  await page.getByLabel('Trip currency').selectOption(currency)
  if (!alsoShow.length) return
  await page.getByRole('button', { name: 'More options' }).click()
  for (const code of alsoShow) await page.getByLabel('Also show amounts in').selectOption(code)
}

/** Opens the "Your Trips" sheet and returns the Trip list inside it. */
export async function openTripSwitcher(page: Page) {
  await page.getByRole('button', { name: 'Trips', exact: true }).click()
  const nav = page.getByRole('navigation', { name: 'Choose a Trip' })
  await expect(nav).toBeVisible()
  return nav
}

export async function closeTripSwitcher(page: Page) {
  const sheet = page.getByTestId('trips-sheet')
  await sheet.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(sheet).toHaveCount(0)
}

export async function switchTrip(page: Page, tripName: string) {
  const nav = await openTripSwitcher(page)
  await nav.getByRole('button', { name: tripName, exact: true }).click()
  await expect(page.getByTestId('trips-sheet')).toHaveCount(0)
}

export async function expectTripCount(page: Page, count: number) {
  const nav = await openTripSwitcher(page)
  await expect(nav.getByRole('button')).toHaveCount(count)
  await closeTripSwitcher(page)
}

export async function createAnotherTrip(page: Page) {
  await openTripSwitcher(page)
  await page.getByRole('button', { name: 'Create another Trip' }).click()
}

export async function refreshTrips(page: Page) {
  await page.getByRole('button', { name: 'Account', exact: true }).click()
  await page.getByRole('button', { name: 'Refresh Trips' }).click()
  await expect(page.getByTestId('account-sheet')).toHaveCount(0)
}
