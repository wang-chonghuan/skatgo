import { createServer } from 'node:http'
import express from 'express'
import { Server, matchMaker } from '@colyseus/core'
import { WebSocketTransport } from '@colyseus/ws-transport'
import { dailyRoutes, prepareDays } from './daily'
import { freeRoutes, loadPool } from './free'
import { loadPolicy, type Policy } from './skatzero/policy'
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
app.use('/free', freeRoutes(key, () => ready && !stopping, () => policy, () => pool))
const httpServer = createServer(app)
const server = new Server({
  transport: new WebSocketTransport({ server: httpServer, maxPayload: 16 * 1024, pingInterval: 5000, pingMaxRetries: 2 }),
  gracefullyShutdown: false,
  greet: false,
})
server.define('skat', makeRoom(store, key, () => ready && !stopping, aiDelay))
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
      // The leader deals today and tomorrow ahead, with the computers' bidding (SKATGO-39); readiness
      // does not wait for it.
      void prepareDays(store, policy!)
      setInterval(() => { if (ready && !stopping) void prepareDays(store, policy!) }, 60 * 60 * 1000).unref()
      console.log(JSON.stringify({ event: 'ready', version, port }))
      return
    }
  } catch {
    console.error('leadership_start_failed')
    process.exit(1)
  }
  election = setTimeout(elect, 250)
}
await elect()
async function stop() {
  if (stopping) return
  stopping = true
  ready = false
  clearTimeout(election)
  const deadline = setTimeout(() => process.exit(1), 20_000)
  deadline.unref()
  await server.gracefullyShutdown(false)
  await policy?.release()
  await store.close()
  process.exit(0)
}
process.on('SIGTERM', () => void stop())
process.on('SIGINT', () => void stop())
