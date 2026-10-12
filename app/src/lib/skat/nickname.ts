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

/**
 * The names a player gets on the leaderboard without choosing one (SKATGO-90): two German words, an
 * adjective and a noun, as mobile games give them — friendly, from animals and nature, nothing of cards
 * (the human: not a bot's name), every word picked so no pairing can offend. The adjective takes the
 * noun's gender: Flinker Fuchs, Flinke Eule, Flinkes Reh. The human agreed this list on 2026-10-12.
 */
const ADJECTIVES = [
  'Flink', 'Mutig', 'Klug', 'Schlau', 'Still', 'Leis', 'Munter', 'Heiter', 'Fröhlich', 'Froh', 'Kühn', 'Wach',
  'Emsig', 'Eifrig', 'Flott', 'Sanft', 'Gelassen', 'Geschickt', 'Glücklich', 'Tapfer', 'Frei', 'Treu',
  'Stolz', 'Zäh', 'Rasch', 'Edl', 'Hell', 'Bunt', 'Blau', 'Grün', 'Golden', 'Silbern', 'Nordisch', 'Sonnig',
  'Wendig',
]
/** Each noun with the ending its gender gives the adjective before it (-er, -e, -es). */
const NOUNS: [string, 'er' | 'e' | 'es'][] = [
  ...['Fuchs', 'Adler', 'Falke', 'Luchs', 'Biber', 'Otter', 'Dachs', 'Hase', 'Igel', 'Kranich', 'Specht', 'Bär',
    'Wolf', 'Uhu', 'Rabe', 'Delfin', 'Pinguin', 'Panda', 'Tiger', 'Hirsch', 'Elch', 'Kolibri', 'Komet', 'Sturm',
    'Mond', 'Stern', 'Gipfel'].map((n) => [n, 'er'] as [string, 'er']),
  ...['Eule', 'Lerche', 'Möwe', 'Meise', 'Amsel', 'Schwalbe', 'Libelle', 'Robbe', 'Katze', 'Biene', 'Hummel',
    'Gazelle', 'Welle', 'Wolke', 'Eiche', 'Birke', 'Tanne'].map((n) => [n, 'e'] as [string, 'e']),
  ...['Reh', 'Pony', 'Zebra', 'Lama', 'Polarlicht', 'Gewitter'].map((n) => [n, 'es'] as [string, 'es']),
]

/** Every name from the list that is a good nickname — a few pairs are longer than NICKNAME_MAX and left out. */
export const RANDOM_NAMES: readonly string[] = ADJECTIVES.flatMap((a) => NOUNS.map(([n, ending]) => `${a}${ending} ${n}`)).filter(
  (name) => cleanNickname(name) === name,
)

/** FNV-1a: a player's identifier as a number, the same on every platform. */
function hash(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0
  return h
}
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

/**
 * The name a player gets (SKATGO-90): the first of the list, in an order fixed by `seed` (the player's
 * identifier), that `taken` does not refuse — every name without a number comes before any with one, so
 * a number appears only once all of them are in use.
 */
export function pickName(seed: string, taken: (name: string) => boolean): string {
  const h = hash(seed)
  const size = RANDOM_NAMES.length
  let step = 7919 % size
  while (gcd(step, size) !== 1) step++
  for (let k = 0; k < size; k++) {
    const name = RANDOM_NAMES[(h + k * step) % size]
    if (!taken(name)) return name
  }
  for (let k = 0; ; k++) {
    const name = `${RANDOM_NAMES[(h + k) % size]} ${10 + ((h + k) % 90)}`
    if (cleanNickname(name) === name && !taken(name)) return name
  }
}
