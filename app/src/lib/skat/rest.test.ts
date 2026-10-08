import { describe, expect, it } from 'vitest'

import { type Card, type Contract, cards, fullDeck, sameCard, strength } from './cards'
import { type Game, type Seat, applyMove, claimLine, collectTrick, concedable, deal, declare, discard, legalFor, next, pickUpSkat, playCard, playHand } from './game'
import { nullBeaten, restLine } from './rest'
import { summarize } from './tournament'
import type { Declaration } from './value'

// SKATGO-59. The claim and the concession may only end a deal whose end is already certain, and the
// result must be the one playing it out gives. These tests do not trust the rules in rest.ts: every
// position the rules accept is played out by brute force — the claim against every way the unseen
// cards may lie (sampled where there are too many) and every defender card at every turn, the Null
// against every card anyone may play — and a single trick going the other way fails the test.

/** A fixed random source, so a failure can be replayed. */
function seeded(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const pick = <T,>(xs: T[], r: () => number) => xs[Math.floor(r() * xs.length)]
const shuffled = <T,>(xs: T[], r: () => number) => {
  const out = [...xs]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
const decl = (contract: Contract, hand: boolean): Declaration => ({ contract, hand, schneiderAnnounced: false, schwarzAnnounced: false, ouvert: false })
const CONTRACTS: Contract[] = [{ kind: 'grand' }, { kind: 'suit', trump: 'C' }, { kind: 'suit', trump: 'H' }]

/**
 * A deal in play: `declarer` won the auction and plays `contract`, Hand or with the skat picked up and
 * two cards put away. The deck is tilted so the declarer tends to hold the cards the contract wants
 * (high ones, or low ones for Null) — otherwise the positions the rules accept would be rare.
 */
function dealt(r: () => number, contract: Contract, declarer: Seat, hand: boolean): Game {
  const want = (c: Card) => (contract.kind === 'null' ? -strength(c, contract) : strength(c, contract) + (c.rank === 'J' ? 0 : contract.kind === 'suit' && c.suit === contract.trump ? 50 : 0))
  const ranked = shuffled(fullDeck(), r).sort((a, b) => want(b) + r() * 60 - (want(a) + r() * 60))
  const dealer = pick([0, 1, 2] as Seat[], r)
  const fore = next(dealer)
  // deal() hands out deck[0..10] to forehand, then clockwise; put the tilted cards where the declarer sits.
  const order = [fore, next(fore), next(next(fore))]
  const slots: Card[][] = [[], [], []]
  slots[order.indexOf(declarer)] = ranked.slice(0, 10)
  const rest = shuffled(ranked.slice(10), r)
  let k = 0
  for (let i = 0; i < 3; i++) if (slots[i].length === 0) slots[i] = rest.slice(k, (k += 10))
  const deck = [...slots[0], ...slots[1], ...slots[2], ...rest.slice(k)]
  let g = deal(dealer, deck)
  g = { ...g, phase: 'skat', declarer, bid: 18 }
  if (hand) g = playHand(g)
  else {
    g = pickUpSkat(g)
    const worst = [...g.hands[declarer]].sort((a, b) => want(a) - want(b)).slice(0, 2)
    g = discard(g, worst)
  }
  return declare(g, decl(contract, hand))
}

/** Play random legal cards until `left` tricks remain, collecting each trick; null if the deal ended. */
function playTo(g: Game, left: number, r: () => number): Game | null {
  while (g.phase === 'play' || g.phase === 'trickEnd') {
    if (g.phase === 'trickEnd') {
      g = collectTrick(g)
      continue
    }
    if (g.trick.length === 0 && 10 - g.tricks.length === left) return g
    g = playCard(g, pick(legalFor(g, g.turn), r))
  }
  return null
}

const key = (g: Game) => g.hands.map((h) => h.map((c) => c.suit + c.rank).sort().join(',')).join('|') + `/${g.turn}/${g.trick.map((p) => p.card.suit + p.card.rank).join(',')}`

/** Every defender card at every turn: does the declarer, playing the claim line, take every trick? */
function lineTakesAll(g: Game, line: Card[], seen = new Map<string, boolean>()): boolean {
  if (g.phase === 'done') return true
  if (g.phase === 'trickEnd') {
    const before = g.tricks.length
    const after = collectTrick(g)
    if (after.tricks[before].winner !== g.declarer) return false
    return lineTakesAll(after, line, seen)
  }
  const k = key(g)
  const known = seen.get(k)
  if (known !== undefined) return known
  let ok: boolean
  if (g.turn === g.declarer) {
    const card = line.find((c) => g.hands[g.declarer!].some((h) => sameCard(h, c)))!
    ok = lineTakesAll(playCard(g, card), line, seen)
  } else {
    ok = legalFor(g, g.turn).every((c) => lineTakesAll(playCard(g, c), line, seen))
  }
  seen.set(k, ok)
  return ok
}

/** Every way the cards the declarer cannot see could lie between the two defenders (and a skat not
 *  yet seen), up to `limit` of them, the real one first. */
function layouts(g: Game, r: () => number, limit: number): Game[] {
  const d = g.declarer!
  const [a, b] = ([0, 1, 2] as Seat[]).filter((s) => s !== d)
  const hidden = g.pickedUp ? [] : g.skat
  const pool = [...g.hands[a], ...g.hands[b], ...hidden]
  const out: Game[] = [g]
  const seenLayouts = new Set<string>()
  for (let i = 0; i < limit * 4 && out.length < limit; i++) {
    const s = shuffled(pool, r)
    const ha = s.slice(0, g.hands[a].length)
    const hb = s.slice(ha.length, ha.length + g.hands[b].length)
    const sk = s.slice(ha.length + hb.length)
    const id = [ha, hb].map((h) => h.map((c) => c.suit + c.rank).sort().join()).join('|')
    if (seenLayouts.has(id)) continue
    seenLayouts.add(id)
    const hands = [...g.hands] as Game['hands']
    hands[a] = ha
    hands[b] = hb
    out.push({ ...g, hands, skat: g.pickedUp ? g.skat : sk })
  }
  return out
}

/** Every card anyone may play, the declarer's own included: does the Null declarer never take a trick? */
function nullNeverLost(g: Game, seen = new Map<string, boolean>()): boolean {
  if (g.phase === 'done') return g.result!.won
  if (g.phase === 'trickEnd') return nullNeverLost(collectTrick(g), seen)
  const k = key(g)
  const known = seen.get(k)
  if (known !== undefined) return known
  const ok = legalFor(g, g.turn).every((c) => nullNeverLost(playCard(g, c), seen))
  seen.set(k, ok)
  return ok
}

describe('claiming the rest (SKATGO-59)', () => {
  it('every claim the rule offers takes every trick, however the unseen cards lie and whatever the defenders play', () => {
    const r = seeded(59)
    const offered = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    let refused = 0
    for (let n = 0; n < 20000 && (offered.reduce((a, b) => a + b, 0) < 400 || refused < 150); n++) {
      const contract = pick(CONTRACTS, r)
      const declarer = pick([0, 1, 2] as Seat[], r)
      const left = 2 + Math.floor(r() * 4)
      const g = playTo(dealt(r, contract, declarer, r() < 0.3), left, r)
      if (!g || g.turn !== declarer) continue
      const line = claimLine(g)
      if (!line) {
        refused++
        continue
      }
      offered[left]++
      // Every defender card at every turn; the cards' layouts sampled, more of them where fewer are left.
      for (const layout of layouts(g, r, left <= 4 ? 30 : 8)) {
        if (!lineTakesAll(layout, line)) throw new Error(`claim lost a trick: ${JSON.stringify({ n, contract, hands: layout.hands, tricks: g.tricks.length })}`)
      }
    }
    // The run must reach claims at every length it tries, and refusals, or it proves nothing.
    for (let left = 2; left <= 5; left++) expect(offered[left], `claims with ${left} tricks left`).toBeGreaterThan(20)
    expect(refused).toBeGreaterThan(100)
  }, 120_000)

  it('the claim ends the deal at once with the result of playing it out', () => {
    const r = seeded(5)
    let checked = 0
    for (let n = 0; n < 4000 && checked < 200; n++) {
      const contract = pick(CONTRACTS, r)
      const declarer = pick([0, 1, 2] as Seat[], r)
      const g = playTo(dealt(r, contract, declarer, r() < 0.3), 2 + Math.floor(r() * 5), r)
      if (!g || g.turn !== declarer) continue
      const line = claimLine(g)
      if (!line) continue
      checked++
      const claimed = applyMove(g, { type: 'claim' })
      expect(claimed.phase).toBe('done')
      expect(claimed.early).toEqual({ kind: 'claim', from: g.tricks.length })
      // Played out by hand: the line, and the defenders' last legal card instead of their first.
      let out = g
      while (out.phase !== 'done') {
        if (out.phase === 'trickEnd') {
          out = collectTrick(out)
          continue
        }
        const legal = legalFor(out, out.turn)
        const card = out.turn === declarer ? line.find((c) => out.hands[declarer].some((h) => sameCard(h, c)))! : legal[legal.length - 1]
        out = playCard(out, card)
      }
      expect(summarize(claimed)).toEqual(summarize(out))
      expect(claimed.result).toEqual(out.result)
    }
    expect(checked).toBe(200)
  })

  it('is not offered when an unseen trump is higher than one the declarer must lead', () => {
    // Grand: the declarer holds ♣J ♥J; ♠J and ♦J are unseen, so ♠J can be kept until ♥J is led.
    expect(restLine(cards('C:J A | H:J | S:A'), cards('S:J 7 8 | D:J'), { kind: 'grand' })).toBeNull()
    // With ♠J the only trump out, it must fall under ♣J, and ♥J is then the best trump.
    expect(restLine(cards('C:J A | H:J | S:A'), cards('S:J 7 8 | D:7'), { kind: 'grand' })).not.toBeNull()
  })
  it('is not offered when a defender may keep a higher card of a suit', () => {
    // Hearts: no trumps out, but ♣10 is unseen with another club: ♣K may be beaten.
    expect(restLine(cards('H:J A | C:A K'), cards('C:10 7 | S:7 8'), { kind: 'suit', trump: 'H' })).toBeNull()
  })
  it('is offered when the only higher card must fall under the ace', () => {
    // ♣10 is the only club unseen: it falls under ♣A, and ♣K is then the best club.
    expect(restLine(cards('H:J A | C:A K'), cards('C:10 | S:7 8 9'), { kind: 'suit', trump: 'H' })).not.toBeNull()
  })
  it('is not offered with fewer trumps than are out', () => {
    expect(restLine(cards('C:J | S:A 10 K'), cards('S:J | H:J | D:7 8'), { kind: 'grand' })).toBeNull()
  })
  it('is never offered in a Null, nor to a declarer not on lead, nor for the last trick', () => {
    expect(restLine(cards('C:7'), cards('C:8'), { kind: 'null' })).toBeNull()
    const r = seeded(7)
    for (let n = 0; n < 2000; n++) {
      const declarer = pick([0, 1, 2] as Seat[], r)
      const g = playTo(dealt(r, pick(CONTRACTS, r), declarer, false), 1 + Math.floor(r() * 9), r)
      if (!g) continue
      if (g.turn !== declarer || 10 - g.tricks.length < 2) expect(claimLine(g)).toBeNull()
      // A claim the rule does not offer is refused: the state does not move.
      if (!claimLine(g)) expect(applyMove(g, { type: 'claim' })).toBe(g)
    }
  })
})

describe('conceding a Null (SKATGO-59)', () => {
  it('every Null the rule calls lost for the defenders cannot be lost, whoever plays whatever', () => {
    const r = seeded(590)
    const offered = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    let refused = 0
    for (let n = 0; n < 40000 && offered.reduce((a, b) => a + b, 0) < 600; n++) {
      const declarer = pick([0, 1, 2] as Seat[], r)
      const left = 1 + Math.floor(r() * 5)
      const g = playTo(dealt(r, { kind: 'null' }, declarer, r() < 0.5), left, r)
      if (!g) continue
      if (!concedable(g)) {
        refused++
        continue
      }
      offered[left]++
      if (!nullNeverLost(g)) throw new Error(`conceded a Null the declarer could lose: ${JSON.stringify({ n, hands: g.hands, turn: g.turn, declarer })}`)
    }
    for (let left = 1; left <= 5; left++) expect(offered[left], `concessions with ${left} tricks left`).toBeGreaterThan(20)
    expect(refused).toBeGreaterThan(300)
  }, 120_000)

  it('the concession ends the deal at once, won by the declarer, as playing it out does', () => {
    const r = seeded(9)
    let checked = 0
    for (let n = 0; n < 8000 && checked < 100; n++) {
      const declarer = pick([0, 1, 2] as Seat[], r)
      const g = playTo(dealt(r, { kind: 'null' }, declarer, false), 1 + Math.floor(r() * 9), r)
      if (!g || !concedable(g)) continue
      checked++
      const conceded = applyMove(g, { type: 'concede' })
      expect(conceded.phase).toBe('done')
      expect(conceded.result!.won).toBe(true)
      expect(conceded.early).toEqual({ kind: 'concede', from: g.tricks.length })
      expect(conceded.tricks.every((t) => t.winner !== declarer)).toBe(true)
    }
    expect(checked).toBe(100)
  })

  it('is not conceded while the declarer holds a card above a defender’s in its suit', () => {
    // ♥9 is above the defenders' ♥8: a defender leads ♥8 and the declarer may have to take it.
    expect(nullBeaten([cards('H:7 9 | C:7'), cards('H:8 K | C:A'), cards('H:A | C:K 10')], 0, 1)).toBe(false)
  })
  it('is not conceded when the declarer leads a suit nobody else holds', () => {
    expect(nullBeaten([cards('H:7 | C:7'), cards('C:A | S:K'), cards('C:K | S:A')], 0, 0)).toBe(false)
    expect(nullBeaten([cards('H:7 | C:7'), cards('C:A | S:K'), cards('C:K | S:A')], 0, 1)).toBe(true)
  })
  it('is not conceded in a suit game, nor mid-trick, and a refused concession does not move the state', () => {
    const r = seeded(11)
    for (let n = 0; n < 500; n++) {
      const g = playTo(dealt(r, pick(CONTRACTS, r), pick([0, 1, 2] as Seat[], r), false), 1 + Math.floor(r() * 9), r)
      if (!g) continue
      expect(concedable(g)).toBe(false)
      expect(applyMove(g, { type: 'concede' })).toBe(g)
      const mid = playCard(g, legalFor(g, g.turn)[0])
      expect(concedable({ ...mid, declaration: decl({ kind: 'null' }, false) })).toBe(false)
    }
  })
})
