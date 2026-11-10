import { randomBytes } from 'node:crypto'
import express from 'express'
import { z } from 'zod'
import { actor, deal, type Game, type Move } from '../../app/src/lib/skat/game'
import { DEAL_OF_DAY, PLAYER, auctionOf, seatView, summarize, type DealSummary } from '../../app/src/lib/skat/tournament'
import { cardPng } from './card'
import { ComputerFailed, type Logged, advance, judgePlays, playsOf, replayLog, reviewOf } from './computers'
import { type DealSpec, computerTurn, dayOf, ended } from './daily'
import { open, seal, tokenKey } from './free'
import { idsOf } from './profile'
import { actionSchema, applySeatMove, refuseUnlawful, Rejected, secretEquals, roomOnly } from './model'
import type { Policy } from './skatzero/policy'
import type { Store } from './store'

// Sharing the deal of the day (SKATGO-132, the human: 「分享出去要有精美的卡片，然后别人看到，点击就能也打这一副牌」): a
// finished entry gets a short code — the link carries the code, never the score, so no one can make a card say what
// was not played; the code reads back the day, the table's scores and who declared, never who played; the card is drawn from it;
// and whoever opens it plays the same deal — on its day as the day's deal, after it as practice: the day's deal
// replayed from a sealed token, nothing stored, on no board (「过期的牌开放练习」). The same practice is today's deal played
// again by whoever has finished it (SKATGO-177, the human: 「每天1deal的，应该也能复盘」), with the free replay's review.

