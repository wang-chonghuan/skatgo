import type { Move } from '~/lib/skat/game'
import type { DealReview, SeatView } from '~/lib/skat/tournament'
import { getLocale } from '~/paraglide/runtime'

// The browser's side of free play on the server (SKATGO-40): two requests to /api/free
// (lib/free-handler.ts). The game is the token the server hands back; it lives in the page's memory.

export type FreeError = { error: string }
export type FreeReply = { token: string; steps: SeatView[]; revision: number; computer: string }

async function post(op: 'new' | 'act' | 'resume', body: object): Promise<FreeReply | FreeError> {
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

/** The game a token holds, as it stands: taken up after a change of language (SKATGO-79). */
export const freeResume = (token: string) => post('resume', { token })

/*
 * A free game carried across a change of language (SKATGO-79, the human: 「打牌过程中切换语言，咋导致牌都
 * 重新发了？」). Changing the language loads the page anew, and the game lives only in the page, so the
 * table's token goes along in the new address's fragment — which no server sees and nothing stores — and
 * the table there takes it up and clears it. A reload still starts a new game (SKATGO-40).
 */
const CARRY = '#game='
let onTable: string | null = null

/** The free table says which game it holds (null when it holds none). */
export const holdGame = (token: string | null) => {
  onTable = token
}

/** Before the language changes: the game on the table into the address, for the new page to take. */
export function carryGame() {
  if (onTable) history.replaceState(history.state, '', `${location.pathname}${location.search}${CARRY}${onTable}`)
}

/** On the new page: the game carried here, if any, taken out of the address. */
export function takeCarriedGame(): string | null {
  if (!location.hash.startsWith(CARRY)) return null
  const token = location.hash.slice(CARRY.length)
  history.replaceState(history.state, '', `${location.pathname}${location.search}`)
  return token || null
}

/** A finished game's worst card and replay (SKATGO-79); `text` is null when the explanation is not available. */
export async function freeReview(token: string): Promise<{ review: DealReview; text: string | null } | FreeError> {
  try {
    const res = await fetch('/api/free/review', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, locale: getLocale() }) })
    const data = (await res.json()) as { review: DealReview; text: string | null } | FreeError
    return res.ok ? data : { error: 'error' in data ? data.error : 'unavailable' }
  } catch {
    return { error: 'unavailable' }
  }
}

export const isFreeError = (r: FreeReply | FreeError): r is FreeError => 'error' in r
