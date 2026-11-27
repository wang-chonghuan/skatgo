import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import pg from 'pg'
import { deal, roleOf, type Seat } from '../../app/src/lib/skat/game'

// The League's daily pools (SKATGO-251), dealing only — no deal is played: which seat holds the strongest hand, a stored
// deal turned to any dealer, the strongest hand's share for one, two and three people, an account never dealt the same
// deal twice, and yesterday's pool while today's is not complete.

// A small pool, so "complete" is reachable in the test; set before the module reads it.
process.env.LEAGUE_POOL_DEALS = '12'
const { chooseDeal, leagueDealFor, strongestSeat, turned } = await import('../src/league-pool')
const { deckOf, loadPool } = await import('../src/free')
const { dayOf } = await import('../src/daily')
const { Store } = await import('../src/store')
const { raw } = await import('../src/computers')

const free = await loadPool(new URL('../skatzero/', import.meta.url), { odds: false })
const bids = (d: (typeof free.deals)[number]) => [0, 1, 2].map((s) => d.computers[String(s) as '0'].maxBid)
const rows = free.deals.map((d, n) => ({ ...d, n, strongest: strongestSeat(d.dealer, bids(d)) }))

/** A seeded random number in [0, 1) (mulberry32), so the sampling is the same every run. */
function seeded(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

test('the strongest hand: the highest bid from 18, a tie to the earlier position, none when all pass', () => {
  // Dealer 0: forehand 1, middlehand 2, rearhand 0.
  assert.equal(strongestSeat(0, [20, 18, 23]), 2)
  assert.equal(strongestSeat(0, [23, 23, 23]), 1)
  assert.equal(strongestSeat(0, [23, 17, 23]), 2)
  assert.equal(strongestSeat(0, [24, 0, 24]), 2)
  assert.equal(strongestSeat(0, [17, 17, 0]), null)
})

test('a stored deal turned to another dealer: every hand goes round with its bidding', () => {
  for (const d of free.deals.slice(0, 30)) {
    const own = deal(d.dealer, deckOf(d.deck))
    for (const dealer of [0, 1, 2] as Seat[]) {
      const t = turned(d, dealer)
      const g = deal(dealer, deckOf(t.deck))
      for (const seat of [0, 1, 2] as Seat[]) {
        const from = own.hands.findIndex((h) => h.map(raw).join() === g.hands[seat].map(raw).join()) as Seat
        assert.deepEqual(t.computers[String(seat) as '0'], d.computers[String(from) as '0'])
        assert.equal(roleOf(seat, dealer), roleOf(from, d.dealer))
      }
    }
  }
})

test('the strongest hand goes to one person half the deals, to each of two half, to each of three a third', () => {
  const random = seeded(251)
  const holds = (row: (typeof rows)[number], seat: Seat, dealer: Seat) => row.strongest !== null && roleOf(row.strongest, row.dealer) === roleOf(seat, dealer)
  const share = (people: Seat[]) => {
    const got = people.map(() => 0)
    for (let i = 0; i < 2000; i++) {
      const dealer = Math.floor(random() * 3) as Seat
      const row = chooseDeal(rows, people, dealer, random)
      people.forEach((seat, k) => { if (holds(row, seat, dealer)) got[k]++ })
    }
    return got.map((n) => n / 2000)
  }
  const [one] = share([1])
  assert(one >= 0.46 && one <= 0.54, `one person ${one}`)
  const two = share([0, 2])
  for (const x of two) assert(x >= 0.46 && x <= 0.54, `two people ${two}`)
  const three = share([0, 1, 2])
  for (const x of three) assert(x >= 0.29 && x <= 0.37, `three people ${three}`)
  for (const xs of [two, three]) assert(Math.max(...xs) - Math.min(...xs) <= 0.04, `apart ${xs}`)
})

test('dealt from the pool: never the same deal twice; yesterday\'s while today\'s is not complete; none left waits', { timeout: 60_000 }, async () => {
  const base = new URL(process.env.DATABASE_URL || '')
  assert(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname), 'Acceptance refuses external databases')
  const admin = new pg.Pool({ connectionString: base.href })
  const dbName = `skatgo_leaguepool_${randomBytes(6).toString('hex')}`
  await admin.query(`CREATE DATABASE "${dbName}"`)
  base.pathname = `/${dbName}`
  const store = new Store(base.href)
  try {
    await store.migrate()
    const now = Date.now()
    const today = dayOf(now)
    const yesterday = dayOf(now - 24 * 60 * 60 * 1000)
    const put = async (day: string, from: number, count: number) => {
      for (let n = 0; n < count; n++) {
        const d = rows[from + n]
        await store.pool.query('INSERT INTO league_pool (day, n, dealer, deck, computers, strongest, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [day, n, d.dealer, d.deck, JSON.stringify(d.computers), d.strongest, now])
      }
    }
    // In a transaction of its own, as a table's step deals (the store's needs the leader's lock, which this test has not).
    const inTransaction = async <T>(run: (c: pg.PoolClient) => Promise<T>) => {
      const c = await store.pool.connect()
      try {
        await c.query('BEGIN')
        const value = await run(c)
        await c.query('COMMIT')
        return value
      } catch (e) {
        await c.query('ROLLBACK')
        throw e
      } finally { c.release() }
    }
    const dealTo = (account: string, seat: Seat = 0, dealer: Seat = 2) => inTransaction((c) => leagueDealFor(c, [{ seat, account }], dealer, now))

    // Today's pool not there yet: yesterday's complete one, each deal once for an account, then none — the table waits.
    await put(yesterday, 0, 12)
    const seen = new Set<string>()
    for (let i = 0; i < 12; i++) {
      const d = await dealTo('user:a', (i % 3) as Seat, ((i + 1) % 3) as Seat)
      assert.equal(d.pool, `league@${yesterday}`)
      const key = `${d.pool}:${d.id}`
      assert(!seen.has(key), `dealt twice: ${key}`)
      seen.add(key)
      // The deal as stored, turned to the table's dealer.
      const stored = rows[d.id!]
      assert.equal(d.deck.map(raw).join(' '), stored.deck)
      assert.equal(d.dealer, ((i + 1) % 3) as Seat)
    }
    await assert.rejects(dealTo('user:a'), /not_ready/)

    // Today's pool partly made: today's deals and yesterday's, still none twice.
    await put(today, 100, 5)
    const partly = await dealTo('user:a')
    assert.equal(partly.pool, `league@${today}`)
    const b = await dealTo('user:b')
    assert([`league@${today}`, `league@${yesterday}`].includes(b.pool!))

    // Today's complete: only today's, for anyone.
    await store.pool.query('DELETE FROM league_pool WHERE day = $1', [today])
    await put(today, 200, 12)
    for (let i = 0; i < 12; i++) assert.equal((await dealTo('user:c')).pool, `league@${today}`)
    await assert.rejects(dealTo('user:c'), /not_ready/)

    // Two people at a table: neither is dealt a deal either has had.
    const both = await inTransaction((c) => leagueDealFor(c, [{ seat: 0, account: 'user:c' }, { seat: 1, account: 'user:d' }], 0, now)).catch((e) => e)
    assert.match(String(both), /not_ready/)

    const { rows: twice } = await store.pool.query('SELECT player, pool, pool_id, count(*) FROM league_seen GROUP BY 1, 2, 3 HAVING count(*) > 1')
    assert.equal(twice.length, 0)
  } finally {
    await store.pool.end()
    await admin.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`)
    await admin.end()
  }
})
