// The SkatGo screenshots on the comparison page (SKATGO-228): phone-sized pictures of SkatGo's own screens, taken from a
// running build of this checkout and written as WebP to app/public/compare/<name>-<locale>.webp. Regenerate them, never
// edit them. Needs a local web server and its multiplayer service (free play deals on the server), and `cwebp` on the PATH.
//
//   node app/scripts/make-compare-shots.mjs http://localhost:<web-port>
//
// It opens free play (which deals one game on the local service), so never point it at the published site.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const { chromium } = createRequire(path.join(root, 'package.json'))('playwright')
const origin = process.argv[2]
if (!origin || !/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) throw new Error('Usage: make-compare-shots.mjs http://localhost:<port> (local servers only)')

const out = path.join(root, 'public', 'compare')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'compare-shots-'))
fs.mkdirSync(out, { recursive: true })

/** Each screen: its address per language and what to do before the picture is taken. */
const SHOTS = [
  {
    name: 'odds',
    path: { de: '/de/spielen', en: '/en/play' },
    async ready(page) {
      await page.getByTestId('skat-table').waitFor({ timeout: 30000 })
      await page.getByTestId('skat-power-ups-tab').click()
      await page.waitForTimeout(2500)
    },
  },
  {
    name: 'bidding',
    path: { de: '/de/bidding-practice', en: '/en/bidding-practice' },
    async ready(page) {
      await page.getByTestId('bidding-practice-contract').getByRole('button').first().click()
      await page.getByTestId('bidding-practice-result').waitFor()
      // The explanation, not the buttons, is what the picture is for.
      await page.getByTestId('bidding-practice-result').evaluate((el) => el.scrollIntoView({ block: 'center' }))
      await page.waitForTimeout(1500)
    },
  },
  {
    name: 'endgame',
    path: { de: '/de/skat-tricks/offenes-endspiel-1', en: '/en/skat-tricks/offenes-endspiel-1' },
    async ready(page) {
      await page.getByTestId('skat-table').waitFor({ timeout: 30000 })
      await page.waitForTimeout(2000)
    },
  },
  {
    name: 'lesson',
    path: { de: '/de/kurs/wie-funktioniert-skat', en: '/en/course/how-does-skat-work' },
    async ready(page) {
      await page.waitForTimeout(2000)
    },
  },
]

const browser = await chromium.launch()
for (const locale of ['de', 'en']) {
  for (const shot of SHOTS) {
    const context = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: locale === 'de' ? 'de-DE' : 'en-GB' })
    const page = await context.newPage()
    await page.goto(origin + shot.path[locale], { waitUntil: 'load' })
    await shot.ready(page)
    const png = path.join(tmp, `${shot.name}-${locale}.png`)
    await page.screenshot({ path: png })
    const webp = path.join(out, `${shot.name}-${locale}.webp`)
    // 780 × 1560 device pixels, drawn at most 390 wide: sharp on a phone, a few dozen KB each.
    execFileSync('cwebp', ['-quiet', '-q', '78', png, '-o', webp])
    console.log(`${path.relative(root, webp)} ${fs.statSync(webp).size} bytes`)
    await context.close()
  }
}
await browser.close()
