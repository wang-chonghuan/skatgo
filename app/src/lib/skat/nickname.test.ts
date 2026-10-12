import { describe, expect, it } from 'vitest'

import { RANDOM_NAMES, cleanNickname, pickName } from './nickname'

// The names a player gets without choosing one (SKATGO-90): good nicknames, all different, and a number
// only once every name without one is in use.

describe('random leaderboard names', () => {
  it('are good nicknames, each one different, two words with the adjective agreeing with the noun', () => {
    expect(RANDOM_NAMES.length).toBeGreaterThan(1600)
    expect(new Set(RANDOM_NAMES.map((n) => n.toLowerCase())).size).toBe(RANDOM_NAMES.length)
    for (const name of RANDOM_NAMES) {
      expect(cleanNickname(name), name).toBe(name)
      expect(name.split(' '), name).toHaveLength(2)
    }
    expect(RANDOM_NAMES).toContain('Flinker Fuchs')
    expect(RANDOM_NAMES).toContain('Flinke Eule')
    expect(RANDOM_NAMES).toContain('Flinkes Reh')
    expect(RANDOM_NAMES).toContain('Edle Eule')
  })
  it('a player keeps the same name; another player gets another while one without a number is free', () => {
    const taken = new Set<string>()
    const first = pickName('anon:abc', (n) => taken.has(n))
    expect(pickName('anon:abc', (n) => taken.has(n))).toBe(first)
    taken.add(first)
    const second = pickName('anon:abc', (n) => taken.has(n))
    expect(second).not.toBe(first)
    expect(second).toMatch(/^\S+ \S+$/)
  })
  it('gives a number only when every name without one is taken', () => {
    const all = new Set(RANDOM_NAMES)
    const name = pickName('user:x', (n) => all.has(n))
    expect(name).toMatch(/^\S+ \S+ \d{2}$/)
    expect(cleanNickname(name)).toBe(name)
  })
})
