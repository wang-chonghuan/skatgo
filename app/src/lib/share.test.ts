import { describe, expect, it } from 'vitest'

import { platformLinks, shareText, shareUrl } from './share'

// SKATGO-131/132: the shared line says the day, the score and the challenge — nothing of the deal itself,
// so it spoils nothing for whoever has yet to play it; each platform's link carries it and the shared page's address,
// which names the platform it went out through.

describe('the shared result', () => {
  it('names the day, the score and the challenge, in the page language', () => {
    expect(shareText('de', { day: '2026-10-25', score: 96 })).toBe('SkatGo · 25. Okt. · 1 Spiel heute +96 · Gleiche Karten – wie viele Punkte holst du?')
    expect(shareText('en', { day: '2026-10-25', score: -50 })).toBe('SkatGo · Oct 25 · 1 deal today −50 · Same cards – what will you score?')
  })
  it('carries no card and no contract', () => {
    const text = shareText('en', { day: '2026-10-25', score: 120 })
    expect(text).not.toMatch(/[♣♠♥♦]|Grand|Null|Hearts|Spades|Clubs|Diamonds|Kreuz|Pik|Herz|Karo|AI|KI|Platz|#\d/)
  })
  it('links each platform to the shared page, saying which platform', () => {
    expect(shareUrl('de', 'abc12345', 'x')).toBe('https://skatgo.com/de/d/abc12345?via=x')
    const links = platformLinks('en', 'abc12345', 'Hi')
    expect(links.whatsapp).toBe('https://wa.me/?text=Hi%20https%3A%2F%2Fskatgo.com%2Fen%2Fd%2Fabc12345%3Fvia%3Dwhatsapp')
    expect(links.facebook).toBe('https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fskatgo.com%2Fen%2Fd%2Fabc12345%3Fvia%3Dfacebook')
    expect(links.telegram).toBe('https://t.me/share/url?url=https%3A%2F%2Fskatgo.com%2Fen%2Fd%2Fabc12345%3Fvia%3Dtelegram&text=Hi')
    expect(links.x).toBe('https://x.com/intent/tweet?text=Hi&url=https%3A%2F%2Fskatgo.com%2Fen%2Fd%2Fabc12345%3Fvia%3Dx')
  })
})
