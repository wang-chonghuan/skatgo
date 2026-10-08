// A private table's admission (SKATGO-61). The browser never holds the multiplayer service's admission
// key: the web server signs a short-lived ticket with it (/api/room/ticket), and the room accepts the
// ticket instead of the key. A ticket carries nothing but its expiry; whoever holds one may create a
// table or sit down at one they were invited to, for two minutes. Server-only (node:crypto): the web's
// handler and the multiplayer service import it, never a page.

import { createHmac, hkdfSync, timingSafeEqual } from 'node:crypto'

const LABEL = 'skatgo-room-ticket/1'
/** How long a ticket stays good. */
export const TICKET_MS = 2 * 60 * 1000

const keyOf = (admissionKey: string) => Buffer.from(hkdfSync('sha256', admissionKey, Buffer.alloc(0), LABEL, 32))
const sign = (admissionKey: string, body: string) => createHmac('sha256', keyOf(admissionKey)).update(body).digest('base64url')

export function issueTicket(admissionKey: string, now = Date.now()): string {
  const body = Buffer.from(JSON.stringify({ v: 1, exp: now + TICKET_MS })).toString('base64url')
  return `${body}.${sign(admissionKey, body)}`
}

/** Whether `ticket` was signed with this key and has not expired. */
export function ticketValid(admissionKey: string, ticket: unknown, now = Date.now()): boolean {
  if (typeof ticket !== 'string' || ticket.length > 200) return false
  const [body, mac, extra] = ticket.split('.')
  if (!body || !mac || extra !== undefined) return false
  const want = Buffer.from(sign(admissionKey, body))
  const got = Buffer.from(mac)
  if (want.length !== got.length || !timingSafeEqual(want, got)) return false
  try {
    const t = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    return t.v === 1 && typeof t.exp === 'number' && t.exp > now && t.exp <= now + TICKET_MS
  } catch {
    return false
  }
}
