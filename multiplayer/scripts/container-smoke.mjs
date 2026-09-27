import { execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import assert from 'node:assert/strict'
process.loadEnvFile(new URL('../.env', import.meta.url))
const url = new URL(process.env.DATABASE_URL)
assert.equal(url.hostname, '127.0.0.1', 'Container smoke test is local-only')
const db = `skatgo-multiplayer-db-${url.port}`
const port = Number(process.env.TEST_PORT || 56020)
const name = `skatgo-multiplayer-smoke-${port}`
const network = `skatgo-multiplayer-smoke-${port}`
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
const image = process.argv[2] || 'skatgo-multiplayer:SKATGO-20'
url.hostname = db
url.port = '5432'
const env = { ...process.env, DATABASE_URL: url.href, MULTIPLAYER_ADMISSION_KEY: randomBytes(32).toString('hex') }
let connected = false
let started = false
docker('network', 'create', network)
try {
  docker('network', 'connect', network, db)
  connected = true
  execFileSync('docker', ['run', '-d', '--name', name, '--network', network,
    '-p', `127.0.0.1:${port}:10000`, '-e', 'DATABASE_URL', '-e', 'MULTIPLAYER_ADMISSION_KEY',
    '-e', 'APP_VERSION=container-smoke', image], { env, stdio: 'pipe' })
  started = true
  const end = Date.now() + 30_000
  let ok = false
  while (Date.now() < end) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/readyz`)
      const body = await r.json()
      if (r.ok && body.ready && body.version === 'container-smoke') { ok = true; break }
    } catch {}
    await new Promise(r => setTimeout(r, 100))
  }
  assert(ok, 'Container did not become ready')
  assert.equal(docker('inspect', '--format', '{{.Config.User}}', name).trim(), 'node')
  console.log('Container ready with real PostgreSQL, correct version, and non-root user')
} finally {
  if (started) { docker('stop', name); docker('rm', name) }
  if (connected) docker('network', 'disconnect', network, db)
  docker('network', 'rm', network)
}
