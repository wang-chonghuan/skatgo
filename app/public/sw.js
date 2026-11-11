// SkatGo's service worker (SKATGO-185), registered by lib/service-worker.ts as /sw.js?v=<build>. It does two things only:
//  - a page the network cannot bring becomes the offline page of its language, kept on the device: /en/offline or
//    /de/offline, naming the page asked for (?from=), with the stylesheet and scripts it needs;
//  - the site's pictures, sounds and fonts come from the device once fetched, and are fetched again behind.
// Everything else — pages that load, /api, /hx, the program files, other sites — goes to the network as without it.
// Each build registers a new version, which keeps the offline pages of that build and drops the older ones.

const VERSION = new URL(self.location.href).searchParams.get('v') || '0'
const PAGES = `skatgo-offline-${VERSION}`
const MEDIA = 'skatgo-media'
const OFFLINE = { en: '/en/offline', de: '/de/offline' }
const MEDIA_FILE = /\.(webp|png|jpe?g|svg|ico|mp3|woff2?)$/

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(PAGES)
    for (const path of Object.values(OFFLINE)) {
      const page = await fetch(path, { credentials: 'omit', cache: 'no-store' })
      if (!page.ok) throw new Error(`offline page ${path}: ${page.status}`)
      const html = await page.clone().text()
      await cache.put(path, page)
      const files = [...html.matchAll(/(?:href|src)="(\/assets\/[^"]+)"/g)].map((m) => m[1])
      await cache.addAll([...new Set(files)])
      // The pictures it shows, such as the header's logo, with the site's other pictures.
      const pictures = [...html.matchAll(/(?:href|src)="(\/[^"/][^"]*)"/g)].map((m) => m[1]).filter((p) => MEDIA_FILE.test(p))
      await (await caches.open(MEDIA)).addAll([...new Set(pictures)]).catch(() => {})
    }
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('skatgo-offline-') && key !== PAGES) await caches.delete(key)
    await self.clients.claim()
  })())
})

/** The language of a path: the site's rule — /en is English, every other address German, the bare root by the browser. */
function langOf(path) {
  if (path === '/en' || path.startsWith('/en/')) return 'en'
  if (path === '/') return /^de\b/i.test(self.navigator.language || 'de') ? 'de' : 'en'
  return 'de'
}

async function offline(request) {
  const url = new URL(request.url)
  const page = OFFLINE[langOf(url.pathname)]
  if (url.pathname === page) {
    const kept = await caches.match(page, { ignoreSearch: true, cacheName: PAGES })
    return kept || Response.error()
  }
  return Response.redirect(`${page}?from=${encodeURIComponent(url.pathname + url.search)}`, 302)
}

async function media(event) {
  const cache = await caches.open(MEDIA)
  const kept = await cache.match(event.request)
  const fresh = fetch(event.request).then(async (response) => {
    if (response.status === 200 && response.type === 'basic') await cache.put(event.request, response.clone()).catch(() => {})
    return response
  })
  if (!kept) return fresh
  event.waitUntil(fresh.catch(() => {}))
  return kept
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => offline(request)))
    return
  }
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/hx/')) return
  // The offline pages' own files, kept with them; the browser's cache serves the rest.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(caches.match(request, { cacheName: PAGES }).then((kept) => kept || fetch(request)))
    return
  }
  if (MEDIA_FILE.test(url.pathname)) event.respondWith(media(event))
})
