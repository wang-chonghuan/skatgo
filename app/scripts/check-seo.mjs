import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

// Run against a built preview or production. The sitemap supplies pages and alternates; no route
// inventory is duplicated here. JavaScript stays disabled so hydration cannot hide an empty SSR page.
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const locales = JSON.parse(readFileSync(new URL('../project.inlang/settings.json', import.meta.url), 'utf8')).locales
const site = 'https://skatgo.com'

export function validatePage(data, entry) {
  assert.equal(data.status, 200, `${entry.loc}: status`)
  assert.equal(data.canonical.length, 1, `${entry.loc}: one canonical`)
  assert.equal(data.canonical[0], entry.loc, `${entry.loc}: self canonical`)
  const language = Object.entries(entry.alternates).find(([lang, url]) => lang !== 'x-default' && url === entry.loc)?.[0]
  assert.ok(language, `${entry.loc}: self alternate`)
  assert.equal(data.lang, language, `${entry.loc}: html lang`)
  assert.ok(!/noindex/i.test(data.robots), `${entry.loc}: must be indexable`)
  assert.ok(data.title.trim(), `${entry.loc}: title`)
  assert.ok(data.description.trim(), `${entry.loc}: description`)
  assert.equal(data.h1.length, 1, `${entry.loc}: one visible H1`)
  assert.ok(data.text.trim().length >= 200, `${entry.loc}: substantive visible SSR content`)
  assert.ok(data.links.length >= 2, `${entry.loc}: contextual internal links`)
  assert.deepEqual(data.alternates, entry.alternates, `${entry.loc}: head/sitemap alternates`)
  assert.equal(data.ogUrl, entry.loc, `${entry.loc}: OG URL`)
  assert.ok(data.jsonLd.length > 0, `${entry.loc}: structured data`)
  for (const object of data.jsonLd) {
    assert.equal(object['@context'], 'https://schema.org', `${entry.loc}: JSON-LD context`)
    assert.ok(object['@type'], `${entry.loc}: JSON-LD type`)
    if (['WebPage', 'WebSite', 'WebApplication', 'Course'].includes(object['@type'])) {
      assert.equal(object.url, entry.loc, `${entry.loc}: structured data URL`)
      assert.equal(object.inLanguage, language, `${entry.loc}: structured data language`)
    }
    if (object['@type'] === 'FAQPage') {
      assert.ok(object.mainEntity.length > 0, `${entry.loc}: FAQ entries`)
      for (const question of object.mainEntity) {
        assert.ok(data.text.includes(question.name), `${entry.loc}: visible FAQ question`)
        assert.ok(data.text.includes(question.acceptedAnswer.text), `${entry.loc}: visible FAQ answer`)
      }
    }
  }
  assert.ok(data.assets.some((url) => new URL(url).pathname.startsWith('/assets/')), `${entry.loc}: built assets`)
}

