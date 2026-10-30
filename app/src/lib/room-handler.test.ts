import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { REFERRAL_MS, WRONG_LIMITS, handleRoom } from './room-handler'
import { ticketClaims } from './room-ticket'
import { testAccount } from './test-account'

// SKATGO-163: every ticket to a private room takes an account and names it, a join also the room's number,
// which the multiplayer service is asked about first; wrong numbers are counted per account; the room an account is
// in is passed on; a newcomer who signed up is passed on, if the account is new (SKATGO-117). Accounts here are local
// test accounts (lib/test-account.ts) — the same way every server route sees an account — so no Clerk is involved;
// the multiplayer service is a stubbed fetch.

const KEY = 'k'.repeat(64)
const LOCAL = 'http://localhost:55117'
const post = (path: string, body: object, cookie?: string, origin = LOCAL) =>
  new Request(`${origin}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.0.0.${Math.floor(Math.random() * 250)}`, ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  })
const account = (name: string, createdAt = Date.now()) => `skatgo_test_account=${name}.${createdAt}`

/** The service as stubbed: ready; room 482917 open to newcomers, 555555 full, 777777 the asker's own; no other room. */
const service = async (url: URL | string) => {
  const u = new URL(String(url))
  const reply = (status: number, body: object) => new Response(JSON.stringify(body), { status })
  if (u.pathname === '/readyz') return reply(200, {})
  if (u.pathname === '/rooms/mine') return reply(200, { room: u.searchParams.get('account') === 'user:test_seated' ? '777777' : null })
  if (u.pathname === '/rooms/referral') return reply(200, { recorded: true })
  const status = { '/rooms/482917': 'open', '/rooms/555555': 'full', '/rooms/777777': 'member' }[u.pathname]
  if (!status) return reply(404, { error: 'room_not_found' })
  const elsewhere = u.searchParams.get('account') === 'user:test_seated' && status !== 'member' ? '777777' : null
  return reply(200, { status, elsewhere })
}

let upstream: ReturnType<typeof vi.fn>
beforeEach(() => {
  vi.stubEnv('MULTIPLAYER_URL', 'http://127.0.0.1:56117')
  vi.stubEnv('MULTIPLAYER_ADMISSION_KEY', KEY)
  vi.stubEnv('SKATGO_TEST_ACCOUNTS', '1')
  upstream = vi.fn(service)
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
  it('needs an account for opening and for joining, and the ticket names it', async () => {
    for (const body of [{ for: 'open' }, { for: 'join', room: '482917' }]) {
      const guest = await handleRoom(post('/api/room/ticket', body))
      expect(guest.status).toBe(401)
      expect(await guest.json()).toEqual({ error: 'sign_in_required' })
    }
    const opened = await handleRoom(post('/api/room/ticket', { for: 'open' }, account('host')))
    expect(opened.status).toBe(200)
    expect(ticketClaims(KEY, (await opened.json()).ticket)).toEqual({ purpose: 'open', user: 'user:test_host' })
  })
  it('signs a join for the room\'s number once the service says the account may come in, or it is its own', async () => {
    for (const room of ['482917', '777777']) {
      const r = await handleRoom(post('/api/room/ticket', { for: 'join', room }, account('friend')))
      expect(r.status).toBe(200)
      expect(ticketClaims(KEY, (await r.json()).ticket)).toEqual({ purpose: 'join', user: 'user:test_friend', room })
    }
    const asked = upstream.mock.calls.map(([url]) => String(url)).filter((u) => u.includes('/rooms/482917'))
    expect(asked[0]).toContain('account=user%3Atest_friend')
  })
  it('says a full room is full, a number no room has is none, and an account in another room is there', async () => {
    const full = await handleRoom(post('/api/room/ticket', { for: 'join', room: '555555' }, account('friend')))
    expect([full.status, await full.json()]).toEqual([409, { error: 'room_full' }])
    const none = await handleRoom(post('/api/room/ticket', { for: 'join', room: '123456' }, account('friend')))
    expect([none.status, await none.json()]).toEqual([404, { error: 'room_not_found' }])
    const malformed = await handleRoom(post('/api/room/ticket', { for: 'join', room: '01234' }, account('friend')))
    expect([malformed.status, await malformed.json()]).toEqual([404, { error: 'room_not_found' }])
    const busy = await handleRoom(post('/api/room/ticket', { for: 'join', room: '482917' }, account('seated')))
    expect([busy.status, await busy.json()]).toEqual([409, { error: 'already_in_room', room: '777777' }])
  })
  it('lets an account enter ten wrong numbers a minute, then makes it wait', async () => {
    for (let i = 0; i < WRONG_LIMITS.count; i++) {
      expect((await handleRoom(post('/api/room/ticket', { for: 'join', room: String(100000 + i) }, account('guesser')))).status).toBe(404)
    }
    const stopped = await handleRoom(post('/api/room/ticket', { for: 'join', room: '482917' }, account('guesser')))
    expect([stopped.status, await stopped.json()]).toEqual([429, { error: 'too_many_tries' }])
    // Another account is not held up by it.
    expect((await handleRoom(post('/api/room/ticket', { for: 'join', room: '482917' }, account('other')))).status).toBe(200)
  })
  it('says not_ready while the service is not seating people', async () => {
    upstream.mockImplementation(async () => new Response('{}', { status: 503 }))
    const r = await handleRoom(post('/api/room/ticket', { for: 'open' }, account('host')))
    expect(r.status).toBe(503)
    expect(await r.json()).toEqual({ error: 'not_ready' })
  })
  it('refuses a request that does not say what it is for', async () => {
    expect((await handleRoom(post('/api/room/ticket', {}, account('host')))).status).toBe(400)
  })
  it('ignores a test account on the published site', async () => {
    expect((await handleRoom(post('/api/room/ticket', { for: 'open' }, account('host'), 'https://skatgo.com'))).status).toBe(401)
  })
})

describe('POST /api/room/mine', () => {
  it('says the room the account is in, or none', async () => {
    expect(await (await handleRoom(post('/api/room/mine', {}, account('seated')))).json()).toEqual({ room: '777777' })
    expect(await (await handleRoom(post('/api/room/mine', {}, account('host')))).json()).toEqual({ room: null })
    expect((await handleRoom(post('/api/room/mine', {}))).status).toBe(401)
  })
})

describe('POST /api/room/referral', () => {
  it('passes a new account and its room on to the service', async () => {
    const r = await handleRoom(post('/api/room/referral', { roomId: '482917' }, account('guest')))
    expect(r.status).toBe(200)
    const call = upstream.mock.calls.find(([url]) => String(url).endsWith('/rooms/referral'))!
    expect(JSON.parse(call[1].body)).toEqual({ account: 'user:test_guest', roomId: '482917' })
    expect(call[1].headers['x-admission-key']).toBe(KEY)
  })
  it('does not pass on an account older than an hour', async () => {
    const r = await handleRoom(post('/api/room/referral', { roomId: '482917' }, account('old', Date.now() - REFERRAL_MS - 60_000)))
    expect(await r.json()).toEqual({ recorded: false })
    expect(upstream.mock.calls.some(([url]) => String(url).endsWith('/rooms/referral'))).toBe(false)
  })
  it('needs an account and a room\'s number', async () => {
    expect((await handleRoom(post('/api/room/referral', { roomId: '482917' }))).status).toBe(401)
    expect((await handleRoom(post('/api/room/referral', { roomId: 'abc123' }, account('guest')))).status).toBe(400)
  })
})
