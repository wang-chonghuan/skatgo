import { shuffle } from '../../../app/src/lib/skat/cards'
import type pg from 'pg'
import { type DealSpec, COMPUTER, dayOf } from '../daily'
import { deckOf, plan, type Pool } from '../free'
import { skatOrHand } from '../skatzero/bidding'
import { type Policy } from '../skatzero/policy'
import { type Store } from '../store'
import { type Roster, random, rosterHash } from './config'
import { reservePopulation } from './control'
import { type Activity, planDay } from './schedule'
import { playGame, resultOf, simulateDeal, type ActivityResult, type GameResult, type SimDeal } from './play'

const RUN_LOCK = 7392040
export const CATCHUP_MS = 30 * 60_000
type Job = { snapshot: Activity; free_index: number | null; pool_version: string | null; attempts: number }
type Options = {
  maxActivities?: number; budgetMs?: number; futureOnly?: boolean;
  guard?: (c: pg.PoolClient) => Promise<void>;
}

export class PersonaRunner {
  private active: Promise<void> | null = null
  private closed = false
  private planned = ''
  constructor(private store: Store, private policy: Policy, private pool: Pool, private source: Roster | (() => Roster),
    private allowed: () => boolean, private now = Date.now, private options: Options = {}) {}

  tick(): Promise<void> {
    if (this.closed || !this.allowed()) return Promise.resolve()
    this.active ??= this.run().finally(() => { this.active = null })
    return this.active
  }
  async stop() { this.closed = true; await this.active }

  private async run() {
    const day = dayOf(this.now())
    const roster = typeof this.source === 'function' ? this.source() : this.source
    const players = roster.personas.map((p) => `sim:${p.id}`)
    const started = performance.now()
    const lock = await this.store.pool.connect()
    let lost = false
    const onLost = () => { lost = true }
    lock.on('error', onLost)
    let locked = false
    const alive = () => !lost && !this.closed && this.allowed() && dayOf(this.now()) === day
    try {
      locked = (await lock.query('SELECT pg_try_advisory_lock($1) AS locked', [RUN_LOCK])).rows[0].locked
      if (!locked || !alive()) return
      const key = `${day}|${rosterHash(roster)}`
      if (this.planned !== key) {
        const activities = planDay(roster, day).filter((a) => !this.options.futureOnly || a.start >= this.now())
        await this.store.transaction(async (c) => {
          if (!alive()) throw new Error('persona_cancelled')
          await this.options.guard?.(c)
          await reservePopulation(c, roster, this.now())
          await c.query(
            `INSERT INTO persona_jobs (player,day,slot,size,due,snapshot)
               SELECT a->>'player',a->>'day',a->>'slot',(a->>'size')::int,(a->>'due')::bigint,a
               FROM jsonb_array_elements($1::jsonb) AS a
               WHERE NOT EXISTS (SELECT 1 FROM persona_jobs j WHERE j.player=a->>'player' AND j.day=a->>'day')
               ON CONFLICT DO NOTHING`, [JSON.stringify(activities)])
        })
        this.planned = key
      }
      for (let n = 0; n < (this.options.maxActivities ?? 1) && alive(); n++) {
        if (n > 0 && performance.now() - started >= (this.options.budgetMs ?? 5000)) break
        const { rows } = await this.store.pool.query(
          `SELECT snapshot, free_index, pool_version, attempts FROM persona_jobs j
            WHERE day=$1 AND due BETWEEN $3 AND $2 AND result IS NULL AND attempts<3 AND retry_at<=$2
              AND player=ANY($4::text[])
              AND (size=0 OR EXISTS (SELECT 1 FROM daily_deals d WHERE d.day=j.day AND d.size=j.size))
            ORDER BY due, player, slot LIMIT 1`, [day, this.now(), this.now() - CATCHUP_MS, players])
        const job = rows[0] as Job | undefined
        if (!job || !alive()) return
        const a = job.snapshot
        try {
          const result = await this.execute(job, alive)
          if (!result || !alive()) return
          await this.store.transaction(async (c) => {
            if (!alive()) throw new Error('persona_cancelled')
            await this.options.guard?.(c)
            await c.query(
              `UPDATE persona_jobs SET result=$4, completed_at=$5, error=NULL
                WHERE player=$1 AND day=$2 AND slot=$3 AND result IS NULL`,
              [a.player, a.day, a.slot, JSON.stringify(result), this.now()])
            if (!alive()) throw new Error('persona_cancelled')
          })
          console.log(JSON.stringify({ event: 'persona_completed', player: a.player, day, slot: a.slot,
            msLate: this.now() - a.due, deals: result.games.length, total: result.total }))
        } catch (e) {
          if (!alive()) return
          const reason = e instanceof Error ? e.message : 'persona_failed'
          if (reason === 'persona_control_changed') return
          await this.store.transaction(async (c) => {
            await this.options.guard?.(c)
            await c.query(
              `UPDATE persona_jobs SET attempts=attempts+1, error=$4, retry_at=$5
                WHERE player=$1 AND day=$2 AND slot=$3 AND result IS NULL`,
              [a.player, a.day, a.slot, reason, this.now() + (job.attempts + 1) * 5 * 60_000])
          })
          console.error(JSON.stringify({ event: 'persona_failed', player: a.player, day, slot: a.slot, reason }))
        }
        await new Promise<void>((resolve) => setImmediate(resolve))
      }
    } finally {
      if (locked && !lost) await lock.query('SELECT pg_advisory_unlock($1)', [RUN_LOCK]).catch(() => { lost = true })
      lock.removeListener('error', onLost)
      lock.release(lost)
    }
  }

