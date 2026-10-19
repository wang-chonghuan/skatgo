import { Room, ServerError, type Client } from '@colyseus/core'
import { StateView } from '@colyseus/schema'
import { z } from 'zod'
import { actor, collectTrick, type Seat } from '../../app/src/lib/skat/game'
import { cleanNickname } from '../../app/src/lib/skat/nickname'
import { TICKET_MAX, ticketClaims, type TicketClaims } from '../../app/src/lib/room-ticket'
import { computerTurn, decided, type Logged } from './computers'
import { deckOf, plan, poolDealIndex, type Pool } from './free'
import {
  applyAction, applySeatMove, commandSchema, GRACE_MS, hash, privateView, publicView,
  Rejected, scoreEnded, secretEquals, tokenSchema, TTL_MS, type PoolDeal, type Snapshot,
} from './model'
import type { Policy } from './skatzero/policy'
import { MatchState, PlayerState } from './state'
import { Store } from './store'

export const RESTORE = Symbol('trusted-restore')
/** Who may come in: a trusted integration client with the admission key, or a browser with a ticket
 *  the web server signed with it (SKATGO-61). A new seat needs a nickname; a seat token alone takes a
 *  seat back. A browser opens a table only with an `open` ticket, which names the host's account
 *  (SKATGO-117). */
const admission = z.object({
  admissionKey: z.string().min(32).max(256).optional(),
  ticket: z.string().max(TICKET_MAX).optional(),
  seatToken: tokenSchema,
  inviteToken: tokenSchema.optional(),
  nickname: z.string().max(200).optional(),
}).strict()

