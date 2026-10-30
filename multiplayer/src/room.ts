import { randomInt } from 'node:crypto'
import { Room, ServerError, type Client } from '@colyseus/core'
import { StateView } from '@colyseus/schema'
import { z } from 'zod'
import { actor, collectTrick, type Seat } from '../../app/src/lib/skat/game'
import { TICKET_MAX, ticketClaims } from '../../app/src/lib/room-ticket'
import { computerTurn, decided, type Logged } from './computers'
import { nameOf } from './daily'
import { deckOf, plan, poolDealIndex, type Pool } from './free'
import {
  applyAction, applySeatMove, claimSeat, commandSchema, dealIfReady, emptyRoom, GRACE_MS, hash, newRoom, privateView, publicView,
  Rejected, roomOnly, scoreEnded, secretEquals, TTL_MS, type PoolDeal, type Snapshot,
} from './model'
import type { Policy } from './skatzero/policy'
import { MatchState, PlayerState } from './state'
import { Store } from './store'

export const RESTORE = Symbol('trusted-restore')
/** Whether anyone is at the table now. */
const online = (s: Snapshot) => s.seats.some(p => p.session !== null)
/** Who may come in: a trusted integration client with the admission key, naming the account it plays for, or a
 *  browser with a ticket the web server signed with it (SKATGO-61), which names the account (SKATGO-163). A seat is an
 *  account's: the same account comes back to it from any device. A browser opens a room only with an `open` ticket,
 *  and joins only the room its ticket names. */
const admission = z.object({
  admissionKey: z.string().min(32).max(256).optional(),
  ticket: z.string().max(TICKET_MAX).optional(),
  account: z.string().regex(/^user:[A-Za-z0-9_]{1,64}$/).optional(),
}).strict()
/** Who came in, and what they may do: open a room, or join `room` (any room, for an integration client). */
type Admitted = { account: string; open: boolean; room: string | null }
/** A room's number: six digits, never starting with 0. */
const drawNumber = () => String(randomInt(100_000, 1_000_000))

