// SKATGO-205: how a fixed player scores per deal against each League tier's personas, by real engine/ONNX play — no
// database. Run from the worktree's multiplayer/ folder:
//   node --import tsx ../.intentfold/tickets/SKATGO-205/calibrate.mts <deals per tier> [player...]
// Each deal is a random pool deal (the dealer going round) with every seat's bidding from the pool's plan, as a League
// table plays it. Seat 0 is the fixed player — `ai` (SkatZero itself) or `p<q>` (the persona at quantile q of the whole
// population by strength, `p80` the strong end, playing with all of its own card errors) — seats 1 and 2 personas of the
// tier's band playing as src/league.ts has them play there (`bandOf`, `leaguePolicy`). Prints per tier the fixed player's
// League points per 100 deals by `dealOutcome` / `DEAL_POINTS`.
import { randomInt } from 'node:crypto'
import { actor, deal, next, type Seat } from '../../../app/src/lib/skat/game'
import { DEAL_POINTS, TIERS, dealOutcome } from '../../../app/src/lib/skat/league'
import { summarize } from '../../../app/src/lib/skat/tournament'
import { advance, computerTurn } from '../../../multiplayer/src/computers'
import { loadPool, plan, poolDealOf } from '../../../multiplayer/src/free'
import { TIER_ERRORS, bandOf, leaguePolicy, weakness } from '../../../multiplayer/src/league'
import { MAX_POPULATION, population } from '../../../multiplayer/src/personas/config'
import { loadPolicy } from '../../../multiplayer/src/skatzero/policy'

const deals = Number(process.argv[2] ?? 300)
const players = process.argv.slice(3).length ? process.argv.slice(3) : ['ai', 'p80', 'p50', 'p20']
const dir = new URL('../../../multiplayer/skatzero/', import.meta.url)
const [base, pool] = await Promise.all([loadPolicy(dir), loadPool(dir, { odds: false })])
const all = [...population(MAX_POPULATION).personas].sort((a, b) => weakness(b) - weakness(a) || a.id.localeCompare(b.id))
const quantile = (q: number) => all[Math.min(all.length - 1, Math.floor((q / 100) * all.length))]

console.log(`deals per tier: ${deals}; card errors kept by tier: ${TIER_ERRORS.join(', ')}; points ${JSON.stringify(DEAL_POINTS)}`)
for (const who of players) {
  const me = who === 'ai' ? null : quantile(Number(who.slice(1)))
  if (me) console.log(`fixed player ${who}: ${me.nickname} (weakness ${weakness(me).toFixed(3)})`)
  const row: string[] = []
  for (let tier = 0; tier < TIERS.length; tier++) {
    let points = 0
    let dealer = randomInt(3) as Seat
    for (let d = 0; d < deals; d++) {
      const band = bandOf(tier)
      const seats = [me, band[randomInt(band.length)], band[randomInt(band.length)]]
      const pd = poolDealOf(pool, dealer)
      const plans = [0, 1, 2].map((s) => plan(pd.plans[String(s) as '0' | '1' | '2']))
      let n = 0
      const end = await advance(deal(pd.dealer, pd.deck), [], (g) => {
        const seat = actor(g)!
        const p = seats[seat]
        return computerTurn(g, seat, plans[seat], p ? leaguePolicy(base, p, seat === 0 ? 0 : tier, `cal205|${who}|${tier}|${d}|${seat}|${n++}`) : base)
      }, undefined, true)
      const s = summarize(end)
      const outcome = dealOutcome(s.declarer, !!s.won, 0)
      points += DEAL_POINTS[outcome]
      dealer = next(dealer)
    }
    row.push(`${TIERS[tier]} ${points >= 0 ? '+' : ''}${Math.round((100 * points) / deals)}`)
  }
  console.log(`${who.padEnd(4)} per 100 deals: ${row.join('   ')}`)
}
await base.release()
