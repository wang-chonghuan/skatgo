// The League from the browser (SKATGO-204): the page's state, a round asked for and the way into its room, and a finished
// deal's review (the day's check-in is lib/checkin.ts) — all through /api/league/* (lib/league-handler.ts). Browser-only.

import { Client, type Room } from '@colyseus/sdk'

import { jsonHeaders } from './session-token'
import type { LeagueMe, LegendBoard } from './skat/league'
import type { DealReview } from './skat/tournament'

/** What the League page shows: the fees by tier, the Legend board, and the account's own League (null for a guest). */
export type LeagueState = { fees: number[]; board: LegendBoard; me: LeagueMe | null }
/** Why the League refused, as the page names it. */
export type LeagueError =
  | 'sign_in_required' | 'not_enough_coins' | 'already_in_room' | 'no_table' | 'no_opponents' | 'room_capacity' | 'room_full'
  | 'tier_changed' | 'slow_down' | 'not_ready' | 'unreachable'
const KNOWN: LeagueError[] = ['sign_in_required', 'not_enough_coins', 'already_in_room', 'no_table', 'no_opponents', 'room_capacity', 'room_full', 'tier_changed', 'slow_down', 'not_ready']
/** Refusals that pass by themselves, so a way back keeps trying. */
export const PASSING_LEAGUE: ReadonlySet<LeagueError> = new Set(['not_ready', 'unreachable', 'slow_down'])

async function post<T>(op: string, body: object = {}): Promise<T | LeagueError> {
  try {
    const r = await fetch(`/api/league/${op}`, { method: 'POST', headers: await jsonHeaders(), body: JSON.stringify(body) })
    const data = (await r.json().catch(() => ({}))) as T & { error?: string }
    if (r.ok) return data
    return KNOWN.find((k) => k === data.error) ?? (r.status === 429 ? 'slow_down' : r.status === 503 ? 'not_ready' : 'unreachable')
  } catch {
    return 'unreachable'
  }
}

export const leagueState = () => post<LeagueState>('state')

/** A round in the account's tier: answers its room's number once seated — at once when a round is already running. */
export const playLeague = () => post<{ room: string }>('play')

/** Comes into the account's own round: its seat, from any device, after any drop. */
export async function enterLeague(): Promise<Room | LeagueError> {
  const t = await post<{ endpoint: string; room: string; ticket: string }>('ticket')
  if (typeof t === 'string') return t
  try {
    return await new Client(t.endpoint).joinById(t.room, { ticket: t.ticket })
  } catch (e) {
    const text = e instanceof Error ? e.message : String(e)
    return /admission_denied|not_ready/.test(text) ? 'not_ready' : /not found|no rooms/i.test(text) ? 'no_table' : 'unreachable'
  }
}

/** A finished deal of the round reviewed for this account: its result, the AI's game from the same seat, the trick most
 *  worth another look — and its XP, which counting it gives. */
export async function leagueReview(match: string, deal: number): Promise<DealReview | { error: string }> {
  const r = await post<DealReview>('review', { match, deal })
  return typeof r === 'string' ? { error: r } : r
}
