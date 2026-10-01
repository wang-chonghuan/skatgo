import type { Move } from '~/lib/skat/game'
import type { DailyBoard, DailyReply } from '~/lib/skat/tournament'

// The browser's side of the daily tournament (SKATGO-35, SKATGO-36): its requests to /api/daily
// (lib/daily-handler.ts). Who is playing travels in the session or the tournament's own cookie, never
// in the body; a refusal comes back as `{ error }`.

export type DailyError = { error: string }

async function post<T extends object>(op: 'state' | 'act' | 'name' | 'board', body: object): Promise<T | DailyError> {
  try {
    const res = await fetch(`/api/daily/${op}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const data = (await res.json()) as T | DailyError
    return res.ok ? data : { error: 'error' in data ? data.error : 'unavailable' }
  } catch {
    return { error: 'unavailable' }
  }
}

/** Where the player stands today; `open` also opens the current deal and returns it. */
export const dailyState = (open: boolean) => post<DailyReply>('state', { open })

/** One move in the current deal, quoting the day, the deal and how many moves came before it. */
export const dailyAct = (at: { day: string; deal: number; revision: number }, action: Move) => post<DailyReply>('act', { ...at, action })

/** Put today's finished entry on the board under `nickname`, or change it. */
export const dailyName = (nickname: string) => post<{ nickname: string }>('name', { nickname })

/** Today's leaderboard, or yesterday's final one. */
export const dailyBoard = (day: 'today' | 'yesterday') => post<DailyBoard>('board', { day })

export const isError = <T extends object>(r: T | DailyError): r is DailyError => 'error' in r
