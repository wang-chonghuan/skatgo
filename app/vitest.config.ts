import { defineConfig } from 'vitest/config'

// Isolated test config: the app's vite.config.ts loads the TanStack Start and
// StyleX plugins, which the vitest runner does not need. This mirrors only the
// `~` -> src alias so pure modules can be unit tested.
export default defineConfig({
  resolve: {
    alias: { '~': new URL('./src', import.meta.url).pathname },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
