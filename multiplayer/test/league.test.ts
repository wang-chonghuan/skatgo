import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { spawn, type ChildProcess } from 'node:child_process'
import { once } from 'node:events'
import { Client, type Room } from '@colyseus/sdk'
import pg from 'pg'
import { legalPlays } from '../../app/src/lib/skat/cards'
import { FEES, ROUND_DEALS } from '../../app/src/lib/skat/league'
import { type Command, type PrivateView, type PublicView, type Snapshot, GRACE_MS } from '../src/model'

// The League (SKATGO-204) against a real service and a database of its own: the day's check-in, the fee, a round found in
// five seconds with personas in the empty seats or with another person of the tier, three deals each dealt by another
// seat, a person away played for after the grace and back in their seat, the round scored once, nobody else at the
// table, and a deal's review counted once for the person's record.

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
async function until<T>(fn: () => T | Promise<T>, timeout = 20_000): Promise<NonNullable<T>> {
  const end = Date.now() + timeout
  while (Date.now() < end) {
    const value = await fn()
    if (value) return value as NonNullable<T>
    await sleep(25)
  }
  throw new Error('Condition timed out')
}
type Peer = { room: Room<any, any>; seat: number; receipts: Map<string, any>; public: PublicView; private: PrivateView }

test('League: check-in, matching, a round of three, the grace, scoring once, reviews', { timeout: 400_000 }, async () => {
  const base = new URL(process.env.DATABASE_URL || '')
  assert(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname), 'Acceptance refuses external databases')
  const admin = new pg.Pool({ connectionString: base.href })
  const dbName = `skatgo_league_${randomBytes(6).toString('hex')}`
  await admin.query(`CREATE DATABASE "${dbName}"`)
  base.pathname = `/${dbName}`
  const sql = new pg.Pool({ connectionString: base.href })
  const admissionKey = randomBytes(32).toString('hex')
  // Test files run side by side: rooms.test.ts takes TEST_PORT and the port after it, so this one stands a few apart.
  const port = Number(process.env.TEST_PORT || 56020) + 5
  const endpoint = `http://127.0.0.1:${port}`
  let server: ChildProcess | null = null
  let logs = ''
  const rooms: Room<any, any>[] = []
  try {
    server = spawn(process.execPath, ['dist/server.mjs'], {
      env: { ...process.env, DATABASE_URL: base.href, MULTIPLAYER_ADMISSION_KEY: admissionKey, PORT: String(port), AI_DELAY_MS: '20', APP_VERSION: 'acceptance' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    server.stdout?.on('data', d => { logs += d.toString() })
    server.stderr?.on('data', d => { logs += d.toString() })
    await until(async () => { try { return (await fetch(`${endpoint}/readyz`)).status === 200 } catch { return false } }, 120_000)

    const call = async (op: string, body: object) => {
      const r = await fetch(`${endpoint}/league/${op}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-admission-key': admissionKey }, body: JSON.stringify(body) })
      return { status: r.status, body: await r.json() as any }
    }
    const coins = async (player: string) => (await call('state', { player })).body.me.coins as number
    const snapshot = async (id: string): Promise<Snapshot> => (await sql.query('SELECT snapshot FROM multiplayer_rooms WHERE id=$1', [id])).rows[0].snapshot

    // The day's check-in: 100 on the first open, nothing on the next; a day later on top of what is left.
    assert.deepEqual((await call('checkin', { player: 'user:a' })).body, { coins: 100, added: 100 })
    assert.deepEqual((await call('checkin', { player: 'user:a' })).body, { coins: 100, added: 0 })
    await sql.query("UPDATE league_players SET coins = 40, checkin_day = '2000-01-01' WHERE player = 'user:a'")
    assert.deepEqual((await call('checkin', { player: 'user:a' })).body, { coins: 140, added: 100 })
    assert.equal((await call('checkin', { player: 'sim:x' })).status, 400)

    // A new account: Bronze, 0 points; too few coins for the fee is refused.
    await call('checkin', { player: 'user:poor' })
    await sql.query("UPDATE league_players SET coins = $1 WHERE player = 'user:poor'", [FEES[0] - 1])
    const poor = await call('state', { player: 'user:poor' })
    assert.equal(poor.body.me.tier, 0)
    assert.equal(poor.body.me.points, 0)
    assert.deepEqual((await call('play', { player: 'user:poor' })), { status: 409, body: { error: 'not_enough_coins' } })

    // Alone: seated within five seconds and a little, two personas beside, the fee taken.
    const started = Date.now()
    const alone = await call('play', { player: 'user:a' })
    const waited = Date.now() - started
    assert.equal(alone.status, 200)
    assert(waited >= 4_900 && waited <= 6_500, `waited ${waited} ms`)
    assert.equal(await coins('user:a'), 140 - FEES[0])
    const s = await snapshot(alone.body.room)
    assert.equal(s.seats.filter(p => p.account === 'user:a').length, 1)
    assert.equal(s.seats.filter(p => p.persona?.startsWith('sim:') && p.account === null && p.nickname).length, 2)
    assert.equal(s.deals, 1)
    // Asked again while seated, the same table and no second fee.
    assert.deepEqual((await call('play', { player: 'user:a' })).body, { room: alone.body.room })
    assert.equal(await coins('user:a'), 140 - FEES[0])

    // Two people of a tier within five seconds: one table.
    for (const p of ['user:c', 'user:d']) await call('checkin', { player: p })
    const [c, d] = await Promise.all([call('play', { player: 'user:c' }), sleep(1500).then(() => call('play', { player: 'user:d' }))])
    assert.equal(c.body.room, d.body.room)
    const both = await snapshot(c.body.room)
    assert.deepEqual(both.seats.filter(p => p.account).map(p => p.account).sort(), ['user:c', 'user:d'])

    // Nobody else comes into a League round, not even by its number.
    await call('checkin', { player: 'user:e' })
    await assert.rejects(new Client(endpoint).joinById(alone.body.room, { admissionKey, account: 'user:e' }))

    async function attach(room: Room<any, any>): Promise<Peer> {
      rooms.push(room)
      room.reconnection.enabled = false
      const peer: Peer = { room, seat: -1, receipts: new Map(), public: null!, private: null! }
      room.onStateChange((state: any) => {
        peer.public = JSON.parse(state.publicData)
        const mine = [0, 1, 2].find(i => state.players.get(String(i)).privateData)
        if (mine !== undefined) {
          peer.seat = mine
          peer.private = JSON.parse(state.players.get(String(mine)).privateData)
        }
        const text = JSON.stringify(state.toJSON())
        for (const hidden of ['"account"', 'user:', 'sim:', admissionKey]) assert(!text.includes(hidden), `leaked ${hidden}`)
      })
      room.onMessage('*', (type, message) => { if (type === 'receipt') peer.receipts.set(message.id, message) })
      await until(() => peer.public && peer.private)
      return peer
    }
    async function send(p: Peer, action: Command['action']) {
      const id = randomUUID()
      p.room.send('command', { id, revision: p.public.revision, action })
      return until(() => p.receipts.get(id))
    }
    /** This seat's move when it is its turn: pass the auction, the first legal card in play, the next deal once over. */
    async function step(p: Peer) {
      const v = p.public
      if ((v.phase === 'done' || v.phase === 'passedIn') && !v.seats[p.seat].ready && v.deals < ROUND_DEALS) return send(p, { type: 'next' })
      if (v.actor !== p.seat) return
      if (v.phase === 'bidding') return send(p, { type: 'bid', value: 'pass' })
      if (v.phase === 'play') return send(p, { type: 'play', card: legalPlays(p.private.hand, v.trick.map(x => x.card), v.declaration!.contract)[0] })
    }

    // The person at the table plays their seat through the round; each deal dealt by another seat.
    const a = await attach(await new Client(endpoint).joinById(alone.body.room, { admissionKey, account: 'user:a' }))
    assert.equal(a.public.league!.of, ROUND_DEALS)
    const dealers = new Set<number>()
    await until(async () => {
      if (a.public.phase === 'bidding') dealers.add(a.public.dealer)
      await step(a)
      return a.public.league!.result
    }, 240_000)
    assert.equal(a.public.deals, ROUND_DEALS)
    assert.equal(dealers.size, 3)
    const result = a.public.league!.result!
    const mine = result.seats[a.seat]
    assert.equal(mine.person, true)
    assert.equal(mine.points, [3, 1, -2][mine.place])
    const after = (await call('state', { player: 'user:a' })).body.me
    assert.deepEqual({ tier: after.tier, points: after.points }, mine.standing)
    assert.equal(after.table, null)
    // Scored once: the room's finished round answers nothing more.
    assert.equal((await sql.query('SELECT count(*)::int AS n FROM league_matches WHERE finished_at IS NOT NULL AND room = $1', [alone.body.room])).rows[0].n, 1)

    // Each deal's review for its person, their seat turned to seat 0, counted once for their record.
    const match = a.public.league!.match
    for (let deal = 0; deal < ROUND_DEALS; deal++) {
      const r = await call('review', { player: 'user:a', match, deal })
      assert.equal(r.status, 200)
      assert(r.body.mine && r.body.ai, 'the review has both games')
    }
    await call('review', { player: 'user:a', match, deal: 0 })
    assert.equal((await sql.query("SELECT count(*)::int AS n FROM play_deals WHERE player = 'user:a' AND game LIKE 'league:%'")).rows[0].n, ROUND_DEALS)
    assert.equal((await call('review', { player: 'user:c', match, deal: 0 })).status, 409)

    // Away at the shared table: a computer plays the seat after the grace; back with a new connection, the seat is theirs
    // again and no fee comes back.
    const pc = await attach(await new Client(endpoint).joinById(c.body.room, { admissionKey, account: 'user:c' }))
    const pd = await attach(await new Client(endpoint).joinById(c.body.room, { admissionKey, account: 'user:d' }))
    const before = await coins('user:c')
    pc.room.connection.close()
    await until(() => pd.public.seats[pc.seat].control === 'ai', GRACE_MS + 10_000)
    const back = await attach(await new Client(endpoint).joinById(c.body.room, { admissionKey, account: 'user:c' }))
    assert.equal(back.seat, pc.seat)
    await until(() => pd.public.seats[pc.seat].control === 'human')
    assert.equal(await coins('user:c'), before)
  } catch (e) {
    console.error(logs.slice(-4000))
    throw e
  } finally {
    // A connection closed on purpose answers no leave: each is let go without waiting.
    for (const r of rooms) { try { r.connection.close() } catch { /* already gone */ } }
    if (server && server.exitCode === null) {
      const ended = once(server, 'exit')
      server.kill('SIGTERM')
      await ended
    }
    await sql.end()
    await admin.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`)
    await admin.end()
  }
})
