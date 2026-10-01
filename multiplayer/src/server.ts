import { createServer } from 'node:http'
import express from 'express'
import { Server, matchMaker } from '@colyseus/core'
import { WebSocketTransport } from '@colyseus/ws-transport'
import { dailyRoutes } from './daily'
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
const app = express()
app.disable('x-powered-by')
const version = process.env.RENDER_GIT_COMMIT || process.env.APP_VERSION || 'local'
app.get(['/healthz', '/readyz'], async (req, res) => {
  try {
    await store.pool.query('SELECT 1')
    const ok = !stopping && (req.path === '/healthz' || ready)
    res.status(ok ? 200 : 503).json({ ok, ready, version, service: 'skatgo-multiplayer' })
  } catch { res.status(503).json({ ok: false, ready: false, version }) }
})
app.use('/daily', dailyRoutes(store, key, () => ready && !stopping))
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
      ready = true
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
  await store.close()
  process.exit(0)
}
process.on('SIGTERM', () => void stop())
process.on('SIGINT', () => void stop())
