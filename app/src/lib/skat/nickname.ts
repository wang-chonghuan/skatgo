// What a player may call themselves on the daily tournament's leaderboard (SKATGO-36). The board is
// public, read without signing in, by learners from six to ninety-nine (product.md), so a nickname is
// a short name and nothing else: no address, no link, and none of the common obscenities and slurs.
// The multiplayer service, which stores the name, judges it with this; the page shows only whether it
// was taken — never which rule refused it, and never a matched word.

export const NICKNAME_MIN = 2
export const NICKNAME_MAX = 20

/**
 * Words a nickname may not contain as a whole word, German and English, written as they fold (lower
 * case, accents removed, ß as ss). Whole words only, so "Scunthorpe" or "Hellmut" stay possible; words
 * that are also names or plain words (Dick, Heil, Sieg — German "dick" is "fat") are left out.
 */
const BLOCKED = new Set([
  // English
  'fuck', 'fucker', 'fucking', 'motherfucker', 'shit', 'bullshit', 'cunt', 'cock', 'pussy',
  'bitch', 'bastard', 'asshole', 'arsehole', 'whore', 'slut', 'wanker', 'twat', 'prick', 'porn',
  'rape', 'rapist', 'nigger', 'nigga', 'faggot', 'fag', 'retard', 'spastic', 'kike', 'chink', 'tranny',
  'nazi', 'hitler',
  // German
  'scheisse', 'scheiss', 'arsch', 'arschloch', 'fotze', 'ficken', 'ficker', 'fick', 'wichser',
  'hure', 'nutte', 'schlampe', 'hurensohn', 'missgeburt', 'schwuchtel', 'kanake', 'neger', 'spast',
  'behindert', 'mongo', 'judensau', 'kinderficker', 'vergewaltiger', 'porno',
])

/** Lower case, accents off, ß as ss: the form both the list and a nickname are compared in. */
export function fold(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/ß/g, 'ss')
}

const graphemes = (s: string) => [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s)].length

/** Letters and numbers of any script, spaces, and - _ . ' — nothing else. */
const ALLOWED = /^[\p{L}\p{M}\p{N} ._'-]+$/u
/** A dot between a word and two or more letters reads as an address ("skatgo.com"). */
const LOOKS_LIKE_ADDRESS = /[\p{L}\p{N}]\.\p{L}{2,}/u

/** The nickname as it will be shown, or null when it may not be used. */
export function cleanNickname(raw: string): string | null {
  const name = raw.normalize('NFC').replace(/\s+/gu, ' ').trim()
  const n = graphemes(name)
  if (n < NICKNAME_MIN || n > NICKNAME_MAX) return null
  if (!ALLOWED.test(name) || LOOKS_LIKE_ADDRESS.test(name)) return null
  const words = fold(name).split(/[^\p{L}\p{N}]+/u).filter(Boolean)
  if (words.some((w) => BLOCKED.has(w))) return null
  return name
}
