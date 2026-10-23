import { createHash, randomInt } from 'node:crypto'
import express from 'express'
import type pg from 'pg'
import { z } from 'zod'
import { type Card, shuffle } from '../../app/src/lib/skat/cards'
import { chooseDeclaration, declarationAdvice } from '../../app/src/lib/skat/ai'
import { actor, aiBid, deal, next, pickUpSkat, roleOf, type Game, type Move, type Seat } from '../../app/src/lib/skat/game'
import {
  BOARD_DAYS, DAILY_DEALS, DAILY_TIME_ZONE, PLAYER, auctionOf, seatView, summarize, totals, type DailyStatus,
  type DealReview, type DealSummary,
  type SeatView,
} from '../../app/src/lib/skat/tournament'
import { cleanNickname, pickName } from '../../app/src/lib/skat/nickname'
import { ELO_KI, ELO_PROVISIONAL_DAYS, type EloBoard, type EloDay, eloRatings } from '../../app/src/lib/skat/elo'
import { actionSchema, applySeatMove, computerMove, refuseUnlawful, Rejected, secretEquals, secureDeck } from './model'
import { type Policy, SKATZERO_COMMIT, viewOf } from './skatzero/policy'
import { type SeatBidding, SKAT_PAIRS, seatBidding, skatOrHand } from './skatzero/bidding'
import { ComputerFailed, type Logged, POSITION, type SeatPlan, advance, decide, judgePlays, playsOf, raw, replayLog, reviewOf, skatzeroTurn } from './computers'
import type { Store } from './store'

// The daily tournament (SKATGO-35). Every day has one tournament of six deals, the same for every player, each
// played by one human in seat 0 against the two computers, and its board. Rows are keyed by their day and size:
// the twelve-deal tournament of SKATGO-77 is gone (SKATGO-119), its stored rows kept, so every query names the six
// deals (`DAILY_DEALS`). The server owns the cards: a deal is its deck and
// dealer plus the human's moves, replayed through the engine, and the score is what that replay
// settles — never a number a browser sends. Only seat 0's view of the current deal leaves here.
//
// These routes are not public: the web service calls them with the admission key and names the player
// (`user:<Clerk id>` or `anon:<hash of a device cookie>`); the browser only ever talks to the web.
//
// Which computers a day is played against is fixed when the day is dealt (`daily_deals.computer`,
// SKATGO-38). Days dealt with the old heuristics (`heuristic`) store only the human's moves and replay
// the deterministic computers, exactly as before. Days dealt since SkatZero plays the cards store every
// move of the deal — the human's and the computers' — and replay them as recorded: a computer is asked
// once, when it is its turn, and never again for the same move.
//
// Days dealt since SKATGO-39 (`skatzero@…`) are SkatZero from the auction on. Their bidding needs a
// simulation of every possible skat (≈ 1 s per computer per deal), so it is not done in a request:
// the leader deals today and tomorrow ahead (prepareDays), works out both computers' bidding for every
// deal, and stores it with the deal. In play, the auction and the pick-up/Hand choice are lookups;
// only the discard and the game after a pick-up are computed then (a handful of model runs).

/** A computer's bidding as worked out when its day was dealt (SKATGO-39). */
type StoredBidding = Pick<SeatBidding, 'maxBid' | 'pickup' | 'hand'>
/** The deal played by SkatZero in all three seats — a computer in the player's seat against the same
 *  two computers — as worked out when its day was dealt (SKATGO-42): its summary, shown to a player
 *  once they have finished that deal, and its moves, kept for a later review. */
type Benchmark = { summary: DealSummary; log: Logged[] }
type DealSpec = { dealer: Seat; deck: Card[]; computers?: Record<'1' | '2', StoredBidding>; benchmark?: Benchmark }
type Entry = { actions: (Move | Logged)[][]; deals: DealSummary[]; total: number; finished_at: string | null }
type Day = { deals: DealSpec[]; computer: string }

/** The old computers: the heuristics, bidding and play. */
export const HEURISTIC = 'heuristic'
/** SKATGO-38's computers: SkatZero's card play, the heuristics' bidding, Hand/pickup, discard and
 *  declaration — a declared hybrid. Days dealt with it keep it. */
export const HYBRID = `skatzero-play@${SKATZERO_COMMIT.slice(0, 7)}+heuristic-bid`
/** Today's computers (SKATGO-39): SkatZero from the auction to the last card. */
export const COMPUTER = `skatzero@${SKATZERO_COMMIT.slice(0, 7)}`

