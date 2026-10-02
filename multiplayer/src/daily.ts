import { createHash, randomInt } from 'node:crypto'
import express from 'express'
import type pg from 'pg'
import { z } from 'zod'
import type { Card } from '../../app/src/lib/skat/cards'
import { chooseDeclaration, declarationAdvice } from '../../app/src/lib/skat/ai'
import { actor, aiBid, deal, next, pickUpSkat, roleOf, type Game, type Move, type Seat } from '../../app/src/lib/skat/game'
import { shuffle } from '../../app/src/lib/skat/cards'
import {
  DAILY_DEALS, DAILY_TIME_ZONE, PLAYER, seatView, summarize, totals, type DailyStatus, type DealSummary, type SeatView,
} from '../../app/src/lib/skat/tournament'
import { cleanNickname } from '../../app/src/lib/skat/nickname'
import { actionSchema, applySeatMove, computerMove, Rejected, secretEquals, secureDeck } from './model'
import { type Policy, SKATZERO_COMMIT, viewOf } from './skatzero/policy'
import { type SeatBidding, SKAT_PAIRS, seatBidding, skatOrHand } from './skatzero/bidding'
import { ComputerFailed, type Logged, POSITION, advance, decide, raw, replayLog, skatzeroTurn } from './computers'
import type { Store } from './store'

// The daily tournament (SKATGO-35). Every day has 12 deals, the same for every player, each played by
// one human in seat 0 against the two computers. The server owns the cards: a deal is its deck and
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
type DealSpec = { dealer: Seat; deck: Card[]; computers?: Record<'1' | '2', StoredBidding> }
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

/** A day's deals: fresh crypto-shuffled decks; the first dealer is random, then the deal passes
 *  clockwise, so the player sits in each position four times. */
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
const boardInput = z.object({ player: player.nullable(), day: z.enum(['today', 'yesterday']) }).strict()
const claimInput = z.object({ from: z.string().regex(/^anon:[a-f0-9]{64}$/), to: z.string().regex(/^user:/).pipe(player) }).strict()

function status(day: string, e: Entry | null): DailyStatus {
  const deals = e?.deals ?? []
  return { day, of: DAILY_DEALS, deal: deals.length, deals, totals: totals(deals), started: !!e, finished: !!e?.finished_at }
}

/** The day's deals. Requests never deal: a day is dealt ahead by prepareDays; one that is not there yet
 *  is being prepared, and the request says so. */
