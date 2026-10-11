import type { Move } from '~/lib/skat/game'
import type { DailyBoard, DailyReply, DailySize, DealReview } from '~/lib/skat/tournament'

// The browser's side of the daily tournament (SKATGO-35, SKATGO-36): its requests to /api/daily
// (lib/daily-handler.ts). Who is playing travels in the session or the tournament's own cookie, never
// in the body; a refusal comes back as `{ error }`.

export type DailyError = { error: string }

async function post<T extends object>(op: 'state' | 'act' | 'name' | 'board' | 'review', body: object): Promise<T | DailyError> {
  try {
    const res = await fetch(`/api/daily/${op}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const data = (await res.json()) as T | DailyError
    return res.ok ? data : { error: 'error' in data ? data.error : 'unavailable' }
  } catch {
    return { error: 'unavailable' }
  }
}

// Every call names which of the day's tournaments it is about, by its number of deals (SKATGO-77).

/** Where the player stands today; `open` also opens the current deal and returns it. */
export const dailyState = (size: DailySize, open: boolean) => post<DailyReply>('state', { size, open })

/** One move in the current deal, quoting the day, the deal and how many moves came before it. */
export const dailyAct = (size: DailySize, at: { day: string; deal: number; revision: number }, action: Move) => post<DailyReply>('act', { size, ...at, action })

/** Put today's finished entry on the board under `nickname`, or change it. */
export const dailyName = (size: DailySize, nickname: string) => post<{ nickname: string }>('name', { size, nickname })

/** A day's leaderboard, `back` days before today (0: today's; up to `BOARD_DAYS` − 1, SKATGO-80). */
export const dailyBoard = (size: DailySize, back: number) => post<DailyBoard>('board', { size, day: back })

/** A finished deal trick by trick, with SkatZero's card wherever the player's was not (SKATGO-79). */
export const dailyReview = (size: DailySize, deal: number) => post<DealReview>('review', { size, deal })

export const isError = <T extends object>(r: T | DailyError): r is DailyError => 'error' in r
