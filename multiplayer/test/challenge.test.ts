import test from 'node:test'
import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'
import express from 'express'
import { sameCard } from '../../app/src/lib/skat/cards'
import { CHALLENGE_DEALS, CHALLENGE_KINDS, contractOfGame, ofKind, ownSlice } from '../../app/src/lib/skat/challenge'
import { gameFromView } from '../../app/src/lib/skat/tournament'
import { challengeRoutes, loadChallengePool, redeal } from '../src/challenge'
import { deckOf, open, tokenKey } from '../src/free'
import { loadPolicy } from '../src/skatzero/policy'

// SKATGO-248: hard hands — the pool as committed, and a deal of each kind through the routes: the player declares from the
// skat step, no Hand and no other game; after the discard the server declares the kind's game; once more keeps the
// player's ten and the skat and deals the other twenty anew.

const DIR = new URL('../skatzero/', import.meta.url)
const KEY = 'k'.repeat(64)

test('the pool: thirty deals a kind, of the kind, easiest first, rates within 50–90 %', async () => {
  const pool = await loadChallengePool(DIR)
  for (const kind of CHALLENGE_KINDS) {
    const deals = pool.kinds[kind]
    assert.equal(deals.length, CHALLENGE_DEALS)
    for (const [i, d] of deals.entries()) {
      assert.ok(d.rate >= 0.5 && d.rate <= 0.9, `${kind} ${i + 1}: rate ${d.rate}`)
      if (i > 0) assert.ok(deals[i - 1].rate >= d.rate, `${kind}: easiest first`)
      assert.ok(ofKind(kind, deckOf(d.deck).slice(...ownSlice(d.dealer))), `${kind} ${i + 1}: of its kind`)
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
  app.use('/challenge', challengeRoutes(KEY, () => true, () => policy, () => pool))
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
