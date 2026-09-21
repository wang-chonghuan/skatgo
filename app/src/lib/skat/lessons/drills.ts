// Drill generators. Each builds a fresh question from random cards and lets the rules engine work
// out the answer, so the tenth attempt is as new as the first and no answer key can drift away from
// the rules. They use Math.random, so they run in the browser only — the lesson player calls them
// after mount.

import {
  type Card,
  type Contract,
  type Suit,
  POINTS,
  SUITS,
  SUIT_NAME,
  SUIT_SYMBOL,
  cardLabel,
  contractName,
  effectiveSuit,
  fullDeck,
  isTrump,
  legalPlays,
  pointsOf,
  sameCard,
  shuffle,
  sortHand,
  strength,
  trickWinnerIndex,
} from '../cards'
import { SUIT_BASE, GRAND_BASE, matadors } from '../value'
import type { ChoiceStep, OrderStep, PickStep } from './types'

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)]
const randomSuit = (): Suit => pick(SUITS)
const suitContract = (): Contract => ({ kind: 'suit', trump: randomSuit() })

/** Four distinct numeric options containing the answer, shuffled. */
function numberOptions(answer: number, decoys: number[]): { options: string[]; answer: number } {
  const pool = [...new Set(decoys.filter((d) => d !== answer && d >= 0))]
  const options = shuffle([answer, ...shuffle(pool).slice(0, 3)])
  return { options: options.map(String), answer: options.indexOf(answer) }
}

export function countPointsDrill(): ChoiceStep {
  // Draw until the trick is worth something: three blanks teach nothing about counting.
  let trick: Card[]
  do trick = shuffle(fullDeck()).slice(0, 3)
  while (pointsOf(trick) < 5)
  const total = pointsOf(trick)
  const sum = trick.map((c) => POINTS[c.rank]).join(' + ')
  return {
    kind: 'choice',
    prompt: '这一墩一共多少点？',
    rows: [{ cards: trick }],
    ...numberOptions(total, [total + 1, total - 1, total + 2, total - 2, total + 10, total - 10, total + 7, total - 7, total + 3]),
    explain: `${sum} = **${total}** 点。记住：A 11、10 10、K 4、Q 3、J 2，其余 0。`,
    hint: '一张一张加：A 是 11，10 是 10，K 是 4，Q 是 3，J 是 2，7/8/9 不算分。',
  }
}

export function pickTrumpsDrill(contract: Contract = Math.random() < 0.75 ? suitContract() : { kind: 'grand' }): PickStep {
  let hand: Card[]
  let trumps: Card[]
  do {
    hand = shuffle(fullDeck()).slice(0, 8)
    trumps = hand.filter((c) => isTrump(c, contract))
  } while (trumps.length < 2 || trumps.length > 6 || !trumps.some((c) => c.rank === 'J'))
  return {
    kind: 'pick',
    prompt: `定约是 **${contractName(contract)}**。把这手牌里所有的主牌都点出来。`,
    cards: sortHand(hand, null),
    correct: trumps,
    explain:
      contract.kind === 'suit'
        ? `四张 J 永远是主牌，再加上所有的${SUIT_NAME[contract.trump]}${SUIT_SYMBOL[contract.trump]}。`
        : 'Grand 里只有四张 J 是主牌，别的花色一律平等。',
    hint: contract.kind === 'grand' ? 'Grand：只有 J。' : '别漏了 J——不管它印的是什么花色，它都是主牌。',
  }
}

export function orderDrill(contract: Contract = suitContract()): OrderStep {
  let chosen: Card[]
  if (contract.kind === 'null') {
    const suit = randomSuit()
    chosen = shuffle(fullDeck().filter((c) => c.suit === suit)).slice(0, 5)
  } else {
    const trumps = fullDeck().filter((c) => isTrump(c, contract))
    do chosen = shuffle(trumps).slice(0, Math.min(5, trumps.length))
    while (contract.kind === 'suit' && chosen.filter((c) => c.rank === 'J').length < 2)
  }
  const correct = [...chosen].sort((a, b) => strength(b, contract) - strength(a, contract))
  return {
    kind: 'order',
    prompt: `定约是 **${contractName(contract)}**。按从大到小的顺序依次点这些牌。`,
    cards: shuffle(chosen),
    correct,
    explain:
      contract.kind === 'null'
        ? `Null 里是「正常」顺序：${correct.map(cardLabel).join(' > ')}。`
        : `${correct.map(cardLabel).join(' > ')}。J 先按 ♣ ♠ ♥ ♦ 排，然后才是 A、10、K、Q、9、8、7。`,
    hint:
      contract.kind === 'null'
        ? 'Null 里没有主牌，J 只是一张普通牌：A、K、Q、J、10、9、8、7。'
        : '想想：J 最大（♣ ♠ ♥ ♦），然后才轮到 A、10、K、Q、9、8、7。',
  }
}