/** The day is dealt but its computers' bidding is still being worked out. */
export class DayPreparing extends Error {}

/** The tournament day of a moment: its date in Berlin, as YYYY-MM-DD. */
export function dayOf(now: number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: DAILY_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

/** A tournament's deals: fresh crypto-shuffled decks; the first dealer is random, then the deal passes
 *  clockwise, so the player sits in each position equally often (twice in six deals). */
export function dealDay(): DealSpec[] {
  let dealer = randomInt(3) as Seat
  return Array.from({ length: DAILY_DEALS }, () => {
    const spec = { dealer, deck: secureDeck() }
    dealer = next(dealer)
    return spec
  })
}

const ended = (g: Game) => g.phase === 'done' || g.phase === 'passedIn'

/** Let the computers move until it is the player's turn or the deal is over; `steps` collects each
 *  state they leave behind, for the table to show in order. */
function untilPlayer(g: Game, steps?: Game[]): Game {
  while (g.phase === 'trickEnd' || (actor(g) !== null && actor(g) !== PLAYER)) {
    const moved = computerMove(g)
    if (moved === g) break
    g = moved
    steps?.push(g)
  }
  return g
}

/** A deal on a heuristic day, as it stands after the player's recorded moves. */
export function replay(spec: DealSpec, moves: Move[]): Game {
  let g = untilPlayer(deal(spec.dealer, spec.deck))
  for (const move of moves) g = untilPlayer(applySeatMove(g, PLAYER, move))
  return g
}

/** The next decision of the computer whose turn it is, as the moves the engine knows. On a hybrid day
 *  the skat step of a computer declarer is three moves — pick up, put two away, declare — as the
 *  heuristics choose them; on a SkatZero day the auction and the skat step are SkatZero's. */
async function computerTurn(g: Game, policy: Policy, spec: DealSpec, computer: string): Promise<Logged[]> {
  const seat = actor(g)!
  if (computer === COMPUTER && g.phase !== 'play') {
    const stored = spec.computers?.[String(seat) as '1' | '2']
    if (!stored) throw new ComputerFailed('bidding_not_prepared')
    return skatzeroTurn(g, seat, { maxBid: stored.maxBid, skatOrHand: (bid) => skatOrHand(stored, bid) }, policy)
  }
  if (g.phase === 'bidding') return [{ seat, move: { type: 'bid', value: aiBid(g) } }]
  if (g.phase === 'skat') {
    const picked = pickUpSkat(g)
    const plan = chooseDeclaration(picked.hands[seat], g.bid)
    return [{ seat, move: { type: 'pickup' } }, { seat, move: { type: 'discard', cards: plan.discard } }, { seat, move: { type: 'declare', declaration: plan.declaration } }]
  }
  if (g.phase === 'declare') {
    const hand = g.hands[seat]
    const known = g.pickedUp ? [...hand, ...g.skat] : hand
    return [{ seat, move: { type: 'declare', declaration: declarationAdvice(hand, known, g.bid, !g.pickedUp).declaration } }]
  }
  return [{ seat, move: { type: 'play', card: await decide(policy.choose(viewOf(g, seat))) } }]
}

const player = z.string().regex(/^(user:[A-Za-z0-9_]{1,64}|anon:[a-f0-9]{64})$/)
const stateInput = z.object({ player, open: z.boolean().optional() }).strict()
const actInput = z.object({
  player,
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  deal: z.number().int().min(0).max(DAILY_DEALS - 1),
  revision: z.number().int().nonnegative(),
  action: actionSchema,
}).strict()
const nameInput = z.object({ player, nickname: z.string().max(200) }).strict()
// The board's day: how many days back, today 0 (SKATGO-80); `today` and `yesterday` are how pages before it ask.
const boardInput = z.object({
  player: player.nullable(), day: z.union([z.enum(['today', 'yesterday']), z.number().int().min(0).max(BOARD_DAYS - 1)]),
}).strict()
const reviewInput = z.object({ player, deal: z.number().int().min(0).max(DAILY_DEALS - 1) }).strict()
const claimInput = z.object({ from: z.string().regex(/^anon:[a-f0-9]{64}$/), to: z.string().regex(/^user:/).pipe(player) }).strict()
// The Elo board is everyone's: it asks as nobody.
const eloInput = z.object({ player: z.null() }).strict()

/** Where the player stands. The computer's result of a deal goes with the player's own, only once the
 *  player has finished that deal (SKATGO-42); days dealt before it have none. Each finished deal's
 *  auction, the player's and the computer's, is replayed from the recorded moves (SKATGO-57): nothing
 *  more is stored, and the engine gives the same auction every time. */
function status(day: string, e: Entry | null, specs: DealSpec[], computer: string): DailyStatus {
  const deals = e?.deals ?? []
  const benchmarks = deals.map((_, i) => specs[i]?.benchmark?.summary ?? null)
  const auctions = deals.map((_, i) =>
    auctionOf(computer === HEURISTIC
      ? replay(specs[i], (e!.actions[i] ?? []) as Move[])
      : replayLog(specs[i].dealer, specs[i].deck, (e!.actions[i] ?? []) as Logged[])))
  const benchmarkAuctions = deals.map((_, i) => {
    const b = specs[i]?.benchmark
    return b ? auctionOf(replayLog(specs[i].dealer, specs[i].deck, b.log)) : null
  })
  return { day, of: DAILY_DEALS, deal: deals.length, deals, totals: totals(deals), started: !!e, finished: !!e?.finished_at, benchmarks, auctions, benchmarkAuctions }
}

/** A tournament's deals that day. Requests never deal: a day is dealt ahead by prepareDays; one that is
 *  not there yet is being prepared, and the request says so. */
async function dayOfDeals(c: pg.PoolClient, day: string): Promise<Day> {
  const { rows } = await c.query('SELECT deals, computer FROM daily_deals WHERE day = $1 AND size = $2', [day, DAILY_DEALS])
  if (!rows[0]) throw new DayPreparing(day)
  return rows[0]
}

/** The order a computer tries the 231 possible skats in: fixed by the deal, the same every time. */
export function skatOrder(day: string, deal: number, seat: Seat): [number, number][] {
  const h = createHash('sha256').update(`skatgo-daily|${day}|${deal}|${seat}`).digest()
  let a = h.readUInt32LE(0)
  // mulberry32
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return shuffle(SKAT_PAIRS, rand)
}

/** How long one tournament's preparation may take before it is abandoned for a later retry (grill Q5): an
 *  hour (SKATGO-77, the human: 「上限设置为1小时即可，别画地为牢」). Only one preparation runs at a time. */
const PREPARE_MS = 60 * 60 * 1000

/** Deal `day`'s tournament and work out both computers' bidding for it, unless it is already dealt. Runs in the leader; yields between steps, so the service keeps answering while it works. */
export async function prepareDay(store: Store, policy: Policy, day: string, now = Date.now): Promise<'dealt' | 'present'> {
  const { rows } = await store.pool.query('SELECT 1 FROM daily_deals WHERE day = $1 AND size = $2', [day, DAILY_DEALS])
  if (rows[0]) return 'present'
  const started = now()
  const specs: DealSpec[] = dealDay()
  for (const [i, spec] of specs.entries()) {
    const g = deal(spec.dealer, spec.deck)
    const computers = {} as Record<'1' | '2', StoredBidding>
    for (const seat of [1, 2] as Seat[]) {
      const r = await seatBidding(policy, g.hands[seat].map(raw), POSITION[roleOf(seat, spec.dealer)], skatOrder(day, i, seat))
      computers[String(seat) as '1' | '2'] = { maxBid: r.maxBid, pickup: r.pickup, hand: r.hand }
      if (now() - started > PREPARE_MS) throw new Error('daily_prepare_timeout')
    }
    spec.computers = computers
    spec.benchmark = await benchmark(policy, spec, day, i)
    if (now() - started > PREPARE_MS) throw new Error('daily_prepare_timeout')
  }
  await store.transaction(async (c) => {
    await c.query('INSERT INTO daily_deals (day, size, deals, computer) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING', [day, DAILY_DEALS, JSON.stringify(specs), COMPUTER])
  })
  return 'dealt'
}

/** A deal played out by SkatZero in all three seats (SKATGO-42): the player's seat gets its own
 *  bidding, worked out like the computers' (its skats tried in the deal's fixed order for seat 0);
 *  the other two play from their prepared plans, exactly as they do against the player. */
async function benchmark(policy: Policy, spec: DealSpec, day: string, i: number): Promise<Benchmark> {
  const start = deal(spec.dealer, spec.deck)
  const own = await seatBidding(policy, start.hands[PLAYER].map(raw), POSITION[roleOf(PLAYER, spec.dealer)], skatOrder(day, i, PLAYER))
  const plan = (b: StoredBidding): SeatPlan => ({ maxBid: b.maxBid, skatOrHand: (bid) => skatOrHand(b, bid) })
  const plans: Record<Seat, SeatPlan> = { 0: plan(own), 1: plan(spec.computers!['1']), 2: plan(spec.computers!['2']) }
  const log: Logged[] = []
  const end = await advance(start, log, async (g) => {
    const seat = actor(g)!
    if (g.phase !== 'play') return skatzeroTurn(g, seat, plans[seat], policy)
    return [{ seat, move: { type: 'play', card: await decide(policy.choose(viewOf(g, seat))) } }]
  }, undefined, true)
  if (!ended(end)) throw new ComputerFailed('benchmark_unfinished')
  return { summary: summarize(end), log }
}

/** Today and tomorrow dealt ahead — one preparation at a time, today's first. */
let preparing: Promise<void> | null = null
export function prepareDays(store: Store, policy: Policy, now = Date.now): Promise<void> {
  preparing ??= (async () => {
    try {
      for (const offset of [0, 1]) {
        const day = dayOf(now() + offset * 24 * 60 * 60 * 1000)
        const t = Date.now()
        const r = await prepareDay(store, policy, day, now)
        if (r === 'dealt') console.log(JSON.stringify({ event: 'daily_prepared', day, size: DAILY_DEALS, ms: Date.now() - t, rss: process.memoryUsage().rss }))
      }
    } catch (e) {
      console.error(JSON.stringify({ event: 'daily_prepare_failed', reason: e instanceof Error ? e.message : String(e) }))
    } finally {
      preparing = null
    }
  })()
  return preparing
}

async function entryOf(c: pg.PoolClient, day: string, who: string): Promise<Entry | null> {
  const { rows } = await c.query(
    'SELECT actions, deals, total, finished_at FROM daily_entries WHERE day = $1 AND size = $2 AND player = $3 FOR UPDATE', [day, DAILY_DEALS, who])
  return rows[0] ?? null
}

async function save(c: pg.PoolClient, day: string, who: string, e: Entry) {
  await c.query(
    'UPDATE daily_entries SET actions = $4, deals = $5, total = $6, finished_at = $7 WHERE day = $1 AND size = $2 AND player = $3',
    [day, DAILY_DEALS, who, JSON.stringify(e.actions), JSON.stringify(e.deals), e.total, e.finished_at])
}

/** Record every deal that is over, so the entry always points at a deal still to be played. */
function settleEnded(specs: DealSpec[], e: Entry, now: number): Game | null {
  while (e.deals.length < specs.length) {
    const i = e.deals.length
    const g = replay(specs[i], (e.actions[i] ?? []) as Move[])
    if (!ended(g)) return g
    e.deals.push(summarize(g))
    e.total = totals(e.deals)[PLAYER]
    if (e.deals.length < specs.length) e.actions.push([])
  }
  e.finished_at ??= String(now)
  return null
}

/** The same on a recorded day: a deal the computers open (they bid before the player) is played up to
 *  the player's turn, and those moves are recorded. */
async function settleRecorded(specs: DealSpec[], e: Entry, now: number, policy: Policy, computer: string): Promise<Game | null> {
  while (e.deals.length < specs.length) {
    const i = e.deals.length
    const log = (e.actions[i] ??= []) as Logged[]
    let g = replayLog(specs[i].dealer, specs[i].deck, log)
    if (!ended(g) && actor(g) !== PLAYER) g = await advance(g, log, (x) => computerTurn(x, policy, specs[i], computer))
    if (!ended(g)) return g
    e.deals.push(summarize(g))
    e.total = totals(e.deals)[PLAYER]
    if (e.deals.length < specs.length) e.actions.push([])
  }
  e.finished_at ??= String(now)
  return null
}

export async function dailyState(store: Store, policy: Policy, who: string, open: boolean, now = Date.now()) {
  const day = dayOf(now)
  return store.transaction(async c => {
    const { deals: specs, computer } = await dayOfDeals(c, day)
    let e = await entryOf(c, day, who)
    if (!e && !open) return { status: status(day, null, specs, computer), view: null, revision: 0 }
    if (!e) {
      await c.query('INSERT INTO daily_entries (day, size, player, actions, deals, total, created_at) VALUES ($1, $2, $3, $4, $5, 0, $6)',
        [day, DAILY_DEALS, who, JSON.stringify([[]]), '[]', now])
      e = { actions: [[]], deals: [], total: 0, finished_at: null }
    }
    if (e.finished_at || !open) return { status: status(day, e, specs, computer), view: null, revision: 0 }
    const before = JSON.stringify(e)
    const g = computer === HEURISTIC ? settleEnded(specs, e, now) : await settleRecorded(specs, e, now, policy, computer)
    if (JSON.stringify(e) !== before) await save(c, day, who, e)
    if (e.finished_at) await nameFinished(c, day, DAILY_DEALS, who, now)
    return { status: status(day, e, specs, computer), view: g ? seatView(g) : null, revision: g ? e.actions[e.deals.length].length : 0 }
  })
}

export async function dailyAct(store: Store, policy: Policy, input: z.infer<typeof actInput>, now = Date.now()) {
  if (input.action.type === 'start') throw new Rejected('illegal_action')
  const move = input.action as Move
  const day = dayOf(now)
  if (input.day !== day) throw new Rejected('day_over')
  return store.transaction(async c => {
    const { deals: specs, computer } = await dayOfDeals(c, day)
    const e = await entryOf(c, day, input.player)
    if (!e) throw new Rejected('not_started')
    if (e.finished_at) throw new Rejected('day_finished')
    if (input.deal !== e.deals.length) throw new Rejected('wrong_deal')
    const moves = e.actions[input.deal]
    if (input.revision !== moves.length) throw new Rejected('stale_revision')
    const steps: Game[] = []
    let current: Game | null
    if (computer === HEURISTIC) {
      const at = replay(specs[input.deal], moves as Move[])
      refuseUnlawful(at, move)
      const g = applySeatMove(at, PLAYER, move)
      steps.push(g)
      untilPlayer(g, steps)
      moves.push(move)
      current = settleEnded(specs, e, now)
    } else {
      const log = moves as Logged[]
      let g = replayLog(specs[input.deal].dealer, specs[input.deal].deck, log)
      if (actor(g) !== PLAYER) throw new Rejected('not_your_turn')
      refuseUnlawful(g, move)
      g = applySeatMove(g, PLAYER, move)
      log.push({ seat: PLAYER, move })
      steps.push(g)
      await advance(g, log, (x) => computerTurn(x, policy, specs[input.deal], computer), steps)
      current = await settleRecorded(specs, e, now, policy, computer)
    }
    await save(c, day, input.player, e)
    if (e.finished_at) await nameFinished(c, day, DAILY_DEALS, input.player, now)
    return {
      status: status(day, e, specs, computer),
      steps: steps.map(seatView) as SeatView[],
      revision: current ? e.actions[e.deals.length].length : 0,
    }
  })
}

/** A player who signs in takes today's anonymous entries from this device into the account, each
 *  tournament's unless the account already has one in it today. Past days never move (SKATGO-35, grill
 *  Q7; SKATGO-77). An account without a name of its own takes the device's (SKATGO-90). */
export async function dailyClaim(store: Store, from: string, to: string, now = Date.now()) {
  const day = dayOf(now)
  return store.transaction(async c => {
    const r = await c.query(
      `UPDATE daily_entries e SET player = $3 WHERE e.day = $1 AND e.player = $2
         AND NOT EXISTS (SELECT 1 FROM daily_entries x WHERE x.day = $1 AND x.size = e.size AND x.player = $3)`, [day, from, to])
    await c.query(
      'UPDATE daily_players SET player = $2 WHERE player = $1 AND NOT EXISTS (SELECT 1 FROM daily_players WHERE player = $2)', [from, to])
    return { claimed: (r.rowCount ?? 0) > 0 }
  })
}

/** The day before a tournament day, as YYYY-MM-DD. */
export function dayBefore(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10)
}

