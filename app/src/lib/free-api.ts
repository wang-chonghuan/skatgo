import type { Move, Seat } from '~/lib/skat/game'
import type { DealReview, SeatView } from '~/lib/skat/tournament'

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

/** A new game: a deal from the server's pool, played up to the learner's first move — dealt by `dealer`
 *  when named, the next deal of free play's round (SKATGO-88). */
export const freeNew = (dealer?: Seat) => post('new', dealer === undefined ? {} : { dealer })

/** One move in the game the token holds, quoting how many moves came before it. */
export const freeAct = (token: string, revision: number, action: Move) => post('act', { token, revision, action })

/** The game a token holds, as it stands: taken up after a change of language (SKATGO-79). */
export const freeResume = (token: string) => post('resume', { token })

/** A moment of the deal worth a word, said by Lina (1) or Noah (2) — or nothing (SKATGO-142). */
export type TalkKind = 'bid' | 'w1' | 'w2' | 'w3' | 'end'
export type FreeTalk = { kind: TalkKind; speaker: 1 | 2; line: string } | { kind: null }

/** Whether Lina or Noah has a line to say now; the kinds already said in this deal are not said again. Any failure is
 *  silence: the table never waits for it. */
export async function freeTalk(token: string, said: TalkKind[], lang: 'en' | 'de'): Promise<FreeTalk> {
  try {
    const res = await fetch('/api/free/talk', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, said, lang }) })
    return res.ok ? ((await res.json()) as FreeTalk) : { kind: null }
  } catch {
    return { kind: null }
  }
}

/*
 * A free game carried across a change of language (SKATGO-79, the human: 「打牌过程中切换语言，咋导致牌都
 * 重新发了？」). Changing the language loads the page anew, and the game lives only in the page, so the
 * table's token goes along in the new address's fragment — which no server sees and nothing stores — and
 * the table there takes it up and clears it. The round it is part of goes along too (SKATGO-88). A reload
 * takes the game up from this browser's storage instead (SKATGO-96, below).
 */
const CARRY = '#game='
const ROUND = '&round='
let onTable: { token: string; round: string | null } | null = null

/** The free table says which game it holds (null when it holds none), and its round, as a string. */
export const holdGame = (token: string | null, round: string | null = null) => {
  onTable = token ? { token, round } : null
}

/** Before the language changes: the game on the table into the address, for the new page to take. */
export function carryGame() {
  if (!onTable) return
  const round = onTable.round === null ? '' : `${ROUND}${encodeURIComponent(onTable.round)}`
  history.replaceState(history.state, '', `${location.pathname}${location.search}${CARRY}${onTable.token}${round}`)
}

/** On the new page: the game carried here, if any, and its round, taken out of the address. */
export function takeCarriedGame(): { token: string; round: string | null } | null {
  if (!location.hash.startsWith(CARRY)) return null
  const [token, round] = location.hash.slice(CARRY.length).split(ROUND)
  history.replaceState(history.state, '', `${location.pathname}${location.search}`)
  return token ? { token, round: round ? decodeURIComponent(round) : null } : null
}

/*
 * The game on the table kept in this browser (SKATGO-96, the human: 「刷新一下页面，当deal丢了，连game也丢了」): its
 * token and the round's finished deals, the same as a change of language carries. A reload or a later visit
 * takes it up; the server still keeps nothing, and a token over a day old starts a new round. Storage that
 * cannot be read or written is no storage: the table then starts anew, as it did before.
 */
const KEPT = 'skatgo.free.v1'

/** Keep the game on the table, with its round as a string; null forgets it. */
export function keepGame(token: string | null, round: string | null = null) {
  try {
    if (token) localStorage.setItem(KEPT, JSON.stringify({ token, round }))
    else localStorage.removeItem(KEPT)
  } catch {
    // Not kept: a reload starts anew.
  }
}

/** The game kept in this browser, if any. */
export function keptGame(): { token: string; round: string | null } | null {
  try {
    const kept = JSON.parse(localStorage.getItem(KEPT) ?? 'null') as { token?: unknown; round?: unknown } | null
    return kept && typeof kept.token === 'string' && kept.token ? { token: kept.token, round: typeof kept.round === 'string' ? kept.round : null } : null
  } catch {
    return null
  }
}

/** A finished game trick by trick, with SkatZero's card wherever the player's was not (SKATGO-79). */
export async function freeReview(token: string): Promise<DealReview | FreeError> {
  try {
    const res = await fetch('/api/free/review', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) })
    const data = (await res.json()) as DealReview | FreeError
    return res.ok ? data : { error: 'error' in data ? data.error : 'unavailable' }
  } catch {
    return { error: 'unavailable' }
  }
}

export const isFreeError = (r: FreeReply | FreeError): r is FreeError => 'error' in r
