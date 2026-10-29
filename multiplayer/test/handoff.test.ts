import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import pg from 'pg'
import { Store } from '../src/store'

// The hand-over at a deploy (SKATGO-156): the leader hears a newcomer's request, steps down at once, and the newcomer takes
// the lock — no waiting for the old instance to be stopped.
test('a newcomer asks, the leader steps down, the newcomer leads', { timeout: 30_000 }, async (t) => {
  const base = new URL(process.env.DATABASE_URL || '')
  assert(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname), 'Tests refuse external databases')
  const server = new pg.Pool({ connectionString: base.href })
  const name = `skatgo_handoff_${randomBytes(6).toString('hex')}`
  await server.query(`CREATE DATABASE "${name}"`)
  base.pathname = `/${name}`
  const old = new Store(base.href)
  const fresh = new Store(base.href)
  t.after(async () => {
    await old.close()
    await fresh.close()
    await server.query(`DROP DATABASE "${name}" WITH (FORCE)`)
    await server.end()
  })
  await old.migrate()
  assert.ok(await old.acquire(() => assert.fail('the leader must not lose its connection')))
  let heard: (from: string) => void = () => {}
  const asked = new Promise<string>((resolve) => (heard = resolve))
  await old.listenHandoff((from) => heard(from))
  assert.equal(await fresh.acquire(() => {}), false, 'the lock is held')
  await fresh.requestHandoff('v2')
  assert.equal(await asked, 'v2')
  await old.stepDown()
  assert.ok(await fresh.acquire(() => {}), 'the newcomer leads')
  await assert.rejects(old.transaction(async () => 1), /not_ready/, 'the old one writes nothing more')
})
