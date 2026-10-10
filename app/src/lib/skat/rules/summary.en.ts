// The printable short version of the rules in English (SKATGO-53): two A4 pages at most. Card points,
// base values, Null values and bids are rendered from the rules engine by the `engine` blocks.

import type { RulesSummary } from './types'

export const SUMMARY_EN: RulesSummary = [
  {
    title: 'Cards and card points',
    blocks: [
      { kind: 'p', text: 'Three players, **32 cards** (♣ ♠ ♥ ♦, each 7 to Ace). Everyone gets ten cards; two lie face down in the middle as the **skat**. The deck holds **120 card points**:' },
      { kind: 'engine', table: 'cardPoints' },
    ],
  },
  {
    title: 'Trumps and following suit',
    blocks: [
      {
        kind: 'list',
        items: [
          'The four **Buben** (B, the Jacks of an international deck) are always the highest trumps: ♣B, ♠B, ♥B, ♦B. In a suit game the trump suit follows with A, 10, K, D, 9, 8, 7 – eleven trumps. In Grand only the Buben are trumps.',
          'Side suits run A, 10, K, D, 9, 8, 7. Null has no trumps, and every suit runs A, K, D, B, 10, 9, 8, 7.',
          'You must **follow** the suit led; trumps count as one suit, so a Bube follows trumps. If you cannot follow, you may trump or throw off. The highest trump wins the trick, otherwise the highest card of the suit led.',
        ],
      },
    ],
  },
  {
    title: 'Bidding',
    blocks: [
      { kind: 'p', text: "Forehand sits on the dealer's left, then middlehand; the dealer is rearhand. **Middlehand bids to forehand** (\"yes\" or \"pass\"), then **rearhand bids to the winner**. Whoever is left is the declarer, and their game must reach the last bid. If all pass, the cards are dealt again. Only these values may be bid:" },
      { kind: 'engine', table: 'biddingLadder' },
    ],
  },
  {
    title: 'The skat: pick up and discard, or Hand',
    blocks: [
      { kind: 'p', text: 'The declarer **picks up the skat** and **discards** any two cards face down; their points count for the declarer. Or they play **Hand** and leave the skat untouched – one level more, and only then may they announce Schneider or Schwarz. A suit game or Grand Ouvert is Hand only too; Null Ouvert may also follow a pick-up. Then they name the game. Forehand leads.' },
    ],
  },
  {
    title: 'Games and game value',
    blocks: [
      { kind: 'p', text: "**Game value = base value × multiplier.** The multiplier is: matadors **with** or **without** so many (from ♣B down, counted over hand and skat) + 1 for **game** + 1 each for **Hand**, **Schneider**, **Schneider announced**, **Schwarz**, **Schwarz announced** and **Ouvert**. The base values:" },
      { kind: 'engine', table: 'baseValues' },
      { kind: 'p', text: '**Null** is not multiplied: the declarer must take no trick, at fixed values:' },
      { kind: 'engine', table: 'nullValues' },
    ],
  },
  {
    title: 'Winning and scoring',
    blocks: [
      {
        kind: 'list',
        items: [
          'The declarer needs **61 card points** (skat included); 60 each is a loss. **Schneider**: one side has 30 points or fewer. **Schwarz**: one side takes no trick.',
          'Won: **+ game value**. Lost: **− 2 × game value**. The defenders score nothing.',
          '**Overbid**: if the game is worth less than the bid, it is lost and scored at the lowest multiple of the base value that reaches the bid.',
        ],
      },
    ],
  },
]
