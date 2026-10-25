import type { DealSummary } from '../../app/src/lib/skat/tournament'
import { PLAYER } from '../../app/src/lib/skat/tournament'

// The deal of the day (SKATGO-131) is chosen, not just dealt (the human: 「每日一副要挑选那种好玩的，刺激的，最好不要让玩家一直被
// 压着打的」): of the candidates dealt for a day, only those whose game — as the AI plays it from the player's seat —
// falls into one of four kinds, and never the same kind two days running (「不要每天选一样的」).

/** The four kinds of a good deal, read from the AI's game in the player's seat. */
export type DealKind =
  /** Declared and won with 61–89 card points: won, but in doubt to the end. */
  | 'closeWin'
  /** Declared Null and won. */
  | 'nullWin'
  /** Declared and won Schneider or Schwarz. */
  | 'bigWin'
  /** Defended and brought the declarer down. */
  | 'defended'

/** The contract a deal's game was, for rotating them over the days. */
export type ContractKind = 'suit' | 'grand' | 'null'

export type DealPick = { kind: DealKind; contract: ContractKind; declarerPoints: number }

/** Which kind a deal is, from the AI's game in the player's seat; null when it is none of the four. */
export function kindOf(ai: DealSummary): DealPick | null {
  if (ai.declarer === null || ai.declaration === null || ai.detail === null) return null
  const contract = ai.declaration.contract.kind as ContractKind
  const points = ai.detail.declarerPoints
  if (ai.declarer !== PLAYER) return ai.won ? null : { kind: 'defended', contract, declarerPoints: points }
  if (!ai.won) return null
  if (contract === 'null') return { kind: 'nullWin', contract, declarerPoints: points }
  if (ai.detail.schneider || ai.detail.schwarz) return { kind: 'bigWin', contract, declarerPoints: points }
  return points >= 61 && points <= 89 ? { kind: 'closeWin', contract, declarerPoints: points } : null
}

/** How often each kind is wanted when the candidates offer several: a close win most, a big win now and then. */
const WEIGHT: Record<DealKind, number> = { closeWin: 4, defended: 3, nullWin: 2, bigWin: 1 }

/**
 * The deal of the day among candidates that have a kind (`before`: the days before, newest first): never the kind of
 * the day before; a contract the last two days have not had, where one is offered; among the player's wins, the closest first (61–75 before 76–89).
 * `rand` picks the kind by weight among those offered. Null when no candidate may be taken.
 */
export function pickOfDay<T>(candidates: { item: T; pick: DealPick }[], before: DealPick[], rand: () => number): { item: T; pick: DealPick } | null {
  const yesterday = before[0]?.kind
  const allowed = candidates.filter((c) => c.pick.kind !== yesterday)
  if (!allowed.length) return null
  const kinds = [...new Set(allowed.map((c) => c.pick.kind))]
  const total = kinds.reduce((n, k) => n + WEIGHT[k], 0)
  let r = rand() * total
  const kind = kinds.find((k) => (r -= WEIGHT[k]) < 0) ?? kinds[kinds.length - 1]
  const ofKind = allowed.filter((c) => c.pick.kind === kind)
  // The contracts of the last two days: a third day with the same contract only when nothing else is offered.
  const recent = new Set(before.slice(0, 2).map((b) => b.contract))
  const fresh = ofKind.filter((c) => !recent.has(c.pick.contract))
  const pool = fresh.length ? fresh : ofKind
  const close = (c: { pick: DealPick }) => (c.pick.kind === 'closeWin' ? (c.pick.declarerPoints <= 75 ? 0 : 1) : 0)
  return [...pool].sort((a, b) => close(a) - close(b))[0]
}
