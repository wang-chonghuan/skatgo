import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import { loadInventory } from './seo-inventory.mjs'
import { assertIndexable, validateRobots, crawlers } from './seo-robots.mjs'

// JavaScript stays disabled so hydration cannot hide an empty SSR page.

export function validatePage(data, entry) {
  assert.equal(data.status, 200, `${entry.loc}: status`)
  assert.equal(data.canonical.length, 1, `${entry.loc}: one canonical`)
  assert.equal(data.canonical[0], entry.loc, `${entry.loc}: self canonical`)
  const language = Object.entries(entry.alternates).find(([lang, url]) => lang !== 'x-default' && url === entry.loc)?.[0]
  assert.ok(language, `${entry.loc}: self alternate`)
  assert.equal(data.lang, language, `${entry.loc}: html lang`)
  assertIndexable(data.robots, entry.loc)
  assert.ok(data.title.trim(), `${entry.loc}: title`)
  assert.ok(data.description.trim(), `${entry.loc}: description`)
  assert.equal(data.h1.length, 1, `${entry.loc}: one visible H1`)
  assert.ok(data.text.trim().length >= 200, `${entry.loc}: substantive visible SSR content`)
  assert.ok(data.links.length >= 2, `${entry.loc}: contextual internal links`)
  assert.deepEqual(data.alternates, entry.alternates, `${entry.loc}: head/sitemap alternates`)
  assert.equal(data.ogUrl, entry.loc, `${entry.loc}: OG URL`)
  assert.ok(data.ogImage, `${entry.loc}: OG image`)
  assert.equal(data.twitterTitle, data.title, `${entry.loc}: Twitter title`)
  assert.equal(data.twitterDescription, data.description, `${entry.loc}: Twitter description`)
  assert.equal(data.twitterImage, data.ogImage, `${entry.loc}: Twitter image`)
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
        const normalize = (value) => value.replace(/\s+/g, ' ').trim()
        assert.ok(data.text.includes(normalize(question.name)), `${entry.loc}: visible FAQ question`)
        assert.ok(data.text.includes(normalize(question.acceptedAnswer.text)), `${entry.loc}: visible FAQ answer`)
      }
    }
    if (object['@type'] === 'BreadcrumbList') {
      assert.ok(object.itemListElement.length > 0, `${entry.loc}: breadcrumb entries`)
      for (const [index, item] of object.itemListElement.entries()) {
        assert.equal(item.position, index + 1, `${entry.loc}: breadcrumb position`)
        assert.ok(item.name.trim(), `${entry.loc}: breadcrumb name`)
        assert.ok(Object.values(entry.alternates).some((url) => new URL(url).origin === new URL(item.item).origin), `${entry.loc}: breadcrumb origin`)
      }
      assert.equal(object.itemListElement.at(-1).item, entry.loc, `${entry.loc}: breadcrumb page URL`)
    }
  }
  assert.ok(data.assets.some((url) => new URL(url).pathname.startsWith('/assets/')), `${entry.loc}: built assets`)
}