/** One at a time gives names out or changes them, so no two players come to hold the same (SKATGO-90). */
const NAME_LOCK = 7392030

/**
 * A player's current name (SKATGO-90): the one they set or were given, or — the first time they need one —
 * a name of two words given now: the first in the player's own order that nobody holds and no board shows,
 * a number only once every name without one is taken. The forum's authors stand under it too (SKATGO-118).
 */
export async function nameOf(c: pg.PoolClient, who: string, now: number): Promise<string> {
  const held = async () => (await c.query('SELECT nickname FROM daily_players WHERE player = $1', [who])).rows[0]?.nickname as string | undefined
  const known = await held()
  if (known) return known
  await c.query('SELECT pg_advisory_xact_lock($1)', [NAME_LOCK])
  const meanwhile = await held()
  if (meanwhile) return meanwhile
  const { rows } = await c.query(
    'SELECT lower(nickname) AS n FROM daily_players UNION SELECT lower(nickname) FROM daily_entries WHERE nickname IS NOT NULL')
  const taken = new Set(rows.map((r) => r.n as string))
  const name = pickName(who, (n) => taken.has(n.toLowerCase()))
  await c.query('INSERT INTO daily_players (player, nickname, created_at) VALUES ($1, $2, $3)', [who, name, now])
  return name
}

