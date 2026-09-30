import type { paraglideVitePlugin } from '@inlang/paraglide-js'

// i18n (SKATGO-1), as TanStack's own start-i18n-paraglide example wires it: Paraglide compiles
// messages/*.json into src/paraglide (generated, self-ignored), and every language lives under
// its own prefix — /en and /de — so each is a separate, indexable page. A request without a
// prefix is redirected by the server middleware (src/server.ts) to the language src/lib/locale.ts
// chooses: URL, then the visitor's saved choice, then German or English from the browser, then English
// (SKATGO-23; Chinese removed in SKATGO-28). Paraglide runs a custom strategy before its built-in ones
// whatever the order, so `custom-skatgo` carries that whole rule on the server; `url` and `cookie` stay
// for the browser, where every page already has its prefix and a choice writes the cookie.
//
// Shared by vite.config.ts (dev, build) and vitest.config.ts (tests), so the generated runtime is the
// same wherever the code runs.
export const paraglideOptions: Parameters<typeof paraglideVitePlugin>[0] = {
  project: './project.inlang',
  outdir: './src/paraglide',
  outputStructure: 'message-modules',
  cookieName: 'PARAGLIDE_LOCALE',
  strategy: ['custom-skatgo', 'url', 'cookie', 'baseLocale'],
  urlPatterns: [
    {
      pattern: '/',
      localized: [
        ['en', '/en'],
        ['de', '/de'],
      ],
    },
    {
      pattern: '/:path(.*)?',
      localized: [
        ['en', '/en/:path(.*)?'],
        ['de', '/de/:path(.*)?'],
      ],
    },
  ],
  // Files for crawlers are the same in every language and must never be redirected.
  routeStrategies: [
    { match: '/sitemap.xml', exclude: true },
    { match: '/robots.txt', exclude: true },
  ],
}
