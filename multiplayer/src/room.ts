import { Room, ServerError, type Client } from '@colyseus/core'
import { StateView } from '@colyseus/schema'
import { z } from 'zod'
import { actor, type Seat } from '../../app/src/lib/skat/game'
import {
  applyAction, commandSchema, computerMove, GRACE_MS, hash, privateView, publicView,
  Rejected, secretEquals, tokenSchema, TTL_MS, type Snapshot,
} from './model'
import { MatchState, PlayerState } from './state'
import { Store } from './store'

export const RESTORE = Symbol('trusted-restore')
const admission = z.object({
  admissionKey: z.string().min(32).max(256),
  seatToken: tokenSchema,
  inviteToken: tokenSchema.optional(),
  humanSeats: z.number().int().min(1).max(3).optional(),
}).strict()

export function makeRoom(store: Store, key: string, ready: () => boolean, aiDelay: number) {
  return class SkatRoom extends Room<{ state: InstanceType<typeof MatchState> }> {
    state = new MatchState()
    autoDispose = false
    maxClients = 3
    maxMessagesPerSecond = 20
    private snapshot!: Snapshot
    private serial: Promise<unknown> = Promise.resolve()
    private timer?: ReturnType<typeof setTimeout>
    private disposed = false
    private pendingDrops = new Map<string, { seat: number; at: number }>()

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
        if (!ready() || !secretEquals(o.admissionKey, key)) throw new ServerError(403, 'admission_denied')
        if (!o.inviteToken || !o.humanSeats) throw new ServerError(400, 'creation_options_required')
        this.snapshot = {
          schema: 1, id: this.roomId, revision: 0, humanSeats: o.humanSeats,
          inviteHash: hash(o.inviteToken), game: null, expiresAt: Date.now() + TTL_MS,
          nextActionAt: Date.now(),
          seats: Array.from({ length: 3 }, (_, i) => ({
            tokenHash: i === 0 ? hash(o.seatToken) : null, session: null,
            disconnectedAt: null, autopilot: i >= o.humanSeats!,
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
      if (!ready() || !parsed.success || !secretEquals(parsed.data.admissionKey, key)) {
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
            if (s.game || !auth.inviteToken || hash(auth.inviteToken) !== s.inviteHash) throw new Rejected('invite_denied')
            seat = s.seats.findIndex((p, i) => i < s.humanSeats && !p.tokenHash)
            if (seat < 0) throw new Rejected('room_full')
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
        if (cmd.revision !== s.revision) throw new Rejected('stale_revision')
        s.game = applyAction(s, seat, cmd.action)
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
      const turn = s.game ? actor(s.game) : null
      if (s.game?.phase === 'trickEnd' || (turn !== null && s.seats[turn].autopilot)) deadlines.push(s.nextActionAt)
      this.timer = setTimeout(() => {
        this.enqueue(() => this.advance()).catch(e => {
          if (e instanceof Rejected && e.message === 'room_expired') void this.expire()
          else this.retry()
        })
      }, Math.max(10, Math.min(...deadlines) - Date.now()))
    }
    private retry() {
      if (this.disposed) return
      console.error('room_storage_unavailable')
      clearTimeout(this.timer)
      this.timer = setTimeout(() => this.enqueue(() => this.advance()).catch(() => this.retry()), 1000)
    }
    private async advance() {
      if (!ready()) { this.retry(); return }
      await this.flushDrops()
      const result = await store.change(this.roomId, s => {
        let changed = false
        const now = Date.now()
        for (const p of s.seats) {
          if (!p.session && p.disconnectedAt !== null && !p.autopilot && now >= p.disconnectedAt + GRACE_MS) {
            p.autopilot = true
            changed = true
          }
        }
        const turn = s.game ? actor(s.game) : null
        if (s.game && now >= s.nextActionAt &&
          (s.game.phase === 'trickEnd' || (turn !== null && s.seats[turn].autopilot))) {
          const next = computerMove(s.game)
          if (next !== s.game) {
            s.game = next
            s.nextActionAt = now + aiDelay
            s.expiresAt = now + TTL_MS
            changed = true
          }
        }
        return { changed, value: null }
      })
      this.publish(result.snapshot)
    }
    private async expire() {
      this.disposed = true
      clearTimeout(this.timer)
      await store.remove(this.roomId)
      await this.disconnect()
    }
    onDispose() {
      this.disposed = true
      clearTimeout(this.timer)
    }
  }
}
