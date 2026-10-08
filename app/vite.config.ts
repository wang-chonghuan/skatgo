import { LIGHTNINGCSS_TARGETS, astryxStylex } from '@astryxdesign/build/vite'
import { paraglideVitePlugin } from '@inlang/paraglide-js'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { fileURLToPath } from 'node:url'
import { type Plugin, defineConfig } from 'vite'

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

// A private table's client (SKATGO-61) brings @colyseus/schema and msgpackr into the browser. Both
// take Node's Buffer when there is one and a Uint8Array otherwise — `typeof Buffer !== 'undefined'`,
// directly or through msgpackr's `hasNodeBuffer` — which is harmless in a browser. The client-bundle
// check (scripts/check-client-bundle.mjs) accepts such a test only in the `globalThis.Buffer` form,
// and the check is not loosened (engineering.md Redline 7), so those reviewed, guarded uses are
// written in that form at build time; what they do is unchanged. The human chose this on 2026-10-08.
//
// Only the uses reviewed then are touched, and their number is pinned per file: a library update that
// adds, removes or moves one fails the build until it is reviewed again. Anything else — msgpackr's
// Node-only stream helpers, for one, with their unguarded Buffer.concat — is left as written for the
// check to catch, should it ever reach the browser.
const GUARDED_BUFFER: Record<string, [RegExp, string, number][]> = {
  '@colyseus/schema/build/index.mjs': [
    [/typeof Buffer\b/g, 'typeof globalThis.Buffer', 1],
    [/(?<![.\w$])Buffer\.byteLength\b/g, 'globalThis.Buffer.byteLength', 2],
  ],
  'msgpackr/pack.js': [
    [/typeof Buffer\b/g, 'typeof globalThis.Buffer', 1],
    [/(?<![.\w$])Buffer\.allocUnsafeSlow\b/g, 'globalThis.Buffer.allocUnsafeSlow', 1],
    [/\? Buffer :/g, '? globalThis.Buffer :', 1],
    [/(?<![.\w$])Buffer\.from\b/g, 'globalThis.Buffer.from', 3],
  ],
  'msgpackr/unpack.js': [
    [/typeof Buffer\b/g, 'typeof globalThis.Buffer', 1],
    [/(?<![.\w$])Buffer\.from\b/g, 'globalThis.Buffer.from', 1],
  ],
}
function guardedBuffer(): Plugin {
  return {
    name: 'skatgo-guarded-buffer',
    enforce: 'pre',
    transform(code, id) {
      const file = Object.keys(GUARDED_BUFFER).find((f) => id.split('?')[0].endsWith(`/node_modules/${f}`))
      if (!file) return null
      let out = code
      for (const [pattern, guarded, count] of GUARDED_BUFFER[file]) {
        const found = (out.match(pattern) ?? []).length
        if (found !== count) throw new Error(`${file}: ${found} uses of ${pattern}, ${count} reviewed — review the library's Buffer uses again (vite.config.ts)`)
        out = out.replace(pattern, guarded)
      }
      return { code: out, map: null }
    },
  }
}

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
      guardedBuffer(),
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