export function legalDrill(contract: Contract = Math.random() < 0.7 ? suitContract() : { kind: 'grand' }): PickStep {
  // Aim for the instructive cases: a plain-suit lead while the hand holds the Jack of that printed
  // suit, or a trump lead answered with Jacks.
  for (;;) {
    const deck = shuffle(fullDeck())
    const hand = deck.slice(0, 7)
    const lead = deck[7]
    const legal = legalPlays(hand, [lead], contract)
    if (legal.length === hand.length && Math.random() < 0.8) continue
    const trap = hand.some((c) => c.rank === 'J' && c.suit === lead.suit) || isTrump(lead, contract)
    if (!trap && Math.random() < 0.6) continue
    const led = effectiveSuit(lead, contract)
    const ledName = led === 'T' ? '主牌' : `${SUIT_NAME[led]}${SUIT_SYMBOL[led]}`
    return {
      kind: 'pick',
      prompt: `定约 **${contractName(contract)}**，对手首出 **${cardLabel(lead)}**。你手里哪些牌可以出？全部点出来。`,
      context: `首出：${cardLabel(lead)}（算作${ledName}）`,
      cards: sortHand(hand, contract),
      correct: legal,
      explain:
        legal.length === hand.length
          ? `你手里没有${ledName}，所以随便出哪张都行。`
          : `首出的是${ledName}，你有就必须跟。${led === 'T' ? 'J 也是主牌，可以（也必须）拿来跟。' : 'J 不算这门花色，不能拿来跟。'}`,
      hint: `先问自己：首出的这张牌算什么花色？（提示：${ledName}）你手里有没有同一门？`,
    }
  }
}

export function trickWinnerDrill(contract: Contract = pick<Contract>([suitContract(), suitContract(), { kind: 'grand' }])): PickStep {
  for (;;) {
    const deck = shuffle(fullDeck())
    // Build a trick people could really have played: the second and third cards must be legal.
    const lead = deck[0]
    const second = pick(legalPlays(deck.slice(1, 11), [lead], contract))
    const third = pick(legalPlays(deck.slice(11, 21), [lead, second], contract))
    const trick = [lead, second, third]
    const interesting = trick.some((c) => isTrump(c, contract)) || new Set(trick.map((c) => c.suit)).size > 1
    if (!interesting && Math.random() < 0.7) continue
    const w = trickWinnerIndex(trick, contract)
    const winner = trick[w]
    const why = isTrump(winner, contract)
      ? `${cardLabel(winner)} 是主牌${trick.filter((c) => isTrump(c, contract)).length > 1 ? '里最大的' : '，主牌压过一切副牌'}。`
      : `没人出主牌，首出的是${SUIT_NAME[lead.suit]}，${cardLabel(winner)} 是这门里最大的。别的花色再大也没用。`
    return {
      kind: 'pick',
      single: true,
      prompt: `定约 **${contractName(contract)}**。三张牌按从左到右的顺序打出，哪一张赢下这一墩？`,
      cards: trick,
      correct: [winner],
      explain: `${why} 这一墩值 ${pointsOf(trick)} 点。`,
      hint: '先看有没有主牌；没有的话，只有和首出同花色的牌才有资格比大小。',
    }
  }
}

function dealtHand(): Card[] {
  return shuffle(fullDeck()).slice(0, 10)
}

export function matadorDrill(): ChoiceStep {
  const contract: Contract = Math.random() < 0.8 ? suitContract() : { kind: 'grand' }
  const hand = sortHand(dealtHand(), contract)
  const m = matadors(hand, contract)
  const label = (w: boolean, n: number) => `${w ? '有' : '无'} ${n}`
  const decoys = [label(!m.with, m.count), label(m.with, m.count + 1), label(m.with, Math.max(1, m.count - 1)), label(!m.with, m.count + 1), label(m.with, m.count + 2)]
  const options = shuffle([label(m.with, m.count), ...[...new Set(decoys)].filter((d) => d !== label(m.with, m.count)).slice(0, 3)])
  return {
    kind: 'choice',
    prompt: `定约 **${contractName(contract)}**。这手牌的 Matador 是多少？`,
    rows: [{ cards: hand }],
    options,
    answer: options.indexOf(label(m.with, m.count)),
    explain: m.with
      ? `你有 ♣J，所以是「有」。从 ♣J 往下连续数，数到第一张你**没有**的主牌为止：连着 ${m.count} 张。`
      : `你没有 ♣J，所以是「无」。从 ♣J 往下数你**缺**的，数到第一张你有的主牌为止：连着缺 ${m.count} 张。`,
    hint: '只看最大的那张 ♣J：有它就是「有」，没有就是「无」。然后沿着 ♣J ♠J ♥J ♦J A 10 K… 往下数连续的。',
  }
}

