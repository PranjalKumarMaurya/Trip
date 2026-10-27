import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Matches the local Supabase Auth site_url (scripts/dev-db.mjs) so email links return here.
    port: 5173,
    strictPort: true,
  },
})
