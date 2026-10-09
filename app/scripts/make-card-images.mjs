// Cuts the playing cards' master images (app/brand/cards/masters, SKATGO-66) into the files the site
// serves (app/public/cards). Regenerate them with this script, never edit them by hand.
//
//   node app/scripts/make-card-images.mjs
//
// Each master is trimmed to its drawing (the model leaves transparent margins). A court's top half is then
// cut to the shape of half the card's frame (COURT_ASPECT, the frame in playing-card.tsx): filled by
// height, head to waist, a wide figure cropped at its sides and a narrow one given transparent room.
// Needs `cwebp` and `dwebp` (libwebp) on the PATH.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import zlib from 'node:zlib'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const masters = path.join(root, 'brand/cards/masters')
const out = path.join(root, 'public/cards')
/** Width over height of half the court frame: 448 × 324 in the card's 500 × 700 face. */
const COURT_ASPECT = 448 / 324
/** Served widths, in pixels: twice the largest a card is drawn, for sharp screens. */
const WIDTH = { court: 360, daus: 300, symbol: 120, back: 300 }

/** A master's pixels, RGBA, decoded by `dwebp` (the masters are lossless WebP). */
function decode(file) {
  const pam = execFileSync('dwebp', ['-quiet', file, '-pam', '-o', '-'], { maxBuffer: 1 << 28 })
  const end = pam.indexOf('ENDHDR\n') + 7, head = pam.toString('latin1', 0, end)
  return { width: Number(head.match(/WIDTH (\d+)/)[1]), height: Number(head.match(/HEIGHT (\d+)/)[1]), px: pam.subarray(end) }
}

function encode(img) {
  const { width, height, px } = img, stride = width * 4, raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) px.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0 })
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
  const chunk = (type, data) => { const t = Buffer.from(type, 'latin1'), l = Buffer.alloc(4), c = Buffer.alloc(4); l.writeUInt32BE(data.length); c.writeUInt32BE(crc(Buffer.concat([t, data]))); return Buffer.concat([l, t, data, c]) }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

/** The box around every pixel that is more than faintly visible. */
function bounds({ width, height, px }) {
  let l = width, t = height, r = -1, b = -1
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (px[(y * width + x) * 4 + 3] > 24) { if (x < l) l = x; if (x > r) r = x; if (y < t) t = y; if (y > b) b = y }
  if (r < 0) throw new Error('empty image')
  return { l, t, w: r - l + 1, h: b - t + 1 }
}

/** A new image of w × h whose pixel (x, y) is the source's (x0 + x, y0 + y), transparent outside it. */
function cut(img, x0, y0, w, h) {
  const px = Buffer.alloc(w * h * 4)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = x0 + x, sy = y0 + y
    if (sx >= 0 && sy >= 0 && sx < img.width && sy < img.height) img.px.copy(px, (y * w + x) * 4, (sy * img.width + sx) * 4, (sy * img.width + sx) * 4 + 4)
  }
  return { width: w, height: h, px }
}

function webp(img, width, target) {
  const tmp = path.join(os.tmpdir(), `card-${process.pid}.png`)
  fs.writeFileSync(tmp, encode(img))
  fs.mkdirSync(path.dirname(target), { recursive: true })
  execFileSync('cwebp', ['-quiet', '-q', '82', '-alpha_q', '90', '-resize', String(width), '0', tmp, '-o', target])
  fs.rmSync(tmp)
  return `${path.relative(root, target)} ${fs.statSync(target).size} B`
}

const made = []
for (const file of fs.readdirSync(masters).filter((f) => f.endsWith('.webp')).sort()) {
  const name = file.slice(0, -5)
  // The back is a whole opaque face: nothing to trim.
  if (name === 'back') {
    const target = path.join(out, 'back.webp')
    fs.mkdirSync(out, { recursive: true })
    execFileSync('cwebp', ['-quiet', '-q', '82', '-resize', String(WIDTH.back), '0', path.join(masters, file), '-o', target])
    made.push(`${path.relative(root, target)} ${fs.statSync(target).size} B`)
    continue
  }
  const img = decode(path.join(masters, file))
  const [deck, a, b] = name.split('-')
  const box = bounds(img)
  if (a === 'sym') { made.push(webp(cut(img, box.l, box.t, box.w, box.h), WIDTH.symbol, path.join(out, deck, `sym-${b}.webp`))); continue }
  if (b === 'A') { made.push(webp(cut(img, box.l, box.t, box.w, box.h), WIDTH.daus, path.join(out, deck, `${a}-A.webp`))); continue }
  // A court's top: the drawing's height, the frame's shape, centred on the drawing, its bottom the cut.
  const w = Math.round(box.h * COURT_ASPECT)
  made.push(webp(cut(img, Math.round(box.l + box.w / 2 - w / 2), box.t, w, box.h), WIDTH.court, path.join(out, deck, `${a}-${b}.webp`)))
}
console.log(made.join('\n'))
