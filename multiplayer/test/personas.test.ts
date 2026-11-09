import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { createServer } from 'node:http'
import express from 'express'
import pg from 'pg'
import { sameCard } from '../../app/src/lib/skat/cards'
import { xpOf } from '../../app/src/lib/skat/xp'
import { dailyBoard, dailyName, dailyRoutes, COMPUTER, dayOf, prepareDay } from '../src/daily'
import { loadPool } from '../src/free'
import { replayLog } from '../src/computers'
import { summarize } from '../../app/src/lib/skat/tournament'
import { playProfile } from '../src/profile'
import { loadPolicy, type Policy, type PlayerView } from '../src/skatzero/policy'
import { skatOrHand } from '../src/skatzero/bidding'
import { Store } from '../src/store'
import { xpBoard } from '../src/xp'
import { enabled, population, populationCount, random, roster, rosterSchema, type Roster } from '../src/personas/config'
import { cleanNickname } from '../../app/src/lib/skat/nickname'
import { dayMinutes, offsetDay, planDay } from '../src/personas/schedule'
import { personaPolicy, simulateDeal, type ActivityResult, type SimDeal } from '../src/personas/play'
import { PersonaRunner } from '../src/personas/runner'
import { PersonaService } from '../src/personas/service'
import { configureControl, readControl, serviceStatus, assertControl } from '../src/personas/control'

test('personas: 17 starters expand to 500 stable, distinct profiles and valid original names', () => {
  assert.equal(roster.personas.length, 17)
  const full = population(500)
  for (const n of [17, 100, 200, 300, 400, 500]) {
    const r = population(n)
    assert.deepEqual(r.personas, full.personas.slice(0, n))
    assert.equal(r.personas.length, n)
  }
  assert.equal(new Set(full.personas.map((p) => p.nickname.toLowerCase())).size, 500)
  assert(full.personas.every((p) => cleanNickname(p.nickname) === p.nickname))
  assert.equal(new Set(full.personas.map((p) => JSON.stringify(p.play))).size, 500)
  assert.equal(new Set(full.personas.map((p) => JSON.stringify(p.activity))).size, 500)
  for (const n of ['0', '501', '-1', '17.5', '', '17people']) assert.throws(() => populationCount(n))
  const small = planDay(population(17), '2026-11-09')
  const large = planDay(full, '2026-11-09').filter((j) => roster.personas.some((p) => j.player === `sim:${p.id}`))
  assert.deepEqual(small.map(({ configHash, ...j }) => j), large.map(({ configHash, ...j }) => j))
  for (const day of ['2026-03-29', '2026-10-25']) {
    const jobs = planDay(full, day)
    for (const p of full.personas) {
      const own = jobs.filter((j) => j.player === `sim:${p.id}`).sort((a, b) => a.start - b.start)
      for (const [i, j] of own.entries()) {
        assert.equal(dayOf(j.start), day)
        assert.equal(dayOf(j.due), day)
        assert(j.start < j.due)
        if (i) assert(own[i - 1].due < j.start)
      }
    }
  }
})

test('personas: reject invalid config and controls; randomness has independent reproducible streams', () => {
  assert.equal(enabled(), false)
  assert.equal(enabled('1'), true)
  assert.equal(enabled('0'), false)
  assert.throws(() => enabled('true'))
  const a = random('a'), b = random('a'), c = random('c')
  assert.deepEqual(Array.from({ length: 20 }, a), Array.from({ length: 20 }, b))
  assert.notEqual(random('a')(), c())
  assert.throws(() => rosterSchema.parse({ ...roster, personas: [] }))
  assert.throws(() => rosterSchema.parse({ ...roster, personas: [roster.personas[0], roster.personas[0]] }))
  for (const patch of [
    { activity: { ...roster.personas[0].activity, zone: 'No/SuchPlace' } },
    { play: { ...roster.personas[0].play, mistake: 1.1 } },
    { activity: { ...roster.personas[0].activity, windows: [{ start: 60, end: 60, weight: 1 }] } },
    { activity: { ...roster.personas[0].activity, free: [4, 2] } },
    { targetScore: 100 },
  ]) assert.throws(() => rosterSchema.parse({ ...roster, personas: [{ ...roster.personas[0], ...patch }] }))
})

