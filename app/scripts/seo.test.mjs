import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtemp, chmod, rm, writeFile, readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { connect } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import test from 'node:test'
import { chromium } from 'playwright'
import { checkSeo } from './check-seo.mjs'
import { deriveInventory, loadInventory } from './seo-inventory.mjs'
import { robotsAllows } from './seo-robots.mjs'
import { parseArgs, runSeo, selectPort, preferredPorts } from './run-seo.mjs'

const root = new URL('../../', import.meta.url)

async function listening(port) {
  return new Promise((resolve) => {
    const socket = connect(port, '127.0.0.1')
    socket.once('connect', () => { socket.destroy(); resolve(true) })
    socket.once('error', () => resolve(false))
  })
}

async function close(server) {
  server.closeAllConnections()
  await new Promise((resolve) => server.close(resolve))
}

test('CLI requires explicit origins and does not silently check production', () => {
  assert.deepEqual(parseArgs([]), { built: false, origin: undefined })
  assert.deepEqual(parseArgs(['https://skatgo.com']), { built: false, origin: 'https://skatgo.com' })
  for (const args of [['--built', 'https://skatgo.com'], ['--skip'], ['https://example.com/path'], ['https://user:secret@example.com']]) {
    assert.throws(() => parseArgs(args))
  }
})

test('source-backed new pages and lessons join coverage; omissions and empty sources fail', () => {
  const input = {
    routes: ['/', '/course/$slug'], pages: ['/'], privatePaths: [],
    locales: ['de', 'en'], tags: { de: 'de', en: 'en' }, site: 'https://skatgo.com',
    guides: { de: { one: { slug: 'eins' } }, en: { one: { slug: 'one' } } },
    courseIds: { de: ['one'], en: ['one'] },
    lessonPath: (id, locale) => `/course/${locale}-${id}`,
    patterns: [{ pattern: '/', localized: [['de', '/'], ['en', '/en']] }, { pattern: '/:path(.*)?', localized: [['de', '/de/:path(.*)?'], ['en', '/en/:path(.*)?']] }],
  }
  const before = deriveInventory(input)
  const added = deriveInventory({
    ...input, routes: [...input.routes, '/new'], pages: [...input.pages, '/new'],
    guides: { de: { ...input.guides.de, two: { slug: 'zwei' } }, en: { ...input.guides.en, two: { slug: 'two' } } },
    courseIds: { de: ['one', 'two'], en: ['one', 'two'] },
  })
  assert.equal(added.entries.length - before.entries.length, 4)
  assert.ok(added.entries.some((entry) => entry.loc.endsWith('/de/new')))
  assert.ok(added.entries.some((entry) => entry.loc.endsWith('/en/course/en-two')))
  assert.throws(() => deriveInventory({ ...input, routes: [...input.routes, '/forgotten'] }), /registry \/ file route coverage/)
  assert.throws(() => deriveInventory({ ...input, locales: [] }), /no configured locales/)
  assert.throws(() => deriveInventory({ ...input, guides: { de: {}, en: {} } }), /no lesson guides/)
  assert.throws(() => deriveInventory({ ...input, guides: { de: input.guides.de, en: {} } }), /lesson language coverage/)
  assert.throws(() => deriveInventory({ ...input, courseIds: { de: ['one', 'missing'], en: ['one', 'missing'] } }), /course \/ lesson guide coverage/)
  assert.throws(() => deriveInventory({ ...input, routes: [...input.routes, '/new/$id'] }), /no source-backed targets/)
})

test('crawler groups, wildcards and longest allow rules are interpreted', () => {
  const text = 'User-agent: *\nDisallow: /\nUser-agent: Googlebot\nDisallow: /de/*\nAllow: /de/kurs$\nUser-agent: Bingbot\nDisallow: /en/';
  assert.ok(robotsAllows(text, 'Googlebot', '/de/kurs'))
  assert.ok(!robotsAllows(text, 'Googlebot', '/de/kurs/lesson'))
  assert.ok(!robotsAllows(text, 'Bingbot', '/en/course'))
  assert.ok(robotsAllows(text, 'Bingbot', '/de/kurs'))
  assert.ok(!robotsAllows(text, 'Otherbot', '/'))
  assert.ok(robotsAllows('User-agent: *\nDisallow: /de\nAllow: /de', 'Googlebot', '/de'))
})

