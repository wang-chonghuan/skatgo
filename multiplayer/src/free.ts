import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes, randomInt } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { gunzipSync } from 'node:zlib'
import express from 'express'
import { z } from 'zod'
import { actor, deal, type Game, type Move, type Seat } from '../../app/src/lib/skat/game'
import { PLAYER, auctionOf, seatView, seegerFabian, summarize } from '../../app/src/lib/skat/tournament'
import { ComputerFailed, type Logged, type SeatPlan, advance, card, computerTurn, judgePlays, playsOf, replayLog, reviewOf } from './computers'
import { actionSchema, applySeatMove, refuseUnlawful, Rejected, secretEquals } from './model'
import { BIDS, type HandMode } from './skatzero/bidding'
import type { Policy } from './skatzero/policy'
import { dayOf } from './daily'
import { recordFreeDeal } from './profile'
import type { Store } from './store'

// Free play and lesson 11 on the server (SKATGO-40). A game is a deal drawn from a pool prepared
// offline (scripts/make-free-pool.ts: both computers' SkatZero bidding worked out in advance), played by
// one human in seat 0 against two SkatZero computers. The server keeps nothing per game: the game's
// state — which deal, every move so far, the computers' included, and when it began — travels with the
// page as an encrypted, authenticated token. A signed-in player's finished deal is recorded once its review is
// asked, for their record of play (SKATGO-128). Replaying it never asks a computer again; only the next
// computer moves are worked out. No cookie, no browser storage.
//
// Like /daily, these routes are not public: the web service calls them with the admission key.

const TOKEN_LABEL = 'skatgo-free/1'
/** How long a game's token stays good. */
const TOKEN_MS = 24 * 60 * 60 * 1000

/** The pool: each deal's deck and dealer, and every seat's SkatZero bidding (`computers`, keyed by
 *  seat; free play uses seats 1 and 2, a private table any of them — SKATGO-61). */
export type Pool = { version: string; deals: { dealer: Seat; deck: string; computers: Record<'0' | '1' | '2', { maxBid: number; decisions: string }> }[] }
type Manifest = { freePool: { name: string; bytes: number; sha256: string; deals: number } }

/** The pool, checked against the manifest (size, SHA-256, count) and against the bid list it was
 *  made for. Rejects if anything differs. */
export async function loadPool(dir: URL): Promise<Pool> {
  const manifest = JSON.parse(await readFile(new URL('manifest.json', dir), 'utf8')) as Manifest
  const entry = manifest.freePool
  if (!entry) throw new Error('free_pool_missing')
  const gz = new Uint8Array(await readFile(new URL(entry.name, dir)))
  if (gz.length !== entry.bytes || createHash('sha256').update(gz).digest('hex') !== entry.sha256) throw new Error('free_pool_altered')
  const pool = JSON.parse(gunzipSync(gz).toString('utf8')) as Pool & { bids: number[] }
  if (pool.deals.length !== entry.deals || JSON.stringify(pool.bids) !== JSON.stringify(BIDS)) throw new Error('free_pool_shape')
  return { version: pool.version, deals: pool.deals }
}

const HAND_CODE: Record<string, HandMode> = { C: 'CH', S: 'SH', H: 'HH', D: 'DH', G: 'GH', N: 'NH', O: 'NOH' }

export function plan(p: { maxBid: number; decisions: string }): SeatPlan {
  return {
    maxBid: p.maxBid,
    skatOrHand: (bid) => {
      const i = BIDS.findIndex((b) => b >= bid)
      if (i < 0) throw new ComputerFailed('bid_beyond_list')
      const code = p.decisions[i]
      return code === 'P' ? { pickup: true } : { pickup: false, mode: HAND_CODE[code] }
    },
  }
}

type Token = { v: 1; pool: string; id: number; t: number; log: Logged[] }

