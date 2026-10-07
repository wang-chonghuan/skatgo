import { LIGHTNINGCSS_TARGETS, astryxStylex } from '@astryxdesign/build/vite'
import { paraglideVitePlugin } from '@inlang/paraglide-js'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

import { paraglideOptions } from './paraglide.options'
import { SITE_URL } from './src/lib/origin'
import { PRINTABLES } from './src/lib/printables'

const ROOT = fileURLToPath(new URL('.', import.meta.url))

// Each printable PDF names the page it is printed from as its canonical URL (SKATGO-53), in an HTTP Link
// header, so search engines rank the page rather than the file. The page's address in each language is
// the Paraglide pattern's, as everywhere else.
function pageUrl(route: string, locale: string): string {
  const pattern = paraglideOptions.urlPatterns?.find((p) => p.pattern === route)
  const path = pattern?.localized.find(([l]) => l === locale)?.[1]
  if (!path) throw new Error(`No address for ${route} in ${locale}`)
  return `${SITE_URL}${path}`
}
const printableRules = Object.fromEntries(
  Object.values(PRINTABLES).flatMap(({ route, pdf }) =>
    Object.entries(pdf).map(([locale, file]) => [file, { headers: { link: `<${pageUrl(route, locale)}>; rel="canonical"` } }]),
  ),
)

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
      // i18n (SKATGO-1) — see paraglide.options.ts.
      paraglideVitePlugin(paraglideOptions),
      ...astryxStylex({ rootDir: ROOT, lightningcssTargets: LIGHTNINGCSS_TARGETS }),
      tanstackStart(),
      // react's vite plugin must come after start's vite plugin
      viteReact(),
      nitro({ routeRules: printableRules }),
    ],
  }
})
