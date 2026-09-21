// The two computer opponents, and the hint the learner can ask for — the same functions, because a
// hint is just "what would a sensible player do here, and why". Every decision returns its reason in
// the learner's language for that purpose.
//
// These are club-level heuristics, not a search. That is deliberate: the course promises the learner
// can sit down with people who already play, and a transparent opponent that draws trumps, cashes
// aces and smears points on its partner's tricks teaches exactly the habits those people expect.

import {
  type Card,
  type Contract,
  type Suit,
  POINTS,
  SUITS,
  beats,
  cardLabel,
  effectiveSuit,
  fullDeck,
  isTrump,
  legalPlays,
  sameCard,
  strength,
  trickWinnerIndex,
} from './cards'
import { type Declaration, expectedValue } from './value'

const NULL_RANKS = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A']

/** Cards in a Null hand that could be forced to take a trick. 0 means the hand is watertight. */
export function nullRisk(hand: Card[]): Card[] {
  const risky: Card[] = []
  for (const suit of SUITS) {
    const inSuit = hand
      .filter((c) => c.suit === suit)
      .sort((a, b) => NULL_RANKS.indexOf(a.rank) - NULL_RANKS.indexOf(b.rank))
    // The i-th lowest card is safe when enough lower cards exist outside the hand to be played
    // under it: 7 or 8 in first place, anything up to 10 in second, and so on.
    inSuit.forEach((c, i) => {
      if (NULL_RANKS.indexOf(c.rank) > 2 * i + 1) risky.push(c)
    })
  }
  return risky
}

type Plan = { declaration: Declaration; score: number; value: number }

const plain = (contract: Contract): Declaration => ({
  contract,
  hand: false,
  schneiderAnnounced: false,
  schwarzAnnounced: false,
  ouvert: false,
})

/** How good a hand is for each contract. `score` ≥ 1 means "worth playing". */
function plans(hand: Card[]): Plan[] {
  const jacks = hand.filter((c) => c.rank === 'J')
  const out: Plan[] = []

  for (const trump of SUITS) {
    const contract: Contract = { kind: 'suit', trump }
    const trumps = hand.filter((c) => isTrump(c, contract)).length
    const side = hand.filter((c) => !isTrump(c, contract))
    const aces = side.filter((c) => c.rank === 'A').length
    const guardedTens = side.filter(
      (c) => c.rank === '10' && side.some((a) => a.suit === c.suit && a.rank === 'A'),
    ).length
    // Five trumps and two side winners is the classic minimum; every extra trump or jack helps.
    const score = (trumps + aces + 0.5 * guardedTens + 0.25 * jacks.length) / 7.25
    out.push({ declaration: plain(contract), score: trumps >= 4 ? score : score * 0.6, value: 0 })
  }

  {
    const aces = hand.filter((c) => c.rank === 'A').length
    const tens = hand.filter(
      (c) => c.rank === '10' && hand.some((a) => a.suit === c.suit && a.rank === 'A'),
    ).length
    const hasTop = jacks.some((c) => c.suit === 'C')
    const score = (jacks.length * 2 + aces * 1.5 + tens * 0.75 + (hasTop ? 1 : 0)) / 9.5
    out.push({ declaration: plain({ kind: 'grand' }), score: jacks.length >= 2 ? score : 0, value: 0 })
  }

  {
    const risk = nullRisk(hand).length
    out.push({ declaration: plain({ kind: 'null' }), score: risk === 0 ? 1.2 : risk === 1 ? 0.7 : 0, value: 0 })
  }

  return out.map((p) => ({ ...p, value: expectedValue(p.declaration, hand) }))
}

// Bidding happens before the skat is seen, and the skat improves most hands by about a trick — so
// a hand is worth bidding somewhat below the strength it needs to be worth playing. Tuned by
// simulation (2000 deals between three of these players): about one deal in twenty-five is passed
// in and declarers win about three games in four, which is what a club table looks like.
const BID_THRESHOLD = 0.8

/** The highest number this hand is prepared to bid or hold. 0 means pass. */
export function maxBid(hand: Card[]): number {
  const playable = plans(hand).filter((p) => p.score >= BID_THRESHOLD)
  return playable.reduce((best, p) => Math.max(best, p.value), 0)
}