/** A finished entry goes on its board under the player's current name (SKATGO-90: no name to fill in). A
 *  name an entry already has is never changed — the human's red line: 「禁止改变任何已经有的用户的名字」. */
async function nameFinished(c: pg.PoolClient, day: string, size: number, who: string, now: number) {
  await c.query(
    'UPDATE daily_entries SET nickname = $4 WHERE day = $1 AND size = $2 AND player = $3 AND finished_at IS NOT NULL AND nickname IS NULL',
    [day, size, who, await nameOf(c, who, now)])
}

/** Entries finished before SKATGO-90 without a name go on their boards too (grill Q3): each under its
 *  player's current name, given now when they have none. Runs in the leader at start; names already there
 *  stay as they are. */
export async function nameUnnamed(store: Store, now = Date.now()) {
  const { rows } = await store.pool.query(
    'SELECT day, size, player FROM daily_entries WHERE finished_at IS NOT NULL AND nickname IS NULL ORDER BY day, finished_at')
  for (const r of rows) await store.transaction((c) => nameFinished(c, r.day, r.size, r.player, now))
  if (rows.length) console.log(JSON.stringify({ event: 'daily_named', entries: rows.length }))
}

/** A player changes their name (SKATGO-90): from now on, and on today's finished entries — never an
 *  earlier day's (the red line). A refused name is refused without saying why; a name another player
 *  holds is taken, whatever its case. */
