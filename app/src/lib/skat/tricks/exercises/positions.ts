import { type Card, type Contract, isTrump, pointsOf, sameCard, trickWinnerIndex } from '../../cards'
import { SUIT_BASE, GRAND_BASE, matadors } from '../../value'
import { cards } from './cards-of'
import { JUDGED } from './judged'
import { type Position, nullBreaks, nullSure, openPoints, openValues, splits, sureOf } from './solve'
import { EXERCISE_TYPES, type Exercise, type Option, type ShownRow, type Who } from './types'

export { cards }

// The 36 exercises of the Skat-Tricks (SKATGO-103), in the order the section lists them: twelve kinds, three
// each. Positions are written here once, without words. An exact answer — a bid value, a count, a
// probability, an endgame, a Null — is computed below from the rules engine and the solver, never typed;
// a judgement — what to bid, put away, play or lead — is SkatZero's, re-checked by
// multiplayer/test/tricks-exercises.test.ts. The positions of SkatZero's exercises come from games it played
// against itself; the others were set for the trick they teach.

const suit = (trump: 'C' | 'S' | 'H' | 'D'): Contract => ({ kind: 'suit', trump })
const GRAND: Contract = { kind: 'grand' }
const NULL: Contract = { kind: 'null' }

const choose = (n: number, k: number): number => (k < 0 || k > n ? 0 : k === 0 ? 1 : (choose(n - 1, k - 1) * n) / k)

/** The index of `value` among `options` — the answer is where the computed value stands, or the build fails. */
function at<T>(options: T[], value: T): number {
  const i = options.indexOf(value)
  if (i < 0) throw new Error(`tricks_exercise_answer_missing ${String(value)}`)
  return i
}

const numbers = (ns: number[], answer: number): { options: Option[]; answer: number } => ({ options: ns.map((n) => ({ kind: 'number', n })), answer: at(ns, answer) })
const percents = (ps: number[], exact: number): { options: Option[]; answer: number } => ({ options: ps.map((p) => ({ kind: 'percent', p })), answer: at(ps, Math.round(exact * 100)) })

// —— 1 Reizen ————————————————————————————————————————————————————————————————————————————————————————————

/** The highest bid a suit game or Grand is sure to be worth before the skat: base × (matadors + 1). */
function biddable(hand: Card[], contract: Contract): number {
  const base = contract.kind === 'grand' ? GRAND_BASE : contract.kind === 'suit' ? SUIT_BASE[contract.trump] : 0
  return base * (matadors(hand, contract).count + 1)
}

const reizen1 = cards('CJ SJ CA C10 C9 C7 SA H10 H8 D7')
const reizen2 = cards('SJ HA H10 HK H9 H7 SA CA D8 D7')

// —— 6 Mitzählen: whole deals, so every card played is checked against the rules ——————————————————————————

type Deal = { contract: Contract; you: Card[]; left: Card[]; right: Card[]; skat: Card[]; tricks: [Who, string][][] }

/** The tricks as rows to show, each card under who played it. */
const trickRows = (d: Deal): ShownRow[] => d.tricks.map((t, i) => ({ kind: 'trick', n: i + 1, plays: t.map(([who, c]) => ({ who, card: cards(c)[0] })) }))
const played = (d: Deal) => d.tricks.flat().map(([, c]) => cards(c)[0])
const remaining = (d: Deal) => d.you.filter((c) => !played(d).some((p) => sameCard(p, c)))

export const MITZAEHLEN: Deal[] = [
  {
    contract: suit('C'),
    you: cards('CJ HJ CA C10 CK C8 SA S10 HA H7'),
    left: cards('SJ C9 C7 S9 S8 HK H9 DA D10 DK'),
    right: cards('DJ CQ SK SQ S7 H10 HQ H8 D9 DQ'),
    skat: cards('D7 D8'),
    tricks: [
      [['you', 'CJ'], ['left', 'C7'], ['right', 'CQ']],
      [['you', 'HJ'], ['left', 'SJ'], ['right', 'DJ']],
      [['left', 'DA'], ['right', 'D9'], ['you', 'C8']],
      [['you', 'CA'], ['left', 'C9'], ['right', 'H8']],
    ],
  },
  {
    contract: GRAND,
    you: cards('CJ DJ CA C10 C7 SA S10 HA H10 D7'),
    left: cards('SJ C9 CK S9 S8 H9 H8 DA D10 DQ'),
    right: cards('HJ CQ C8 SQ S7 HK HQ H7 DK D9'),
    skat: cards('SK D8'),
    tricks: [
      [['you', 'CJ'], ['left', 'SJ'], ['right', 'HJ']],
      [['you', 'CA'], ['left', 'C9'], ['right', 'C8']],
      [['you', 'C10'], ['left', 'CK'], ['right', 'CQ']],
      [['you', 'SA'], ['left', 'S8'], ['right', 'S7']],
    ],
  },
  {
    contract: suit('H'),
    you: cards('CJ HJ HA H10 HK H8 SA S10 CA C9'),
    left: cards('SJ HQ H9 S9 S8 SK C10 CK DA D10'),
    right: cards('DJ H7 SQ S7 CQ C8 C7 DK DQ D9'),
    skat: cards('D7 D8'),
    tricks: [
      [['you', 'CJ'], ['left', 'SJ'], ['right', 'DJ']],
      [['you', 'HJ'], ['left', 'H9'], ['right', 'H7']],
    ],
  },
]

