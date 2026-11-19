import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { spawn, type ChildProcess } from 'node:child_process'
import { once } from 'node:events'
import { Client, type Room } from '@colyseus/sdk'
import pg from 'pg'
import { legalPlays } from '../../app/src/lib/skat/cards'
import { AWAY_MS, CHECKIN_COINS, DEAL_POINTS, FEES, dealOutcome, standingAfter } from '../../app/src/lib/skat/league'
import { dayOf } from '../src/daily'
import { type Command, type PrivateView, type PublicView, type Snapshot, GRACE_MS } from '../src/model'
import { Store } from '../src/store'

// The League (SKATGO-204, a deal at a time since SKATGO-205) against a real service and a database of its own: the day's
// check-in, the fee per deal, a table found in five seconds with personas in the empty seats or with another person of the
// tier, nobody else at it, deals one after another each scored once for each person, leaving (the deal counts, no further
// fee, the sitting ends with nobody left), a person away played for after the grace and back in their seat, one who cannot
// pay taken off at the next deal, a deal's review counted once for the person's record, and the one-time points reset.

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

test('League: check-in, matching, deals scored one by one, leaving, the grace, the fee per deal, reviews, the reset', { timeout: 400_000 }, async () => {
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

    // The day's check-in: CHECKIN_COINS on the first open, nothing on the next; a later day of the same week on top of what
    // is left; the first of a new week from CHECKIN_COINS again, what was left gone (SKATGO-210).
    const C = CHECKIN_COINS
    assert.deepEqual((await call('checkin', { player: 'user:a' })).body, { coins: C, added: C })
    assert.deepEqual((await call('checkin', { player: 'user:a' })).body, { coins: C, added: 0 })
    const today = dayOf(Date.now())
    const midnight = new Date(`${today}T00:00:00Z`)
    const monday = new Date(midnight.getTime() - ((midnight.getUTCDay() + 6) % 7) * 86_400_000).toISOString().slice(0, 10)
    if (monday !== today) {
      await sql.query('UPDATE league_players SET coins = 40, checkin_day = $1 WHERE player = $2', [monday, 'user:a'])
      assert.deepEqual((await call('checkin', { player: 'user:a' })).body, { coins: 40 + C, added: C })
    }
    await sql.query("UPDATE league_players SET coins = 40, checkin_day = '2000-01-01' WHERE player = 'user:a'")
    assert.deepEqual((await call('checkin', { player: 'user:a' })).body, { coins: C, added: C })
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
    assert.equal(await coins('user:a'), C - FEES[0])
    const s = await snapshot(alone.body.room)
    assert.equal(s.seats.filter(p => p.account === 'user:a').length, 1)
    assert.equal(s.seats.filter(p => p.persona?.startsWith('sim:') && p.account === null && p.nickname).length, 2)
    assert.equal(s.deals, 1)
    // Asked again while seated, the same table and no second fee.
    assert.deepEqual((await call('play', { player: 'user:a' })).body, { room: alone.body.room })
    assert.equal(await coins('user:a'), C - FEES[0])

    // Two people of a tier within five seconds: one table.
    for (const p of ['user:c', 'user:d']) await call('checkin', { player: p })
    const [c, d] = await Promise.all([call('play', { player: 'user:c' }), sleep(1500).then(() => call('play', { player: 'user:d' }))])
    assert.equal(c.body.room, d.body.room)
    const both = await snapshot(c.body.room)
    assert.deepEqual(both.seats.filter(p => p.account).map(p => p.account).sort(), ['user:c', 'user:d'])
    // Both sit down now: a person not at the table when the next deal comes is taken off it.
    const pc = await attach(await new Client(endpoint).joinById(c.body.room, { admissionKey, account: 'user:c' }))
    const pd = await attach(await new Client(endpoint).joinById(c.body.room, { admissionKey, account: 'user:d' }))

    // Nobody else comes into a League table, not even by its number.
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
      if ((v.phase === 'done' || v.phase === 'passedIn') && !v.seats[p.seat].ready) return send(p, { type: 'next' })
      if (v.actor !== p.seat) return
      if (v.phase === 'bidding') return send(p, { type: 'bid', value: 'pass' })
      if (v.phase === 'play') return send(p, { type: 'play', card: legalPlays(p.private.hand, v.trick.map(x => x.card), v.declaration!.contract)[0] })
    }

    // The person at the table plays deal after deal — no round ends after three — each scored for them as it ends, each new
    // deal taking the fee; each deal dealt by the seat after the last.
    const a = await attach(await new Client(endpoint).joinById(alone.body.room, { admissionKey, account: 'user:a' }))
    const dealers = new Set<number>()
    await until(async () => {
      if (a.public.phase === 'bidding') dealers.add(a.public.dealer)
      if (a.public.deals >= 4) return true
      await step(a)
      return false
    }, 300_000)
    assert.equal(dealers.size, 3)
    const match = a.public.league!.match
    const { rows: scored } = await sql.query('SELECT deal, points FROM league_deals WHERE match = $1 ORDER BY deal', [match])
    assert.equal(scored.length, 3)
    const last = a.public.league!.last!
    const mine = last.seats[a.seat]!
    assert.equal(last.deal, 2)
    assert.equal(mine.points, DEAL_POINTS[mine.outcome])
    assert.equal(scored[2].points[a.seat], mine.points)
    assert(last.seats.every((x, i) => (i === a.seat) === (x !== null)), 'only the person is scored')
    // The standing is the deals' points taken one by one (Bronze stops at 0, SKATGO-207).
    const fold = (start: { tier: number; points: number }, points: number[]) => points.reduce((s, x) => { const n = standingAfter(s, x); return { tier: n.tier, points: n.points } }, start)
    const sum = fold({ tier: 0, points: 0 }, scored.map(r => r.points[a.seat]))
    const standing = (await call('state', { player: 'user:a' })).body.me
    assert.deepEqual({ tier: standing.tier, points: standing.points }, sum)
    assert.equal(standing.coins, C - 4 * FEES[0])

    // Leaving during the fourth deal: the connection goes, the seat waits the grace as for one away, then a computer plays
    // the deal out; it is lost for them (SKATGO-206: −3 declaring, else −1), no further fee, and with nobody left the
    // sitting ends.
    const left = Date.now()
    const declaring = a.public.declarer === a.seat
    assert((await send(a, { type: 'leave' })).ok)
    const held = (await snapshot(alone.body.room)).seats[a.seat]
    assert(held.leaving && held.session === null && !held.autopilot, 'the seat waits the grace')
    assert(held.forfeit && held.stake === (declaring ? 'leftDeclaring' : 'left'), 'the deal is lost for them')
    await until(async () => (await sql.query('SELECT 1 FROM league_matches WHERE id = $1 AND finished_at IS NOT NULL', [match])).rowCount, GRACE_MS + 120_000)
    assert(Date.now() - left >= GRACE_MS, 'not before the grace')
    const { rows: fourth } = await sql.query('SELECT points, forfeits FROM league_deals WHERE match = $1 AND deal = 3', [match])
    assert.equal(fourth.length, 1)
    assert.equal(fourth[0].points[a.seat], declaring ? -3 : -1)
    assert.deepEqual(fourth[0].forfeits, [a.seat])
    const gone = (await call('state', { player: 'user:a' })).body.me
    assert.equal(gone.coins, C - 4 * FEES[0])
    assert.equal(gone.table, null)
    assert.equal(gone.points, fold(sum, [declaring ? -3 : -1]).points)

    // Each deal seen to its end has its review for its person, their seat turned to seat 0, counted once for their record;
    // the deal they left has none and goes into no record (SKATGO-206).
    for (let deal = 0; deal < 3; deal++) {
      const r = await call('review', { player: 'user:a', match, deal })
      assert.equal(r.status, 200)
      assert(r.body.mine && r.body.ai, 'the review has both games')
      // The defenders' card points (SKATGO-214: 40 or more keeps a lost defence at 0); a Null game counts none.
      const mine = r.body.mine as { declarer: number | null; won: boolean; declaration: { contract: { kind: string } } | null; detail: { defenderPoints: number } | null }
      const outcome = dealOutcome(mine.declarer, !!mine.won, 0, mine.declaration?.contract.kind === 'null' ? null : (mine.detail?.defenderPoints ?? null))
      assert.equal(DEAL_POINTS[outcome], scored[deal].points[a.seat])
    }
    assert.deepEqual(await call('review', { player: 'user:a', match, deal: 3 }), { status: 409, body: { error: 'no_such_deal' } })
    await call('review', { player: 'user:a', match, deal: 0 })
    assert.equal((await sql.query("SELECT count(*)::int AS n FROM play_deals WHERE player = 'user:a' AND game LIKE 'league:%'")).rows[0].n, 3)
    assert.equal((await call('review', { player: 'user:c', match, deal: 0 })).status, 409)

    // Away at the shared table: a computer plays the seat after the grace; back with a new connection, the seat is theirs
    // again and no fee comes back.
    const before = await coins('user:c')
    pc.room.connection.close()
    await until(() => pd.public.seats[pc.seat].control === 'ai', GRACE_MS + 10_000)
    const back = await attach(await new Client(endpoint).joinById(c.body.room, { admissionKey, account: 'user:c' }))
    assert.equal(back.seat, pc.seat)
    await until(() => pd.public.seats[pc.seat].control === 'human')
    assert.equal(await coins('user:c'), before)

    // One who cannot pay the next deal gets up when it is dealt: a persona in the seat, no fee; the other pays and stays.
    await sql.query("UPDATE league_players SET coins = 0 WHERE player = 'user:c'")
    const dCoins = await coins('user:d')
    const dealt = pd.public.deals
    await until(async () => {
      if (pd.public.deals > dealt) return true
      await Promise.all([step(back), step(pd)].map(p => p.catch(() => null)))
      return false
    }, 300_000)
    const after = await snapshot(c.body.room)
    assert.equal(after.seats[back.seat].account, null)
    assert(after.seats[back.seat].persona?.startsWith('sim:'))
    assert.equal(after.seats[pd.seat].account, 'user:d')
    assert.equal(await coins('user:c'), 0)
    assert.equal(await coins('user:d'), dCoins - FEES[0])

    // The points' new scale (SKATGO-205): a row on the old one starts again from 0, once; tier and coins stay.
    await sql.query("UPDATE league_players SET scale = 1, points = 7, tier = 2 WHERE player = 'user:d'")
    const migrating = new Store(base.href)
    await migrating.migrate()
    const reset = (await sql.query("SELECT tier, points, coins, scale FROM league_players WHERE player = 'user:d'")).rows[0]
    assert.deepEqual([reset.tier, reset.points, reset.scale], [2, 0, 2])
    assert.equal(reset.coins, dCoins - FEES[0])
    await sql.query("UPDATE league_players SET points = 5 WHERE player = 'user:d'")
    await migrating.migrate()
    assert.equal((await sql.query("SELECT points FROM league_players WHERE player = 'user:d'")).rows[0].points, 5)
    await migrating.close()

    // The League's board (SKATGO-206): everyone who played a deal, by tier, then points; not one who never sat down.
    const { rows: standings } = await sql.query(
      `SELECT l.player, l.tier, l.points, p.nickname FROM league_players l JOIN daily_players p USING (player)
        WHERE l.player = ANY($1) ORDER BY l.tier DESC, l.points DESC, l.player`, [['user:a', 'user:c', 'user:d']])
    assert.equal(standings.length, 3)
    const board = (await call('state', { player: 'user:c' })).body.board
    assert.deepEqual(board.rows.map((r: any) => [r.nickname, r.tier, r.points]), standings.map(r => [r.nickname, r.tier, r.points]))
    assert.deepEqual(board.rows.filter((r: any) => r.you).map((r: any) => r.nickname), standings.filter(r => r.player === 'user:c').map(r => r.nickname))
    assert.equal(board.me, undefined)
    board.rows.forEach((r: any, i: number) => {
      const prev = board.rows[i - 1]
      assert.equal(r.rank, prev && prev.tier === r.tier && prev.points === r.points ? prev.rank : i + 1)
    })
    const guest = (await call('state', { player: null })).body.board
    assert.deepEqual(guest.rows.map((r: any) => r.nickname), board.rows.map((r: any) => r.nickname))
    assert(guest.rows.every((r: any) => !r.you))

    // A hundred and one in Legend ahead: the board shows the first hundred, and the asker's own row after them.
    const many = Array.from({ length: 101 }, (_, i) => `user:board${i}`)
    for (const [i, p] of many.entries()) {
      await sql.query('INSERT INTO league_players (player, tier, points, updated_at) VALUES ($1, 5, $2, 0)', [p, 1000 - i])
      await sql.query('INSERT INTO daily_players (player, nickname, created_at) VALUES ($1, $2, 0)', [p, `Board ${i}`])
    }
    await sql.query(`INSERT INTO league_matches (id, room, tier, seats, created_at) VALUES ('board', '000000', 5, $1, 0)`, [JSON.stringify(many)])
    await sql.query(`INSERT INTO league_deals (match, deal, pool, pool_id, dealer, log) VALUES ('board', 0, 'free', 0, 0, '[]')`)
    const crowded = (await call('state', { player: 'user:a' })).body.board
    assert.equal(crowded.rows.length, 100)
    assert.deepEqual([crowded.rows[0].nickname, crowded.rows[99].nickname], ['Board 0', 'Board 99'])
    assert(crowded.rows.every((r: any) => !r.you))
    const own = standings.findIndex(r => r.player === 'user:a')
    assert.equal(crowded.me.you, true)
    assert.equal(crowded.me.nickname, standings[own].nickname)
    assert(crowded.me.rank > 101, 'after the hundred and one in Legend')

    // Away when a deal ends (SKATGO-206): it is not counted for them yet; back within a minute, to its result, it counts as
    // it came out and has its review.
    const shared = pd.public.league!.match
    const playing = pd.public.deals - 1
    assert(!['done', 'passedIn'].includes(pd.public.phase), 'a deal on the table')
    const dropped = Date.now()
    pd.room.connection.close()
    const row = async (deal: number) => (await sql.query('SELECT points, forfeits FROM league_deals WHERE match = $1 AND deal = $2', [shared, deal])).rows[0]
    await until(() => row(playing), GRACE_MS + 120_000)
    assert(Date.now() - dropped < AWAY_MS, 'ended within the minute')
    assert.equal((await row(playing)).points[pd.seat], null)
    assert.deepEqual((await snapshot(c.body.room)).league?.pending, [pd.seat])
    const dBefore = (await call('state', { player: 'user:d' })).body.me.points
    const pd2 = await attach(await new Client(endpoint).joinById(c.body.room, { admissionKey, account: 'user:d' }))
    const seen = await row(playing)
    assert([3, -3, -1, 0].includes(seen.points[pd2.seat]), 'counted as it came out')
    assert(!seen.forfeits?.includes(pd2.seat))
    assert.equal((await call('state', { player: 'user:d' })).body.me.points - dBefore, seen.points[pd2.seat])
    assert.equal((await call('review', { player: 'user:d', match: shared, deal: playing })).status, 200)

    // Away a minute during a deal: it counts as leaving — the deal lost for them, no review — and with nobody left the
    // sitting ends. (The scale's reset above left d in Gold: back to this table's tier, so the next deal is theirs.)
    await sql.query("UPDATE league_players SET tier = 0, points = 0 WHERE player = 'user:d'")
    await until(async () => {
      if (pd2.public.deals > playing + 1) return true
      await step(pd2).catch(() => null)
      return false
    }, 60_000)
    const next = pd2.public.deals - 1
    const dDeclaring = pd2.public.declarer === pd2.seat
    const away = Date.now()
    pd2.room.connection.close()
    await until(async () => (await sql.query('SELECT 1 FROM league_matches WHERE id = $1 AND finished_at IS NOT NULL', [shared])).rowCount, AWAY_MS + 120_000)
    assert(Date.now() - away >= AWAY_MS, 'not before the minute')
    const lost = await row(next)
    assert.equal(lost.points[pd2.seat], dDeclaring ? -3 : -1)
    assert.deepEqual(lost.forfeits, [pd2.seat])
    assert.deepEqual(await call('review', { player: 'user:d', match: shared, deal: next }), { status: 409, body: { error: 'no_such_deal' } })
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