/** What the bidding hint tells the learner: how high this hand can go, and playing what. */
export function bidAdvice(hand: Card[]): { limit: number; contract: Contract | null } {
  const playable = plans(hand).filter((p) => p.score >= BID_THRESHOLD)
  const best = playable.sort((a, b) => b.value - a.value)[0]
  return best ? { limit: best.value, contract: best.declaration.contract } : { limit: 0, contract: null }
}

/** After the skat is in hand: which two to put away, and what to declare. */
export function chooseDeclaration(twelve: Card[], bid: number): { discard: Card[]; declaration: Declaration } {
  let best: { discard: Card[]; declaration: Declaration; rank: number } | null = null
  for (const contract of [...SUITS.map((trump): Contract => ({ kind: 'suit', trump })), { kind: 'grand' } as Contract, { kind: 'null' } as Contract]) {
    const discard = chooseDiscard(twelve, contract)
    const ten = twelve.filter((c) => !discard.some((d) => sameCard(c, d)))
    const plan = plans(ten).find((p) => JSON.stringify(p.declaration.contract) === JSON.stringify(contract))
    if (!plan) continue
    const value = expectedValue(plan.declaration, twelve)
    // A contract that does not cover the bid is lost before a card is played; take it only when
    // nothing else is available.
    const rank = (value >= bid ? 10 : 0) + plan.score + value / 1000
    if (!best || rank > best.rank) best = { discard, declaration: plan.declaration, rank }
  }
  return { discard: best!.discard, declaration: best!.declaration }
}

export function chooseDiscard(twelve: Card[], contract: Contract): Card[] {
  if (contract.kind === 'null') {
    const risky = nullRisk(twelve)
    const byDanger = [...twelve].sort((a, b) => NULL_RANKS.indexOf(b.rank) - NULL_RANKS.indexOf(a.rank))
    return [...risky, ...byDanger.filter((c) => !risky.some((r) => sameCard(r, c)))].slice(0, 2)
  }
  const side = twelve.filter((c) => !isTrump(c, contract) && c.rank !== 'A')
  const lengthOf = (suit: Suit) => twelve.filter((c) => !isTrump(c, contract) && c.suit === suit).length
  const hasAce = (suit: Suit) => twelve.some((c) => c.suit === suit && c.rank === 'A' && !isTrump(c, contract))
  // Put away what would otherwise be lost: a bare 10 first (ten safe points), then cards from the
  // shortest suits so the hand can trump that suit later.
  const score = (c: Card) =>
    (c.rank === '10' && !hasAce(c.suit) ? 50 : 0) + (4 - lengthOf(c.suit)) * 10 + POINTS[c.rank]
  const pool = side.length >= 2 ? side : twelve.filter((c) => !isTrump(c, contract))
  const ranked = [...(pool.length >= 2 ? pool : twelve)].sort((a, b) => score(b) - score(a))
  return ranked.slice(0, 2)
}

export type PlayContext = {
  hand: Card[]
  /** Cards already on the table in this trick, in play order. */
  trick: Card[]
  /** Seats of the players who played those cards, same order. */
  trickSeats: number[]
  contract: Contract
  me: number
  declarer: number
  /** Every card played in earlier tricks. */
  gone: Card[]
  /** Cards only I know are out of play — the two I discarded, when I am the declarer. */
  buried: Card[]
}

export type Advice = { card: Card; reason: string }

const lowest = (cs: Card[], contract: Contract) =>
  [...cs].sort((a, b) => POINTS[a.rank] - POINTS[b.rank] || strength(a, contract) - strength(b, contract))[0]
const fattest = (cs: Card[], contract: Contract) =>
  [...cs].sort((a, b) => POINTS[b.rank] - POINTS[a.rank] || strength(a, contract) - strength(b, contract))[0]

export function advise(ctx: PlayContext): Advice {
  const legal = legalPlays(ctx.hand, ctx.trick, ctx.contract)
  if (legal.length === 1) return { card: legal[0], reason: '只有这一张能出。' }
  if (ctx.contract.kind === 'null') return adviseNull(ctx, legal)
  return ctx.me === ctx.declarer ? adviseDeclarer(ctx, legal) : adviseDefender(ctx, legal)
}

function outstanding(ctx: PlayContext): Card[] {
  const seen = [...ctx.hand, ...ctx.gone, ...ctx.trick, ...ctx.buried]
  return fullDeck().filter((c) => !seen.some((s) => sameCard(s, c)))
}

