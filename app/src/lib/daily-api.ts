import type { Move } from '~/lib/skat/game'
import type { ProfileDeal } from '~/lib/skat/profile'
import type { DailyBoard, DailyReply, DealReview } from '~/lib/skat/tournament'

// The browser's side of the daily tournament (SKATGO-35, SKATGO-36): its requests to /api/daily
// (lib/daily-handler.ts). Who is playing travels in the session or the tournament's own cookie, never
// in the body; a refusal comes back as `{ error }`.

export type DailyError = { error: string }

async function post<T extends object>(op: 'state' | 'act' | 'name' | 'nick' | 'board' | 'review' | 'profile', body: object): Promise<T | DailyError> {
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
export const dailyState = (open: boolean) => post<DailyReply>('state', { open })

/** One move in the current deal, quoting the day, the deal and how many moves came before it. */
export const dailyAct = (at: { day: string; deal: number; revision: number }, action: Move) => post<DailyReply>('act', { ...at, action })

/** Change the player's name: from now on, and on today's finished entries (SKATGO-90). */
export const dailyName = (nickname: string) => post<{ nickname: string }>('name', { nickname })

/** The signed-in account's nickname now, for the settings (SKATGO-126); null before it has one. */
export const dailyNick = () => post<{ nickname: string | null }>('nick', {})

/** A day's leaderboard, `back` days before today (0: today's; up to `BOARD_DAYS` − 1, SKATGO-80). */
export const dailyBoard = (back: number) => post<DailyBoard>('board', { day: back })

/** A finished deal trick by trick, with SkatZero's card wherever the player's was not (SKATGO-79). */
export const dailyReview = (deal: number) => post<DealReview>('review', { deal })

/** The signed-in account's record of play (SKATGO-128): every deal against the AI, in the order played. */
export const dailyProfile = () => post<{ deals: ProfileDeal[] }>('profile', {})

export const isError = <T extends object>(r: T | DailyError): r is DailyError => 'error' in r
