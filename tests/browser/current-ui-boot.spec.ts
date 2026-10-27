import { expect, test } from '@playwright/test'

const localBrowserHost = `127.0.0.1:${process.env.TRIP_WEB_PORT ?? '4173'}`

test.beforeEach(async ({ page }) => {
  await page.route('**/*', async (route) => {
    if (new URL(route.request().url()).host === localBrowserHost) {
      await route.continue()
      return
    }

    await route.abort('blockedbyclient')
  })
})

test('IR-001 current UI baseline boots without external browser traffic', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await expect(page).toHaveTitle('Bali Bachelor Trip 🌴')
  await expect(page.getByTestId('app-root')).toBeVisible()
  await expect(page.getByTestId('persona-picker')).toBeVisible()
})
