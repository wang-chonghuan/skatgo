import test from 'node:test'
import assert from 'node:assert/strict'
import { cp, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { sameCard } from '../../app/src/lib/skat/cards'
import { encode } from '../src/skatzero/encode'
import { type PlayerView, loadPolicy, toZ, verifyModels } from '../src/skatzero/policy'
import { BIDS, declareAfterPickup, seatBidding, skatOrHand } from '../src/skatzero/bidding'
import { loadBiddingTables } from '../src/skatzero/tables'

// SkatZero's card play (SKATGO-38) against its Python original: the fixture's views were cut from
// seeded engine games, and their expected tensors, values and choices were produced by SkatZero's own
// driver. Encoding must match element for element; values within the ONNX parity tolerance; choices
// exactly. The models themselves must be the nine the manifest names.

const DIR = new URL('../skatzero/', import.meta.url)
type Fixture = { view: PlayerView; obsOnes: number[]; obsWidth: number; historyOnes: number[]; values: [PlayerView['hand'][number], number][]; choice: PlayerView['hand'][number] }
const ones = (a: Float32Array) => [...a].flatMap((v, i) => (v ? [i] : []))

test('the committed models are the nine the manifest names', async () => {
  const models = await verifyModels(DIR)
  assert.equal(models.size, 9)
})

test('an altered model is refused', async () => {
  const copy = await mkdtemp(join(tmpdir(), 'skatzero-'))
  await cp(new URL('.', DIR), copy, { recursive: true })
  const file = join(copy, 'models', 'G_1.onnx')
  const bytes = await readFile(file)
  bytes[bytes.length - 1] ^= 1
  await writeFile(file, bytes)
  await assert.rejects(verifyModels(pathToFileURL(copy + '/')), /skatzero_model_altered G_1/)
})

test('encoding, values and choices equal SkatZero\'s Python driver', { timeout: 60_000 }, async () => {
  const { states } = JSON.parse(await readFile(new URL('fixtures/skatzero-parity.json', import.meta.url), 'utf8')) as { states: Fixture[] }
  assert.ok(states.length >= 54)
  const policy = await loadPolicy(DIR)
  try {
    for (const [i, f] of states.entries()) {
      const e = encode(toZ(f.view).state)
      assert.equal(e.obs.length, f.obsWidth, `state ${i}: obs width`)
      assert.deepEqual(ones(e.obs), f.obsOnes, `state ${i}: obs`)
      assert.deepEqual(ones(e.history), f.historyOnes, `state ${i}: history`)
      const values = await policy.values(f.view)
      assert.equal(values.length, f.values.length, `state ${i}: candidates`)
      values.forEach(({ card, value }, k) => {
        const [want, ref] = f.values[k]
        assert.ok(sameCard(card, want), `state ${i}: candidate ${k}`)
        assert.ok(Math.abs(value - ref) <= 1e-5 + 1e-4 * Math.abs(ref), `state ${i}: value ${k} ${value} vs ${ref}`)
      })
      assert.ok(sameCard(await policy.choose(f.view), f.choice), `state ${i}: choice`)
    }
  } finally {
    await policy.release()
  }
})

// SkatZero's bidding (SKATGO-39): the tables, and the port against SkatZero's Python Bidder.
type BidFixture = { hand: string[]; position: number; order: [number, number][]; highest: number; pickupNoPen: number[]; handNoPen: number[][]; choices: [number, string][] }
type DeclareFixture = { hand: string[]; position: number; winning: number; game: string; discard: string[] }
// Tables computed on another platform may differ in the last digits of the net's values (ONNX
// Runtime builds differ); decisions must not.
const near = (a: number, b: number) => Math.abs(a - b) <= 1e-3

test('the bidding tables are the eight the manifest names; an altered one is refused', async () => {
  const t = await loadBiddingTables(DIR)
  assert.deepEqual(Object.keys(t).sort(), ['D', 'DH', 'G', 'GH'])
  const copy = await mkdtemp(join(tmpdir(), 'skatzero-'))
  await cp(new URL('.', DIR), copy, { recursive: true })
  const file = join(copy, 'bidding', 'values_GH.npy')
  const bytes = await readFile(file)
  bytes[bytes.length - 1] ^= 1
  await writeFile(file, bytes)
  await assert.rejects(loadBiddingTables(pathToFileURL(copy + '/')), /skatzero_table_altered values_GH.npy/)
})

test('bidding equals SkatZero\'s Python Bidder: highest bid, skat or Hand, discard and game', { timeout: 120_000 }, async () => {
  const { bid, declare } = JSON.parse(await readFile(new URL('fixtures/skatzero-bidding.json', import.meta.url), 'utf8')) as { bid: BidFixture[]; declare: DeclareFixture[] }
  assert.ok(bid.length >= 6 && declare.length >= 21)
  const policy = await loadPolicy(DIR)
  try {
    for (const [i, f] of bid.entries()) {
      const r = await seatBidding(policy, f.hand, f.position, f.order)
      assert.equal(r.maxBid, f.highest, `hand ${i}: highest bid`)
      r.pickup.forEach((v, k) => assert.ok(near(v, f.pickupNoPen[k]), `hand ${i}: pick-up value at ${BIDS[k]}`))
      r.hand.forEach((t, m) => t.forEach((v, k) => assert.ok(near(v, f.handNoPen[m][k]), `hand ${i}: Hand value ${m} at ${BIDS[k]}`)))
      for (const [b, want] of f.choices) {
        const c = skatOrHand(r, b)
        assert.equal(c.pickup ? 'pickup' : c.mode, want, `hand ${i}: skat or Hand at ${b}`)
      }
    }
    for (const [i, f] of declare.entries()) {
      const d = await declareAfterPickup(policy, f.hand, f.position, f.winning)
      assert.equal(d.mode, f.game, `declare ${i}: game`)
      assert.deepEqual(d.discard, f.discard, `declare ${i}: discard`)
    }
  } finally {
    await policy.release()
  }
})
