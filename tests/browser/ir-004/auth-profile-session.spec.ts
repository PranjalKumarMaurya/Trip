import { expect, test, type Page } from '@playwright/test'
import { existsSync, lstatSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const localBrowserHost = '127.0.0.1:4173'
let failures = 0

function syntheticSession(accountId: string) {
  const payload = Buffer.from(JSON.stringify({ sub: accountId, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')
  return {
    access_token: `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`,
    refresh_token: 'synthetic-refresh',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: accountId, aud: 'authenticated', role: 'authenticated', email: 'synthetic@example.test', app_metadata: {}, user_metadata: {} },
  }
}

async function installLinkedAccount(page: Page, accountId: string, profileId: string, displayName: string) {
  await page.addInitScript(({ id, session }) => {
    localStorage.setItem('sb-127-auth-token', JSON.stringify(session))
    localStorage.setItem('sb-127.0.0.1-auth-token', JSON.stringify(session))
    localStorage.setItem('ir004-test-account', id)
  }, { id: accountId, session: syntheticSession(accountId) })
  await page.route('**/rest/v1/profiles*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: profileId, display_name: displayName }]) })
  })
}

test.beforeEach(async ({ page }) => {
  await page.route('**/*', async (route) => {
    if (new URL(route.request().url()).host === localBrowserHost) {
      await route.continue()
      return
    }
    await route.abort('blockedbyclient')
  })
})

test.afterEach(({}, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) failures += 1
})

test('IR-004 valid linked account reaches only workspace-unavailable, never persona or legacy tabs', async ({ page }) => {
  await installLinkedAccount(page, '00000000-0000-4000-8000-0000000004a1', '00000000-0000-4000-8000-0000000004a2', 'Synthetic A')
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await expect(page.getByTestId('workspace-unavailable')).toBeVisible()
  await expect(page.getByTestId('workspace-unavailable')).toContainText('Synthetic A')
  await expect(page.getByTestId('persona-picker')).toHaveCount(0)
  await expect(page.getByTestId('nav-trip')).toHaveCount(0)
})

test('IR-004 browser reload preserves the Auth-derived protected boundary', async ({ page }) => {
  await installLinkedAccount(page, '00000000-0000-4000-8000-0000000004b1', '00000000-0000-4000-8000-0000000004b2', 'Synthetic B')
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('workspace-unavailable')).toContainText('Synthetic B')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('workspace-unavailable')).toContainText('Synthetic B')
  await expect(page.getByTestId('persona-picker')).toHaveCount(0)
})

test.afterAll(() => {
  const runId = process.env.IR004_EVIDENCE_RUN_ID
  if (!runId || failures > 0) return
  if (!/^ir004-[a-z0-9-]+$/i.test(runId)) throw new Error('invalid-ir004-evidence-run-id')
  const root = resolve('artifacts/ir-004')
  const directory = resolve(root, runId)
  const stage = resolve(directory, 'session-browser.json')
  if (!directory.startsWith(`${root}/`) || !existsSync(directory) || lstatSync(directory).isSymbolicLink() || existsSync(stage)) {
    throw new Error('unsafe-ir004-browser-evidence-path')
  }
  writeFileSync(stage, `${JSON.stringify({ schemaVersion: 1, capability: 'ir-004-auth-browser', runId, stage: 'session-browser', result: 'passed', environment: 'local-browser', cases: ['linked-account-protected-entry', 'browser-reload-protected-entry'] }, null, 2)}\n`, 'utf8')
})
