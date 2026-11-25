import { randomInt } from 'node:crypto'
import { Room, ServerError, type Client } from '@colyseus/core'
import { StateView } from '@colyseus/schema'
import { z } from 'zod'
import { actor, collectTrick, type Seat } from '../../app/src/lib/skat/game'
import { TICKET_MAX, ticketClaims } from '../../app/src/lib/room-ticket'
import { computerTurn, decided, type Logged } from './computers'
import { nameOf } from './daily'
import { plan, poolDealOf, type Pool } from './free'
import { AWAY_MS, leftOutcome } from '../../app/src/lib/skat/league'
import { leagueDeal, personaTurnPolicy, settleLeague, settlePending } from './league'
import {
  applyAction, applySeatMove, claimSeat, commandSchema, dealIfReady, emptyRoom, GRACE_MS, hash, logMove, newRoom, nextDue, playingLeague, privateView, publicView,
  Rejected, roomOnly, scoreEnded, secretEquals, TTL_MS, type PoolDeal, type Snapshot,
} from './model'
import type { Policy } from './skatzero/policy'
import { MatchState, PlayerState } from './state'
import { Store } from './store'
import { type LiveTable, leaveOtherTables, registerTable, unregisterTable } from './tables'

export const RESTORE = Symbol('trusted-restore')
/** Whether anyone is at the table now. */
const online = (s: Snapshot) => s.seats.some(p => p.session !== null)
/** Whether the computers play on: with someone at the table — or always at a League table (SKATGO-204), whose deal must end
 *  to be scored, a computer playing for whoever is away. */
const playsOn = (s: Snapshot) => online(s) || !!s.league
/** A person back at their League seat (SKATGO-206): back before the deal on the table is lost for them, it costs nothing
 *  more; back to the result of a deal that ended while they were away, it counts as it came out. */
