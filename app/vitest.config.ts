import { paraglideVitePlugin } from '@inlang/paraglide-js'
import { defineConfig } from 'vitest/config'

import { paraglideOptions } from './paraglide.options'

// Isolated test config: the app's vite.config.ts loads the TanStack Start and
// StyleX plugins, which the vitest runner does not need. This mirrors only the
// `~` -> src alias so pure modules can be unit tested — plus Paraglide, which compiles the messages
// the lessons and the engine's explanations are phrased in.
export default defineConfig({
  plugins: [paraglideVitePlugin(paraglideOptions)],
  resolve: {
    alias: { '~': new URL('./src', import.meta.url).pathname },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
