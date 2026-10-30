// The lessons' landing text in English (SKATGO-29): the question-style title, the H1 and the meta
// description (the intro below the lesson went in SKATGO-161). Same terms as content.en.ts; every fact is
// one the lesson itself teaches and the engine plays, and none belongs to a later lesson (concepts.ts).

import type { LessonGuide } from '../rules/types'

export const GUIDE_EN: Record<string, LessonGuide> = {
  '1': {
    slug: 'how-does-skat-work',
    question: 'How to Play Skat: the Skat Card Game Explained',
    h1: 'How to play Skat, the card game for three',
    description:
      'How to play Skat, the card game: three players, 32 cards, ten each and two in the skat. One declarer plays against two and needs 61 of 120 card points.',
    rule: 'dealing',
  },
  '2': {
    slug: 'what-are-skat-card-values',
    question: 'What Are the Card Values in Skat?',
    h1: 'Card values in Skat: which cards count',
    description:
      'Skat card points: Ace 11, ten 10, King 4, Dame (Queen) 3, Bube (Jack) 2, while 7, 8 and 9 score nothing. Why the 10 is worth more than the King.',
    rule: 'cards',
  },
  '3': {
    slug: 'what-is-trump-in-skat',
    question: 'What Is Trump in Skat? The Buben (Jacks) and Trump Order',
    h1: 'Trumps in Skat and the four Buben (Jacks)',
    description:
      'In Skat the four Buben (the Jacks) are always the highest trumps: ♣B, ♠B, ♥B, ♦B. Then come the A, 10, K, D, 9, 8, 7 of the trump suit, eleven trumps in a suit game.',
    rule: 'games',
  },
  '4': {
    slug: 'must-you-follow-suit-in-skat',
    question: 'Must You Follow Suit in Skat? Who Wins a Trick',
    h1: 'Following suit and winning tricks in Skat',
    description:
      'The Skat rule for following suit: play the suit that was led if you can, Buben count as trumps, and the highest trump or highest card of the led suit wins.',
    rule: 'games',
  },
  '5': {
    slug: 'what-are-grand-and-null',
    question: 'What Are Grand and Null in Skat?',
    h1: 'Grand and Null: the other two Skat games',
    description:
      'Besides the four suit games, Skat has Grand, where only the four Buben are trumps, and Null, where the declarer must not take a single trick. How each works.',
    rule: 'games',
  },
  '6': {
    slug: 'how-to-calculate-game-value',
    question: 'How to Calculate the Game Value in Skat',
    h1: 'How to work out what a Skat game is worth',
    description:
      'Skat game value is base value × multiplier. Learn the base values, how to count matadors "with" or "without" from the ♣B, and why game adds one.',
    rule: 'value',
  },
  '7': {
    slug: 'how-bidding-works',
    question: 'How Bidding Works in Skat',
    h1: 'How bidding works in Skat',
    description:
      'Skat bidding step by step: middlehand bids to forehand, rearhand challenges the survivor, the answer is yes or pass, and only real game values may be bid.',
    rule: 'bidding',
  },
  '8': {
    slug: 'how-to-use-the-skat',
    question: 'How to Use the Skat: Discarding and Hand Games',
    h1: 'The skat, discarding and Hand',
    description:
      'What the declarer does with the two skat cards: pick them up and discard two face down, or play Hand without looking. Which cards to discard, and why.',
    rule: 'extras',
  },
  '9': {
    slug: 'how-is-skat-scored',
    question: 'How Is Skat Scored? Schneider, Schwarz and Overbids',
    h1: 'Scoring a Skat game: Schneider, Schwarz and overbids',
    description:
      'How a Skat game is scored: a win adds the game value and a loss costs double. With Schneider, Schwarz, announcements in Hand games, Null values and overbids.',
    rule: 'scoring',
  },
  '10': {
    slug: 'how-to-play-skat-well',
    question: 'Skat Tips: Playing Well as Declarer and Defender',
    h1: 'Playing well: basics for declarer and defenders',
    description:
      "Skat strategy for beginners: as declarer, draw trumps before cashing your Aces; as a defender, load points onto your partner's tricks and don't lead trumps.",
    rule: 'games',
  },
  '11': {
    slug: 'ready-for-a-real-game',
    question: 'Ready for a Real Game? Play a Full Deal of Skat',
    h1: 'Graduation game: play a whole deal of Skat',
    description:
      'Put it all together in one complete game of Skat against two AI opponents: bidding, the skat, announcing, ten tricks and scoring, with hints on hand.',
    rule: 'scoring',
  },
}
