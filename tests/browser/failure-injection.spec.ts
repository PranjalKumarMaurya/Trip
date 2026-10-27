import { expect, test } from '@playwright/test'

const localBrowserHost = `127.0.0.1:${process.env.TRIP_WEB_PORT ?? '4173'}`
const participantLabels = ['Partha', 'Astitva', 'Vaibhav', 'Suryansh', 'Bittu']
const approvedPlaceholders = [
  'Participant A',
  'Participant B',
  'Participant C',
  'Participant D',
  'Participant E',
  'Synthetic test content',
]

function assertSyntheticBrowserScreenshotText(value: string) {
  if (
    participantLabels.some((label) => value.includes(label)) ||
    /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/.test(value) ||
    /https?:\/\//i.test(value)
  ) {
    throw new Error('controlled browser screenshot page retained unsafe visible text')
  }

  const visibleLines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (
    visibleLines.some((line) => !approvedPlaceholders.includes(line)) ||
    !approvedPlaceholders.every((label) => visibleLines.includes(label))
  ) {
    throw new Error('controlled browser screenshot page is not the approved synthetic redaction set')
  }
}

test.describe.configure({ retries: 0 })
test.use({ screenshot: 'off' })

test('IR-001 controlled browser failure retains a screenshot artifact', async ({ page }) => {
  test.skip(
    process.env.IR001_BROWSER_FAILURE_INJECTION !== 'enabled',
    'Controlled failure injection is disabled outside the evidence command.',
  )

  await page.route('**/*', async (route) => {
    if (new URL(route.request().url()).host === localBrowserHost) {
      await route.continue()
      return
    }

    await route.abort('blockedbyclient')
  })
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  const screenshotPath = process.env.IR001_BROWSER_SAFE_SCREENSHOT_PATH
  if (!screenshotPath) {
    throw new Error('controlled browser failure requires an exact temporary screenshot path')
  }

  await page.evaluate(
    ({ participantLabels, placeholders }) => {
      const replacements = new Map([
        ...participantLabels.map((label: string, index: number): [string, string] => [
          label,
          placeholders[index] ?? placeholders[placeholders.length - 1],
        ]),
      ])
      const textNodes = []
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) {
        if (walker.currentNode.nodeValue?.trim()) {
          textNodes.push(walker.currentNode)
        }
      }
      for (const node of textNodes) {
        const text = node.nodeValue?.trim() ?? ''
        node.nodeValue = replacements.get(text) ?? placeholders[placeholders.length - 1]
      }
    },
    {
      participantLabels,
      placeholders: approvedPlaceholders,
    },
  )

  const redactedText = await page.locator('body').innerText()
  assertSyntheticBrowserScreenshotText(redactedText)
  await page.screenshot({ path: screenshotPath })

  await expect(page.getByTestId('ir001-controlled-failure-sentinel')).toBeVisible()
})
