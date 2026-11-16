// What a day's video shows and says (SKATGO-202), worked out from two stored deals of the day: yesterday's broken down
// — how would you play it, a pause to think, why the bidding went so, the key tricks, what to take away — then today's
// left as the challenge (the human: 「这个解读要有活力的女声……要有解读，比如这幅牌你会怎么打，暂停视频思考一下，1秒后，讲为啥
// 这么叫牌，打牌时的几个关键点。让人看了有学到东西……然后再留今日挑战，请来skatgo.com玩，关注本号，明天看答案解析」).
// The breakdown's words are the site's model's (multiplayer/src/llm.ts), written only from the facts worked out here.
// Run through the multiplayer's tsx, which resolves the app's game code; the model's LLM_* from app/.env:
//   cd multiplayer && node --import tsx ../video/scripts/plan.ts <today.json> <yesterday.json> <de|en> <out.json>
// English keeps the site's German Skat words (Bube, Dame, Grand, forehand), as the site's English does.
import { readFileSync, writeFileSync } from 'node:fs'
import { type Card, type Contract, POINTS, effectiveSuit, isTrump, pointsOf, sortHand, trickWinnerIndex } from '../../app/src/lib/skat/cards'
import { collectTrick, deal, roleOf, type Game, type Role, type Seat } from '../../app/src/lib/skat/game'
import { bidAdvice } from '../../app/src/lib/skat/ai'
import { type Declaration, matadors } from '../../app/src/lib/skat/value'
import type { DealSummary } from '../../app/src/lib/skat/tournament'
import { applySeatMove } from '../../multiplayer/src/model'

type Logged = { seat: Seat; move: Parameters<typeof applySeatMove>[2] }
type Spec = { dealer: Seat; deck: Card[]; benchmark: { summary: DealSummary; log: Logged[] } }
type Lang = 'de' | 'en'

const SUIT: Record<Lang, Record<Card['suit'], string>> = {
  de: { C: 'Kreuz', S: 'Pik', H: 'Herz', D: 'Karo' },
  en: { C: 'Clubs', S: 'Spades', H: 'Hearts', D: 'Diamonds' },
}
const RANK: Record<Lang, Record<Card['rank'], string>> = {
  de: { J: 'Bube', Q: 'Dame', K: 'König', A: 'Ass', '10': 'Zehn', '9': 'Neun', '8': 'Acht', '7': 'Sieben' },
  en: { J: 'Bube', Q: 'Dame', K: 'King', A: 'Ace', '10': 'Ten', '9': 'Nine', '8': 'Eight', '7': 'Seven' },
}
const ROLE: Record<Lang, Record<Role, string>> = {
  de: { forehand: 'Vorhand', middlehand: 'Mittelhand', rearhand: 'Hinterhand' },
  en: { forehand: 'Forehand', middlehand: 'Middlehand', rearhand: 'Rearhand' },
}
const MONTH: Record<Lang, string[]> = {
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}
const COUNT: Record<Lang, string[]> = { de: ['keine', 'ein', 'zwei', 'drei', 'vier'], en: ['no', 'one', 'two', 'three', 'four'] }

let L: Lang = 'de'
const de = () => L === 'de'
const cardName = (c: Card) => (de() ? `${SUIT.de[c.suit]}-${RANK.de[c.rank]}` : `${RANK.en[c.rank]} of ${SUIT.en[c.suit]}`)
const dateName = (day: string) => {
  const d = Number(day.slice(8, 10))
  const m = MONTH[L][Number(day.slice(5, 7)) - 1]
  return de() ? `${d}. ${m}` : `${m} ${d}`
}
function contractName(d: { contract: Contract; hand?: boolean; ouvert?: boolean }): string {
  const c = d.contract
  const base = c.kind === 'grand' ? 'Grand' : c.kind === 'null' ? 'Null' : de() ? `${SUIT.de[c.trump]}-Spiel` : SUIT.en[c.trump]
  return [base, d.hand ? 'Hand' : '', d.ouvert ? 'Ouvert' : ''].filter(Boolean).join(' ')
}
const role = (seat: Seat, dealer: Seat) => ROLE[L][roleOf(seat, dealer)]
/** Who a seat is, said to the viewer: the player's seat is "du" / "you", the others by their place at the table. */
const who = (seat: Seat, dealer: Seat) => (seat === 0 ? (de() ? 'du' : 'you') : role(seat, dealer))
const capital = (s: string) => s[0].toUpperCase() + s.slice(1)

