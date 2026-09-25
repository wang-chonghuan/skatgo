import { describe, expect, it } from 'vitest'

import { CONVERSATION_STORAGE_KEY, GUEST, STORED_MESSAGES_MAX, historyForRequest, loadConversation, saveConversation } from './conversation'

const memory = () => {
  const data = new Map<string, string>()
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k), data }
}

describe('the tab conversation (SKATGO-14)', () => {
  it('comes back for its owner and is discarded for anyone else', () => {
    const s = memory()
    saveConversation(s, GUEST, [{ role: 'user', text: 'q' }, { role: 'ai', text: 'a' }])
    expect(loadConversation(s, GUEST)).toEqual([{ role: 'user', text: 'q' }, { role: 'ai', text: 'a' }])
    expect(loadConversation(s, 'user_1')).toEqual([])
    expect(s.data.has(CONVERSATION_STORAGE_KEY)).toBe(false)
  })

  it('keeps the latest messages only, and survives broken or missing storage', () => {
    const s = memory()
    saveConversation(s, GUEST, Array.from({ length: STORED_MESSAGES_MAX + 5 }, (_, i) => ({ role: 'user' as const, text: String(i) })))
    const back = loadConversation(s, GUEST)
    expect(back).toHaveLength(STORED_MESSAGES_MAX)
    expect(back[0].text).toBe('5')
    s.setItem(CONVERSATION_STORAGE_KEY, '{not json')
    expect(loadConversation(s, GUEST)).toEqual([])
    expect(loadConversation(null, GUEST)).toEqual([])
  })

  it('sends the last turns, with long answers trimmed to the question limit', () => {
    const long = 'x'.repeat(900)
    const history = historyForRequest(
      [{ role: 'user', text: 'old' }, { role: 'ai', text: long }, { role: 'user', text: ' ' }, { role: 'user', text: 'now' }],
      6,
      500,
    )
    expect(history).toEqual([{ role: 'user', text: 'old' }, { role: 'ai', text: 'x'.repeat(500) }, { role: 'user', text: 'now' }])
    expect(historyForRequest([{ role: 'user', text: 'a' }, { role: 'ai', text: 'b' }, { role: 'user', text: 'c' }], 2, 500).map((m) => m.text)).toEqual(['b', 'c'])
  })
})