async function dayOfDeals(c: pg.PoolClient, day: string): Promise<Day> {
  const { rows } = await c.query('SELECT deals, computer FROM daily_deals WHERE day = $1', [day])
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

/** How long one day's preparation may take before it is abandoned for a later retry (grill Q5). */
const PREPARE_MS = 10 * 60 * 1000

/** Deal `day` and work out both computers' bidding for its 12 deals, unless it is already dealt.
 *  Runs in the leader; yields between steps, so the service keeps answering while it works. */
export async function prepareDay(store: Store, policy: Policy, day: string, now = Date.now): Promise<'dealt' | 'present'> {
  const { rows } = await store.pool.query('SELECT 1 FROM daily_deals WHERE day = $1', [day])
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
  }
  await store.transaction(async (c) => {
    await c.query('INSERT INTO daily_deals (day, deals, computer) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [day, JSON.stringify(specs), COMPUTER])
  })
  return 'dealt'
}

/** Today and tomorrow, dealt ahead — one preparation at a time. */
let preparing: Promise<void> | null = null
export function prepareDays(store: Store, policy: Policy, now = Date.now): Promise<void> {
  preparing ??= (async () => {
    try {
      for (const offset of [0, 1]) {
        const day = dayOf(now() + offset * 24 * 60 * 60 * 1000)
        const t = Date.now()
        const r = await prepareDay(store, policy, day, now)
        if (r === 'dealt') console.log(JSON.stringify({ event: 'daily_prepared', day, ms: Date.now() - t, rss: process.memoryUsage().rss }))
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
    'SELECT actions, deals, total, finished_at FROM daily_entries WHERE day = $1 AND player = $2 FOR UPDATE', [day, who])
  return rows[0] ?? null
}

async function save(c: pg.PoolClient, day: string, who: string, e: Entry) {
  await c.query(
    'UPDATE daily_entries SET actions = $3, deals = $4, total = $5, finished_at = $6 WHERE day = $1 AND player = $2',
    [day, who, JSON.stringify(e.actions), JSON.stringify(e.deals), e.total, e.finished_at])
}

/** Record every deal that is over, so the entry always points at a deal still to be played. */
function settleEnded(specs: DealSpec[], e: Entry, now: number): Game | null {
  while (e.deals.length < DAILY_DEALS) {
    const i = e.deals.length
    const g = replay(specs[i], (e.actions[i] ?? []) as Move[])
    if (!ended(g)) return g
    e.deals.push(summarize(g))
    e.total = totals(e.deals)[PLAYER]
    if (e.deals.length < DAILY_DEALS) e.actions.push([])
  }
  e.finished_at ??= String(now)
  return null
}

/** The same on a recorded day: a deal the computers open (they bid before the player) is played up to
 *  the player's turn, and those moves are recorded. */
async function settleRecorded(specs: DealSpec[], e: Entry, now: number, policy: Policy, computer: string): Promise<Game | null> {
  while (e.deals.length < DAILY_DEALS) {
    const i = e.deals.length
    const log = (e.actions[i] ??= []) as Logged[]
    let g = replayLog(specs[i].dealer, specs[i].deck, log)
    if (!ended(g) && actor(g) !== PLAYER) g = await advance(g, log, (x) => computerTurn(x, policy, specs[i], computer))
    if (!ended(g)) return g
    e.deals.push(summarize(g))
    e.total = totals(e.deals)[PLAYER]
    if (e.deals.length < DAILY_DEALS) e.actions.push([])
  }
  e.finished_at ??= String(now)
  return null
}

export async function dailyState(store: Store, policy: Policy, who: string, open: boolean, now = Date.now()) {
  const day = dayOf(now)
  return store.transaction(async c => {
    const { deals: specs, computer } = await dayOfDeals(c, day)
    let e = await entryOf(c, day, who)
    if (!e && !open) return { status: status(day, null), view: null, revision: 0 }
    if (!e) {
      await c.query('INSERT INTO daily_entries (day, player, actions, deals, total, created_at) VALUES ($1, $2, $3, $4, 0, $5)',
        [day, who, JSON.stringify([[]]), '[]', now])
      e = { actions: [[]], deals: [], total: 0, finished_at: null }
    }
    if (e.finished_at || !open) return { status: status(day, e), view: null, revision: 0 }
    const before = JSON.stringify(e)
    const g = computer === HEURISTIC ? settleEnded(specs, e, now) : await settleRecorded(specs, e, now, policy, computer)
    if (JSON.stringify(e) !== before) await save(c, day, who, e)
    return { status: status(day, e), view: g ? seatView(g) : null, revision: g ? e.actions[e.deals.length].length : 0 }
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
      const g = applySeatMove(replay(specs[input.deal], moves as Move[]), PLAYER, move)
      steps.push(g)
      untilPlayer(g, steps)
      moves.push(move)
      current = settleEnded(specs, e, now)
    } else {
      const log = moves as Logged[]
      let g = replayLog(specs[input.deal].dealer, specs[input.deal].deck, log)
      if (actor(g) !== PLAYER) throw new Rejected('not_your_turn')
      g = applySeatMove(g, PLAYER, move)
      log.push({ seat: PLAYER, move })
      steps.push(g)
      await advance(g, log, (x) => computerTurn(x, policy, specs[input.deal], computer), steps)
      current = await settleRecorded(specs, e, now, policy, computer)
    }
    await save(c, day, input.player, e)
    return {
      status: status(day, e),
      steps: steps.map(seatView) as SeatView[],
      revision: current ? e.actions[e.deals.length].length : 0,
    }
  })
}

/** A player who signs in takes today's anonymous entry from this device into the account — unless the
 *  account already has one today. Past days never move (SKATGO-35, grill Q7). */
export async function dailyClaim(store: Store, from: string, to: string, now = Date.now()) {
  const day = dayOf(now)
  return store.transaction(async c => {
    const r = await c.query(
      `UPDATE daily_entries SET player = $3 WHERE day = $1 AND player = $2
         AND NOT EXISTS (SELECT 1 FROM daily_entries WHERE day = $1 AND player = $3)`, [day, from, to])
    return { claimed: r.rowCount === 1 }
  })
}

/** The day before a tournament day, as YYYY-MM-DD. */
export function dayBefore(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10)
}

/** A finished player puts today's entry on the board under a nickname, or changes it, until midnight
 *  (SKATGO-36). A refused name is refused without saying why. */
export async function dailyName(store: Store, who: string, raw: string, now = Date.now()) {
  const nickname = cleanNickname(raw)
  if (!nickname) throw new Rejected('nickname_refused')
  const day = dayOf(now)
  return store.transaction(async c => {
    const r = await c.query(
      'UPDATE daily_entries SET nickname = $3 WHERE day = $1 AND player = $2 AND finished_at IS NOT NULL', [day, who, nickname])
    if (r.rowCount !== 1) throw new Rejected('not_finished')
    return { nickname }
  })
}

/** How many rows the board shows; a player below them gets their own row apart. */
const BOARD_ROWS = 100

/**
 * A day's leaderboard (SKATGO-36): the finished entries that have a nickname, by Seeger-Fabian total;
 * equal totals share a rank and the next rank skips (1, 1, 3). Only nicknames and totals leave here —
 * never a player id. For the asking player: their own standing (a finished player without a nickname
 * sees the rank they would have), and the nickname they last used on an earlier day.
 */
export async function dailyBoard(store: Store, who: string | null, which: 'today' | 'yesterday', now = Date.now()) {
  const day = which === 'today' ? dayOf(now) : dayBefore(dayOf(now))
  const { rows } = await store.pool.query(
    `SELECT player, nickname, total FROM daily_entries
      WHERE day = $1 AND finished_at IS NOT NULL AND nickname IS NOT NULL
      ORDER BY total DESC, finished_at ASC`, [day])
  const ranked = rows.map((r, i) => ({
    rank: i === 0 || rows[i - 1].total !== r.total ? i + 1 : 0,
    nickname: r.nickname as string, total: r.total as number, me: r.player === who,
  }))
  for (let i = 1; i < ranked.length; i++) if (ranked[i].rank === 0) ranked[i].rank = ranked[i - 1].rank
  const mine = ranked.findIndex(r => r.me)
  const own = mine >= BOARD_ROWS ? ranked[mine] : null
  let me = null
  let lastNickname: string | null = null
  if (who) {
    const own = await store.pool.query(
      'SELECT nickname, total, finished_at FROM daily_entries WHERE day = $1 AND player = $2', [day, who])
    const e = own.rows[0]
    if (e) {
      const rank = 1 + ranked.filter(r => r.total > e.total).length
      me = { finished: !!e.finished_at, total: e.total as number, nickname: e.nickname as string | null, rank: e.finished_at ? rank : null }
    }
    const last = await store.pool.query(
      'SELECT nickname FROM daily_entries WHERE player = $1 AND nickname IS NOT NULL ORDER BY day DESC LIMIT 1', [who])
    lastNickname = last.rows[0]?.nickname ?? null
  }
  return { day, rows: ranked.slice(0, BOARD_ROWS), own, total: ranked.length, me, lastNickname }
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
  router.post('/claim', run(async body => {
    const i = claimInput.parse(body)
    return dailyClaim(store, i.from, i.to)
  }))
  router.use((_err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(400).json({ error: 'invalid_request' })
  })
  return router
}
