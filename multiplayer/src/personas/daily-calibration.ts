import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { summarize } from '../../../app/src/lib/skat/tournament'
import { xpOf } from '../../../app/src/lib/skat/xp'
import { COMPUTER, type DealSpec } from '../daily'
import { replayLog, type SeatPlan } from '../computers'
import { skatOrHand } from '../skatzero/bidding'
import { type Policy, SKATZERO_COMMIT } from '../skatzero/policy'
import { type Roster, RANDOM_STREAM_VERSION, STRENGTH_POLICY, rosterHash } from './config'
import { CALIBRATION_SEEDS, type Observation, calibrationReport } from './metrics'
import { type SimDeal, biddingFor, simulateDeal } from './play'
import { cached, frozenTraining, hash, json, save } from './calibration'

export type DailyFixture = {
  daily: { day: string; size: number; deals: DealSpec[]; computer: string }[]
}

export async function calibrateDaily(base: Policy, roster: Roster, options: {
  fixture: string; training: string; output: string
}) {
  const fixture = await json<DailyFixture>(options.fixture)
  assert(fixture?.daily.length, 'Export actual daily server deals first')
  const trainingHash = await frozenTraining(options.training, roster)
  const daily = [...fixture.daily].sort((a, b) => a.day.localeCompare(b.day) || a.size - b.size)
  assert.equal(new Set(daily.map((d) => `${d.day}|${d.size}`)).size, daily.length, 'Duplicate daily date/mode')
  const manifest = { format: 'skatgo-daily-calibration/1', policy: STRENGTH_POLICY, model: SKATZERO_COMMIT,
    configHash: rosterHash(roster), trainingHash, fixtureHash: hash(daily), seeds: CALIBRATION_SEEDS,
    dates: daily.map((d) => ({ day: d.day, size: d.size, computer: d.computer })),
    selection: 'Stored daily-one selection and daily-six deals; unchanged benchmark and opponents' }
  await mkdir(options.output, { recursive: true })
  const previous = await json<typeof manifest>(join(options.output, 'manifest.json'))
  if (previous) assert.deepEqual(previous, manifest, 'Changed daily experiment: use a new output folder')
  else await save(join(options.output, 'manifest.json'), manifest)
  const observations = new Map<number, Observation[]>([[1, []], [6, []]])
  const started = performance.now()
  let index = 0
  for (const [cluster, d] of daily.entries()) {
    assert([1, 6].includes(d.size) && d.deals.length === d.size && d.computer === COMPUTER, 'Unsupported daily input')
    for (const [number, s] of d.deals.entries()) {
      assert(s.computers && s.benchmark, 'Daily input lacks canonical benchmark')
      const spec: SimDeal = { dealer: s.dealer, deck: s.deck,
        opponents: [s.computers['1'], s.computers['2']].map((b) => ({
          maxBid: b.maxBid, skatOrHand: (bid: number) => skatOrHand(b, bid),
        })) as [SeatPlan, SeatPlan] }
      const file = join(options.output, `${d.day}-${d.size}-${number}.json`)
      let rows = await json<Observation[]>(file)
      if (!rows) {
        const policy = cached(base)
        const own = await biddingFor(policy, spec, `daily-input|${d.day}|${d.size}|${number}`)
        const ai = s.benchmark
        assert.deepEqual(summarize(replayLog(s.dealer, s.deck, ai.log)), ai.summary, 'Stored daily benchmark does not replay')
        rows = [{ index, cluster, id: 'standard', seed: 'canonical', variant: 'standard', result: {
          mine: ai.summary, ai: ai.summary, log: ai.log, choices: 0, deviations: 0,
          xp: xpOf(0, ai.summary.declarer === 0), input: { dealer: s.dealer, deck: s.deck },
        } }]
        for (const p of roster.personas) {
          const { strength, ...play } = p.play
          assert(strength, `Missing supported strength for ${p.id}`)
          for (const seed of CALIBRATION_SEEDS) {
            for (const variant of ['legacy', 'strength'] as const) {
              rows.push({ index, cluster, id: p.id, seed, variant,
                result: await simulateDeal(policy, spec, variant === 'legacy' ? { ...p, play } : p,
                  `${roster.seed}|${RANDOM_STREAM_VERSION}|${p.id}|${d.day}|${d.size}|${seed}|game|${number}`,
                  ai.summary, own) })
            }
          }
        }
        await save(file, rows)
      }
      const expected = new Set(['standard|standard|canonical', ...roster.personas.flatMap((p) =>
        CALIBRATION_SEEDS.flatMap((seed) => ['legacy', 'strength'].map((variant) => `${p.id}|${variant}|${seed}`)))])
      assert.deepEqual(new Set(rows.map((r) => `${r.id}|${r.variant}|${r.seed}`)), expected)
      assert.equal(rows.length, expected.size)
      for (const r of rows) {
        assert.equal(r.index, index)
        assert.equal(r.cluster, cluster)
        assert.deepEqual(r.result.input, { dealer: s.dealer, deck: s.deck })
        assert.deepEqual(r.result.ai, s.benchmark.summary)
        assert.deepEqual(summarize(replayLog(s.dealer, s.deck, r.result.log)), r.result.mine)
        assert.equal(r.result.xp, xpOf(r.result.mine.scores[0] - r.result.ai.scores[0], r.result.mine.declarer === 0))
        observations.get(d.size)!.push({ ...r, result: { ...r.result, log: [], input: { dealer: s.dealer, deck: [] },
          audit: r.result.audit?.map(({ candidates, ...a }) => ({ ...a, candidates: [], candidateCount: candidates.length })) } })
      }
      index++
    }
    console.error(JSON.stringify({ event: 'daily_calibration_progress', day: d.day, size: d.size }))
  }
  const report = { ...manifest, ms: Math.round(performance.now() - started),
    modes: [...observations].filter(([, rows]) => rows.length).map(([size, rows]) => ({
      size, dates: daily.filter((d) => d.size === size).length, replayed: rows.length,
      ...calibrationReport(rows, roster.personas.map((p) => p.id), size === 1 ? 'daily-one' : 'daily-six'),
    })) }
  await save(join(options.output, 'report.json'), report)
  return report
}