function handWords(hand: Card[]): string {
  const jacks = hand.filter((c) => c.rank === 'J').length
  const aces = hand.filter((c) => c.rank === 'A').length
  const n = (k: number) => COUNT[L][k] ?? String(k)
  return de()
    ? `${capital(n(jacks))} ${jacks === 1 ? 'Bube' : 'Buben'}, ${n(aces)} ${aces === 1 ? 'Ass' : 'Asse'}.`
    : `${capital(n(jacks))} ${jacks === 1 ? 'Bube' : 'Buben'}, ${n(aces)} ${aces === 1 ? 'Ace' : 'Aces'}.`
}

/** The deal replayed from its stored moves, finished tricks collected as they close. */
function replay(spec: Spec): Game {
  let g = deal(spec.dealer, spec.deck)
  for (const { seat, move } of spec.benchmark.log) {
    if (g.phase === 'trickEnd') g = collectTrick(g)
    g = applySeatMove(g, seat, move)
  }
  return g.phase === 'trickEnd' ? collectTrick(g) : g
}

type Segment = { id: string; text: string; scene: string; part: 'answer' | 'quiz'; trick?: number; pause?: boolean }
type Question = { key: 'pass' | 'bid' | 'game' | 'hand'; text: string }

const QUESTION: Record<Lang, Record<Question['key'], string>> = {
  de: { pass: 'Reizen oder passen?', bid: 'Bis wie viel reizt du?', game: 'Welches Spiel sagst du an?', hand: 'Spielst du Hand – oder nimmst du den Skat?' },
  en: { pass: 'Bid or pass?', bid: 'How high do you bid?', game: 'Which game do you announce?', hand: 'Do you play Hand – or pick up the Skat?' },
}
const ask = (key: Question['key']): Question => ({ key, text: QUESTION[L][key] })

/** The challenge's question, chosen by what the AI did in the player's seat, so it is the deal's real decision; its
 *  answer is never said (SKATGO-195: nothing of a deal's AI before it is played). */
function question(spec: Spec, day: string): Question {
  const s = spec.benchmark.summary
  const competed = spec.benchmark.log.some((l) => l.seat === 0 && l.move.type === 'bid' && (l.move as { value: string }).value !== 'pass')
  if (s.declarer === 0 && s.declaration) {
    if (s.declaration.hand) return ask('hand')
    if (s.declaration.contract.kind !== 'suit') return ask('game')
    return ask(Number(day.slice(8, 10)) % 2 ? 'bid' : 'game')
  }
  return ask(competed ? 'bid' : 'pass')
}

const discardOf = (spec: Spec): Card[] => ((spec.benchmark.log.find((l) => l.seat === 0 && l.move.type === 'discard')?.move as { cards?: Card[] })?.cards ?? [])

