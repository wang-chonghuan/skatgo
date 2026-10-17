import express from 'express'
import type pg from 'pg'
import { z } from 'zod'
import { LADDER_FREE } from '../../app/src/lib/skat/tricks/exercises/ladder'
import { OPEN_STORED } from '../../app/src/lib/skat/tricks/exercises/open-endgames.data'
import { Rejected, secretEquals } from './model'
import type { Store } from './store'

// The "Sieg sichern" ladder's record (SKATGO-109, the human: 「要记下来哪题错了」): for every step an account
// has answered, whether it has answered it right and how many times wrong. A wrong step can be answered
// again; its misses stay. The web service calls these routes with the admission key and names the player —
// only a signed-in account (`user:<Clerk id>`): from the third step on the ladder needs one, and the first
// steps a guest answered stay in that browser until it signs in, when they are merged in here.

// Since SKATGO-110 the steps are the open-card endgames', the only exercises the site shows.
const STEPS = OPEN_STORED.map((s) => s.id)
const FREE = new Set(STEPS.slice(0, LADDER_FREE))
/** Enough for any honest count; a number on a row, not a score. */
const MAX_MISSES = 999

export type StepRecord = { solved: boolean; misses: number }

const player = z.string().regex(/^user:[A-Za-z0-9_]{1,64}$/)
const step = z.string().refine((s) => STEPS.includes(s))
const stateInput = z.object({ player }).strict()
const answerInput = z.object({ player, step, right: z.boolean() }).strict()
// What a guest answered in the browser: the free steps only, as that browser counted them.
const mergeInput = z.object({
  player,
  steps: z.record(z.string().refine((s) => FREE.has(s)), z.object({ solved: z.boolean(), misses: z.number().int().min(0).max(MAX_MISSES) }).strict()),
}).strict()

async function stepsOf(c: pg.PoolClient | pg.Pool, who: string): Promise<Record<string, StepRecord>> {
  const { rows } = await c.query('SELECT step, solved_at, misses FROM ladder_answers WHERE player = $1', [who])
  return Object.fromEntries(rows.map((r) => [r.step, { solved: r.solved_at !== null, misses: r.misses }]))
}

/** One answer: a right one marks the step solved for good, a wrong one adds a miss. */
export async function ladderAnswer(store: Store, who: string, id: string, right: boolean, now = Date.now()) {
  return store.transaction(async (c) => {
    await c.query(
      `INSERT INTO ladder_answers (player, step, solved_at, misses, updated_at) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (player, step) DO UPDATE SET solved_at = COALESCE(ladder_answers.solved_at, EXCLUDED.solved_at),
         misses = LEAST(ladder_answers.misses + EXCLUDED.misses, ${MAX_MISSES}), updated_at = EXCLUDED.updated_at`,
      [who, id, right ? now : null, right ? 0 : 1, now],
    )
    return stepsOf(c, who)
  })
}

/** A guest's free steps join the account's: solved if either says so, the larger count of misses — so
 *  sending the same browser's record twice changes nothing. */
export async function ladderMerge(store: Store, who: string, steps: Record<string, StepRecord>, now = Date.now()) {
  return store.transaction(async (c) => {
    for (const [id, r] of Object.entries(steps)) {
      await c.query(
        `INSERT INTO ladder_answers (player, step, solved_at, misses, updated_at) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (player, step) DO UPDATE SET solved_at = COALESCE(ladder_answers.solved_at, EXCLUDED.solved_at),
           misses = GREATEST(ladder_answers.misses, EXCLUDED.misses), updated_at = EXCLUDED.updated_at`,
        [who, id, r.solved ? now : null, r.misses, now],
      )
    }
    return stepsOf(c, who)
  })
}

/** The routes, behind the admission key. Each answers with the account's whole record. */
export function ladderRoutes(store: Store, key: string, ready: () => boolean) {
  const router = express.Router()
  router.use(express.json({ limit: '16kb' }))
  router.use((req, res, nextHandler) => {
    if (!ready()) return void res.status(503).json({ error: 'not_ready' })
    if (!secretEquals(req.get('x-admission-key'), key)) return void res.status(403).json({ error: 'admission_denied' })
    nextHandler()
  })
  const run = (work: (body: unknown) => Promise<Record<string, StepRecord>>) => async (req: express.Request, res: express.Response) => {
    try {
      res.set('cache-control', 'no-store').json({ steps: await work(req.body) })
    } catch (e) {
      if (e instanceof z.ZodError) res.status(400).json({ error: 'invalid_request' })
      else if (e instanceof Rejected) res.status(409).json({ error: e.message })
      else {
        console.error('ladder_storage_unavailable')
        res.status(503).json({ error: 'storage_unavailable' })
      }
    }
  }
  router.post('/state', run(async (body) => stepsOf(store.pool, stateInput.parse(body).player)))
  router.post('/answer', run(async (body) => {
    const i = answerInput.parse(body)
    return ladderAnswer(store, i.player, i.step, i.right)
  }))
  router.post('/merge', run(async (body) => {
    const i = mergeInput.parse(body)
    return ladderMerge(store, i.player, i.steps)
  }))
  router.use((_err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(400).json({ error: 'invalid_request' })
  })
  return router
}
