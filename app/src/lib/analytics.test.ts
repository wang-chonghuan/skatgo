import { afterEach, describe, expect, it, vi } from 'vitest'

import { identify, track } from './analytics'

// The tracking plan's one way out (SKATGO-74). The node runner has no window, so a bare EventTarget
// stands in for one: enough to watch the `skatgo:track` announcement a local check relies on.

function fakeWindow(hostname: string) {
  const target = new EventTarget()
  const seen: { event: string; props: Record<string, unknown> }[] = []
  target.addEventListener('skatgo:track', (e) => seen.push((e as CustomEvent).detail))
  vi.stubGlobal('window', Object.assign(target, { location: { hostname, pathname: '/de/spielen', href: `http://${hostname}/de/spielen`, origin: `http://${hostname}` } }))
  return seen
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('track', () => {
  it('does nothing during server rendering', () => {
    expect(() => track('room_created')).not.toThrow()
  })

  it('announces the event with its properties, the language and the path', () => {
    const seen = fakeWindow('localhost')
    track('game_finished', { mode: 'free', won: true, score: 48, role: 'declarer', contract: 'clubs', bid: 18, sf: 98, ai_sf: null })
    expect(seen).toEqual([{ event: 'game_finished', props: { locale: expect.any(String), page: '/de/spielen', mode: 'free', won: true, score: 48, role: 'declarer', contract: 'clubs', bid: 18, sf: 98, ai_sf: null } }])
  })

  it('sends an event without properties as just the language and the path', () => {
    const seen = fakeWindow('localhost')
    track('daily_nickname_set')
    expect(seen).toHaveLength(1)
    expect(Object.keys(seen[0].props).sort()).toEqual(['locale', 'page'])
  })
})

// Who is signed in (SKATGO-152): a sign-in is announced once per browser, an account made within the hour counts as
// signed up, and a sign-out is noticed. Local storage is a Map standing in for the browser's.
describe('identify', () => {
  function storage() {
    const kept = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (k: string) => kept.get(k) ?? null, setItem: (k: string, v: string) => void kept.set(k, v), removeItem: (k: string) => void kept.delete(k) })
  }
  function announced() {
    const seen: unknown[] = []
    window.addEventListener('skatgo:identify', (e) => seen.push((e as CustomEvent).detail))
    return seen
  }

  it('announces a new account once and counts it as signed up', () => {
    const tracked = fakeWindow('localhost')
    storage()
    const seen = announced()
    const person = { id: 'user_1', createdAt: Date.now() - 60_000 }
    identify(person)
    identify(person)
    expect(seen).toEqual([person])
    expect(tracked.map((t) => t.event)).toEqual(['account_signed_up'])
  })

  it('does not count an older account as signed up', () => {
    const tracked = fakeWindow('localhost')
    storage()
    identify({ id: 'user_2', createdAt: Date.now() - 2 * 60 * 60 * 1000 })
    expect(tracked).toEqual([])
  })

  it('notices the sign-out, and says nothing for a guest who never signed in', () => {
    fakeWindow('localhost')
    storage()
    const seen = announced()
    identify(null)
    identify({ id: 'user_3', createdAt: null })
    identify(null)
    identify(null)
    expect(seen).toEqual([{ id: 'user_3', createdAt: null }, null])
  })
})
