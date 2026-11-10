import { parseArgs } from 'node:util'
import { existsSync } from 'node:fs'
import pg from 'pg'
import { writeFile } from 'node:fs/promises'
import { dayOf } from '../src/daily'
import { loadPool } from '../src/free'
import { loadPolicy, type Policy } from '../src/skatzero/policy'
import { population, populationCount, enabled, rosterHash } from '../src/personas/config'
import { configureControl, serviceStatus } from '../src/personas/control'
import { offsetDay, planDay, validDay } from '../src/personas/schedule'
import { calibrate } from '../src/personas/calibration'
import { calibrateDaily } from '../src/personas/daily-calibration'
import { diagnose } from '../src/personas/diagnosis'

const command = process.argv[2] ?? 'validate'
const env = new URL('../.env', import.meta.url)
if (existsSync(env)) process.loadEnvFile(env)
const { values } = parseArgs({ args: process.argv.slice(3), options: {
  day: { type: 'string', default: dayOf(Date.now()) },
  days: { type: 'string', default: '30' },
  deals: { type: 'string' },
  partition: { type: 'string', default: 'smoke' },
  seeds: { type: 'string', default: '3' },
  output: { type: 'string' }, cache: { type: 'string' },
  training: { type: 'string' },
  fixture: { type: 'string' },
  since: { type: 'string' }, player: { type: 'string' }, export: { type: 'string' },
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
} else if (command === 'calibrate-daily') {
  if (!values.fixture || !values.training || !values.output) throw new Error('Use --fixture, --training and --output')
  let policy: Policy | null = null
  try {
    policy = await loadPolicy(new URL('../skatzero/', import.meta.url))
    console.log(JSON.stringify(await calibrateDaily(policy, roster, {
      fixture: values.fixture, training: values.training, output: values.output,
    }), null, 2))
  } finally { await policy?.release() }
} else if (command === 'calibrate') {
  if (!['train', 'holdout', 'smoke'].includes(values.partition!)) throw new Error('Use train, holdout or smoke partition')
  if (!values.output || !values.cache) throw new Error('Calibration requires --output and --cache local folders')
  const count = integer(values.deals ?? (values.partition === 'holdout' ? '400' : values.partition === 'train' ? '600' : '30'), 600)
  const directory = new URL('../skatzero/', import.meta.url)
  const pool = await loadPool(directory, { odds: false })
  let policy: Policy | null = null
  try {
    policy = await loadPolicy(directory)
    const report = await calibrate(policy, pool, roster, {
      partition: values.partition as 'train' | 'holdout' | 'smoke', deals: count,
      seeds: integer(values.seeds!, 3), output: values.output, cache: values.cache, training: values.training,
    })
    console.log(JSON.stringify(report, null, 2))
  } finally { await policy?.release() }
} else if (command === 'status' || command === 'configure' || command === 'diagnose') {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')
  const url = new URL(process.env.DATABASE_URL)
  if (command === 'configure' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) &&
    !(values['allow-remote'] && values.confirm)) {
    throw new Error('Remote changes require explicit --allow-remote --confirm')
  }
  const pool = new pg.Pool({ connectionString: url.toString(), max: 1, connectionTimeoutMillis: 5000, query_timeout: 10_000 })
  try {
    if (command === 'diagnose') {
      if (!validDay(values.day!) || (values.since && !validDay(values.since))) throw new Error('Invalid diagnostic day')
      const { fixture, ...report } = await diagnose(pool, values.day!, values.since, values.player)
      if (values.export) await writeFile(values.export, JSON.stringify(fixture), { flag: 'wx', mode: 0o600 })
      console.log(JSON.stringify(report, null, 2))
    } else {
      if (command === 'configure') {
        if (values.count === undefined && values.enabled === undefined) throw new Error('Set --count and/or --enabled')
        await configureControl(pool, {
          ...(values.count === undefined ? {} : { population: populationCount(values.count) }),
          ...(values.enabled === undefined ? {} : { enabled: enabled(values.enabled) }),
        })
      }
      console.log(JSON.stringify(await serviceStatus(pool), null, 2))
    }
  } finally { await pool.end() }
} else throw new Error('Use validate, plan, calibrate, calibrate-daily, diagnose, status or configure')
