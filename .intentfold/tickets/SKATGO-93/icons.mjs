// SKATGO-93: a centred logo (the human: 「你刚调整过的这个图标，非常对称，能否给我做成一套新的logo，因为老的不够对称……
// 还要保持以前的高清」). The old icons centre the master's drawn box (SKATGO-30/70), but the box's middle is not
// the middle of the mark: the diamond above, the spade and heart below. Here the centre is that of the circle
// through the three outer suits' centres, and every icon is cut about it.
//   1. app/brand/skatgo-logo-centred.png: the master (1408×1408) moved so that centre is the picture's — same
//      pixels, same size, nothing scaled.
//   2. app/public/logo-v2/: every icon the site uses, by the same names, sizes and paddings as before, plus
//      logo-mark.png (clear ground, for the turning logo) and sheet.png (old beside new), for the human to look at.
//   node .intentfold/tickets/SKATGO-93/icons.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from '../../../app/node_modules/playwright/index.mjs'

const APP = new URL('../../../app/', import.meta.url)
const b = await chromium.launch(); const page = await b.newPage()
await page.setContent('<canvas></canvas>')
const toB64 = `async (c) => { const u = new Uint8Array(await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s) }`
const png = (f) => 'data:image/png;base64,' + readFileSync(f).toString('base64')

// 1. Where the mark's centre is in the master, and the master moved onto it.
const master = png(new URL('brand/skatgo-logo.png', APP))
const centred = await page.evaluate(async ([src, toB64]) => {
  const enc = eval(toB64)
  const img = new Image(); img.src = src; await img.decode()
  const W = img.width, H = img.height
  const c = new OffscreenCanvas(W, H); const x = c.getContext('2d'); x.drawImage(img, 0, 0)
  const d = x.getImageData(0, 0, W, H).data
  const s = { orange: [0, 0, 0], green: [0, 0, 0], red: [0, 0, 0] }
  for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) {
    const p = (y * W + i) * 4, R = d[p], G = d[p + 1], B = d[p + 2]
    const k = R > 200 && G > 90 && G < 170 && B < 60 ? 'orange' : R < 80 && G > 60 && G < 130 && B < 80 && G > R + 20 ? 'green' : R > 180 && G < 60 && B < 60 ? 'red' : null
    if (k) { s[k][0] += i; s[k][1] += y; s[k][2]++ }
  }
  const [[ax, ay], [bx, by], [cx, cy]] = ['orange', 'green', 'red'].map((k) => [s[k][0] / s[k][2], s[k][1] / s[k][2]])
  const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by))
  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / D
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / D
  // Moved by whole pixels, so not one is resampled; the ground is white, as the master's.
  const dx = Math.round(W / 2 - ux), dy = Math.round(H / 2 - uy)
  const o = new OffscreenCanvas(W, H); const ox = o.getContext('2d')
  ox.fillStyle = '#ffffff'; ox.fillRect(0, 0, W, H); ox.drawImage(img, dx, dy)
  return { centre: [ux, uy], shift: [dx, dy], suits: s, b64: await enc(o) }
}, [master, toB64])
console.log('mark centre in the master', centred.centre.map((v) => v.toFixed(1)), 'moved by', centred.shift)
writeFileSync(new URL('brand/skatgo-logo-centred.png', APP), Buffer.from(centred.b64, 'base64'))
const src = 'data:image/png;base64,' + centred.b64

// The drawn area's reach from the centre: the icon is scaled so the farthest drawn pixel fits, in x and in y.
const reach = await page.evaluate(async (src) => {
  const img = new Image(); img.src = src; await img.decode()
  const W = img.width, H = img.height, c = new OffscreenCanvas(W, H); const x = c.getContext('2d'); x.drawImage(img, 0, 0)
  const d = x.getImageData(0, 0, W, H).data
  let r = 0
  for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) {
    const p = (y * W + i) * 4
    if (d[p] < 235 || d[p + 1] < 235 || d[p + 2] < 235) r = Math.max(r, Math.abs(i - W / 2), Math.abs(y - H / 2))
  }
  return r
}, src)
console.log('reach from the centre', reach)

/** A square PNG of `side`: white ground (or clear), the mark's centre in the middle, its reach `pad` (fraction
 *  of the side) from the edge, corners rounded by `round` (fraction of the side; 0 = square). */