export function tokenKey(admissionKey: string): Buffer {
  return Buffer.from(hkdfSync('sha256', admissionKey, Buffer.alloc(0), TOKEN_LABEL, 32))
}

export function seal(key: Buffer, t: Token): string {
  const iv = randomBytes(12)
  const c = createCipheriv('aes-256-gcm', key, iv)
  const body = Buffer.concat([c.update(JSON.stringify(t), 'utf8'), c.final()])
  return Buffer.concat([iv, body, c.getAuthTag()]).toString('base64url')
}

export function open(key: Buffer, token: string): Token {
  try {
    const b = Buffer.from(token, 'base64url')
    const d = createDecipheriv('aes-256-gcm', key, b.subarray(0, 12))
    d.setAuthTag(b.subarray(b.length - 16))
    return JSON.parse(Buffer.concat([d.update(b.subarray(12, b.length - 16)), d.final()]).toString('utf8')) as Token
  } catch {
    throw new Rejected('invalid_game')
  }
}

export const deckOf = (s: string) => s.split(' ').map(card)

/** A deal of the pool at random — dealt by `dealer` when one is named: a private table's next deal
 *  (SKATGO-61), free play's next deal of a round (SKATGO-88). */
export function poolDealIndex(p: Pool, dealer?: Seat): number {
  if (dealer === undefined) return randomInt(p.deals.length)
  const ids = p.deals.flatMap((d, i) => (d.dealer === dealer ? [i] : []))
  return ids[randomInt(ids.length)]
}

/** The computers' moves until it is the player's turn: SkatZero's prepared plans for the auction and the
 *  skat, its cards from the models. */
function turn(policy: Policy, plans: Record<'1' | '2', SeatPlan>) {
  return (g: Game): Promise<Logged[]> => {
    const seat = actor(g)!
    return computerTurn(g, seat, plans[String(seat) as '1' | '2'], policy)
  }
}

