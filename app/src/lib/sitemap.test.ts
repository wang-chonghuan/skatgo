import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { locales } from '~/paraglide/runtime'
import { LANG_TAG, SITE_URL, localizedUrl } from './site'

// public/sitemap.xml is a static file, so it is held here to what it must list: every page of the
// route tree that has no parameter (lesson pages render in the browser only; the map links them all), in
// every language, each with the hreflang alternates the pages' own <head> carries. Both lists are
// derived — the pages from the generated route tree, the languages from Paraglide — so a new page
// or language fails this test until the sitemap has it.

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

const routeTree = read('../routeTree.gen.ts')
const pages = [...routeTree.slice(routeTree.indexOf('interface FileRoutesByFullPath'), routeTree.indexOf('interface FileRoutesByTo')).matchAll(/'(\/[^']*)'/g)]
  .map((x) => x[1])
  .filter((p) => !p.includes('$'))
const sitemap = read('../../public/sitemap.xml')

describe('sitemap.xml', () => {
  it('derives a non-empty page list', () => {
    expect(pages.length).toBeGreaterThan(0)
  })

  it('lists every page in every language, with all its alternates and x-default', () => {
    const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((x) => x[1])
    expect(entries).toHaveLength(pages.length * locales.length)
    for (const page of pages) {
      for (const locale of locales) {
        const entry = entries.find((e) => e.includes(`<loc>${localizedUrl(page, locale)}</loc>`))
        expect(entry, `${locale} ${page}`).toBeDefined()
        for (const alt of locales) {
          expect(entry).toContain(`hreflang="${LANG_TAG[alt]}" href="${localizedUrl(page, alt)}"`)
        }
        expect(entry).toContain(`hreflang="x-default" href="${SITE_URL}${page}"`)
      }
    }
  })

  it('is announced in robots.txt', () => {
    expect(read('../../public/robots.txt')).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`)
  })
})
