// SKATGO-204: how each League tier's personas place against a fixed player, by real engine/ONNX play — no database.
// Run from the worktree's multiplayer/ folder:
//   node --import tsx ../.intentfold/tickets/SKATGO-204/calibrate.mts <rounds per tier> [proxy...]
// For every tier, `rounds` rounds of three deals (each seat dealing once), each deal a random pool deal with the dealer
// the round needs and every seat's bidding from the pool's plan, as a League room plays it. Seat 0 is the fixed player —
// `ai` (SkatZero itself) or `p<q>` (the persona at quantile q of the whole population by weakness, `p50` the median,
// playing with all of its own card errors) — seats 1 and 2 two personas of the tier's band, playing as src/league.ts has
// them play at that tier (`bandOf`, `leaguePolicy`). Prints, per tier and fixed player, the share of first, second and
// third places (equal totals sharing the better place, as `placesOf`) and the average League points a round.
import { randomInt } from 'node:crypto'
import { actor, deal, next, type Seat } from '../../../app/src/lib/skat/game'
import { PLACE_POINTS, TIERS, placesOf } from '../../../app/src/lib/skat/league'
import { seegerFabian } from '../../../app/src/lib/skat/tournament'
import { advance, computerTurn } from '../../../multiplayer/src/computers'
import { loadPool, plan, poolDealOf } from '../../../multiplayer/src/free'
import { TIER_ERRORS, bandOf, leaguePolicy, weakness } from '../../../multiplayer/src/league'
import { MAX_POPULATION, population } from '../../../multiplayer/src/personas/config'
import { loadPolicy } from '../../../multiplayer/src/skatzero/policy'

const rounds = Number(process.argv[2] ?? 20)
const proxies = process.argv.slice(3).length ? process.argv.slice(3) : ['ai', 'p50']
const dir = new URL('../../../multiplayer/skatzero/', import.meta.url)
const [base, pool] = await Promise.all([loadPolicy(dir), loadPool(dir, { odds: false })])
const all = [...population(MAX_POPULATION).personas].sort((a, b) => weakness(b) - weakness(a) || a.id.localeCompare(b.id))
const quantile = (q: number) => all[Math.min(all.length - 1, Math.floor((q / 100) * all.length))]

console.log(`rounds per tier: ${rounds}; card errors kept by tier: ${TIER_ERRORS.join(', ')}; bands by weakness: ${
  TIERS.map((t, i) => `${t} ${weakness(bandOf(i).at(-1)!).toFixed(3)}–${weakness(bandOf(i)[0]).toFixed(3)}`).join(', ')}`)
for (const proxy of proxies) {
  const me = proxy === 'ai' ? null : quantile(Number(proxy.slice(1)))
  if (me) console.log(`fixed player ${proxy}: ${me.nickname} (weakness ${weakness(me).toFixed(3)}), all its own errors`)
  for (let tier = 0; tier < TIERS.length; tier++) {
    const places = [0, 0, 0]
    let points = 0
    for (let r = 0; r < rounds; r++) {
      const band = bandOf(tier)
      const seats = [me, band[randomInt(band.length)], band[randomInt(band.length)]]
      let dealer = randomInt(3) as Seat
      const totals = [0, 0, 0]
      for (let d = 0; d < 3; d++) {
        const pd = poolDealOf(pool, dealer)
        const plans = [0, 1, 2].map((s) => plan(pd.plans[String(s) as '0' | '1' | '2']))
        let n = 0
        const end = await advance(deal(pd.dealer, pd.deck), [], (g) => {
          const seat = actor(g)!
          const p = seats[seat]
          const seed = `cal|${proxy}|${tier}|${r}|${d}|${seat}|${n++}`
          return computerTurn(g, seat, plans[seat], p ? leaguePolicy(base, p, seat === 0 ? 0 : tier, seed) : base)
        }, undefined, true)
        seegerFabian(end).forEach((v, i) => { totals[i] += v })
        dealer = next(dealer)
      }
      const place = placesOf(totals)[0]
      places[place]++
      points += PLACE_POINTS[place]
    }
    const pct = places.map((n) => `${Math.round((100 * n) / rounds)}%`).join(' / ')
    console.log(`${proxy.padEnd(4)} ${TIERS[tier].padEnd(9)} 1st/2nd/3rd ${pct}   League points a round ${(points / rounds).toFixed(2)}`)
  }
}
await base.release()
