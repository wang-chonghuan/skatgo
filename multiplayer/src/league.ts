import { randomBytes, randomInt } from 'node:crypto'
import express from 'express'
import type pg from 'pg'
import { z } from 'zod'
import { actor, deal, next, type Seat } from '../../app/src/lib/skat/game'
import {
  BOARD_SIZE, CHECKIN_COINS, FEES, MATCH_WAIT_MS, TIERS, dealOutcome, dealPoints, forfeitPoints, leftOutcome, standingAfter,
  type BoardRow, type DealOutcome, type LeagueBoard, type LeagueMe, type LeagueResult,
} from '../../app/src/lib/skat/league'
import { roomSeat, viewSeat } from '../../app/src/lib/skat/room-view'
import { auctionOf, summarize } from '../../app/src/lib/skat/tournament'
import { ComputerFailed, type Logged, advance, computerTurn, judgePlays, playsOf, replayLog, reviewOf } from './computers'
import { dayOf, nameOf } from './daily'
import { faceOf } from '../../app/src/lib/forum'
import { deckOf, plan, poolDealOf, type Pool } from './free'
import { Rejected, TTL_MS, dealNext, secretEquals, type PoolDeal, type Slot, type Snapshot } from './model'
import { MAX_POPULATION, population, type Persona } from './personas/config'
import { strengthDecisions } from './personas/decisions'
import { personaPolicy } from './personas/play'
import { played, recordFreeDeal } from './profile'
import type { Policy } from './skatzero/policy'
import type { Store } from './store'
import { leaveOtherTables } from './tables'

// The League (SKATGO-204, the human: 「分场天梯先做，而且人机匹配，有人则匹配人，没人则匹配AI」): a signed-in player's coins from a
// daily check-in, their tier and league points, and the table they sit at, paying their tier's fee for each deal. A sitting
// is a room as a private table is (SKATGO-61/163: the same engine, the 30-second grace and the computer standing in,
// restored after a restart), laid by the service: it waits MATCH_WAIT_MS for other people of the tier, then gives the empty
// seats to personas of that tier's strength (SKATGO-180's Synthetic players, the weakest sixth in Bronze up to the strongest
// in Legend). Each deal's moves are kept, so each person's review of it — their seat turned to seat 0, free play's review —
// can be worked out after the room is gone, and counts for their XP and record as a free deal does. Each finished deal
// moves each person's standing by how their side came out of it (SKATGO-205), once; the next deal is dealt to those who
// stay and can pay, the others' seats going to personas, and with nobody left the sitting ends. The web's /api/league/* is the only client, behind the
// admission key.

const ACCOUNT = /^user:[A-Za-z0-9_]{1,64}$/
/** How long a finished sitting's room stays for its last result. */
const FINISHED_MS = 10 * 60 * 1000
/** A persona with a board activity planned this close to now is busy (one timeline per persona, the personas skill). */
const BUSY_MS = 30 * 60 * 1000

/** How weak a persona's card play is: its strength policy's two card-error rates (skatgo-personas/2, the boards' since
 *  2026-11-11), or the legacy `mistake` for a persona without them. */
export const weakness = (p: Persona) => (p.play.strength ? p.play.strength.declarerError + p.play.strength.defenderError : p.play.mistake)
/** How much of its own card errors a persona keeps at each tier's table: all in Bronze, none in Legend, where it plays
 *  SkatZero's cards (the human: 「档位越高对手越强」, the ticket: 传奇档接近 SkatZero 的水平). Measured with the ticket's
 *  calibrate.mts (SKATGO-205, 1200 deals a tier): SkatZero in a seat earns +131 League points per 100 deals in Bronze and
 *  +50 in Legend; the median persona +73 in Bronze down to −44 in Legend. */
export const TIER_ERRORS: readonly number[] = [1, 0.8, 0.6, 0.4, 0.2, 0]