export async function checkSeo(origin, { signal, quiet = false } = {}) {
  const inventory = await loadInventory()
  const { site, locales } = inventory
  assert.ok(locales.length > 0, 'No configured languages')
  const target = new URL(origin)
  assert.ok(['http:', 'https:'].includes(target.protocol), 'SEO requires an HTTP(S) target')
  const local = (url) => {
    const parsed = new URL(url, site)
    assert.equal(parsed.origin, site, `Unexpected external URL: ${url}`)
    return new URL(`${parsed.pathname}${parsed.search}`, target).href
  }
  const browser = await chromium.launch({ headless: process.env.HEADED !== '1' })
  const interrupt = () => { void browser.close() }
  signal?.addEventListener('abort', interrupt, { once: true })
  const log = (...args) => { if (!quiet) console.log(...args) }
  try {
    signal?.throwIfAborted()
    const context = await browser.newContext({ javaScriptEnabled: false })
    context.setDefaultTimeout(15_000)
    context.setDefaultNavigationTimeout(20_000)
    const page = await context.newPage()
    const request = context.request
    log(`Checking ${target.origin}: JavaScript disabled; ${inventory.entries.length} source-derived pages`)
    const sitemap = await request.get(new URL('/sitemap.xml', target).href, { maxRedirects: 0 })
    assert.equal(sitemap.status(), 200, 'Sitemap status')
    await page.goto(new URL('/', target).href, { waitUntil: 'domcontentloaded' })
    const entries = await page.evaluate((xml) => {
      const doc = new DOMParser().parseFromString(xml, 'application/xml')
      if (doc.querySelector('parsererror')) throw Error('Invalid sitemap XML')
      return [...doc.getElementsByTagNameNS('http://www.sitemaps.org/schemas/sitemap/0.9', 'url')].map((node) => ({
        loc: node.getElementsByTagNameNS('*', 'loc')[0]?.textContent.trim(),
        alternates: (() => {
          const pairs = [...node.getElementsByTagNameNS('http://www.w3.org/1999/xhtml', 'link')].map((link) => [link.getAttribute('hreflang'), link.getAttribute('href')])
          if (new Set(pairs.map(([lang]) => lang)).size !== pairs.length) throw Error('Duplicate sitemap alternate')
          return Object.fromEntries(pairs)
        })(),
      }))
    }, await sitemap.text())
    assert.ok(entries.length > 0, 'Derived no sitemap pages')
    const urls = new Set(entries.map((entry) => entry.loc))
    assert.equal(urls.size, entries.length, 'Duplicate sitemap URLs')
    const byUrl = new Map(entries.map((entry) => [entry.loc, entry]))
    assert.deepEqual([...urls].sort(), inventory.entries.map((entry) => entry.loc).sort(), 'Sitemap / source page-language coverage')
    for (const expected of inventory.entries) {
      assert.deepEqual(byUrl.get(expected.loc).alternates, expected.alternates, `${expected.loc}: source-backed sitemap alternates`)
    }
    const robots = await request.get(new URL('/robots.txt', target).href, { maxRedirects: 0 })
    assert.equal(robots.status(), 200, 'Robots status')
    const robotsText = await robots.text()
    validateRobots(robotsText, site, [...entries.map((entry) => new URL(entry.loc).pathname), '/sitemap.xml'])
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
      await page.waitForLoadState('load')
      await page.waitForFunction(() => [...document.styleSheets].some((sheet) => sheet.href?.includes('/assets/')))
      const data = await page.evaluate(() => {
        const visible = (element) => {
          if (!element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true, contentVisibilityAuto: true })) return false
          const rect = element.getBoundingClientRect()
          if (rect.width <= 1 || rect.height <= 1 || rect.right <= 0 || rect.left >= document.documentElement.clientWidth) return false
          for (let parent = element; parent; parent = parent.parentElement) {
            const style = getComputedStyle(parent)
            if (parent.hidden || Number(style.opacity) === 0 || style.fontSize === '0px' || style.clip === 'rect(0px, 0px, 0px, 0px)' || style.clipPath === 'inset(50%)') return false
          }
          return true
        }
        const main = document.querySelector('main')
        const text = []
        if (main) {
          const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT)
          while (walker.nextNode()) {
            const node = walker.currentNode
            if (['SCRIPT', 'STYLE'].includes(node.parentElement?.tagName) || !visible(node.parentElement)) continue
            text.push(node.textContent)
          }
        }
        const alternates = [...document.querySelectorAll('link[rel="alternate"][hreflang]')]
        if (new Set(alternates.map((link) => link.hreflang)).size !== alternates.length) throw Error('Duplicate head alternate')
        return {
          lang: document.documentElement.lang,
          title: document.title,
          description: document.querySelector('meta[name="description"]')?.content ?? '',
          robots: [...document.querySelectorAll('meta[name]')].filter((meta) => ['robots', 'googlebot', 'bingbot'].includes(meta.name.toLowerCase())).map((meta) => meta.content).join(' '),
          canonical: [...document.querySelectorAll('link[rel="canonical"]')].map((link) => link.href),
          alternates: Object.fromEntries(alternates.map((link) => [link.hreflang, link.href])),
          ogUrl: document.querySelector('meta[property="og:url"]')?.content,
          ogImage: document.querySelector('meta[property="og:image"]')?.content,
          twitterTitle: document.querySelector('meta[name="twitter:title"]')?.content,
          twitterDescription: document.querySelector('meta[name="twitter:description"]')?.content,
          twitterImage: document.querySelector('meta[name="twitter:image"]')?.content,
          h1: [...(main?.querySelectorAll('h1') ?? [])].filter(visible).map((h1) => h1.textContent),
          text: text.join(' ').replace(/\s+/g, ' ').trim(),
          links: [...(main?.querySelectorAll('a[href]') ?? [])].filter(visible).map((link) => link.href),
          jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map((script) => JSON.parse(script.textContent)),
          assets: [...document.querySelectorAll('script[src], link[rel="stylesheet"], img[src], meta[property="og:image"]')].map((node) => node.src || node.href || node.content),
        }
      }).catch((error) => { throw new Error(`${entry.loc}: rendered observation: ${error.message}`) })
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
      log(`200 ${new URL(entry.loc).pathname} [${data.lang}] ${data.text.trim().length} characters`)
    }
    assert.ok(assets.size > 0, 'Derived no assets')
    for (const path of assets) {
      validateRobots(robotsText, site, [path])
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
    for (const entry of inventory.privateEntries) {
      assert.ok(!urls.has(entry.loc), `${entry.loc}: personal execution page in sitemap`)
      const url = local(entry.loc)
      const response = await request.get(url, { maxRedirects: 0 })
      assert.equal(response.status(), 200, `${entry.loc}: personal execution status`)
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      assert.match(await page.locator('meta[name="robots"]').getAttribute('content'), /noindex/i, `${entry.loc}: personal execution noindex`)
      privatePages.add(url)
    }
    assert.ok(privatePages.size > 0, 'Derived no personal execution links')
    // Detect user-agent-specific responses without enabling scripts or making player API calls.
    for (const agent of crawlers) {
      for (const entry of entries) {
        const response = await request.get(local(entry.loc), { maxRedirects: 0, headers: { 'User-Agent': agent } })
        assert.equal(response.status(), 200, `${entry.loc}: ${agent} direct status`)
        assertIndexable(response.headers()['x-robots-tag'] ?? '', `${entry.loc}: ${agent}`)
        const observed = await page.evaluate((html) => {
          const doc = new DOMParser().parseFromString(html, 'text/html')
          return {
            lang: doc.documentElement.lang,
            canonical: [...doc.querySelectorAll('link[rel="canonical"]')].map((link) => link.getAttribute('href')),
            robots: [...doc.querySelectorAll('meta[name]')].filter((meta) => ['robots', 'googlebot', 'bingbot'].includes(meta.name.toLowerCase())).map((meta) => meta.content).join(' '),
          }
        }, await response.text())
        assert.equal(observed.lang, Object.entries(entry.alternates).find(([lang, url]) => lang !== 'x-default' && url === entry.loc)[0], `${entry.loc}: ${agent} html lang`)
        assert.deepEqual(observed.canonical, [entry.loc], `${entry.loc}: ${agent} self canonical`)
        assertIndexable(observed.robots, `${entry.loc}: ${agent}`)
      }
    }
    for (const acceptLanguage of ['', 'de-DE,de;q=0.9', 'en-US,en;q=0.9', 'fr-FR']) {
      const response = await request.get(new URL('/', target).href, { maxRedirects: 0, headers: { 'Accept-Language': acceptLanguage, Cookie: 'PARAGLIDE_LOCALE=en' } })
      assert.equal(response.status(), 200, 'Stable root')
      assert.match(await response.text(), /<html lang="de"/, 'Stable German root')
    }
    for (const path of ['/de', '/de/']) {
      const response = await request.get(new URL(`${path}?source=seo`, target).href, { maxRedirects: 0 })
      assert.equal(response.status(), 301, `Legacy homepage ${path}`)
      assert.equal(new URL(response.headers().location, target).href, new URL('/?source=seo', target).href, 'Preserve query')
      if (target.protocol === 'http:') {
        const proxied = await request.get(new URL(`${path}?source=seo`, target).href, { maxRedirects: 0, headers: { 'X-Forwarded-Proto': 'https', 'X-Forwarded-Host': new URL(site).host } })
        assert.equal(proxied.status(), 301, `Proxy legacy homepage ${path}`)
        assert.equal(new URL(proxied.headers().location, site).href, `${site}/?source=seo`, `${path}: preserve public HTTPS and query behind proxy`)
      }
    }
    for (const prefix of locales) {
      const lesson = inventory.lessonEntries.find((entry) => entry.loc === entry.alternates[inventory.tags[prefix]])
      assert.ok(lesson, `Derived no lesson for ${prefix}`)
      const lessonParent = new URL(lesson.loc).pathname.split('/').slice(0, -1).join('/')
      for (const path of [`/${prefix}/this-page-does-not-exist`, `${lessonParent}/missing-lesson`]) {
        const response = await request.get(new URL(path, target).href, { maxRedirects: 0 })
        assert.equal(response.status(), 404, `Unknown URL ${path}`)
        assert.match(await response.text(), /noindex/, 'Missing pages noindex')
      }
    }
    // Exercise the same validator on deliberately broken observations, not a passing happy-path only.
    const sample = snapshots[0]
    assert.throws(() => validatePage({ ...sample.data, canonical: [`${site}/wrong`] }, sample.entry), /self canonical/)
    assert.throws(() => validatePage({ ...sample.data, text: '' }, sample.entry), /SSR content/)
    const result = { pages: entries.length, privatePages: privatePages.size, assets: assets.size }
    log(`OK SEO: ${result.pages} indexable pages, ${result.privatePages} noindex pages, ${result.assets} assets; negative controls rejected`)
    log('This checks rendered SEO contracts, not Google/Bing indexing, selected canonical, rankings or traffic. No console/DNS changes or indexing submissions.')
    return result
  } finally {
    signal?.removeEventListener('abort', interrupt)
    await browser.close()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  assert.ok(process.argv[2], 'Use npm run check:seo for the current build, or pass an explicit origin')
  await checkSeo(process.argv[2])
}