/** Is this card the best one left in its effective suit? Then nothing but a trump can beat it. */
function isMaster(card: Card, ctx: PlayContext): boolean {
  const suit = effectiveSuit(card, ctx.contract)
  return !outstanding(ctx).some(
    (c) => effectiveSuit(c, ctx.contract) === suit && strength(c, ctx.contract) > strength(card, ctx.contract),
  )
}

function adviseDeclarer(ctx: PlayContext, legal: Card[]): Advice {
  const { contract, trick } = ctx
  const out = outstanding(ctx)
  const trumpsOut = out.filter((c) => isTrump(c, contract))
  const myTrumps = legal.filter((c) => isTrump(c, contract)).sort((a, b) => strength(b, contract) - strength(a, contract))

  if (trick.length === 0) {
    if (trumpsOut.length > 0 && myTrumps.length > 0) {
      if (isMaster(myTrumps[0], ctx)) {
        return { card: myTrumps[0], reason: `先清主：${cardLabel(myTrumps[0])} 现在是最大的主牌，出它能把对手的主牌逼出来。` }
      }
      if (myTrumps.length >= 3) {
        const low = myTrumps[myTrumps.length - 1]
        return { card: low, reason: '主牌多就继续清主：用小主牌把对手的大主牌引出来。' }
      }
    }
    const masters = legal.filter((c) => !isTrump(c, contract) && isMaster(c, ctx) && POINTS[c.rank] >= 10)
    if (masters.length > 0 && trumpsOut.length === 0) {
      const c = fattest(masters, contract)
      return { card: c, reason: `对手没主牌了，${cardLabel(c)} 是这门花色最大的，稳拿这一墩。` }
    }
    if (masters.length > 0) {
      const c = fattest(masters, contract)
      return { card: c, reason: `${cardLabel(c)} 是这门花色最大的，趁对手还得跟牌先拿下。` }
    }
    const c = lowest(legal.filter((x) => !isTrump(x, contract)).length ? legal.filter((x) => !isTrump(x, contract)) : legal, contract)
    return { card: c, reason: '没有稳赢的牌，就出一张不值钱的小牌，把大牌留着。' }
  }

  const winning = trick[trickWinnerIndex(trick, contract)]
  const winners = legal.filter((c) => beats(c, winning, contract))
  const pot = trick.reduce((n, c) => n + POINTS[c.rank], 0)
  const last = trick.length === 2

  if (winners.length === 0) {
    return { card: lowest(legal, contract), reason: '这一墩赢不了，垫一张最不值钱的牌。' }
  }
  if (last) {
    const plainWinners = winners.filter((c) => !isTrump(c, contract))
    if (plainWinners.length > 0) {
      const c = fattest(plainWinners, contract)
      return { card: c, reason: `你最后出牌，用 ${cardLabel(c)} 赢下来，分数也一起带走。` }
    }
    if (pot === 0 && legal.some((c) => !beats(c, winning, contract))) {
      return { card: lowest(legal.filter((c) => !beats(c, winning, contract)), contract), reason: '这一墩一分都没有，不值得花主牌。' }
    }
    const cheap = [...winners].sort((a, b) => strength(a, contract) - strength(b, contract))[0]
    return { card: cheap, reason: `你最后出牌，用最小的够用的主牌 ${cardLabel(cheap)} 拿下这 ${pot} 点。` }
  }
  // Second to play: only commit a card the player behind cannot easily beat.
  const safe = winners.filter((c) => isMaster(c, ctx))
  if (safe.length > 0) {
    const c = fattest(safe, contract)
    return { card: c, reason: `${cardLabel(c)} 后面的人压不过，放心赢。` }
  }
  if (pot >= 10) {
    const c = [...winners].sort((a, b) => strength(b, contract) - strength(a, contract))[0]
    return { card: c, reason: `桌上已经有 ${pot} 点，值得用大牌去抢。` }
  }
  return { card: lowest(legal, contract), reason: '后面还有人，先出小牌，别把大牌送出去。' }
}

