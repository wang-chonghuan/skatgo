// SKATGO-23: cut every icon the site needs from the one master logo (app/brand/skatgo-logo.png).
// Chromium's canvas does the work, so the project gains no image dependency. Rerun after the master
// changes: node .intentfold/tickets/SKATGO-23/icons.mjs (it needs the Playwright CLI's Chromium).
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from '/Users/yong/.local/lib/node_modules/@playwright/cli/node_modules/playwright/index.mjs'
const APP = new URL('../../../app/', import.meta.url)
const master = 'data:image/png;base64,' + readFileSync(new URL('brand/skatgo-logo.png', APP)).toString('base64')
const b = await chromium.launch(); const page = await b.newPage()
await page.setContent('<canvas></canvas>')
// The drawn area: every pixel that is not (near) white.
const box = await page.evaluate(async (src) => {
  const img = new Image(); img.src = src; await img.decode()
  const c = new OffscreenCanvas(img.width, img.height); const x = c.getContext('2d'); x.drawImage(img, 0, 0)
  const d = x.getImageData(0, 0, img.width, img.height).data
  let x0 = img.width, y0 = img.height, x1 = 0, y1 = 0
  for (let y = 0; y < img.height; y++) for (let i = 0; i < img.width; i++) {
    const p = (y * img.width + i) * 4
    if (d[p] < 235 || d[p + 1] < 235 || d[p + 2] < 235) { x0 = Math.min(x0, i); y0 = Math.min(y0, y); x1 = Math.max(x1, i); y1 = Math.max(y1, y) }
  }
  return { x0, y0, x1, y1, w: img.width, h: img.height }
}, master)
console.log('drawn area', box)
/** A square PNG: white ground, the drawn area centred with `pad` (fraction of the side) around it,
 *  corners rounded by `round` (fraction of the side; 0 = square). */
const render = (side, pad, round) => page.evaluate(async ([src, box, side, pad, round]) => {
  const img = new Image(); img.src = src; await img.decode()
  const c = new OffscreenCanvas(side, side); const x = c.getContext('2d')
  x.imageSmoothingQuality = 'high'
  if (round > 0) { x.beginPath(); x.roundRect(0, 0, side, side, side * round); x.clip() }
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, side, side)
  const bw = box.x1 - box.x0 + 1, bh = box.y1 - box.y0 + 1, inner = side * (1 - 2 * pad), k = inner / Math.max(bw, bh)
  const dw = bw * k, dh = bh * k
  x.drawImage(img, box.x0, box.y0, bw, bh, (side - dw) / 2, (side - dh) / 2, dw, dh)
  // The master's ground is off-white (about #FAFAFA): lift near-white to the white ground, or a faint box
  // shows around the mark. Transparent corners stay transparent.
  const px = x.getImageData(0, 0, side, side); const d = px.data
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 0 && d[i] > 240 && d[i + 1] > 240 && d[i + 2] > 240) { d[i] = 255; d[i + 1] = 255; d[i + 2] = 255 }
  x.putImageData(px, 0, 0)
  const u = new Uint8Array(await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer())
  let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000))
  return btoa(s)
}, [master, box, side, pad, round]).then((s) => Buffer.from(s, 'base64'))

const ROUND = 0.22 // a rounded app-icon square
const out = (name, buf) => { writeFileSync(new URL(`public/${name}`, APP), buf); console.log(`public/${name}  ${buf.length} bytes`) }
// Browser tabs: rounded, tight padding so the mark reads at 16px.
const ico = await Promise.all([16, 32, 48].map((s) => render(s, 0.06, ROUND)))
out('favicon-32.png', ico[1])
// favicon.ico: an ICO directory whose entries are PNGs (supported by every current browser).
const header = Buffer.alloc(6 + 16 * ico.length); header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(ico.length, 4)
let offset = header.length
ico.forEach((png, i) => {
  const e = 6 + 16 * i, s = [16, 32, 48][i]
  header.writeUInt8(s, e); header.writeUInt8(s, e + 1); header.writeUInt8(0, e + 2); header.writeUInt8(0, e + 3)
  header.writeUInt16LE(1, e + 4); header.writeUInt16LE(32, e + 6); header.writeUInt32LE(png.length, e + 8); header.writeUInt32LE(offset, e + 12)
  offset += png.length
})
out('favicon.ico', Buffer.concat([header, ...ico]))
// iOS home screen: square and full-bleed — iOS rounds it itself.
out('apple-touch-icon.png', await render(180, 0.1, 0))
// Installed / home-screen icon (web manifest): rounded for "any", square with a safe zone for "maskable".
out('icon-192.png', await render(192, 0.08, ROUND))
out('icon-512.png', await render(512, 0.08, ROUND))
out('icon-maskable-512.png', await render(512, 0.22, 0))
// The header mark: square (CSS rounds it), 3x the 30px it is shown at.
out('logo-96.png', await render(96, 0.06, 0))
await b.close()
