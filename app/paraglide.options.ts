import type { paraglideVitePlugin } from '@inlang/paraglide-js'

// i18n (SKATGO-1), as TanStack's own start-i18n-paraglide example wires it: Paraglide compiles
// messages/*.json into src/paraglide (generated, self-ignored). The German homepage is `/`; English
// stays `/en`. Other pages retain their published language prefixes. Explicit URLs always determine
// the language, including `/`, regardless of saved preferences (SKATGO-44).
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
        ['de', '/'],
      ],
    },
    // German pages have German addresses (SKATGO-29): the course, a lesson, the rules and the table.
    // A lesson's slug is itself in the page's language (lib/skat/lessons/guide.ts); the pattern only
    // carries it across.
    {
      pattern: '/course',
      localized: [
        ['en', '/en/course'],
        ['de', '/de/kurs'],
      ],
    },
    {
      pattern: '/course/:slug',
      localized: [
        ['en', '/en/course/:slug'],
        ['de', '/de/kurs/:slug'],
      ],
    },
    {
      pattern: '/rules',
      localized: [
        ['en', '/en/rules'],
        ['de', '/de/regeln'],
      ],
    },
    // The bidding table (SKATGO-50), a page of the rules.
    {
      pattern: '/rules/bidding-table',
      localized: [
        ['en', '/en/rules/bidding-table'],
        ['de', '/de/regeln/reiztabelle'],
      ],
    },
    // The printables (SKATGO-53): the score sheet and the short version of the rules.
    {
      pattern: '/rules/score-sheet',
      localized: [
        ['en', '/en/rules/score-sheet'],
        ['de', '/de/regeln/skatliste'],
      ],
    },
    {
      pattern: '/rules/printable',
      localized: [
        ['en', '/en/rules/printable'],
        ['de', '/de/regeln/zum-ausdrucken'],
      ],
    },
    {
      pattern: '/daily',
      localized: [
        ['en', '/en/daily'],
        ['de', '/de/taeglich'],
      ],
    },
    {
      pattern: '/daily/play',
      localized: [
        ['en', '/en/daily/play'],
        ['de', '/de/taeglich/spielen'],
      ],
    },
    {
      pattern: '/play',
      localized: [
        ['en', '/en/play'],
        ['de', '/de/spielen'],
      ],
    },
    // Skat with friends and a private table (SKATGO-61): the Skat table a German player sits at is a
    // "Tisch".
    {
      pattern: '/with-friends',
      localized: [
        ['en', '/en/with-friends'],
        ['de', '/de/mit-freunden'],
      ],
    },
    {
      pattern: '/table/:id',
      localized: [
        ['en', '/en/table/:id'],
        ['de', '/de/tisch/:id'],
      ],
    },
    {
      pattern: '/privacy',
      localized: [
        ['en', '/en/privacy'],
        ['de', '/de/datenschutz'],
      ],
    },
    {
      pattern: '/terms',
      localized: [
        ['en', '/en/terms'],
        ['de', '/de/nutzungsbedingungen'],
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
    { match: '/og/:file', exclude: true },
  ],
}
