import { randomInt } from 'node:crypto'
import type pg from 'pg'
import { deal, roleOf, type Seat } from '../../app/src/lib/skat/game'
import { POSITION, raw } from './computers'
import { dayOf, skatOrder } from './daily'
import { deckOf, poolPlan, type PoolEntry } from './free'
import { Rejected, secureDeck, type PoolDeal } from './model'
import type { Policy } from './skatzero/policy'
import type { Store } from './store'

// The League's cards (SKATGO-251, the human: 「必须随机出牌」, 「每天预先生成好一套，放到db，今天都从这个池子里取」, 「你随机出牌后，
// 把分数高的一套，按更高的概率给真人玩家」): each Berlin day has its own pool of freshly shuffled deals, worked out the day
// before by the leader with every seat's SkatZero bidding (about 35–40 s a deal in production, so never on request), and
// a League deal is drawn from today's — never one its people have had. The deal is chosen so each person at the table
// holds its strongest hand (the one SkatZero's bidding would win the auction with) half the deals, people at one table
// sharing it evenly. Free play and private tables keep free play's pool.

const DAY_MS = 24 * 60 * 60 * 1000
/** Deals in a day's pool: nearly three times the busiest League day so far (117) and six times the most one account
 *  played in a day (46). `LEAGUE_POOL_DEALS` sets another, for the tests. */
export const LEAGUE_POOL_DEALS = Number(process.env.LEAGUE_POOL_DEALS ?? 300)
/** The share of deals in which a person alone at the table holds the strongest hand (it is about a third by chance);
 *  with more people each has min(this, 1 / people). */
export const STRONGEST_SHARE = 1 / 2

/** A day's pool, as a League deal names it. */
export const poolName = (day: string) => `league@${day}`
export const isLeaguePool = (name: string) => /^league@\d{4}-\d{2}-\d{2}$/.test(name)

/** A deal of a day's pool: its number, dealer, deck and every seat's bidding, and the seat holding the strongest hand. */
export type PoolRow = PoolEntry & { day: string; n: number; strongest: Seat | null }

/** The seat whose hand SkatZero's bidding would win the auction with: the highest bid from 18 up, a tie going to the
 *  earlier position (forehand, then middlehand, then rearhand); none when all three would pass. */
export function strongestSeat(dealer: Seat, maxBids: readonly number[]): Seat | null {
  const seats = ([0, 1, 2] as Seat[]).sort((a, b) => POSITION[roleOf(a, dealer)] - POSITION[roleOf(b, dealer)])
  let best: Seat | null = null
  for (const s of seats) if (maxBids[s] >= 18 && (best === null || maxBids[s] > maxBids[best])) best = s
  return best
}

/** A new deal of `day`'s pool: a cryptographic shuffle, a random dealer, each seat's bidding with its skats tried in an
 *  order fixed by the day, the deal and the seat. */
export async function makePoolDeal(policy: Policy, day: string, n: number): Promise<Omit<PoolRow, 'day' | 'n'>> {
  const dealer = randomInt(3) as Seat
  const deck = secureDeck()
  const g = deal(dealer, deck)
  const computers = {} as PoolEntry['computers']
  for (const seat of [0, 1, 2] as Seat[]) {
    computers[String(seat) as '0' | '1' | '2'] = await poolPlan(policy, g.hands[seat].map(raw), POSITION[roleOf(seat, dealer)], skatOrder(poolName(day), n, seat))
  }
  return { dealer, deck: deck.map(raw).join(' '), computers, strongest: strongestSeat(dealer, [0, 1, 2].map((s) => computers[String(s) as '0'].maxBid)) }
}

/** Fills `day`'s pool up to LEAGUE_POOL_DEALS, a deal at a time, each stored as soon as it is made (a restart keeps the
 *  work). Returns how many it made. */
async function fillPool(store: Store, policy: Policy, day: string): Promise<number> {
  let made = 0
  for (;;) {
    const { rows } = await store.pool.query('SELECT count(*)::int AS c, coalesce(max(n) + 1, 0)::int AS n FROM league_pool WHERE day = $1', [day])
    if (rows[0].c >= LEAGUE_POOL_DEALS) return made
    const d = await makePoolDeal(policy, day, rows[0].n)
    await store.pool.query(
      'INSERT INTO league_pool (day, n, dealer, deck, computers, strongest, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING',
      [day, rows[0].n, d.dealer, d.deck, JSON.stringify(d.computers), d.strongest, Date.now()])
    made++
  }
}

/** Today's and tomorrow's pools filled ahead — in the leader, at start and hourly, one preparation at a time, today's
 *  first. */
