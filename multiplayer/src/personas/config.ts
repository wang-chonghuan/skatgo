import { createHash } from 'node:crypto'
import { z } from 'zod'
import data from './roster.json'
import { cleanNickname, RANDOM_NAMES } from '../../../app/src/lib/skat/nickname'

export const MAX_POPULATION = 500
export const INITIAL_POPULATION = 17
/** RNG format stays fixed when only roster metadata or nicknames change. */
export const RANDOM_STREAM_VERSION = 'skatgo-personas/2'

const probability = z.number().min(0).max(1)
export const LEGACY_POLICY = 'skatgo-personas/1'
export const STRENGTH_POLICY = 'skatgo-personas/2'
export const strengthSchema = z.object({
  declarerError: probability, defenderError: probability, severeError: probability,
  bidNoise: z.number().min(0).max(40),
  pickupError: probability, contractError: probability, discardError: probability,
}).strict().superRefine((s, ctx) => {
  if (s.declarerError < 0.45 || s.defenderError < 0.45 || s.severeError < 0.4 ||
    s.pickupError < 0.15 || s.contractError < 0.15 || s.discardError < 0.25) {
    ctx.addIssue({ code: 'custom', message: 'Strength outside calibrated screening envelope' })
  }
})
const zone = z.string().refine((s) => {
  try { new Intl.DateTimeFormat('en', { timeZone: s }).format(); return true } catch { return false }
}, 'Invalid IANA time zone')
const window = z.object({
  start: z.number().int().min(0).max(1439),
  end: z.number().int().min(0).max(1439),
  weight: z.number().positive().max(100),
}).strict().refine((w) => (w.end - w.start + 1440) % 1440 >= 120, 'Window must span at least two hours')
export const personaSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]{1,31}$/),
  nickname: z.string().refine((s) => cleanNickname(s) === s, 'Invalid nickname'),
  play: z.object({
    mistake: probability, deepMistake: probability,
    nullWeakness: probability, form: z.number().min(0).max(0.15),
    bidThreshold: z.number().min(-40).max(40),
    strength: strengthSchema.optional(),
  }).strict(),
  activity: z.object({
    zone, windows: z.array(window).min(1).max(4),
    weekday: probability, weekend: probability, quiet: probability,
    dailyOne: probability, dailySix: probability,
    free: z.tuple([z.number().int().min(0).max(12), z.number().int().min(0).max(12)])
      .refine(([lo, hi]) => lo <= hi, 'Invalid free-play range'),
  }).strict(),
}).strict()
export type Persona = z.infer<typeof personaSchema>
export const rosterSchema = z.object({
  version: z.string().min(1).max(64), seed: z.string().min(1).max(128),
  strengthSince: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) =>
    Number.isFinite(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s).optional(),
  personas: z.array(personaSchema).min(1).max(MAX_POPULATION),
}).strict().superRefine((r, ctx) => {
  for (const key of ['id', 'nickname'] as const) {
    const seen = new Set<string>()
    r.personas.forEach((p, i) => {
      const v = p[key].toLowerCase()
      if (seen.has(v)) ctx.addIssue({ code: 'custom', path: ['personas', i, key], message: `Duplicate ${key}` })
      seen.add(v)
    })
  }
})
export type Roster = z.infer<typeof rosterSchema>
export const roster = rosterSchema.parse(data)
export const rosterHash = (r: Roster) => createHash('sha256').update(JSON.stringify(r)).digest('hex')
export const policyOf = (p: Persona) => p.play.strength ? STRENGTH_POLICY : LEGACY_POLICY
export function personaOnDay(p: Persona, r: Roster, day: string): Persona {
  if (!r.strengthSince || day >= r.strengthSince) return p
  const { strength, ...play } = p.play
  return { ...p, play }
}

