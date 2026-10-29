import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import pg from 'pg'
import { FREE_IDS, PRACTICE_QUESTIONS, optionsOf, practiceHand, questionId, rightAnswer } from '../../app/src/lib/skat/bidding/practice'
import { biddingAnswer, biddingMerge } from '../src/bidding'
import { Store } from '../src/store'

// The bidding practice's record (SKATGO-150): the first answer stays, a later right one fixes the question, an answer
// not offered is refused, and a guest's answers merge in once without overwriting the account's.

test('bidding record: first answer kept, fixed by a later right one, guest answers merged', { timeout: 60_000 }, async (t) => {
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

  const q = PRACTICE_QUESTIONS[5]
  const id = questionId(q)
  const right = rightAnswer(q)
  const wrong = optionsOf(practiceHand(q), q.bid).find((v) => v !== right)!
  let r = await biddingAnswer(store, 'user:anna', id, wrong)
  assert.deepEqual(r[id], { first: wrong, fixed: false })
  r = await biddingAnswer(store, 'user:anna', id, right)
  assert.deepEqual(r[id], { first: wrong, fixed: true }, 'the first answer stays; the right one fixes it')
  await assert.rejects(biddingAnswer(store, 'user:anna', id, 999), /not_offered/)

  // A guest's two free questions join; one the account already answered keeps the account's first answer.
  const [a, b] = FREE_IDS
  const qa = PRACTICE_QUESTIONS[0]
  const qb = PRACTICE_QUESTIONS[1]
  await biddingAnswer(store, 'user:ben', a, rightAnswer(qa))
  const guestWrong = optionsOf(practiceHand(qb), qb.bid).find((v) => v !== rightAnswer(qb))!
  const guestOther = optionsOf(practiceHand(qa), qa.bid).find((v) => v !== rightAnswer(qa))!
  const merged = await biddingMerge(store, 'user:ben', { [a]: { first: guestOther, fixed: false }, [b]: { first: guestWrong, fixed: false } })
  assert.deepEqual(merged[a], { first: rightAnswer(qa), fixed: false })
  assert.deepEqual(merged[b], { first: guestWrong, fixed: false })
  assert.deepEqual(await biddingMerge(store, 'user:ben', { [b]: { first: guestWrong, fixed: false } }), merged, 'merging twice changes nothing')
})