export async function dailyName(store: Store, who: string, raw: string, now = Date.now()) {
  const nickname = cleanNickname(raw)
  if (!nickname) throw new Rejected('nickname_refused')
  const day = dayOf(now)
  return store.transaction(async c => {
    const { rows: done } = await c.query('SELECT 1 FROM daily_entries WHERE player = $1 AND finished_at IS NOT NULL LIMIT 1', [who])
    if (!done[0]) throw new Rejected('not_finished')
    await c.query('SELECT pg_advisory_xact_lock($1)', [NAME_LOCK])
    const { rows: clash } = await c.query('SELECT 1 FROM daily_players WHERE lower(nickname) = lower($1) AND player <> $2', [nickname, who])
    if (clash[0]) throw new Rejected('nickname_taken')
    await c.query(
      'INSERT INTO daily_players (player, nickname, created_at) VALUES ($1, $2, $3) ON CONFLICT (player) DO UPDATE SET nickname = EXCLUDED.nickname',
      [who, nickname, now])
    await c.query('UPDATE daily_entries SET nickname = $3 WHERE day = $1 AND player = $2 AND finished_at IS NOT NULL', [day, who, nickname])
    return { nickname }
  })
}

/** How many rows the board shows; a player below them gets their own row apart. */
const BOARD_ROWS = 100

