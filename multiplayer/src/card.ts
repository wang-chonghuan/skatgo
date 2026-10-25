import { readFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'

// The picture a shared deal of the day travels with (SKATGO-132, the human: 「分享出去要有精美的卡片」): the site's felt,
// its logo, the day, the score shared large with the AI's beside it, and the challenge — no card face, no contract,
// no name (the ticket). Drawn as SVG with the site's font and turned into a PNG by resvg: wide for link previews
// (1200×630), tall for Instagram (1080×1350). The font has no suits, so the cards on it are backs.

const assets = new URL('../assets/', import.meta.url)
const FONTS = ['RedHatDisplay-Black.ttf', 'RedHatDisplay-Bold.ttf', 'RedHatDisplay-Medium.ttf'].map((f) => new URL(`fonts/${f}`, assets).pathname)
const png = (f: string) => `data:image/png;base64,${readFileSync(new URL(f, assets)).toString('base64')}`
/** The clear-ground logo (app/public/logo-mark.png). */
const LOGO = png('logo-mark.png')

/** The site's colours (app/src/theme/color.stylex.ts). */
const C = { feltInner: '#085435', feltOuter: '#053320', gold: '#EDA010', white: '#FFFFFF', soft: 'rgba(255,255,255,0.72)', navy: '#022657' }

export type CardText = { label: string; score: string; ai: string | null; challenge: string; site: string }
export type CardShape = 'wide' | 'tall'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** A card back in the site's colours, drawn rather than pictured so the PNG stays small enough for every link preview
 *  (WhatsApp drops pictures over about 300 KB): white frame, navy field, a gold line inside it, the logo in the
 *  middle, a soft shadow; turned about its foot. */
function back(x: number, y: number, w: number, angle: number) {
  const h = w * 1.4
  const f = w * 0.06
  return `<g transform="rotate(${angle} ${x + w / 2} ${y + h})">
    <rect x="${x + 6}" y="${y + 10}" width="${w}" height="${h}" rx="${w * 0.07}" fill="rgba(0,0,0,0.28)"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w * 0.07}" fill="${C.white}"/>
    <rect x="${x + f}" y="${y + f}" width="${w - 2 * f}" height="${h - 2 * f}" rx="${w * 0.045}" fill="${C.navy}"/>
    <rect x="${x + 2 * f}" y="${y + 2 * f}" width="${w - 4 * f}" height="${h - 4 * f}" rx="${w * 0.03}" fill="none" stroke="${C.gold}" stroke-width="2"/>
    <circle cx="${x + w / 2}" cy="${y + h / 2}" r="${w * 0.3}" fill="${C.white}"/>
    <image href="${LOGO}" x="${x + w * 0.26}" y="${y + h / 2 - w * 0.24}" width="${w * 0.48}" height="${w * 0.48}"/>
  </g>`
}

export function cardSvg(t: CardText, shape: CardShape): string {
  const [W, H] = shape === 'wide' ? [1200, 630] : [1080, 1350]
  const wide = shape === 'wide'
  const left = wide ? 72 : 80
  const fan = wide ? { x: 820, y: 130, w: 190 } : { x: 445, y: 780, w: 220 }
  const top = wide ? 70 : 90
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs><radialGradient id="felt" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="${C.feltInner}"/><stop offset="1" stop-color="${C.feltOuter}"/></radialGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#felt)"/>
  <image href="${LOGO}" x="${left}" y="${top}" width="64" height="64"/>
  <text x="${left + 80}" y="${top + 46}" font-family="Red Hat Display" font-weight="700" font-size="40" fill="${C.white}">SkatGo</text>
  <text x="${left}" y="${top + (wide ? 150 : 190)}" font-family="Red Hat Display" font-weight="700" font-size="${wide ? 40 : 46}" fill="${C.gold}">${esc(t.label)}</text>
  <text x="${left}" y="${top + (wide ? 300 : 390)}" font-family="Red Hat Display" font-weight="900" font-size="${wide ? 156 : 190}" fill="${C.white}">${esc(t.score)}</text>
  ${t.ai === null ? '' : `<text x="${left}" y="${top + (wide ? 362 : 470)}" font-family="Red Hat Display" font-weight="500" font-size="${wide ? 44 : 52}" fill="${C.soft}">${esc(t.ai)}</text>`}
  <text x="${left}" y="${top + (wide ? 452 : 590)}" font-family="Red Hat Display" font-weight="700" font-size="${wide ? 46 : 58}" fill="${C.white}">${esc(t.challenge)}</text>
  <text x="${left}" y="${H - (wide ? 44 : 60)}" font-family="Red Hat Display" font-weight="500" font-size="30" fill="${C.soft}">${esc(t.site)}</text>
  ${back(fan.x - fan.w * 0.55, fan.y, fan.w, -14)}${back(fan.x, fan.y - 20, fan.w, 0)}${back(fan.x + fan.w * 0.55, fan.y, fan.w, 14)}
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
