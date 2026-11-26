import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import type { AddressInfo } from 'node:net'
import express from 'express'
import pg from 'pg'
import { sameCard } from '../../app/src/lib/skat/cards'
import { legalFor } from '../../app/src/lib/skat/game'
import { CHALLENGE_DEALS, CHALLENGE_KINDS, contractOfGame, ofKind, ownSlice, twelveOf } from '../../app/src/lib/skat/challenge'
import { type DealSummary, gameFromView } from '../../app/src/lib/skat/tournament'
import { challengePass, challengeRecordRoutes, challengeRoutes, loadChallengePool, passedDeal, redeal } from '../src/challenge'
import { Store } from '../src/store'
import { deckOf, open, tokenKey } from '../src/free'
import { loadPolicy } from '../src/skatzero/policy'

// SKATGO-248: hard hands — the pool as committed, and a deal of each kind through the routes: the player declares from the
// skat step, no Hand and no other game; after the discard the server declares the kind's game; once more keeps the
// player's ten and the skat and deals the other twenty anew.

const DIR = new URL('../skatzero/', import.meta.url)
const KEY = 'k'.repeat(64)

test('the pool: thirty deals a kind, of the kind with the skat picked up, easiest first, rates within 50–90 %', async () => {
  const pool = await loadChallengePool(DIR)
  for (const kind of CHALLENGE_KINDS) {
    const deals = pool.kinds[kind]
    assert.equal(deals.length, CHALLENGE_DEALS)
    for (const [i, d] of deals.entries()) {
      assert.ok(d.rate >= 0.5 && d.rate <= 0.9, `${kind} ${i + 1}: rate ${d.rate}`)
      if (i > 0) assert.ok(deals[i - 1].rate >= d.rate, `${kind}: easiest first`)
      assert.ok(ofKind(kind, twelveOf(d.dealer, deckOf(d.deck))), `${kind} ${i + 1}: of its kind with the skat`)
      if (kind === 'bad-seat') assert.ok((d.front ?? 0) >= 0.9, `bad seat ${i + 1}: made from forehand`)
    }
  }
})

test('a deal again: the player\'s ten and the skat kept, the rest dealt anew', async () => {
  const pool = await loadChallengePool(DIR)
  const d = pool.kinds['bad-seat'][0]
  const deck = deckOf(d.deck)
  const again = redeal(d.dealer, deck)
  const [a, b] = ownSlice(d.dealer)
  assert.deepEqual(again.slice(a, b), deck.slice(a, b))
  assert.deepEqual(again.slice(30), deck.slice(30))
  assert.equal(new Set(again.map((c) => c.suit + c.rank)).size, 32)
})

