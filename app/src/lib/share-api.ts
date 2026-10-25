import { createIsomorphicFn } from '@tanstack/react-start'

import { callShare } from './daily-handler'
import type { Move } from './skat/game'
import type { DealSummary, SeatView } from './skat/tournament'

// The shared deal of the day's calls (SKATGO-132). A shared page's read runs in its route's loader — on the server
// straight to the service, so the card and the result are in the HTML a link preview reads; in the browser through
// /api/daily. The player's code, and practice, are the browser's only.

export type Shared = { day: string; scores: [number, number, number]; declarer: 0 | 1 | 2 | null; today: boolean }
export type PracticeReply = { token: string; steps: SeatView[]; revision: number; result: { mine: DealSummary; ai: DealSummary | null } | null }
export type ShareError = { error: string }

async function post<T>(op: string, body: object): Promise<T | ShareError> {
  try {
    const res = await fetch(`/api/daily/${op}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const data = (await res.json()) as T | ShareError
    return res.ok ? data : { error: (data as ShareError).error ?? 'unavailable' }
  } catch {
    return { error: 'unavailable' }
  }
}

/** The player's code for today's finished deal of the day. */
export const shareCode = () => post<{ code: string }>('share', {})

/** What a code shares, or null when there is no such code or the service does not answer. */
export const readShared = createIsomorphicFn()
  .server(async (code: string): Promise<Shared | null> => {
    try {
      const res = await callShare('read', { code })
      return res?.ok ? ((await res.json()) as Shared) : null
    } catch {
      return null
    }
  })
  .client(async (code: string): Promise<Shared | null> => {
    const r = await post<Shared>('shared', { code })
    return 'error' in r ? null : r
  })

/** A past day's deal of the day, dealt for practice; then each move. */
export const practiceNew = (day: string) => post<PracticeReply>('practice-new', { day })
export const practiceAct = (token: string, revision: number, action: Move) => post<PracticeReply>('practice-act', { token, revision, action })