export function freeRoutes(store: Store, admissionKey: string, ready: () => boolean, policy: () => Policy | null, pool: () => Pool | null) {
  const key = tokenKey(admissionKey)
  const router = express.Router()
  router.use(express.json({ limit: '64kb' }))
  router.use((req, res, nextHandler) => {
    if (!ready() || !policy() || !pool()) return void res.status(503).json({ error: 'not_ready' })
    if (!secretEquals(req.get('x-admission-key'), admissionKey)) return void res.status(403).json({ error: 'admission_denied' })
    nextHandler()
  })

  async function reply(p: Pool, id: number, t: number, log: Logged[], g: Game, steps: Game[]) {
    const d = p.deals[id]
    const plans = { '1': plan(d.computers['1']), '2': plan(d.computers['2']) }
    await advance(g, log, turn(policy()!, plans), steps)
    return { token: seal(key, { v: 1, pool: p.version, id, t, log }), steps: steps.map(seatView), revision: log.length, computer: p.version }
  }

  const run = (work: (body: unknown) => Promise<unknown>) => async (req: express.Request, res: express.Response) => {
    try {
      res.set('cache-control', 'no-store').json(await work(req.body))
    } catch (e) {
      if (e instanceof z.ZodError) res.status(400).json({ error: 'invalid_request' })
      else if (e instanceof Rejected) res.status(409).json({ error: e.message })
      else if (e instanceof ComputerFailed) {
        console.error(JSON.stringify({ event: 'free_computer_failed', reason: e.message }))
        res.status(503).json({ error: 'computer_unavailable' })
      } else {
        console.error('free_failed')
        res.status(503).json({ error: 'unavailable' })
      }
    }
  }

  // A new game; free play's round names the dealer of its next deal, so the deal goes round (SKATGO-88).
  const newInput = z.object({ dealer: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional() }).strict()
  router.post('/new', run(async (body) => {
    const i = newInput.parse(body ?? {})
    const p = pool()!
    const id = poolDealIndex(p, i.dealer)
    const d = p.deals[id]
    const g = deal(d.dealer, deckOf(d.deck))
    return reply(p, id, Date.now(), [], g, [g])
  }))

  const actInput = z.object({ token: z.string().max(20_000), revision: z.number().int().nonnegative(), action: actionSchema }).strict()
  /** A game's token opened and checked: this pool's, a deal it has, and not older than its lifetime. */
  function opened(token: string): { p: Pool; t: Token } {
    const p = pool()!
    const t = open(key, token)
    if (t.v !== 1 || t.pool !== p.version || !(t.id >= 0 && t.id < p.deals.length)) throw new Rejected('game_expired')
    if (Date.now() - t.t > TOKEN_MS) throw new Rejected('game_expired')
    return { p, t }
  }
  router.post('/act', run(async (body) => {
    const i = actInput.parse(body)
    if (i.action.type === 'start') throw new Rejected('illegal_action')
    const { p, t } = opened(i.token)
    if (i.revision !== t.log.length) throw new Rejected('stale_revision')
    const d = p.deals[t.id]
    let g = replayLog(d.dealer, deckOf(d.deck), t.log)
    if (actor(g) !== PLAYER) throw new Rejected('not_your_turn')
    refuseUnlawful(g, i.action as Move)
    g = applySeatMove(g, PLAYER, i.action as Move)
    t.log.push({ seat: PLAYER, move: i.action as Move })
    return reply(p, t.id, t.t, t.log, g, [g])
  }))

  const tokenInput = z.object({ token: z.string().max(20_000) }).strict()
  // A game as it stands, from its token (SKATGO-79): the page carries the token across a change of
  // language, which loads the page anew, and takes the game up where it was. No computer is asked.
  router.post('/resume', run(async (body) => {
    const i = tokenInput.parse(body)
    const { p, t } = opened(i.token)
    const d = p.deals[t.id]
    const g = replayLog(d.dealer, deckOf(d.deck), t.log)
    return { token: i.token, steps: [seatView(g)], revision: t.log.length, computer: p.version }
  }))
  // A finished game's replay and where SkatZero would have played another card (SKATGO-79), and the same
  // deal played by SkatZero in all three seats from the pool's plans — the AI in the player's seat
  // (SKATGO-86) — from the game's own token: worked out on request. A game all three passed has no play to
  // judge, but the AI in the player's seat may well have bid. When the web names a signed-in player, the deal
  // goes into their record of play (SKATGO-128): their Seeger-Fabian score and the AI's, once per game.
  const reviewInput = z.object({ token: z.string().max(20_000), player: z.string().regex(/^user:/).max(200).optional() }).strict()
  router.post('/review', run(async (body) => {
    const i = reviewInput.parse(body)
    const { p, t } = opened(i.token)
    const d = p.deals[t.id]
    const deck = deckOf(d.deck)
    const end = replayLog(d.dealer, deck, t.log)
    if (end.phase !== 'done' && end.phase !== 'passedIn') throw new Rejected('not_finished')
    const plans = { 0: plan(d.computers['0']), 1: plan(d.computers['1']), 2: plan(d.computers['2']) }
    const ai = await advance(deal(d.dealer, deck), [], (g) => computerTurn(g, actor(g)!, plans[actor(g)!], policy()!), undefined, true)
    if (ai.phase !== 'done' && ai.phase !== 'passedIn') throw new ComputerFailed('ai_unfinished')
    if (i.player) {
      const now = Date.now()
      await recordFreeDeal(store, {
        player: i.player, game: `free:${t.pool}:${t.id}:${t.t}`, day: dayOf(now), at: now,
        mine: seegerFabian(end), ai: seegerFabian(ai),
      })
    }
    return reviewOf(end, await judgePlays(policy()!, playsOf(d.dealer, deck, t.log)), { ai: summarize(ai), aiAuction: auctionOf(ai) })
  }))
  router.use((_err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(400).json({ error: 'invalid_request' })
  })
  return router
}
