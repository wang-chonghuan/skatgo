import type { Move } from '~/lib/skat/game'
import type { ProfileDeal, ProfileNote } from '~/lib/skat/profile'
import type { TalkKind, TalkReply } from '~/lib/table-talk'
import { DAILY_DEALS, type DailyBoard, type DailyReply, type DailySize, type DealReview } from '~/lib/skat/tournament'

// The browser's side of the daily tournament (SKATGO-35, SKATGO-36): its requests to /api/daily
// (lib/daily-handler.ts). Who is playing travels in the session or the tournament's own cookie, never
// in the body; a refusal comes back as `{ error }`.

export type DailyError = { error: string }

async function post<T extends object>(op: 'state' | 'act' | 'name' | 'nick' | 'board' | 'review' | 'profile' | 'talk', body: object): Promise<T | DailyError> {
  try {
    const res = await fetch(`/api/daily/${op}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const data = (await res.json()) as T | DailyError
    return res.ok ? data : { error: 'error' in data ? data.error : 'unavailable' }
  } catch {
    return { error: 'unavailable' }
  }
}

// Every call names which of the day's tournaments it is about, by its number of deals (SKATGO-77).

// Which of the day's competitions (SKATGO-131): the six-deal tournament, or the deal of the day (`size` 1).

/** Where the player stands today; `open` also opens the current deal and returns it. */
export const dailyState = (open: boolean, size: DailySize = DAILY_DEALS) => post<DailyReply>('state', { open, size })

/** One move in the current deal, quoting the day, the deal and how many moves came before it. */
export const dailyAct = (at: { size: DailySize; day: string; deal: number; revision: number }, action: Move) => post<DailyReply>('act', { ...at, action })

/** Change the player's name: from now on, and on today's finished entries (SKATGO-90). */
export const dailyName = (nickname: string) => post<{ nickname: string }>('name', { nickname })

/** The signed-in account's nickname now, for the settings (SKATGO-126); null before it has one. */
export const dailyNick = () => post<{ nickname: string | null }>('nick', {})

/** A day's leaderboard, `back` days before today (0: today's; up to `BOARD_DAYS` − 1, SKATGO-80). */
export const dailyBoard = (back: number, size: DailySize = DAILY_DEALS) => post<DailyBoard>('board', { day: back, size })

/** A finished deal trick by trick, with SkatZero's card wherever the player's was not (SKATGO-79). */
export const dailyReview = (deal: number, size: DailySize = DAILY_DEALS) => post<DealReview>('review', { deal, size })

/** The signed-in account's record of play (SKATGO-128): every deal against the AI, in the order played. */
export const dailyProfile = () => post<{ deals: ProfileDeal[]; notes: ProfileNote[] }>('profile', {})

/** The tournament: whether Lina or Noah has a line to say now at the deal in progress (SKATGO-142). Any failure is
 *  silence. */
export async function dailyTalk(size: DailySize, deal: number, said: TalkKind[], lang: 'en' | 'de'): Promise<TalkReply> {
  const r = await post<TalkReply>('talk', { size, deal, said, lang })
  return 'error' in r ? { kind: null } : r
}

export const isError = <T extends object>(r: T | DailyError): r is DailyError => 'error' in r
