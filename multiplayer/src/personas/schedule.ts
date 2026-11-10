import { DAILY_TIME_ZONE } from '../../../app/src/lib/skat/tournament'
import { weekOf } from '../../../app/src/lib/skat/profile'
import { type Persona, type Roster, RANDOM_STREAM_VERSION, random, rosterHash, personaOnDay, policyOf } from './config'

const MINUTE = 60_000
const berlinDay = new Intl.DateTimeFormat('en-CA', { timeZone: DAILY_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
export const validDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  Number.isFinite(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s
export const offsetDay = (day: string, days: number) => new Date(Date.parse(`${day}T00:00:00Z`) + days * 86400_000).toISOString().slice(0, 10)

/** Enumerate actual instants, not assumed local UTC offsets: DST days have 23 or 25 hours. */
export function dayMinutes(day: string): number[] {
  if (!validDay(day)) throw new Error('Invalid day')
  const midnight = Date.parse(`${day}T00:00:00Z`)
  const out: number[] = []
  for (let t = midnight - 3 * 3600_000; t < midnight + 25 * 3600_000; t += MINUTE) if (berlinDay.format(t) === day) out.push(t)
  return out
}

export type Activity = {
  player: string; day: string; slot: string; size: 0 | 1 | 6; start: number; due: number;
  seed: string; version: string; configHash: string; persona: Persona;
  policy?: string;
}
const inWindow = (n: number, w: Persona['activity']['windows'][number]) =>
  w.start < w.end ? n >= w.start && n < w.end : n >= w.start || n < w.end

export function planDay(r: Roster, day: string): Activity[] {
  const minutes = dayMinutes(day)
  const configHash = rosterHash(r)
  const jobs: Activity[] = []
  const clocks = new Map<string, Map<number, number>>()
  for (const profile of r.personas) {
    const p = personaOnDay(profile, r, day)
    const seed = `${r.seed}|${RANDOM_STREAM_VERSION}|${p.id}|${day}`
    const quiet = random(`${r.seed}|${p.id}|quiet|${weekOf(day)}`)
    const quietStart = Math.floor(quiet() * 6)
    const quietLength = quiet() < p.activity.quiet ? 1 + Math.floor(quiet() * 2) : 0
    const weekday = (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7
    if (weekday >= quietStart && weekday < quietStart + quietLength) continue
    const attend = random(`${seed}|attendance`)
    if (attend() >= (weekday >= 5 ? p.activity.weekend : p.activity.weekday)) continue
    if (!clocks.has(p.activity.zone)) {
      const format = new Intl.DateTimeFormat('en-GB', { timeZone: p.activity.zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      clocks.set(p.activity.zone, new Map(minutes.map((t) => {
        const parts = format.formatToParts(t)
        return [t, Number(parts.find((x) => x.type === 'hour')!.value) * 60 + Number(parts.find((x) => x.type === 'minute')!.value)]
      })))
    }
    const local = (t: number) => clocks.get(p.activity.zone)!.get(t)!
    const slots: { slot: string; size: 0 | 1 | 6 }[] = []
    if (attend() < p.activity.dailyOne) slots.push({ slot: 'daily:1', size: 1 })
    if (attend() < p.activity.dailySix) slots.push({ slot: 'daily:6', size: 6 })
    const [lo, hi] = p.activity.free
    const free = lo + Math.floor(attend() * (hi - lo + 1))
    for (let i = 0; i < free; i++) slots.push({ slot: `free:${i}`, size: 0 })
    const occupied: [number, number][] = []
    for (const slot of slots) {
      const rand = random(`${seed}|time|${slot.slot}`)
      const duration = (4 + Math.floor(rand() * 9)) * (slot.size || 1) * MINUTE
      const choices = p.activity.windows.map((w) => ({
        w, times: minutes.filter((t) => t - duration >= minutes[0] && inWindow(local(t), w) &&
          inWindow(local(t - duration), w) && !occupied.some(([start, end]) => t + MINUTE > start && t - duration < end)),
      })).filter((c) => c.times.length)
      if (!choices.length) continue
      let weight = rand() * choices.reduce((s, c) => s + c.w.weight, 0)
      const chosen = choices.find((c) => (weight -= c.w.weight) <= 0) ?? choices.at(-1)!
      const due = chosen.times[Math.floor(rand() * chosen.times.length)] + Math.floor(rand() * MINUTE)
      occupied.push([due - duration, due])
      jobs.push({ player: `sim:${p.id}`, day, ...slot, start: due - duration, due,
        seed: `${seed}|game|${slot.slot}`, version: r.version, configHash, persona: p, policy: policyOf(p) })
    }
  }
  return jobs.sort((a, b) => a.due - b.due || a.player.localeCompare(b.player) || a.slot.localeCompare(b.slot))
}
