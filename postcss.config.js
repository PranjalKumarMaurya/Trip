import { fileURLToPath } from 'node:url'

export default {
  plugins: {
    // Resolve the Tailwind config from this file, not the shell's working directory.
    tailwindcss: { config: fileURLToPath(new URL('./tailwind.config.ts', import.meta.url)) },
    autoprefixer: {},
  },
}
