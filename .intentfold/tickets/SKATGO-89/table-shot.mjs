// SKATGO-89: the picture of the table on "Skat in 5 Minuten" — a real free game, in each language,
// caught on the first trick: the hand at the bottom, cards in the middle, the two computers beside it.
// The game is moved by this script, never by hand: pass every bid, play the first card the table takes.
// Needs web and multiplayer running (free play is the server's), Playwright from app's devDependencies,
// and cwebp. Run from the repository root:
//   node .intentfold/tickets/SKATGO-89/table-shot.mjs http://127.0.0.1:55089
// It writes app/public/quick-start-table-{de,en}.webp, 960 px wide (480 CSS px at twice the density).
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '../../../app/node_modules/playwright/index.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const base = process.argv[2] ?? 'http://127.0.0.1:55089'
const out = join(here, '../../../app/public')
const scratch = mkdtempSync(join(tmpdir(), 'skatgo-shot-'))
const browser = await chromium.launch()
for (const [locale, path] of [['de', '/de/spielen'], ['en', '/en/play']]) {
  const page = await browser.newPage({ viewport: { width: 880, height: 550 }, deviceScaleFactor: 2 })
  await page.goto(base + path)
  await page.getByTestId('skat-table').waitFor({ timeout: 30000 })
  const caught = await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    const q = (s) => document.querySelector(s)
    const hand = () => document.querySelectorAll('[data-testid=skat-hand] [data-card]').length
    const middle = () => document.querySelectorAll('[data-testid=skat-frame] [data-card]:not([data-card=back])').length
    const t0 = Date.now()
    let led = false
    while (Date.now() - t0 < 120000) {
      await sleep(60)
      if (q('[data-testid=skat-result]')) { q('[data-testid=skat-new-game]')?.click(); led = false; continue }
      q('[data-testid=skat-pass]')?.click()
      // The first trick with cards in the middle and the hand still full: wait until the computers rest.
      if (middle() >= (led ? 2 : 1) && hand() >= 9) {
        const seen = `${middle()}/${hand()}`
        await sleep(1500)
        if (`${middle()}/${hand()}` === seen && !q('[data-testid=skat-result]')) return seen
        continue
      }
      // Forehand leads the first trick: play the first card the table takes.
      if (hand() === 10 && middle() === 0 && !q('[data-testid=skat-pass]')) {
        for (const b of document.querySelectorAll('[data-testid=skat-hand] button[data-card]')) {
          const n = hand()
          b.click()
          await sleep(80)
          if (hand() < n) { led = true; break }
        }
      }
    }
    return null
  })
  if (!caught) throw new Error(`${locale}: no first trick caught`)
  const png = join(scratch, `table-${locale}.png`)
  await page.screenshot({ path: png })
  execFileSync('cwebp', ['-quiet', '-q', '78', '-resize', '960', '0', png, '-o', join(out, `quick-start-table-${locale}.webp`)])
  console.log(`${locale}: caught ${caught} (cards in the middle / in the hand)`)
  await page.close()
}
await browser.close()
