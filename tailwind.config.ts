import type { Config } from 'tailwindcss'

export default {
  // `relative` resolves these globs from this config file, so styles work whatever directory Vite starts in.
  content: { relative: true, files: ['./index.html', './src/**/*.{ts,tsx}'] },
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