export function gameValueDrill(): ChoiceStep {
  const contract: Contract = Math.random() < 0.8 ? suitContract() : { kind: 'grand' }
  const hand = sortHand(dealtHand(), contract)
  const m = matadors(hand, contract)
  const handGame = Math.random() < 0.3
  const base = contract.kind === 'grand' ? GRAND_BASE : SUIT_BASE[(contract as { trump: Suit }).trump]
  const mult = m.count + 1 + (handGame ? 1 : 0)
  const value = base * mult
  return {
    kind: 'choice',
    prompt: `你想打 **${contractName(contract)}**${handGame ? '，而且是 **Hand**（不看底牌）' : ''}。只要赢了，这一局值多少分？也就是——你最高能叫到多少？`,
    rows: [{ cards: hand }],
    ...numberOptions(value, [base * (mult + 1), base * (mult - 1), base * m.count, base * (mult + 2), (base + 1) * mult, (base - 1) * mult, base * mult + base / 2]),
    explain: `${m.with ? '有' : '无'} ${m.count}，成局 +1${handGame ? '，Hand +1' : ''} → 倍数 ${mult}。${contractName(contract)} 的基值是 ${base}，所以 ${base} × ${mult} = **${value}**。`,
    hint: '分值 = 基值 × 倍数。倍数 = Matador 数 + 1（成局）+ 加倍项。基值：♦9 ♥10 ♠11 ♣12 Grand 24。',
  }
}

export function settleDrill(): ChoiceStep {
  const trump = randomSuit()
  const base = SUIT_BASE[trump]
  const mult = pick([2, 3, 4])
  const value = base * mult
  const scenario = pick(['win', 'lose', 'overbid', 'schneider'] as const)
  const name = `${SUIT_NAME[trump]}${SUIT_SYMBOL[trump]}`
  let prompt: string
  let score: number
  let explain: string
  if (scenario === 'win') {
    const pts = pick([61, 64, 72, 80, 88])
    prompt = `庄家打 ${name}，倍数 ${mult}（分值 ${value}）。打完庄家拿到 **${pts}** 点。庄家这一局记多少分？`
    score = value
    explain = `${pts} ≥ 61，赢了，记 **+${value}**。`
  } else if (scenario === 'lose') {
    const pts = pick([60, 58, 52, 45, 38])
    prompt = `庄家打 ${name}，倍数 ${mult}（分值 ${value}）。打完庄家只拿到 **${pts}** 点。庄家这一局记多少分？`
    score = -2 * value
    explain = `${pts} < 61，输了。输了按**两倍**扣：−2 × ${value} = **${score}**。${pts === 60 ? '60 点是平分，但平分算庄家输。' : ''}`
  } else if (scenario === 'schneider') {
    const pts = pick([90, 93, 101])
    prompt = `庄家打 ${name}，开打前算的倍数是 ${mult}。结果大胜，拿到 **${pts}** 点。庄家这一局记多少分？`
    score = base * (mult + 1)
    explain = `${pts} ≥ 90，这叫 **Schneider**，倍数再 +1：${base} × ${mult + 1} = **+${score}**。`
  } else {
    const bid = value + base
    prompt = `庄家叫到了 **${bid}**，打 ${name}。亮出底牌后发现倍数其实只有 ${mult}（分值 ${value}）。庄家打到了 70 点。记多少分？`
    score = -2 * bid
    explain = `分值 ${value} 小于叫分 ${bid}，这是**超叫**，拿多少点都算输。按能盖住叫分的最小倍数算：${base} × ${mult + 1} = ${bid}，再翻倍扣：**${score}**。`
  }
  const fmt = (n: number) => (n > 0 ? `+${n}` : String(n))
  const decoys = [value, -value, -2 * value, 2 * value, base * (mult + 1), -2 * base * (mult + 1), -(value + base)].filter((d) => d !== score)
  const options = shuffle([score, ...shuffle([...new Set(decoys)]).slice(0, 3)])
  return {
    kind: 'choice',
    prompt,
    options: options.map(fmt),
    answer: options.indexOf(score),
    explain,
    hint: '先判断输赢（61 点；超叫直接输）。赢了记 +分值，输了记 −2×分值。',
  }
}

/** Does the learner's pick equal the expected set? Order-free. */
export function sameSet(a: Card[], b: Card[]): boolean {
  return a.length === b.length && a.every((c) => b.some((d) => sameCard(c, d)))
}
