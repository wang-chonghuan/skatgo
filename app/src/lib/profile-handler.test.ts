import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { handleDaily } from './daily-handler'
import { handleFree } from './free-handler'

// SKATGO-128: a signed-in player's finished free deal goes into their record of play, so the web names the
// account with free play's review, and only there; the record itself is an account's. Accounts are local test
// accounts (lib/test-account.ts), the multiplayer service a stubbed fetch, as in room-handler.test.ts.

const LOCAL = 'http://localhost:55128'
const post = (path: string, body: object, cookie?: string) =>
  new Request(`${LOCAL}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.1.0.${Math.floor(Math.random() * 250)}`, ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  })
const anna = `skatgo_test_account=anna.${Date.now()}`

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

describe('free play names the signed-in player with its review', () => {
  it('passes the account on, and a guest as no one', async () => {
    await handleFree(post('/api/free/review', { token: 't' }, anna))
    expect(sent()).toEqual({ token: 't', player: 'user:test_anna' })
    await handleFree(post('/api/free/review', { token: 't' }))
    expect(sent()).toEqual({ token: 't' })
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
  it('is the account’s, and a guest is asked to sign in', async () => {
    const res = await handleDaily(post('/api/daily/profile', {}, anna))
    expect(res.status).toBe(200)
    expect(sent()).toEqual({ player: 'user:test_anna' })
    expect((await handleDaily(post('/api/daily/profile', {}))).status).toBe(401)
  })
})
