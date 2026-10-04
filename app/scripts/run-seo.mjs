import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { checkSeo } from './check-seo.mjs'

const app = fileURLToPath(new URL('../', import.meta.url))
const root = new URL('../../', import.meta.url)

export function parseArgs(args) {
  const options = { built: false, origin: undefined }
  for (const arg of args) {
    if (arg === '--built') options.built = true
    else if (/^https?:\/\//.test(arg) && !options.origin) options.origin = arg
    else throw new Error(`Unknown SEO argument: ${arg}`)
  }
  assert.ok(!(options.built && options.origin), '--built and explicit origin cannot be combined')
  if (options.origin) {
    const url = new URL(options.origin)
    assert.ok(url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password, 'Provide an HTTP(S) origin, without path, query or credentials')
  }
  return options
}

export async function selectPort(preferred, prefix) {
  const candidates = [preferred, ...Array.from({ length: 1000 }, (_, index) => prefix * 1000 + index)]
  for (const port of new Set(candidates)) {
    const free = await new Promise((resolve, reject) => {
      const probe = createServer()
      probe.once('error', (error) => ['EADDRINUSE', 'EACCES'].includes(error.code) ? resolve(false) : reject(error))
      probe.listen(port, '127.0.0.1', () => probe.close(() => resolve(true)))
    })
    if (free) return port
  }
  throw new Error('No free SEO preview port in the configured web block')
}

export function preferredPorts() {
  const project = JSON.parse(readFileSync(new URL('.intentfold/project.json', root), 'utf8'))
  const ticketRoot = new URL('.intentfold/tickets/', root)
  // Match the recorded worktree, not the newest ticket or an arbitrary untracked artifact.
  const ticket = process.env.INTENTFOLD_TICKET
  if (ticket) {
    const record = JSON.parse(readFileSync(new URL(`${ticket}/ticket.json`, ticketRoot), 'utf8'))
    assert.equal(record.worktree, fileURLToPath(root).replace(/\/$/, ''), 'SEO ticket worktree mismatch')
    return [record.ports.web, project.ports.web.ticket_prefix]
  }
  const name = fileURLToPath(root).replace(/\/$/, '').split('/').at(-1)
  const identifier = name.match(/--([A-Z][A-Z0-9]*-\d+)$/)?.[1]
  if (identifier && existsSync(new URL(`${identifier}/ticket.json`, ticketRoot))) {
    const record = JSON.parse(readFileSync(new URL(`${identifier}/ticket.json`, ticketRoot), 'utf8'))
    assert.equal(record.worktree, fileURLToPath(root).replace(/\/$/, ''), 'SEO ticket worktree mismatch')
    return [record.ports.web, project.ports.web.ticket_prefix]
  }
  return [project.ports.web.main, project.ports.web.ticket_prefix]
}

export async function stopChild(child) {
  if (!child?.pid || child.exitCode !== null || child.signalCode !== null) return
  const exited = new Promise((resolve) => child.once('exit', resolve))
  const kill = (signal) => {
    try {
      if (process.platform === 'win32') child.kill(signal)
      else process.kill(-child.pid, signal)
    } catch (error) {
      if (error.code !== 'ESRCH') throw error
    }
  }
  kill('SIGTERM')
  const timeout = setTimeout(() => kill('SIGKILL'), 3000)
  try { await exited } finally { clearTimeout(timeout) }
}

function launch(command, args, env) {
  const child = spawn(command, args, { cwd: app, env, stdio: 'inherit', detached: process.platform !== 'win32' })
  const done = new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`SEO child failed: ${signal || `exit ${code}`}`)))
  })
  // The server is observed at readiness and after crawling, not as an unhandled exit rejection.
  done.catch(() => {})
  return { child, done }
}

export async function runSeo(options = {}, { inspect = checkSeo } = {}) {
  const abort = new AbortController()
  let owned
  const interrupt = () => abort.abort(new Error('SEO check interrupted'))
  process.once('SIGINT', interrupt)
  process.once('SIGTERM', interrupt)
  const onAbort = () => { void stopChild(owned) }
  abort.signal.addEventListener('abort', onAbort)
  try {
    if (options.origin) {
      console.log(`SEO explicit-origin mode (read-only): ${new URL(options.origin).origin}`)
      return await inspect(options.origin, { signal: abort.signal })
    }
    if (!options.built) {
      console.log('SEO local mode: building CURRENT checkout')
      const build = launch(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], process.env)
      owned = build.child
      await build.done
    } else {
      console.log('SEO local mode: inspecting existing build (--built; caller must build this checkout first)')
    }
    abort.signal.throwIfAborted()
    assert.ok(existsSync(new URL('.output/server/index.mjs', new URL('../', import.meta.url))), 'No production build; run npm run check:seo without --built')
    const [preferred, prefix] = preferredPorts()
    const port = await selectPort(preferred, prefix)
    const origin = `http://127.0.0.1:${port}`
    const envFile = existsSync(new URL('.env', new URL('../', import.meta.url))) ? ['--env-file=.env'] : []
    const server = launch(process.execPath, [...envFile, '.output/server/index.mjs'], {
      ...process.env, PORT: String(port), NITRO_PORT: String(port), HOST: '127.0.0.1', NITRO_HOST: '127.0.0.1',
    })
    owned = server.child
    console.log(`SEO owned preview: ${origin} (pid ${owned.pid}); no existing listener reused`)
    let ready = false
    for (let attempt = 0; attempt < 150; attempt++) {
      abort.signal.throwIfAborted()
      if (owned.exitCode !== null || owned.signalCode !== null) await server.done
      try {
        const response = await fetch(`${origin}/sitemap.xml`, { signal: AbortSignal.timeout(1000), redirect: 'manual' })
        ready = response.status === 200
        await response.body?.cancel()
      } catch { /* Startup may not have bound its socket yet. */ }
      // Allow bind errors to surface before a race-created unrelated listener could be crawled.
      await delay(100, undefined, { signal: abort.signal })
      if (owned.exitCode !== null || owned.signalCode !== null) {
        await server.done
        throw new Error('SEO preview exited during readiness')
      }
      if (ready) break
    }
    assert.ok(ready, `SEO preview readiness timeout: ${origin}`)
    const result = await inspect(origin, { signal: abort.signal })
    assert.ok(owned.exitCode === null && owned.signalCode === null, 'Owned SEO preview exited during crawl')
    return result
  } finally {
    await stopChild(owned)
    process.removeListener('SIGINT', interrupt)
    process.removeListener('SIGTERM', interrupt)
    abort.signal.removeEventListener('abort', onAbort)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await runSeo(parseArgs(process.argv.slice(2))) }
  catch (error) {
    console.error(`FAIL SEO: ${error.message}`)
    process.exitCode = 1
  }
}
