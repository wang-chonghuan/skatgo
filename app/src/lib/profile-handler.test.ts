import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { handleDaily } from './daily-handler'
import { handleFree } from './free-handler'

// SKATGO-128: a signed-in player's finished free deal goes into their record of play, so the web names the
// account with free play's review, and only there. SKATGO-182: a guest's too, under its device (`lib/guest.ts`), whose
// record is its own games, and whose games go to the account it signs in with. Accounts are local test
// accounts (lib/test-account.ts), the multiplayer service a stubbed fetch, as in room-handler.test.ts.

const LOCAL = 'http://localhost:55128'
const post = (path: string, body: object, cookie?: string) =>
  new Request(`${LOCAL}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.1.0.${Math.floor(Math.random() * 250)}`, ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  })
const anna = `skatgo_test_account=anna.${Date.now()}`
const device = 'd'.repeat(64)
const deviceCookie = `skatgo_daily=${device}`
const anonOf = async (d: string) => `anon:${Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(d))), (b) => b.toString(16).padStart(2, '0')).join('')}`

let upstream: ReturnType<typeof vi.fn>
const sent = () => JSON.parse(upstream.mock.calls.at(-1)![1].body as string)
beforeEach(() => {
  vi.stubEnv('MULTIPLAYER_URL', 'http://127.0.0.1:56128')
  vi.stubEnv('MULTIPLAYER_ADMISSION_KEY', 'k'.repeat(64))
  vi.stubEnv('SKATGO_TEST_ACCOUNTS', '1')
  upstream = vi.fn(async () => new Response(JSON.stringify({ deals: [] }), { status: 200 }))
  vi.stubGlobal('fetch', upstream)
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('free play names the player with its review', () => {
  it('passes the account on, and a guest as its device, kept in its cookie', async () => {
    await handleFree(post('/api/free/review', { token: 't' }, anna))
    expect(sent()).toEqual({ token: 't', player: 'user:test_anna' })
    const known = await handleFree(post('/api/free/review', { token: 't' }, deviceCookie))
    expect(sent()).toEqual({ token: 't', player: await anonOf(device) })
    expect(known.headers.get('set-cookie')).toMatch(new RegExp(`^skatgo_daily=${device}; Path=/api;`))
    const first = await handleFree(post('/api/free/review', { token: 't' }))
    const made = /^skatgo_daily=([a-f0-9]{64}); Path=\/api;/.exec(first.headers.get('set-cookie') ?? '')
    expect(made).not.toBeNull()
    expect(sent()).toEqual({ token: 't', player: await anonOf(made![1]) })
  })
  it('plays a game of the record again for an account only', async () => {
    await handleFree(post('/api/free/again', { game: 'free:p:1:2' }, anna))
    expect(sent()).toEqual({ game: 'free:p:1:2', player: 'user:test_anna' })
    const calls = upstream.mock.calls.length
    expect((await handleFree(post('/api/free/again', { game: 'free:p:1:2' }, deviceCookie))).status).toBe(401)
    expect(upstream.mock.calls.length).toBe(calls)
  })
  it('names no one with a move, and refuses a player the browser names', async () => {
    await handleFree(post('/api/free/act', { token: 't', revision: 0, action: { type: 'bid', value: 'pass' } }, anna))
    expect(sent()).not.toHaveProperty('player')
    const calls = upstream.mock.calls.length
    expect((await handleFree(post('/api/free/review', { token: 't', player: 'user:someone' }))).status).toBe(400)
    expect(upstream.mock.calls.length).toBe(calls)
  })
})

describe('the record of play', () => {
  it('is the account’s; a guest’s is its device’s games, none without a device', async () => {
    const res = await handleDaily(post('/api/daily/profile', {}, anna))
    expect(res.status).toBe(200)
    expect(sent()).toEqual({ player: 'user:test_anna' })
    await handleDaily(post('/api/daily/profile', {}, deviceCookie))
    expect(sent()).toEqual({ player: await anonOf(device) })
    const calls = upstream.mock.calls.length
    const none = await handleDaily(post('/api/daily/profile', {}))
    expect(await none.json()).toEqual({ deals: [], notes: [] })
    expect(upstream.mock.calls.length).toBe(calls)
  })
  it('takes the device’s games into the account it signs in with, before reading it', async () => {
    await handleDaily(post('/api/daily/profile', {}, `${anna}; ${deviceCookie}`))
    const paths = upstream.mock.calls.slice(-2).map((c) => new URL(String(c[0])).pathname)
    expect(paths).toEqual(['/daily/claim', '/daily/profile'])
    expect(JSON.parse(upstream.mock.calls.at(-2)![1].body as string)).toEqual({ from: await anonOf(device), to: 'user:test_anna' })
  })
})
