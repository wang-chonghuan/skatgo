// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

import { dailyProfile } from './daily-api'

// SKATGO-169: a signed-in page's requests carry its own session token; on an overwritten cookie alone the record of play
// failed for a player the page showed signed in.
function answered() {
  const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => new Response('{"deals":[],"notes":[]}', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('a request to the daily API', () => {
  it('carries the page’s session token', async () => {
    const fetchMock = answered()
    vi.stubGlobal('window', { Clerk: { session: { getToken: async () => 'tok' } } })
    await dailyProfile()
    expect(fetchMock.mock.calls[0][1].headers).toEqual({ 'content-type': 'application/json', authorization: 'Bearer tok' })
  })
  it('carries none for a guest, or when the token cannot be had, and still goes', async () => {
    const fetchMock = answered()
    vi.stubGlobal('window', { Clerk: { session: null } })
    await dailyProfile()
    vi.stubGlobal('window', { Clerk: { session: { getToken: async () => { throw new Error('down') } } } })
    await dailyProfile()
    for (const call of fetchMock.mock.calls) expect(call[1].headers).toEqual({ 'content-type': 'application/json' })
  })
})