/**
 * The tournament's leaderboard for a day (SKATGO-36; today or one of the six
 * days before, SKATGO-80): the finished entries — each on it under its name, given when it finished
 * (SKATGO-90) — by their Seeger-Fabian total, the standard German players know (SKATGO-81, the
 * human: 「按他们习惯的标准来」; SKATGO-79's Saldo is gone); equal totals share a rank
 * and the next rank skips (1, 1, 3), the earlier finish listed first. Only nicknames and totals leave here —
 * never a player id. For the asking player: their own standing and name. `ai` (SKATGO-80): the
 * AI's total over the tournament — its play from the player's seat, worked out when the day was dealt, the
 * same for every player — shown to everyone, its total only (the human: 「都显示，只在leader board上显示
 * 总成绩即可」); null when a deal of that day has none.
 */
export async function dailyBoard(store: Store, who: string | null, which: 'today' | 'yesterday' | number, now = Date.now()) {
  const back = which === 'today' ? 0 : which === 'yesterday' ? 1 : which
  let day = dayOf(now)
  for (let i = 0; i < back; i++) day = dayBefore(day)
  const { rows: found } = await store.pool.query(
    `SELECT player, nickname, total, finished_at FROM daily_entries
      WHERE day = $1 AND size = $2 AND finished_at IS NOT NULL AND nickname IS NOT NULL`, [day, DAILY_DEALS])
  const rows = found.sort((a, b) => b.total - a.total || Number(a.finished_at) - Number(b.finished_at))
  const ranked = rows.map((r, i) => ({
    rank: i === 0 || rows[i - 1].total !== r.total ? i + 1 : 0,
    nickname: r.nickname as string, total: r.total as number, me: r.player === who,
  }))
  for (let i = 1; i < ranked.length; i++) if (ranked[i].rank === 0) ranked[i].rank = ranked[i - 1].rank
  const mine = ranked.findIndex(r => r.me)
  const own = mine >= BOARD_ROWS ? ranked[mine] : null
  let me = null
  if (who) {
    const own = await store.pool.query(
      'SELECT nickname, total, finished_at FROM daily_entries WHERE day = $1 AND size = $2 AND player = $3', [day, DAILY_DEALS, who])
    const e = own.rows[0]
    if (e) {
      const rank = 1 + ranked.filter(r => r.total > e.total).length
      me = { finished: !!e.finished_at, total: e.total as number, nickname: e.nickname as string | null, rank: e.finished_at ? rank : null }
    }
  }
  const { rows: dealt } = await store.pool.query('SELECT deals FROM daily_deals WHERE day = $1 AND size = $2', [day, DAILY_DEALS])
  const played = ((dealt[0]?.deals ?? []) as DealSpec[]).map((spec) => spec.benchmark?.summary)
  const ai = played.length > 0 && played.every((b) => b) ? { total: totals(played as DealSummary[])[PLAYER] } : null
  return { day, rows: ranked.slice(0, BOARD_ROWS), own, total: ranked.length, me, ai }
}