/** The personas weakest first, in six bands of equal size: a tier's opponents come from its band. */
let bands: Persona[][] | null = null
export function bandOf(tier: number): Persona[] {
  if (!bands) {
    const all = [...population(MAX_POPULATION).personas].sort((a, b) => weakness(b) - weakness(a) || a.id.localeCompare(b.id))
    bands = TIERS.map((_, i) => all.slice(Math.floor((i * all.length) / TIERS.length), Math.floor(((i + 1) * all.length) / TIERS.length)))
  }
  return bands[tier]
}
const byId = new Map<string, Persona>()
/** A persona by its `sim:` id. */
export function personaOf(id: string): Persona {
  if (byId.size === 0) for (const p of population(MAX_POPULATION).personas) byId.set(`sim:${p.id}`, p)
  const p = byId.get(id)
  if (!p) throw new ComputerFailed('persona_unknown')
  return p
}
/** How a persona plays its cards at a tier's table: its own strength policy, its card errors scaled by the tier
 *  (`TIER_ERRORS`); a persona without one, the legacy slips. Its bidding is the pool's plan, SkatZero's, as every seat's. */
export function leaguePolicy(base: Policy, p: Persona, tier: number, seed: string): Policy {
  const s = p.play.strength
  if (!s) return personaPolicy(base, p, seed)
  const f = TIER_ERRORS[tier]
  return strengthDecisions(base, { ...p, play: { ...p.play, strength: { ...s, declarerError: s.declarerError * f, defenderError: s.defenderError * f } } }, seed, []).policy
}
/** How a persona plays its seat's card now, seeded by the sitting, the deal and the moment so a retried turn chooses the
 *  same. */
export function personaTurnPolicy(base: Policy, s: Snapshot, seat: Seat): Policy | null {
  const id = s.seats[seat].persona
  if (!id || !s.league || !s.game) return null
  return leaguePolicy(base, personaOf(id), s.league.tier, `${s.league.match}|${s.deals}|${seat}|${s.game.tricks.length}|${s.game.trick.length}`)
}

/** A person's face as stored (SKATGO-232), for their League seat (SKATGO-238): null when they have none. */
async function faceOfPlayer(c: pg.PoolClient, player: string) {
  const { rows } = await c.query('SELECT seed, image_id FROM player_avatars WHERE player = $1', [player])
  return faceOf(rows[0]?.seed, rows[0]?.image_id)
}

/** Two (or however many are asked) personas of the tier free now: at no live League table, with no board activity due
 *  close by, and under a name no person holds. */
async function opponents(c: pg.PoolClient, tier: number, count: number, now: number, besides: string[] = []): Promise<{ id: string; nickname: string }[]> {
  if (count === 0) return []
  const { rows: seated } = await c.query(
    `SELECT DISTINCT s->>'persona' AS id FROM multiplayer_rooms, jsonb_array_elements(snapshot->'seats') s
      WHERE expires_at > $1 AND snapshot ? 'league' AND s ? 'persona'`, [now])
  const { rows: due } = await c.query(
    'SELECT DISTINCT player AS id FROM persona_jobs WHERE result IS NULL AND due BETWEEN $1 AND $2', [now - BUSY_MS, now + BUSY_MS])
  const busy = new Set([...seated, ...due].map((r) => r.id as string).concat(besides))
  const free = bandOf(tier).filter((p) => !busy.has(`sim:${p.id}`))
  const { rows: held } = await c.query('SELECT lower(nickname) AS n FROM daily_players WHERE lower(nickname) = ANY($1)',
    [free.map((p) => p.nickname.toLowerCase())])
  const taken = new Set(held.map((r) => r.n as string))
  const left = free.filter((p) => !taken.has(p.nickname.toLowerCase()))
  const chosen: { id: string; nickname: string }[] = []
  while (chosen.length < count && left.length) {
    const [p] = left.splice(randomInt(left.length), 1)
    chosen.push({ id: `sim:${p.id}`, nickname: p.nickname })
  }
  if (chosen.length < count) throw new Rejected('no_opponents')
  return chosen
}