  private async execute(job: Job, alive: () => boolean): Promise<ActivityResult | null> {
    const a = job.snapshot
    if (a.size !== 0) {
      const { rows } = await this.store.pool.query('SELECT deals, computer FROM daily_deals WHERE day=$1 AND size=$2', [a.day, a.size])
      if (!rows[0]) return null
      if (rows[0].computer !== COMPUTER) throw new Error('persona_unsupported_daily_policy')
      const specs = rows[0].deals as DealSpec[]
      if (specs.length !== a.size || specs.some((s) => !s.computers || !s.benchmark)) throw new Error('persona_daily_incomplete')
      const games: GameResult[] = []
      for (const [i, s] of specs.entries()) {
        if (!alive()) throw new Error('persona_cancelled')
        const opponents: SimDeal['opponents'] = [s.computers!['1'], s.computers!['2']].map((b) =>
          ({ maxBid: b.maxBid, skatOrHand: (bid: number) => skatOrHand(b, bid) })) as SimDeal['opponents']
        games.push(await simulateDeal(this.policy, { dealer: s.dealer, deck: s.deck, opponents }, a.persona,
          `${a.seed}|${i}`, s.benchmark!.summary, undefined, alive))
      }
      return resultOf(games)
    }
    if (job.free_index === null) {
      const used = await this.store.pool.query(
        'SELECT free_index FROM persona_jobs WHERE player=$1 AND pool_version=$2 AND free_index IS NOT NULL', [a.player, this.pool.version])
      const taken = new Set(used.rows.map((r) => r.free_index as number))
      const index = shuffle(this.pool.deals.map((_, i) => i), random(`${a.seed}|pool`)).find((i) => !taken.has(i))
      if (index === undefined) throw new Error('persona_pool_exhausted')
      await this.store.transaction(async (c) => {
        await this.options.guard?.(c)
        await c.query('UPDATE persona_jobs SET free_index=$4, pool_version=$5 WHERE player=$1 AND day=$2 AND slot=$3',
          [a.player, a.day, a.slot, index, this.pool.version])
      })
      job.free_index = index
      job.pool_version = this.pool.version
    }
    if (job.pool_version !== this.pool.version) throw new Error('persona_pool_version_changed')
    const s = this.pool.deals[job.free_index]
    if (!s) throw new Error('persona_pool_missing')
    const spec: SimDeal = { dealer: s.dealer, deck: deckOf(s.deck), opponents: [plan(s.computers['1']), plan(s.computers['2'])] }
    // The free-play benchmark uses the pool's standard seat-0 plan, just like its real review.
    const ai = (await playGame(this.policy, spec, plan(s.computers['0']), this.policy, alive)).summary
    return resultOf([await simulateDeal(this.policy, spec, a.persona, a.seed, ai, undefined, alive)])
  }
}
