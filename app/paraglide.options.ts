import type { paraglideVitePlugin } from '@inlang/paraglide-js'

// i18n (SKATGO-1), as TanStack's own start-i18n-paraglide example wires it: Paraglide compiles
// messages/*.json into src/paraglide (generated, self-ignored), and every language lives under
// its own prefix — /en, /de, /zh — so each is a separate, indexable page. A request without a
// prefix is redirected by the server middleware (src/server.ts): URL first, then the learner's
// saved choice (cookie), then the browser's languages, then English.
//
// Shared by vite.config.ts (dev, build) and vitest.config.ts (tests), so the generated runtime is the
// same wherever the code runs.
export const paraglideOptions: Parameters<typeof paraglideVitePlugin>[0] = {
  project: './project.inlang',
  outdir: './src/paraglide',
  outputStructure: 'message-modules',
  cookieName: 'PARAGLIDE_LOCALE',
  strategy: ['url', 'cookie', 'preferredLanguage', 'baseLocale'],
  urlPatterns: [
    {
      pattern: '/',
      localized: [
        ['en', '/en'],
        ['de', '/de'],
        ['zh', '/zh'],
      ],
    },
    {
      pattern: '/:path(.*)?',
      localized: [
        ['en', '/en/:path(.*)?'],
        ['de', '/de/:path(.*)?'],
        ['zh', '/zh/:path(.*)?'],
      ],
    },
  ],
  // Files for crawlers are the same in every language and must never be redirected.
  routeStrategies: [
    { match: '/sitemap.xml', exclude: true },
    { match: '/robots.txt', exclude: true },
  ],
}
