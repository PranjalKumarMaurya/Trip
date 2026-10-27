// Render the PNG app icons from public/icon.svg with Playwright's Chromium.
// Run after changing the mark: `PLAYWRIGHT_BROWSERS_PATH=0 node scripts/render-pwa-icons.mjs`.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = fileURLToPath(new URL('..', import.meta.url))
const svg = readFileSync(resolve(root, 'public/icon.svg'), 'utf8')
// Maskable and Apple icons are cropped by the OS, so they fill the whole square.
const fullBleed = svg.replace('rx="112"', 'rx="0"')

const outputs = [
  { file: 'pwa-192x192.png', size: 192, source: svg },
  { file: 'pwa-512x512.png', size: 512, source: svg },
  { file: 'maskable-192x192.png', size: 192, source: fullBleed },
  { file: 'maskable-512x512.png', size: 512, source: fullBleed },
  { file: 'apple-touch-icon.png', size: 180, source: fullBleed },
]

const browser = await chromium.launch()
try {
  for (const { file, size, source } of outputs) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 })
    await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${source
      .replace('<svg ', `<svg width="${size}" height="${size}" style="display:block" `)}</body></html>`)
    await page.screenshot({ path: resolve(root, 'public', file), omitBackground: true })
    await page.close()
  }
} finally {
  await browser.close()
}
console.log(outputs.map(({ file }) => file).join('\n'))
