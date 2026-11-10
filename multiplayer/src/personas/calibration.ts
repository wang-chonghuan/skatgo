import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { summarize } from '../../../app/src/lib/skat/tournament'
import { xpOf } from '../../../app/src/lib/skat/xp'
import { type Pool, deckOf, plan } from '../free'
import { type Policy, SKATZERO_COMMIT } from '../skatzero/policy'
import { replayLog } from '../computers'
import { type Roster, RANDOM_STREAM_VERSION, STRENGTH_POLICY, rosterHash } from './config'
import { type Bidding, type SimDeal, biddingFor, playGame, simulateDeal } from './play'
import { CALIBRATION_SEEDS, type Observation, calibrationReport } from './metrics'

export type Experiment = {
  partition: 'train' | 'holdout' | 'smoke'; deals: number; seeds: number; output: string; cache: string; training?: string
}
export async function json<T>(file: string): Promise<T | null> {
  try { return JSON.parse(await readFile(file, 'utf8')) as T }
  catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null; throw e }
}
export async function save(file: string, value: unknown) {
  await writeFile(`${file}.pending`, JSON.stringify(value))
  await rename(`${file}.pending`, file)
}
export const hash = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex')

export async function frozenTraining(folder: string, roster: Roster, poolVersion?: string) {
  const training = await json<{ partition: string; configHash: string; policy: string; pool: string; indices: number[]; seeds: string[] }>(
    join(folder, 'report.json'))
  assert(training?.partition === 'train', 'Complete the frozen training run first')
  assert.deepEqual(training.indices, Array.from({ length: 600 }, (_, i) => i), 'Training requires 600 independent cards')
  assert.deepEqual(training.seeds, CALIBRATION_SEEDS, 'Training requires all three seeds')
  assert.equal(training.configHash, rosterHash(roster), 'Freeze training config before evaluation')
  assert.equal(training.policy, STRENGTH_POLICY)
  if (poolVersion) assert.equal(training.pool, poolVersion)
  return hash(training)
}

/** Pure evaluation cache, bounded to one deal; sampled actions/results are never memoized. */
export function cached(base: Policy): Policy {
  const ranked = new Map<string, ReturnType<Policy['ranked']>>()
  const score = new Map<string, ReturnType<Policy['score']>>()
  const memo: Policy = { ...base, release: async () => {},
    ranked: (v) => {
      const key = JSON.stringify(v)
      if (!ranked.has(key)) ranked.set(key, base.ranked(v))
      return ranked.get(key)!
    },
    score: (mode, state) => {
      const key = mode + JSON.stringify(state)
      if (!score.has(key)) score.set(key, base.score(mode, state))
      return score.get(key)!
    },
    choose: async (v) => {
      const candidates = await memo.ranked(v)
      return candidates.reduce((a, b) => b.value > a.value ? b : a).card
    },
  }
  return memo
}

