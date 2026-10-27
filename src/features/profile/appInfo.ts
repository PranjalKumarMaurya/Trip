// `__APP_VERSION__` is replaced at build time from package.json (vite.config.ts `define`).
declare const __APP_VERSION__: string | undefined

export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev'

/** Where "Help & feedback" sends mail; the entry is hidden when VITE_SUPPORT_EMAIL is unset. */
export const SUPPORT_EMAIL: string | null = (() => {
  const value = (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined)?.trim()
  return value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value) ? value : null
})()

export function supportMailto(email: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(`Trip app feedback (version ${APP_VERSION})`)}`
}
