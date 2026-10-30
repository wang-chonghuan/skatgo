// A private room's admission (SKATGO-61). The browser never holds the multiplayer service's admission
// key: the web server signs a short-lived ticket with it (/api/room/ticket), and the room accepts the
// ticket instead of the key. A ticket names the account it is for — every seat is an account's since
// SKATGO-163 — and what it allows, and expires after two minutes: `open` — a new room, its host the
// account; `join` — the room with this number, a seat in it or the account's own seat back. Server-only
// (node:crypto): the web's handler and the multiplayer service import it, never a page.

import { createHmac, hkdfSync, timingSafeEqual } from 'node:crypto'

import { ROOM_CODE } from './room-code'

const LABEL = 'skatgo-room-ticket/2'
/** How long a ticket stays good. */
export const TICKET_MS = 2 * 60 * 1000
/** The longest ticket the room takes; a ticket carries an account id and a room's number. */
export const TICKET_MAX = 320

/** What a ticket allows, for the account `user` (`user:<id>`): a new room, or the room `room`. */
export type TicketClaims = { purpose: 'open'; user: string } | { purpose: 'join'; user: string; room: string }

export { ROOM_CODE } from './room-code'

const keyOf = (admissionKey: string) => Buffer.from(hkdfSync('sha256', admissionKey, Buffer.alloc(0), LABEL, 32))
const sign = (admissionKey: string, body: string) => createHmac('sha256', keyOf(admissionKey)).update(body).digest('base64url')
const USER = /^user:[A-Za-z0-9_]{1,64}$/

export function issueTicket(admissionKey: string, claims: TicketClaims, now = Date.now()): string {
  const fields = claims.purpose === 'open' ? { p: 'open', u: claims.user } : { p: 'join', u: claims.user, r: claims.room }
  const body = Buffer.from(JSON.stringify({ v: 2, exp: now + TICKET_MS, ...fields })).toString('base64url')
  return `${body}.${sign(admissionKey, body)}`
}

/** What `ticket` allows, if it was signed with this key and has not expired; otherwise null. */
export function ticketClaims(admissionKey: string, ticket: unknown, now = Date.now()): TicketClaims | null {
  if (typeof ticket !== 'string' || ticket.length > TICKET_MAX) return null
  const [body, mac, extra] = ticket.split('.')
  if (!body || !mac || extra !== undefined) return null
  const want = Buffer.from(sign(admissionKey, body))
  const got = Buffer.from(mac)
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null
  try {
    const t = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (t.v !== 2 || typeof t.exp !== 'number' || t.exp <= now || t.exp > now + TICKET_MS) return null
    if (typeof t.u !== 'string' || !USER.test(t.u)) return null
    if (t.p === 'open') return { purpose: 'open', user: t.u }
    if (t.p === 'join' && typeof t.r === 'string' && ROOM_CODE.test(t.r)) return { purpose: 'join', user: t.u, room: t.r }
    return null
  } catch {
    return null
  }
}