export async function calibrate(base: Policy, pool: Pool, roster: Roster, options: Experiment) {
  assert(pool.deals.length === 1000, 'The frozen experiment requires the verified 1000-deal pool')
  const keys = pool.deals.map((d) => hash({ dealer: d.dealer, deck: d.deck }))
  assert.equal(new Set(keys).size, keys.length, 'Duplicate independent deals in pool')
  const start = options.partition === 'holdout' ? 600 : 0
  const maximum = options.partition === 'holdout' ? 400 : 600
  assert(options.deals >= 1 && options.deals <= maximum)
  assert(options.seeds >= 1 && options.seeds <= 3)
  let trainingHash: string | undefined
  if (options.partition === 'holdout') {
    assert(options.training, 'Holdout requires --training with a completed frozen training folder')
    trainingHash = await frozenTraining(options.training, roster, pool.version)
  }
  const indices = Array.from({ length: options.deals }, (_, n) => start + n)
  const manifest = { format: 'skatgo-calibration/1', policy: STRENGTH_POLICY, model: SKATZERO_COMMIT,
    pool: pool.version, roster, configHash: rosterHash(roster), partition: options.partition,
    indices, keys: indices.map((i) => keys[i]), seeds: CALIBRATION_SEEDS.slice(0, options.seeds),
    ...(trainingHash ? { trainingHash } : {}) }
  await mkdir(options.output, { recursive: true })
  await mkdir(options.cache, { recursive: true })
  const previous = await json<typeof manifest>(join(options.output, 'manifest.json'))
  if (previous) assert.deepEqual(previous, manifest, 'Changed experiment: use a new output folder; do not overwrite evidence')
  else await save(join(options.output, 'manifest.json'), manifest)
  const observations: Observation[] = []
  const started = performance.now()
  for (const i of indices) {
    const file = join(options.output, `deal-${i}.json`)
    let rows = await json<Observation[]>(file)
    if (!rows) {
      const d = pool.deals[i]
      const spec: SimDeal = { dealer: d.dealer, deck: deckOf(d.deck), opponents: [plan(d.computers['1']), plan(d.computers['2'])] }
      const policy = cached(base)
      const inputKey = hash({ pool: pool.version, model: SKATZERO_COMMIT, key: keys[i] })
      const inputFile = join(options.cache, `${inputKey}.json`)
      let input = await json<{ own: Bidding; ai: Awaited<ReturnType<typeof playGame>> }>(inputFile)
      if (!input) {
        input = { own: await biddingFor(policy, spec, `${pool.version}|strength-input|${i}`),
          ai: await playGame(policy, spec, plan(d.computers['0'])) }
        await save(inputFile, input)
      }
      rows = [{ index: i, id: 'standard', seed: 'canonical', variant: 'standard', result: {
        mine: input.ai.summary, ai: input.ai.summary, log: input.ai.log, choices: 0, deviations: 0,
        maxBid: d.computers['0'].maxBid, xp: xpOf(0, input.ai.summary.declarer === 0),
        input: { dealer: spec.dealer, deck: spec.deck },
      } }]
      for (const p of roster.personas) {
        const { strength, ...play } = p.play
        assert(strength, `Missing supported strength for ${p.id}`)
        for (const seedName of manifest.seeds) {
          const seed = `${roster.seed}|${RANDOM_STREAM_VERSION}|${p.id}|${seedName}|game|${i}`
          for (const variant of ['legacy', 'strength'] as const) {
            const persona = variant === 'legacy' ? { ...p, play } : p
            rows.push({ index: i, id: p.id, seed: seedName, variant,
              result: await simulateDeal(policy, spec, persona, seed, input.ai.summary, input.own) })
          }
        }
      }
      await save(file, rows)
    }
    assert.equal(rows.length, 1 + roster.personas.length * manifest.seeds.length * 2, 'Incomplete saved deal')
    const unique = new Set(rows.map((r) => `${r.id}|${r.variant}|${r.seed}`))
    const expected = new Set(['standard|standard|canonical', ...roster.personas.flatMap((p) =>
      manifest.seeds.flatMap((seed) => ['legacy', 'strength'].map((variant) => `${p.id}|${variant}|${seed}`)))])
    assert.deepEqual(unique, expected, 'Wrong or duplicate saved observation identity')
    const canonical = rows.find((r) => r.variant === 'standard')!.result.mine
    for (const r of rows) {
      assert.equal(r.index, i, 'Wrong saved deal')
      const g = r.result
      assert.deepEqual(g.input, { dealer: pool.deals[i].dealer, deck: deckOf(pool.deals[i].deck) })
      assert.deepEqual(summarize(replayLog(g.input.dealer, g.input.deck, g.log)), g.mine, 'Saved game does not replay')
      assert.deepEqual(g.ai, canonical, 'Saved AI comparison changed')
      assert.equal(g.xp, xpOf(g.mine.scores[0] - g.ai.scores[0], g.mine.declarer === 0), 'XP mismatch')
      // Full logs remain on disk. Metrics retain only the audit dimensions they consume.
      observations.push({ ...r, result: { ...g, log: [], input: { ...g.input, deck: [] },
        audit: g.audit?.map(({ candidates, ...a }) => ({ ...a, candidates: [], candidateCount: candidates.length })) } })
    }
    if ((i - start + 1) % 20 === 0 || i === indices.at(-1)) console.error(JSON.stringify({
      event: 'calibration_progress', partition: options.partition, completed: i - start + 1,
      deals: indices.length, ms: Math.round(performance.now() - started),
    }))
  }
  const report = { ...manifest, roster: undefined,
    acceptanceSample: options.partition === 'holdout' && indices.length === 400 && manifest.seeds.length === 3,
    replayed: observations.length, ms: Math.round(performance.now() - started),
    ...calibrationReport(observations, roster.personas.map((p) => p.id)) }
  await save(join(options.output, 'report.json'), report)
  return report
}