export function random(seed: string): () => number {
  let a = createHash('sha256').update(seed).digest().readUInt32LE(0)
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function enabled(value = process.env.SKATGO_PERSONAS_ENABLED): boolean {
  if (value === undefined || value === '0') return false
  if (value === '1') return true
  throw new Error('Invalid SKATGO_PERSONAS_ENABLED; use 0 or 1')
}

export function populationCount(value = process.env.SKATGO_PERSONAS_COUNT ?? String(INITIAL_POPULATION)): number {
  if (!/^[1-9]\d*$/.test(value) || Number(value) > MAX_POPULATION) throw new Error(`Population must be 1..${MAX_POPULATION}`)
  return Number(value)
}

const HANDLES = [
  'Andreas', 'Anja', 'Arne', 'Axel', 'Beate', 'Benny', 'Bernd', 'Birgit', 'Bjoern',
  'Carla', 'Carsten', 'Chris', 'Claudia', 'Daniel', 'Dieter', 'Dirk', 'Doro', 'Ecki',
  'Elke', 'Emil', 'Erika', 'Erwin', 'Felix', 'Flo', 'Gabi', 'Gerd', 'Gisela', 'Guido',
  'Hanna', 'Hartmut', 'Heike', 'Helga', 'Henning', 'Holger', 'Ilse', 'Ingo', 'Ingrid',
  'Jan', 'Jens', 'Jette', 'Jonas', 'Jule', 'Kai', 'Kalle', 'Karin', 'Klaus', 'Lars',
  'Lea', 'Lena', 'Lutz', 'Manfred', 'Mara', 'Matthias', 'Max', 'Meike', 'Michael',
  'Monika', 'Nele', 'Norbert', 'Olli', 'Oskar', 'Petra', 'Peter', 'Philipp', 'Rainer',
  'Renate', 'Rike', 'Robert', 'Roland', 'Sabine', 'Sascha', 'Silke', 'Simon', 'Stefan',
  'Steffi', 'Susanne', 'Thomas', 'Till', 'Tom', 'Uli', 'Uwe', 'Vera', 'Volker', 'Werner',
  'Willi', 'Wolfgang', 'Yvonne', 'Zora',
]

/** Stable prefixes: neither requested count nor mutable day/version seeds name a new identity. */
export function population(count = INITIAL_POPULATION, source: Roster = roster): Roster {
  populationCount(String(count))
  const personas = source.personas.slice(0, count)
  const used = new Set(personas.map((p) => p.nickname.toLowerCase()))
  for (let i = personas.length; i < count; i++) {
    const id = `player-${String(i + 1).padStart(3, '0')}`
    const rand = random(`${source.seed}|population|${id}`)
    const base = source.personas[Math.floor(rand() * source.personas.length)]
    const vary = (n: number, width: number, lo = 0, hi = 1) =>
      Math.round(Math.max(lo, Math.min(hi, n + (rand() * 2 - 1) * width)) * 1000) / 1000
    const names = random(`${source.seed}|name|${id}`)
    let nickname = ''
    for (let attempt = 0; attempt < 10_000; attempt++) {
      const kind = names()
      const name = HANDLES[Math.floor(names() * HANDLES.length)]
      const candidate = kind < 0.23 ? RANDOM_NAMES[Math.floor(names() * RANDOM_NAMES.length)]
        : kind < 0.43 ? name
        : kind < 0.62 ? `${name}${String.fromCharCode(65 + Math.floor(names() * 26))}`
        : `${kind < 0.81 ? name.toLowerCase() + '_' : name}${10 + Math.floor(names() * 90)}`
      if (cleanNickname(candidate) === candidate && !used.has(candidate.toLowerCase())) {
        nickname = candidate
        used.add(candidate.toLowerCase())
        break
      }
    }
    if (!nickname) throw new Error('persona_names_exhausted')
    const shift = Math.floor(rand() * 71) - 35
    const hi = Math.max(base.activity.free[0], Math.min(12, base.activity.free[1] + Math.floor(rand() * 3) - 1))
    personas.push({
      id, nickname,
      play: {
        mistake: vary(base.play.mistake, 0.07, 0.01, 0.65),
        deepMistake: vary(base.play.deepMistake, 0.1, 0.01, 0.65),
        nullWeakness: vary(base.play.nullWeakness, 0.07, 0, 0.3),
        form: vary(base.play.form, 0.015, 0.005, 0.15),
        bidThreshold: vary(base.play.bidThreshold, 7, -40, 40),
      },
      activity: {
        ...base.activity,
        windows: base.activity.windows.map((w) => ({ ...w,
          start: (w.start + shift + 1440) % 1440, end: (w.end + shift + 1440) % 1440,
          weight: vary(w.weight, 0.5, 0.1, 100),
        })),
        weekday: vary(base.activity.weekday, 0.12, 0.2, 0.95),
        weekend: vary(base.activity.weekend, 0.12, 0.2, 0.98),
        quiet: vary(base.activity.quiet, 0.06, 0.03, 0.5),
        dailyOne: vary(base.activity.dailyOne, 0.08, 0.3, 0.98),
        dailySix: vary(base.activity.dailySix, 0.1, 0.1, 0.95),
        free: [base.activity.free[0], hi],
      },
    })
    if (base.play.strength) {
      // Separate stream preserves every pre-existing identity/activity/legacy-trait draw.
      const strengthRandom = random(`${source.seed}|strength|${id}`)
      const s = base.play.strength
      const varyStrength = (n: number, lo: number, hi: number) =>
        Math.round(Math.max(lo, Math.min(hi, n + (strengthRandom() * 2 - 1) * 0.025)) * 1000) / 1000
      personas.at(-1)!.play.strength = {
        declarerError: varyStrength(s.declarerError, 0.45, 0.95),
        defenderError: varyStrength(s.defenderError, 0.45, 0.95),
        severeError: varyStrength(s.severeError, 0.4, 0.95),
        bidNoise: Math.round(Math.max(0, Math.min(40, s.bidNoise + (strengthRandom() * 2 - 1) * 2))),
        pickupError: varyStrength(s.pickupError, 0.15, 0.65),
        contractError: varyStrength(s.contractError, 0.15, 0.65),
        discardError: varyStrength(s.discardError, 0.25, 0.8),
      }
    }
  }
  return rosterSchema.parse({ ...source, personas })
}