test('each kind through the routes: pick up, put two away, the kind\'s game declared, once more', { timeout: 180_000 }, async (t) => {
  const [policy, pool] = await Promise.all([loadPolicy(DIR), loadChallengePool(DIR)])
  const app = express()
  // No player is named here, so nothing is recorded: the store is never asked.
  app.use('/challenge', challengeRoutes(null as unknown as Store, KEY, () => true, () => policy, () => pool))
  const http = app.listen(0)
  t.after(() => void http.close())
  const at = `http://127.0.0.1:${(http.address() as AddressInfo).port}/challenge`
  const post = async (op: string, body: object, key = KEY) => {
    const r = await fetch(`${at}/${op}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-admission-key': key }, body: JSON.stringify(body) })
    return { status: r.status, body: await r.json() }
  }
  assert.equal((await post('new', { kind: 'one-jack-suit', n: 1 }, 'wrong')).status, 403)
  for (const kind of CHALLENGE_KINDS) {
    const first = (await post('new', { kind, n: 1 })).body
    let g = gameFromView(first.steps.at(-1))
    assert.equal(g.phase, 'skat')
    assert.equal(g.declarer, 0)
    // No Hand, no game of the player's own.
    assert.equal((await post('act', { token: first.token, revision: first.revision, action: { type: 'hand' } })).status, 409)
    const picked = (await post('act', { token: first.token, revision: first.revision, action: { type: 'pickup' } })).body
    g = gameFromView(picked.steps.at(-1))
    const two = g.hands[0].slice(0, 2)
    const put = (await post('act', { token: picked.token, revision: picked.revision, action: { type: 'discard', cards: two } })).body
    const played = put.steps.map(gameFromView).find((s: ReturnType<typeof gameFromView>) => s.declaration)
    assert.deepEqual(played.declaration.contract, contractOfGame(pool.kinds[kind][0].game), kind)
    // The deck as the token holds it: the player's ten and the skat where they were, the rest not as it lay.
    const again = (await post('again', { token: put.token })).body
    const deckIn = (token: string) => deckOf(open<{ deck: string; dealer: 0 | 1 | 2 }>(tokenKey(KEY, 'skatgo-challenge/1'), token).deck)
    const was = deckIn(first.token)
    const now = deckIn(again.token)
    const [a, b] = ownSlice(pool.kinds[kind][0].dealer)
    assert.ok(now.every((c, i) => (i >= a && i < b) || i >= 30 ? sameCard(c, was[i]) : true), `${kind}: same ten and skat`)
    assert.ok(!now.every((c, i) => sameCard(c, was[i])), `${kind}: the others anew`)
  }
})

// SKATGO-249: each kind's progress — a deal passed when the player made the game, or lost it where SkatZero's run of the
// same cards lost too; an account's passes kept by the service, a guest's merged in once signed in; a pass is never undone.

const summary = (won: boolean): DealSummary => ({ declarer: 0, declaration: null, bid: 18, won, scores: [0, 0, 0], detail: null })

test('passed: won, or lost where the AI lost too; lost where the AI won is not', () => {
  assert.equal(passedDeal({ mine: summary(true), ai: summary(true) }), true)
  assert.equal(passedDeal({ mine: summary(true), ai: summary(false) }), true)
  assert.equal(passedDeal({ mine: summary(false), ai: summary(false) }), true)
  assert.equal(passedDeal({ mine: summary(false), ai: summary(true) }), false)
})

test('passed, the Schneider kind: Schneider made, or missed where the AI missed it too', () => {
  const withS = (won: boolean, schneider: boolean): DealSummary => ({ ...summary(won), detail: { value: 0, declarerPoints: schneider ? 95 : 70, defenderPoints: 0, overbid: false, schneider, schwarz: false } })
  assert.equal(passedDeal({ mine: withS(true, true), ai: withS(true, true) }, 'schneider'), true)
  assert.equal(passedDeal({ mine: withS(true, false), ai: withS(true, true) }, 'schneider'), false)
  assert.equal(passedDeal({ mine: withS(true, false), ai: withS(true, false) }, 'schneider'), true)
  assert.equal(passedDeal({ mine: withS(true, false), ai: withS(true, true) }, 'one-jack-suit'), true)
})

test('progress: the review records an account\'s pass, a guest\'s is merged, nothing is undone', { timeout: 180_000 }, async (t) => {
  const base = new URL(process.env.DATABASE_URL || '')
  assert(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname), 'Tests refuse external databases')
  const server = new pg.Pool({ connectionString: base.href })
  const name = `skatgo_challenge_${randomBytes(6).toString('hex')}`
  await server.query(`CREATE DATABASE "${name}"`)
  base.pathname = `/${name}`
  const store = new Store(base.href)
  const [policy, pool] = await Promise.all([loadPolicy(DIR), loadChallengePool(DIR)])
  const app = express()
  app.use('/challenge', challengeRoutes(store, KEY, () => true, () => policy, () => pool))
  app.use('/challenge-record', challengeRecordRoutes(store, KEY, () => true))
  const http = app.listen(0)
  t.after(async () => {
    http.close()
    await store.close()
    await server.query(`DROP DATABASE "${name}" WITH (FORCE)`)
    await server.end()
  })
  await store.migrate()
  assert.ok(await store.acquire(() => {}))
  const at = `http://127.0.0.1:${(http.address() as AddressInfo).port}`
  const post = async (path: string, body: object, key = KEY) => {
    const r = await fetch(`${at}${path}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-admission-key': key }, body: JSON.stringify(body) })
    return { status: r.status, body: await r.json() }
  }
  const who = 'user:test_anna'
  assert.equal((await post('/challenge-record/state', { player: who }, 'wrong')).status, 403)
  assert.deepEqual((await post('/challenge-record/state', { player: who })).body, { passed: {} })
  assert.equal((await post('/challenge-record/state', { player: 'anon:x' })).status, 400)

  // A deal played out — pick up, put the first two away, then the first legal card each turn — and reviewed for the
  // account: the review says whether it is passed, and the record agrees.
  let deal = (await post('/challenge/new', { kind: 'null-weak-spot', n: 3 })).body
  deal = (await post('/challenge/act', { token: deal.token, revision: deal.revision, action: { type: 'pickup' } })).body
  const two = gameFromView(deal.steps.at(-1)).hands[0].slice(0, 2)
  deal = (await post('/challenge/act', { token: deal.token, revision: deal.revision, action: { type: 'discard', cards: two } })).body
  for (let g = gameFromView(deal.steps.at(-1)); g.phase !== 'done'; g = gameFromView(deal.steps.at(-1))) {
    deal = (await post('/challenge/act', { token: deal.token, revision: deal.revision, action: { type: 'play', card: legalFor(g, 0)[0] } })).body
  }
  const review = (await post('/challenge/review', { token: deal.token, player: who })).body
  assert.equal(review.passed, review.mine.won === true || review.ai.won === false)
  assert.equal(review.kind, 'null-weak-spot')
  assert.equal(review.n, 3)
  const recorded = (await post('/challenge-record/state', { player: who })).body.passed
  assert.deepEqual(recorded, review.passed ? { 'null-weak-spot': [3] } : {})

  // A guest's passes join the account's; sending them twice changes nothing; a pass is kept whatever follows.
  const merged = (await post('/challenge-record/merge', { player: who, passed: { 'bad-seat': [2, 1], 'null-weak-spot': [5] } })).body.passed
  assert.deepEqual(merged['bad-seat'], [1, 2])
  assert.ok(merged['null-weak-spot'].includes(5))
  assert.deepEqual((await post('/challenge-record/merge', { player: who, passed: { 'bad-seat': [2, 1] } })).body.passed, merged)
  assert.equal((await post('/challenge-record/merge', { player: who, passed: { 'bad-seat': [31] } })).status, 400)
  assert.equal((await post('/challenge-record/merge', { player: who, passed: { 'no-kind': [1] } })).status, 400)
  // Nobody else's.
  assert.deepEqual(await challengePass(store, 'user:test_ben', {}), {})
})
