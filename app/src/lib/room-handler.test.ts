import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { REFERRAL_MS, handleRoom } from './room-handler'
import { ticketClaims } from './room-ticket'
import { testAccount } from './test-account'

// SKATGO-117: opening a private table takes an account, joining does not; a ticket is issued only while
// the multiplayer service seats people; a guest who signs up at a table is passed on, if the account is
// new. Accounts here are local test accounts (lib/test-account.ts) — the same way every server route
// sees an account — so no Clerk is involved; the multiplayer service is a stubbed fetch.

const KEY = 'k'.repeat(64)
const LOCAL = 'http://localhost:55117'
const post = (path: string, body: object, cookie?: string, origin = LOCAL) =>
  new Request(`${origin}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.0.0.${Math.floor(Math.random() * 250)}`, ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  })
const account = (name: string, createdAt = Date.now()) => `skatgo_test_account=${name}.${createdAt}`

let upstream: ReturnType<typeof vi.fn>
beforeEach(() => {
  vi.stubEnv('MULTIPLAYER_URL', 'http://127.0.0.1:56117')
  vi.stubEnv('MULTIPLAYER_ADMISSION_KEY', KEY)
  vi.stubEnv('SKATGO_TEST_ACCOUNTS', '1')
  upstream = vi.fn(async (url: URL | string) =>
    String(url).endsWith('/readyz') ? new Response('{}', { status: 200 }) : new Response(JSON.stringify({ recorded: true }), { status: 200 }),
  )
  vi.stubGlobal('fetch', upstream)
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('a local test account', () => {
  const request = (origin: string, cookie: string) => new Request(`${origin}/`, { headers: { cookie } })
  it('signs a request in only on this machine and only when the environment says so', () => {
    expect(testAccount(request(LOCAL, account('host', 1_760_000_000_000)))).toEqual({ userId: 'test_host', createdAt: 1_760_000_000_000 })
    expect(testAccount(request('http://127.0.0.1:55117', account('host')))?.userId).toBe('test_host')
    expect(testAccount(request('https://skatgo.com', account('host')))).toBeNull()
    expect(testAccount(request('https://skatgo.onrender.com', account('host')))).toBeNull()
    vi.stubEnv('SKATGO_TEST_ACCOUNTS', '')
    expect(testAccount(request(LOCAL, account('host')))).toBeNull()
  })
  it('takes only its own shape of cookie', () => {
    expect(testAccount(request(LOCAL, 'skatgo_test_account=Host.1760000000000'))).toBeNull()
    expect(testAccount(request(LOCAL, 'skatgo_test_account=host'))).toBeNull()
    expect(testAccount(request(LOCAL, 'other=1'))).toBeNull()
  })
})

describe('POST /api/room/ticket', () => {
  it('opens only for an account, and the ticket names it', async () => {
    const guest = await handleRoom(post('/api/room/ticket', { for: 'open' }))
    expect(guest.status).toBe(401)
    expect(await guest.json()).toEqual({ error: 'sign_in_required' })
    const signed = await handleRoom(post('/api/room/ticket', { for: 'open' }, account('host')))
    expect(signed.status).toBe(200)
    expect(ticketClaims(KEY, (await signed.json()).ticket)).toEqual({ purpose: 'open', user: 'user:test_host' })
  })
  it('lets anyone join', async () => {
    const r = await handleRoom(post('/api/room/ticket', { for: 'join' }))
    expect(r.status).toBe(200)
    expect(ticketClaims(KEY, (await r.json()).ticket)).toEqual({ purpose: 'join' })
  })
  it('says not_ready while the service is not seating people', async () => {
    upstream.mockImplementation(async () => new Response('{}', { status: 503 }))
    const r = await handleRoom(post('/api/room/ticket', { for: 'join' }))
    expect(r.status).toBe(503)
    expect(await r.json()).toEqual({ error: 'not_ready' })
  })
  it('refuses a request that does not say what it is for', async () => {
    expect((await handleRoom(post('/api/room/ticket', {}))).status).toBe(400)
  })
  it('ignores a test account on the published site', async () => {
    expect((await handleRoom(post('/api/room/ticket', { for: 'open' }, account('host'), 'https://skatgo.com'))).status).toBe(401)
  })
})

describe('POST /api/room/referral', () => {
  const seat = 'a'.repeat(64)
  it('passes a new account and its seat on to the service', async () => {
    const r = await handleRoom(post('/api/room/referral', { roomId: 'abc123', seatToken: seat }, account('guest')))
    expect(r.status).toBe(200)
    const call = upstream.mock.calls.find(([url]) => String(url).endsWith('/rooms/referral'))!
    expect(JSON.parse(call[1].body)).toEqual({ account: 'user:test_guest', roomId: 'abc123', seatToken: seat })
    expect(call[1].headers['x-admission-key']).toBe(KEY)
  })
  it('does not pass on an account older than an hour', async () => {
    const r = await handleRoom(post('/api/room/referral', { roomId: 'abc123', seatToken: seat }, account('old', Date.now() - REFERRAL_MS - 60_000)))
    expect(await r.json()).toEqual({ recorded: false })
    expect(upstream.mock.calls.some(([url]) => String(url).endsWith('/rooms/referral'))).toBe(false)
  })
  it('needs an account and a well-formed seat', async () => {
    expect((await handleRoom(post('/api/room/referral', { roomId: 'abc123', seatToken: seat }))).status).toBe(401)
    expect((await handleRoom(post('/api/room/referral', { roomId: 'abc123', seatToken: 'x' }, account('guest')))).status).toBe(400)
  })
})
