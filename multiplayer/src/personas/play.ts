import { type Card, shuffle } from '../../../app/src/lib/skat/cards'
import { actor, deal, roleOf } from '../../../app/src/lib/skat/game'
import { summarize, type DealSummary } from '../../../app/src/lib/skat/tournament'
import { xpOf } from '../../../app/src/lib/skat/xp'
import { advance, computerTurn, type Logged, POSITION, raw, type SeatPlan } from '../computers'
import { maxBid, seatBidding, SKAT_PAIRS, skatOrHand } from '../skatzero/bidding'
import { type PlayerView, type Policy, SKATZERO_COMMIT } from '../skatzero/policy'
import { LEGACY_POLICY, random, type Persona } from './config'
import { strengthDecisions, type DecisionAudit } from './decisions'

export type Bidding = Awaited<ReturnType<typeof seatBidding>>
export type SimDeal = {
  dealer: 0 | 1 | 2; deck: Card[]; opponents: [SeatPlan, SeatPlan];
}
export type GameResult = {
  mine: DealSummary; ai: DealSummary; log: Logged[];
  choices: number; deviations: number; maxBid?: number; xp: number;
  input: { dealer: 0 | 1 | 2; deck: Card[] };
  audit?: DecisionAudit[];
}
export type ActivityResult = { games: GameResult[]; total: number; model: string; policy: string }
export const PERSONA_POLICY = LEGACY_POLICY

export async function biddingFor(base: Policy, spec: SimDeal, seed: string): Promise<Bidding> {
  const g = deal(spec.dealer, spec.deck)
  return seatBidding(base, g.hands[0].map(raw), POSITION[roleOf(0, spec.dealer)], shuffle(SKAT_PAIRS, random(`${seed}|bidding`)))
}
export const ownPlan = (b: Bidding, threshold: number): SeatPlan => ({
  maxBid: Math.max(maxBid(b.detail.handMax, threshold), maxBid(b.detail.pickupPen, threshold)),
  skatOrHand: (bid) => skatOrHand(b, bid),
})

export function personaPolicy(base: Policy, p: Persona, seed: string, stats = { choices: 0, deviations: 0 }): Policy {
  const rand = random(`${seed}|cards`)
  const form = (random(`${seed.split('|game|')[0]}|form`)() * 2 - 1) * p.play.form
  return { ...base, release: async () => {}, choose: async (v: PlayerView) => {
    const candidates = [...await base.ranked(v)].sort((a, b) => b.value - a.value)
    if (!candidates.length || candidates.some((c) => !Number.isFinite(c.value))) throw new Error('persona_invalid_evaluation')
    const best = candidates[0]
    const worse = candidates.filter((c) => c.value < best.value)
    if (!worse.length) return best.card
    stats.choices++
    const probability = Math.max(0, Math.min(1, p.play.mistake + form + (v.contract.kind === 'null' ? p.play.nullWeakness : 0)))
    if (rand() >= probability) return best.card
    stats.deviations++
    const index = rand() < p.play.deepMistake ? Math.floor(rand() * worse.length) : 0
    return worse[index].card
  } }
}

export async function playGame(base: Policy, spec: SimDeal, plan: SeatPlan, selected = base, alive = () => true,
  ownTurn?: (g: ReturnType<typeof deal>) => Promise<Logged[]>): Promise<{ summary: DealSummary; log: Logged[] }> {
  const plans = [plan, ...spec.opponents]
  const log: Logged[] = []
  const end = await advance(deal(spec.dealer, spec.deck), log, (g) => {
    if (!alive()) throw new Error('persona_cancelled')
    const seat = actor(g)!
    if (seat === 0 && ownTurn) return ownTurn(g)
    return computerTurn(g, seat, plans[seat], seat === 0 ? selected : base)
  }, undefined, true)
  if (end.phase !== 'done' && end.phase !== 'passedIn') throw new Error('persona_unfinished')
  if (!alive()) throw new Error('persona_cancelled')
  return { summary: summarize(end), log }
}

export async function simulateDeal(base: Policy, spec: SimDeal, p: Persona, seed: string,
  ai?: DealSummary, bidding?: Bidding, alive = () => true): Promise<GameResult> {
  const own = bidding ?? await biddingFor(base, spec, seed)
  if (!alive()) throw new Error('persona_cancelled')
  const aiSummary = ai ?? (await playGame(base, spec, ownPlan(own, -5), base, alive)).summary
  const stats = { choices: 0, deviations: 0 }
  const audit: DecisionAudit[] = []
  const adapter = p.play.strength ? strengthDecisions(base, p, seed, audit) : null
  const plan = adapter ? adapter.plan(own) : ownPlan(own, p.play.bidThreshold)
  const mine = await playGame(base, spec, plan, adapter?.policy ?? personaPolicy(base, p, seed, stats), alive,
    adapter ? (g) => adapter.turn(g, plan) : undefined)
  if (adapter) {
    stats.choices = audit.filter((d) => d.phase === 'card' && d.candidates.some((c) => c.value < d.candidates[0].value)).length
    stats.deviations = audit.filter((d) => d.phase === 'card' && d.loss > 0).length
  }
  return { mine: mine.summary, ai: aiSummary, log: mine.log, ...stats, maxBid: plan.maxBid,
    ...(adapter ? { audit } : {}),
    input: { dealer: spec.dealer, deck: spec.deck },
    xp: xpOf(mine.summary.scores[0] - aiSummary.scores[0], mine.summary.declarer === 0) }
}
export const resultOf = (games: GameResult[], policy = PERSONA_POLICY): ActivityResult => ({
  games, total: games.reduce((s, g) => s + g.mine.scores[0], 0), model: SKATZERO_COMMIT, policy,
})