/** Trumps the defenders still hold, as the declarer can count them: all trumps, less those played and its own. */
function trumpsOut(d: Deal): number {
  const all = [...d.you, ...d.left, ...d.right, ...d.skat]
  const gone = [...played(d), ...remaining(d), ...d.skat]
  return all.filter((c) => isTrump(c, d.contract) && !gone.some((g) => sameCard(g, c))).length
}

/** The declarer's card points so far: the tricks it took, and the skat it put away. */
function pointsSoFar(d: Deal): number {
  let n = pointsOf(d.skat)
  for (const t of d.tricks) {
    const cs = t.map(([, c]) => cards(c)[0])
    if (t[trickWinnerIndex(cs, d.contract)][0] === 'you') n += pointsOf(cs)
  }
  return n
}

// —— 7 Verlierbar?, 8 Endspiel, 9 Null ouvert, 10 Null-Risiko: the solver ————————————————————————————————

/** Every way the defenders may hold `out` (left plays after you), you to lead. */
const worldsOf = (you: Card[], out: Card[], declarerSeat: 0 | 2 = 0): Position[] =>
  splits(out, out.length / 2).map(([a, b]) => (declarerSeat === 0 ? { hands: [you, a, b], trick: [], turn: 0 } : { hands: [a, b, you], trick: [], turn: 0 }))

type Verlierbar = { contract: Contract; you: Card[]; out: Card[]; have: number }
export const VERLIERBAR: Verlierbar[] = [
  { contract: GRAND, you: cards('HJ HA H10 C7'), out: cards('DJ H9 HQ H8 CK CQ D8 S8'), have: 43 },
  { contract: GRAND, you: cards('SJ HJ CQ D9'), out: cards('CJ C9 C8 DK HK H7 S9 S7'), have: 54 },
  { contract: suit('H'), you: cards('CJ SJ H10 HK'), out: cards('HQ H9 SK S9 S7 CQ D8 D7'), have: 38 },
]

/** 0: sure — a way to 61 whatever the defenders hold; 1: can be lost — some deal beats you even when you see it. */
function verlierbar(v: Verlierbar): number {
  const need = 61 - v.have
  const worlds = worldsOf(v.you, v.out)
  if (sureOf(worlds, v.contract, 0, need)) return 0
  if (worlds.some((w) => openPoints(w, v.contract, 0) < need)) return 1
  throw new Error('tricks_exercise_verlierbar_unclear')
}

type Endspiel = { contract: Contract; you: Card[]; left: Card[]; right: Card[]; have: number; trick?: number }
export const ENDSPIEL: Endspiel[] = [
  { contract: GRAND, you: cards('CJ HA H10 D9 D7'), left: cards('HJ SA DA C10 C8'), right: cards('SJ SK DQ C7 S8'), have: 24, trick: 4 },
  { contract: suit('H'), you: cards('H10 H8 SA C8'), left: cards('S10 S7 CK C9'), right: cards('HK DK DQ D7'), have: 23 },
  { contract: suit('H'), you: cards('HJ CA CK S8'), left: cards('H9 H8 C10 S10'), right: cards('DJ DQ D8 SK'), have: 36, trick: 4 },
]

/** The one card that still makes 61, every card open; the build fails unless exactly one does. */
function endspiel(e: Endspiel): Card {
  const values = openValues({ hands: [e.you, e.left, e.right], trick: [], turn: 0 }, e.contract, 0)
  const winning = values.filter((v) => e.have + v.points >= 61)
  if (winning.length !== 1) throw new Error('tricks_exercise_endspiel_not_unique')
  return winning[0].card
}

/** Null ouvert, every card open: you lead, your partner next, the declarer last. */
type NullOuvert = { you: Card[]; partner: Card[]; declarer: Card[] }
export const NULL_OUVERT: NullOuvert[] = [
  { you: cards('D8 H7 C7 S7'), partner: cards('CK HJ SK S10'), declarer: cards('DK SJ S9 CQ') },
  { you: cards('C9 SJ S10 SK'), partner: cards('CK H7 S9 H9'), declarer: cards('C10 DJ H10 D8') },
  { you: cards('S9 S7 C7 SK'), partner: cards('CJ D9 CK SJ'), declarer: cards('H9 D7 D8 CQ') },
]