/** Everything true about yesterday's deal the breakdown may use, from the viewer's seat: the model is given nothing else. */
function facts(spec: Spec, g: Game) {
  const s = spec.benchmark.summary
  const start = deal(spec.dealer, spec.deck)
  const decl = s.declaration
  const declarer = s.declarer
  const advice = bidAdvice(start.hands[0])
  const declarerTwelve = declarer === null ? [] : [...start.hands[declarer], ...start.skat]
  const mine = declarer === 0
  const pickup = !!decl && !decl.hand
  const discard = mine && pickup ? discardOf(spec) : []
  let declarerSoFar = mine && pickup ? pointsOf(discard) : 0
  const contract = decl?.contract ?? null
  const side = (seat: Seat) => (seat === declarer ? 'declarer' : 'defence')
  // Each card as a player at the table would say it: led, followed, trumped in (gestochen), smeared to a partner
  // already winning (geschmiert), or thrown off (abgeworfen).
  const tricks = g.tricks.map((t, i) => {
    const points = pointsOf(t.cards.map((p) => p.card))
    if (side(t.winner) === 'declarer') declarerSoFar += points
    const plays = t.cards.map((p, j) => {
      const name = `${who(p.seat, spec.dealer)} (${side(p.seat)}): ${cardName(p.card)}${contract && isTrump(p.card, contract) ? ' [trump]' : ''}, ${POINTS[p.card.rank]} Augen`
      if (j === 0 || !contract) return `${name} — led`
      const before = t.cards.slice(0, j)
      const winning = before[trickWinnerIndex(before.map((b) => b.card), contract)]
      const followed = effectiveSuit(p.card, contract) === effectiveSuit(t.cards[0].card, contract)
      const takes = trickWinnerIndex([...before.map((b) => b.card), p.card], contract) === j
      const act = followed
        ? takes ? 'followed suit and took the lead' : 'followed suit'
        : isTrump(p.card, contract) ? (takes ? 'trumped in (gestochen) and took the lead' : 'trumped in but was over-trumped')
        : side(winning.seat) === side(p.seat) && POINTS[p.card.rank] >= 10 ? 'smeared (geschmiert) to a partner already winning the trick'
        : 'could not follow and threw it off (abgeworfen)'
      return `${name} — ${act}`
    })
    return { trick: i + 1, plays, winner: `${who(t.winner, spec.dealer)} (${side(t.winner)})`, points, declarerAugenAfter: declarerSoFar }
  })
  const hand0 = start.hands[0]
  const viewerTrumps = contract ? hand0.filter((c) => isTrump(c, contract)).map(cardName) : []
  return {
    viewerSeat: who(0, spec.dealer),
    viewerPartner: declarer === null || declarer === 0 ? null : who(([1, 2] as Seat[]).find((x) => x !== declarer)!, spec.dealer),
    viewerOpponents: declarer === null ? [] : declarer === 0 ? ([1, 2] as Seat[]).map((x) => who(x, spec.dealer)) : [who(declarer, spec.dealer)],
    viewerPosition: role(0, spec.dealer),
    viewerHand: hand0.map(cardName),
    viewerHandAugen: pointsOf(hand0),
    viewerBuben: hand0.filter((c) => c.rank === 'J').map(cardName),
    viewerTrumpsInThisGame: viewerTrumps,
    viewerCouldBid: advice.limit > 0 && advice.contract ? `up to ${advice.limit}, playing ${contractName({ contract: advice.contract })}` : 'no: too weak to bid at all',
    biddingMoves: spec.benchmark.log.filter((l) => l.move.type === 'bid').map((l) => `${who(l.seat, spec.dealer)}: ${(l.move as { value: string }).value}`),
    finalBid: s.bid,
    declarer: declarer === null ? null : who(declarer, spec.dealer),
    contract: decl ? contractName(decl) : null,
    hand: decl?.hand ?? false,
    skat: mine && pickup ? start.skat.map(cardName) : 'not seen by the viewer',
    discard: discard.map(cardName),
    matadors: decl && decl.contract.kind !== 'null' ? matadors(declarerTwelve, decl.contract) : null,
    gameValue: s.detail?.value ?? null,
    won: s.won,
    declarerPoints: s.detail?.declarerPoints ?? null,
    defenderPoints: s.detail?.defenderPoints ?? null,
    tricks,
    augenToWin: 61,
    trumpSuit: contract?.kind === 'suit' ? SUIT[L][contract.trump] : contract?.kind ?? null,
  }
}

