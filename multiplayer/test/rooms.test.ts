import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { spawn, type ChildProcess } from 'node:child_process'
import { once } from 'node:events'
import { Client, type Room } from '@colyseus/sdk'
import pg from 'pg'
import { legalPlays } from '../../app/src/lib/skat/cards'
import { issueTicket, TICKET_MS } from '../../app/src/lib/room-ticket'
import { seegerFabian } from '../../app/src/lib/skat/tournament'
import { type Command, type PrivateView, type PublicView, type Snapshot, GRACE_MS } from '../src/model'

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
  room: Room<any, any>; account: string; seat: number;
  receipts: Map<string, any>; dismissed: string | null; public: PublicView; private: PrivateView;
  observed: any[];
}
test('real SDK rooms, privacy, takeover, persistence and process fencing', { timeout: 300_000 }, async t => {
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
  /** A connection seen through the SDK as a browser sees it: its own seat is the one whose cards reach it. */
  async function attach(room: Room<any, any>, account: string): Promise<Peer> {
    const peer: Peer = { room, account, seat: -1, receipts: new Map(), dismissed: null, public: null!, private: null!, observed: [] }
    room.reconnection.enabled = false
    const inspect = (state: any) => {
      const json = state.toJSON()
      peer.observed.push(json)
      peer.public = JSON.parse(state.publicData)
      const mine = [0, 1, 2].filter(i => state.players.get(String(i)).privateData)
      assert(mine.length <= 1, 'Another hand reached the SDK')
      if (mine.length === 1) {
        peer.seat = mine[0]
        peer.private = JSON.parse(state.players.get(String(mine[0])).privateData)
      }
      const serialized = JSON.stringify(json)
      for (const forbidden of ['"account"', 'user:t', 'originalHands', 'originalSkat', admissionKey]) {
        assert(!serialized.includes(forbidden), `private field leaked: ${forbidden}`)
      }
    }
    room.onStateChange(inspect)
    room.onMessage('*', (type, message) => {
      if (type === 'dismissed') peer.dismissed = message.why
      else {
        assert.equal(type, 'receipt')
        peer.receipts.set(message.id, message)
      }
    })
    peers.push(peer)
    await until(() => peer.public && peer.private)
    return peer
  }
  let people = 0
  /** A new account, never seated before: one room at a time each (SKATGO-163). */
  const someone = () => `user:t${++people}`
  const open = (account: string) => new Client(endpoint).create('skat', { admissionKey, account })
  const enter = (code: string, account: string) => new Client(endpoint).joinById(code, { admissionKey, account })
  /** A room with its host in seat 0 and `count - 1` people who came in while it waited, the other seats the AI's, the
   *  first deal dealt — unless `fresh`, the room still waiting the moment they came in. */
  async function create(count: number, fresh = false) {
    const host = someone()
    const p = await attach(await open(host), host)
    const group = [p]
    for (let i = 1; i < count; i++) {
      const a = someone()
      group.push(await attach(await enter(p.room.roomId, a), a))
    }
    await until(() => p.public.seats.filter(s => s.connected).length === count)
    if (!fresh) {
      for (let seat = count; seat < 3; seat++) assert((await send(p, { type: 'computer', seat, on: true })).ok)
      assert((await send(p, { type: 'start' })).ok)
      await until(() => group.every(x => x.public.deals === 1))
    }
    return { p, group }
  }
  async function snapshot(id: string): Promise<Snapshot> {
    return (await sql.query('SELECT snapshot FROM multiplayer_rooms WHERE id=$1', [id])).rows[0].snapshot
  }
  async function send(p: Peer, action: Command['action'], id = randomUUID(), revision = p.public.revision) {
    p.receipts.delete(id)
    p.room.send('command', { id, revision, action })
    const receipt = await until(() => p.receipts.get(id))
    // Who leaves gets no state after it: the room lets their connection go.
    if (receipt.ok && action.type !== 'leave') await until(() => p.public.revision >= receipt.revision)
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
      const p = group.find(p => p.public.actor === p.seat && p.public.seats[p.seat].control === 'human')
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
  const status = async (code: string, account: string) => {
    const r = await fetch(`${endpoint}/rooms/${code}?account=${encodeURIComponent(account)}`, { headers: { 'x-admission-key': admissionKey } })
    return r.status === 404 ? 'none' : (await r.json()).status as string
  }
  const mine = async (account: string) =>
    (await (await fetch(`${endpoint}/rooms/mine?account=${encodeURIComponent(account)}`, { headers: { 'x-admission-key': admissionKey } })).json()).room as string | null
  try {
    let main = launch()
    await ready()
    await t.test('unauthorized admission creates no persistent rooms', async () => {
      await assert.rejects(new Client(endpoint).create('skat', { admissionKey: token(), account: someone() }))
      await assert.rejects(new Client(endpoint).create('skat', { admissionKey }))
      assert.equal((await sql.query('SELECT count(*)::int AS n FROM multiplayer_rooms')).rows[0].n, 0)
    })
    await t.test('a browser opens a room with an open ticket: a six-digit number, its host the account under its name', async () => {
      const anna = someone()
      const room = await new Client(endpoint).create('skat', { ticket: issueTicket(admissionKey, { purpose: 'open', user: anna }) })
      const p = await attach(room, anna)
      assert.match(room.roomId, /^[1-9][0-9]{5}$/)
      assert.equal(p.seat, 0)
      assert.equal(p.public.roomId, room.roomId)
      const s = await snapshot(room.roomId)
      assert.equal(s.host, anna)
      const name = (await sql.query('SELECT nickname FROM daily_players WHERE player = $1', [anna])).rows[0].nickname
      assert(name && p.public.seats[0].nickname === name, 'the host sits under the account\'s name')
      assert(p.public.seats[0].host)
      // It waits, two seats empty, nothing dealt.
      assert.equal(p.public.deals, 0)
      assert.deepEqual(p.public.seats.map(x => x.kind), ['human', 'empty', 'empty'])
      assert.deepEqual(p.private.hand, [])
      await assert.rejects(new Client(endpoint).create('skat', { ticket: issueTicket(token(), { purpose: 'open', user: someone() }) }))
      await assert.rejects(new Client(endpoint).create('skat', { ticket: issueTicket(admissionKey, { purpose: 'open', user: someone() }, Date.now() - TICKET_MS - 1000) }))
      await assert.rejects(new Client(endpoint).create('skat', { ticket: issueTicket(admissionKey, { purpose: 'join', user: someone(), room: room.roomId }) }), /admission_denied/)
    })
    await t.test('a join ticket comes into the room it names, and no other', async () => {
      const { p } = await create(1)
      const other = await create(1)
      const ben = someone()
      const ticket = issueTicket(admissionKey, { purpose: 'join', user: ben, room: p.room.roomId })
      await assert.rejects(new Client(endpoint).joinById(other.p.room.roomId, { ticket }), /admission_denied/)
      const b = await attach(await new Client(endpoint).joinById(p.room.roomId, { ticket }), ben)
      assert.equal(b.seat, 1)
    })
    await t.test('a waiting room: people sit down at once, the host gives seats to the AI or takes them back, and starts', async () => {
      const { p, group } = await create(2, true)
      const b = group[1]
      assert.equal(b.seat, 1)
      assert.equal(b.public.seats[1].joining, false)
      assert.deepEqual(p.public.seats.map(x => x.kind), ['human', 'human', 'empty'])
      // Only the host runs the room, and only while it waits; nothing is played before the first deal.
      assert.equal((await send(b, { type: 'computer', seat: 2, on: true })).error, 'cannot_seat')
      assert.equal((await send(b, { type: 'start' })).error, 'cannot_start')
      assert.equal((await send(p, { type: 'start' })).error, 'cannot_start', 'a seat is still empty')
      assert.equal((await send(p, { type: 'computer', seat: 1, on: true })).error, 'cannot_seat', 'a person\'s seat')
      assert.equal((await send(p, { type: 'bid', value: 'pass' })).error, 'not_your_turn')
      assert((await send(p, { type: 'computer', seat: 2, on: true })).ok)
      await until(() => b.public.seats[2].kind === 'ai')
      assert((await send(p, { type: 'computer', seat: 2, on: false })).ok)
      await until(() => b.public.seats[2].kind === 'empty')
      assert((await send(p, { type: 'computer', seat: 2, on: true })).ok)
      // Someone with the number still takes the AI's seat, and plays from the start.
      const c = someone()
      const pc = await attach(await enter(p.room.roomId, c), c)
      assert.equal(pc.seat, 2)
      assert.equal(pc.public.seats[2].joining, false)
      // Taken out or gone while it waits, a seat is empty again.
      assert((await send(p, { type: 'kick', seat: 2 })).ok)
      await until(() => pc.dismissed === 'kicked')
      await until(() => p.public.seats[2].kind === 'empty')
      assert((await send(b, { type: 'leave' })).ok)
      await until(() => p.public.seats[1].kind === 'empty')
      const d = someone()
      const pd = await attach(await enter(p.room.roomId, d), d)
      assert.equal(pd.seat, 1)
      assert((await send(p, { type: 'computer', seat: 2, on: true })).ok)
      assert((await send(p, { type: 'start' })).ok)
      await until(() => [p, pd].every(x => x.public.deals === 1 && x.public.phase === 'bidding'))
      assert.equal(p.public.dealer, 2)
      assert.deepEqual(p.public.seats.map(x => x.control), ['human', 'human', 'ai'])
      const s = await snapshot(p.room.roomId)
      for (const x of [p, pd]) assert.deepEqual(x.private.hand, s.game!.hands[x.seat])
      assert.equal((await send(p, { type: 'computer', seat: 2, on: false })).error, 'cannot_seat', 'the game has started')
      assert.equal((await send(p, { type: 'start' })).error, 'cannot_start')
    })
    await t.test('newcomers take the computers\' seats and play from the next deal, from 0; a full room takes nobody', async () => {
      const { p, group } = await create(1)
      const [b, c] = [someone(), someone()]
      assert.equal(await status(p.room.roomId, b), 'open')
      const pb = await attach(await enter(p.room.roomId, b), b)
      assert.equal(pb.seat, 1)
      assert.equal(pb.public.seats[1].joining, true)
      assert.equal(pb.public.seats[1].control, 'ai')
      assert.deepEqual(pb.private.hand, [], 'a newcomer sees no cards of the deal a computer finishes for them')
      assert.equal(await status(p.room.roomId, b), 'member')
      assert.equal(await mine(b), p.room.roomId)
      const pc = await attach(await enter(p.room.roomId, c), c)
      assert.equal(pc.seat, 2)
      assert.equal(await status(p.room.roomId, someone()), 'full')
      await assert.rejects(enter(p.room.roomId, someone()), /room_full/)
      // A newcomer's move is the computer's until their deal; they ask for the next deal with everyone here (SKATGO-165).
      assert.equal((await send(pb, { type: 'bid', value: 'pass' })).error, 'not_your_seat')
      await complete([p])
      for (const x of [pb, pc, p]) assert((await send(x, { type: 'next' })).ok)
      for (const x of [p, pb, pc]) await until(() => x.public.deals === 2 && x.public.seats.every(s => !s.joining))
      assert.deepEqual(p.public.seats.map(x => x.control), ['human', 'human', 'human'])
      assert.deepEqual([p.public.scores[1], p.public.scores[2]], [0, 0])
      const s = await snapshot(p.room.roomId)
      for (const x of [p, pb, pc]) assert.deepEqual(x.private.hand, s.game!.hands[x.seat])
      group.push(pb, pc)
      await complete(group)
    })
    await t.test('the next deal waits for everyone here; someone gone, leaving or taken out does not hold it', async () => {
      const { p, group } = await create(3)
      const [b, c] = [group[1], group[2]]
      const over = async () => {
        await complete(group)
      }
      await over()
      // One asks: nothing dealt; they are marked, the others not.
      assert((await send(p, { type: 'next' })).ok)
      await until(() => b.public.seats[0].ready)
      assert.equal(b.public.deals, 1)
      assert.deepEqual(b.public.seats.map(x => x.ready), [true, false, false])
      assert((await send(b, { type: 'next' })).ok)
      await sleep(300)
      assert.equal(p.public.deals, 1, 'dealt before everyone here asked')
      // The last one here leaves: dealt without them.
      assert((await send(c, { type: 'leave' })).ok)
      await until(() => p.public.deals === 2 && b.public.deals === 2)
      assert.deepEqual(p.public.seats.map(x => x.ready), [false, false, false])
      // Next time: the host asks and takes the other out.
      group.splice(2, 1)
      await over()
      assert((await send(p, { type: 'next' })).ok)
      assert((await send(p, { type: 'kick', seat: b.seat })).ok)
      await until(() => p.public.deals === 3)
      // And alone with the AI, asking deals at once.
      group.splice(1, 1)
      await complete([p])
      assert((await send(p, { type: 'next' })).ok)
      await until(() => p.public.deals === 4)
    })
    await t.test('someone who drops no longer holds the next deal', async () => {
      const { p, group } = await create(2)
      const b = group[1]
      await complete(group)
      assert((await send(p, { type: 'next' })).ok)
      await sleep(300)
      assert.equal(p.public.deals, 1)
      b.room.connection.close()
      await until(() => p.public.deals === 2)
    })
    await t.test('one room at a time: an account in a room opens and enters no other', async () => {
      const { p } = await create(1)
      const { p: q } = await create(1)
      await assert.rejects(open(p.account), /already_in_room/)
      await assert.rejects(enter(q.room.roomId, p.account), /already_in_room/)
      const r = await fetch(`${endpoint}/rooms/${q.room.roomId}?account=${encodeURIComponent(p.account)}`, { headers: { 'x-admission-key': admissionKey } })
      assert.deepEqual(await r.json(), { status: 'open', elsewhere: p.room.roomId })
    })
    await t.test('the same account from another device comes back to its seat; the first connection is let go', async () => {
      const { p } = await create(1)
      const again = await attach(await enter(p.room.roomId, p.account), p.account)
      assert.equal(again.seat, 0)
      await until(() => p.dismissed === 'elsewhere')
      assert.equal(again.public.seats[0].control, 'human')
    })
    await t.test('the host takes a person out — their seat a computer\'s — and they may come straight back', async () => {
      const { p, group } = await create(3)
      const c = group[2]
      assert.equal((await send(group[1], { type: 'kick', seat: 2 })).error, 'cannot_kick')
      assert((await send(p, { type: 'kick', seat: 2 })).ok)
      await until(() => c.dismissed === 'kicked')
      await until(() => p.public.seats[2].kind === 'ai')
      assert.equal(await mine(c.account), null)
      const back = await attach(await enter(p.room.roomId, c.account), c.account)
      assert.equal(back.seat, 2)
    })
    await t.test('leaving hands the host on; the last to leave closes the room and frees its number', async () => {
      const { p, group } = await create(2)
      const b = group[1]
      assert((await send(p, { type: 'leave' })).ok)
      await until(() => p.dismissed === 'left')
      await until(() => b.public.seats[b.seat].host)
      assert.equal(b.public.seats[0].kind, 'ai')
      assert.equal((await snapshot(b.room.roomId)).host, b.account)
      assert.equal(await mine(p.account), null)
      assert((await send(b, { type: 'leave' })).ok)
      await until(async () => (await sql.query('SELECT 1 FROM multiplayer_rooms WHERE id=$1', [b.room.roomId])).rowCount === 0)
      assert.equal(await status(b.room.roomId, b.account), 'none')
    })
    await t.test('with nobody online the computers wait; an away person\'s seat may be taken', async () => {
      const { p, group } = await create(3)
      const [b, c] = [group[1], group[2]]
      await until(() => p.public.phase === 'bidding')
      // All gone: nothing is played.
      for (const x of group) x.room.connection.close()
      await until(async () => (await snapshot(p.room.roomId)).seats.every(x => x.session === null))
      const quiet = (await snapshot(p.room.roomId)).revision
      await sleep(1500)
      assert.equal((await snapshot(p.room.roomId)).revision, quiet, 'the computers played with nobody online')
      // The host and C back; B away past the grace: a computer plays for B, and a newcomer — no computer's seat left —
      // takes B's.
      const host = await attach(await enter(p.room.roomId, p.account), p.account)
      await attach(await enter(p.room.roomId, c.account), c.account)
      await until(() => host.public.seats[b.seat].control === 'ai', GRACE_MS + 5000)
      const d = someone()
      assert.equal(await status(p.room.roomId, d), 'open')
      const pd = await attach(await enter(p.room.roomId, d), d)
      assert.equal(pd.seat, b.seat)
      assert.equal(await mine(b.account), null)
      assert.equal(await status(p.room.roomId, b.account), 'full')
    })
    await t.test('a newcomer who signs up is recorded as brought by the room\'s host, once', async () => {
      const referral = (body: object) => fetch(`${endpoint}/rooms/referral`, {
        method: 'POST', headers: { 'content-type': 'application/json', 'x-admission-key': admissionKey }, body: JSON.stringify(body),
      })
      const { p, group } = await create(2, true)
      const ben = group[1].account
      assert.equal((await fetch(`${endpoint}/rooms/referral`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).status, 403)
      assert.equal((await (await referral({ account: p.account, roomId: p.room.roomId })).json()).error, 'no_host')
      assert.equal((await (await referral({ account: someone(), roomId: p.room.roomId })).json()).error, 'not_a_guest')
      assert.equal((await (await referral({ account: ben, roomId: p.room.roomId })).json()).recorded, true)
      assert.equal((await (await referral({ account: ben, roomId: p.room.roomId })).json()).recorded, false)
      const rows = (await sql.query('SELECT account, referrer, room_id FROM account_referrals')).rows
      assert.deepEqual(rows, [{ account: ben, referrer: p.account, room_id: p.room.roomId }])
    })
    await t.test('a move made while someone else drops or comes back is not stale', async () => {
      const { group } = await create(3)
      await until(() => group.every(x => x.public.phase === 'bidding'))
      const mover = await until(() => group.find(x => x.public.actor === x.seat))
      const at = mover.public.revision
      const other = group.find(x => x !== mover)!
      other.room.connection.close()
      await until(() => mover.public.revision > at)
      const receipt = await send(mover, move(mover), randomUUID(), at)
      assert.equal(receipt.ok, true, JSON.stringify(receipt))
    })
    for (const count of [1, 2, 3]) {
      await t.test(`${count} humans plus ${3 - count} computers complete a legal private game`, async () => {
        const { group } = await create(count)
        const s = await snapshot(group[0].room.roomId)
        for (const peer of group) {
          await until(() => peer.public.phase === 'bidding')
          assert.deepEqual(peer.public.seats.map(x => x.control), [0, 1, 2].map(i => (i < count ? 'human' : 'ai')))
          assert.deepEqual(peer.private.hand, s.game!.hands[peer.seat])
          assert.deepEqual(peer.private.buried, [])
          assert.equal(peer.public.skat, null)
        }
        await complete(group)
      })
    }
    await t.test('deal after deal: the dealer moves on and every seat\'s Seeger-Fabian score runs on', async () => {
      const { p, group } = await create(1)
      const results: PublicView[] = []
      for (let deal = 1; deal <= 2; deal++) {
        await until(() => group.every(x => x.public.deals === deal && x.public.phase === 'bidding'))
        assert.equal(p.public.dealer, deal === 1 ? 2 : 0)
        // No next deal while this one is played (a stale revision is refused first, as a second press would be).
        assert(['cannot_deal', 'stale_revision'].includes((await send(p, { type: 'next' })).error))
        await complete(group)
        results.push(p.public)
        assert.deepEqual(p.public.skat?.length, 2)
        const want = results.map(r => seegerFabian({ phase: r.phase as 'done', declarer: r.declarer, result: r.result })).reduce((a, b) => a.map((n, i) => n + b[i]) as [number, number, number])
        await until(() => JSON.stringify(p.public.scores) === JSON.stringify(want))
        // The room's statistics (SKATGO-165): one entry a scored deal, its scores the deal's, who sat where.
        assert.equal(p.public.history.length, deal)
        const last = p.public.history[deal - 1]
        assert.deepEqual(last.summary.scores, seegerFabian({ phase: p.public.phase as 'done', declarer: p.public.declarer, result: p.public.result }))
        assert.deepEqual(last.names, [p.public.seats[0].nickname, null, null])
        if (deal === 1) assert((await send(p, { type: 'next' })).ok)
      }
    })
    await t.test('caller, action and retry validation is transactional', async () => {
      const { p, group } = await create(3)
      const second = group[1]
      await until(() => group.every(x => x.public.phase === 'bidding'))
      const mover = await until(() => group.find(x => x.public.actor === x.seat))
      const id = randomUUID()
      const action = move(mover)
      const first = await send(mover, action, id)
      assert(first.ok)
      assert.deepEqual(await send(mover, action, id), first)
      assert.equal((await send(mover, { type: 'hand' }, id)).error, 'command_id_reused')
      const idle = group.find(x => x.public.actor !== x.seat)!
      assert.equal((await send(idle, { type: 'bid', value: 'pass' })).error, 'not_your_turn')
      assert.equal((await send(second, { type: 'bid', value: 'pass' }, randomUUID(), 0)).error, 'stale_revision')
      const forged = randomUUID()
      second.room.send('command', { id: forged, revision: second.public.revision, seat: 0, action: { type: 'next' } })
      assert.equal((await until(() => second.receipts.get(forged))).error, 'invalid_command')
      assert.equal((await snapshot(p.room.roomId)).revision >= first.revision, true)
    })
    await t.test('short drop, 30-second AI takeover, and late seat recovery', async () => {
      const { p, group: seated } = await create(3)
      let second = seated[1]
      const third = seated[2]
      await until(() => p.public.phase === 'bidding')
      const saved = second.room.reconnectionToken
      second.room.connection.close()
      await until(() => !p.public.seats[1].connected)
      assert.equal(p.public.seats[1].control, 'human')
      second = await attach(await new Client(endpoint).reconnect(saved), second.account)
      await until(() => p.public.seats[1].connected)
      assert.equal(p.public.seats[1].control, 'human')
      second.room.connection.close()
      await until(() => !p.public.seats[1].connected)
      const untilAt = p.public.seats[1].reconnectUntil!
      assert(untilAt > Date.now() + GRACE_MS - 2000)
      await until(() => p.public.seats[1].control === 'ai', GRACE_MS + 4000)
      assert(Date.now() >= untilAt)
      second = await attach(await enter(p.room.roomId, second.account), second.account)
      await until(() => p.public.seats[1].control === 'human')
      assert.equal(second.seat, 1)
      const s = await snapshot(p.room.roomId)
      assert.deepEqual(second.private.hand, s.game!.hands[1])
      await complete([p, second, third])
    })
    await t.test('skat visibility, Ouvert and illegal cards follow the rules', async () => {
      const { p, group } = await create(3)
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
      const leader = group.find(x => x.public.actor === x.seat)!
      const anotherCard = before.game!.hands[(leader.seat + 1) % 3][0]
      assert.equal((await send(leader, { type: 'play', card: anotherCard })).error, 'illegal_action')
      assert.deepEqual((await snapshot(p.room.roomId)).game, before.game)
    })
    await t.test('all-pass auction is explicit, not a silently redealt game', async () => {
      const { p, group } = await create(3)
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
      await until(() => p.public.actor === 0)
      const before = await snapshot(p.room.roomId)
      await sql.query(`CREATE FUNCTION acceptance_reject_receipt() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN RAISE EXCEPTION 'injected receipt write failure'; END $$;
        CREATE TRIGGER acceptance_reject_receipt BEFORE INSERT ON multiplayer_commands
        FOR EACH ROW EXECUTE FUNCTION acceptance_reject_receipt();`)
      const id = randomUUID()
      const action = move(p)
      assert.equal((await send(p, action, id)).error, 'storage_unavailable')
      assert.deepEqual((await snapshot(p.room.roomId)).game, before.game)
      await sql.query('DROP TRIGGER acceptance_reject_receipt ON multiplayer_commands; DROP FUNCTION acceptance_reject_receipt();')
      assert((await send(p, action, id)).ok)
    })
    await t.test('hard restart preserves committed state and idempotency, ends the tables of before; standby cannot own rooms', async () => {
      const { p } = await create(1)
      await until(() => p.public.actor === 0)
      const id = randomUUID()
      const action = move(p)
      const receipt = await send(p, action, id)
      assert(receipt.ok)
      // A table stored before SKATGO-163 (schema 2) is ended at the next start.
      await sql.query("INSERT INTO multiplayer_rooms VALUES ('oldTable123', $1, $2)", [{ schema: 2, id: 'oldTable123' }, Date.now() + 60_000])
      // Read once the computers have answered and the table waits for the host again: nothing moves between the read and
      // the kill, so what the restart must keep is exactly what was read.
      await until(() => p.public.actor === 0 || p.public.phase === 'done' || p.public.phase === 'passedIn')
      const before = await snapshot(p.room.roomId)
      assert.equal(before.revision, p.public.revision)
      const standby = launch(port + 1)
      await until(async () => {
        try { return (await fetch(`http://127.0.0.1:${port + 1}/healthz`)).ok } catch { return false }
      })
      assert.equal((await fetch(`http://127.0.0.1:${port + 1}/readyz`)).status, 503)
      await stop(standby)
      await stop(main, 'SIGKILL')
      main = launch()
      await ready()
      assert.equal((await sql.query("SELECT count(*)::int AS n FROM multiplayer_rooms WHERE id = 'oldTable123'")).rows[0].n, 0)
      const resumed = await attach(await enter(p.room.roomId, p.account), p.account)
      const after = await snapshot(p.room.roomId)
      assert.deepEqual(after.game, before.game)
      assert.equal(after.seats[0].account, p.account)
      assert.deepEqual(await send(resumed, action, id), receipt)
      await complete([resumed])
    })
    await t.test('a stale process generation cannot commit', async () => {
      const { p } = await create(1)
      await until(() => p.public.actor === 0)
      const before = await snapshot(p.room.roomId)
      await sql.query('UPDATE multiplayer_leader SET epoch = epoch + 1 WHERE id = 1')
      assert.equal((await send(p, move(p))).error, 'stale_process')
      assert.deepEqual((await snapshot(p.room.roomId)).game, before.game)
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
