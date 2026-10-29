import express from 'express'
import type pg from 'pg'
import { z } from 'zod'
import { type Answered, FREE_IDS, numberOf, offered, PRACTICE_QUESTIONS, rightAnswer } from '../../app/src/lib/skat/bidding/practice'
import { Rejected, secretEquals } from './model'
import type { Store } from './store'

// The bidding practice's record (SKATGO-150, the human: 「用户能记录下来他哪个题出错了吗」): per account and question the
// first answer given — the analysis counts it alone — and whether a later answer got it right, which clears it from the
// mistakes. The web service calls these routes with the admission key and names the player, a signed-in account only;
// a guest's answers to the free questions stay in that browser until it signs in, when they are merged in here.

const player = z.string().regex(/^user:[A-Za-z0-9_]{1,64}$/)
const question = z.string().refine((s) => numberOf(s) !== undefined)
const chosen = z.number().int().min(0).max(999)
const stateInput = z.object({ player }).strict()
const answerInput = z.object({ player, question, chosen }).strict()
const mergeInput = z.object({
  player,
  questions: z.record(z.string().refine((s) => FREE_IDS.includes(s)), z.object({ first: chosen, fixed: z.boolean() }).strict()),
}).strict()

const practiceOf = (id: string) => PRACTICE_QUESTIONS[numberOf(id)! - 1]

async function recordOf(c: pg.PoolClient | pg.Pool, who: string): Promise<Record<string, Answered>> {
  const { rows } = await c.query('SELECT question, first, fixed FROM bidding_answers WHERE player = $1', [who])
  return Object.fromEntries(rows.map((r) => [r.question, { first: r.first, fixed: r.fixed }]))
}

/** One answer: the first one stays as given; a later right one marks the question fixed. */
export async function biddingAnswer(store: Store, who: string, id: string, answer: number, now = Date.now()) {
  const p = practiceOf(id)
  if (!offered(p, answer)) throw new Rejected('not_offered')
  const right = answer === rightAnswer(p)
  return store.transaction(async (c) => {
    await c.query(
      `INSERT INTO bidding_answers (player, question, first, fixed, answered_at, updated_at) VALUES ($1, $2, $3, false, $4, $4)
       ON CONFLICT (player, question) DO UPDATE SET fixed = bidding_answers.fixed OR $5, updated_at = $4`,
      [who, id, answer, now, right],
    )
    return recordOf(c, who)
  })
}

/** A guest's answers join the account's: an answer the account already has stays, fixed if either says so — so sending
 *  the same browser's record twice changes nothing. */
export async function biddingMerge(store: Store, who: string, questions: Record<string, Answered>, now = Date.now()) {
  for (const [id, r] of Object.entries(questions)) if (!offered(practiceOf(id), r.first)) throw new Rejected('not_offered')
  return store.transaction(async (c) => {
    for (const [id, r] of Object.entries(questions)) {
      await c.query(
        `INSERT INTO bidding_answers (player, question, first, fixed, answered_at, updated_at) VALUES ($1, $2, $3, $4, $5, $5)
         ON CONFLICT (player, question) DO UPDATE SET fixed = bidding_answers.fixed OR EXCLUDED.fixed, updated_at = $5`,
        [who, id, r.first, r.fixed, now],
      )
    }
    return recordOf(c, who)
  })
}

/** The routes, behind the admission key. Each answers with the account's whole record. */
export function biddingRoutes(store: Store, key: string, ready: () => boolean) {
  const router = express.Router()
  router.use(express.json({ limit: '16kb' }))
  router.use((req, res, nextHandler) => {
    if (!ready()) return void res.status(503).json({ error: 'not_ready' })
    if (!secretEquals(req.get('x-admission-key'), key)) return void res.status(403).json({ error: 'admission_denied' })
    nextHandler()
  })
  const run = (work: (body: unknown) => Promise<Record<string, Answered>>) => async (req: express.Request, res: express.Response) => {
    try {
      res.set('cache-control', 'no-store').json({ questions: await work(req.body) })
    } catch (e) {
      if (e instanceof z.ZodError) res.status(400).json({ error: 'invalid_request' })
      else if (e instanceof Rejected) res.status(409).json({ error: e.message })
      else {
        console.error('bidding_storage_unavailable')
        res.status(503).json({ error: 'storage_unavailable' })
      }
    }
  }
  router.post('/state', run(async (body) => recordOf(store.pool, stateInput.parse(body).player)))
  router.post('/answer', run(async (body) => {
    const i = answerInput.parse(body)
    return biddingAnswer(store, i.player, i.question, i.chosen)
  }))
  router.post('/merge', run(async (body) => {
    const i = mergeInput.parse(body)
    return biddingMerge(store, i.player, i.questions)
  }))
  router.use((_err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(400).json({ error: 'invalid_request' })
  })
  return router
}