export function makeRoom(store: Store, key: string, ready: () => boolean, aiDelay: number, policy: () => Policy | null, pool: () => Pool | null) {
  const admitted = (o: z.infer<typeof admission>): Admitted | null => {
    if (o.admissionKey !== undefined && secretEquals(o.admissionKey, key)) return o.account ? { account: o.account, open: true, room: null } : null
    const t = ticketClaims(key, o.ticket)
    if (!t) return null
    return t.purpose === 'open' ? { account: t.user, open: true, room: null } : { account: t.user, open: false, room: t.room }
  }
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
              p.autopilot = p.joinsAt !== null
            }
          }
          return { changed: true, value: null }
        })
        this.snapshot = restored.snapshot
      } else {
        const by = admitted(admission.parse(options))
        if (!ready() || !by || !by.open) throw new ServerError(403, 'admission_denied')
        if (await store.roomOf(by.account)) throw new ServerError(409, 'already_in_room')
        const nickname = await store.transaction(c => nameOf(c, by.account, Date.now()))
        // A number nobody's live room holds (the table's key keeps it unique); a few tries, then the room is refused.
        let stored = false
        for (let i = 0; i < 20 && !stored; i++) {
          this.snapshot = newRoom(drawNumber(), by.account, nickname)
          stored = await store.create(this.snapshot)
        }
        if (!stored) throw new ServerError(503, 'room_capacity')
        this.roomId = this.snapshot.id
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
      const by = parsed.success ? admitted(parsed.data) : null
      if (!ready() || !by || (!by.open && by.room !== this.roomId)) throw new ServerError(403, 'admission_denied')
      return by
    }
    /** The account's own seat back, or — as a newcomer — a computer's seat, or that of someone away (SKATGO-163). The
     *  same account open elsewhere gives way to this connection. */
    async onJoin(client: Client, _options: unknown, by: Admitted) {
      return this.enqueue(async () => {
        const elsewhere: string[] = []
        const result = await store.change(this.roomId, async (s, c) => {
          let seat = s.seats.findIndex(p => p.account === by.account)
          let claimed = false
          if (seat >= 0) {
            const p = s.seats[seat]
            if (p.session && p.session !== client.sessionId) elsewhere.push(p.session)
            p.session = client.sessionId
            p.disconnectedAt = null
            p.autopilot = p.joinsAt !== null
            s.expiresAt = Date.now() + TTL_MS
          } else {
            if (await store.roomOf(by.account, s.id, c)) throw new Rejected('already_in_room')
            seat = claimSeat(s, by.account, await nameOf(c, by.account, Date.now()), client.sessionId)
            claimed = true
          }
          return { changed: true, value: { seat, claimed } }
        }).catch(e => {
          throw new ServerError(403, e instanceof Rejected ? e.message : 'storage_unavailable')
        })
        for (const session of elsewhere) this.dismiss(session, 'elsewhere')
        client.userData = { seat: result.value.seat, account: by.account }
        client.view = new StateView()
        client.view.add(this.state.players.get(String(result.value.seat))!)
        this.publish(result.snapshot)
      })
    }
    /** A connection that no longer holds its seat — taken out, gone, or open on another device — is told why and closed. */
    private dismiss(session: string, why: 'kicked' | 'left' | 'elsewhere' | 'closed') {
      const c = this.clients.find(x => x.sessionId === session)
      if (!c) return
      c.userData = undefined
      c.send('dismissed', { why })
      c.leave(4000)
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
          p.autopilot = p.joinsAt !== null
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
          p.autopilot = p.joinsAt !== null
          // Someone gone no longer holds the next deal the others asked for (SKATGO-165).
          if (dealIfReady(s, pick)) {
            s.played = s.revision + 1
            s.nextActionAt = Date.now() + aiDelay
          }
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
      const type = cmd.action.type
      /** Sessions whose seat went to a computer with this command: the person taken out, or the one leaving. */
      const gone: string[] = []
      const result = await store.change(this.roomId, async (s, c) => {
        const p = s.seats[seat]
        if (!ready() || p?.session !== client.sessionId) throw new Rejected('not_your_seat')
        // A newcomer waiting for the next deal, whose seat a computer plays, may still deal it, leave, or — the host — run
        // the room; a move is the computer's.
        if (p.autopilot && type !== 'next' && !roomOnly(cmd.action)) throw new Rejected('not_your_seat')
        const fingerprint = hash(JSON.stringify(cmd.action))
        const prior = await c.query(
          'SELECT fingerprint, receipt FROM multiplayer_commands WHERE room_id=$1 AND seat=$2 AND id=$3',
          [s.id, seat, cmd.id],
        )
        if (prior.rows[0]) {
          if (prior.rows[0].fingerprint !== fingerprint) throw new Rejected('command_id_reused')
          return { changed: false, value: prior.rows[0].receipt }
        }
        const room = roomOnly(cmd.action)
        // Stale only if the game changed since the move was made: someone else dropping or coming back
        // changes the table, not the game (SKATGO-117). Running the room is no move.
        if (!room && (cmd.revision < (s.played ?? s.revision) || cmd.revision > s.revision)) throw new Rejected('stale_revision')
        const sessions = s.seats.map(x => x.session)
        const before = s.game
        applyAction(s, seat, cmd.action, pick)
        s.seats.forEach((x, i) => { if (sessions[i] && x.session !== sessions[i]) gone.push(sessions[i]!) })
        // A change to the game itself: a move, a deal — not asking for the next deal while others have not (SKATGO-165).
        if (s.game !== before) s.played = s.revision + 1
        s.nextActionAt = Date.now() + aiDelay
        s.expiresAt = Date.now() + TTL_MS
        const receipt = { id: cmd.id, ok: true, revision: s.revision + 1 }
        await c.query('INSERT INTO multiplayer_commands VALUES ($1,$2,$3,$4,$5)',
          [s.id, seat, cmd.id, fingerprint, receipt])
        return { changed: true, value: receipt }
      })
      client.send('receipt', result.value)
      for (const session of gone) this.dismiss(session, type === 'kick' ? 'kicked' : 'left')
      if (emptyRoom(result.snapshot)) return this.close()
      this.publish(result.snapshot)
    }
    /** Nobody is left (SKATGO-163): the room goes now, its number free again. */
    private async close() {
      clearTimeout(this.timer)
      this.disposed = true
      await store.drop(this.roomId).catch(() => console.error(JSON.stringify({ event: 'room_close_failed' })))
      for (const c of [...this.clients]) this.dismiss(c.sessionId, 'closed')
      await this.disconnect().catch(() => {})
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
      if (s.game && online(s) && this.computerDue(s)) deadlines.push(s.nextActionAt)
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
        // Nobody online, nothing played (SKATGO-163): the computers do not go on by themselves.
        if (s.game && online(s) && now >= s.nextActionAt && this.computerDue(s)) {
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
            // One move a beat (SKATGO-164): a skat step — pick up, put away, the game — shows as free play shows it, one
            // after another; the next beat decides the rest again from the same cards.
            else if (turn !== null && s.plans) moves = (await computerTurn(g, turn, plan(s.plans[String(turn) as '0' | '1' | '2']), policy()!)).slice(0, 1)
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