export function makeRoom(store: Store, key: string, ready: () => boolean, aiDelay: number, policy: () => Policy | null, pool: () => Pool | null) {
  /** `key` for an integration client, the ticket's claims for a browser, or null. */
  const admitted = (o: z.infer<typeof admission>): 'key' | TicketClaims | null =>
    o.admissionKey !== undefined && secretEquals(o.admissionKey, key) ? 'key' : ticketClaims(key, o.ticket)
  /** A deal from free play's pool with this dealer, every seat's bidding with it. */
  const pick = (dealer: Seat): PoolDeal => {
    const p = pool()
    if (!p) throw new Rejected('not_ready')
    const d = p.deals[poolDealIndex(p, dealer)]
    return { dealer: d.dealer, deck: deckOf(d.deck), plans: d.computers }
  }
  return class SkatRoom extends Room<{ state: InstanceType<typeof MatchState> }> {
    state = new MatchState()
    autoDispose = false
    // Three seats, and room for a dropped person's reconnection beside whoever takes the seat meanwhile:
    // at three a full table locks itself and turns its own players away when they come back (SKATGO-117).
    // Who may sit is onJoin's to decide.
    maxClients = 6
    maxMessagesPerSecond = 20
    private snapshot!: Snapshot
    private serial: Promise<unknown> = Promise.resolve()
    private timer?: ReturnType<typeof setTimeout>
    private disposed = false
    private pendingDrops = new Map<string, { seat: number; at: number }>()
    /** Failed turns of the table in a row, for the retry's back-off. */
    private failures = 0

    async onCreate(options: unknown) {
      if ((options as { restore?: unknown })?.restore === RESTORE) {
        const id = (options as { id: string }).id
        this.roomId = id
        const restored = await store.change(id, s => {
          for (const p of s.seats) {
            if (p.session) {
              p.session = null
              p.disconnectedAt = Date.now()
              p.autopilot = false
            }
          }
          return { changed: true, value: null }
        })
        this.snapshot = restored.snapshot
      } else {
        const o = admission.parse(options)
        const by = admitted(o)
        if (!ready() || !by || (by !== 'key' && by.purpose !== 'open')) throw new ServerError(403, 'admission_denied')
        const nickname = cleanNickname(o.nickname ?? '')
        if (!o.inviteToken) throw new ServerError(400, 'creation_options_required')
        if (!nickname) throw new ServerError(400, 'nickname_refused')
        this.snapshot = {
          schema: 2, id: this.roomId, revision: 0, played: 0, humanSeats: 0, host: by === 'key' ? null : by.user,
          inviteHash: hash(o.inviteToken), game: null, plans: null, deals: 0, scored: 0, scores: [0, 0, 0],
          expiresAt: Date.now() + TTL_MS, nextActionAt: Date.now(),
          seats: Array.from({ length: 3 }, (_, i) => ({
            tokenHash: i === 0 ? hash(o.seatToken) : null, session: null,
            disconnectedAt: null, autopilot: false, nickname: i === 0 ? nickname : null,
          })),
        }
        await store.create(this.snapshot)
      }
      await this.setPrivate(true)
      this.setPatchRate(50)
      for (let i = 0; i < 3; i++) this.state.players.set(String(i), new PlayerState())
      this.publish(this.snapshot)
      this.onMessage('command', (client, input) => {
        this.enqueue(() => this.command(client, input)).catch(e => {
          client.send('receipt', { id: typeof input?.id === 'string' ? input.id.slice(0, 80) : '', ok: false,
            error: e instanceof Rejected ? e.message : 'storage_unavailable' })
        })
      })
    }
    onAuth(_client: Client, options: unknown) {
      const parsed = admission.safeParse(options)
      if (!ready() || !parsed.success || !admitted(parsed.data)) {
        throw new ServerError(403, 'admission_denied')
      }
      return parsed.data
    }
    async onJoin(client: Client, _options: unknown, auth: z.infer<typeof admission>) {
      return this.enqueue(async () => {
        const result = await store.change(this.roomId, s => {
          const tokenHash = hash(auth.seatToken)
          let seat = s.seats.findIndex(p => p.tokenHash === tokenHash)
          if (seat < 0) {
            if (!auth.inviteToken || hash(auth.inviteToken) !== s.inviteHash) throw new Rejected('invite_denied')
            if (s.humanSeats > 0) throw new Rejected('room_started')
            seat = s.seats.findIndex(p => !p.tokenHash)
            if (seat < 0) throw new Rejected('room_full')
            const nickname = cleanNickname(auth.nickname ?? '')
            if (!nickname) throw new Rejected('nickname_refused')
            s.seats[seat].nickname = nickname
          }
          const p = s.seats[seat]
          if (p.session) throw new Rejected('seat_already_connected')
          p.tokenHash = tokenHash
          p.session = client.sessionId
          p.disconnectedAt = null
          p.autopilot = false
          s.expiresAt = Date.now() + TTL_MS
          return { changed: true, value: seat }
        }).catch(e => {
          throw new ServerError(403, e instanceof Rejected ? e.message : 'storage_unavailable')
        })
        client.userData = { seat: result.value }
        client.view = new StateView()
        client.view.add(this.state.players.get(String(result.value))!)
        this.publish(result.snapshot)
      })
    }
    onDrop(client: Client) {
      if (client.userData?.seat === undefined) return
      this.pendingDrops.set(client.sessionId, { seat: client.userData.seat, at: Date.now() })
      if (ready() && !this.disposed) this.allowReconnection(client, GRACE_MS / 1000)
      return this.enqueue(() => this.detach(client)).catch(() => this.retry())
    }
    onReconnect(client: Client) {
      return this.enqueue(async () => {
        const result = await store.change(this.roomId, s => {
          const seat = client.userData?.seat
          const p = s.seats[seat]
          if (!p || (p.session && p.session !== client.sessionId)) throw new Rejected('seat_already_connected')
          p.session = client.sessionId
          p.disconnectedAt = null
          p.autopilot = false
          s.expiresAt = Date.now() + TTL_MS
          return { changed: true, value: null }
        })
        this.pendingDrops.delete(client.sessionId)
        this.publish(result.snapshot)
      })
    }
    onLeave(client: Client) {
      if (client.userData?.seat === undefined) return
      if (!this.pendingDrops.has(client.sessionId)) {
        this.pendingDrops.set(client.sessionId, { seat: client.userData.seat, at: Date.now() })
      }
      return this.enqueue(() => this.detach(client)).catch(() => this.retry())
    }
    private async detach(client: Client) {
      if (this.disposed || client.userData?.seat === undefined) return
      await this.flushDrops()
    }
    private async flushDrops() {
      for (const [session, drop] of this.pendingDrops) {
        const result = await store.change(this.roomId, s => {
          const p = s.seats[drop.seat]
          if (p.session !== session) return { changed: false, value: null }
          p.session = null
          p.disconnectedAt = drop.at
          p.autopilot = false
          return { changed: true, value: null }
        })
        this.pendingDrops.delete(session)
        this.publish(result.snapshot)
      }
    }
    private async command(client: Client, input: unknown) {
      const parsed = commandSchema.safeParse(input)
      if (!parsed.success) throw new Rejected('invalid_command')
      const cmd = parsed.data
      const seat = client.userData?.seat as Seat
      const result = await store.change(this.roomId, async (s, c) => {
        if (!ready() || s.seats[seat]?.session !== client.sessionId || s.seats[seat].autopilot) {
          throw new Rejected('not_your_seat')
        }
        const fingerprint = hash(JSON.stringify(cmd.action))
        const prior = await c.query(
          'SELECT fingerprint, receipt FROM multiplayer_commands WHERE room_id=$1 AND seat=$2 AND id=$3',
          [s.id, seat, cmd.id],
        )
        if (prior.rows[0]) {
          if (prior.rows[0].fingerprint !== fingerprint) throw new Rejected('command_id_reused')
          return { changed: false, value: prior.rows[0].receipt }
        }
        // Stale only if the game changed since the move was made: someone else dropping or coming back
        // changes the table, not the game (SKATGO-117).
        if (cmd.revision < (s.played ?? s.revision) || cmd.revision > s.revision) throw new Rejected('stale_revision')
        applyAction(s, seat, cmd.action, pick)
        s.played = s.revision + 1
        s.nextActionAt = Date.now() + aiDelay
        s.expiresAt = Date.now() + TTL_MS
        const receipt = { id: cmd.id, ok: true, revision: s.revision + 1 }
        await c.query('INSERT INTO multiplayer_commands VALUES ($1,$2,$3,$4,$5)',
          [s.id, seat, cmd.id, fingerprint, receipt])
        return { changed: true, value: receipt }
      })
      this.publish(result.snapshot)
      client.send('receipt', result.value)
    }
    private enqueue<T>(run: () => Promise<T>): Promise<T> {
      const job = this.serial.then(run)
      this.serial = job.then(() => {}, () => {})
      return job
    }
    private publish(s: Snapshot) {
      this.snapshot = s
      this.state.publicData = JSON.stringify(publicView(s))
      for (let i = 0; i < 3; i++) this.state.players.get(String(i))!.privateData = JSON.stringify(privateView(s, i))
      this.schedule()
    }
    private schedule() {
      clearTimeout(this.timer)
      if (this.disposed) return
      const s = this.snapshot
      const deadlines = [s.expiresAt]
      for (const p of s.seats) {
        if (p.disconnectedAt !== null && !p.autopilot) deadlines.push(p.disconnectedAt + GRACE_MS)
      }
      if (s.game && this.computerDue(s)) deadlines.push(s.nextActionAt)
      this.timer = setTimeout(() => {
        this.enqueue(() => this.advance()).catch(e => {
          if (e instanceof Rejected && e.message === 'room_expired') void this.expire()
          else this.retry(e)
        })
      }, Math.max(10, Math.min(...deadlines) - Date.now()))
    }
    /** The table's turn again after a failure, later each time it fails in a row (up to 30 s), with the
     *  failure's own reason in the log; not ready yet is no failure (SKATGO-117). */
    private retry(e?: unknown) {
      if (this.disposed) return
      let wait = 1000
      if (e !== undefined) {
        this.failures++
        wait = Math.min(1000 * 2 ** (this.failures - 1), 30_000)
        const reason = e instanceof Rejected ? e.message : e instanceof Error ? e.name : 'unknown'
        console.error(JSON.stringify({ event: 'room_turn_failed', reason, failures: this.failures }))
      }
      clearTimeout(this.timer)
      this.timer = setTimeout(() => this.enqueue(() => this.advance()).catch(err => this.retry(err)), wait)
    }
    private async advance() {
      if (!ready()) { this.retry(); return }
      await this.flushDrops()
      const result = await store.change(this.roomId, async s => {
        let changed = false
        const now = Date.now()
        for (const p of s.seats) {
          if (!p.session && p.disconnectedAt !== null && !p.autopilot && now >= p.disconnectedAt + GRACE_MS) {
            p.autopilot = true
            changed = true
          }
        }
        if (s.game && now >= s.nextActionAt && this.computerDue(s)) {
          // The computers' moves (SKATGO-61): the trick collected, a decided deal ended, or SkatZero's
          // turn for a computer's seat — from the deal's prepared plan, or a person's seat while a
          // computer stands in for them.
          const g = s.game
          let moves: Logged[] = []
          if (g.phase === 'trickEnd') s.game = collectTrick(g)
          else {
            const early = decided(g, seat => s.seats[seat].autopilot)
            const turn = actor(g)
            if (early) moves = [early]
            else if (turn !== null && s.plans) moves = await computerTurn(g, turn, plan(s.plans[String(turn) as '0' | '1' | '2']), policy()!)
            for (const l of moves) s.game = applySeatMove(s.game, l.seat, l.move)
          }
          scoreEnded(s)
          s.nextActionAt = now + aiDelay
          s.expiresAt = now + TTL_MS
          s.played = s.revision + 1
          changed = true
        }
        return { changed, value: null }
      })
      this.failures = 0
      this.publish(result.snapshot)
    }
    /** Whether the table waits for the computers: a trick to collect, a deal already decided, or a
     *  computer's seat on turn. */
    private computerDue(s: Snapshot): boolean {
      const g = s.game
      if (!g) return false
      if (g.phase === 'trickEnd') return true
      if (decided(g, seat => s.seats[seat].autopilot)) return true
      const turn = actor(g)
      return turn !== null && s.seats[turn].autopilot
    }
    /** A table past its lifetime goes, and so do its people; if the database will not let it go yet, it
     *  asks again later rather than failing the process (SKATGO-117). */
    private async expire() {
      clearTimeout(this.timer)
      try {
        await store.remove(this.roomId)
      } catch {
        console.error(JSON.stringify({ event: 'room_expire_failed' }))
        this.timer = setTimeout(() => void this.expire(), 30_000)
        return
      }
      this.disposed = true
      await this.disconnect().catch(() => {})
    }
    onDispose() {
      this.disposed = true
      clearTimeout(this.timer)
    }
  }
}