function adviseDefender(ctx: PlayContext, legal: Card[]): Advice {
  const { contract, trick, trickSeats, declarer } = ctx

  if (trick.length === 0) {
    const aces = legal.filter((c) => !isTrump(c, contract) && c.rank === 'A')
    if (aces.length > 0) {
      // The ace of the longest suit is the one most likely to be trumped, so cash the shortest.
      const c = [...aces].sort(
        (a, b) => ctx.hand.filter((x) => x.suit === a.suit).length - ctx.hand.filter((x) => x.suit === b.suit).length,
      )[0]
      return { card: c, reason: `防守方先兑现 A：${cardLabel(c)} 趁庄家还得跟牌，先拿 11 点。` }
    }
    const side = legal.filter((c) => !isTrump(c, contract))
    if (side.length > 0) {
      return { card: lowest(side, contract), reason: '防守方不要主动出主牌——那是在帮庄家清主。出一张副牌小牌。' }
    }
    return { card: lowest(legal, contract), reason: '手里只剩主牌了，出最小的。' }
  }

  const winIdx = trickWinnerIndex(trick, contract)
  const winning = trick[winIdx]
  const partnerWinning = trickSeats[winIdx] !== declarer
  const declarerPlayed = trickSeats.includes(declarer)
  const last = trick.length === 2
  const winners = legal.filter((c) => beats(c, winning, contract))

  if (partnerWinning && (last || declarerPlayed || isMaster(winning, ctx))) {
    const fat = legal.filter((c) => !(c.rank === 'J'))
    const c = fattest(fat.length ? fat : legal, contract)
    if (POINTS[c.rank] > 0) {
      return { card: c, reason: `同伴这一墩赢定了——给他「送分」：把 ${cardLabel(c)} 的 ${POINTS[c.rank]} 点垫上去。` }
    }
    return { card: c, reason: '同伴这一墩赢定了，可惜手里没有分能送。' }
  }

  if (declarerPlayed && !partnerWinning) {
    if (winners.length > 0) {
      const plainWinners = winners.filter((c) => !isTrump(c, contract))
      const c = plainWinners.length
        ? fattest(plainWinners, contract)
        : [...winners].sort((a, b) => strength(a, contract) - strength(b, contract))[0]
      return { card: c, reason: `庄家正赢着这一墩，用 ${cardLabel(c)} 压过他。` }
    }
    return { card: lowest(legal, contract), reason: '压不过庄家，就别给他送分，垫最小的。' }
  }

  // Declarer still to play behind me.
  const ace = legal.find((c) => !isTrump(c, contract) && c.rank === 'A' && beats(c, winning, contract))
  if (ace) return { card: ace, reason: `庄家还在后面，但 ${cardLabel(ace)} 他只能用主牌才压得住，值得一试。` }
  return { card: lowest(legal, contract), reason: '庄家还没出牌，先出小的，看他怎么出。' }
}

function adviseNull(ctx: PlayContext, legal: Card[]): Advice {
  const { contract, trick, trickSeats, declarer, me } = ctx
  const byRank = [...legal].sort((a, b) => strength(a, contract) - strength(b, contract))
  const low = byRank[0]
  const high = byRank[byRank.length - 1]

  if (trick.length === 0) {
    return { card: low, reason: me === declarer ? 'Null 里庄家要躲墩：出最小的牌，让别人去赢。' : 'Null 里防守方要逼庄家赢墩：出小牌，让他没法再往下躲。' }
  }

  const winning = trick[trickWinnerIndex(trick, contract)]
  const followsSuit = effectiveSuit(legal[0], contract) === effectiveSuit(trick[0], contract)

  if (me === declarer) {
    if (!followsSuit) return { card: high, reason: '你这门花色没牌了——正好把手里最危险的大牌扔掉。' }
    const under = byRank.filter((c) => !beats(c, winning, contract))
    if (under.length > 0) {
      const c = under[under.length - 1]
      return { card: c, reason: `出比桌上小的牌里最大的那张 ${cardLabel(c)}：既躲开这一墩，又甩掉一张大牌。` }
    }
    return { card: low, reason: '躲不开了，只能出最小的，盼着后面有人压过你。' }
  }

  const declarerIdx = trickSeats.indexOf(declarer)
  if (declarerIdx >= 0) {
    const declarerWinning = trickWinnerIndex(trick, contract) === declarerIdx
    if (declarerWinning && followsSuit) {
      const under = byRank.filter((c) => !beats(c, winning, contract))
      if (under.length > 0) {
        const c = under[under.length - 1]
        return { card: c, reason: `庄家现在是最大的——出比他小的 ${cardLabel(c)}，让这一墩砸在他手里。` }
      }
    }
    return { card: high, reason: '这一墩已经轮不到庄家赢了，顺手把大牌扔掉，留着小牌以后逼他。' }
  }
  return { card: low, reason: '庄家还没出，出小牌给他压力。' }
}