let preparing: Promise<void> | null = null
export function prepareLeaguePools(store: Store, policy: Policy, now = Date.now): Promise<void> {
  preparing ??= (async () => {
    try {
      for (const offset of [0, 1]) {
        const day = dayOf(now() + offset * DAY_MS)
        const t = Date.now()
        const made = await fillPool(store, policy, day)
        if (made) console.log(JSON.stringify({ event: 'league_pool_prepared', day, made, ms: Date.now() - t }))
      }
    } catch (e) {
      console.error(JSON.stringify({ event: 'league_pool_failed', reason: e instanceof Error ? e.message : String(e) }))
    } finally {
      preparing = null
    }
  })()
  return preparing
}

/** A stored deal turned so that `dealer` deals it: the hands go round with the dealer (`deal` gives the forehand the
 *  first ten cards), and each seat's bidding with its hand. */
export function turned(d: PoolEntry, dealer: Seat): PoolEntry {
  const k = (dealer - d.dealer + 3) % 3
  const computers = {} as PoolEntry['computers']
  for (const s of [0, 1, 2]) computers[String(s) as '0'] = d.computers[String((s - k + 3) % 3) as '0']
  return { dealer, deck: d.deck, computers }
}

/**
 * Which of `rows` to deal with `dealer` to a table whose people sit at `people` (SKATGO-251): each person is the one
 * meant to hold the strongest hand with chance min(STRONGEST_SHARE, 1 / people) — a deal whose strongest hand sits in
 * the position their seat has under this dealer; a person alone, not meant to, gets a deal whose strongest hand is not
 * in their position. When no deal fits, any. `random` gives a number in [0, 1).
 */
export function chooseDeal<T extends { dealer: Seat; strongest: Seat | null }>(rows: readonly T[], people: readonly Seat[], dealer: Seat, random: () => number): T {
  const share = Math.min(STRONGEST_SHARE, 1 / people.length)
  const r = random()
  const target = people[Math.floor(r / share)] as Seat | undefined
  const holds = (row: T, seat: Seat) => row.strongest !== null && roleOf(row.strongest, row.dealer) === roleOf(seat, dealer)
  const fit = rows.filter((row) => (target !== undefined ? holds(row, target) : !people.some((seat) => holds(row, seat))))
  const from = fit.length ? fit : rows
  return from[Math.floor(random() * from.length)]
}

const secureRandom = () => randomInt(2 ** 32) / 2 ** 32

/** The League's next deal for a table with `dealer` dealing (SKATGO-251): from today's pool — and yesterday's while today's
 *  is not complete — none its people (`people`: seat and account) have been dealt, chosen by `chooseDeal`, marked dealt to
 *  each of them. No deal left for them: `not_ready`, the table waiting for the next one to be made. */
export async function leagueDealFor(c: pg.PoolClient, people: { seat: Seat; account: string }[], dealer: Seat, now = Date.now()): Promise<PoolDeal> {
  const today = dayOf(now)
  const accounts = people.map((p) => p.account)
  const { rows } = await c.query(
    `SELECT day, n, dealer, deck, computers, strongest FROM league_pool p
      WHERE (day = $1 OR (day = $2 AND (SELECT count(*) FROM league_pool WHERE day = $1) < $3))
        AND NOT EXISTS (SELECT 1 FROM league_seen s WHERE s.player = ANY($4) AND s.pool = 'league@' || p.day AND s.pool_id = p.n)`,
    [today, dayOf(now - DAY_MS), LEAGUE_POOL_DEALS, accounts])
  if (!rows.length) throw new Rejected('not_ready')
  const row = chooseDeal(rows as PoolRow[], people.map((p) => p.seat), dealer, secureRandom)
  for (const account of accounts) {
    await c.query('INSERT INTO league_seen (player, pool, pool_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [account, poolName(row.day), row.n])
  }
  const d = turned(row, dealer)
  return { dealer, deck: deckOf(d.deck), plans: d.computers, pool: poolName(row.day), id: row.n }
}

/** A deal of a day's pool as a table dealt it (`dealer`), or null when there is none. */
export async function leaguePoolDeal(q: pg.Pool | pg.PoolClient, pool: string, n: number, dealer: Seat): Promise<PoolEntry | null> {
  if (!isLeaguePool(pool)) return null
  const { rows } = await q.query('SELECT dealer, deck, computers FROM league_pool WHERE day = $1 AND n = $2', [pool.slice('league@'.length), n])
  return rows[0] ? turned(rows[0] as PoolEntry, dealer) : null
}

/** A League deal of the record (`league:<pool>:<n>:<seat>:<sitting>:<deal>`) from a day's pool, as its table dealt it. */
export async function leagueDealOfRecord(q: pg.Pool, game: string): Promise<PoolEntry | undefined> {
  const [, pool, n, , match, number] = game.split(':')
  const { rows } = await q.query('SELECT dealer FROM league_deals WHERE match = $1 AND deal = $2 AND pool = $3 AND pool_id = $4', [match, Number(number), pool, Number(n)])
  if (!rows[0]) return undefined
  return (await leaguePoolDeal(q, pool, Number(n), rows[0].dealer as Seat)) ?? undefined
}
