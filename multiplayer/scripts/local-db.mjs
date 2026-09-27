import { execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const dir = fileURLToPath(new URL('..', import.meta.url))
const envFile = `${dir}/.env`
const action = process.argv[2] || 'start'
if (existsSync(envFile)) process.loadEnvFile(envFile)
const port = Number(process.env.DATABASE_PORT || new URL(process.env.DATABASE_URL || 'postgres://localhost:3222').port)
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid DATABASE_PORT')
const name = `skatgo-multiplayer-db-${port}`
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] })
if (action === 'stop') {
  docker('stop', name)
} else if (action === 'start') {
  const names = docker('ps', '-a', '--format', '{{.Names}}').trim().split('\n')
  if (names.includes(name)) {
    if (!existsSync(envFile)) throw new Error('Existing local database requires its saved .env; refusing to replace credentials')
    docker('start', name)
  } else {
    const saved = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null
    if (saved && (saved.hostname !== '127.0.0.1' || Number(saved.port) !== port ||
      saved.username !== 'skatgo' || saved.pathname !== '/skatgo')) {
      throw new Error('Refusing to use a non-matching local database configuration')
    }
    const password = saved ? decodeURIComponent(saved.password) : randomBytes(24).toString('hex')
    const env = [
      `DATABASE_URL=postgresql://skatgo:${password}@127.0.0.1:${port}/skatgo`,
      `MULTIPLAYER_ADMISSION_KEY=${process.env.MULTIPLAYER_ADMISSION_KEY || randomBytes(32).toString('hex')}`,
      ...(process.env.DOCKER_CONTEXT ? [`DOCKER_CONTEXT=${process.env.DOCKER_CONTEXT}`] : []),
    ]
    docker('run', '-d', '--name', name, '-p', `127.0.0.1:${port}:5432`,
      '-e', 'POSTGRES_USER=skatgo', '-e', 'POSTGRES_DB=skatgo', '-e', `POSTGRES_PASSWORD=${password}`,
      'postgres:17-alpine')
    if (!existsSync(envFile)) writeFileSync(envFile, env.join('\n') + '\n', { mode: 0o600, flag: 'wx' })
    else if (process.env.DOCKER_CONTEXT && !readFileSync(envFile, 'utf8').includes('DOCKER_CONTEXT=')) {
      writeFileSync(envFile, `DOCKER_CONTEXT=${process.env.DOCKER_CONTEXT}\n`, { mode: 0o600, flag: 'a' })
    }
  }
  const end = Date.now() + 60_000
  while (true) {
    try { docker('exec', name, 'pg_isready', '-U', 'skatgo', '-d', 'skatgo'); break }
    catch {
      if (Date.now() >= end) throw new Error('Local PostgreSQL did not become ready')
      await new Promise(r => setTimeout(r, 250))
    }
  }
  console.log(`Local PostgreSQL ready on ${port}; credentials are in multiplayer/.env`)
} else throw new Error('Use start or stop')
