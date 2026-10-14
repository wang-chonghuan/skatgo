// SKATGO-102: the card backs to choose from, each a 500×700 WebP (the 5:7 of skatgo's cards) in
// app/public/cards/backs/. Drawn in the browser's canvas (Playwright, from app's devDependencies), encoded by cwebp.
//   - k5-logo: Kenney's blue framed back (Boardgame Pack, CC0) with the SkatGo logo in the middle where its suits were,
//     in the frame's darker blue as they were (the human: 「默认选k5，但是中间的花色，要换成我的logo」, then 「不要那个
//     白色的圈」, 「也不要彩色的，要想原图那样隐去」). The frame is Kenney's own vector (pattern 3, which is pattern 5
//     without its suits).
//   - kenney-*: Kenney's backs, from the pack's vector file.
//   - bdr-*: BdRGames' "Playing cards back vector SVG" (CC0).
//   - sylly-*: Sylly's "Cards set" (CC0), from its vector file.
//   - jeff-*: jeffshee's "Colorful Poker Card Back" (CC-BY 3.0: credit is required).
//   - itch-*: the CARDBACK BUNDLE (itch.io, chaakravue, CC0).
// A source a few per cent off 5:7 is fitted to it whole, not cropped, so its own border stays even.
//   node .intentfold/tickets/SKATGO-102/make-backs.mjs <folder with the downloaded packs>
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { chromium } from '../../../app/node_modules/playwright/index.mjs'

const SRC = process.argv[2]
if (!SRC) throw new Error('the folder with the downloaded packs')
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..')
const OUT = path.join(ROOT, 'app/public/cards/backs')
mkdirSync(OUT, { recursive: true })
const W = 500, H = 700
const uri = (file, type) => `data:${type};base64,${readFileSync(path.join(SRC, file)).toString('base64')}`
const kenneySvg = 'data:image/svg+xml;base64,' + Buffer.from(readFileSync(path.join(SRC, 'kenney/Vector/playingCards_back.svg'), 'utf8')
  .replace('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">', '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 760 610" width="760" height="610">')).toString('base64')
const logo = 'data:image/png;base64,' + readFileSync(path.join(ROOT, 'app/public/logo-mark.png')).toString('base64')

const b = await chromium.launch()
const p = await b.newPage()
await p.setContent('<html></html>')
/** Draw `src` (or the region sx, sy, sw, sh of it, at `scale` for a vector) into a 500×700 card; `logo` adds the mark. */
const card = (job) => p.evaluate(async ({ job, W, H }) => {
  const img = new Image(); img.src = job.src; await img.decode()
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d')
  x.imageSmoothingQuality = 'high'
  if (job.region) {
    const [sx, sy, sw, sh] = job.region, s = job.scale
    const big = document.createElement('canvas'); big.width = Math.ceil(sw * s); big.height = Math.ceil(sh * s)
    big.getContext('2d').drawImage(img, -sx * s, -sy * s, img.naturalWidth * s || img.width * s, img.naturalHeight * s || img.height * s)
    x.drawImage(big, 0, 0, W, H)
  } else x.drawImage(img, 0, 0, W, H)
  if (job.logo) {
    const mark = new Image(); mark.src = job.logo.src; await mark.decode()
    const cx = W / 2, cy = H / 2
    // the mark's shape in the frame's darker blue, as Kenney's suits were drawn
    const m = document.createElement('canvas'); m.width = 250; m.height = 250; const mx = m.getContext('2d')
    mx.drawImage(mark, 0, 0, 250, 250); mx.globalCompositeOperation = 'source-in'; mx.fillStyle = '#3D77AB'; mx.fillRect(0, 0, 250, 250)
    x.drawImage(m, cx - 125, cy - 125)
  }
  return c.toDataURL('image/png').split(',')[1]
}, { job, W, H })