/** How many players the Elo board names (SKATGO-123). */
const ELO_ROWS = 10

/**
 * The tournament's Elo (SKATGO-123): every ended day replayed from the first with the shared rule
 * (`lib/skat/elo.ts`) — each finished entry's total against that day's others and the AI's from the player's
 * seat, the same total the daily board shows. Today counts once it has ended, its field complete. Ids that
 * `player_aliases` names as one person count as that person, under the name they hold now; of their two
 * entries on one day, the earlier finish. Only names leave here, as on the daily board.
 */
export async function dailyElo(store: Store, now = Date.now()): Promise<EloBoard> {
  const today = dayOf(now)
  const { rows: entries } = await store.pool.query(
    `SELECT e.day, coalesce(a.same_as, e.player) AS player, e.total FROM daily_entries e
       LEFT JOIN player_aliases a ON a.player = e.player
      WHERE e.size = $1 AND e.finished_at IS NOT NULL AND e.day < $2
      ORDER BY e.day, e.finished_at`, [DAILY_DEALS, today])
  const { rows: dealt } = await store.pool.query('SELECT day, deals FROM daily_deals WHERE size = $1 AND day < $2', [DAILY_DEALS, today])
  const ki = new Map<string, number | null>(dealt.map((d) => {
    const played = (d.deals as DealSpec[]).map((spec) => spec.benchmark?.summary)
    return [d.day as string, played.length > 0 && played.every((b) => b) ? totals(played as DealSummary[])[PLAYER] : null]
  }))
  const days: (EloDay & { day: string })[] = []
  for (const e of entries) {
    if (days.at(-1)?.day !== e.day) days.push({ day: e.day, ki: ki.get(e.day) ?? null, totals: [] })
    const day = days.at(-1)!
    if (!day.totals.some((t) => t.player === e.player)) day.totals.push({ player: e.player, total: e.total })
  }
  const standing = [...eloRatings(days)].map(([player, s]) => ({ player, elo: Math.round(s.elo), days: s.days }))
    .sort((a, b) => b.elo - a.elo)
  const top = standing.slice(0, ELO_ROWS)
  const { rows: named } = await store.pool.query(
    `SELECT p AS player, coalesce((SELECT nickname FROM daily_players WHERE player = p),
       (SELECT nickname FROM daily_entries WHERE player = p AND nickname IS NOT NULL ORDER BY day DESC LIMIT 1)) AS nickname
       FROM unnest($1::text[]) AS p`, [top.map((s) => s.player)])
  const nameOfPlayer = new Map(named.map((r) => [r.player as string, (r.nickname as string | null) ?? '']))
  const rows = top.map((s, i) => ({
    rank: i === 0 || top[i - 1].elo !== s.elo ? i + 1 : 0,
    nickname: nameOfPlayer.get(s.player) ?? '', elo: s.elo, provisional: s.days < ELO_PROVISIONAL_DAYS,
  }))
  for (let i = 1; i < rows.length; i++) if (rows[i].rank === 0) rows[i].rank = rows[i - 1].rank
  return { rows, total: standing.length, ki: ELO_KI }
}

