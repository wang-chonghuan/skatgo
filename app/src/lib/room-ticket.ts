// A private table's admission (SKATGO-61). The browser never holds the multiplayer service's admission
// key: the web server signs a short-lived ticket with it (/api/room/ticket), and the room accepts the
// ticket instead of the key. A ticket says what it is for and expires after two minutes: `open` — a new
// table, which needs an account, so it names the account that opens it (SKATGO-117); `join` — a seat at
// a table the holder was invited to, or their own seat back. Server-only (node:crypto): the web's
// handler and the multiplayer service import it, never a page.

import { createHmac, hkdfSync, timingSafeEqual } from 'node:crypto'

const LABEL = 'skatgo-room-ticket/1'
/** How long a ticket stays good. */
export const TICKET_MS = 2 * 60 * 1000
/** The longest ticket the room takes; an `open` ticket carries an account id. */
export const TICKET_MAX = 300

/** What a ticket allows. `user` is the account opening a table, as `user:<id>`; only `open` has one. */
export type TicketClaims = { purpose: 'open'; user: string } | { purpose: 'join' }

const keyOf = (admissionKey: string) => Buffer.from(hkdfSync('sha256', admissionKey, Buffer.alloc(0), LABEL, 32))
const sign = (admissionKey: string, body: string) => createHmac('sha256', keyOf(admissionKey)).update(body).digest('base64url')
const USER = /^user:[A-Za-z0-9_]{1,64}$/

export function issueTicket(admissionKey: string, claims: TicketClaims, now = Date.now()): string {
  const fields = claims.purpose === 'open' ? { p: 'open', u: claims.user } : { p: 'join' }
  const body = Buffer.from(JSON.stringify({ v: 1, exp: now + TICKET_MS, ...fields })).toString('base64url')
  return `${body}.${sign(admissionKey, body)}`
}

/** What `ticket` allows, if it was signed with this key and has not expired; otherwise null. A ticket
 *  that names no purpose is a `join` one. */
export function ticketClaims(admissionKey: string, ticket: unknown, now = Date.now()): TicketClaims | null {
  if (typeof ticket !== 'string' || ticket.length > TICKET_MAX) return null
  const [body, mac, extra] = ticket.split('.')
  if (!body || !mac || extra !== undefined) return null
  const want = Buffer.from(sign(admissionKey, body))
  const got = Buffer.from(mac)
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null
  try {
    const t = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (t.v !== 1 || typeof t.exp !== 'number' || t.exp <= now || t.exp > now + TICKET_MS) return null
    if (t.p === 'open') return typeof t.u === 'string' && USER.test(t.u) ? { purpose: 'open', user: t.u } : null
    return { purpose: 'join' }
  } catch {
    return null
  }
}
