import { LIGHTNINGCSS_TARGETS, astryxStylex } from '@astryxdesign/build/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const ROOT = fileURLToPath(new URL('.', import.meta.url))

// Styling is StyleX only — no Tailwind, no PostCSS framework, no utility CSS.
// `astryxStylex()` is the official Astryx build integration: it configures the
// StyleX compiler and aliases @astryxdesign/core to its TypeScript source, so the
// library's own StyleX atoms compile into OUR stylesheet. The CSS layer order it
// would inject through transformIndexHtml never runs under TanStack Start's SSR
// shell, so src/styles/app.css declares it instead — see the comment there.
export default defineConfig(() => {
  return {
    server: { port: 3220 },
    resolve: {
      alias: { '~': `${ROOT}src` },
    },
    // Every Astryx colour token is a `light-dark()` pair. Left to its default
    // targets, lightningcss lowers that into a `--lightningcss-light/dark`
    // custom-property polyfill keyed on `prefers-color-scheme` ALONE — ignoring the
    // `color-scheme` the Theme provider sets, so an app pinned to light mode
    // renders every token's DARK value on a machine set to dark (white-on-white
    // buttons). Naming targets that support light-dark() natively keeps it as
    // written. Both CSS pipelines have to be told: Vite's, for the reset and the
    // theme stylesheet, and StyleX's internal one, for the compiled atoms.
    css: { lightningcss: { targets: LIGHTNINGCSS_TARGETS } },
    plugins: [
      ...astryxStylex({ rootDir: ROOT, lightningcssTargets: LIGHTNINGCSS_TARGETS }),
      tanstackStart(),
      // react's vite plugin must come after start's vite plugin
      viteReact(),
      nitro(),
    ],
  }
})