const render = (side, pad, round, clear = false) => page.evaluate(async ([src, reach, side, pad, round, clear, toB64]) => {
  const enc = eval(toB64)
  const img = new Image(); img.src = src; await img.decode()
  const c = new OffscreenCanvas(side, side); const x = c.getContext('2d')
  x.imageSmoothingQuality = 'high'
  if (round > 0) { x.beginPath(); x.roundRect(0, 0, side, side, side * round); x.clip() }
  if (!clear) { x.fillStyle = '#ffffff'; x.fillRect(0, 0, side, side) }
  const k = (side * (1 - 2 * pad)) / (2 * reach)
  x.drawImage(img, side / 2 - (img.width / 2) * k, side / 2 - (img.height / 2) * k, img.width * k, img.height * k)
  const px = x.getImageData(0, 0, side, side); const d = px.data
  for (let i = 0; i < d.length; i += 4) {
    if (clear) { // white to clear, soft edges keeping their colour
      const a = Math.max(255 - d[i], 255 - d[i + 1], 255 - d[i + 2]) / 255
      if (a < 0.02) { d[i + 3] = 0; continue }
      for (let j = 0; j < 3; j++) d[i + j] = Math.round(Math.min(255, Math.max(0, (d[i + j] - 255 * (1 - a)) / a)))
      d[i + 3] = Math.round(d[i + 3] * a)
    } else if (d[i + 3] > 0 && d[i] > 240 && d[i + 1] > 240 && d[i + 2] > 240) { d[i] = 255; d[i + 1] = 255; d[i + 2] = 255 }
  }
  x.putImageData(px, 0, 0)
  return enc(c)
}, [src, reach, side, pad, round, clear, toB64]).then((s) => Buffer.from(s, 'base64'))

const ROUND = 0.22
const OUT = new URL('public/logo-v2/', APP)
const out = (name, buf) => { writeFileSync(new URL(name, OUT), buf); console.log(`public/logo-v2/${name}  ${buf.length} bytes`) }
const ico = await Promise.all([16, 32, 48].map((s) => render(s, 0.04, ROUND)))
out('favicon-32.png', ico[1])
const header = Buffer.alloc(6 + 16 * ico.length); header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(ico.length, 4)
let offset = header.length
ico.forEach((p, i) => {
  const e = 6 + 16 * i, s = [16, 32, 48][i]
  header.writeUInt8(s, e); header.writeUInt8(s, e + 1); header.writeUInt8(0, e + 2); header.writeUInt8(0, e + 3)
  header.writeUInt16LE(1, e + 4); header.writeUInt16LE(32, e + 6); header.writeUInt32LE(p.length, e + 8); header.writeUInt32LE(offset, e + 12)
  offset += p.length
})
out('favicon.ico', Buffer.concat([header, ...ico]))
out('apple-touch-icon.png', await render(180, 0.12, 0))
out('icon-192.png', await render(192, 0.1, ROUND))
out('icon-512.png', await render(512, 0.1, ROUND))
out('icon-maskable-512.png', await render(512, 0.21, 0))
out('logo-96.png', await render(96, 0.06, 0))
out('logo-mark.png', await render(192, 0.1, 0, true))

// A sheet for the human: each icon, old above new, at its own size, on grey with a crosshair through the middle.
const names = ['icon-512.png', 'icon-maskable-512.png', 'icon-192.png', 'apple-touch-icon.png', 'logo-96.png', 'favicon-32.png']
const files = names.map((n) => [png(new URL(`public/${n}`, APP)), png(new URL(n, OUT))])
const sheet = await page.evaluate(async ([files, toB64]) => {
  const enc = eval(toB64)
  const load = async (s) => { const i = new Image(); i.src = s; await i.decode(); return i }
  const imgs = await Promise.all(files.map(async ([a, b]) => [await load(a), await load(b)]))
  const gap = 32, W = imgs.reduce((w, [a]) => w + a.width + gap, gap), H = gap * 3 + 2 * 512 + 40
  const c = new OffscreenCanvas(W, H); const x = c.getContext('2d')
  x.fillStyle = '#d9dde3'; x.fillRect(0, 0, W, H)
  x.fillStyle = '#1f2a44'; x.font = '24px sans-serif'; x.fillText('old', 8, 28); x.fillText('new (centred)', 8, gap * 2 + 512 + 28)
  let left = gap
  for (const [a, b] of imgs) {
    for (const [img, top] of [[a, 40], [b, 40 + 512 + gap]]) {
      x.drawImage(img, left, top)
      x.strokeStyle = 'rgba(31,42,68,0.45)'; x.lineWidth = 1
      x.beginPath(); x.moveTo(left + img.width / 2, top); x.lineTo(left + img.width / 2, top + img.height); x.moveTo(left, top + img.height / 2); x.lineTo(left + img.width, top + img.height / 2); x.stroke()
    }
    left += a.width + gap
  }
  return enc(c)
}, [files, toB64])
out('sheet.png', Buffer.from(sheet, 'base64'))
await b.close()