/** An account's League row, made on first sight: Bronze, 0 points, no coins until its first check-in. */
async function standingOf(c: pg.Pool | pg.PoolClient, player: string, lock = false) {
  await c.query('INSERT INTO league_players (player, updated_at) VALUES ($1, $2) ON CONFLICT DO NOTHING', [player, Date.now()])
  const { rows } = await c.query(`SELECT coins, tier, points, checkin_day FROM league_players WHERE player = $1${lock ? ' FOR UPDATE' : ''}`, [player])
  return rows[0] as { coins: number; tier: number; points: number; checkin_day: string | null }
}

/** The League table the account is seated at while it runs, by its room's number; null if none. */
async function tableOf(store: Store, player: string): Promise<string | null> {
  const { rows } = await store.pool.query(
    `SELECT id FROM multiplayer_rooms WHERE expires_at > $1 AND snapshot ? 'league'
        AND NOT coalesce((snapshot->'league'->>'finished')::boolean, false)
        AND snapshot->'seats' @> $2::jsonb LIMIT 1`, [Date.now(), JSON.stringify([{ account: player }])])
  return (rows[0]?.id as string | undefined) ?? null
}

/** The League's board (SKATGO-206): every account that has played a League deal — seated at a sitting with a deal it saw to
 *  its end (not lost by leaving, not waiting for them; a deal before SKATGO-205 scored none, and counts); people never join
 *  a sitting midway, so its seats are where they sat — by tier, then points in it, equal ones sharing a place. Under its name: an account deleted since (SKATGO-185) has none and is not on it. The first `BOARD_SIZE`, and the
 *  asker's own row as `me` when it is further down. */
async function leagueBoard(store: Store, who: string | null): Promise<LeagueBoard> {
  const { rows } = await store.pool.query(
    `WITH played AS (
       SELECT DISTINCT seat AS player FROM league_matches m, jsonb_array_elements_text(m.seats) WITH ORDINALITY AS t(seat, n)
        WHERE seat LIKE 'user:%' AND EXISTS (SELECT 1 FROM league_deals d WHERE d.match = m.id AND (d.points IS NULL
          OR (d.points->>(n::int - 1) IS NOT NULL AND NOT coalesce(d.forfeits @> to_jsonb(n::int - 1), false))))),
     ranked AS (
       SELECT l.player, l.tier, l.points, p.nickname,
              rank() OVER (ORDER BY l.tier DESC, l.points DESC) AS rank,
              row_number() OVER (ORDER BY l.tier DESC, l.points DESC, l.player) AS n
         FROM league_players l JOIN played USING (player) JOIN daily_players p ON p.player = l.player)
     SELECT player, tier, points, nickname, rank::int AS rank, n::int AS n FROM ranked WHERE n <= $1 OR player = $2 ORDER BY n`,
    [BOARD_SIZE, who])
  const row = (r: (typeof rows)[number]): BoardRow =>
    ({ rank: r.rank, nickname: r.nickname, tier: r.tier, points: r.points, ...(r.player === who ? { you: true as const } : {}) })
  const top = rows.filter((r) => r.n <= BOARD_SIZE).map(row)
  const me = rows.find((r) => r.n > BOARD_SIZE)
  return me ? { rows: top, me: row(me) } : { rows: top }
}

/** How a finished deal came out for a seat and its League points (SKATGO-216): as it was played, or lost when its person did
 *  not see it to its end (`stake`, SKATGO-206). */
function seatResult(end: ReturnType<typeof summarize>, seat: number, stake?: DealOutcome): { outcome: DealOutcome; points: number } {
  if (stake) return { outcome: stake, points: forfeitPoints(end.declarer, end.detail?.value ?? 0, seat) }
  return { outcome: dealOutcome(end.declarer, !!end.won, seat), points: dealPoints(end.scores, seat) }
}

/** One person's League points for a deal, their standing moved once, in the transaction of the change that decided it. */
async function scoreSeat(s: Snapshot, c: pg.PoolClient, account: string, { outcome, points }: { outcome: DealOutcome; points: number }, now: number) {
  const l = s.league!
  const before = await standingOf(c, account, true)
  const after = standingAfter({ tier: before.tier, points: before.points }, points)
  await c.query('UPDATE league_players SET tier = $2, points = $3, updated_at = $4 WHERE player = $1', [account, after.tier, after.points, now])
  return {
    outcome, points, standing: { tier: after.tier, points: after.points }, moved: after.moved,
    // The next deal here is this tier's: someone moved up or down sits down again in their new tier.
    canPay: after.tier === l.tier && before.coins >= FEES[l.tier],
  }
}

