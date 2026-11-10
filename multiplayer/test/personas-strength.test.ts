import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { execFile } from 'node:child_process'
import { createServer } from 'node:http'
import express from 'express'
import pg from 'pg'
import { recordOf } from '../../app/src/lib/skat/profile'
import { summarize, type DealSummary } from '../../app/src/lib/skat/tournament'
import { xpOf } from '../../app/src/lib/skat/xp'
import { replayLog } from '../src/computers'
import { loadPool, deckOf, plan, type Pool } from '../src/free'
import { loadPolicy, type Policy } from '../src/skatzero/policy'
import { Store } from '../src/store'
import { xpBoard } from '../src/xp'
import { dailyBoard, dailyRoutes, prepareDay } from '../src/daily'
import { population, roster, rosterHash, policyOf, personaSchema, LEGACY_POLICY, STRENGTH_POLICY, type Roster } from '../src/personas/config'
import { frozenTraining } from '../src/personas/calibration'
import { sideWon, groupedBounds, measurements, wilsonUpper, type Observation } from '../src/personas/metrics'
import { diagnose } from '../src/personas/diagnosis'
import { planDay } from '../src/personas/schedule'
import { PersonaRunner } from '../src/personas/runner'
import { simulateDeal, playGame, type GameResult } from '../src/personas/play'

