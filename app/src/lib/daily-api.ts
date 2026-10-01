import type { Move } from '~/lib/skat/game'
import type { DailyReply } from '~/lib/skat/tournament'

// The browser's side of the daily tournament (SKATGO-35): its two requests to /api/daily
// (lib/daily-handler.ts). Who is playing travels in the session or the tournament's own cookie, never
// in the body; a refusal comes back as `{ error }`.

export type DailyError = { error: string }

async function post(op: 'state' | 'act', body: object): Promise<DailyReply | DailyError> {
  try {
    const res = await fetch(`/api/daily/${op}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const data = (await res.json()) as DailyReply | DailyError
    return res.ok ? data : { error: 'error' in data ? data.error : 'unavailable' }
  } catch {
    return { error: 'unavailable' }
  }
}

/** Where the player stands today; `open` also opens the current deal and returns it. */
export const dailyState = (open: boolean) => post('state', { open })

/** One move in the current deal, quoting the day, the deal and how many moves came before it. */
export const dailyAct = (at: { day: string; deal: number; revision: number }, action: Move) => post('act', { ...at, action })

export const isError = (r: DailyReply | DailyError): r is DailyError => 'error' in r
