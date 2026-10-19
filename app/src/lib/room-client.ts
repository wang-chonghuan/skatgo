// A private table from the browser (SKATGO-61). The table is a Colyseus room in the multiplayer
// service (SKATGO-20), reached directly over a WebSocket with a two-minute admission ticket from
// /api/room/ticket (lib/room-handler.ts). Browser-only.
//
// What the browser keeps: for each table it sat down at, its private seat token — and, for the host,
// the invite code to show again — in localStorage under one key per table. That is what lets the same
// link bring a person back to their seat, and it is all the storage a table needs (grill Q3). The
// invite code travels in the link's fragment (`#…`), which no server sees.

import { Client, type Room } from '@colyseus/sdk'

import type { Move } from './skat/game'
import type { RoomPrivate, RoomPublic } from './skat/room-view'

const STORE = 'skatgo-table/'

/** `noSignUp`: a guest turned the sign-up line away at this table (SKATGO-117). */
export type Saved = { seat: string; invite?: string; noSignUp?: true }

export function savedSeat(roomId: string): Saved | null {
  try {
    const raw = localStorage.getItem(STORE + roomId)
    return raw ? (JSON.parse(raw) as Saved) : null
  } catch {
    return null
  }
}
export function save(roomId: string, saved: Saved) {
  try {
    localStorage.setItem(STORE + roomId, JSON.stringify(saved))
  } catch {
    // Storage refused (a private window may): the table still works, only the way back is lost.
  }
}

const token = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('')

/** Why the service refused, as the page says it. */
export type TableError =
  | 'room_started' | 'room_full' | 'invite_denied' | 'nickname_refused' | 'room_not_found' | 'room_capacity' | 'slow_down'
  | 'sign_in_required' | 'seat_taken' | 'not_ready' | 'unreachable'
/** Refusals that pass by themselves — the service restarting, this seat still open in a connection that
 *  is going away, the network — so a way back keeps trying (SKATGO-117). */
export const PASSING: ReadonlySet<TableError> = new Set(['not_ready', 'seat_taken', 'unreachable', 'slow_down'])

async function ticket(purpose: 'open' | 'join'): Promise<{ endpoint: string; ticket: string } | TableError> {
  try {
    const r = await fetch('/api/room/ticket', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ for: purpose }) })
    if (r.status === 429) return 'slow_down'
    if (r.status === 401) return 'sign_in_required'
    if (r.status === 503) return 'not_ready'
    if (!r.ok) return 'unreachable'
    return (await r.json()) as { endpoint: string; ticket: string }
  } catch {
    return 'unreachable'
  }
}

const KNOWN: TableError[] = ['room_started', 'room_full', 'invite_denied', 'nickname_refused', 'room_not_found', 'room_capacity']
/** The service's own words for a refusal, as the page names it. */
const reason = (e: unknown): TableError => {
  const text = e instanceof Error ? e.message : String(e)
  const known = KNOWN.find((k) => text.includes(k))
  if (known) return known
  if (text.includes('seat_already_connected')) return 'seat_taken'
  if (/locked/i.test(text)) return 'room_full'
  if (/admission_denied|not_ready/.test(text)) return 'not_ready'
  return /not found|no rooms/i.test(text) ? 'room_not_found' : 'unreachable'
}

/** Opens a new table with the host in seat 0. */
export async function openTable(nickname: string): Promise<{ room: Room; invite: string } | TableError> {
  const t = await ticket('open')
  if (typeof t === 'string') return t
  const seat = token()
  const invite = token()
  try {
    const room = await new Client(t.endpoint).create('skat', { ticket: t.ticket, seatToken: seat, inviteToken: invite, nickname })
    save(room.roomId, { seat, invite })
    return { room, invite }
  } catch (e) {
    return reason(e)
  }
}

/** Sits down at a table: back in this browser's seat, or — with the invite and a nickname — in a new one. */
export async function sitDown(roomId: string, join?: { invite: string; nickname: string }): Promise<Room | TableError> {
  const saved = savedSeat(roomId)
  if (!saved && !join) return 'invite_denied'
  const t = await ticket('join')
  if (typeof t === 'string') return t
  const seat = saved?.seat ?? token()
  try {
    const room = await new Client(t.endpoint).joinById(roomId, {
      ticket: t.ticket, seatToken: seat, ...(saved ? {} : { inviteToken: join!.invite, nickname: join!.nickname }),
    })
    if (!saved) save(roomId, { seat })
    return room
  } catch (e) {
    return reason(e)
  }
}

/** The table's state as this seat receives it. */
export type TableState = { pub: RoomPublic; mine: RoomPrivate }

/** Reads the room's synchronised state: everyone's public view and this seat's own cards. */
export function readState(room: Room): TableState | null {
  // Each seat's private field reaches only that seat (Colyseus StateView): the one that is filled is ours.
  const state = room.state as { publicData?: string; players?: Map<string, { privateData?: string }> & { forEach: (f: (p: { privateData?: string }) => void) => void } }
  if (!state?.publicData) return null
  let mine: RoomPrivate | null = null
  state.players?.forEach((p) => {
    if (p.privateData) mine = JSON.parse(p.privateData) as RoomPrivate
  })
  if (!mine) return null
  return { pub: JSON.parse(state.publicData) as RoomPublic, mine }
}

/** One move or table action, sent with the revision it was made at; the service answers with a receipt
 *  carrying the returned id. */
export function sendAction(room: Room, revision: number, action: Move | { type: 'start' } | { type: 'next' }): string {
  const id = token().slice(0, 32)
  room.send('command', { id, revision, action })
  return id
}

/** A guest who has just signed up at this table: whose table it was is recorded (SKATGO-117). The
 *  service decides whether it counts; nothing here waits for the answer. */
export function sayBrought(roomId: string) {
  const saved = savedSeat(roomId)
  if (!saved) return
  void fetch('/api/room/referral', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ roomId, seatToken: saved.seat }) }).catch(() => {})
}