async function backAtLeague(s: Snapshot, c: Parameters<typeof settlePending>[1], seat: number) {
  if (!s.league) return
  const p = s.seats[seat]
  if (!p.forfeit) delete p.stake
  await settlePending(s, c, seat, true)
}
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
    return poolDealOf(p, dealer)
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
        // A new table: the account leaves every other first (SKATGO-235).
        await leaveOtherTables(store, by.account)
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
      registerTable(this.roomId, this.live)
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
      // Coming to this table, the account leaves every other (SKATGO-235) — before this table's turn, so two tables never
      // wait on each other.
      await leaveOtherTables(store, by.account, this.roomId)
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
            // Back at a League table they had left, before the next deal took their seat: they stay (SKATGO-205).
            delete p.leaving
            await backAtLeague(s, c, seat)
            s.expiresAt = Date.now() + TTL_MS
          } else {
            // A League table's seats are its own people's (SKATGO-204): nobody else comes in.
            if (s.league) throw new Rejected('room_full')
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
        const result = await store.change(this.roomId, async (s, c) => {
          const seat = client.userData?.seat
          const p = s.seats[seat]
          if (!p || (p.session && p.session !== client.sessionId)) throw new Rejected('seat_already_connected')
          p.session = client.sessionId
          p.disconnectedAt = null
          p.autopilot = p.joinsAt !== null
          await backAtLeague(s, c, seat)
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
          // Gone from a League table during a deal: what it costs them if they do not see it out (SKATGO-206).
          if (playingLeague(s)) p.stake ??= leftOutcome(s.game!.declarer, drop.seat)
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
        const scored = s.scored
        applyAction(s, seat, cmd.action, pick)
        await settleLeague(s, c, scored)
        // A League sitting's next deal, its fees and seats (SKATGO-205), once this made it due.
        if (s.league && nextDue(s)) await leagueDeal(s, c, pick)
        s.seats.forEach((x, i) => { if (sessions[i] && x.session !== sessions[i]) gone.push(sessions[i]!) })
        // A change to the game itself: a move, a deal — not asking for the next deal while others have not (SKATGO-165).
        if (s.game !== before) s.played = s.revision + 1
        s.nextActionAt = Date.now() + aiDelay
        if (!s.league?.finished) s.expiresAt = Date.now() + TTL_MS
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
        // Away from a League table a minute: it counts as leaving (SKATGO-206).
        if (s.league && p.account && !p.session && !p.leaving && p.disconnectedAt !== null) deadlines.push(p.disconnectedAt + AWAY_MS)
      }
      if (s.game && playsOn(s) && this.computerDue(s)) deadlines.push(s.nextActionAt)
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
      /** Sessions whose seat went to a persona with this beat (a League sitting's next deal, SKATGO-205). */
      const gone: string[] = []
      const result = await store.change(this.roomId, async (s, c) => {
        let changed = false
        const now = Date.now()
        const scored = s.scored
        const sessions = s.seats.map(x => x.session)
        for (const p of s.seats) {
          if (!p.session && p.disconnectedAt !== null && !p.autopilot && now >= p.disconnectedAt + GRACE_MS) {
            p.autopilot = true
            changed = true
          }
        }
        // Away from a League table `AWAY_MS` (SKATGO-206, the human: 「离桌多久应该算输，比如1分钟？」): it counts as leaving —
        // the deal on the table is lost for them, and so is the last one if they never came back to its result.
        for (let i = 0; i < 3; i++) {
          const p = s.seats[i]
          if (!s.league || !p.account || p.session || p.leaving || p.disconnectedAt === null || now < p.disconnectedAt + AWAY_MS) continue
          p.leaving = true
          if (playingLeague(s)) {
            p.stake ??= leftOutcome(s.game!.declarer, i)
            p.forfeit = true
          }
          await settlePending(s, c, i, false, now)
          changed = true
        }
        // Nobody online, nothing played (SKATGO-163): the computers do not go on by themselves — but at a League sitting, whose
        // next step comes by itself once nobody here is left to ask for it: the next deal, or the sitting's end (SKATGO-205).
        if (s.league && now >= s.nextActionAt && nextDue(s, now)) {
          await leagueDeal(s, c, pick, now)
          s.seats.forEach((x, i) => { if (sessions[i] && x.session !== sessions[i]) gone.push(sessions[i]!) })
          s.nextActionAt = now + aiDelay
          if (!s.league.finished) s.expiresAt = now + TTL_MS
          s.played = s.revision + 1
          changed = true
        } else if (s.game && playsOn(s) && now >= s.nextActionAt && this.computerDue(s)) {
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
            // after another; the next beat decides the rest again from the same cards. A League table's persona plays its
            // seat with its own slips (SKATGO-204).
            else if (turn !== null && s.plans) {
              const by = personaTurnPolicy(policy()!, s, turn) ?? policy()!
              moves = (await computerTurn(g, turn, plan(s.plans[String(turn) as '0' | '1' | '2']), by)).slice(0, 1)
            }
            for (const l of moves) {
              s.game = applySeatMove(s.game, l.seat, l.move)
              logMove(s, l)
            }
          }
          scoreEnded(s)
          await settleLeague(s, c, scored)
          s.nextActionAt = now + aiDelay
          s.expiresAt = now + TTL_MS
          s.played = s.revision + 1
          changed = true
        }
        return { changed, value: null }
      })
      this.failures = 0
      for (const session of gone) this.dismiss(session, 'left')
      this.publish(result.snapshot)
    }
    /** Whether the table waits for the computers: a trick to collect, a deal already decided, or a
     *  computer's seat on turn. */
    private computerDue(s: Snapshot): boolean {
      const g = s.game
      if (!g) return false
      if (s.league && nextDue(s)) return true
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
      unregisterTable(this.roomId, this.live)
    }
    /** This table as the registry knows it (SKATGO-235). */
    private live: LiveTable = { leave: (account) => this.leaveFor(account) }
    /** The account gone to another table: out of this one as its own Leave takes it (SKATGO-235) — a private seat to a
     *  computer (the room closed when nobody is left), a League seat left by the League's rule; its connection here, if
     *  any, told it plays elsewhere. */
    private leaveFor(account: string) {
      return this.enqueue(async () => {
        if (this.disposed) return
        const gone: string[] = []
        const result = await store.change(this.roomId, async (s, c) => {
          const seat = s.seats.findIndex(p => p.account === account && !p.leaving)
          if (seat < 0) return { changed: false, value: null }
          const session = s.seats[seat].session
          const before = s.game
          const scored = s.scored
          applyAction(s, seat as Seat, { type: 'leave' }, pick)
          await settleLeague(s, c, scored)
          if (s.league && nextDue(s)) await leagueDeal(s, c, pick)
          if (session && s.seats[seat].session !== session) gone.push(session)
          if (s.game !== before) s.played = s.revision + 1
          s.nextActionAt = Date.now() + aiDelay
          return { changed: true, value: null }
        })
        for (const session of gone) this.dismiss(session, 'elsewhere')
        if (emptyRoom(result.snapshot)) return this.close()
        this.publish(result.snapshot)
      })
    }
  }
}
