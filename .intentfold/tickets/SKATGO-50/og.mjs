// SKATGO-50: SKATGO-29's link-preview pictures (1200×630), redrawn for the pages whose H1 changed and
// drawn for the new bidding table — only the pages named on the command line, the rest stay as they are.
//
// Run against the built site:
//   (cd app && PORT=55050 node .output/server/index.mjs) &
//   node .intentfold/tickets/SKATGO-50/og.mjs http://localhost:55050 /de/regeln /en/rules ...
// Playwright comes from app/'s devDependencies.
//
// Same picture as SKATGO-29's og.mjs: the page's H1 beside the front page's own fan of cards.

import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const { chromium } = createRequire(join(here, '../../../app/'))('playwright')
const base = process.argv[2] ?? 'http://localhost:55050'
const out = join(here, '../../../app/public/og')
mkdirSync(out, { recursive: true })

const pages = process.argv.slice(3)
if (pages.length === 0) throw new Error('name the pages to draw')

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
      // The picture's box keeps the hero picture's own proportions; fit its width to the column (SKATGO-33).
      art.style.width = '470px'
      art.style.height = 'auto'
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
