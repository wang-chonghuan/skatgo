import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { spawn, type ChildProcess } from 'node:child_process'
import { once } from 'node:events'
import { Client, type Room } from '@colyseus/sdk'
import pg from 'pg'
import { legalPlays } from '../../app/src/lib/skat/cards'
import { type Command, type PrivateView, type PublicView, type Snapshot, GRACE_MS, hash } from '../src/model'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
async function until<T>(fn: () => T | Promise<T>, timeout = 15_000): Promise<NonNullable<T>> {
  const end = Date.now() + timeout
  while (Date.now() < end) {
    const value = await fn()
    if (value) return value as NonNullable<T>
    await sleep(20)
  }
  throw new Error('Condition timed out')
}
const token = () => randomBytes(32).toString('hex')
type Peer = {
  room: Room<any, any>; token: string; seat: number;
  receipts: Map<string, any>; public: PublicView; private: PrivateView;
  observed: any[];
}
test('real SDK rooms, privacy, takeover, persistence and process fencing', { timeout: 240_000 }, async t => {
  const base = new URL(process.env.DATABASE_URL || '')
  assert(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname), 'Acceptance refuses external databases')
  const admin = new pg.Pool({ connectionString: base.href })
  const dbName = `skatgo_acceptance_${randomBytes(6).toString('hex')}`
  await admin.query(`CREATE DATABASE "${dbName}"`)
  base.pathname = `/${dbName}`
  const sql = new pg.Pool({ connectionString: base.href })
  const admissionKey = token()
  const port = Number(process.env.TEST_PORT || 56020)
  const endpoint = `http://127.0.0.1:${port}`
  const peers: Peer[] = []
  let processes: ChildProcess[] = []
  let logs = ''
  function launch(p = port) {
    const child = spawn(process.execPath, ['dist/server.mjs'], {
      env: { ...process.env, DATABASE_URL: base.href, MULTIPLAYER_ADMISSION_KEY: admissionKey,
        PORT: String(p), AI_DELAY_MS: '30', APP_VERSION: 'acceptance' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    child.stdout?.on('data', d => { logs += d.toString() })
    child.stderr?.on('data', d => { logs += d.toString() })
    child.on('exit', (code, signal) => {
      if (code && !signal) console.error('backend exited', code, logs.slice(-5000))
    })
    processes.push(child)
    return child
  }
  async function ready(p = port) {
    await until(async () => {
      try { return (await fetch(`http://127.0.0.1:${p}/readyz`)).status === 200 } catch { return false }
    })
  }
  async function stop(child: ChildProcess, signal: NodeJS.Signals = 'SIGTERM') {
    if (child.exitCode !== null || child.signalCode !== null) return
    const ended = once(child, 'exit')
    child.kill(signal)
    await ended
  }
  async function attach(room: Room<any, any>, secret: string, seat: number): Promise<Peer> {
    const peer: Peer = { room, token: secret, seat, receipts: new Map(), public: null!, private: null!, observed: [] }
    room.reconnection.enabled = false
    const inspect = (state: any) => {
      const json = state.toJSON()
      peer.observed.push(json)
      peer.public = JSON.parse(state.publicData)
      peer.private = JSON.parse(state.players.get(String(seat)).privateData)
      for (let i = 0; i < 3; i++) {
        if (i !== seat) assert(!state.players.get(String(i)).privateData, 'Another hand reached the SDK')
      }
      const serialized = JSON.stringify(json)
      for (const forbidden of ['tokenHash', 'inviteHash', 'originalHands', 'originalSkat', admissionKey]) {
        assert(!serialized.includes(forbidden), `private field leaked: ${forbidden}`)
      }
    }
    room.onStateChange(inspect)
    room.onMessage('*', (type, message) => {
      assert.equal(type, 'receipt')
      peer.receipts.set(message.id, message)
    })
    peers.push(peer)
    await until(() => peer.public)
    return peer
  }
  async function create(humanSeats: number) {
    const secret = token(), inviteToken = token()
    const room = await new Client(endpoint).create('skat', { admissionKey, seatToken: secret, inviteToken, humanSeats })
    const p = await attach(room, secret, 0)
    return { p, inviteToken }
  }
  async function join(id: string, secret: string, seat: number, inviteToken?: string) {
    return attach(await new Client(endpoint).joinById(id, { admissionKey, seatToken: secret, ...(inviteToken ? { inviteToken } : {}) }), secret, seat)
  }
  async function snapshot(id: string): Promise<Snapshot> {
    return (await sql.query('SELECT snapshot FROM multiplayer_rooms WHERE id=$1', [id])).rows[0].snapshot
  }
  async function send(p: Peer, action: Command['action'], id = randomUUID(), revision = p.public.revision) {
    p.receipts.delete(id)
    p.room.send('command', { id, revision, action })
    const receipt = await until(() => p.receipts.get(id))
    if (receipt.ok) await until(() => p.public.revision >= receipt.revision)
    return receipt
  }
  function move(p: Peer): Command['action'] {
    const v = p.public
    if (v.phase === 'bidding') return {
      type: 'bid', value: p.seat !== 0 ? 'pass' : v.bidding!.awaiting === 'listener' ? 'hold' : 'bid',
    }
    if (v.phase === 'skat') return { type: 'hand' }
    if (v.phase === 'declare') return { type: 'declare', declaration: {
      contract: { kind: 'grand' }, hand: true, schneiderAnnounced: false, schwarzAnnounced: false, ouvert: false,
    } }
    assert.equal(v.phase, 'play')
    return { type: 'play', card: legalPlays(p.private.hand, v.trick.map(x => x.card), v.declaration!.contract)[0] }
  }
  async function complete(group: Peer[]) {
    const deadline = Date.now() + 30_000
    while (Date.now() < deadline) {
      const p = group.find(p => p.public.actor === p.seat)
      if (group[0].public.phase === 'done') {
        await until(() => group.every(p => p.public.phase === 'done'))
        for (const p of group) assert.deepEqual(p.public.result, group[0].public.result)
        assert.equal(group[0].public.tricks.length, 10)
        return
      }
      if (p) {
        const response = await send(p, move(p))
        assert(response.ok || response.error === 'stale_revision' || response.error === 'not_your_turn')
      } else await sleep(20)
    }
    throw new Error(`Game did not complete: ${JSON.stringify(group[0].public)}`)
  }
  try {
    let main = launch()
    await ready()
    await t.test('unauthorized admission creates no persistent rooms', async () => {
      await assert.rejects(new Client(endpoint).create('skat', {
        admissionKey: token(), seatToken: token(), inviteToken: token(), humanSeats: 1,
      }))
      assert.equal((await sql.query('SELECT count(*)::int AS n FROM multiplayer_rooms')).rows[0].n, 0)
    })
    for (const count of [1, 2, 3]) {
      await t.test(`${count} humans plus ${3 - count} AIs complete a legal private game`, async () => {
        const { p, inviteToken } = await create(count)
        const group = [p]
        for (let seat = 1; seat < count; seat++) group.push(await join(p.room.roomId, token(), seat, inviteToken))
        await until(() => p.public.seats.filter(s => s.connected).length === count)
        await assert.rejects(new Client(endpoint).joinById(p.room.roomId, { admissionKey, seatToken: token(), inviteToken }))
        const start = await send(p, { type: 'start' })
        assert.equal(start.ok, true)
        const s = await snapshot(p.room.roomId)
        for (const peer of group) {
          await until(() => peer.public.phase === 'bidding')
          assert.deepEqual(peer.private.hand, s.game!.hands[peer.seat])
          assert.deepEqual(peer.private.buried, [])
          for (const seen of peer.observed) assert(!JSON.stringify(seen).includes(inviteToken))
        }
        await complete(group)
      })
    }
    await t.test('caller, action and retry validation is transactional', async () => {
      const { p, inviteToken } = await create(3)
      const second = await join(p.room.roomId, token(), 1, inviteToken)
      await join(p.room.roomId, token(), 2, inviteToken)
      await until(() => p.public.seats.every(s => s.connected))
      const id = randomUUID()
      const start = await send(p, { type: 'start' }, id)
      assert(start.ok)
      assert.deepEqual(await send(p, { type: 'start' }, id), start)
      assert.equal((await send(p, { type: 'hand' }, id)).error, 'command_id_reused')
      assert.equal((await send(p, { type: 'bid', value: 'pass' })).error, 'not_your_turn')
      await until(() => second.public.revision === p.public.revision)
      assert.equal((await send(second, { type: 'bid', value: 'hold' })).error, 'illegal_action')
      assert.equal((await send(second, { type: 'bid', value: 'pass' }, randomUUID(), 0)).error, 'stale_revision')
      const forged = randomUUID()
      second.room.send('command', { id: forged, revision: second.public.revision, seat: 0, action: { type: 'start' } })
      assert.equal((await until(() => second.receipts.get(forged))).error, 'invalid_command')
      assert.equal((await snapshot(p.room.roomId)).revision, start.revision)
      assert.equal((await sql.query('SELECT count(*)::int AS n FROM multiplayer_commands WHERE room_id=$1', [p.room.roomId])).rows[0].n, 1)
    })
    await t.test('short drop, 30-second AI takeover, and late seat recovery', async () => {
      const { p, inviteToken } = await create(3)
      let second = await join(p.room.roomId, token(), 1, inviteToken)
      const third = await join(p.room.roomId, token(), 2, inviteToken)
      await until(() => p.public.seats.every(s => s.connected))
      assert((await send(p, { type: 'start' })).ok)
      const saved = second.room.reconnectionToken
      second.room.connection.close()
      await until(() => !p.public.seats[1].connected)
      assert.equal(p.public.seats[1].control, 'human')
      const sdkRoom = await new Client(endpoint).reconnect(saved)
      second = await attach(sdkRoom, second.token, 1)
      await until(() => p.public.seats[1].connected)
      assert.equal(p.public.seats[1].control, 'human')
      assert.equal(p.public.actor, 1)
      second.room.connection.close()
      await until(() => !p.public.seats[1].connected)
      const untilAt = p.public.seats[1].reconnectUntil!
      assert(untilAt > Date.now() + GRACE_MS - 2000)
      await sleep(500)
      assert.equal(p.public.actor, 1)
      assert.equal(p.public.seats[1].control, 'human')
      await until(() => p.public.seats[1].control === 'ai' && p.public.actor !== 1, GRACE_MS + 4000)
      assert(Date.now() >= untilAt)
      second = await join(p.room.roomId, second.token, 1)
      await until(() => p.public.seats[1].control === 'human')
      assert.equal(second.private.seat, 1)
      assert.equal(second.public.seats[1].connected, true)
      const s = await snapshot(p.room.roomId)
      assert.deepEqual(second.private.hand, s.game!.hands[1])
      await assert.rejects(new Client(endpoint).joinById(p.room.roomId, { admissionKey, seatToken: token() }))
      const group = [p, second, third]
      const end = Date.now() + 10_000
      while (!(p.public.phase === 'play' && p.public.actor === 1) && Date.now() < end) {
        const mover = group.find(x => x.public.actor === x.seat)
        if (mover) await send(mover, move(mover))
        else await sleep(20)
      }
      assert.equal(p.public.phase, 'play')
      assert.equal(p.public.actor, 1)
      const waiting = await snapshot(p.room.roomId)
      await sleep(200)
      assert.deepEqual(await snapshot(p.room.roomId), waiting, 'AI continued after human recovery')
    })
    await t.test('skat visibility, Ouvert and illegal cards follow the rules', async () => {
      const { p, inviteToken } = await create(3)
      const group = [p, await join(p.room.roomId, token(), 1, inviteToken), await join(p.room.roomId, token(), 2, inviteToken)]
      await until(() => p.public.seats.every(s => s.connected))
      assert((await send(p, { type: 'start' })).ok)
      while (p.public.phase === 'bidding') {
        const mover = group.find(x => x.public.actor === x.seat)
        if (mover) await send(mover, move(mover))
        else await sleep(20)
      }
      assert.equal(p.public.declarer, 0)
      assert((await send(p, { type: 'pickup' })).ok)
      assert.equal(p.private.hand.length, 12)
      assert.equal((await send(p, { type: 'pickup' })).error, 'illegal_action')
      const buried = p.private.hand.slice(0, 2)
      assert((await send(p, { type: 'discard', cards: buried })).ok)
      assert.deepEqual(p.private.buried, buried)
      assert((await send(p, { type: 'declare', declaration: {
        contract: { kind: 'null' }, hand: false, schneiderAnnounced: false, schwarzAnnounced: false, ouvert: true,
      } })).ok)
      await until(() => group.every(x => x.public.phase === 'play'))
      for (const peer of group) assert.deepEqual(peer.public.ouvertHand, p.private.hand)
      for (const peer of group.slice(1)) assert.deepEqual(peer.private.buried, [])
      const before = await snapshot(p.room.roomId)
      const anotherCard = before.game!.hands[1][0]
      assert.equal((await send(p, { type: 'play', card: anotherCard })).error, 'illegal_action')
      assert.deepEqual(await snapshot(p.room.roomId), before)
    })
    await t.test('all-pass auction is explicit, not a silently redealt game', async () => {
      const { p, inviteToken } = await create(3)
      const group = [p, await join(p.room.roomId, token(), 1, inviteToken), await join(p.room.roomId, token(), 2, inviteToken)]
      await until(() => p.public.seats.every(s => s.connected))
      assert((await send(p, { type: 'start' })).ok)
      const original = (await snapshot(p.room.roomId)).game!.originalHands
      const end = Date.now() + 10_000
      while (p.public.phase !== 'passedIn' && Date.now() < end) {
        const mover = group.find(x => x.public.actor === x.seat)
        if (mover) await send(mover, { type: 'bid', value: 'pass' })
        else await sleep(20)
      }
      assert.equal(p.public.phase, 'passedIn')
      assert.deepEqual((await snapshot(p.room.roomId)).game!.originalHands, original)
    })
    await t.test('database write failure never acknowledges or advances an action', async () => {
      const { p } = await create(1)
      const before = await snapshot(p.room.roomId)
      await sql.query(`CREATE FUNCTION acceptance_reject_receipt() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN RAISE EXCEPTION 'injected receipt write failure'; END $$;
        CREATE TRIGGER acceptance_reject_receipt BEFORE INSERT ON multiplayer_commands
        FOR EACH ROW EXECUTE FUNCTION acceptance_reject_receipt();`)
      const id = randomUUID()
      assert.equal((await send(p, { type: 'start' }, id)).error, 'storage_unavailable')
      assert.deepEqual(await snapshot(p.room.roomId), before)
      await sql.query('DROP TRIGGER acceptance_reject_receipt ON multiplayer_commands; DROP FUNCTION acceptance_reject_receipt();')
      assert((await send(p, { type: 'start' }, id)).ok)
    })
    await t.test('hard restart preserves committed state and idempotency; standby cannot own rooms', async () => {
      const { p } = await create(1)
      const id = randomUUID()
      const receipt = await send(p, { type: 'start' }, id)
      assert(receipt.ok)
      await until(() => p.public.actor === 0)
      const before = await snapshot(p.room.roomId)
      const standby = launch(port + 1)
      await until(async () => {
        try { return (await fetch(`http://127.0.0.1:${port + 1}/healthz`)).ok } catch { return false }
      })
      assert.equal((await fetch(`http://127.0.0.1:${port + 1}/readyz`)).status, 503)
      await stop(standby)
      await stop(main, 'SIGKILL')
      main = launch()
      await ready()
      const resumed = await join(p.room.roomId, p.token, 0)
      const after = await snapshot(p.room.roomId)
      assert.deepEqual(after.game, before.game)
      assert.equal(after.seats[0].tokenHash, hash(p.token))
      assert.deepEqual(await send(resumed, { type: 'start' }, id), receipt)
      await complete([resumed])
    })
    await t.test('a stale process generation cannot commit', async () => {
      const { p } = await create(1)
      const before = await snapshot(p.room.roomId)
      await sql.query('UPDATE multiplayer_leader SET epoch = epoch + 1 WHERE id = 1')
      assert.equal((await send(p, { type: 'start' })).error, 'stale_process')
      assert.deepEqual(await snapshot(p.room.roomId), before)
    })
    assert(!logs.includes(admissionKey), 'Admission secret leaked into logs')
  } catch (e) {
    console.error(logs.slice(-6000))
    throw e
  } finally {
    for (const peer of peers) {
      peer.room.reconnection.enabled = false
      peer.room.connection.close()
    }
    await Promise.all(processes.map(p => stop(p, 'SIGKILL')))
    await sql.end()
    await admin.query(`DROP DATABASE "${dbName}" WITH (FORCE)`)
    await admin.end()
  }
})
