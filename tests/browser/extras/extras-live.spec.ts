import { expect, test, type Browser, type Page } from '@playwright/test'

// Real stack seeded by tests/integration/run-extras-live.mjs: a Bali Trip that
// is under way, flights with "who's on this", one member's shared details, and
// a parse limit of one per person. Run with `npm run test:extras:live`.
test.skip(process.env.TRIP_EXTRAS_LIVE !== '1', 'requires the disposable stack from run-extras-live.mjs')
test.setTimeout(180_000)

const TRIP = 'Bali crew'
const PASSWORD = 'LongerPass123!'
const TRIP_ZONE = 'Asia/Makassar'
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')

// ---- Setup helpers (sign-in and opening the Trip; adjust here if that flow changes) ----

async function openContext(browser: Browser, timezoneId: string) {
  const context = await browser.newContext({ timezoneId, permissions: ['clipboard-read', 'clipboard-write'] })
  // Record what the app hands to the native share sheet.
  await context.addInitScript(() => {
    const shared: unknown[] = []
    Object.defineProperty(window, '__shared', { value: shared })
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (data: unknown) => { shared.push(data) } })
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true })
  })
  return context
}

async function signIn(page: Page, email: string) {
  await page.goto('/')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByTestId('group-workspace').getByRole('heading', { name: TRIP })).toBeVisible()
}

const openTab = (page: Page, name: string) => page.getByRole('tab', { name }).click()

/** Optional review screenshots: set TRIP_EXTRAS_SHOTS to a folder. */
async function shot(page: Page, name: string) {
  if (process.env.TRIP_EXTRAS_SHOTS) await page.screenshot({ path: `${process.env.TRIP_EXTRAS_SHOTS}/${name}.png`, fullPage: true })
}

/** "YYYY-MM-DDTHH:mm" for `days` from now at `time` in the Trip timezone. */
function tripWallClock(days: number, time: string) {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: TRIP_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(Date.now() + days * 86_400_000))
  return `${day}T${time}`
}

// ---------------------------------------------------------------------------

const chip = (page: Page, name: string) => page.getByTestId('crew-status-member').filter({ hasText: name })
const memberRow = (page: Page, name: string) =>
  page.getByRole('list', { name: 'Trip members' }).getByRole('listitem').filter({ hasText: name })

