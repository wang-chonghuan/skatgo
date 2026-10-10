import { afterEach, describe, expect, it, vi } from 'vitest'

import { track } from './analytics'

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
    track('game_finished', { mode: 'free', won: true, score: 48 })
    expect(seen).toEqual([{ event: 'game_finished', props: { locale: expect.any(String), page: '/de/spielen', mode: 'free', won: true, score: 48 } }])
  })

  it('sends an event without properties as just the language and the path', () => {
    const seen = fakeWindow('localhost')
    track('daily_started')
    expect(seen).toHaveLength(1)
    expect(Object.keys(seen[0].props).sort()).toEqual(['locale', 'page'])
  })
})
