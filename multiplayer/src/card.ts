import { readFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'

// The picture a shared deal of the day travels with (SKATGO-132). The human: 「分享的卡片，就显示三家的fabian分数，不要显示ai
// 的，邀请看到的人来打同一副牌，要让玩家有能得瑟的地方，然后要白底」 — on white, the day, the player's score large, their place
// among today's players to be proud of, the table's three Seeger-Fabian scores with theirs marked, and the invitation
// to play the same cards; no card face, no contract, no AI, no name (the ticket). Drawn as SVG with the site's font
// and turned into a PNG by resvg: wide for link previews (1200×630), tall for Instagram (1080×1350).

const assets = new URL('../assets/', import.meta.url)
const FONTS = ['RedHatDisplay-Black.ttf', 'RedHatDisplay-Bold.ttf', 'RedHatDisplay-Medium.ttf'].map((f) => new URL(`fonts/${f}`, assets).pathname)
/** The clear-ground logo (app/public/logo-mark.png). */
const LOGO = `data:image/png;base64,${readFileSync(new URL('logo-mark.png', assets)).toString('base64')}`

/** The site's colours (app/src/theme/color.stylex.ts). */
const C = { white: '#FFFFFF', page: '#F2F4F7', navy: '#022657', slate: '#5D6D7D', go: '#00A336', goodSoft: '#E3F6EA' }

export type CardRow = { name: string; score: string; me: boolean }
export type CardText = { label: string; score: string; brag: string; rows: CardRow[]; challenge: string; site: string }
export type CardShape = 'wide' | 'tall'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const text = (x: number, y: number, size: number, weight: number, fill: string, s: string, anchor = 'start') =>
  `<text x="${x}" y="${y}" font-family="Red Hat Display" font-weight="${weight}" font-size="${size}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`

/** The table's three scores: a light panel, a row each, the player's row marked green. */
function board(x: number, y: number, w: number, rowH: number, size: number, rows: CardRow[]) {
  const pad = 20
  const h = rows.length * rowH + pad * 2
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" fill="${C.page}"/>` + rows.map((r, i) => {
    const top = y + pad + i * rowH
    const mid = top + rowH / 2 + size * 0.35
    return (r.me ? `<rect x="${x + 12}" y="${top + 4}" width="${w - 24}" height="${rowH - 8}" rx="16" fill="${C.goodSoft}" stroke="${C.go}" stroke-width="3"/>` : '')
      + text(x + 40, mid, size, r.me ? 900 : 700, C.navy, r.name)
      + text(x + w - 40, mid, size, r.me ? 900 : 700, r.me ? C.go : C.navy, r.score, 'end')
  }).join('')
}

/** The brag: a green pill with the player's place today. */
function pill(x: number, y: number, size: number, s: string) {
  const w = s.length * size * 0.46 + size * 1.4
  const h = size * 1.9
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${C.go}"/>` + text(x + size * 0.7, y + h / 2 + size * 0.36, size, 700, C.white, s)
}

export function cardSvg(t: CardText, shape: CardShape): string {
  const head = (x: number, y: number) => `<image href="${LOGO}" x="${x}" y="${y}" width="60" height="60"/>${text(x + 74, y + 44, 38, 700, C.navy, 'SkatGo')}`
  if (shape === 'wide') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${C.white}"/>
  <rect x="0" y="0" width="1200" height="12" fill="${C.go}"/>
  ${head(64, 52)}
  ${text(64, 190, 34, 700, C.slate, t.label)}
  ${text(56, 330, 150, 900, C.navy, t.score)}
  ${pill(64, 360, 32, t.brag)}
  ${text(64, 545, 40, 700, C.navy, t.challenge)}
  ${text(64, 592, 28, 500, C.slate, t.site)}
  ${board(700, 120, 436, 96, 42, t.rows)}
</svg>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <rect width="1080" height="1350" fill="${C.white}"/>
  <rect x="0" y="0" width="1080" height="16" fill="${C.go}"/>
  ${head(80, 80)}
  ${text(80, 250, 44, 700, C.slate, t.label)}
  ${text(70, 440, 200, 900, C.navy, t.score)}
  ${pill(80, 490, 42, t.brag)}
  ${board(80, 640, 920, 130, 56, t.rows)}
  ${t.challenge.split(' – ').map((line, i, all) => text(80, 1140 + i * 66, 54, 700, C.navy, i < all.length - 1 ? `${line} –` : line)).join('')}
  ${text(80, 1280, 36, 500, C.slate, t.site)}
</svg>`
}

const cache = new Map<string, Buffer>()

/** The card as a PNG, made once per key. */
export function cardPng(key: string, t: CardText, shape: CardShape): Buffer {
  const hit = cache.get(key)
  if (hit) return hit
  const png = new Resvg(cardSvg(t, shape), { font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Red Hat Display' } }).render().asPng()
  if (cache.size > 500) cache.delete(cache.keys().next().value!)
  cache.set(key, png)
  return png
}