/** The one lead that beats the Null; the build fails unless exactly one does. */
function nullOuvert(n: NullOuvert): Card {
  const breaking = n.you.filter((c) => nullBreaks({ hands: [n.you.filter((d) => !sameCard(c, d)), n.partner, n.declarer], trick: [{ seat: 0, card: c }], turn: 1 }, 2))
  if (breaking.length !== 1) throw new Error('tricks_exercise_null_ouvert_not_unique')
  return breaking[0]
}

/** A Null's last five tricks: your cards and the ten still out; the defenders lead. */
type NullRisiko = { you: Card[]; out: Card[] }
export const NULL_RISIKO: NullRisiko[] = [
  { you: cards('C7 C9 CJ D7 D9'), out: cards('C8 C10 CQ CK D8 D10 DJ DQ H7 H8') },
  { you: cards('C7 C9 CJ S7 H8'), out: cards('C8 C10 CQ S8 S9 S10 H7 H9 H10 HJ') },
  { you: cards('C7 C9 SK HQ HA'), out: cards('C8 C10 CQ S7 S9 H7 H8 H9 H10 HJ') },
]

/** 0: safe however the cards lie; 1: it depends on how they lie; 2: lost however they lie (open play). */
function nullRisiko(n: NullRisiko): number {
  const worlds = splits(n.out, 5).map(([a, b]): Position => ({ hands: [a, b, n.you], trick: [], turn: 0 }))
  if (nullSure(worlds, 2)) return 0
  const broken = worlds.filter((w) => nullBreaks(w, 2)).length
  if (broken === worlds.length) return 2
  if (broken > 0) return 1
  throw new Error('tricks_exercise_null_risiko_unclear')
}

// —— 11 Wahrscheinlichkeiten: counted, 22 unseen cards before the skat, 20 after ———————————————————————

/** Two Jacks missing before the skat is taken: at least one in the skat. */
export const P_JACK_IN_SKAT = 1 - choose(20, 2) / choose(22, 2)
/** Four trumps out after the skat, ten cards each: two and two. */
export const P_TWO_TWO = (choose(4, 2) * choose(16, 8)) / choose(20, 10)
/** Four trumps out: three and one. */
export const P_THREE_ONE = (2 * choose(4, 3) * choose(16, 7)) / choose(20, 10)
/** Three trumps out: all three with one defender. */
export const P_THREE_NIL = (2 * choose(17, 7)) / choose(20, 10)

// —— The exercises ——————————————————————————————————————————————————————————————————————————————————————

const deal0 = MITZAEHLEN[0]
const deal1 = MITZAEHLEN[1]
const deal2 = MITZAEHLEN[2]

const sureText: Option[] = [{ kind: 'text' }, { kind: 'text' }]
const riskText: Option[] = [{ kind: 'text' }, { kind: 'text' }, { kind: 'text' }]

