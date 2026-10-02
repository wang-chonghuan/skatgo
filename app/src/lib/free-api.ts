import type { Move } from '~/lib/skat/game'
import type { SeatView } from '~/lib/skat/tournament'

// The browser's side of free play on the server (SKATGO-40): two requests to /api/free
// (lib/free-handler.ts). The game is the token the server hands back; it lives in the page's memory.

export type FreeError = { error: string }
export type FreeReply = { token: string; steps: SeatView[]; revision: number; computer: string }

async function post(op: 'new' | 'act', body: object): Promise<FreeReply | FreeError> {
  try {
    const res = await fetch(`/api/free/${op}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const data = (await res.json()) as FreeReply | FreeError
    return res.ok ? data : { error: 'error' in data ? data.error : 'unavailable' }
  } catch {
    return { error: 'unavailable' }
  }
}

/** A new game: a deal from the server's pool, played up to the learner's first move. */
export const freeNew = () => post('new', {})

/** One move in the game the token holds, quoting how many moves came before it. */
export const freeAct = (token: string, revision: number, action: Move) => post('act', { token, revision, action })

export const isFreeError = (r: FreeReply | FreeError): r is FreeError => 'error' in r