export async function checkSeo(origin) {
  assert.ok(locales.length > 0, 'No configured languages')
  const target = new URL(origin)
  const local = (url) => {
    const parsed = new URL(url, site)
    assert.equal(parsed.origin, site, `Unexpected external URL: ${url}`)
    return new URL(`${parsed.pathname}${parsed.search}`, target).href
  }
  const browser = await chromium.launch({ headless: process.env.HEADED !== '1' })
  try {
    const context = await browser.newContext({ javaScriptEnabled: false })
    context.setDefaultTimeout(15_000)
    context.setDefaultNavigationTimeout(20_000)
    const page = await context.newPage()
    const request = context.request
    console.log(`Checking ${target.origin}: JavaScript disabled`)
    const sitemap = await request.get(new URL('/sitemap.xml', target).href, { maxRedirects: 0 })
    assert.equal(sitemap.status(), 200, 'Sitemap status')
    await page.goto(new URL('/', target).href, { waitUntil: 'domcontentloaded' })
    const entries = await page.evaluate((xml) => {
      const doc = new DOMParser().parseFromString(xml, 'application/xml')
      if (doc.querySelector('parsererror')) throw Error('Invalid sitemap XML')
      return [...doc.getElementsByTagNameNS('http://www.sitemaps.org/schemas/sitemap/0.9', 'url')].map((node) => ({
        loc: node.getElementsByTagNameNS('*', 'loc')[0]?.textContent.trim(),
        alternates: Object.fromEntries([...node.getElementsByTagNameNS('http://www.w3.org/1999/xhtml', 'link')].map((link) => [link.getAttribute('hreflang'), link.getAttribute('href')])),
      }))
    }, await sitemap.text())
    assert.ok(entries.length > 0, 'Derived no sitemap pages')
    const urls = new Set(entries.map((entry) => entry.loc))
    assert.equal(urls.size, entries.length, 'Duplicate sitemap URLs')
    const byUrl = new Map(entries.map((entry) => [entry.loc, entry]))
    for (const entry of entries) {
      for (const alternate of Object.values(entry.alternates)) {
        assert.ok(byUrl.has(alternate), `${entry.loc}: alternate is indexable`)
        assert.deepEqual(byUrl.get(alternate).alternates, entry.alternates, `${entry.loc}: reciprocal alternates`)
      }
    }
    const titles = new Set()
    const descriptions = new Set()
    const assets = new Set()
    const linked = new Set()
    const privatePages = new Set()
    const snapshots = []
    for (const entry of entries) {
      assert.deepEqual(Object.keys(entry.alternates).sort(), [...locales, 'x-default'].sort(), `${entry.loc}: language coverage`)
      assert.equal(entry.alternates['x-default'], entry.alternates.de, `${entry.loc}: German default`)
      for (const alternate of Object.values(entry.alternates)) assert.ok(urls.has(alternate), `${entry.loc}: alternate missing from sitemap`)
      const response = await page.goto(local(entry.loc), { waitUntil: 'domcontentloaded' })
      await page.locator('link[rel="stylesheet"][href^="/assets/"]').waitFor({ state: 'attached' })
      await page.waitForFunction(() => [...document.styleSheets].some((sheet) => sheet.href?.includes('/assets/')))
      const data = await page.evaluate(() => {
        const visible = (element) => {
          const style = getComputedStyle(element)
          return style.display !== 'none' && style.visibility !== 'hidden' && element.getBoundingClientRect().width > 1
        }
        const main = document.querySelector('main')
        return {
          lang: document.documentElement.lang,
          title: document.title,
          description: document.querySelector('meta[name="description"]')?.content ?? '',
          robots: document.querySelector('meta[name="robots"]')?.content ?? '',
          canonical: [...document.querySelectorAll('link[rel="canonical"]')].map((link) => link.href),
          alternates: Object.fromEntries([...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((link) => [link.hreflang, link.href])),
          ogUrl: document.querySelector('meta[property="og:url"]')?.content,
          h1: [...(main?.querySelectorAll('h1') ?? [])].filter(visible).map((h1) => h1.textContent),
          text: main?.innerText ?? '',
          links: [...(main?.querySelectorAll('a[href]') ?? [])].filter(visible).map((link) => link.href),
          jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map((script) => JSON.parse(script.textContent)),
          assets: [...document.querySelectorAll('script[src], link[rel="stylesheet"], img[src], meta[property="og:image"]')].map((node) => node.src || node.href || node.content),
        }
      })
      data.status = response.status()
      data.robots += ` ${response.headers()['x-robots-tag'] ?? ''}`
      // Browser navigation may follow a redirect; sitemap entries must not require one.
      assert.equal(response.request().redirectedFrom(), null, `${entry.loc}: direct page`)
      data.links = data.links.filter((url) => new URL(url).origin === target.origin)
      validatePage(data, entry)
      assert.ok(!titles.has(data.title), `${entry.loc}: duplicate title`)
      assert.ok(!descriptions.has(data.description), `${entry.loc}: duplicate description`)
      titles.add(data.title)
      descriptions.add(data.description)
      data.assets.forEach((url) => {
        const parsed = new URL(url)
        if (parsed.origin === target.origin || parsed.origin === site) assets.add(`${parsed.pathname}${parsed.search}`)
      })
      data.links.forEach((url) => linked.add(url))
      snapshots.push({ entry, data })
      console.log(`200 ${new URL(entry.loc).pathname} [${data.lang}] ${data.text.trim().length} characters`)
    }
    assert.ok(assets.size > 0, 'Derived no assets')
    for (const path of assets) {
      const response = await request.get(new URL(path, target).href, { maxRedirects: 0 })
      assert.equal(response.status(), 200, `Asset ${path}`)
    }
    for (const url of linked) {
      const parsed = new URL(url)
      const published = new URL(`${parsed.pathname}${parsed.search}`, site).href
      if (urls.has(published)) continue
      const response = await request.get(url, { maxRedirects: 0 })
      assert.equal(response.status(), 200, `Internal link ${url}`)
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      assert.match(await page.locator('meta[name="robots"]').getAttribute('content'), /noindex/, `Non-sitemap link ${url} must declare noindex`)
      privatePages.add(url)
    }
    assert.ok(privatePages.size > 0, 'Derived no personal execution links')
    const robots = await request.get(new URL('/robots.txt', target).href, { maxRedirects: 0 })
    assert.equal(robots.status(), 200, 'Robots status')
    const robotsText = await robots.text()
    assert.ok(robotsText.includes(`${site}/sitemap.xml`), 'Robots must announce sitemap')
    assert.ok(!/Disallow:\s*\/\s*$/m.test(robotsText), 'Robots blocks site')
    for (const acceptLanguage of ['', 'de-DE,de;q=0.9', 'en-US,en;q=0.9', 'fr-FR']) {
      const response = await request.get(new URL('/', target).href, { maxRedirects: 0, headers: { 'Accept-Language': acceptLanguage, Cookie: 'PARAGLIDE_LOCALE=en' } })
      assert.equal(response.status(), 200, 'Stable root')
      assert.match(await response.text(), /<html lang="de"/, 'Stable German root')
    }
    for (const path of ['/de', '/de/']) {
      const response = await request.get(new URL(`${path}?source=seo`, target).href, { maxRedirects: 0 })
      assert.equal(response.status(), 301, `Legacy homepage ${path}`)
      assert.equal(new URL(response.headers().location, target).href, new URL('/?source=seo', target).href, 'Preserve query')
    }
    for (const prefix of locales) {
      const lesson = entries.find((entry) => entry.loc === entry.alternates[prefix] && new URL(entry.loc).pathname.split('/').length > 3)
      assert.ok(lesson, `Derived no lesson for ${prefix}`)
      const lessonParent = new URL(lesson.loc).pathname.split('/').slice(0, -1).join('/')
      for (const path of [`/${prefix}/this-page-does-not-exist`, `${lessonParent}/missing-lesson`]) {
        const response = await request.get(new URL(path, target).href)
        assert.equal(response.status(), 404, `Unknown URL ${path}`)
        assert.match(await response.text(), /noindex/, 'Missing pages noindex')
      }
    }
    // Exercise the same validator on deliberately broken observations, not a passing happy-path only.
    const sample = snapshots[0]
    assert.throws(() => validatePage({ ...sample.data, canonical: [`${site}/wrong`] }, sample.entry), /self canonical/)
    assert.throws(() => validatePage({ ...sample.data, text: '' }, sample.entry), /SSR content/)
    console.log(`OK: ${entries.length} indexable pages, ${privatePages.size} noindex links, ${assets.size} assets; negative controls rejected`)
  } finally {
    await browser.close()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await checkSeo(process.argv[2] || site)
}
