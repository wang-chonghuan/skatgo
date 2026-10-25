import { describe, expect, it } from 'vitest'

import { shareText } from './share'

// SKATGO-131: the deal of the day's shared line says the day, the score and the AI's, and links back — nothing of
// the deal itself, so it spoils nothing for whoever has yet to play it.

describe('the shared result', () => {
  it('names the day, both scores and the way back, in the page language', () => {
    expect(shareText('de', { day: '2026-10-25', score: 96, ai: 72 })).toBe('SkatGo · 25. Okt. · 1 Spiel heute +96 (KI +72) ✅ skatgo.com/de/taeglich?ref=share')
    expect(shareText('en', { day: '2026-10-25', score: -50, ai: 40 })).toBe('SkatGo · Oct 25 · 1 deal today −50 (AI +40) skatgo.com/en/daily?ref=share')
  })
  it('carries no card and no contract', () => {
    const text = shareText('en', { day: '2026-10-25', score: 120, ai: null })
    expect(text).not.toMatch(/[♣♠♥♦]|Grand|Null|Hearts|Spades|Clubs|Diamonds|Kreuz|Pik|Herz|Karo/)
  })
})
