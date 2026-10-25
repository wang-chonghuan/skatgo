import { readFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'

// The picture a shared deal of the day travels with (SKATGO-132). The human: 「分享的卡片，就显示三家的fabian分数，不要显示ai
// 的，邀请看到的人来打同一副牌，要让玩家有能得瑟的地方，然后要白底」, then 「logo大一点，不要显示排名，declarer的名字后跟一个
// declarer的标志，黄色badge形式」, and 「slogan……还要放到卡片上」 — on white, the brand with the slogan, what is played — "1 deal today · 2 min" in the site's green, as its button — the day, the player's score large, the table's three Seeger-Fabian scores
// with theirs marked and a yellow badge after the declarer's name, and the invitation to play the same cards; no place, no card face, no contract, no AI, no name (the ticket). Drawn as SVG with the site's font
// and turned into a PNG by resvg: wide for link previews (1200×630), tall for Instagram (1080×1350).

const assets = new URL('../assets/', import.meta.url)
const FONTS = ['RedHatDisplay-Black.ttf', 'RedHatDisplay-Bold.ttf', 'RedHatDisplay-Medium.ttf'].map((f) => new URL(`fonts/${f}`, assets).pathname)
/** The clear-ground logo (app/public/logo-mark.png). */
const LOGO = `data:image/png;base64,${readFileSync(new URL('logo-mark.png', assets)).toString('base64')}`

/** The brand beside the logo, with the address (the human: 「卡片的logo文字后面加上.com」). */
const BRAND = 'SkatGo.com'

/** The site's colours (app/src/theme/color.stylex.ts). */
const C = { white: '#FFFFFF', page: '#F2F4F7', navy: '#022657', slate: '#5D6D7D', go: '#00A336', goodSoft: '#E3F6EA', amber: '#FF9E10', plate: '#252525' }

export type CardRow = { name: string; score: string; me: boolean; declarer: boolean }
export type CardText = { slogan: string; deal: string; date: string; score: string; rows: CardRow[]; declarer: string; challenge: string; site: string }
export type CardShape = 'wide' | 'tall'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const text = (x: number, y: number, size: number, weight: number, fill: string, s: string, anchor = 'start') =>
  `<text x="${x}" y="${y}" font-family="Red Hat Display" font-weight="${weight}" font-size="${size}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`

const FONT = { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Red Hat Display' }
/** How wide a line of text is drawn, measured by resvg itself. */
const width = (size: number, weight: number, s: string) =>
  new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="400">${text(0, size, size, weight, C.navy, s)}</svg>`, { font: FONT }).getBBox()?.width ?? 0

/** The declarer's badge: yellow, as the table's contract pill. */
function badge(x: number, mid: number, size: number, s: string) {
  const h = size * 1.6
  const w = width(size, 700, s) + size * 1.2
  return `<rect x="${x}" y="${mid - size * 0.35 - h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="${C.amber}"/>` + text(x + size * 0.6, mid, size, 700, C.plate, s)
}

/** What the viewer is asked to play, as the site's own green button says it — "1 deal today · 2 min" (the human:
 *  「1 deal today 这个字应该强调……否则看到的人不知道能要打几副」): the button they will press when they open the link. */
function pill(x: number, y: number, size: number, s: string) {
  const h = size * 1.8
  return `<rect x="${x}" y="${y}" width="${width(size, 700, s) + size * 1.3}" height="${h}" rx="${h / 2}" fill="${C.go}"/>` + text(x + size * 0.65, y + h / 2 + size * 0.36, size, 700, C.white, s)
}

/** The table's three scores: a light panel, a row each, the player's row marked green, the declarer's badged. */
function board(x: number, y: number, w: number, rowH: number, size: number, rows: CardRow[], declarer: string) {
  const pad = 20
  const h = rows.length * rowH + pad * 2
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" fill="${C.page}"/>` + rows.map((r, i) => {
    const top = y + pad + i * rowH
    const mid = top + rowH / 2 + size * 0.35
    return (r.me ? `<rect x="${x + 12}" y="${top + 4}" width="${w - 24}" height="${rowH - 8}" rx="16" fill="${C.goodSoft}" stroke="${C.go}" stroke-width="3"/>` : '')
      + text(x + 40, mid, size, r.me ? 900 : 700, C.navy, r.name)
      + (r.declarer ? badge(x + 40 + width(size, r.me ? 900 : 700, r.name) + size * 0.4, mid, Math.round(size * 0.55), declarer) : '')
      + text(x + w - 40, mid, size, r.me ? 900 : 700, r.me ? C.go : C.navy, r.score, 'end')
  }).join('')
}

export function cardSvg(t: CardText, shape: CardShape): string {
  const head = (x: number, y: number, h: number) => `<image href="${LOGO}" x="${x}" y="${y}" width="${h}" height="${h}"/>${text(x + h * 1.22, y + h * 0.74, h * 0.62, 700, C.navy, BRAND)}`
  /** The slogan beside the brand, on the brand's line. */
  const slogan = (x: number, y: number, h: number, size: number) =>
    text(x + h * 1.22 + width(h * 0.62, 700, BRAND) + size, y + h * 0.74, size, 700, C.slate, t.slogan)
  if (shape === 'wide') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${C.white}"/>
  <rect x="0" y="0" width="1200" height="12" fill="${C.go}"/>
  ${head(64, 44, 88)}
  ${slogan(64, 44, 88, 30)}
  ${pill(64, 180, 34, t.deal)}
  ${text(64 + width(34, 700, t.deal) + 34 * 1.3 + 20, 223, 30, 700, C.slate, t.date)}
  ${text(56, 395, 150, 900, C.navy, t.score)}
  ${text(64, 545, 40, 700, C.navy, t.challenge)}
  ${text(64, 592, 28, 500, C.slate, t.site)}
  ${board(620, 150, 516, 96, 42, t.rows, t.declarer)}
</svg>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <rect width="1080" height="1350" fill="${C.white}"/>
  <rect x="0" y="0" width="1080" height="16" fill="${C.go}"/>
  ${head(80, 72, 120)}
  ${text(80, 238, 38, 700, C.slate, t.slogan)}
  ${pill(80, 300, 46, t.deal)}
  ${text(80 + width(46, 700, t.deal) + 46 * 1.3 + 26, 358, 40, 700, C.slate, t.date)}
  ${text(70, 580, 200, 900, C.navy, t.score)}
  ${board(80, 630, 920, 130, 56, t.rows, t.declarer)}
  ${text(80, 1180, Math.min(54, Math.floor((54 * 920) / width(54, 700, t.challenge))), 700, C.navy, t.challenge)}
  ${text(80, 1280, 36, 500, C.slate, t.site)}
</svg>`
}

const cache = new Map<string, Buffer>()

/** The card as a PNG, made once per key. */
export function cardPng(key: string, t: CardText, shape: CardShape): Buffer {
  const hit = cache.get(key)
  if (hit) return hit
  const png = new Resvg(cardSvg(t, shape), { font: FONT }).render().asPng()
  if (cache.size > 500) cache.delete(cache.keys().next().value!)
  cache.set(key, png)
  return png
}
