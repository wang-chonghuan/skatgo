import { recordOf, type Played } from '../../../app/src/lib/skat/profile'
import type { GameResult } from './play'
import type { DealSummary } from '../../../app/src/lib/skat/tournament'
import { random } from './config'

export const CALIBRATION_SEEDS = ['strength-a', 'strength-b', 'strength-c']
export type Observation = {
  index: number; id: string; seed: string; variant: 'standard' | 'legacy' | 'strength'
  cluster?: number
  result: GameResult
}
const mean = (xs: number[]) => xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0
export function quantile(xs: number[], q: number): number | null {
  if (!xs.length) return null
  const sorted = [...xs].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1)]
}
export function wilsonUpper(won: number, played: number): number | null {
  if (!played) return null
  const z = 1.6448536269514722
  const p = won / played
  return (p + z * z / (2 * played) + z * Math.sqrt(p * (1 - p) / played + z * z / (4 * played * played))) / (1 + z * z / played)
}
export const sideWon = (g: Played) => g.declarer === null ? null : g.declarer === 0 ? g.won === true : g.won === false
export function contractOf(g: Played & Partial<DealSummary>): string {
  if (g.declarer === null) return 'passed'
  if (g.game) return g.game
  const c = g.declaration?.contract
  return c ? (c.kind === 'suit' ? c.trump : c.kind) + (g.declaration?.hand ? '-hand' : '') : 'unknown'
}

/** Keep all seeds of a card together; repeated plays do not manufacture independent cards. */
export function groupedBounds(rows: Observation[], family = 1, resamples = 10_000) {
  const groups = new Map<number, { played: number; won: number }>()
  for (const x of rows) {
    const key = x.cluster ?? x.index
    const g = groups.get(key) ?? { played: 0, won: 0 }
    const outcome = sideWon(x.result.mine)
    if (outcome !== null) { g.played++; if (outcome) g.won++ }
    groups.set(key, g)
  }
  const clusters = [...groups.values()]
  if (clusters.length < 40) return { clusters: clusters.length, sufficient: false, upper95: null, familyUpper95: null }
  const rand = random('skatgo-strength-bootstrap/1')
  const rates: number[] = []
  for (let i = 0; i < resamples; i++) {
    let played = 0
    let won = 0
    for (let n = 0; n < clusters.length; n++) {
      const g = clusters[Math.floor(rand() * clusters.length)]
      played += g.played; won += g.won
    }
    if (played) rates.push(won / played)
  }
  return { clusters: clusters.length, sufficient: rates.length === resamples,
    upper95: quantile(rates, 0.95), familyUpper95: quantile(rates, 1 - 0.05 / family) }
}

