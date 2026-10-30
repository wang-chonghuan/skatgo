// A private room from the browser (SKATGO-61, rooms since SKATGO-163). The room is a Colyseus room in the
// multiplayer service (SKATGO-20), reached directly over a WebSocket with a two-minute admission ticket from
// /api/room/ticket (lib/room-handler.ts). Browser-only.
//
// A seat is the account's: the browser keeps nothing. Coming back — after a lost connection, on another device —
// is entering the room's number again; the service seats the account where it sat.

import { Client, type Room } from '@colyseus/sdk'

import type { Move } from './skat/game'
import type { RoomPrivate, RoomPublic } from './skat/room-view'

const token = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('')

/** Why the service refused, as the page says it. */
export type TableError =
  | 'room_full' | 'room_not_found' | 'room_capacity' | 'slow_down' | 'too_many_tries' | 'sign_in_required'
  | 'already_in_room' | 'not_ready' | 'unreachable'
/** Refusals that pass by themselves — the service restarting, the network — so a way back keeps trying (SKATGO-117). */
export const PASSING: ReadonlySet<TableError> = new Set(['not_ready', 'unreachable', 'slow_down'])

async function post(path: string, body: object): Promise<{ status: number; data: Record<string, unknown> } | null> {
  try {
    const r = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    return { status: r.status, data: (await r.json().catch(() => ({}))) as Record<string, unknown> }
  } catch {
    return null
  }
}

const ANSWERS: TableError[] = ['room_full', 'room_not_found', 'too_many_tries', 'already_in_room', 'sign_in_required']
async function ticket(purpose: 'open' | 'join', room?: string): Promise<{ endpoint: string; ticket: string } | TableError> {
  const r = await post('/api/room/ticket', { for: purpose, room })
  if (!r) return 'unreachable'
  if (r.status === 200) return r.data as { endpoint: string; ticket: string }
  const said = ANSWERS.find((e) => e === r.data.error)
  if (said) return said
  if (r.status === 429) return 'slow_down'
  if (r.status === 503) return 'not_ready'
  return 'unreachable'
}

/** The number of the room the account is in, null for none (SKATGO-163). */
export async function myRoom(): Promise<string | null | TableError> {
  const r = await post('/api/room/mine', {})
  if (!r) return 'unreachable'
  if (r.status === 401) return 'sign_in_required'
  if (r.status !== 200) return 'not_ready'
  return typeof r.data.room === 'string' ? r.data.room : null
}

/** Whether the account may come into the room with this number — asked before going to it. */
export async function findRoom(code: string): Promise<true | TableError> {
  const t = await ticket('join', code)
  return typeof t === 'string' ? t : true
}

const KNOWN: TableError[] = ['room_full', 'room_not_found', 'room_capacity', 'already_in_room']
/** The service's own words for a refusal, as the page names it. */
const reason = (e: unknown): TableError => {
  const text = e instanceof Error ? e.message : String(e)
  const known = KNOWN.find((k) => text.includes(k))
  if (known) return known
  if (/locked/i.test(text)) return 'room_full'
  if (/admission_denied|not_ready/.test(text)) return 'not_ready'
  return /not found|no rooms/i.test(text) ? 'room_not_found' : 'unreachable'
}

/** Opens a new room, the account its host; the first deal is dealt at once. */
export async function openRoom(): Promise<Room | TableError> {
  const t = await ticket('open')
  if (typeof t === 'string') return t
  try {
    return await new Client(t.endpoint).create('skat', { ticket: t.ticket })
  } catch (e) {
    return reason(e)
  }
}

/** Comes into the room with this number: the account's own seat, or a computer's — or an away person's. */
export async function enterRoom(code: string): Promise<Room | TableError> {
  const t = await ticket('join', code)
  if (typeof t === 'string') return t
  try {
    return await new Client(t.endpoint).joinById(code, { ticket: t.ticket })
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

/** What a seat sends: a move, the next deal, or — SKATGO-163 — the host taking a person out, or leaving. */
export type RoomAction =
  | Move
  | { type: 'next' }
  | { type: 'kick'; seat: number }
  | { type: 'leave' }
  | { type: 'computer'; seat: number; on: boolean }
  | { type: 'start' }

/** One move or table action, sent with the revision it was made at; the service answers with a receipt
 *  carrying the returned id. */
export function sendAction(room: Room, revision: number, action: RoomAction): string {
  const id = token().slice(0, 32)
  room.send('command', { id, revision, action })
  return id
}

/** A newcomer who has just signed up to come into this room: whose room it was is recorded (SKATGO-117). The
 *  service decides whether it counts; nothing here waits for the answer. */
export function sayBrought(roomId: string) {
  void post('/api/room/referral', { roomId })
}