/** The site's model (multiplayer/src/llm.ts), here at medium effort or more: a teaching script must be right. */
async function model(system: string, user: string, effort = 'medium'): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${process.env.LLM_BASE_URL!.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    signal: AbortSignal.timeout(180_000),
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.LLM_API_KEY}` },
    body: JSON.stringify({
      model: process.env.LLM_MODEL || 'gpt-5.6-luna',
      reasoning_effort: effort,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  }).catch(() => null)
  if (!res?.ok) return null
  try {
    return JSON.parse((await res.json()).choices?.[0]?.message?.content ?? 'null')
  } catch {
    return null
  }
}

const language = (lang: Lang) => (lang === 'de' ? 'German' : 'English')
const WORDS = (lang: Lang) =>
  lang === 'de'
    ? 'Use the words a German Skat table uses: Buben, Augen, Trumpf, Stich, stechen, übernehmen, schmieren, abwerfen, bedienen, Hand.'
    : 'Keep only these German nouns, as SkatGo does: Bube/Buben, Augen, Trumpf, Skat, Hand. Use English verbs: trump, take over, smear, discard, follow suit.'

const WRITE = (lang: Lang) => `You are SkatGo's Skat coach, voicing a short vertical video that breaks down yesterday's "deal of the day".
Write in ${language(lang)}: lively and warm like an upbeat TV host, plain words, short spoken sentences.
Teach something real: the viewer should finish with an "aha".
Use ONLY the facts in the user's JSON. Never invent a card, a number, a bid, a move or who played what; never mention rules engines or "limits".
"${lang === 'de' ? 'du' : 'you'}" is the viewer's seat (the AI played it). When the viewer defends, the other defender is the viewer's partner and only the declarer is the opponent; the facts mark each seat's side. Speak of the others by their place (${lang === 'de' ? 'Vorhand, Mittelhand, Hinterhand' : 'Forehand, Middlehand, Rearhand'}).
${WORDS(lang)}
Return JSON: {"bidding": string, "keys": [{"trick": number, "text": string}], "lesson": string}.
- bidding: 1–2 sentences: why the viewer's seat bid or passed, using the hand's real features (its Buben, trump length, Augen), and what the declarer then played.
- keys: the 2 or 3 tricks that decided the game, in play order. For each, 1–2 sentences: what happened (only cards in that trick, as the facts annotate them) and why it was smart or costly.
  Say stechen / gestochen only for a play the facts mark "trumped in"; a higher card of the suit led is "übernehmen" / "took the lead".