/** A finished deal of a sitting (SKATGO-204), kept for its reviews, and scored (SKATGO-205): each person's
 *  Seeger-Fabian score minus the average of the other two seats' (SKATGO-216) — their standing moved once, in the transaction
 *  of the change that ended the deal; `scoredBefore` is the room's count of scored deals before it. Whether each can pay
 *  the next deal at this table travels with the result. Only a deal seen to its end counts so (SKATGO-206): one who left
 *  during it loses it (`forfeits`, no review, no record); one away when it ends is scored when they come back to its result
 *  (`pending`, `settlePending`). */
export async function settleLeague(s: Snapshot, c: pg.PoolClient, scoredBefore: number, now = Date.now()) {
  const l = s.league
  if (!l || s.scored <= scoredBefore || !l.current || !s.game) return
  const end = summarize(s.game)
  const result: LeagueResult = { deal: s.scored - 1, seats: [] }
  const forfeits: number[] = []
  l.pending = []
  for (let seat = 0; seat < 3; seat++) {
    const p = s.seats[seat]
    if (!p.account) result.seats.push(null)
    else if (p.forfeit) {
      result.seats.push(await scoreSeat(s, c, p.account, seatResult(end, seat, p.stake ?? 'left'), now))
      forfeits.push(seat)
    } else if (!p.session) {
      result.seats.push(null)
      l.pending.push(seat)
    } else result.seats.push(await scoreSeat(s, c, p.account, seatResult(end, seat), now))
  }
  await c.query('INSERT INTO league_deals (match, deal, pool, pool_id, dealer, log, points, forfeits) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING',
    [l.match, s.scored - 1, l.current.pool, l.current.id, l.current.dealer, JSON.stringify(l.current.log),
      JSON.stringify(result.seats.map((x) => x?.points ?? null)), JSON.stringify(forfeits)])
  l.last = result
}

/** The last deal for a person who was away when it ended (SKATGO-206): back to its result, it counts as it came out;
 *  not back within `AWAY_MS` of going, or their seat going to the next deal first, it is lost (−3 if they were declaring when
 *  they went, else as a defender: `forfeitPoints`). */
export async function settlePending(s: Snapshot, c: pg.PoolClient, seat: number, seen: boolean, now = Date.now()) {
  const l = s.league
  const p = s.seats[seat]
  if (!l?.pending?.includes(seat) || !l.last || !s.game || !p.account) return
  l.pending = l.pending.filter((x) => x !== seat)
  const end = summarize(s.game)
  const entry = await scoreSeat(s, c, p.account, seatResult(end, seat, seen ? undefined : (p.stake ?? leftOutcome(end.declarer, seat))), now)
  l.last.seats[seat] = entry
  await c.query(
    `UPDATE league_deals SET points = jsonb_set(points, ARRAY[$3::text], to_jsonb($4::int)),
            forfeits = CASE WHEN $5::boolean THEN coalesce(forfeits, '[]'::jsonb) || to_jsonb($6::int) ELSE forfeits END
      WHERE match = $1 AND deal = $2`, [l.match, l.last.deal, String(seat), entry.points, !seen, seat])
}

/** The sitting's next deal (SKATGO-205), once it is due (`nextDue`): a person who left, is away, moved to another tier or
 *  cannot pay gets up — their seat a persona of the tier — and those who stay pay the tier's fee. With nobody left the
 *  sitting ends: finished, its room going in FINISHED_MS. Called in the transaction of the change that made it due. */
