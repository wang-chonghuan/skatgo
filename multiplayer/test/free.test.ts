import test from 'node:test'
import assert from 'node:assert/strict'
import { cp, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Rejected } from '../src/model'
import { loadPool, open, seal, tokenKey } from '../src/free'

// Free play on the server (SKATGO-40): the game's token and the pool of prepared deals.

const DIR = new URL('../skatzero/', import.meta.url)

test('a game token round-trips; a tampered one or another key is refused', () => {
  const key = tokenKey('k'.repeat(64))
  const t = { v: 1 as const, pool: 'skatzero@1fe5cab', id: 7, t: 1, log: [{ seat: 1 as const, move: { type: 'bid' as const, value: 'pass' as const } }] }
  const token = seal(key, t)
  assert.deepEqual(open(key, token), t)
  assert.ok(!token.includes('pass') && !token.includes('skatzero'), 'opaque')
  const b = Buffer.from(token, 'base64url')
  b[20] ^= 1
  assert.throws(() => open(key, b.toString('base64url')), (e) => e instanceof Rejected && e.message === 'invalid_game')
  assert.throws(() => open(tokenKey('x'.repeat(64)), token), (e) => e instanceof Rejected)
})

test('the pool is the one the manifest names; an altered pool is refused', async () => {
  const pool = await loadPool(DIR)
  assert.equal(pool.version, 'skatzero@1fe5cab')
  assert.ok(pool.deals.length >= 1000)
  for (const d of pool.deals.slice(0, 50)) {
    assert.equal(new Set(d.deck.split(' ')).size, 32)
    for (const s of ['1', '2'] as const) assert.equal(d.computers[s].decisions.length, 40)
  }
  const copy = await mkdtemp(join(tmpdir(), 'skatzero-pool-'))
  await cp(new URL('.', DIR), copy, { recursive: true })
  const file = join(copy, 'free-pool.json.gz')
  const bytes = await readFile(file)
  bytes[bytes.length - 5] ^= 1
  await writeFile(file, bytes)
  await assert.rejects(loadPool(pathToFileURL(copy + '/')), /free_pool_altered/)
})
