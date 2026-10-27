import { defineConfig } from '@playwright/test'

// Parallel worktrees each set their own TRIP_WEB_PORT so preview servers never collide.
const webPort = process.env.TRIP_WEB_PORT ?? '4173'
const localBaseUrl = `http://127.0.0.1:${webPort}`

export default defineConfig({
  testDir: './tests/browser',
  outputDir: 'artifacts/ir-001/browser/raw-test-results',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: localBaseUrl,
    browserName: 'chromium',
    headless: true,
    viewport: { width: 390, height: 844 },
    screenshot: 'only-on-failure',
    trace: 'off',
    video: 'off',
  },
  webServer: {
    command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${webPort} --strictPort`,
    url: localBaseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      ...process.env,
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:56321',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ?? 'ir001-local-browser-anon-key',
    },
  },
})
