// SKATGO-129: the SkatGo Saldo article's two charts, plain difference against SkatGo Saldo per day, from the owner's own
// tournament record. Writes one SVG per chart and language to app/public/forum-images/<lang>/. Regenerate them with
// this script, never edit them. Its input, `tmp/owner.json` (git-ignored), is the owner's rows exported from production:
//   render psql skatgo-multiplayer-db --confirm --output text --command "SELECT replace(json_agg(t)::text, E'\n', ' ')
//     FROM (SELECT e.day, e.size, e.deals, e.total, e.created_at, d.deals AS specs FROM daily_entries e JOIN daily_deals d
//     ON d.day = e.day AND d.size = e.size WHERE e.player = (SELECT player FROM daily_players WHERE nickname = 'Wyong')
//     ORDER BY e.created_at) t" | sed -n 3p > .intentfold/tickets/SKATGO-129/tmp/owner.json
//   node .intentfold/tickets/SKATGO-129/charts.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const here = new URL('.', import.meta.url)
const out = new URL('../../../app/public/forum-images/', here)
// The palette of app/src/theme/color.stylex.ts: an <img> cannot read the site's variables.
const C = { navy: '#022657', slate: '#5D6D7D', info: '#095ECF', go: '#00A336', hairline: '#E0E5EB', surface: '#FFFFFF', text: '#29323D' }
const FONT = "'Red Hat Display', 'Helvetica Neue', Arial, sans-serif"

const entries = JSON.parse(readFileSync(new URL('tmp/owner.json', here), 'utf8')).sort((a, b) => Number(a.created_at) - Number(b.created_at))
const table = (s) => 2 * s[0] - s[1] - s[2]
const byDay = new Map()
for (const e of entries) {
  e.deals.forEach((mine, i) => {
    const ai = e.specs[i]?.benchmark?.summary
    if (!ai) return
    const plain = mine.scores[0] - ai.scores[0]
    const saldo = table(mine.scores) - table(ai.scores)
    const defended = mine.declarer !== 0 && mine.declarer !== null && ai.declarer !== 0 && ai.declarer !== null
    const d = byDay.get(e.day) ?? { deals: 0, plainSeen: 0, saldoSeen: 0, defence: [] }
    d.deals += 1
    if (plain !== 0) d.plainSeen += 1
    if (saldo !== 0) d.saldoSeen += 1
    if (defended) d.defence.push({ plain, saldo })
    byDay.set(e.day, d)
  })
}
const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b))
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

const TEXT = {
  en: {
    seenTitle: 'Deals that tell you something, per day',
    seenSub: 'Share of deals whose comparison with the AI is not exactly 0',
    defenceTitle: 'Defence only: average per deal, per day',
    defenceSub: 'Deals where both I and the AI defended',
    plain: 'Plain difference (your score − the AI’s)',
    saldo: 'SkatGo Saldo (against the whole table)',
    month: (d) => `${Number(d.slice(8))}`,
    axis: 'October 2026',
  },
  de: {
    seenTitle: 'Spiele, die etwas aussagen, pro Tag',
    seenSub: 'Anteil der Spiele, deren Vergleich mit der KI nicht genau 0 ist',
    defenceTitle: 'Nur Verteidigung: Schnitt pro Spiel, pro Tag',
    defenceSub: 'Spiele, in denen ich und die KI Gegenspieler waren',
    plain: 'Einfache Differenz (deine Punkte − die der KI)',
    saldo: 'SkatGo-Saldo (gegen den ganzen Tisch)',
    month: (d) => `${Number(d.slice(8))}.`,
    axis: 'Oktober 2026',
  },
}

const W = 600, H = 470, L = 62, R = 16, T = 104, B = 120
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

/** A line chart of two series over the days, with its title, axis, labels and legend. */
function chart(t, title, sub, series, { min, max, step, unit }) {
  const x = (i) => L + (i * (W - L - R)) / (days.length - 1)
  const y = (v) => T + ((max - v) * (H - T - B)) / (max - min)
  const grid = []
  for (let v = min; v <= max; v += step) {
    grid.push(`<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? C.slate : C.hairline}" stroke-width="1"/>`)
    grid.push(`<text x="${L - 10}" y="${y(v) + 4}" text-anchor="end" font-size="16" fill="${C.slate}">${v > 0 && unit !== '%' ? '+' : ''}${v}${unit}</text>`)
  }
  const ticks = days.map(([d], i) => `<text x="${x(i)}" y="${H - B + 20}" text-anchor="middle" font-size="16" fill="${C.slate}">${esc(t.month(d))}</text>`)
  ticks.push(`<text x="${(L + W - R) / 2}" y="${H - B + 44}" text-anchor="middle" font-size="16" fill="${C.slate}">${esc(t.axis)}</text>`)
  const lines = series.map(({ values, color, dash }) => {
    const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
    const dots = values.map((v, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="5" fill="${color}"/>`).join('')
    return `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round"${dash ? ' stroke-dasharray="7 5"' : ''}/>${dots}`
  })
  const legend = series.map(({ label, color, dash }, i) => {
    const ly = H - 44 + i * 26
    return `<line x1="${16}" x2="${44}" y1="${ly}" y2="${ly}" stroke="${color}" stroke-width="3"${dash ? ' stroke-dasharray="7 5"' : ''}/><text x="${54}" y="${ly + 6}" font-size="17" fill="${C.text}">${esc(label)}</text>`
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${FONT}">
<rect width="${W}" height="${H}" fill="${C.surface}"/>
<text x="16" y="38" font-size="25" font-weight="700" fill="${C.navy}">${esc(title)}</text>
<text x="16" y="68" font-size="17" fill="${C.slate}">${esc(sub)}</text>
${grid.join('\n')}
${ticks.join('\n')}
${lines.join('\n')}
${legend.join('\n')}
</svg>
`
}

for (const [lang, t] of Object.entries(TEXT)) {
  mkdirSync(new URL(`${lang}/`, out), { recursive: true })
  const seen = chart(t, t.seenTitle, t.seenSub, [
    { values: days.map(([, d]) => Math.round((100 * d.plainSeen) / d.deals)), color: C.slate, dash: true, label: t.plain },
    { values: days.map(([, d]) => Math.round((100 * d.saldoSeen) / d.deals)), color: C.info, label: t.saldo },
  ], { min: 0, max: 100, step: 25, unit: '%' })
  const defence = chart(t, t.defenceTitle, t.defenceSub, [
    { values: days.map(([, d]) => Math.round(mean(d.defence.map((x) => x.plain)))), color: C.slate, dash: true, label: t.plain },
    { values: days.map(([, d]) => Math.round(mean(d.defence.map((x) => x.saldo)))), color: C.info, label: t.saldo },
  ], { min: -100, max: 25, step: 25, unit: '' })
  writeFileSync(new URL(`${lang}/skatgo-saldo-information.svg`, out), seen)
  writeFileSync(new URL(`${lang}/skatgo-saldo-defence.svg`, out), defence)
}
console.log(days.map(([d, v]) => `${d} ${v.deals} plain ${v.plainSeen} saldo ${v.saldoSeen} defence ${v.defence.length}`).join('\n'))
