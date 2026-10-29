import { createServer } from 'node:http'
import express from 'express'
import { Server, matchMaker } from '@colyseus/core'
import { WebSocketTransport } from '@colyseus/ws-transport'
import { dailyRoutes, nameUnnamed, prepareDays } from './daily'
import { forumRoutes } from './forum'
import { translateForum } from './translate'
import { freeRoutes, loadPool } from './free'
import { ladderRoutes } from './ladder'
import { biddingRoutes } from './bidding'
import { loadPolicy, type Policy } from './skatzero/policy'
import { referralRoutes } from './referral'
import { shareRoutes } from './shares'
import { makeRoom, RESTORE } from './room'
import { Store } from './store'

const url = process.env.DATABASE_URL
const key = process.env.MULTIPLAYER_ADMISSION_KEY
if (!url || !key || key.length < 32) throw new Error('DATABASE_URL and a 32+ character MULTIPLAYER_ADMISSION_KEY are required')
const port = Number(process.env.PORT || 3221)
const aiDelay = Number(process.env.AI_DELAY_MS || 350)
if (!Number.isInteger(port) || port < 1 || port > 65535 || !Number.isFinite(aiDelay) || aiDelay < 10) {
  throw new Error('Invalid PORT or AI_DELAY_MS')
}
let ready = false
let stopping = false
/** This instance handed its leadership to a newer one (SKATGO-156) and only waits to be stopped. */
let handedOver = false
const store = new Store(url)
await store.migrate()
// SkatZero's nine models (SKATGO-38) load, verify and warm while the service starts; it is not ready
// before they are, and a missing or altered model stops it.
let policy: Policy | null = null
// Free play's pool of prepared deals (SKATGO-40), checked against the manifest like the models.
let pool: Awaited<ReturnType<typeof loadPool>> | null = null
const policyLoad = Promise.all([loadPolicy(new URL('../skatzero/', import.meta.url)), loadPool(new URL('../skatzero/', import.meta.url))]).then(
  ([p, deals]) => {
    pool = deals
    policy = p
    console.log(JSON.stringify({ event: 'skatzero_ready', rss: process.memoryUsage().rss }))
  },
  (e) => {
    console.error(JSON.stringify({ event: 'skatzero_failed', reason: e instanceof Error ? e.message : String(e) }))
    process.exit(1)
  },
)
const app = express()
app.disable('x-powered-by')
const version = process.env.RENDER_GIT_COMMIT || process.env.APP_VERSION || 'local'
app.get(['/healthz', '/readyz'], async (req, res) => {
  try {
    await store.pool.query('SELECT 1')
    const isReady = ready && policy !== null
    const ok = !stopping && (req.path === '/healthz' || isReady)
    res.status(ok ? 200 : 503).json({ ok, ready: isReady, version, service: 'skatgo-multiplayer' })
  } catch { res.status(503).json({ ok: false, ready: false, version }) }
})
app.use('/daily', dailyRoutes(store, key, () => ready && !stopping, () => policy))
app.use('/free', freeRoutes(store, key, () => ready && !stopping, () => policy, () => pool))
app.use('/ladder', ladderRoutes(store, key, () => ready && !stopping))
app.use('/bidding', biddingRoutes(store, key, () => ready && !stopping))
app.use('/rooms', referralRoutes(store, key, () => ready && !stopping))
app.use('/forum', forumRoutes(store, key, () => ready && !stopping))
app.use('/share', shareRoutes(store, key, () => ready && !stopping, () => policy))
const httpServer = createServer(app)
const server = new Server({
  transport: new WebSocketTransport({ server: httpServer, maxPayload: 16 * 1024, pingInterval: 5000, pingMaxRetries: 2 }),
  gracefullyShutdown: false,
  greet: false,
})
server.define('skat', makeRoom(store, key, () => ready && !stopping, aiDelay, () => policy, () => pool))
await server.listen(port, '0.0.0.0')
let election: ReturnType<typeof setTimeout>
async function elect() {
  if (stopping) return
  try {
    const acquired = await store.acquire(() => {
      ready = false
      console.error('leadership_connection_lost')
      // Other pool connections must not keep serving after the advisory lock dies.
      process.exit(1)
    })
    if (acquired) {
      for (const s of await store.all()) await matchMaker.createRoom('skat', { restore: RESTORE, id: s.id })
      await policyLoad
      ready = true
      // A newer instance asks to take over at its deploy (SKATGO-156).
      await store.listenHandoff((from) => void handOver(from))
      // The leader deals today and tomorrow ahead, with the computers' bidding (SKATGO-39); readiness
      // does not wait for it.
      void prepareDays(store, policy!)
      // Entries finished before SKATGO-90 without a name go on their boards under one.
      void nameUnnamed(store).catch(() => console.error('daily_naming_failed'))
      // The forum in both languages ahead of its readers (SKATGO-124).
      void translateForum(store).catch(() => console.error('forum_translation_start_failed'))
      setInterval(() => { if (ready && !stopping) void prepareDays(store, policy!) }, 60 * 60 * 1000).unref()
      console.log(JSON.stringify({ event: 'ready', version, port }))
      return
    }
  } catch {
    console.error('leadership_start_failed')
    process.exit(1)
  }
  // Not the leader: once this instance can serve (SkatZero loaded), it asks the leader to hand over (SKATGO-156) — at
  // most every two seconds — instead of waiting for Render to stop the old instance.
  if (policy && Date.now() - asked > 2000) {
    asked = Date.now()
    void store.requestHandoff(version).catch(() => console.error('handoff_request_failed'))
  }
  election = setTimeout(elect, 250)
}
let asked = 0
/** The leader steps down for a newer instance (SKATGO-156): it stops serving, closes its tables — their state is in the
 *  database, and their players reconnect to the new leader, which restores them — and releases the lock. The process
 *  stays up, healthy, until Render stops it. */
async function handOver(from: string) {
  if (!ready || stopping || handedOver) return
  handedOver = true
  ready = false
  console.log(JSON.stringify({ event: 'handover', to: from }))
  await matchMaker.gracefullyShutdown().catch(() => {})
  await store.stepDown().catch(() => console.error('step_down_failed'))
  console.log(JSON.stringify({ event: 'stepped_down' }))
}
await elect()
async function stop() {
  if (stopping) return
  stopping = true
  ready = false
  clearTimeout(election)
  const deadline = setTimeout(() => process.exit(1), 20_000)
  deadline.unref()
  // After a hand-over the tables are already closed.
  await server.gracefullyShutdown(false).catch(() => {})
  await policy?.release()
  await store.close()
  process.exit(0)
}
process.on('SIGTERM', () => void stop())
process.on('SIGINT', () => void stop())
