import { type Locale, locales } from '~/paraglide/runtime'
import { GUIDES, lessonPath } from './skat/lessons/guide'
import { LANG_TAG, localizedUrl } from './site'
import { isIndexable } from './indexability'

// sitemap.xml (SKATGO-29): every indexable page in every language, each with its hreflang alternates.
// Built on request from the same page list and lesson addresses the pages use, so a lesson's slug or a
// new language cannot leave it stale; sitemap.test.ts holds the page list to the route tree.

/** The route paths of the pages that are the same in every language. */
export const PAGES = ['/', '/daily', '/daily/play', '/course', '/rules', '/rules/bidding-table', '/rules/score-sheet', '/rules/printable', '/play', '/privacy', '/terms']

/** Every page as its path in each language. */
export function sitemapPages(): Record<Locale, string>[] {
  const same = (path: string) => Object.fromEntries(locales.map((l) => [l, path])) as Record<Locale, string>
  const lessons = Object.keys(GUIDES.en).map((id) => Object.fromEntries(locales.map((l) => [l, lessonPath(id, l)])) as Record<Locale, string>)
  return [...PAGES.filter(isIndexable).map(same), ...lessons]
}

export function buildSitemap(): string {
  const entries = sitemapPages().flatMap((paths) =>
    locales.map((locale) =>
      [
        '  <url>',
        `    <loc>${localizedUrl(paths[locale], locale)}</loc>`,
        ...locales.map((l) => `    <xhtml:link rel="alternate" hreflang="${LANG_TAG[l]}" href="${localizedUrl(paths[l], l)}"/>`),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${localizedUrl(paths.de, 'de')}"/>`,
        '  </url>',
      ].join('\n'),
    ),
  )
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n')
}
