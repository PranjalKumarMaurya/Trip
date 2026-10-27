import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

// Shown on the Profile screen.
const appVersion = (JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }).version

export default defineConfig({
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(appVersion) },
  server: {
    // Matches the local Supabase Auth site_url (scripts/dev-db.mjs) so email links return here.
    port: 5173,
    strictPort: true,
  },
})