export function measurements(rows: Observation[], family = 1, roundSize: 0 | 6 = 6) {
  const games = rows.map((x) => x.result)
  const r = recordOf(games.map((g) => g.mine))
  const scores = games.map((g) => g.mine.scores[0])
  const gaps = games.map((g) => g.mine.scores[0] - g.ai.scores[0])
  const seeds = [...new Set(rows.map((r) => r.seed))]
  const bySeed = seeds.map((seed) => {
    const group = recordOf(rows.filter((r) => r.seed === seed).map((r) => r.result.mine))
    return { seed, ...group, winRate: group.played ? group.won / group.played : null, upper95: wilsonUpper(group.won, group.played) }
  })
  const contracts = [...new Set(games.map((g) => contractOf(g.mine)))]
  const stratum = (sample: Observation[]) => {
    const record = recordOf(sample.map((r) => r.result.mine))
    return { ...record, distinctCards: new Set(sample.map((r) => r.index)).size,
      winRate: record.played ? record.won / record.played : null,
      uncertainty: groupedBounds(sample) }
  }
  const rounds: { total: number; sameAsAi: boolean; allWon: boolean }[] = []
  for (const seed of seeds) {
    const group = rows.filter((r) => r.seed === seed).sort((a, b) => a.index - b.index)
    for (let i = 0; roundSize && i + roundSize <= group.length; i += roundSize) {
      const six = group.slice(i, i + 6).map((r) => r.result)
      rounds.push({ total: six.reduce((s, g) => s + g.mine.scores[0], 0),
        sameAsAi: six.every((g) => g.mine.scores[0] === g.ai.scores[0]),
        allWon: six.every((g) => sideWon(g.mine) === true) })
    }
  }
  const audit = games.flatMap((g) => g.audit ?? [])
  const phases = [...new Set(audit.map((a) => a.phase))].map((phase) => {
    const decisions = audit.filter((a) => a.phase === phase)
    return { phase, decisions: decisions.length, deviations: decisions.filter((a) => a.loss > 0).length,
      severe: decisions.filter((a) => a.loss > 0 && a.severe).length,
      meanRank: mean(decisions.map((a) => a.rank)),
      meanRankDepth: mean(decisions.map((a) => {
        const n = a.candidateCount ?? a.candidates.length
        return n > 1 ? a.rank / (n - 1) : 0
      })) }
  })
  return {
    deals: games.length, distinctCards: new Set(rows.map((r) => r.index)).size, ...r,
    winRate: r.played ? r.won / r.played : null, allPassed: games.length - r.played,
    declaredRate: r.played ? r.declared / r.played : null,
    declaredWinRate: r.declared ? r.declaredWon / r.declared : null,
    defendedWinRate: r.defended ? r.defendedWon / r.defended : null,
    uncertainty: groupedBounds(rows, family), bySeed,
    roles: ['declarer', 'defender'].map((role) => ({ role, ...stratum(rows.filter((r) =>
      role === 'declarer' ? r.result.mine.declarer === 0 :
        r.result.mine.declarer !== null && r.result.mine.declarer !== 0)) })),
    contracts: contracts.map((contract) => ({
      contract, ...stratum(rows.filter((r) => contractOf(r.result.mine) === contract)),
    })),
    score: { mean: mean(scores), stddev: Math.sqrt(mean(scores.map((n) => (n - mean(scores)) ** 2))),
      negativeFraction: scores.length ? scores.filter((s) => s < 0).length / scores.length : null,
      p05: quantile(scores, 0.05), p50: quantile(scores, 0.5), p95: quantile(scores, 0.95) },
    aiGap: mean(gaps), xpPerDeal: mean(games.map((g) => g.xp)),
    sameSeatScores: games.filter((g) => g.mine.scores[0] === g.ai.scores[0]).length,
    sameTableScores: games.filter((g) => JSON.stringify(g.mine.scores) === JSON.stringify(g.ai.scores)).length,
    rounds: { count: rounds.length, sameAsAi: rounds.filter((r) => r.sameAsAi).length,
      allWon: rounds.filter((r) => r.allWon).length, p95: quantile(rounds.map((r) => r.total), 0.95),
      p99: quantile(rounds.map((r) => r.total), 0.99), max: rounds.length ? Math.max(...rounds.map((r) => r.total)) : null },
    choices: games.reduce((s, g) => s + g.choices, 0), deviations: games.reduce((s, g) => s + g.deviations, 0), phases,
  }
}

export function calibrationReport(rows: Observation[], expectedProfiles: string[], mode = 'ordinary') {
  const profiles = [...new Set(rows.filter((r) => r.variant === 'strength').map((r) => r.id))]
  if (JSON.stringify(profiles.slice().sort()) !== JSON.stringify(expectedProfiles.slice().sort())) throw new Error('calibration_profiles_incomplete')
  const results = ['standard', 'legacy', 'strength'].flatMap((variant) =>
    [...new Set(rows.filter((r) => r.variant === variant).map((r) => r.id))].map((id) => ({
      id, variant, ...measurements(rows.filter((r) => r.variant === variant && r.id === id), profiles.length,
        mode === 'daily-one' ? 0 : 6),
    })))
  const strength = results.filter((r) => r.variant === 'strength')
  const legacy = results.filter((r) => r.variant === 'legacy')
  const pairing = profiles.map((id) => {
    const newer = rows.filter((r) => r.id === id && r.variant === 'strength')
    const older = new Map(rows.filter((r) => r.id === id && r.variant === 'legacy').map((r) => [`${r.index}|${r.seed}`, r]))
    if (older.size !== newer.length || newer.some((r) => !older.has(`${r.index}|${r.seed}`))) throw new Error('calibration_unpaired')
    return { id, sameOutcomes: newer.filter((r) => sideWon(r.result.mine) === sideWon(older.get(`${r.index}|${r.seed}`)!.result.mine)).length,
      scoreChanges: newer.filter((r) => r.result.mine.scores[0] !== older.get(`${r.index}|${r.seed}`)!.result.mine.scores[0]).length }
  })
  return { results, pairing,
    gate: { applicable: mode === 'ordinary', ceiling: mode === 'ordinary' ? 0.35 : null, profiles: profiles.length,
      passed: mode === 'ordinary' ? strength.every((r) => r.uncertainty.sufficient && r.uncertainty.familyUpper95 !== null && r.uncertainty.familyUpper95 <= 0.35) : null,
      meanWinRate: mean(strength.map((r) => r.winRate ?? 0)), oldMeanWinRate: mean(legacy.map((r) => r.winRate ?? 0)),
      sixDealAiCopies: strength.reduce((n, r) => n + r.rounds.sameAsAi, 0),
      oldSixDealAiCopies: legacy.reduce((n, r) => n + r.rounds.sameAsAi, 0) },
  }
}
