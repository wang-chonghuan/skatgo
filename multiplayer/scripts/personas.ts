import { parseArgs } from 'node:util'
import { existsSync } from 'node:fs'
import pg from 'pg'
import { recordOf } from '../../app/src/lib/skat/profile'
import { dayOf } from '../src/daily'
import { loadPool, deckOf, plan } from '../src/free'
import { loadPolicy, type Policy } from '../src/skatzero/policy'
import { population, populationCount, enabled, RANDOM_STREAM_VERSION, rosterHash } from '../src/personas/config'
import { configureControl, serviceStatus } from '../src/personas/control'
import { offsetDay, planDay, validDay } from '../src/personas/schedule'
import { biddingFor, playGame, simulateDeal, type GameResult, type SimDeal } from '../src/personas/play'

const command = process.argv[2] ?? 'validate'
const env = new URL('../.env', import.meta.url)
if (existsSync(env)) process.loadEnvFile(env)
const { values } = parseArgs({ args: process.argv.slice(3), options: {
  day: { type: 'string', default: dayOf(Date.now()) },
  days: { type: 'string', default: '30' },
  deals: { type: 'string', default: '30' },
  count: { type: 'string' },
  enabled: { type: 'string' },
  'allow-remote': { type: 'boolean', default: false },
  confirm: { type: 'boolean', default: false },
} })
const roster = population(values.count === undefined ? 17 : populationCount(values.count))
const integer = (s: string, max: number) => {
  const n = Number(s)
  if (!Number.isInteger(n) || n < 1 || n > max) throw new Error(`Expected integer 1..${max}`)
  return n
}
if (command === 'validate') {
  console.log(JSON.stringify({ version: roster.version, hash: rosterHash(roster), personas: roster.personas.length, valid: true,
    players: roster.personas.map((p) => ({ id: p.id, nickname: p.nickname, ...p.play })) }, null, 2))
} else if (command === 'plan') {
  if (!validDay(values.day!)) throw new Error('Invalid day')
  const days = integer(values.days!, 366)
  const jobs = Array.from({ length: days }, (_, n) => planDay(roster, offsetDay(values.day!, n))).flat()
  console.log(JSON.stringify({
    version: roster.version, day: values.day, days, activities: jobs.length,
    personas: roster.personas.map((p) => {
      const own = jobs.filter((j) => j.player === `sim:${p.id}`)
      return { id: p.id, activeDays: new Set(own.map((j) => j.day)).size, activities: own.length, free: own.filter((j) => !j.size).length }
    }),
    jobs: jobs.map(({ persona, ...j }) => ({ ...j, nickname: persona.nickname, zone: persona.activity.zone, at: new Date(j.due).toISOString() })),
  }, null, 2))
} else if (command === 'calibrate') {
  const count = integer(values.deals!, 200)
  const directory = new URL('../skatzero/', import.meta.url)
  const pool = await loadPool(directory, { odds: false })
  let policy: Policy | null = null
  const started = Date.now()
  try {
    policy = await loadPolicy(directory)
    const results = new Map(roster.personas.map((p) => [p.id, [] as GameResult[]]))
    const baseline: GameResult[] = []
    for (let i = 0; i < count; i++) {
      const d = pool.deals[i]
      const spec: SimDeal = { dealer: d.dealer, deck: deckOf(d.deck), opponents: [plan(d.computers['1']), plan(d.computers['2'])] }
      const own = await biddingFor(policy, spec, `${roster.seed}|calibration|${i}`)
      const ai = await playGame(policy, spec, plan(d.computers['0']))
      baseline.push({ mine: ai.summary, ai: ai.summary, log: ai.log, choices: 0, deviations: 0, maxBid: d.computers['0'].maxBid,
        xp: 10 + (ai.summary.declarer === 0 ? 2 : 0), input: { dealer: spec.dealer, deck: spec.deck } })
      for (const p of roster.personas) results.get(p.id)!.push(await simulateDeal(policy, spec, p,
        `${roster.seed}|${RANDOM_STREAM_VERSION}|${p.id}|calibration|game|${i}`, ai.summary, own))
    }
    const summary = (id: string, games: GameResult[]) => {
      const scores = games.map((g) => g.mine.scores[0])
      const r = recordOf(games.map((g) => g.mine))
      return { id, deals: games.length, declared: r.declared, winRate: r.played ? r.won / r.played : null,
        mean: r.perDeal, stddev: Math.sqrt(scores.reduce((s, n) => s + (n - r.perDeal) ** 2, 0) / scores.length),
        min: Math.min(...scores), max: Math.max(...scores), choices: games.reduce((s, g) => s + g.choices, 0),
        deviations: games.reduce((s, g) => s + g.deviations, 0), xp: games.reduce((s, g) => s + g.xp, 0),
        changedGames: games.filter((g) => JSON.stringify(g.mine) !== JSON.stringify(g.ai)).length }
    }
    console.log(JSON.stringify({ version: roster.version, configHash: rosterHash(roster), pool: pool.version,
      ms: Date.now() - started, calibration: 'sample only; not a calibrated difficulty guarantee',
      results: [summary('standard', baseline), ...[...results].map(([id, games]) => summary(id, games))] }, null, 2))
  } finally { await policy?.release() }
} else if (command === 'status' || command === 'configure') {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')
  const url = new URL(process.env.DATABASE_URL)
  if (command === 'configure' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) &&
    !(values['allow-remote'] && values.confirm)) {
    throw new Error('Remote changes require explicit --allow-remote --confirm')
  }
  const pool = new pg.Pool({ connectionString: url.toString(), max: 1, connectionTimeoutMillis: 5000, query_timeout: 10_000 })
  try {
    if (command === 'configure') {
      if (values.count === undefined && values.enabled === undefined) throw new Error('Set --count and/or --enabled')
      await configureControl(pool, {
        ...(values.count === undefined ? {} : { population: populationCount(values.count) }),
        ...(values.enabled === undefined ? {} : { enabled: enabled(values.enabled) }),
      })
    }
    console.log(JSON.stringify(await serviceStatus(pool), null, 2))
  } finally { await pool.end() }
} else throw new Error('Use validate, plan, calibrate, status or configure')