const url = new URL(process.env.DATABASE_URL!)
assert(['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname), 'Acceptance refuses non-local databases')
const admin = new pg.Pool({ connectionString: url.toString(), max: 1 })
const schema = `strength_${randomUUID().replaceAll('-', '')}`
let store: Store
let policy: Policy
let pool: Pool
before(async () => {
  await admin.query(`CREATE SCHEMA ${schema}`)
  url.searchParams.set('options', `-c search_path=${schema}`)
  store = new Store(url.toString())
  await store.migrate()
  assert(await store.acquire(() => {}))
  const dir = new URL('../skatzero/', import.meta.url)
  policy = await loadPolicy(dir)
  pool = await loadPool(dir, { odds: false })
})
after(async () => {
  await policy?.release()
  await store?.close()
  await admin.query(`DROP SCHEMA ${schema} CASCADE`)
  await admin.end()
})

const played = (declarer: 0 | 1 | 2 | null, won: boolean | null, score = 0): DealSummary => ({
  declarer, won, scores: [score, 0, 0], declaration: null, detail: null, bid: 0,
})
test('same player-side semantics, incident score equality is not a six-win result', () => {
  const six = [played(1, true), played(2, true), played(0, true, 98),
    played(0, true, 86), played(1, true), played(2, true)]
  const r = recordOf(six)
  assert.equal(r.won, 2)
  assert.equal(r.played, 6)
  assert.equal(six.reduce((n, g) => n + g.scores[0], 0), 184)
  assert.equal(sideWon(played(0, true)), true)
  assert.equal(sideWon(played(0, false)), false)
  assert.equal(sideWon(played(1, false)), true)
  assert.equal(sideWon(played(2, true)), false)
  assert.equal(sideWon(played(null, null)), null)
  assert.equal(recordOf([played(null, null), played(2, false)]).played, 1)
  assert.equal(recordOf(Array.from({ length: 6 }, () => played(0, true))).won, 6)
  assert(wilsonUpper(1, 1)! > 0.99)
  assert.equal(wilsonUpper(0, 0), null)
})

test('three seeded replicas do not inflate distinct-card uncertainty', () => {
  const rows: Observation[] = []
  for (let index = 0; index < 60; index++) {
    const mine = played(0, index < 15)
    const result: GameResult = { mine, ai: mine, log: [], input: { dealer: 0, deck: [] }, choices: 0, deviations: 0, maxBid: 0, xp: 12 }
    rows.push({ index, id: 'a', seed: 'one', variant: 'strength', result })
  }
  const repeated = rows.flatMap((r) => ['one', 'two', 'three'].map((seed) => ({ ...r, seed })))
  assert.deepEqual(groupedBounds(rows), groupedBounds(repeated))
  assert.equal(groupedBounds(repeated).clusters, 60)
  assert(groupedBounds(rows, 17).familyUpper95! >= groupedBounds(rows).upper95!)
  assert.equal(groupedBounds(rows.slice(0, 1)).sufficient, false)
  const small = measurements(repeated.slice(0, 60))
  assert.equal(small.contracts[0].distinctCards, 20)
  assert.equal(small.contracts[0].uncertainty.sufficient, false)
  assert.equal(small.roles[0].uncertainty.sufficient, false)
})

test('strength revision preserves 500 legacy identities, names, activity and prefixes', () => {
  const legacy: Roster = { ...roster, personas: roster.personas.map((p) => {
    const { strength, ...play } = p.play
    return { ...p, play }
  }) }
  const old = population(500, legacy).personas
  const full = population(500).personas
  for (const count of [17, 100, 200, 300, 400, 500]) assert.deepEqual(population(count).personas, full.slice(0, count))
  for (let i = 0; i < full.length; i++) {
    const { strength, ...play } = full[i].play
    assert.deepEqual({ ...full[i], play }, old[i])
    assert.equal(policyOf(full[i]), STRENGTH_POLICY)
  }
  assert.throws(() => personaSchema.parse({
    ...full[0], play: { ...full[0].play, strength: { ...full[0].play.strength, declarerError: 0.01 } },
  }), /screening envelope/)
  const before = planDay(roster, '2026-11-10')
  const after = planDay(roster, '2026-11-11')
  assert(before.length && after.length)
  assert(before.every((a) => a.policy === LEGACY_POLICY && !a.persona.play.strength))
  assert(after.every((a) => a.policy === STRENGTH_POLICY && a.persona.play.strength))
  for (const day of ['2026-11-10', '2026-11-11', '2026-11-12']) {
    const schedule = (r: Roster) => planDay(r, day).map(({ persona, policy, configHash, ...a }) => a)
    assert.deepEqual(schedule(roster), schedule(legacy))
  }
})

test('real models: legal seeded games, truthful base policy and unchanged canonical opponent', async () => {
  const d = pool.deals[11]
  const spec = { dealer: d.dealer, deck: deckOf(d.deck),
    opponents: [plan(d.computers['1']), plan(d.computers['2'])] as const }
  const input = { ...spec, opponents: [...spec.opponents] as [typeof spec.opponents[0], typeof spec.opponents[1]] }
  const ai = await playGame(policy, input, plan(d.computers['0']))
  for (const p of [roster.personas[0], roster.personas[7]]) {
    const first = await simulateDeal(policy, input, p, `verify|${p.id}|game|11`, ai.summary)
    const second = await simulateDeal(policy, input, p, `verify|${p.id}|game|11`, ai.summary)
    assert.deepEqual(first, second)
    assert.deepEqual(summarize(replayLog(d.dealer, input.deck, first.log)), first.mine)
    assert.equal(first.xp, xpOf(first.mine.scores[0] - ai.summary.scores[0], first.mine.declarer === 0))
    assert(first.audit!.some((a) => a.phase === 'card'))
    for (const a of first.audit!) {
      if (a.phase === 'bidding') continue
      assert(a.candidates.some((c) => c.action === a.selected))
      assert(a.loss >= 0)
    }
  }
  assert.deepEqual(await playGame(policy, input, plan(d.computers['0'])), ai)
})

test('saved legacy/new jobs survive restart and never rewrite human records or duplicate XP', async () => {
  const p = roster.personas[0]
  const single: Roster = { ...roster, personas: [{ ...p, activity: { ...p.activity,
    weekday: 1, weekend: 1, quiet: 0, dailyOne: 0, dailySix: 0, free: [1, 1],
  } }] }
  await store.pool.query("INSERT INTO daily_players(player,nickname,created_at) VALUES ('user:fixture','HumanName',0)")
  await store.pool.query("INSERT INTO play_deals(player,game,day,at,mine,ai) VALUES ('user:fixture','fixture','2026-11-10',0,$1,$1)", [JSON.stringify(played(0, true, 98))])
  const snapshots: unknown[] = []
  for (const day of ['2026-11-10', '2026-11-11']) {
    const a = planDay(single, day)[0]
    assert(a && a.size === 0)
    if (day === '2026-11-10') {
      await store.pool.query('INSERT INTO persona_players(player,nickname,created_at) VALUES ($1,$2,0)', [a.player, a.persona.nickname])
      const { policy: ignored, ...oldSnapshot } = a
      await store.pool.query('INSERT INTO persona_jobs(player,day,slot,size,due,snapshot) VALUES ($1,$2,$3,0,$4,$5)',
        [a.player, day, a.slot, a.due, JSON.stringify(oldSnapshot)])
    }
    const runner = new PersonaRunner(store, policy, pool, single, () => true, () => a.due + 1)
    await runner.tick()
    await runner.stop()
    const job = (await store.pool.query('SELECT snapshot,result,completed_at,free_index FROM persona_jobs WHERE day=$1', [day])).rows[0]
    assert(job.result, 'Job must actually complete')
    assert.equal(job.result.policy, day === '2026-11-10' ? LEGACY_POLICY : STRENGTH_POLICY)
    snapshots.push(job)
    const restarted = new PersonaRunner(store, policy, pool, { ...single, version: 'changed' }, () => true, () => a.due + 2)
    await restarted.tick()
    await restarted.stop()
    assert.deepEqual((await store.pool.query('SELECT snapshot,result,completed_at,free_index FROM persona_jobs WHERE day=$1', [day])).rows[0], job)
  }
  const board = await xpBoard(store, null)
  const games = (snapshots as { result: { games: GameResult[] } }[]).flatMap((r) => r.result.games)
  const simulated = board.rows.find((r) => r.nickname === p.nickname)!
  assert.equal(simulated.xp, games.reduce((n, g) => n + g.xp, 0))
  const r = recordOf(games.map((g) => g.mine))
  assert.equal(simulated.winRate, Math.round(100 * r.won / r.played))
  assert.equal((await store.pool.query("SELECT nickname FROM daily_players WHERE player='user:fixture'")).rows[0].nickname, 'HumanName')
  assert.equal((await store.pool.query("SELECT count(*)::int AS n FROM play_deals WHERE player='user:fixture'")).rows[0].n, 1)
  const diagnostic = await diagnose(store.pool, '2026-11-10')
  assert.equal(diagnostic.readOnly, true)
  assert.equal(diagnostic.humans.people[0].played, 1)
  assert.equal(diagnostic.humans.people[0].winRate, 1)
  assert(!JSON.stringify(diagnostic.humans).includes('user:fixture'))
  const invalid = planDay(single, '2026-11-12')[0]
  await store.pool.query('INSERT INTO persona_jobs(player,day,slot,size,due,snapshot) VALUES ($1,$2,$3,0,$4,$5)',
    [invalid.player, invalid.day, invalid.slot, invalid.due, JSON.stringify({ ...invalid, policy: 'unknown/9' })])
  const invalidRunner = new PersonaRunner(store, policy, pool, single, () => true, () => invalid.due + 1)
  await invalidRunner.tick()
  await invalidRunner.stop()
  const rejected = (await store.pool.query('SELECT error,result FROM persona_jobs WHERE day=$1', [invalid.day])).rows[0]
  assert.equal(rejected.error, 'persona_snapshot_policy_mismatch')
  assert.equal(rejected.result, null)
  assert.deepEqual(await xpBoard(store, null), board)
})

test('new policy completes daily-six and selected-one with authoritative HTTP boards', { timeout: 180_000 }, async (t) => {
  const day = '2026-11-13'
  await prepareDay(store, policy, day)
  await prepareDay(store, policy, day, Date.now, 1)
  const humanBefore = (await store.pool.query("SELECT * FROM play_deals WHERE player='user:fixture'")).rows
  const single: Roster = { ...roster, personas: [{ ...roster.personas[0], activity: {
    ...roster.personas[0].activity, weekday: 1, weekend: 1, quiet: 0, dailyOne: 1, dailySix: 1, free: [0, 0],
  } }] }
  const jobs = planDay(single, day)
  assert.equal(jobs.length, 2)
  for (const j of jobs) {
    const runner = new PersonaRunner(store, policy, pool, single, () => true, () => j.due + 1)
    await runner.tick()
    await runner.stop()
  }
  const saved = (await store.pool.query('SELECT snapshot,result FROM persona_jobs WHERE day=$1 ORDER BY size', [day])).rows
  assert.equal(saved.length, 2)
  for (const j of saved) {
    assert.equal(j.result.policy, STRENGTH_POLICY)
    assert.equal(j.result.games.length, j.snapshot.size)
    assert(j.result.games.some((g: GameResult) => g.audit?.length))
    for (const g of j.result.games as GameResult[]) {
      assert.deepEqual(summarize(replayLog(g.input.dealer, g.input.deck, g.log)), g.mine)
      assert.equal(g.xp, xpOf(g.mine.scores[0] - g.ai.scores[0], g.mine.declarer === 0))
    }
    const board = await dailyBoard(store, null, 'today', j.snapshot.size, j.snapshot.due + 1)
    assert.equal(board.rows.find((r) => r.nickname === single.personas[0].nickname)?.total, j.result.total)
  }
  const all = (await store.pool.query("SELECT result FROM persona_jobs WHERE player='sim:moss' AND result IS NOT NULL")).rows
    .flatMap((r) => r.result.games as GameResult[])
  const xp = all.reduce((n, g) => n + g.xp, 0)
  assert.equal((await xpBoard(store, null)).rows.find((r) => r.nickname === single.personas[0].nickname)?.xp, xp)
  assert.deepEqual((await store.pool.query("SELECT * FROM play_deals WHERE player='user:fixture'")).rows, humanBefore)
  assert.equal((await store.pool.query("SELECT nickname FROM daily_players WHERE player='user:fixture'")).rows[0].nickname, 'HumanName')
  const app = express()
  const key = randomUUID().replaceAll('-', '')
  app.use('/daily', dailyRoutes(store, key, () => true, () => policy))
  const http = createServer(app)
  await new Promise<void>((resolve) => http.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise<void>((resolve) => http.close(() => resolve())))
  const address = http.address()
  assert(address && typeof address !== 'string')
  const response = await fetch(`http://127.0.0.1:${address.port}/daily/xp`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-admission-key': key },
    body: JSON.stringify({ player: 'user:fixture' }),
  })
  assert.equal(response.status, 200)
  assert.equal((await response.json()).rows.find((r: { nickname: string }) => r.nickname === single.personas[0].nickname)?.xp, xp)
})

test('calibration CLI resumes frozen experiments and rejects changed manifests', async () => {
  const output = await mkdtemp(join(tmpdir(), 'skatgo-strength-'))
  const cache = join(output, 'cache')
  await mkdir(cache)
  const cli = new URL('../dist/personas.mjs', import.meta.url)
  const run = promisify(execFile)
  const args = [cli.pathname, 'calibrate', '--partition', 'smoke', '--deals', '1',
    '--seeds', '1', '--output', output, '--cache', cache]
  const first = JSON.parse((await run(process.execPath, args, { maxBuffer: 4_000_000 })).stdout)
  const second = JSON.parse((await run(process.execPath, args, { maxBuffer: 4_000_000 })).stdout)
  assert.equal(first.replayed, 35)
  assert.equal(first.acceptanceSample, false)
  assert.deepEqual(second.results, first.results)
  await assert.rejects(run(process.execPath, [...args, '--count', '16']), /Changed experiment/)
  await assert.rejects(run(process.execPath, [cli.pathname, 'calibrate', '--partition', 'holdout', '--deals', '1',
    '--output', join(output, 'holdout'), '--cache', cache]), /requires --training/)
})

test('training signature ignores elapsed time but refuses changed configuration', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'skatgo-training-signature-'))
  const file = join(folder, 'report.json')
  const fixture = { partition: 'train', configHash: rosterHash(roster), policy: STRENGTH_POLICY,
    pool: pool.version, indices: Array.from({ length: 600 }, (_, i) => i),
    seeds: ['strength-a', 'strength-b', 'strength-c'], ms: 123 }
  await writeFile(file, JSON.stringify(fixture))
  const first = await frozenTraining(folder, roster, pool.version)
  await writeFile(file, JSON.stringify({ ...fixture, ms: 456 }))
  assert.equal(await frozenTraining(folder, roster, pool.version), first)
  await assert.rejects(frozenTraining(folder, { ...roster, seed: 'different' }, pool.version), /Freeze training config/)
})
