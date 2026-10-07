// The printables' PDFs (SKATGO-53): every page that offers a PDF download is printed to that file, A4,
// exactly as a browser prints it (the print styles leave only the title and the tables). The pages are
// found through the site's own sitemap and each page names its file in its download link, so a new or
// renamed printable needs nothing here. Rerun after the printables' text or the rules change, and commit
// the PDFs in app/public/downloads/.
//
//   npm --prefix app run build
//   (cd app && PORT=<port> node .output/server/index.mjs) &
//   node app/scripts/make-printables.mjs http://127.0.0.1:<port>

import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const base = process.argv[2]
if (!base) throw new Error('usage: node app/scripts/make-printables.mjs <running site origin>')
const publicDir = join(dirname(fileURLToPath(import.meta.url)), '../public')

const sitemap = await (await fetch(`${base}/sitemap.xml`)).text()
const paths = [...sitemap.matchAll(/<loc>https:\/\/skatgo\.com([^<]*)<\/loc>/g)].map((x) => x[1])

const browser = await chromium.launch()
const page = await browser.newPage()
let made = 0
for (const path of paths) {
  const html = await (await fetch(base + path)).text()
  const file = /data-testid="pdf-download"[^>]*href="([^"]+\.pdf)"|href="([^"]+\.pdf)"[^>]*data-testid="pdf-download"/.exec(html)
  const href = file?.[1] ?? file?.[2]
  if (!href) continue
  await page.goto(base + path, { waitUntil: 'networkidle' })
  const out = join(publicDir, href)
  mkdirSync(dirname(out), { recursive: true })
  await page.pdf({ path: out, format: 'A4', margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' } })
  console.log(`${path} → ${href}`)
  made++
}
await browser.close()
if (made === 0) throw new Error('no page offers a PDF download')
console.log(`${made} PDFs in ${join(publicDir, 'downloads')}`)