- lesson: one sentence of at most 22 words: a general Skat strategy that is true in any game, then one example from this deal already said in bidding or keys. ${lang === 'de' ? 'Like: "Gewinnt dein Partner den Stich sicher, schmier ihm volle Augen – wie Vorhand hier die Karo-Zehn."' : 'Like: "When your partner is sure to win the trick, smear full Augen onto it – as Forehand did with the Ten of Diamonds."'} Not a basic rule of the game, not a recap.
Never call it "the answer" or "the solution". Under 70 words in total.`

const CHECK = (lang: Lang) => `You check a ${language(lang)} Skat video script against the facts it was written from.
For every sentence: is each card, number, seat and move exactly as in the facts (who played which card, who won, the Augen)?
stechen / gestochen is only for a play the facts mark "trumped in". Partner and opponents must be exactly viewerPartner and viewerOpponents. The lesson may only use facts already said in bidding and keys.
Rewrite any sentence that is wrong, unsupported, vague or ungrammatical so that it is true to the facts and correct ${language(lang)}; keep the lively tone and the length.
The lesson must stay a general Skat strategy plus one example from this deal (at most 22 words) — keep that shape; only correct it.${lang === 'de' ? ' Check every verb after "du" (du passt / du hast gepasst, du übernimmst, du spielst aus).' : ''} ${WORDS(lang)}
Return the same JSON shape: {"bidding": string, "keys": [{"trick": number, "text": string}], "lesson": string}.`

type Breakdown = { bidding: string; keys: { trick: number; text: string }[]; lesson: string }
function usable(r: Record<string, unknown> | null, tricks: number): Breakdown | null {
  const keys = Array.isArray(r?.keys) ? (r!.keys as { trick: unknown; text: unknown }[]) : []
  const ok = typeof r?.bidding === 'string' && typeof r?.lesson === 'string' && keys.length >= 2 && keys.length <= 3 &&
    keys.every((k) => Number.isInteger(k.trick) && (k.trick as number) >= 1 && (k.trick as number) <= tricks && typeof k.text === 'string')
  return ok ? { bidding: r!.bidding as string, keys: keys.map((k) => ({ trick: k.trick as number, text: k.text as string })).sort((a, b) => a.trick - b.trick), lesson: r!.lesson as string } : null
}

/** The breakdown: written from the facts, then checked against them. */
async function breakdown(f: ReturnType<typeof facts>): Promise<Breakdown> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const draft = usable(await model(WRITE(L), JSON.stringify(f)), f.tricks.length)
    if (!draft) continue
    const checked = usable(await model(CHECK(L), JSON.stringify({ facts: f, script: draft }), 'high'), f.tricks.length)
    if (checked) return checked
  }
  throw new Error('the model gave no usable breakdown')
}

/** The takeaway written by rule when the deal shows a lesson the engine can name for sure: a defender smearing full
 *  Augen onto a trick their partner already wins. The model's own takeaway is kept otherwise. */
function ruleLesson(spec: Spec, g: Game): string | null {
  const s = spec.benchmark.summary
  const contract = s.declaration?.contract
  if (!contract || s.declarer === null) return null
  for (const t of g.tricks) {
    for (let j = 1; j < t.cards.length; j++) {
      const p = t.cards[j]
      const before = t.cards.slice(0, j)
      const winning = before[trickWinnerIndex(before.map((b) => b.card), contract)]
      const followed = effectiveSuit(p.card, contract) === effectiveSuit(t.cards[0].card, contract)
      const smear = !followed && !isTrump(p.card, contract) && p.seat !== s.declarer && winning.seat !== s.declarer && POINTS[p.card.rank] >= 10 && t.winner === winning.seat
      if (!smear) continue
      const by = who(p.seat, spec.dealer)
      if (de()) {
        const article = p.card.rank === '10' || p.card.rank === 'Q' ? 'der' : 'dem'
        return `Gewinnt dein Partner den Stich sicher, schmier ihm volle Augen – wie ${by === 'du' ? 'du' : by} hier mit ${article} ${cardName(p.card)}.`
      }
      return `When your partner is sure to win the trick, smear full Augen onto it – as ${by} did here with the ${cardName(p.card)}.`
    }
  }
  return null
}

async function yesterdayPart(spec: Spec, day: string) {
  const s = spec.benchmark.summary
  const g = replay(spec)
  const start = deal(spec.dealer, spec.deck)
  const decl = s.declaration
  const declarer = s.declarer
  const f = facts(spec, g)
  const b = await breakdown(f)
  b.lesson = ruleLesson(spec, g) ?? b.lesson
  const place = role(0, spec.dealer)
  const lines: Segment[] = [
    { id: 'intro', part: 'answer', scene: 'intro', text: de() ? `Hey, Skat-Fans! Der Deal des Tages vom ${dateName(day)}.` : `Hey, Skat fans! The deal of the day from ${dateName(day)}.` },
    {
      id: 'hand', part: 'answer', scene: 'hand', pause: true,
      text: de() ? `Du sitzt in ${place}. Wie würdest du dieses Blatt spielen? Halt das Video an und überleg kurz!` : `You sit in ${place}. How would you play this hand? Pause the video and think for a second!`,
    },
    { id: 'bidding', part: 'answer', scene: 'auction', text: b.bidding },
    ...b.keys.map((k, i): Segment => ({ id: `key${i + 1}`, part: 'answer', scene: 'key', trick: k.trick, text: k.text })),
  ]
  const d = s.detail
  if (d && declarer !== null) {
    const them = role(declarer, spec.dealer)
    const result = de()
      ? declarer === 0
        ? s.won ? `Am Ende: ${d.declarerPoints} Augen – gewonnen!` : `Am Ende: ${d.declarerPoints} Augen – knapp verloren.`
        : s.won ? `Am Ende holt ${them} ${d.declarerPoints} Augen.` : `Am Ende bleibt ${them} bei ${d.declarerPoints} Augen – die Verteidigung gewinnt!`
      : declarer === 0
        ? s.won ? `In the end: ${d.declarerPoints} card points – won!` : `In the end: ${d.declarerPoints} card points – just short.`
        : s.won ? `In the end ${them} takes ${d.declarerPoints} card points.` : `In the end ${them} stops at ${d.declarerPoints} card points – the defence wins!`
    lines.push({ id: 'result', part: 'answer', scene: 'result', text: result })
  }
  lines.push({ id: 'lesson', part: 'answer', scene: 'lesson', text: b.lesson })
  return {
    kind: 'answer' as const,
    lang: L,
    day,
    date: dateName(day),
    role: place,
    hand: sortHand(start.hands[0], decl?.contract ?? null),
    discard: f.discard.length ? discardOf(spec) : [],
    declarer: declarer === null ? null : who(declarer, spec.dealer),
    mine: declarer === 0,
    contract: decl ? contractName(decl as Declaration) : null,
    bid: s.bid,
    won: s.won,
    points: d ? { declarer: d.declarerPoints, defenders: d.defenderPoints, value: d.value } : null,
    lesson: b.lesson,
    tricks: g.tricks.map((t) => ({ winner: t.winner, cards: t.cards.map((p) => ({ who: capital(who(p.seat, spec.dealer)), seat: p.seat, card: p.card })) })),
    segments: lines,
  }
}

function todayPart(spec: Spec, day: string) {
  const g = deal(spec.dealer, spec.deck)
  const hand = sortHand(g.hands[0], null)
  const q = question(spec, day)
  const place = role(0, spec.dealer)
  const segments: Segment[] = [
    { id: 'turn', part: 'quiz', scene: 'turn', text: de() ? 'Und jetzt deine Challenge: der Deal von heute!' : "And now your challenge: today's deal!" },
    { id: 'hand', part: 'quiz', scene: 'hand', text: `${de() ? `Du sitzt in ${place}.` : `You sit in ${place}.`} ${handWords(hand)}` },
    { id: 'question', part: 'quiz', scene: 'question', text: q.text },
    {
      id: 'cta', part: 'quiz', scene: 'cta',
      text: de() ? 'Spiel ihn jetzt auf skatgo.com! Folg uns – morgen gibt es die Analyse.' : 'Play it now on skatgo.com! Follow us – the breakdown comes tomorrow.',
    },
  ]
  return { kind: 'quiz' as const, lang: L, day, date: dateName(day), role: place, hand, question: q, segments }
}

const [todayFile, yesterdayFile, lang, out] = process.argv.slice(2)
L = lang === 'en' ? 'en' : 'de'
const read = (f: string) => JSON.parse(readFileSync(f, 'utf8')) as { day: string; spec: Spec }
const today = read(todayFile)
const yesterday = read(yesterdayFile)
const a = await yesterdayPart(yesterday.spec, yesterday.day)
const q = todayPart(today.spec, today.day)
const segments = [...a.segments, ...q.segments].map((x) => ({ ...x, id: `${x.part}-${x.id}` }))
writeFileSync(out, JSON.stringify({ lang: L, day: today.day, today: q, yesterday: a, segments }, null, 2))