/**
 * The review of one deal the player has finished (SKATGO-79): the deal replayed from their recorded moves,
 * and at each card they played with a choice, every legal card valued by SkatZero as it weighs its own
 * choice; where theirs was not the best, the furthest below it first. Only the player's own hand and the trick as
 * it stood go into it — nothing they could not see — with the deal's result beside the AI's.
 */
export async function dailyReview(store: Store, policy: Policy, who: string, index: number, now = Date.now()): Promise<DealReview> {
  const day = dayOf(now)
  const { rows: dealt } = await store.pool.query('SELECT deals, computer FROM daily_deals WHERE day = $1 AND size = $2', [day, DAILY_DEALS])
  if (!dealt[0]) throw new DayPreparing(day)
  const { rows: entered } = await store.pool.query(
    'SELECT actions, deals FROM daily_entries WHERE day = $1 AND size = $2 AND player = $3', [day, DAILY_DEALS, who])
  const e = entered[0] as Pick<Entry, 'actions' | 'deals'> | undefined
  if (!e || index >= e.deals.length) throw new Rejected('not_finished')
  const spec = (dealt[0].deals as DealSpec[])[index]
  const actions = e.actions[index] ?? []
  // Every card the player played, with the deal as it stood just before.
  let plays: { g: Game; card: Card }[]
  let end: Game
  if (dealt[0].computer === HEURISTIC) {
    plays = []
    end = untilPlayer(deal(spec.dealer, spec.deck))
    for (const move of actions as Move[]) {
      if (move.type === 'play') plays.push({ g: end, card: move.card })
      end = untilPlayer(applySeatMove(end, PLAYER, move))
    }
  } else {
    plays = playsOf(spec.dealer, spec.deck, actions as Logged[])
    end = replayLog(spec.dealer, spec.deck, actions as Logged[])
  }
  const b = spec.benchmark
  return reviewOf(end, await judgePlays(policy, plays), {
    deal: index,
    mine: e.deals[index],
    ai: b?.summary ?? null,
    aiAuction: b ? auctionOf(replayLog(spec.dealer, spec.deck, b.log)) : null,
  })
}

/** The routes, behind the admission key. */
export function dailyRoutes(store: Store, key: string, ready: () => boolean, policy: () => Policy | null) {
  const router = express.Router()
  router.use(express.json({ limit: '16kb' }))
  router.use((req, res, nextHandler) => {
    if (!ready() || !policy()) return void res.status(503).json({ error: 'not_ready' })
    if (!secretEquals(req.get('x-admission-key'), key)) return void res.status(403).json({ error: 'admission_denied' })
    nextHandler()
  })
  const run = (work: (body: unknown) => Promise<unknown>) => async (req: express.Request, res: express.Response) => {
    try {
      res.set('cache-control', 'no-store').json(await work(req.body))
    } catch (e) {
      if (e instanceof z.ZodError) res.status(400).json({ error: 'invalid_request' })
      else if (e instanceof Rejected) res.status(409).json({ error: e.message })
      else if (e instanceof DayPreparing) {
        void prepareDays(store, policy()!)
        res.status(503).json({ error: 'day_preparing' })
      }
      else if (e instanceof ComputerFailed) {
        console.error(JSON.stringify({ event: 'daily_computer_failed', reason: e.message }))
        res.status(503).json({ error: 'computer_unavailable' })
      } else {
        console.error('daily_storage_unavailable')
        res.status(503).json({ error: 'storage_unavailable' })
      }
    }
  }
  router.post('/state', run(async body => {
    const i = stateInput.parse(body)
    return dailyState(store, policy()!, i.player, i.open ?? false)
  }))
  router.post('/act', run(async body => dailyAct(store, policy()!, actInput.parse(body))))
  router.post('/name', run(async body => {
    const i = nameInput.parse(body)
    return dailyName(store, i.player, i.nickname)
  }))
  router.post('/board', run(async body => {
    const i = boardInput.parse(body)
    return dailyBoard(store, i.player, i.day)
  }))
  router.post('/elo', run(async body => {
    eloInput.parse(body)
    return dailyElo(store)
  }))
  router.post('/review', run(async body => {
    const i = reviewInput.parse(body)
    return dailyReview(store, policy()!, i.player, i.deal)
  }))
  router.post('/claim', run(async body => {
    const i = claimInput.parse(body)
    return dailyClaim(store, i.from, i.to)
  }))
  router.use((_err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(400).json({ error: 'invalid_request' })
  })
  return router
}