test('personas: schedules reproduce, spread attendance and handle overnight/DST boundaries', () => {
  assert.equal(dayMinutes('2026-03-29').length, 23 * 60)
  assert.equal(dayMinutes('2026-10-25').length, 25 * 60)
  assert.throws(() => dayMinutes('2026-02-30'))
  const generate = () => Array.from({ length: 30 }, (_, i) => planDay(roster, offsetDay('2026-11-09', i))).flat()
  const first = generate()
  assert.deepEqual(generate(), first)
  assert(first.length > 100)
  assert.equal(new Set(first.map((j) => `${j.player}|${j.day}|${j.slot}`)).size, first.length)
  assert(new Set(first.map((j) => j.due)).size > first.length * 0.95)
  for (const p of roster.personas) {
    const own = first.filter((j) => j.player === `sim:${p.id}`)
    const days = new Set(own.map((j) => j.day)).size
    assert(days > 0 && days < 30)
  }
  for (const day of ['2026-03-08', '2026-03-29', '2026-10-25', '2026-11-01']) {
    const r: Roster = { ...roster, personas: roster.personas.map((p) => ({ ...p,
      activity: { ...p.activity, weekday: 1, weekend: 1, quiet: 0 } })) }
    const jobs = planDay(r, day)
    assert(jobs.length)
    for (const j of jobs) {
      assert.equal(dayOf(j.due), day)
      const clock = new Intl.DateTimeFormat('en-GB', { timeZone: j.persona.activity.zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(j.due)
      const [h, m] = clock.split(':').map(Number), n = h * 60 + m
      assert(j.persona.activity.windows.some((w) => w.start < w.end ? n >= w.start && n < w.end : n >= w.start || n < w.end))
    }
  }
})

test('personas: ranked is hand ordered; choose alone changes, ties are not errors and evaluation runs once', async () => {
  const p = roster.personas[0]
  const cards = [{ suit: 'C', rank: '7' }, { suit: 'D', rank: 'A' }, { suit: 'S', rank: '9' }] as PlayerView['hand']
  const view: PlayerView = { hand: cards, contract: { kind: 'grand' }, me: 0, trace: [], skat: [], points: [0, 0], handGame: false, openCards: null }
  let calls = 0
  const base = { ranked: async () => { calls++; return cards.map((card, i) => ({ card, value: [1, 10, 9][i] })) },
    choose: async () => { throw new Error('must not double evaluate') }, release: async () => { throw new Error('must not release shared resources') } } as unknown as Policy
  const precise = { ...p, play: { ...p.play, mistake: 0, form: 0, nullWeakness: 0 } }
  const wrapped = personaPolicy(base, precise, 'test')
  assert(sameCard(await wrapped.choose(view), cards[1]))
  assert.equal(calls, 1)
  assert.equal(wrapped.ranked, base.ranked)
  await wrapped.release()
  const stats = { choices: 0, deviations: 0 }
  const weak = personaPolicy(base, { ...precise, play: { ...precise.play, mistake: 1 } }, 'test', stats)
  assert(!sameCard(await weak.choose(view), cards[1]))
  assert.equal(stats.deviations, 1)
  const tied = { ...base, ranked: async () => cards.map((card) => ({ card, value: 1 })) }
  const noError = { choices: 0, deviations: 0 }
  assert(sameCard(await personaPolicy(tied, p, 'tie', noError).choose(view), cards[0]))
  assert.equal(noError.deviations, 0)
})

test('personas: real games, complete boards, XP, idempotence, cancellation and real-player isolation', { timeout: 180_000 }, async (t) => {
  const base = new URL(process.env.DATABASE_URL || '')
  assert(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname), 'Tests refuse external databases')
  const admin = new pg.Pool({ connectionString: base.href })
  const db = `skatgo_personas_${randomBytes(6).toString('hex')}`
  await admin.query(`CREATE DATABASE "${db}"`)
  base.pathname = `/${db}`
  const store = new Store(base.href)
  let policy: Policy | null = null
  let http: ReturnType<typeof createServer> | null = null
  t.after(async () => {
    await new Promise<void>((resolve) => http ? http.close(() => resolve()) : resolve())
    await policy?.release()
    await store.close()
    await admin.query(`DROP DATABASE "${db}" WITH (FORCE)`)
    await admin.end()
  })
  await store.migrate()
  assert(await store.acquire(() => {}))
  const dir = new URL('../skatzero/', import.meta.url)
  policy = await loadPolicy(dir)
  const pool = await loadPool(dir, { odds: false })
  const day = dayOf(Date.now())
  await prepareDay(store, policy, day)
  // Use a genuinely prepared deal for size 1; selection-quality is owned by pick.ts, not this integration.
  const specs = (await store.pool.query('SELECT deals FROM daily_deals WHERE day=$1 AND size=6', [day])).rows[0].deals
  await store.pool.query('INSERT INTO daily_deals (day,size,deals,computer) VALUES ($1,1,$2,$3)', [day, JSON.stringify([specs[0]]), COMPUTER])
  const real = 'user:persona_test_human'
  await dailyName(store, real, 'RealPlayer')
  await store.pool.query(
    'INSERT INTO daily_entries (day,size,player,actions,deals,total,created_at,finished_at,nickname) VALUES ($1,1,$2,$3,$4,$5,1,2,$6)',
    [day, real, JSON.stringify([specs[0].benchmark.log]), JSON.stringify([specs[0].benchmark.summary]), specs[0].benchmark.summary.scores[0], 'RealPlayer'])
  const profileBefore = await playProfile(store, real)
  const humanXp = (await xpBoard(store, real)).rows[0].xp
  const p = roster.personas[0]
  const config: Roster = { ...roster, personas: [{ ...p, activity: { ...p.activity, zone: 'Europe/Berlin',
    weekday: 1, weekend: 1, quiet: 0, dailyOne: 1, dailySix: 1, free: [1, 1],
    windows: [{ start: 0, end: 1439, weight: 1 }] } }] }
  const jobs = planDay(config, day)
  assert.equal(jobs.length, 3)
  let now = jobs[0].due
  let allowed = false
  let runner = new PersonaRunner(store, policy, pool, config, () => allowed, () => now)
  await runner.tick()
  assert.equal((await store.pool.query('SELECT count(*)::int AS n FROM persona_jobs')).rows[0].n, 0)
  allowed = true
  for (const j of jobs) {
    now = j.due
    const other = new PersonaRunner(store, policy, pool, config, () => allowed, () => now)
    await Promise.all([runner.tick(), runner.tick(), other.tick()])
    await other.stop()
    await runner.stop()
    runner = new PersonaRunner(store, policy, pool, config, () => allowed, () => now)
    await runner.tick()
  }
  await runner.stop()
  const completed = (await store.pool.query('SELECT snapshot, result, free_index FROM persona_jobs ORDER BY due')).rows
  assert.equal(completed.length, 3)
  assert(completed.every((j) => j.result))
  const changed = new PersonaRunner(store, policy, pool, { ...config, version: 'changed-version',
    personas: config.personas.map((p) => ({ ...p, activity: { ...p.activity, free: [2, 2] } })) }, () => allowed, () => now)
  await changed.tick()
  await changed.stop()
  assert.deepEqual((await store.pool.query('SELECT snapshot, result, free_index FROM persona_jobs ORDER BY due')).rows, completed)
  let xp = 0
  for (const j of completed) {
    const result = j.result as ActivityResult
    assert.equal(result.games.length, j.snapshot.size || 1)
    assert.equal(result.total, result.games.reduce((s, g) => s + g.mine.scores[0], 0))
    result.games.forEach((g, i) => {
      const d = j.snapshot.size ? specs[i] : pool.deals[j.free_index]
      const deck = j.snapshot.size ? d.deck : d.deck.split(' ').map((c: string) => ({ suit: c[0], rank: c[1] === 'T' ? '10' : c[1] }))
      assert.deepEqual(summarize(replayLog(d.dealer, deck, g.log)), g.mine)
      assert.deepEqual(summarize(replayLog(g.input.dealer, g.input.deck, g.log)), g.mine)
      const earned = xpOf(g.mine.scores[0] - g.ai.scores[0], g.mine.declarer === 0)
      assert.equal(g.xp, earned)
      xp += earned
    })
  }
  const s = specs[0]
  const repeatedSpec: SimDeal = { dealer: s.dealer, deck: s.deck, opponents: [s.computers['1'], s.computers['2']].map((b) => ({
    maxBid: b.maxBid, skatOrHand: (bid: number) => skatOrHand(b, bid),
  })) as SimDeal['opponents'] }
  const repeated = () => simulateDeal(policy!, repeatedSpec, p, 'same-runtime|game|repeat', s.benchmark.summary)
  assert.deepEqual(await repeated(), await repeated())
  assert.equal((await xpBoard(store, real)).rows.find((r) => r.nickname === p.nickname)?.xp, xp)
  assert.equal((await xpBoard(store, real)).rows.find((r) => r.nickname === 'RealPlayer')?.xp, humanXp)
  assert.deepEqual(await playProfile(store, real), profileBefore)
  assert.equal((await store.pool.query('SELECT count(*)::int AS n FROM daily_players WHERE player LIKE $1', ['sim:%'])).rows[0].n, 0)
  assert.equal((await store.pool.query('SELECT count(*)::int AS n FROM play_deals')).rows[0].n, 0)
  for (const size of [1, 6] as const) {
    const board = await dailyBoard(store, real, 'today', size, now)
    assert.equal(board.rows.find((r) => r.nickname === p.nickname)?.total, completed.find((j) => j.snapshot.size === size)!.result.total)
    assert(board.ai)
  }
  await assert.rejects(dailyName(store, real, p.nickname), /nickname_taken/)
  assert.deepEqual(await playProfile(store, `sim:${p.id}`), { deals: [], notes: [] })

  const app = express()
  const key = randomBytes(32).toString('hex')
  app.use('/daily', dailyRoutes(store, key, () => true, () => policy))
  http = createServer(app)
  await new Promise<void>((resolve) => http!.listen(0, '127.0.0.1', resolve))
  const address = http.address()
  assert(address && typeof address !== 'string')
  const post = (op: string, body: unknown) => fetch(`http://127.0.0.1:${address.port}/daily/${op}`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-admission-key': key }, body: JSON.stringify(body),
  })
  for (const size of [1, 6]) {
    const boardResponse = await post('board', { player: real, day: 'today', size })
    assert.equal(boardResponse.status, 200)
    assert((await boardResponse.json()).rows.some((r: { nickname: string; total: number }) =>
      r.nickname === p.nickname && r.total === completed.find((j) => j.snapshot.size === size)!.result.total))
  }
  const xpResponse = await post('xp', { player: real })
  assert.equal(xpResponse.status, 200)
  assert((await xpResponse.json()).rows.some((r: { nickname: string; xp: number }) => r.nickname === p.nickname && r.xp === xp))
  assert.equal((await post('state', { player: `sim:${p.id}`, size: 1 })).status, 400)

  // A new day's selected persona decision fails: preserve the error, never publish a result.
  const nextDay = offsetDay(day, 1)
  await store.pool.query('INSERT INTO daily_deals (day,size,deals,computer) VALUES ($1,1,$2,$3)', [nextDay, JSON.stringify([specs[0]]), COMPUTER])
  const failConfig: Roster = { ...config, personas: [{ ...config.personas[0], activity: { ...config.personas[0].activity, dailySix: 0, free: [0, 0] } }] }
  const nextJob = planDay(failConfig, nextDay)[0]
  assert(nextJob)
  now = nextJob.due
  const broken = { ...policy, score: async () => { throw new Error('inference_failure') } }
  const failure = new PersonaRunner(store, broken, pool, failConfig, () => allowed, () => now)
  await failure.tick()
  await failure.stop()
  const failed = (await store.pool.query('SELECT result,error,attempts FROM persona_jobs WHERE day=$1', [nextDay])).rows[0]
  assert.equal(failed.result, null)
  assert.equal(failed.error, 'inference_failure')
  assert.equal(failed.attempts, 1)
  assert.equal((await xpBoard(store, real)).rows.find((r) => r.nickname === p.nickname)?.xp, xp)
  // Turning off while an awaited inference is outstanding cancels the write.
  now += 5 * 60_000
  const cancelledPolicy = { ...policy, score: async (...args: Parameters<Policy['score']>) => {
    allowed = false
    return policy!.score(...args)
  } }
  const cancelled = new PersonaRunner(store, cancelledPolicy, pool, failConfig, () => allowed, () => now)
  await cancelled.tick()
  await cancelled.stop()
  assert.equal((await store.pool.query('SELECT result FROM persona_jobs WHERE day=$1', [nextDay])).rows[0].result, null)
  await store.stepDown()
  allowed = true
  const stale = new PersonaRunner(store, policy, pool, failConfig, () => allowed, () => now)
  await assert.rejects(stale.tick(), /not_ready/)
  await stale.stop()
})