/** The code's letters: lowercase and digits, eight of them. */
const CODE = /^[a-z0-9]{8}$/
const newCode = () => Array.from(randomBytes(8), (b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('')

/** The deal of the day's spec for a day, and the AI's game of it from the player's seat. */
/** A day's deal: the deal of the day, or since SKATGO-182 any deal of that day's tournament of `size`. */
async function dealOfDay(store: Store, day: string, size = DEAL_OF_DAY, n = 0): Promise<{ spec: DealSpec; computer: string } | null> {
  const { rows } = await store.pool.query('SELECT deals, computer FROM daily_deals WHERE day = $1 AND size = $2', [day, size])
  const spec = (rows[0]?.deals as DealSpec[] | undefined)?.[n]
  return spec ? { spec, computer: rows[0].computer } : null
}

/** Whether the person has played deal `n` of the day's tournament of `size` to its end, under any of their ids. */
async function playedDeal(store: Store, who: string, day: string, size: number, n: number): Promise<boolean> {
  const { rows } = await store.pool.query(
    'SELECT 1 FROM daily_entries WHERE day = $1 AND size = $2 AND player = ANY($3) AND jsonb_array_length(deals) > $4', [day, size, await idsOf(store, who), n])
  return rows.length > 0
}

/** Whether the player has finished the deal of the day of `day`. */
async function finishedDealOfDay(store: Store, who: string, day: string): Promise<boolean> {
  const { rows } = await store.pool.query('SELECT finished_at FROM daily_entries WHERE day = $1 AND size = $2 AND player = $3', [day, DEAL_OF_DAY, who])
  return !!rows[0]?.finished_at
}

/** The code of the player's finished deal of today, made on the first ask: the table's scores and who declared. */
export async function shareCode(store: Store, who: string, now = Date.now()): Promise<{ code: string }> {
  const day = dayOf(now)
  const { rows: entry } = await store.pool.query(
    'SELECT deals, finished_at FROM daily_entries WHERE day = $1 AND size = $2 AND player = $3', [day, DEAL_OF_DAY, who])
  if (!entry[0]?.finished_at) throw new Rejected('not_finished')
  const { rows: had } = await store.pool.query('SELECT code FROM dod_shares WHERE day = $1 AND player = $2', [day, who])
  if (had[0]) return { code: had[0].code }
  const summary = (entry[0].deals as DealSummary[])[0]
  await store.pool.query(
    'INSERT INTO dod_shares (code, day, player, scores, declarer, created_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (day, player) DO NOTHING',
    [newCode(), day, who, JSON.stringify(summary.scores), summary.declarer, now])
  const { rows } = await store.pool.query('SELECT code FROM dod_shares WHERE day = $1 AND player = $2', [day, who])
  return { code: rows[0].code }
}

export type Shared = { day: string; scores: [number, number, number]; declarer: 0 | 1 | 2 | null; today: boolean }

/** What a code shares: the day, the table's scores, who declared, and whether that day is today. Never who played. */
export async function sharedOf(store: Store, code: string, now = Date.now()): Promise<Shared> {
  const { rows } = await store.pool.query('SELECT day, scores, declarer FROM dod_shares WHERE code = $1', [code])
  if (!rows[0]) throw new Rejected('no_such_share')
  return { day: rows[0].day, scores: rows[0].scores, declarer: rows[0].declarer, today: rows[0].day === dayOf(now) }
}

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')
const WORDS = {
  de: { slogan: 'Skat kostenlos spielen und besser werden', deal: '1 Spiel heute · 2 Min.', me: 'Ich', seats: ['Lina', 'Noah'], declarer: 'Alleinspieler', challenge: 'Gleiche Karten – wie viele Punkte holst du?' },
  en: { slogan: 'Free Skat play and progress', deal: '1 deal today · 2 min', me: 'Me', seats: ['Lina', 'Noah'], declarer: 'Declarer', challenge: 'Same cards – what will you score?' },
} as const

/** The card of a code, in a language: the three seats' scores, the declarer's marked. */
export async function shareCard(store: Store, code: string, lang: 'de' | 'en'): Promise<Buffer> {
  const s = await sharedOf(store, code)
  const w = WORDS[lang]
  const date = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${s.day}T00:00:00Z`))
  return cardPng(`${code}|${lang}`, {
    slogan: w.slogan,
    deal: w.deal,
    date,
    score: signed(s.scores[PLAYER]),
    rows: [w.me, ...w.seats].map((name, seat) => ({ name, score: signed(s.scores[seat]), me: seat === PLAYER, declarer: seat === s.declarer })),
    declarer: w.declarer,
    challenge: w.challenge,
    site: 'skatgo.com',
  })
}

/** A practice game: which day's deal — the deal of the day, or deal `n` of that day's tournament of `size` (SKATGO-182) —
 *  when it began, every move so far. */
type Practice = { v: 1; day: string; t: number; log: Logged[]; size?: number; n?: number }

export function shareRoutes(store: Store, admissionKey: string, ready: () => boolean, policy: () => Policy | null) {
  const key = tokenKey(admissionKey, 'skatgo-practice/1')
  const router = express.Router()
  router.use(express.json({ limit: '64kb' }))
  router.use((req, res, nextHandler) => {
    if (!ready() || !policy()) return void res.status(503).json({ error: 'not_ready' })
    if (!secretEquals(req.get('x-admission-key'), admissionKey)) return void res.status(403).json({ error: 'admission_denied' })
    nextHandler()
  })
  const run = (work: (body: unknown) => Promise<unknown>) => async (req: express.Request, res: express.Response) => {
    try {
      res.set('cache-control', 'no-store').json(await work(req.body))
    } catch (e) {
      if (e instanceof z.ZodError) res.status(400).json({ error: 'invalid_request' })
      else if (e instanceof Rejected) res.status(e.message === 'no_such_share' ? 404 : 409).json({ error: e.message })
      else if (e instanceof ComputerFailed) res.status(503).json({ error: 'computer_unavailable' })
      else {
        console.error(JSON.stringify({ event: 'share_failed', reason: e instanceof Error ? e.message : String(e) }))
        res.status(503).json({ error: 'unavailable' })
      }
    }
  }
  const player = z.string().regex(/^(user:[A-Za-z0-9_]{1,64}|anon:[a-f0-9]{64})$/)
  const code = z.string().regex(CODE)
  router.post('/code', run(async (body) => shareCode(store, z.object({ player }).strict().parse(body).player)))
  router.post('/read', run(async (body) => sharedOf(store, z.object({ code }).strict().parse(body).code)))
  router.post('/card', async (req, res) => {
    const i = z.object({ code, lang: z.enum(['de', 'en']) }).strict().safeParse(req.body)
    if (!i.success) return void res.status(400).json({ error: 'invalid_request' })
    try {
      res.set('content-type', 'image/png').set('cache-control', 'public, max-age=86400').send(await shareCard(store, i.data.code, i.data.lang))
    } catch (e) {
      res.status(e instanceof Rejected ? 404 : 503).json({ error: e instanceof Rejected ? e.message : 'unavailable' })
    }
  })

  /** The practice game as the player sees it: each state the move went through, the token to go on with, and once
   *  it is over the deal's result beside the AI's. */
  async function reply(day: string, t: number, log: Logged[], g: Game, steps: Game[], spec: DealSpec, computer: string, which: { size?: number; n?: number } = {}) {
    if (!ended(g) && actor(g) !== PLAYER) g = await advance(g, log, (x) => computerTurn(x, policy()!, spec, computer), steps)
    const over = ended(g)
    return {
      token: seal<Practice>(key, { v: 1, day, t, log, ...which }),
      steps: steps.map(seatView),
      revision: log.length,
      result: over ? { mine: summarize(g), ai: (spec.benchmark?.summary ?? null) as DealSummary | null } : null,
    }
  }
  /** A past day's deal of the day, dealt anew for practice. Today's is played as the day's own, ranked — and again, once
   *  the asking player has finished it, as practice (「每天1deal的，应该也能复盘」): nobody plays it first unranked.
   *  A deal of another tournament, from the record of play (SKATGO-182, 「想点此处的复牌，必须登录」): only for an account
   *  that has played it — so no one sees a tournament's cards before playing them. */
  router.post('/practice/new', run(async (body) => {
    const { day, player: who, size, deal: n } = z.object({
      day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), player: player.optional(),
      size: z.number().int().min(1).max(99).optional(), deal: z.number().int().min(0).max(98).optional(),
    }).strict().parse(body)
    const today = dayOf(Date.now())
    if (size !== undefined && size !== DEAL_OF_DAY) {
      if (!who?.startsWith('user:') || n === undefined || !(await playedDeal(store, who, day, size, n))) throw new Rejected('not_played')
      const found = await dealOfDay(store, day, size, n)
      if (!found) throw new Rejected('no_such_day')
      const g = deal(found.spec.dealer, found.spec.deck)
      return reply(day, Date.now(), [], g, [g], found.spec, found.computer, { size, n })
    }
    if (day > today || (day === today && !(who && (await finishedDealOfDay(store, who, day))))) throw new Rejected('not_past')
    const found = await dealOfDay(store, day)
    if (!found) throw new Rejected('no_such_day')
    const g = deal(found.spec.dealer, found.spec.deck)
    return reply(day, Date.now(), [], g, [g], found.spec, found.computer)
  }))
  router.post('/practice/act', run(async (body) => {
    const i = z.object({ token: z.string().max(20_000), revision: z.number().int().nonnegative(), action: actionSchema }).strict().parse(body)
    if (roomOnly(i.action)) throw new Rejected('illegal_action')
    const t = open<Practice>(key, i.token)
    if (t.v !== 1 || i.revision !== t.log.length) throw new Rejected('stale_revision')
    const found = await dealOfDay(store, t.day, t.size, t.n)
    if (!found) throw new Rejected('no_such_day')
    let g = replayLog(found.spec.dealer, found.spec.deck, t.log)
    if (actor(g) !== PLAYER) throw new Rejected('not_your_turn')
    refuseUnlawful(g, i.action as Move)
    g = applySeatMove(g, PLAYER, i.action as Move)
    t.log.push({ seat: PLAYER, move: i.action as Move })
    return reply(t.day, t.t, t.log, g, [g], found.spec, found.computer, { size: t.size, n: t.n })
  }))
  /** A finished practice game's review, as free play's replay keeps it (SKATGO-170): the player's cards against SkatZero's
   *  choice, and the AI's game of the deal from their seat. Nothing is recorded. */
  router.post('/practice/review', run(async (body) => {
    const i = z.object({ token: z.string().max(20_000) }).strict().parse(body)
    const t = open<Practice>(key, i.token)
    if (t.v !== 1) throw new Rejected('stale_revision')
    const found = await dealOfDay(store, t.day, t.size, t.n)
    if (!found) throw new Rejected('no_such_day')
    const { dealer, deck, benchmark } = found.spec
    const end = replayLog(dealer, deck, t.log)
    if (!ended(end)) throw new Rejected('not_finished')
    return reviewOf(end, await judgePlays(policy()!, playsOf(dealer, deck, t.log)), {
      ai: benchmark?.summary ?? null,
      aiAuction: benchmark ? auctionOf(replayLog(dealer, deck, benchmark.log)) : null,
    })
  }))
  return router
}
