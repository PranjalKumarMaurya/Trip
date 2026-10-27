import { expect, test, type Locator, type Page } from '@playwright/test'
import { setTripSettings } from '../support/trip-frame'

// Real stack: two Auth accounts in one Trip, itinerary and shared todos kept
// live between them over Supabase Realtime. Run with `npm run test:trip:live`.
test.skip(process.env.TRIP_TODOS_LIVE !== '1', 'requires the disposable stack from run-trip-todos-live.mjs')
test.setTimeout(180_000)

const TRIP_ZONE = 'Asia/Makassar' // UTC+8
const LIVE = { timeout: 15_000 }

/** "YYYY-MM-DDTHH:mm" for `days` from now at `time`, in `timeZone`. */
function wallClock(days: number, time: string, timeZone: string) {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(Date.now() + days * 86_400_000))
  return `${day}T${time}`
}

async function signUp(page: Page, name: string, email: string) {
  await page.getByRole('button', { name: 'Create an account' }).click()
  await page.getByLabel('Display name').fill(name)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('LongerPass123!')
  await page.getByRole('button', { name: 'Create account' }).click()
}

async function createTrip(page: Page) {
  await expect(page.getByTestId('bootstrap-onboarding')).toBeVisible()
  await page.getByLabel('Trip name').fill('Bali bachelor')
  await page.getByLabel('Destination').fill('Bali')
  await page.getByLabel('Start date').fill('2026-11-01')
  await page.getByLabel('End date').fill('2026-11-08')
  await setTripSettings(page, { timezone: TRIP_ZONE, currency: 'IDR', alsoShow: ['INR'] })
  await page.getByRole('button', { name: 'Create Trip' }).click()
  await page.getByRole('button', { name: 'Open Trip' }).click()
  await expect(page.getByTestId('group-workspace')).toContainText('Bali bachelor')
}

const card = (page: Page, title: string) => page.getByTestId('trip-event').filter({ has: page.getByRole('heading', { name: title }) })
const todo = (list: Locator, title: string) => list.getByTestId('todo-row').filter({ hasText: title })

async function addEvent(page: Page, fields: Record<string, string>, people: string[] = []) {
  await page.getByRole('button', { name: 'Add event' }).click()
  const dialog = page.getByRole('dialog', { name: 'Add event' })
  await dialog.getByLabel('Type').selectOption(fields.Type)
  for (const [label, value] of Object.entries(fields)) {
    if (label !== 'Type') await dialog.getByLabel(label, { exact: true }).fill(value)
  }
  for (const person of people) await dialog.getByRole('checkbox', { name: person }).check()
  await dialog.getByRole('button', { name: 'Add event' }).click()
  await expect(dialog).toHaveCount(0)
}