test('personas: persistent 17-player controller, hot growth, heartbeat, restart and commit fences', { timeout: 240_000 }, async (t) => {
  const url = new URL(process.env.DATABASE_URL || '')
  assert(['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname), 'Tests refuse external databases')
  const admin = new pg.Pool({ connectionString: url.href })
  const db = `skatgo_population_${randomBytes(6).toString('hex')}`
  await admin.query(`CREATE DATABASE "${db}"`)
  url.pathname = `/${db}`
  const store = new Store(url.href)
  let policy: Policy | null = null
  let service: PersonaService | null = null
  t.after(async () => {
    await service?.stop()
    await policy?.release()
    await store.close()
    await admin.query(`DROP DATABASE "${db}" WITH (FORCE)`)
    await admin.end()
  })
  await store.migrate()
  assert(await store.acquire(() => {}))
  const directory = new URL('../skatzero/', import.meta.url)
  policy = await loadPolicy(directory)
  const pool = await loadPool(directory, { odds: false })
  const day = dayOf(Date.now())
  const minutes = dayMinutes(day)
  let now = minutes[0]
  service = new PersonaService(store, policy, pool, () => true, { enabled: false, population: 17 }, () => now)
  await service.tick()
  assert.deepEqual({ enabled: (await readControl(store.pool))!.enabled, population: (await readControl(store.pool))!.population },
    { enabled: false, population: 17 })
  assert.equal((await serviceStatus(store.pool, now)).queue.planned, 0)
  await prepareDay(store, policy, day)
  const specs = (await store.pool.query('SELECT deals FROM daily_deals WHERE day=$1 AND size=6', [day])).rows[0].deals
  await store.pool.query('INSERT INTO daily_deals (day,size,deals,computer) VALUES ($1,1,$2,$3)',
    [day, JSON.stringify([specs[0]]), COMPUTER])
  await dailyName(store, 'user:name_preflight', roster.personas[0].nickname)
  await assert.rejects(configureControl(store.pool, { enabled: true, population: 17 }, now), /persona_name_conflict/)
  assert.equal((await readControl(store.pool))!.enabled, false)
  assert.equal((await serviceStatus(store.pool, now)).registered, 0)
  await dailyName(store, 'user:name_preflight', 'ExistingOwner')
  await configureControl(store.pool, { enabled: true, population: 17 }, now)
  await service.tick()
  assert.equal((await serviceStatus(store.pool, now)).registered, 17)
  const planned = (await store.pool.query('SELECT player,day,slot,snapshot FROM persona_jobs ORDER BY player,slot')).rows
  assert(planned.length > 0)
  for (const count of [100, 200, 300, 400, 500, 17]) {
    await configureControl(store.pool, { population: count }, now)
    await service.tick()
    assert.equal((await readControl(store.pool))!.population, count)
    const existing = (await store.pool.query(
      'SELECT player,day,slot,snapshot FROM persona_jobs WHERE player=ANY($1::text[]) ORDER BY player,slot',
      [roster.personas.map((p) => `sim:${p.id}`)])).rows
    assert.deepEqual(existing, planned)
  }
  assert.equal((await serviceStatus(store.pool, now)).registered, 500)
  // Normal first-day schedule: individual attendance, not a forced 17-row board.
  const jobs = planDay(roster, day)
  const workloadStart = performance.now()
  for (const j of jobs) {
    now = j.due
    await service.tick()
  }
  const completed = (await store.pool.query(
    'SELECT player,day,slot,result FROM persona_jobs WHERE result IS NOT NULL ORDER BY player,slot')).rows
  assert(completed.length > 0)
  console.log(JSON.stringify({ event: 'persona_capacity_sample', population: 17, registered: 500,
    activities: completed.length, deals: completed.reduce((n, j) => n + j.result.games.length, 0),
    workloadMs: Math.round(performance.now() - workloadStart), rss: process.memoryUsage().rss,
    concurrentBackgroundActivities: 1, roomCapacity: 'not measured' }))
  assert(completed.every((j) => roster.personas.some((p) => j.player === `sim:${p.id}`)))
  for (const size of [1, 6] as const) {
    const board = await dailyBoard(store, null, 'today', size, now)
    const expected = completed.filter((j) => j.slot === `daily:${size}`)
    assert(expected.length > 0)
    for (const j of expected) assert.equal(
      board.rows.find((row) => row.nickname === roster.personas.find((p) => j.player === `sim:${p.id}`)!.nickname)?.total, j.result.total)
  }
  const xp = await xpBoard(store, null)
  for (const p of roster.personas) {
    const games = completed.filter((j) => j.player === `sim:${p.id}`).flatMap((j) => (j.result as ActivityResult).games)
    if (!games.length) continue
    const earned = games.reduce((sum, g) => sum + xpOf(g.mine.scores[0] - g.ai.scores[0], g.mine.declarer === 0), 0)
    assert.equal(xp.rows.find((row) => row.nickname === p.nickname)?.xp, earned)
  }
  await service.stop()
  service = new PersonaService(store, policy, pool, () => true, { enabled: false, population: 500 }, () => now)
  await service.tick()
  assert.equal((await readControl(store.pool))!.population, 17)
  assert.equal((await readControl(store.pool))!.enabled, true)
  assert.deepEqual((await store.pool.query(
    'SELECT player,day,slot,result FROM persona_jobs WHERE result IS NOT NULL ORDER BY player,slot')).rows, completed)
  const status = await serviceStatus(store.pool, now)
  assert.equal(status.heartbeatAgeMs, 0)
  assert.equal(status.control.last_error, null)
  assert(status.control.tick_ms >= 0)

  // Change persistent control from inside a real awaited inference, then reject its old revision.
  const nextDay = offsetDay(day, 1)
  await store.pool.query('INSERT INTO daily_deals (day,size,deals,computer) VALUES ($1,1,$2,$3)',
    [nextDay, JSON.stringify([specs[0]]), COMPUTER])
  const config: Roster = { ...roster, personas: [{ ...roster.personas[0],
    activity: { ...roster.personas[0].activity, weekday: 1, weekend: 1, quiet: 0, dailyOne: 1, dailySix: 0, free: [0, 0] } }] }
  const job = planDay(config, nextDay)[0]
  now = job.due
  const revision = (await readControl(store.pool))!.revision
  let changed = false
  const pausing = { ...policy, score: async (...args: Parameters<Policy['score']>) => {
    if (!changed) { changed = true; await configureControl(store.pool, { enabled: false }, now) }
    return policy!.score(...args)
  } }
  const cancelled = new PersonaRunner(store, pausing, pool, config, () => true, () => now,
    { guard: (c) => assertControl(c, revision) })
  await cancelled.tick()
  await cancelled.stop()
  assert(changed)
  assert.equal((await store.pool.query('SELECT result FROM persona_jobs WHERE day=$1', [nextDay])).rows[0].result, null)
  await service.tick()
  assert.equal((await serviceStatus(store.pool, now)).control.enabled, false)

  await configureControl(store.pool, { enabled: true, population: 500 }, now)
  const last = population(500).personas[499]
  const shrinkConfig: Roster = { ...roster, personas: [{ ...last, activity: { ...last.activity,
    zone: 'Europe/Berlin', windows: [{ start: 0, end: 1439, weight: 1 }],
    weekday: 1, weekend: 1, quiet: 0, dailyOne: 1, dailySix: 0, free: [0, 0] } }] }
  now = planDay(shrinkConfig, nextDay)[0].due
  const beforeShrink = (await readControl(store.pool))!.revision
  let shrank = false
  const shrinking = { ...policy, score: async (...args: Parameters<Policy['score']>) => {
    if (!shrank) { shrank = true; await configureControl(store.pool, { population: 17 }, now) }
    return policy!.score(...args)
  } }
  const removed = new PersonaRunner(store, shrinking, pool, shrinkConfig, () => true, () => now,
    { guard: (c) => assertControl(c, beforeShrink) })
  await removed.tick()
  await removed.stop()
  assert(shrank)
  assert.equal((await readControl(store.pool))!.population, 17)
  assert.equal((await store.pool.query('SELECT result FROM persona_jobs WHERE player=$1 AND day=$2',
    [`sim:${last.id}`, nextDay])).rows[0].result, null)
  await assert.rejects(dailyName(store, 'user:population_name_owner', population(500).personas[499].nickname), /nickname_taken/)
  const conflicting = { ...config, personas: [{ ...config.personas[0], nickname: 'DifferentName' }] }
  const renamed = new PersonaRunner(store, policy, pool, conflicting, () => true, () => now)
  await assert.rejects(renamed.tick(), /persona_name_conflict/)
  await renamed.stop()
  const first = roster.personas[0]
  assert.equal((await store.pool.query('SELECT nickname FROM persona_players WHERE player=$1',
    [`sim:${first.id}`])).rows[0].nickname, first.nickname)
})
