// SKATGO-29: the link-preview pictures (1200×630), one per page and language, into app/public/og/.
//
// Run against the built site (operations.md, "judged from what ships"):
//   (cd app && PORT=55029 node .output/server/index.mjs) &
//   node .intentfold/tickets/SKATGO-29/og.mjs http://localhost:55029
// with Playwright installed in this ticket's tmp/ (git-ignored): cd tmp && npm i playwright.
//
// Every page listed in the site's own sitemap gets a picture named after its og:image, showing the
// page's H1 beside the front page's own fan of cards — taken from the rendered front page, so the
// picture is the site's deck and type, not a drawing of them. Regenerate after a title changes.

import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const { chromium } = createRequire(join(here, 'tmp/'))('playwright')
const base = process.argv[2] ?? 'http://localhost:55029'
const out = join(here, '../../../app/public/og')
mkdirSync(out, { recursive: true })

const sitemap = await (await fetch(`${base}/sitemap.xml`)).text()
const pages = [...sitemap.matchAll(/<loc>https:\/\/skatgo\.com([^<]*)<\/loc>/g)].map((x) => x[1])

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
let done = 0
for (const path of pages) {
  const html = await (await fetch(base + path)).text()
  const image = /<meta property="og:image" content="[^"]*\/og\/([^"]+)"/.exec(html)?.[1]
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1].replace(/<[^>]+>/g, '').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&').trim()
  if (!image || !h1) throw new Error(`${path}: no og:image or h1`)
  const locale = path.split('/')[1]
  await page.goto(`${base}/${locale}`, { waitUntil: 'networkidle' })
  await page.evaluate(
    ({ h1, site }) => {
      const art = document.querySelector('[data-testid="entry-art"]').cloneNode(true)
      document.body.innerHTML = ''
      document.body.style.margin = '0'
      const frame = document.createElement('div')
      frame.style.cssText = 'width:1200px;height:630px;box-sizing:border-box;display:grid;grid-template-columns:1fr 470px;gap:48px;align-items:center;padding:64px;background:#FFFFFF;font-family:"Red Hat Display",sans-serif;'
      const text = document.createElement('div')
      text.style.cssText = 'display:flex;flex-direction:column;gap:28px;'
      text.innerHTML = `<div style="display:flex;align-items:center;gap:14px"><img src="/logo-96.png" style="width:56px;height:56px;border-radius:8px"><span style="font-size:34px;font-weight:700;color:#022657">SkatGo</span></div>
        <div style="font-size:${h1.length > 34 ? 54 : 64}px;line-height:1.05;font-weight:900;color:#022657;text-wrap:balance">${h1}</div>
        <div style="font-size:24px;font-weight:600;color:#00A878">${site}</div>`
      art.style.height = '502px'
      frame.append(text, art)
      document.body.append(frame)
    },
    { h1, site: 'skatgo.com' },
  )
  await page.waitForTimeout(150)
  await page.screenshot({ path: join(out, image), clip: { x: 0, y: 0, width: 1200, height: 630 } })
  done++
}
await browser.close()
console.log(`${done} pictures in ${out}`)
