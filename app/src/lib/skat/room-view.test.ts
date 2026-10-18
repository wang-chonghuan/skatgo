import { describe, expect, it } from 'vitest'

import { createHmac, hkdfSync } from 'node:crypto'

import { issueTicket, TICKET_MS, ticketClaims } from '../room-ticket'
import { fullDeck } from './cards'
import { type Seat, applyMove, deal } from './game'
import { type RoomPublic, roomGame, roomSeat, viewSeat } from './room-view'
import { seegerFabian } from './tournament'

// SKATGO-61. A private table publishes one view for everyone; each person's table turns it so they sit
// in seat 0. Expected values come from the table's geometry, not from running the code: clockwise
// order is kept, and every seat-numbered fact moves with the turn.

/** The public view the service would publish for `g` (multiplayer's publicView, for a dealt game). */
function publish(g: ReturnType<typeof deal>): RoomPublic {
  return {
    roomId: 'r', revision: 1, humanSeats: 3, expiresAt: 0, started: true, deals: 1, scores: [0, 0, 0],
    seats: [0, 1, 2].map((seat) => ({ seat, kind: 'human', nickname: `P${seat}`, occupied: true, connected: true, control: 'human', reconnectUntil: null, cardCount: g.hands[seat].length })),
    phase: g.phase, actor: null, turn: g.turn, dealer: g.dealer, bidding: g.bidding, declarer: g.declarer, bid: g.bid,
    pickedUp: g.pickedUp, declaration: g.declaration, trick: g.trick, tricks: g.tricks, result: g.result,
    ouvertHand: null, skat: null, early: null,
  }
}

describe('a private table seen from each seat', () => {
  it('turns seats so the viewer is 0 and the order stays clockwise', () => {
    for (const me of [0, 1, 2] as Seat[]) {
      expect(viewSeat(me, me)).toBe(0)
      expect(viewSeat((me + 1) % 3, me)).toBe(1)
      for (const s of [0, 1, 2]) expect(roomSeat(viewSeat(s, me), me)).toBe(s)
    }
  })

  it('gives each viewer their own hand, the others face down, and moves every seat-numbered fact', () => {
    let g = deal(1, fullDeck())
    // Middlehand (seat 0 when seat 1 deals) says 18, forehand (seat 2) passes.
    g = applyMove(g, { type: 'bid', value: 'bid' })
    g = applyMove(g, { type: 'bid', value: 'pass' })
    const pub = publish(g)
    for (const me of [0, 1, 2] as Seat[]) {
      const view = roomGame(pub, { seat: me, hand: g.hands[me], buried: [] })!
      expect(view.hands[0]).toEqual(g.hands[me])
      for (const v of [1, 2]) expect(view.hands[v]).toEqual(Array(10).fill({ suit: 'C', rank: '7' }))
      expect(view.dealer).toBe(viewSeat(1, me))
      expect(view.bidding.speaker).toBe(viewSeat(g.bidding.speaker, me))
      expect(view.bidding.listener).toBe(viewSeat(g.bidding.listener, me))
      expect(view.bidding.log.map((e) => e.seat)).toEqual(g.bidding.log.map((e) => viewSeat(e.seat, me)))
    }
  })

  it("turns a finished deal so each viewer's Seeger-Fabian scores are the room's, turned", () => {
    // The declarer (seat 2) loses: −2 × value − 50 for them, 40 for each defender.
    const pub: RoomPublic = { ...publish(deal(0, fullDeck())), phase: 'done', declarer: 2, bid: 18, result: { won: false, value: 24, score: -48 } as RoomPublic['result'], skat: [] }
    const room = seegerFabian({ phase: 'done', declarer: 2, result: pub.result })
    for (const me of [0, 1, 2] as Seat[]) {
      const view = roomGame(pub, { seat: me, hand: [], buried: [] })!
      expect(seegerFabian(view)).toEqual([0, 1, 2].map((v) => room[roomSeat(v, me)]))
    }
  })

  it('has nothing to draw in the lobby', () => {
    expect(roomGame({ ...publish(deal(0, fullDeck())), phase: 'lobby', bidding: null }, { seat: 0, hand: [], buried: [] })).toBeNull()
  })
})

describe('a private table\'s admission ticket', () => {
  const key = 'k'.repeat(64)
  const open = { purpose: 'open', user: 'user:user_2abc' } as const
  it('is good for two minutes with the key that signed it', () => {
    const now = 1_000_000
    const t = issueTicket(key, open, now)
    expect(ticketClaims(key, t, now)).toEqual(open)
    expect(ticketClaims(key, t, now + TICKET_MS - 1)).toEqual(open)
    expect(ticketClaims(key, t, now + TICKET_MS)).toBeNull()
    expect(ticketClaims('x'.repeat(64), t, now)).toBeNull()
  })
  it('says what it is for: opening names the account, joining names none (SKATGO-117)', () => {
    expect(ticketClaims(key, issueTicket(key, { purpose: 'join' }))).toEqual({ purpose: 'join' })
    expect(ticketClaims(key, issueTicket(key, open))).toEqual(open)
    // A ticket from before purposes (signed as the web signed it then) only sits down.
    const body = Buffer.from(JSON.stringify({ v: 1, exp: Date.now() + TICKET_MS - 1000 })).toString('base64url')
    const mac = createHmac('sha256', Buffer.from(hkdfSync('sha256', key, Buffer.alloc(0), 'skatgo-room-ticket/1', 32))).update(body).digest('base64url')
    expect(ticketClaims(key, `${body}.${mac}`)).toEqual({ purpose: 'join' })
  })
  it('is refused when altered or malformed', () => {
    const t = issueTicket(key, open)
    const [body, mac] = t.split('.')
    const longer = Buffer.from(JSON.stringify({ v: 1, exp: Date.now() + 10 * TICKET_MS, p: 'open', u: 'user:user_2abc' })).toString('base64url')
    expect(ticketClaims(key, `${longer}.${mac}`)).toBeNull()
    expect(ticketClaims(key, `${body}.${mac}x`)).toBeNull()
    expect(ticketClaims(key, `${body}`)).toBeNull()
    expect(ticketClaims(key, 42)).toBeNull()
    const noUser = Buffer.from(JSON.stringify({ v: 1, exp: Date.now() + TICKET_MS - 1000, p: 'open' })).toString('base64url')
    expect(ticketClaims(key, `${noUser}.${mac}`)).toBeNull()
  })
})
