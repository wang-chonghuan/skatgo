import type { Locale } from '~/paraglide/runtime'

// What the course teaches, in order (SKATGO-161, the human: 「禁止在前序课里出现后序概念」): every concept,
// the lesson that introduces it, and the words it goes by in each language. lessons.test.ts reads every text
// of every lesson — its steps, its drills dealt many times over, its page's title and description — and holds
// each lesson to the concepts of its own and earlier lessons; each concept must also be named in its own
// lesson, so a pattern here cannot quietly stop matching anything.
//
// A pattern is case-sensitive unless it says otherwise; `ignore` removes everyday phrases that share a word
// with a concept before matching (the German "auf der Hand" is cards held, not the Hand game).

export type Concept = { id: string; lesson: number; words: Record<Locale, RegExp>; ignore?: Partial<Record<Locale, RegExp>> }

export const CONCEPTS: Concept[] = [
  { id: 'declarer and defenders', lesson: 1, words: { en: /\bdeclarer\b|\bdefenders?\b/, de: /Alleinspieler|Gegenspieler/ } },
  { id: 'trick', lesson: 1, words: { en: /\btricks?\b/, de: /\bStich/ } },
  { id: 'the skat', lesson: 1, words: { en: /\bskat\b/, de: /\bSkat\b/ } },
  { id: 'card points, 61 of 120', lesson: 1, words: { en: /\b61\b|\b120\b/, de: /\b61\b|\b120\b/ } },
  { id: 'dealing', lesson: 1, words: { en: /\bdeal(s|t|er|ing)?\b/, de: /\bgeben\b|\bgibst\b|\bGeber\b|gegeben/ } },

  { id: 'the value of each card', lesson: 2, words: { en: /\b(A|Ace) 11\b|\b11, 10, 4, 3, 2\b/, de: /\b(A|Ass) 11\b|\b11, 10, 4, 3, 2\b/ } },
  { id: 'blanks', lesson: 2, words: { en: /\bblanks?\b/, de: /Lusche/ } },

  { id: 'trumps', lesson: 3, words: { en: /\btrump/i, de: /trumpf|trümpf/i } },
  { id: 'side suits', lesson: 3, words: { en: /side[- ]suit/i, de: /Fehlfarbe|Fehlkarte/ } },
  { id: 'suit game', lesson: 3, words: { en: /suit game/i, de: /Farbspiel/ } },
  { id: 'the order in a suit', lesson: 3, words: { en: /A, 10, K, D, 9, 8, 7|A 10 K D 9 8 7/, de: /A, 10, K, D, 9, 8, 7|A 10 K D 9 8 7/ } },

  { id: 'the lead', lesson: 4, words: { en: /\blead(s|ing)?\b|\bled\b/i, de: /ausspiel|ausgespielt|spielt\b[^.]{0,40}\baus\b/i } },
  { id: 'following suit', lesson: 4, words: { en: /\bfollow(s|ed|ing)?\b/i, de: /bedien/i } },
  { id: 'throwing off', lesson: 4, words: { en: /throw(s|ing)? off/i, de: /abwerf|abgeworfen|wirf\b[^.]{0,40}\bab\b/i } },

  { id: 'Grand', lesson: 5, words: { en: /\bGrand\b/, de: /\bGrand\b/ } },
  { id: 'Null', lesson: 5, words: { en: /\bNull\b/, de: /\bNull/ } },

  { id: 'base value', lesson: 6, words: { en: /base value/i, de: /Grundwert/ } },
  { id: 'multiplier', lesson: 6, words: { en: /multiplier/i, de: /\bStufe|-fach\b/ } },
  { id: 'matadors', lesson: 6, words: { en: /matador|\b(with|without) \d\b/i, de: /Spitzen|\b(mit|ohne) \d\b/i } },
  { id: 'game value', lesson: 6, words: { en: /game value/i, de: /Spielwert/ } },

  { id: 'bidding', lesson: 7, words: { en: /\bbid(s|ding|der)?\b|outbid/i, de: /reiz/i } },
  { id: 'forehand, middlehand, rearhand', lesson: 7, words: { en: /forehand|middlehand|rearhand/i, de: /Vorhand|Mittelhand|Hinterhand/ } },
  { id: 'passing', lesson: 7, words: { en: /\bPass\b|\bpassed\b/, de: /\bPasse\b|gepasst/ } },

  { id: 'picking up the skat', lesson: 8, words: { en: /pick(ed|s)? up the skat|pick-up/i, de: /Skat auf|aufnehm|aufgenommen|Aufnehmen/ } },
  { id: 'putting cards away', lesson: 8, words: { en: /put\b[^.]{0,20}\baway|discard/i, de: /drück|gedrückt/i } },
  { id: 'a void suit', lesson: 8, words: { en: /\bvoid\b/i, de: /\bblank/i } },
  { id: 'Hand', lesson: 8, words: { en: /\bHand\b/, de: /Handspiel|\bHand\b/ }, ignore: { de: /auf der Hand/g } },

  { id: 'Schneider and Schwarz', lesson: 9, words: { en: /Schneider|Schwarz/, de: /Schneider|Schwarz/ } },
  { id: 'Ouvert', lesson: 9, words: { en: /ouvert/i, de: /ouvert/i } },
  { id: 'announcing', lesson: 9, words: { en: /announc/i, de: /angesagt|\bansag|Ansagen/i } },
  { id: 'overbid', lesson: 9, words: { en: /overbid/i, de: /überreiz/i } },

  { id: 'drawing trumps', lesson: 10, words: { en: /draw(s|ing)? trumps|drawing trumps/i, de: /Trumpf ziehen|Trümpfe ziehen|zieh\w*\b[^.]{0,40}Tr(u|ü)mpf/ } },
  { id: 'smearing', lesson: 10, words: { en: /smear/i, de: /schmier/i } },
  { id: 'counting trumps', lesson: 10, words: { en: /counting trumps/i, de: /Trümpfe zählen/ } },
]

/** The concepts `text` names in `locale`. */
export function conceptsIn(text: string, locale: Locale): Concept[] {
  return CONCEPTS.filter((c) => {
    const ignore = c.ignore?.[locale]
    return c.words[locale].test(ignore ? text.replace(ignore, ' ') : text)
  })
}