test('owned preview and same crawler reject actual broken responses', { timeout: 180_000 }, async (t) => {
  let ownedPort
  const unrelated = createServer((_, response) => response.end('unrelated listener'))
  const { ports } = JSON.parse(await readFile(new URL('.intentfold/project.json', root), 'utf8'))
  const [preferred] = preferredPorts()
  await new Promise((resolve) => unrelated.listen(preferred, '127.0.0.1', resolve))
  try {
    await runSeo({ built: true }, {
      inspect: async (origin) => {
        ownedPort = new URL(origin).port
        assert.notEqual(Number(ownedPort), preferred)
        assert.ok(await listening(preferred), 'Unrelated listener must remain alive')
        const browser = await chromium.launch({ headless: process.env.HEADED !== '1' })
        const parser = await browser.newPage()
        const inventory = await loadInventory()
        const first = inventory.entries[0]
        let mutation
        let hits = 0
        const proxy = createServer(async (incoming, outgoing) => {
          try {
            assert.ok(['GET', 'HEAD'].includes(incoming.method), 'Fault proxy must remain read-only')
            const url = new URL(incoming.url, origin)
            const headers = { ...incoming.headers, host: new URL(origin).host }
            const source = await fetch(url, { headers, redirect: 'manual' })
            const responseHeaders = Object.fromEntries(source.headers)
            delete responseHeaders['content-encoding']
            delete responseHeaders['content-length']
            delete responseHeaders['transfer-encoding']
            let body = Buffer.from(await source.arrayBuffer())
            let status = source.status
            const changed = await mutation?.({ url, status, headers: responseHeaders, requestHeaders: incoming.headers, body, parser, first, inventory })
            if (changed) {
              hits++
              body = changed.body ?? body
              status = changed.status ?? status
            }
            outgoing.writeHead(status, responseHeaders)
            outgoing.end(body)
          } catch (error) {
            outgoing.writeHead(500)
            outgoing.end(error.message)
          }
        })
        const proxyPort = await selectPort(Number(ownedPort) + 1, ports.web.ticket_prefix)
        await new Promise((resolve) => proxy.listen(proxyPort, '127.0.0.1', resolve))
        const target = `http://127.0.0.1:${proxyPort}`
        const pageMutation = (change) => async (args) => {
          if (args.url.pathname !== new URL(first.loc).pathname) return
          const body = await parser.evaluate(({ html, change }) => {
            const doc = new DOMParser().parseFromString(html, 'text/html')
            const main = doc.querySelector('main')
            if (change === 'canonical') doc.querySelector('link[rel="canonical"]').setAttribute('href', 'https://skatgo.com/wrong')
            if (change === 'empty') main.replaceChildren()
            if (change === 'hidden') doc.body.style.opacity = '0'
            if (change === 'offscreen') main.style.transform = 'translateX(-100000px)'
            if (change === 'noindex') doc.querySelector('meta[name="robots"]').content = 'noindex, follow'
            if (change === 'botmeta') {
              const meta = doc.createElement('meta')
              meta.name = 'googlebot'
              meta.content = 'none'
              doc.head.append(meta)
            }
            if (change === 'hreflang') doc.querySelector('link[hreflang="en"]').remove()
            if (change === 'language') doc.documentElement.lang = 'de'
            if (change === 'jsonld') doc.querySelector('script[type="application/ld+json"]').textContent = '{'
            return `<!doctype html>${doc.documentElement.outerHTML}`
          }, { html: args.body.toString(), change })
          return { body }
        }
        const scenarios = [
          ['canonical', pageMutation('canonical'), /self canonical/],
          ['empty body', pageMutation('empty'), /visible H1/],
          ['hidden ancestor', pageMutation('hidden'), /visible H1/],
          ['offscreen body', pageMutation('offscreen'), /visible H1/],
          ['noindex', pageMutation('noindex'), /indexing\/following blocked/],
          ['crawler meta', pageMutation('botmeta'), /indexing\/following blocked/],
          ['head hreflang', pageMutation('hreflang'), /head\/sitemap alternates/],
          ['wrong language', pageMutation('language'), /html lang/],
          ['malformed structured data', pageMutation('jsonld'), /JSON/],
          ['missing sitemap page', async ({ url, body }) => {
            if (url.pathname !== '/sitemap.xml') return
            return { body: await parser.evaluate((xml) => {
              const doc = new DOMParser().parseFromString(xml, 'application/xml')
              doc.getElementsByTagNameNS('*', 'url')[0].remove()
              return new XMLSerializer().serializeToString(doc)
            }, body.toString()) }
          }, /page-language coverage/],
          ['missing sitemap language', async ({ url, body }) => {
            if (url.pathname !== '/sitemap.xml') return
            return { body: await parser.evaluate((xml) => {
              const doc = new DOMParser().parseFromString(xml, 'application/xml')
              for (const link of [...doc.getElementsByTagNameNS('*', 'link')]) if (link.getAttribute('hreflang') === 'en') link.remove()
              return new XMLSerializer().serializeToString(doc)
            }, body.toString()) }
          }, /source-backed sitemap alternates/],
          ['Googlebot disallow', async ({ url }) => url.pathname === '/robots.txt' ? { body: 'User-agent: Googlebot\nDisallow: /en/\nSitemap: https://skatgo.com/sitemap.xml' } : undefined, /Googlebot blocked/],
          ['Bingbot disallow', async ({ url }) => url.pathname === '/robots.txt' ? { body: 'User-agent: Bingbot\nDisallow: /de/*\nSitemap: https://skatgo.com/sitemap.xml' } : undefined, /Bingbot blocked/],
          ['header noindex', async ({ url, headers }) => {
            if (url.pathname !== new URL(first.loc).pathname) return
            headers['x-robots-tag'] = 'googlebot: noindex'
            return {}
          }, /indexing\/following blocked/],
          ['Googlebot-only canonical', async (args) => args.requestHeaders['user-agent'] === 'Googlebot' ? pageMutation('canonical')(args) : undefined, /Googlebot self canonical/],
          ['missing resource', async ({ url }) => url.pathname.startsWith('/assets/') && url.pathname.endsWith('.js') ? { status: 404, body: 'missing' } : undefined, /Asset \/assets/],
          ['execution page indexable', async ({ url, body }) => {
            if (url.pathname !== new URL(inventory.privateEntries[0].loc).pathname) return
            return { body: body.toString().replaceAll('noindex', 'index') }
          }, /noindex/],
          ['HTTPS downgrade', async ({ url, headers, requestHeaders }) => {
            if (url.pathname !== '/de' || requestHeaders['x-forwarded-proto'] !== 'https') return
            headers.location = `http://skatgo.com/${url.search}`
            return {}
          }, /Preserve query|HTTPS/],
          ['lost redirect query', async ({ url, headers }) => {
            if (url.pathname !== '/de') return
            headers.location = '/'
            return {}
          }, /Preserve query/],
          ['soft 404', async ({ url }) => url.pathname.includes('this-page-does-not-exist') ? { status: 200 } : undefined, /Unknown URL/],
        ]
        try {
          for (const [name, mutate, expected] of scenarios) {
            await t.test(name, async () => {
              mutation = mutate
              hits = 0
              await assert.rejects(checkSeo(target, { quiet: true }), expected)
              assert.ok(hits > 0, `${name}: fault must reach real HTTP response`)
            })
          }
          mutation = undefined
          // Explicit mode must neither take over nor shut down the proxy/server.
          const result = await runSeo({ origin: target })
          assert.equal(result.pages, inventory.entries.length)
          assert.ok(await listening(proxyPort))
          assert.ok(await listening(ownedPort))
        } finally {
          await close(proxy)
          await browser.close()
        }
      },
    })
    assert.ok(!await listening(ownedPort), 'Successful check must release owned port')
    assert.ok(await listening(preferred), 'Unrelated listener must survive check')
    await assert.rejects(runSeo({ built: true }, {
      inspect: async (origin) => { ownedPort = new URL(origin).port; throw new Error('injected crawl failure') },
    }), /injected crawl failure/)
    assert.ok(!await listening(ownedPort), 'Failed check must release owned port')
    await assert.rejects(runSeo({ built: true }, {
      inspect: async (origin, { signal }) => {
        ownedPort = new URL(origin).port
        process.emit('SIGINT')
        await delay(100, undefined, { signal })
      },
    }), /abort/i)
    assert.ok(!await listening(ownedPort), 'Interrupted check must release owned port')
    assert.ok(await listening(preferred))
  } finally {
    await close(unrelated)
  }
})

test('a failed fresh build propagates nonzero and never starts a preview', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'skatgo-seo-build-'))
  const npm = join(directory, 'npm')
  try {
    await writeFile(npm, '#!/bin/sh\nexit 23\n')
    await chmod(npm, 0o700)
    const child = spawn(process.execPath, ['app/scripts/run-seo.mjs'], {
      cwd: root, env: { ...process.env, PATH: `${directory}:${process.env.PATH}` }, stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''
    child.stdout.on('data', (chunk) => { output += chunk })
    child.stderr.on('data', (chunk) => { output += chunk })
    const [code] = await once(child, 'exit')
    assert.equal(code, 1)
    assert.match(output, /exit 23/)
    assert.ok(!output.includes('SEO owned preview'))
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