const EXACT: Exercise[] = [
  // 1 Reizen oder passen?
  {
    id: 'reizen-1',
    type: 'reizen',
    trick: 2,
    situation: { role: 'bidder', position: 'middlehand', rows: [{ kind: 'hand', who: 'you', cards: reizen1 }] },
    ask: { kind: 'choice', ...numbers([24, 36, 48, 60], biddable(reizen1, suit('C'))) },
    proof: { by: 'engine', note: 'Kreuz, mit 2, Spiel 3: 3 × 12' },
  },
  {
    id: 'reizen-2',
    type: 'reizen',
    trick: 2,
    situation: { role: 'bidder', position: 'forehand', rows: [{ kind: 'hand', who: 'you', cards: reizen2 }] },
    ask: { kind: 'choice', ...numbers([18, 20, 30, 40], biddable(reizen2, suit('H'))) },
    proof: { by: 'engine', note: 'Herz, ohne 1, Spiel 2: 2 × 10' },
  },

  // 6 Mitzählen
  {
    id: 'mitzaehlen-1',
    type: 'mitzaehlen',
    trick: 6,
    situation: { contract: deal0.contract, role: 'declarer', position: 'forehand', rows: [{ kind: 'hand', who: 'you', cards: remaining(deal0) }, { kind: 'skat', cards: deal0.skat }, ...trickRows(deal0)] },
    ask: { kind: 'choice', ...numbers([0, 1, 2, 3], trumpsOut(deal0)) },
    proof: { by: 'engine', note: 'Trümpfe: 11 − gespielt − eigene' },
  },
  {
    id: 'mitzaehlen-2',
    type: 'mitzaehlen',
    trick: 6,
    situation: { contract: deal1.contract, role: 'declarer', position: 'forehand', rows: [{ kind: 'skat', cards: deal1.skat }, ...trickRows(deal1)] },
    ask: { kind: 'choice', ...numbers([38, 45, 49, 53], pointsSoFar(deal1)) },
    proof: { by: 'engine', note: 'Augen der eigenen Stiche + Skat' },
  },
  {
    id: 'mitzaehlen-3',
    type: 'mitzaehlen',
    trick: 6,
    situation: { contract: deal2.contract, role: 'declarer', position: 'forehand', rows: [{ kind: 'hand', who: 'you', cards: remaining(deal2) }, { kind: 'skat', cards: deal2.skat }, ...trickRows(deal2)] },
    ask: { kind: 'choice', ...numbers([0, 1, 2, 3], trumpsOut(deal2)) },
    proof: { by: 'engine', note: 'Trümpfe: 11 − gespielt − eigene' },
  },

  // 7 Verlierbar?
  ...VERLIERBAR.map((v, i): Exercise => ({
    id: `verlierbar-${i + 1}`,
    type: 'verlierbar',
    trick: 5,
    situation: { contract: v.contract, role: 'declarer', position: 'forehand', points: v.have, rows: [{ kind: 'hand', who: 'you', cards: v.you }, { kind: 'outstanding', cards: v.out }] },
    ask: { kind: 'choice', options: sureText, answer: verlierbar(v) },
    proof: { by: 'solver', note: verlierbar(v) === 0 ? 'sicher: ein Weg zu 61 gegen jede Verteilung' : 'verlierbar: eine Verteilung, in der auch offen keine 61 gehen' },
  })),

  // 8 Endspiel mit offenen Karten
  ...ENDSPIEL.map((e, i): Exercise => ({
    id: `endspiel-${i + 1}`,
    type: 'endspiel',
    trick: e.trick,
    situation: { contract: e.contract, role: 'declarer', position: 'forehand', points: e.have, rows: [{ kind: 'hand', who: 'left', cards: e.left }, { kind: 'hand', who: 'right', cards: e.right }] },
    ask: { kind: 'play', contract: e.contract, hand: e.you, trick: [], best: [endspiel(e)] },
    proof: { by: 'solver', note: 'die einzige Karte, mit der offen 61 gehen' },
  })),

  // 9 Null ouvert knacken
  ...NULL_OUVERT.map((n, i): Exercise => ({
    id: `null-ouvert-${i + 1}`,
    type: 'null-ouvert',
    situation: { contract: NULL, ouvert: true, role: 'defender', position: 'forehand', declarer: 'rearhand', rows: [{ kind: 'hand', who: 'declarer', cards: n.declarer }, { kind: 'hand', who: 'partner', cards: n.partner }] },
    ask: { kind: 'play', contract: NULL, hand: n.you, trick: [], best: [nullOuvert(n)] },
    proof: { by: 'solver', note: 'der einzige Anspiel, der den Null offen schlägt' },
  })),

  // 10 Wie sicher ist der Null?
  ...NULL_RISIKO.map((n, i): Exercise => ({
    id: `null-risiko-${i + 1}`,
    type: 'null-risiko',
    situation: { contract: NULL, role: 'declarer', position: 'rearhand', rows: [{ kind: 'hand', who: 'you', cards: n.you }, { kind: 'outstanding', cards: n.out }] },
    ask: { kind: 'choice', options: riskText, answer: nullRisiko(n) },
    proof: { by: 'solver', note: 'alle 252 Verteilungen' },
  })),

  // 11 Wahrscheinlichkeiten
  {
    id: 'wahrscheinlichkeit-1',
    type: 'wahrscheinlichkeit',
    trick: 1,
    situation: { role: 'bidder', rows: [] },
    ask: { kind: 'choice', ...percents([9, 18, 33, 50], P_JACK_IN_SKAT) },
    proof: { by: 'engine', note: '1 − C(20,2)/C(22,2)' },
  },
  {
    id: 'wahrscheinlichkeit-2',
    type: 'wahrscheinlichkeit',
    trick: 6,
    situation: { role: 'declarer', rows: [] },
    ask: { kind: 'choice', ...percents([25, 42, 50, 75], P_TWO_TWO) },
    proof: { by: 'engine', note: 'C(4,2)·C(16,8)/C(20,10)' },
  },
  {
    id: 'wahrscheinlichkeit-3',
    type: 'wahrscheinlichkeit',
    trick: 6,
    situation: { role: 'declarer', rows: [] },
    ask: { kind: 'choice', ...percents([5, 11, 21, 50], P_THREE_NIL) },
    proof: { by: 'engine', note: '2·C(17,7)/C(20,10)' },
  },
]

/** All 36, kind by kind in the section's order, each kind's in its own order. */
export const EXERCISES: Exercise[] = EXERCISE_TYPES.flatMap((type) =>
  [...EXACT, ...JUDGED].filter((e) => e.type === type).sort((a, b) => a.id.localeCompare(b.id)),
)