test('crew status, invite sharing, crew info and the parse limit on a real stack', async ({ browser }) => {
  const ownerContext = await openContext(browser, 'Asia/Kolkata')
  const friendContext = await openContext(browser, TRIP_ZONE)
  try {
    const owner = await ownerContext.newPage()
    await signIn(owner, 'owner-extras@example.test')

    // ---- Crew status strip on the Trip tab ----------------------------------
    const strip = owner.getByTestId('crew-status')
    await expect(strip).toContainText('the crew, right now')
    await expect(strip.getByTestId('crew-status-member')).toHaveCount(3)
    await expect(strip.getByTestId('crew-status-member').first()).toContainText('Olive (you)')
    await expect(chip(owner, 'Olive')).toHaveAttribute('data-phase', 'in-air')
    await expect(chip(owner, 'Olive')).toContainText('In the air')
    await expect(chip(owner, 'Olive')).toContainText('BOM → DPS')
    await expect(chip(owner, 'Farah')).toHaveAttribute('data-phase', 'at-destination')
    await expect(chip(owner, 'Farah')).toContainText('At Bali')
    await expect(chip(owner, 'Farah')).toContainText(/Flies home in \dd \d+h/u)
    await expect(chip(owner, 'Farah')).toContainText('🦊')
    await expect(chip(owner, 'Sam')).toHaveAttribute('data-phase', 'on-trip')
    await expect(chip(owner, 'Sam')).toContainText('On the trip')
    await expect(chip(owner, 'Sam')).toContainText('Day 3 of 7')
    await shot(owner, 'trip-crew-status')

    // ---- Share an invitation -------------------------------------------------
    await openTab(owner, 'Crew')
    const invite = owner.getByTestId('invite-member')
    await invite.getByLabel('Friend’s email').fill('new-friend@example.test')
    await invite.getByRole('button', { name: 'Create link' }).click()
    const link = await invite.getByLabel('Invitation link').inputValue()
    expect(link).toMatch(/#invite=[0-9a-f]{64}$/u)
    await expect(invite.getByRole('button', { name: 'Copy link' })).toBeVisible()
    await expect(invite.getByRole('button', { name: 'Invite someone else' })).toBeVisible()
    const message = `Join our Trip “${TRIP}”: ${link} — it’s for new-friend@example.test and works once.`
    const whatsApp = invite.getByRole('link', { name: 'Send on WhatsApp' })
    await expect(whatsApp).toHaveAttribute('target', '_blank')
    const href = await whatsApp.getAttribute('href') ?? ''
    expect(href.startsWith('https://wa.me/?text=')).toBe(true)
    expect(new URL(href).searchParams.get('text')).toBe(message)
    await invite.getByRole('button', { name: 'Share…' }).click()
    await expect.poll(() => owner.evaluate(() => (window as unknown as { __shared: unknown[] }).__shared)).toEqual([{
      title: `Join ${TRIP}`, text: `Join our Trip “${TRIP}” — it’s for new-friend@example.test and works once.`, url: link,
    }])
    await invite.getByRole('button', { name: 'Copy link' }).click()
    await expect(invite.getByRole('status')).toHaveText('Link copied. Send it to the email address shown above.')
    expect(await owner.evaluate(() => navigator.clipboard.readText())).toBe(link)
    await shot(owner, 'crew-invite-share')

    // ---- Crew info: what a co-member shared ------------------------------------
    const farah = memberRow(owner, 'Farah Friend')
    const details = farah.getByRole('button', { name: 'Details for Farah Friend' })
    await expect(details).toHaveAttribute('aria-expanded', 'false')
    await details.click()
    await expect(details).toHaveAttribute('aria-expanded', 'true')
    const info = farah.getByTestId('crew-info')
    await expect(info.getByRole('link', { name: 'Call Farah Friend: +91 98765 43210' })).toHaveAttribute('href', 'tel:+919876543210')
    await expect(info).toContainText('Emergency contact')
    await expect(info).toContainText('Mum · +91 98100 00000')
    await expect(info).toContainText('Dietary needs')
    await expect(info).toContainText('Vegetarian, no peanuts')
    await expect(info).toContainText('farah@okaxis')
    await expect(info).toContainText('Shared only with people in this Trip.')
    await info.getByRole('button', { name: 'Copy UPI ID for Farah Friend' }).click()
    await expect(info.getByRole('button', { name: 'Copy UPI ID for Farah Friend' })).toHaveText('Copied')
    expect(await owner.evaluate(() => navigator.clipboard.readText())).toBe('farah@okaxis')
    await shot(owner, 'crew-info')
    // Sam shared nothing, so nothing but the note is shown.
    await memberRow(owner, 'Sam Seaside').getByRole('button', { name: 'Details for Sam Seaside' }).click()
    await expect(memberRow(owner, 'Sam Seaside').getByTestId('crew-info')).toContainText('Sam Seaside hasn’t shared any details yet.')
    await expect(memberRow(owner, 'Sam Seaside').getByTestId('crew-info')).not.toContainText('Phone')
    // Managing the crew is unchanged.
    await expect(owner.getByRole('button', { name: 'Manage Farah Friend' })).toBeVisible()

    // ---- The co-member's own view ----------------------------------------------
    const friend = await friendContext.newPage()
    await signIn(friend, 'friend-extras@example.test')
    await expect(chip(friend, 'Farah')).toContainText('Farah (you)')
    await expect(chip(friend, 'Olive')).toContainText('In the air')
    await openTab(friend, 'Crew')
    await memberRow(friend, 'Farah Friend').getByRole('button', { name: 'Details for Farah Friend (you)' }).click()
    await expect(memberRow(friend, 'Farah Friend').getByTestId('crew-info')).toContainText('Only people in this Trip see what you share.')
    await memberRow(friend, 'Olive Owner').getByRole('button', { name: 'Details for Olive Owner' }).click()
    await expect(memberRow(friend, 'Olive Owner').getByTestId('crew-info')).toContainText('Olive Owner hasn’t shared any details yet.')
    await expect(friend.getByTestId('invite-member')).toHaveCount(0)

    // ---- Parse limit (one automatic read per person) ---------------------------
    await openTab(friend, 'Scan')
    const scan = friend.getByTestId('scan-tab')
    const fileInput = friend.getByLabel('Ticket or booking file')
    const review = friend.getByTestId('scan-review')
    await fileInput.setInputFiles({ name: 'boarding-pass.png', mimeType: 'image/png', buffer: png })
    await friend.getByRole('button', { name: 'Upload and read' }).click()
    await expect(review.getByLabel('Title')).toHaveValue('IndiGo 6E-123 · DEL → GOI')
    await review.getByRole('button', { name: 'Not now' }).click()

    await fileInput.setInputFiles({ name: 'hotel-voucher.png', mimeType: 'image/png', buffer: png })
    await friend.getByRole('button', { name: 'Upload and read' }).click()
    await expect(review.getByRole('status')).toHaveText('You’ve used today’s automatic reads. Enter the details yourself, or try again tomorrow. The document is saved.')
    await expect(review.getByRole('button', { name: 'Try reading again' })).toHaveCount(0)
    await expect(review.getByLabel('Title')).toHaveValue('')
    await shot(friend, 'scan-parse-limit')
    // Manual entry still works.
    await review.getByLabel('Type').selectOption('hotel')
    await review.getByLabel('Title').fill('Villa check-in')
    await review.getByLabel('Starts').fill(tripWallClock(1, '14:00'))
    await review.getByRole('button', { name: 'Add to itinerary' }).click()
    await expect(scan).toContainText('Added to the itinerary: Villa check-in')
    await expect(friend.getByTestId('scan-document').filter({ hasText: 'boarding-pass.png' })).toContainText('Ready to review')
    await expect(friend.getByTestId('scan-document').filter({ hasText: 'hotel-voucher.png' })).toContainText('In itinerary: Villa check-in')
  } finally {
    await ownerContext.close()
    await friendContext.close()
  }
})