test('two members share a live itinerary and todo list', async ({ browser }) => {
  // The owner reads the itinerary from India, the friend from Bali (the Trip timezone).
  const ownerContext = await browser.newContext({ timezoneId: 'Asia/Kolkata' })
  const friendContext = await browser.newContext({ timezoneId: TRIP_ZONE })
  try {
    const owner = await ownerContext.newPage()
    await owner.goto('/')
    await signUp(owner, 'Owner One', 'owner-trip@example.test')
    await createTrip(owner)

    await owner.getByRole('tab', { name: 'Crew' }).click()
    await owner.getByLabel('Friend’s email').fill('friend-trip@example.test')
    await owner.getByRole('button', { name: 'Create link' }).click()
    const link = await owner.getByLabel('Invitation link').inputValue()

    const friend = await friendContext.newPage()
    await friend.goto(link)
    await friend.getByRole('button', { name: 'Continue', exact: true }).click()
    await signUp(friend, 'Friend One', 'friend-trip@example.test')
    await friend.getByRole('button', { name: 'Confirm and join' }).click()
    await expect(friend.getByTestId('invitation-entry')).toContainText('You joined Bali bachelor.')
    await friend.getByRole('button', { name: 'Open Trip' }).click()
    await expect(friend.getByTestId('group-workspace')).toContainText('Bali bachelor')

    // ---- Trip tab ---------------------------------------------------------
    // Reload so the owner's roster includes the friend who just joined.
    await owner.reload()
    for (const page of [owner, friend]) {
      await page.getByRole('tab', { name: 'Trip' }).click()
      await expect(page.getByTestId('itinerary-empty')).toBeVisible()
      await expect(page.getByTestId('next-flight')).toContainText('No upcoming flight')
      await expect(page.locator('[data-live-status="live"]')).toBeVisible(LIVE)
    }

    const dinnerAt = wallClock(2, '19:00', TRIP_ZONE)
    await addEvent(owner, {
      Type: 'food', Title: 'Sunset dinner', Starts: dinnerAt, Ends: wallClock(2, '21:30', TRIP_ZONE),
      Location: 'Jimbaran Bay', 'Map link': 'https://maps.example.test/jimbaran', Notes: 'Table for six, ask for the beach side',
    })
    const ownerDinner = card(owner, 'Sunset dinner')
    await expect(ownerDinner).toHaveAttribute('data-status', 'next')
    // Typed as 19:00 Trip time; the owner's own clock (India, UTC+5:30) reads 16:30.
    await expect(ownerDinner).toContainText('19:00–21:30 trip time')
    await expect(ownerDinner.getByTestId('event-local-time')).toContainText('16:30–19:00 your time')
    await expect(ownerDinner.getByRole('link', { name: 'Open map for Sunset dinner' })).toHaveAttribute('href', 'https://maps.example.test/jimbaran')
    await ownerDinner.getByRole('button', { name: 'Sunset dinner', exact: true }).click()
    await expect(ownerDinner).toContainText('Table for six, ask for the beach side')

    // The friend sees it without reloading, and only in Trip time (same clock).
    const friendDinner = card(friend, 'Sunset dinner')
    await expect(friendDinner).toBeVisible(LIVE)
    await expect(friendDinner).toContainText('19:00–21:30 trip time')
    await expect(friendDinner.getByTestId('event-local-time')).toHaveCount(0)

    await addEvent(owner, {
      Type: 'flight', Title: 'Fly home', Starts: wallClock(3, '10:05', TRIP_ZONE),
      'Departure airport code': 'dps', 'Arrival airport code': 'bom', 'Flight number': '6E 1602', Airline: 'IndiGo', Terminal: 'I',
    }, ['Friend One'])
    for (const page of [owner, friend]) {
      const nextFlight = page.getByTestId('next-flight')
      await expect(nextFlight).toContainText('Fly home', LIVE)
      await expect(nextFlight).toContainText('DPS')
      await expect(nextFlight).toContainText('BOM')
      await expect(nextFlight.getByTestId('next-flight-countdown')).toHaveText(/^Departs in \d+d \d{2}h \d{2}m \d{2}s$/u)
      await expect(card(page, 'Fly home').getByTestId('event-flight')).toContainText('DPS → BOM · IndiGo · 6E 1602 · Terminal I')
      await expect(card(page, 'Fly home').getByTestId('event-audience')).toHaveText('For Friend One', LIVE)
    }
    await expect(card(friend, 'Sunset dinner')).toHaveAttribute('data-status', 'next')
    await expect(card(friend, 'Fly home')).toHaveAttribute('data-status', 'upcoming')

    // The friend edits the owner's event; the owner sees the change live.
    await card(friend, 'Sunset dinner').getByRole('button', { name: 'Edit Sunset dinner' }).click()
    const editDialog = friend.getByRole('dialog', { name: 'Edit event' })
    await expect(editDialog.getByLabel('Starts')).toHaveValue(dinnerAt)
    await editDialog.getByLabel('Title').fill('Seafood at Jimbaran')
    await editDialog.getByRole('button', { name: 'Save changes' }).click()
    await expect(editDialog).toHaveCount(0)
    await expect(card(owner, 'Seafood at Jimbaran')).toBeVisible(LIVE)
    await expect(card(owner, 'Sunset dinner')).toHaveCount(0)

    // Both edit the same event at once: the later save is told, not silently applied.
    await card(owner, 'Seafood at Jimbaran').getByRole('button', { name: 'Edit Seafood at Jimbaran' }).click()
    const ownerEdit = owner.getByRole('dialog', { name: 'Edit event' })
    await ownerEdit.getByLabel('Location', { exact: true }).fill('Jimbaran Beach')
    await card(friend, 'Seafood at Jimbaran').getByRole('button', { name: 'Edit Seafood at Jimbaran' }).click()
    await editDialog.getByLabel('Title').fill('Seafood dinner')
    await editDialog.getByRole('button', { name: 'Save changes' }).click()
    await expect(editDialog).toHaveCount(0)
    await ownerEdit.getByRole('button', { name: 'Save changes' }).click()
    await expect(ownerEdit.getByRole('alert')).toContainText('Someone else changed this event')
    await expect(ownerEdit.getByLabel('Location', { exact: true })).toHaveValue('Jimbaran Beach')
    await ownerEdit.getByRole('button', { name: 'Save mine anyway' }).click()
    await expect(ownerEdit).toHaveCount(0)
    await expect(card(friend, 'Seafood at Jimbaran')).toContainText('Jimbaran Beach', LIVE)
    await expect(card(friend, 'Seafood dinner')).toHaveCount(0)

    // The owner deletes the flight (after confirming); it disappears for the friend.
    await card(owner, 'Fly home').getByRole('button', { name: 'Delete Fly home' }).click()
    await card(owner, 'Fly home').getByRole('button', { name: 'Keep it' }).click()
    await expect(card(owner, 'Fly home')).toBeVisible()
    await card(owner, 'Fly home').getByRole('button', { name: 'Delete Fly home' }).click()
    await card(owner, 'Fly home').getByRole('button', { name: 'Yes, delete' }).click()
    await expect(card(owner, 'Fly home')).toHaveCount(0)
    await expect(card(friend, 'Fly home')).toHaveCount(0, LIVE)
    await expect(friend.getByTestId('next-flight')).toContainText('No upcoming flight')

    // ---- Todos tab --------------------------------------------------------
    for (const page of [owner, friend]) {
      await page.getByRole('tab', { name: 'Todos' }).click()
      await expect(page.getByTestId('todos-empty')).toBeVisible()
      await expect(page.locator('[data-live-status="live"]')).toBeVisible(LIVE)
    }
    const ownerOpen = owner.getByRole('list', { name: 'Open todos' })
    const friendOpen = friend.getByRole('list', { name: 'Open todos' })

    await owner.getByLabel('New todo').fill('Pack sunscreen')
    await owner.getByRole('button', { name: 'Add todo' }).click()
    await expect(todo(ownerOpen, 'Pack sunscreen')).toContainText('Added by you')
    await expect(owner.getByLabel('New todo')).toHaveValue('')
    await expect(todo(friendOpen, 'Pack sunscreen')).toContainText('Added by Owner One', LIVE)

    // The friend is mid-typing when the owner adds a todo: no focus theft, no reset.
    const friendInput = friend.getByLabel('New todo')
    await friendInput.click()
    await friendInput.pressSequentially('Buy SIM')
    await owner.getByLabel('New todo').fill('Book transfer')
    await owner.getByLabel('New todo').press('Enter')
    await expect(todo(friendOpen, 'Book transfer')).toBeVisible(LIVE)
    await expect(friendInput).toBeFocused()
    await expect(friendInput).toHaveValue('Buy SIM')
    await friendInput.pressSequentially(' cards')
    await friendInput.press('Enter')
    await expect(todo(friendOpen, 'Buy SIM cards')).toBeVisible()
    await expect(friendInput).toHaveValue('')
    await expect(friendInput).toBeFocused()
    await expect(todo(ownerOpen, 'Buy SIM cards')).toContainText('Added by Friend One', LIVE)
    await expect(ownerOpen.getByTestId('todo-row')).toHaveText([/Pack sunscreen/u, /Book transfer/u, /Buy SIM cards/u])

    // The friend ticks the owner's todo; the owner sees who did it.
    // click, not check(): the row moves to the completed list as it is ticked.
    await friend.getByRole('checkbox', { name: 'Pack sunscreen' }).click()
    await expect(friend.getByRole('checkbox', { name: 'Pack sunscreen' })).toBeChecked()
    const ownerDone = owner.getByRole('list', { name: 'Completed todos' })
    await expect(todo(ownerDone, 'Pack sunscreen')).toContainText('Done by Friend One', LIVE)
    await expect(owner.getByRole('checkbox', { name: 'Pack sunscreen' })).toBeChecked()

    // The owner is renaming a todo when the friend renames it first: the owner's
    // draft and focus survive, the change is pointed out, and saving asks first.
    await todo(ownerOpen, 'Book transfer').getByRole('button', { name: 'Rename Book transfer' }).click()
    const ownerRename = owner.getByLabel('Todo title')
    await ownerRename.fill('Book airport transfer (6 people)')
    await todo(friendOpen, 'Book transfer').getByRole('button', { name: 'Rename Book transfer' }).click()
    await friend.getByLabel('Todo title').fill('Book transfer, van')
    await friend.getByLabel('Todo title').press('Enter')
    await expect(todo(friendOpen, 'Book transfer, van')).toBeVisible()
    await expect(ownerOpen.getByRole('status')).toHaveText('Someone else changed this to “Book transfer, van”.', LIVE)
    await expect(ownerRename).toBeFocused()
    await expect(ownerRename).toHaveValue('Book airport transfer (6 people)')
    await ownerRename.press('Enter')
    await expect(ownerOpen.getByRole('alert')).toContainText('Not saved: someone else changed this')
    await ownerOpen.getByRole('button', { name: 'Save mine anyway' }).click()
    await expect(todo(ownerOpen, 'Book airport transfer (6 people)')).toBeVisible()
    await expect(todo(friendOpen, 'Book airport transfer (6 people)')).toBeVisible(LIVE)

    // Clear completed by the owner; the friend's completed block goes away.
    await owner.getByRole('button', { name: 'Clear completed' }).click()
    await expect(owner.getByRole('list', { name: 'Completed todos' })).toHaveCount(0)
    await expect(friend.getByRole('list', { name: 'Completed todos' })).toHaveCount(0, LIVE)
    await expect(friend.getByRole('checkbox', { name: 'Pack sunscreen' })).toHaveCount(0)

    // The friend deletes a todo; it leaves the owner's list.
    await todo(friendOpen, 'Buy SIM cards').getByRole('button', { name: 'Delete Buy SIM cards' }).click()
    await expect(todo(ownerOpen, 'Buy SIM cards')).toHaveCount(0, LIVE)
    await expect(ownerOpen.getByTestId('todo-row')).toHaveText([/Book airport transfer \(6 people\)/u])
  } finally {
    await ownerContext.close()
    await friendContext.close()
  }
})
