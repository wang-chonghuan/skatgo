import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { type Locale, locales } from '~/paraglide/runtime'
import { LANG_TAG, SITE_URL, localizedUrl } from './site'
import { GUIDES, lessonPath } from './skat/lessons/guide'
import { PAGES, buildSitemap } from './sitemap'
import { isIndexable } from './indexability'
import { pageHead, samePath } from './head'
import { overwriteGetLocale } from '~/paraglide/runtime'

// sitemap.xml is built on request (lib/sitemap.ts). It is held here to what it must list: every page of
// the route tree that has no parameter, and every lesson under its own slug, in every language, each
// with the hreflang alternates the pages' own <head> carries. The pages come from the generated route
// tree and the languages from Paraglide, so a new page or language fails this test until the sitemap
// has it.

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

const routeTree = read('../routeTree.gen.ts')
const routes = [...routeTree.slice(routeTree.indexOf('interface FileRoutesByFullPath'), routeTree.indexOf('interface FileRoutesByTo')).matchAll(/'(\/[^']*)'/g)]
  .map((x) => x[1])
  .filter((p) => !p.includes('$'))
  .map((p) => (p.length > 1 ? p.replace(/\/$/, '') : p))
const sitemap = buildSitemap()
const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((x) => x[1])

describe('sitemap.xml', () => {
  it('lists exactly the route tree’s pages without a parameter', () => {
    expect(routes.length).toBeGreaterThan(0)
    expect([...PAGES].sort()).toEqual([...new Set(routes)].sort())
  })

  it('lists every page and every lesson in every language, with all its alternates and x-default', () => {
    const lessons = Object.keys(GUIDES.en)
    const publicPages = PAGES.filter(isIndexable)
    expect(publicPages.length).toBeGreaterThan(0)
    expect(entries).toHaveLength((publicPages.length + lessons.length) * locales.length)
    const all: ((l: Locale) => string)[] = [...publicPages.map((p) => () => p), ...lessons.map((id) => (l: Locale) => lessonPath(id, l))]
    for (const pathIn of all) {
      for (const locale of locales) {
        const entry = entries.find((e) => e.includes(`<loc>${localizedUrl(pathIn(locale), locale)}</loc>`))
        expect(entry, `${locale} ${pathIn(locale)}`).toBeDefined()
        for (const alt of locales) expect(entry).toContain(`hreflang="${LANG_TAG[alt]}" href="${localizedUrl(pathIn(alt), alt)}"`)
        expect(entry).toContain(`hreflang="x-default" href="${localizedUrl(pathIn('de'), 'de')}"`)
      }
    }
  })

  it('gives German pages their German addresses', () => {
    expect(sitemap).toContain(`<loc>${SITE_URL}/</loc>`)
    expect(sitemap).not.toContain(`<loc>${SITE_URL}/de</loc>`)
    expect(sitemap).toContain(`<loc>${SITE_URL}/de/kurs</loc>`)
    expect(sitemap).toContain(`<loc>${SITE_URL}/de/regeln</loc>`)
    expect(sitemap).toContain(`<loc>${SITE_URL}/de/spielen</loc>`)
    expect(sitemap).not.toContain('/de/course')
  })

  it('excludes personal execution and declares noindex without language alternates', () => {
    overwriteGetLocale(() => 'de')
    const paths = samePath('/daily/play')
    for (const locale of locales) expect(sitemap).not.toContain(`<loc>${localizedUrl(paths[locale], locale)}</loc>`)
    const head = pageHead({ title: 'Daily round', description: 'Personal state', paths, image: 'daily', jsonLd: [] })
    expect(head.meta).toContainEqual({ name: 'robots', content: 'noindex, follow' })
    expect(head.links.filter((link) => link.rel === 'alternate')).toHaveLength(0)
    expect(head.links).toContainEqual({ rel: 'canonical', href: localizedUrl('/daily/play', 'de') })
  })

  it('is announced in robots.txt', () => {
    expect(read('../../public/robots.txt')).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`)
  })
})