export async function leagueDeal(s: Snapshot, c: pg.PoolClient, pick: (dealer: Seat) => PoolDeal, now = Date.now()) {
  const l = s.league
  if (!l || !s.game || l.finished) return
  const fee = FEES[l.tier]
  const staying: string[] = []
  for (let seat = 0; seat < 3; seat++) {
    const p = s.seats[seat]
    if (!p.account) continue
    // Away when the last deal ended and not back to its result before the next: lost (SKATGO-206).
    await settlePending(s, c, seat, false, now)
    const standing = await standingOf(c, p.account, true)
    const stays = !p.leaving && !!p.session && !p.autopilot && standing.tier === l.tier && standing.coins >= fee
    if (stays) {
      delete p.stake
      delete p.forfeit
      staying.push(p.account)
      continue
    }
    const [o] = await opponents(c, l.tier, 1, now, s.seats.flatMap((x) => (x.persona ? [x.persona] : [])))
    s.seats[seat] = { account: null, nickname: o.nickname, session: null, disconnectedAt: null, autopilot: true, joinsAt: null, persona: o.id }
  }
  s.nextBy = []
  if (!staying.length) {
    await c.query('UPDATE league_matches SET finished_at = $2 WHERE id = $1 AND finished_at IS NULL', [l.match, now])
    l.finished = true
    s.expiresAt = now + FINISHED_MS
    return
  }
  for (const account of staying) await c.query('UPDATE league_players SET coins = coins - $2, updated_at = $3 WHERE player = $1', [account, fee, now])
  dealNext(s, pick(next(s.game.dealer)))
}

type Matched = { room: string } | { error: string }
type Waiter = { player: string; done: (m: Matched) => void }
type Group = { tier: number; waiters: Waiter[]; timer: ReturnType<typeof setTimeout> }

