// The "Sieg sichern" ladder's puzzles (SKATGO-108): positions from SkatZero's games against itself — free
// play's committed pool, every seat played by SkatZero — where the declarer leads with three to five cards
// left, has picked up the skat, still needs points, and exactly one card makes 61 sure however the
// defenders' cards lie (app/src/lib/skat/tricks/exercises/endgame.ts proves it). Ten are chosen, rising:
// three tricks left for steps 1–3 (level 1), four for 4–7 (level 2), five for 8–10 (level 3); from the
// third step on the card a learner reaches for first — the highest trump, or with none the card worth
// most — is a trap.
//
//   node --import tsx scripts/make-endgames.ts [deals=1000]
//
// Writes app/src/lib/skat/tricks/exercises/endgames.data.ts. Run once; commit it. The app's tests prove every
// puzzle again from the file.
import { writeFileSync } from 'node:fs'
import { type Card, cardId, isTrump, legalPlays, pointsOf, strength } from '../../app/src/lib/skat/cards'
import { actor, deal, roleOf, type Game, type Seat } from '../../app/src/lib/skat/game'
import { type EndgameRecord, type Side, type StoredEndgame, solveEndgame, storeEndgame } from '../../app/src/lib/skat/tricks/exercises/endgame'
import { advance, computerTurn } from '../src/computers'
import { deckOf, loadPool, plan } from '../src/free'
import { loadPolicy } from '../src/skatzero/policy'

const DIR = new URL('../skatzero/', import.meta.url)
const OUT = new URL('../../app/src/lib/skat/tricks/exercises/endgames.data.ts', import.meta.url)
const count = Number(process.argv[2] ?? 1000)
const next = (s: Seat) => ((s + 1) % 3) as Seat

type Candidate = { deal: number; n: number; trap: boolean; game: EndgameRecord['game']; record: EndgameRecord; stored: StoredEndgame }

/** The card a learner reaches for first: the highest trump, or with none the card worth most. */
function obvious(hand: Card[], c: Parameters<typeof isTrump>[1]): Card {
  const trumps = hand.filter((x) => isTrump(x, c))
  if (trumps.length) return trumps.reduce((a, b) => (strength(b, c) > strength(a, c) ? b : a))
  return hand.reduce((a, b) => (pointsOf([b]) > pointsOf([a]) ? b : a))
}

const policy = await loadPolicy(DIR)
const pool = await loadPool(DIR)
const found: Candidate[] = []
for (let k = 0; k < Math.min(count, pool.deals.length); k++) {
  const d = pool.deals[k]
  const plans = { 0: plan(d.computers['0']), 1: plan(d.computers['1']), 2: plan(d.computers['2']) } as const
  const steps: Game[] = []
  try {
    await advance(deal(d.dealer, deckOf(d.deck)), [], (g) => computerTurn(g, actor(g)!, plans[actor(g)!], policy), steps, true)
  } catch {
    continue
  }
  for (const s of steps) {
    if (s.phase !== 'play' || !s.declaration || s.trick.length || s.declarer === null || actor(s) !== s.declarer || !s.pickedUp) continue
    const contract = s.declaration.contract
    if (contract.kind === 'null' || s.declaration.hand) continue
    const D = s.declarer
    const n = s.hands[D].length
    if (n < 3 || n > 5) continue
    const side = (seat: Seat): Side => (seat === D ? 'you' : seat === next(D) ? 'left' : 'right')
    const game = contract.kind === 'grand' ? 'G' : contract.trump
    const record: EndgameRecord = {
      id: '',
      game,
      position: roleOf(D, s.dealer),
      level: 1,
      skat: s.skat.map(cardId),
      hand: s.hands[D].map(cardId),
      tricks: s.tricks.map((t) => ({ cards: t.cards.map((p) => [side(p.seat), cardId(p.card)] as [Side, string]), winner: side(t.winner) })),
      left: s.hands[next(D)].map(cardId),
      right: s.hands[next(next(D))].map(cardId),
    }
    try {
      const e = solveEndgame(record)
      const trap = cardId(obvious(legalPlays(e.hand, [], contract), contract)) !== cardId(e.answer)
      found.push({ deal: k, n, trap, game, record, stored: storeEndgame(record, e) })
    } catch {
      // not a puzzle: already won or lost, more than one sure card, or a card with no losing split
    }
  }
}
await policy.release()

// Ten steps, rising: tricks left and level per step; from step 3 on, the obvious card must be the trap.
const STEPS: { n: number; level: 1 | 2 | 3; trap: boolean }[] = [
  { n: 3, level: 1, trap: false }, { n: 3, level: 1, trap: false }, { n: 3, level: 1, trap: true },
  { n: 4, level: 2, trap: false }, { n: 4, level: 2, trap: true }, { n: 4, level: 2, trap: true }, { n: 4, level: 2, trap: true },
  { n: 5, level: 3, trap: true }, { n: 5, level: 3, trap: true }, { n: 5, level: 3, trap: true },
]
const used = new Set<number>()
const chosen: StoredEndgame[] = []
for (const [i, step] of STEPS.entries()) {
  const last = chosen.at(-1)?.game
  const fits = (c: Candidate) => c.n === step.n && (!step.trap || c.trap) && !used.has(c.deal)
  // a game other than the step before, where there is one
  const pick = found.find((c) => fits(c) && c.game !== last) ?? found.find(fits)
  if (!pick) throw new Error(`no puzzle for step ${i + 1} (${JSON.stringify(step)}) among ${found.length}`)
  used.add(pick.deal)
  chosen.push({ ...pick.stored, id: `sieg-sichern-${i + 1}`, level: step.level })
}
writeFileSync(
  OUT,
  `// Generated by multiplayer/scripts/make-endgames.ts (SKATGO-108) — never edit by hand; the app's tests prove
// every puzzle again from this file.
import type { StoredEndgame } from './endgame'

export const ENDGAMES_STORED: StoredEndgame[] = ${JSON.stringify(chosen, null, 1)}
`,
)
const byN = (n: number) => found.filter((c) => c.n === n)
console.log(`${found.length} puzzles in ${count} games: ${[3, 4, 5].map((n) => `${byN(n).length} with ${n} left (${byN(n).filter((c) => c.trap).length} with a trap)`).join(', ')}`)
console.log(chosen.map((c) => `${c.id} ${c.game} need ${c.need} hand ${c.hand.join(' ')} -> ${c.answer}`).join('\n'))
