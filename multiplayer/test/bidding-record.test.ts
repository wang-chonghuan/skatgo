import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import pg from 'pg'
import { FREE_IDS, PRACTICE_QUESTIONS, questionId, solutionOf, valueOptions } from '../../app/src/lib/skat/bidding/practice'
import { biddingAnswer, biddingMerge } from '../src/bidding'
import { Store } from '../src/store'

// The bidding practice's record (SKATGO-150; two steps since SKATGO-151): the first attempt stays, a later one right in
// both steps fixes the question, an attempt not offered is refused, the answers to the questions before SKATGO-159 are
// deleted, and a guest's attempts merge in once without overwriting the account's.

test('bidding record: first attempt kept, fixed by a later right one, old rows deleted, guest attempts merged', { timeout: 60_000 }, async (t) => {
  const base = new URL(process.env.DATABASE_URL || '')
  assert(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname), 'Tests refuse external databases')
  const server = new pg.Pool({ connectionString: base.href })
  const name = `skatgo_bidding_${randomBytes(6).toString('hex')}`
  await server.query(`CREATE DATABASE "${name}"`)
  base.pathname = `/${name}`
  const store = new Store(base.href)
  t.after(async () => {
    await store.close()
    await server.query(`DROP DATABASE "${name}" WITH (FORCE)`)
    await server.end()
  })
  await store.migrate()
  assert.ok(await store.acquire(() => {}))

  // A question the AI plays: a wrong bid first, then right in both steps.
  const q = PRACTICE_QUESTIONS.find((p) => solutionOf(p).value !== null)!
  const id = questionId(q)
  const sol = solutionOf(q)
  const wrongValue = valueOptions(q).find((v) => v !== sol.value)!
  let r = await biddingAnswer(store, 'user:anna', id, { contract: sol.contract, value: wrongValue })
  assert.deepEqual(r[id], { contract: sol.contract, value: wrongValue, fixed: false })
  r = await biddingAnswer(store, 'user:anna', id, { contract: sol.contract, value: sol.value })
  assert.deepEqual(r[id], { contract: sol.contract, value: wrongValue, fixed: true }, 'the first attempt stays; the right one fixes it')
  await assert.rejects(biddingAnswer(store, 'user:anna', id, { contract: sol.contract, value: 999 }), /not_offered/)
  await assert.rejects(biddingAnswer(store, 'user:anna', id, { contract: 'pass', value: null }), /not_offered/, 'step 2 is asked when the AI plays')

  // SKATGO-159: an answer to the questions before v2 is deleted when the service starts, and never read.
  await store.pool.query(
    'INSERT INTO bidding_answers (player, question, first, fixed, answered_at, updated_at) VALUES ($1, $2, 18, false, 1, 1), ($1, $3, null, false, 1, 1)',
    ['user:old', `${q.deal}-${q.seat}`, `${q.deal + 1}-${q.seat}`],
  )
  await store.migrate()
  const { rows } = await store.pool.query("SELECT question FROM bidding_answers WHERE question NOT LIKE 'v2-%'")
  assert.equal(rows.length, 0, 'the old answers are gone')
  r = await biddingAnswer(store, 'user:anna', id, { contract: sol.contract, value: sol.value })
  assert.deepEqual(r[id], { contract: sol.contract, value: wrongValue, fixed: true }, 'the new answers stay')

  // A guest's free attempts join; one the account already answered keeps the account's first attempt.
  const [a, b] = FREE_IDS
  const qa = PRACTICE_QUESTIONS[0]
  const qb = PRACTICE_QUESTIONS[1]
  const sa = solutionOf(qa)
  const sb = solutionOf(qb)
  await biddingAnswer(store, 'user:ben', a, { contract: sa.contract, value: sa.value })
  const other = sb.contract === 'C' ? 'S' : 'C'
  // The guest played a wrong contract at `b` (with step 2's first number when it was asked).
  const guest = { [b]: { contract: other, value: sb.value === null ? null : valueOptions(qb)[0], fixed: false } } as const
  const merged = await biddingMerge(store, 'user:ben', { [b]: guest[b] })
  assert.deepEqual(merged[a], { contract: sa.contract, value: sa.value, fixed: false })
  assert.deepEqual(merged[b], guest[b])
  assert.deepEqual(await biddingMerge(store, 'user:ben', { [b]: guest[b] }), merged, 'merging twice changes nothing')
})
