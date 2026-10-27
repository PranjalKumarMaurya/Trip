import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// ─── Installable app (PWA) ───────────────────────────────────────────────────
// The service worker precaches the built app shell only (HTML, JS, CSS, icons)
// and answers navigations with that shell, so the app opens offline. It has no
// runtime caching: Supabase (REST, Auth, Storage, Functions, Realtime) and every
// Trip document always go to the network. Registration lives in
// src/features/pwa/serviceWorker.ts (prompted updates, off under automation).
const pwa = VitePWA({
  registerType: 'prompt',
  injectRegister: false,
  // Icons are picked up by globPatterns below; the plugin adds the manifest itself.
  includeManifestIcons: false,
  manifest: {
    id: '/',
    name: 'Trip',
    short_name: 'Trip',
    description: 'Plan, split and share your group trip.',
    lang: 'en',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#0F0B08',
    background_color: '#0F0B08',
    icons: [
      { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: 'maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{html,js,css,svg,png}'],
    navigateFallback: '/index.html',
    // Never answer API-looking paths or files with the shell.
    navigateFallbackDenylist: [/^\/(rest|auth|storage|functions|realtime|graphql)\//u, /\/[^/?]+\.[^/?]+$/u],
    runtimeCaching: [],
    cleanupOutdatedCaches: true,
  },
  devOptions: { enabled: false },
})
// ─────────────────────────────────────────────────────────────────────────────

export default defineConfig({
  plugins: [react(), pwa],
  server: {
    // Matches the local Supabase Auth site_url (scripts/dev-db.mjs) so email links return here.
    port: 5173,
    strictPort: true,
  },
})
