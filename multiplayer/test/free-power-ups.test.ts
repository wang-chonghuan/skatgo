import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { cp, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import express from 'express'
import pg from 'pg'
import type { Logged } from '../src/computers'
import { ODDS_MODES, freeRoutes, loadPool, seal, tokenKey } from '../src/free'
import { BIDS } from '../src/skatzero/bidding'
import { loadPolicy } from '../src/skatzero/policy'
import { Store } from '../src/store'

// SKATGO-177: free play's power-ups on the server — the deal's prepared win chances, and nothing else; the odds belong to
// the pool and an altered file is refused.

const DIR = new URL('../skatzero/', import.meta.url)
const KEY = 'k'.repeat(64)

test('win chances for the deal, and no put-away answer', { timeout: 120_000 }, async (t) => {
  const base = new URL(process.env.DATABASE_URL || '')
  assert(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname), 'Tests refuse external databases')
  const server = new pg.Pool({ connectionString: base.href })
  const name = `skatgo_powerups_${randomBytes(6).toString('hex')}`
  await server.query(`CREATE DATABASE "${name}"`)
  base.pathname = `/${name}`
  const store = new Store(base.href)
  await store.migrate()
  const [policy, pool] = await Promise.all([loadPolicy(DIR), loadPool(DIR)])
  const app = express()
  app.use('/free', freeRoutes(store, KEY, () => true, () => policy, () => pool))
  const http = app.listen(0)
  t.after(async () => {
    http.close()
    await store.close()
    await server.query(`DROP DATABASE "${name}" WITH (FORCE)`)
    await server.end()
  })
  const post = async (op: string, body: object) => {
    const r = await fetch(`http://127.0.0.1:${(http.address() as AddressInfo).port}/free/${op}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-admission-key': KEY }, body: JSON.stringify(body) })
    return { status: r.status, data: await r.json().catch(() => ({})) as Record<string, unknown> }
  }
  const key = tokenKey(KEY)
  const token = (id: number, log: Logged[]) => seal(key, { v: 1, pool: pool.version, id, t: Date.now(), log })

  const odds = await post('odds', { token: token(0, []) })
  assert.equal(odds.status, 200)
  assert.deepEqual(odds.data.bids, BIDS)
  const made = odds.data.made as Record<string, number[]>
  assert.deepEqual(Object.keys(made), [...ODDS_MODES])
  for (const m of ODDS_MODES) assert.ok(made[m].length === BIDS.length && made[m].every((x) => Number.isInteger(x) && x >= 0 && x <= 100))
  // The put-away is no power-up of the server's: the tips are worked out in the browser (the human: 「不留看ai的扣法」).
  assert.equal((await post('putaway', { token: token(0, []) })).status, 404)
})

test('the win chances belong to the pool; an altered file is refused', async () => {
  const copy = await mkdtemp(join(tmpdir(), 'skatzero-odds-'))
  await cp(new URL('.', DIR), copy, { recursive: true })
  const file = join(copy, 'free-odds.json.gz')
  const bytes = await readFile(file)
  bytes[bytes.length - 5] ^= 1
  await writeFile(file, bytes)
  await assert.rejects(loadPool(pathToFileURL(copy + '/')), /free_odds_altered/)
  const without = await loadPool(pathToFileURL(copy + '/'), { odds: false })
  assert.equal(without.odds, null)
})