export function leagueRoutes(store: Store, admissionKey: string, ready: () => boolean, pool: () => Pool | null,
  host: (room: string) => Promise<void>, policy: () => Policy | null) {
  const router = express.Router()
  router.use(express.json({ limit: '4kb' }))
  router.use((req, res, nextHandler) => {
    if (!ready()) return void res.status(503).json({ error: 'not_ready' })
    if (!secretEquals(req.get('x-admission-key'), admissionKey)) return void res.status(403).json({ error: 'admission_denied' })
    nextHandler()
  })
  const run = (work: (body: Record<string, unknown>) => Promise<unknown>) => async (req: express.Request, res: express.Response) => {
    try {
      res.set('cache-control', 'no-store').json(await work((req.body ?? {}) as Record<string, unknown>))
    } catch (e) {
      if (e instanceof z.ZodError) res.status(400).json({ error: 'invalid_request' })
      else if (e instanceof Rejected) res.status(409).json({ error: e.message })
      else if (e instanceof ComputerFailed) res.status(503).json({ error: 'computer_unavailable' })
      else {
        console.error(JSON.stringify({ event: 'league_failed', reason: e instanceof Error ? e.name : 'unknown' }))
        res.status(503).json({ error: 'unavailable' })
      }
    }
  }
  const player = z.string().regex(ACCOUNT)

  // What the page shows: the tiers and their fees, the League's board, and for an account its coins, standing and table.
  router.post('/state', run(async (body) => {
    const who = z.object({ player: player.nullable() }).strict().parse(body).player
    const board = await leagueBoard(store, who)
    if (!who) return { fees: FEES, board, me: null }
    const s = await standingOf(store.pool, who)
    const me: LeagueMe = { coins: s.coins, tier: s.tier, points: s.points, today: s.checkin_day === dayOf(Date.now()), table: await tableOf(store, who) }
    return { fees: FEES, board, me }
  }))

  // The day's check-in: the first open of SkatGo on a Berlin day gives CHECKIN_COINS, once (the human: 「不打开游戏就不给，打开了
  // 就能积累」); the first of a new week (Monday on) gives them in place of what was left (SKATGO-210: 「必须每周金币清零」).
  router.post('/checkin', run(async (body) => {
    const who = z.object({ player }).strict().parse(body).player
    const day = dayOf(Date.now())
    const { rows } = await store.pool.query(
      `INSERT INTO league_players (player, coins, checkin_day, updated_at) VALUES ($1, $2, $3, $4)
       ON CONFLICT (player) DO UPDATE SET checkin_day = $3,
         coins = CASE WHEN date_trunc('week', league_players.checkin_day::date) = date_trunc('week', $3::date)
                      THEN league_players.coins + $2 ELSE $2 END
         WHERE league_players.checkin_day IS DISTINCT FROM $3
       RETURNING coins`, [who, CHECKIN_COINS, day, Date.now()])
    if (rows[0]) return { coins: rows[0].coins as number, added: CHECKIN_COINS }
    return { coins: (await standingOf(store.pool, who)).coins, added: 0 }
  }))

  // A seat: the account's table if it is at one; otherwise it waits up to MATCH_WAIT_MS for others of its tier, then the
  // table is made and the fee taken. Answers the room's number once seated.
  const groups = new Map<number, Group>()
  const waiting = new Map<string, Promise<Matched>>()
  async function form(g: Group) {
    groups.delete(g.tier)
    clearTimeout(g.timer)
    const answer = (p: string, m: Matched) => g.waiters.filter((w) => w.player === p).forEach((w) => w.done(m))
    try {
      const p = pool()
      if (!p) throw new Rejected('not_ready')
      const now = Date.now()
      const made = await store.transaction(async (c) => {
        const seated: string[] = []
        for (const w of g.waiters) {
          const s = await standingOf(c, w.player, true)
          if (s.tier !== g.tier) answer(w.player, { error: 'tier_changed' })
          else if (s.coins < FEES[g.tier]) answer(w.player, { error: 'not_enough_coins' })
          else seated.push(w.player)
        }
        if (!seated.length) return null
        const others = await opponents(c, g.tier, 3 - seated.length, now)
        const seats: Slot[] = [
          ...await Promise.all(seated.map(async (account) => ({
            account, nickname: await nameOf(c, account, now), face: await faceOfPlayer(c, account), session: null,
            // Away until they come in: if they never do, the grace runs out and a computer plays for them.
            disconnectedAt: now, autopilot: false, joinsAt: null,
          }))),
          ...others.map((o) => ({ account: null, nickname: o.nickname, session: null, disconnectedAt: null, autopilot: true, joinsAt: null, persona: o.id })),
        ]
        for (let i = seats.length - 1; i > 0; i--) {
          const j = randomInt(i + 1)
          ;[seats[i], seats[j]] = [seats[j], seats[i]]
        }
        const match = randomBytes(9).toString('base64url')
        let s: Snapshot | null = null
        for (let i = 0; i < 20 && !s; i++) {
          const draft: Snapshot = {
            schema: 3, id: String(randomInt(100_000, 1_000_000)), revision: 0, played: 0, host: null, seats, game: null, plans: null,
            deals: 0, scored: 0, scores: [0, 0, 0], expiresAt: now + TTL_MS, nextActionAt: now + 1500,
            league: { match, tier: g.tier, current: null },
          }
          // Each deals once: the first dealer drawn, then round the table.
          dealNext(draft, poolDealOf(p, randomInt(3) as Seat))
          if (await store.insert(c, draft)) s = draft
        }
        if (!s) throw new Rejected('room_capacity')
        for (const account of seated) await c.query('UPDATE league_players SET coins = coins - $2, updated_at = $3 WHERE player = $1', [account, FEES[g.tier], now])
        await c.query('INSERT INTO league_matches (id, room, tier, seats, created_at) VALUES ($1, $2, $3, $4, $5)',
          [match, s.id, g.tier, JSON.stringify(s.seats.map((x) => x.account ?? x.persona)), now])
        return { room: s.id, seated }
      })
      if (!made) return
      await host(made.room)
      // At the new table, each leaves any other they sat down at while waiting (SKATGO-235).
      for (const account of made.seated) await leaveOtherTables(store, account, made.room)
      for (const account of made.seated) answer(account, { room: made.room })
    } catch (e) {
      const error = e instanceof Rejected ? e.message : 'unavailable'
      if (!(e instanceof Rejected)) console.error(JSON.stringify({ event: 'league_match_failed', reason: e instanceof Error ? e.name : 'unknown' }))
      for (const w of g.waiters) w.done({ error })
    }
  }
  function enqueue(who: string, tier: number): Promise<Matched> {
    const known = waiting.get(who)
    if (known) return known
    const asked = new Promise<Matched>((done) => {
      let g = groups.get(tier)
      if (!g) {
        const fresh: Group = { tier, waiters: [], timer: setTimeout(() => void form(fresh), MATCH_WAIT_MS) }
        groups.set(tier, (g = fresh))
      }
      g.waiters.push({ player: who, done })
      if (g.waiters.length >= 3) void form(g)
    }).finally(() => waiting.delete(who))
    waiting.set(who, asked)
    return asked
  }
  router.post('/play', run(async (body) => {
    const who = z.object({ player }).strict().parse(body).player
    const table = await tableOf(store, who)
    if (table) return { room: table }
    // Going to the League, the account leaves every other table (SKATGO-235, the human: 「比如打过私人桌，再打联赛，就显示我在
    // 另一个桌，让我先退出，其实我已经无法退出了」).
    await leaveOtherTables(store, who)
    const s = await standingOf(store.pool, who)
    if (s.coins < FEES[s.tier]) throw new Rejected('not_enough_coins')
    const m = await enqueue(who, s.tier)
    if ('error' in m) throw new Rejected(m.error)
    return m
  }))

  // A deal of a sitting reviewed for one of its people (SKATGO-204): their seat turned to seat 0 — the same cards dealt by the
  // dealer as they saw them — so free play's review, the AI's own game from their seat and their record (XP) are free play's.
  const reviewInput = z.object({ player, match: z.string().regex(/^[A-Za-z0-9_-]{12}$/), deal: z.number().int().min(0).max(100_000) }).strict()
  router.post('/review', run(async (body) => {
    const i = reviewInput.parse(body)
    const p = pool()
    const base = policy()
    if (!p || !base) throw new Rejected('not_ready')
    const { rows: matches } = await store.pool.query('SELECT seats FROM league_matches WHERE id = $1', [i.match])
    const seat = (matches[0]?.seats as (string | null)[] | undefined)?.indexOf(i.player) ?? -1
    if (seat < 0) throw new Rejected('no_such_deal')
    const { rows } = await store.pool.query('SELECT pool, pool_id, dealer, log, points, forfeits FROM league_deals WHERE match = $1 AND deal = $2', [i.match, i.deal])
    const d = rows[0]
    if (!d) throw new Rejected('not_finished')
    // A deal not seen to its end is no deal of theirs (SKATGO-206): lost, or not counted yet while they are away.
    if ((d.forfeits as number[] | null)?.includes(seat)) throw new Rejected('no_such_deal')
    if (d.points && (d.points as (number | null)[])[seat] === null) throw new Rejected('not_finished')
    if (d.pool !== p.version) throw new Rejected('no_such_deal')
    const spec = p.deals[d.pool_id]
    const deck = deckOf(spec.deck)
    const dealer = viewSeat(d.dealer, seat)
    const log = (d.log as Logged[]).map((l) => ({ ...l, seat: viewSeat(l.seat, seat) }))
    const end = replayLog(dealer, deck, log)
    if (end.phase !== 'done' && end.phase !== 'passedIn') throw new Rejected('not_finished')
    const plans = ([0, 1, 2] as Seat[]).map((v) => plan(spec.computers[String(roomSeat(v, seat)) as '0' | '1' | '2']))
    const ai = await advance(deal(dealer, deck), [], (g) => computerTurn(g, actor(g)!, plans[actor(g)!], base), undefined, true)
    if (ai.phase !== 'done' && ai.phase !== 'passedIn') throw new ComputerFailed('ai_unfinished')
    const now = Date.now()
    await recordFreeDeal(store, {
      player: i.player, game: `league:${d.pool}:${d.pool_id}:${seat}:${i.match}:${i.deal}`, day: dayOf(now), at: now,
      mine: played(summarize(end)), ai: played(summarize(ai)),
    })
    return reviewOf(end, await judgePlays(base, playsOf(dealer, deck, log)), { ai: summarize(ai), aiAuction: auctionOf(ai) })
  }))

  router.use((_err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(400).json({ error: 'invalid_request' })
  })
  return router
}