/** The bottom row of Sylly's sheet: each card's box, found as runs of drawn pixels. */
const syllyBoxes = await p.evaluate(async (src) => {
  const img = new Image(); img.src = src; await img.decode()
  const s = 4, c = document.createElement('canvas'); c.width = img.naturalWidth * s; c.height = img.naturalHeight * s
  const x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height)
  const d = x.getImageData(0, 0, c.width, c.height).data
  const ink = (i, j) => { const o = (j * c.width + i) * 4; return d[o + 3] > 200 && (d[o] < 240 || d[o + 1] < 240 || d[o + 2] < 240) }
  // the last row of cards: scan up from the bottom for the first line with ink, then the band of rows with ink
  let bottom = c.height - 1; while (bottom > 0 && ![...Array(c.width).keys()].some((i) => ink(i, bottom))) bottom--
  let top = bottom; while (top > 0 && [...Array(c.width).keys()].some((i) => ink(i, top))) top--
  // a column belongs to a card when any row of the band has ink in it; cards are the runs of such columns
  const col = Array.from({ length: c.width }, (_, i) => { for (let j = top + 1; j <= bottom; j++) if (ink(i, j)) return true; return false })
  const boxes = []
  for (let i = 0; i < c.width; i++) {
    if (!col[i]) continue
    let j = i; while (j < c.width && col[j]) j++
    if (j - i > 20 * s) boxes.push([i / s, (top + 1) / s, (j - i) / s, (bottom - top) / s])
    i = j
  }
  return boxes
}, uri('sylly/Vector/Cards.svg', 'image/svg+xml'))
if (syllyBoxes.length !== 6) throw new Error(`Sylly's backs: ${syllyBoxes.length} boxes, not 6`)

const KENNEY_ROW = { red: 10, green: 210, blue: 410 }
const kenney = (color, n) => ({ src: kenneySvg, region: [10 + 150 * (n - 1), KENNEY_ROW[color], 140, 190], scale: 4 })
const jobs = [
  ['k5-logo', { ...kenney('blue', 3), logo: { src: logo, kind: 'blue' } }],
  ...[1, 2, 3, 4, 5].map((n) => [`kenney-blue-${n}`, kenney('blue', n)]),
  ['kenney-red-1', kenney('red', 1)],
  ['kenney-green-3', kenney('green', 3)],
  ...[1, 2, 3].map((n) => [`bdr-${n}-blue`, { src: uri(`bdr/player_card_back_design_${n}_blue.svg`, 'image/svg+xml') }]),
  ...[1, 2, 3].map((n) => [`bdr-${n}-red`, { src: uri(`bdr/player_card_back_design_${n}_red.svg`, 'image/svg+xml') }]),
  ['bdr-2-green', { src: uri('bdr/player_card_back_design_2_green.svg', 'image/svg+xml') }],
  ['bdr-3-black', { src: uri('bdr/player_card_back_design_3_black.svg', 'image/svg+xml') }],
  // Sylly's bottom row: red 1, red 2, blue 1, blue 2, grey 1, grey 2
  ...['red-1', 'red-2', 'blue-1', 'blue-2', 'grey-1', 'grey-2'].map((name, i) => [`sylly-${name}`, { src: uri('sylly/Vector/Cards.svg', 'image/svg+xml'), region: syllyBoxes[i], scale: 4 }]),
  ...['black', 'blue', 'green', 'orange', 'purple'].map((c) => [`jeff-${c}`, { src: uri(`jeff/${c}.png`, 'image/png') }]),
  ...[1, 2, 3, 4, 5, 6].map((n) => [`itch-${n}`, { src: uri(`itch/${n}.png`, 'image/png') }]),
]
for (const [name, job] of jobs) {
  const tmp = path.join(tmpdir(), `back-${process.pid}-${name}.png`)
  writeFileSync(tmp, Buffer.from(await card(job), 'base64'))
  execFileSync('cwebp', ['-quiet', '-q', '85', tmp, '-o', path.join(OUT, `${name}.webp`)])
  rmSync(tmp)
}
await b.close()
console.log(`${jobs.length} backs in ${path.relative(ROOT, OUT)}`)
