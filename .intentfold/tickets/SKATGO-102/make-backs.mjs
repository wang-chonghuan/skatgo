// SKATGO-102: the card backs, each a 500×700 WebP (the 5:7 of skatgo's cards) in app/public/cards/backs/, cut from
// the masters app/brand/cards/generate.sh made with the image model (kind back2: the earlier back's style, less
// dense — the human: 「不要太细密，否则有密集恐惧症，但是也不要留白」 — with an empty medallion in the middle). The
// SkatGo logo goes into the medallion in the back's own other colour, small (「把我的logo贴上去（不要彩色，要和牌背
// 一致，这样低调不夸张）」): the medallion's colour is read at the centre, the logo takes the colour farthest from it.
// Drawn in the browser's canvas (Playwright, from app's devDependencies), encoded by cwebp.
//   node .intentfold/tickets/SKATGO-102/make-backs.mjs
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { chromium } from '../../../app/node_modules/playwright/index.mjs'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..')
const MASTERS = path.join(ROOT, 'app/brand/cards/masters')
const OUT = path.join(ROOT, 'app/public/cards/backs')
const BACKS = ['charcoal', 'navy', 'burgundy', 'green']
mkdirSync(OUT, { recursive: true })
const logo = 'data:image/png;base64,' + readFileSync(path.join(ROOT, 'app/public/logo-mark.png')).toString('base64')

const b = await chromium.launch()
const p = await b.newPage()
await p.setContent('<html></html>')
for (const name of BACKS) {
  const master = 'data:image/webp;base64,' + readFileSync(path.join(MASTERS, `back-${name}.webp`)).toString('base64')
  const png = await p.evaluate(async ({ master, logo }) => {
    const W = 500, H = 700
    const img = new Image(); img.src = master; await img.decode()
    const mark = new Image(); mark.src = logo; await mark.decode()
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d')
    x.imageSmoothingQuality = 'high'
    // the master is 2:3, the card 5:7: half the difference is cut evenly at top and bottom, the other half taken up
    // by widening the picture a little (about 3.6 %), so the ornament keeps most of its edge (the human: 「上下边缘
    // 花纹刚好被截掉了一点」) and its circles still look round
    const cover = (img.width * H) / W
    const sh = (img.height + cover) / 2
    x.drawImage(img, 0, (img.height - sh) / 2, img.width, sh, 0, 0, W, H)
    const d = x.getImageData(0, 0, W, H).data
    const at = (i, j) => { const o = (j * W + i) * 4; return [d[o], d[o + 1], d[o + 2]] }
    const fill = at(W / 2, H / 2)
    const far = (q) => Math.hypot(q[0] - fill[0], q[1] - fill[1], q[2] - fill[2])
    const sum = [0, 0, 0]; let n = 0
    for (let j = 0; j < H; j += 3) for (let i = 0; i < W; i += 3) { const q = at(i, j); if (far(q) > 120) { sum[0] += q[0]; sum[1] += q[1]; sum[2] += q[2]; n++ } }
    const ink = `rgb(${sum.map((v) => Math.round(v / n)).join(',')})`
    const size = 78
    const m = document.createElement('canvas'); m.width = m.height = size; const mx = m.getContext('2d')
    mx.drawImage(mark, 0, 0, size, size); mx.globalCompositeOperation = 'source-in'; mx.fillStyle = ink; mx.fillRect(0, 0, size, size)
    x.drawImage(m, W / 2 - size / 2, H / 2 - size / 2)
    return c.toDataURL('image/png').split(',')[1]
  }, { master, logo })
  const tmp = path.join(tmpdir(), `back-${process.pid}-${name}.png`)
  writeFileSync(tmp, Buffer.from(png, 'base64'))
  execFileSync('cwebp', ['-quiet', '-q', '86', tmp, '-o', path.join(OUT, `${name}.webp`)])
  rmSync(tmp)
}
await b.close()
console.log(`${BACKS.length} backs in ${path.relative(ROOT, OUT)}`)
