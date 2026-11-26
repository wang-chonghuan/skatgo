import type { ChallengeGame, ChallengeKind } from '~/lib/skat/challenge'
import type { Move } from '~/lib/skat/game'
import type { DealReview, SeatView } from '~/lib/skat/tournament'
import type { FreeError } from '~/lib/free-api'

// The browser's side of hard hands (SKATGO-248): requests to /api/challenge (lib/challenge-handler.ts). As free play, the
// deal is the token the server hands back, kept in the page's memory.

export type ChallengeReply = { token: string; steps: SeatView[]; revision: number; game: ChallengeGame; of: number }
/** The review, with whether the deal is passed (SKATGO-249) — won, or lost where SkatZero lost too. */
export type ChallengeReview = DealReview & { kind: ChallengeKind; n: number; passed: boolean }

async function post<T>(op: 'new' | 'act' | 'review' | 'again', body: object): Promise<T | FreeError> {
  try {
    const res = await fetch(`/api/challenge/${op}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const data = (await res.json()) as T | FreeError
    return res.ok ? data : { error: data && typeof data === 'object' && 'error' in data ? (data as FreeError).error : 'unavailable' }
  } catch {
    return { error: 'unavailable' }
  }
}

/** Deal `n` (from 1, the easiest) of a kind. */
export const challengeNew = (kind: ChallengeKind, n: number) => post<ChallengeReply>('new', { kind, n })
/** One move, quoting how many moves came before it. */
export const challengeAct = (token: string, revision: number, action: Move) => post<ChallengeReply>('act', { token, revision, action })
/** The same ten cards and skat, the other twenty dealt anew. */
export const challengeAgain = (token: string) => post<ChallengeReply>('again', { token })
/** The finished deal's review with SkatZero's run of it in the player's seat. */
export const challengeReview = (token: string) => post<ChallengeReview>('review', { token })
