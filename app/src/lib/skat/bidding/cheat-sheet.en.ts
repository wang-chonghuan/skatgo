import type { CheatSheet } from './cheat-sheet'

export const CHEAT_SHEET_EN: CheatSheet = {
  title: 'Bidding cheat sheet',
  sections: [
    {
      heading: '1 · What can you play?',
      text: [
        'Count your trumps for each suit: the cards of that suit plus every Bube you hold. The suit with the most trumps is your game. Lots of Buben and Aces? Check Grand (4). Few trumps anywhere but low cards in every suit? Check Null (7).',
      ],
    },
    {
      heading: '2 · Is it strong enough?',
      list: [
        '**6 trumps and an Ace:** a good game.',
        '**5 trumps and an Ace:** the least you need. Without the Ace, pass.',
        '**4 trumps or fewer:** too few for a suit game.',
        '**2 Buben and 2 Aces:** always worth 18.',
      ],
    },
    {
      heading: '3 · Not sure? Count points',
      table: {
        head: ['', 'Points'],
        rows: [
          ['Each trump', '1'],
          ['Trump Ace, trump 10', '1 more each'],
          ['Each sure Bube trick', '1'],
          ['A side suit with the Ace', '1'],
          ['… with Ace and 10', '2'],
          ['… with Ace, 10 and King', '2½'],
          ['… with 10 and King', '1'],
          ['… with the 10 but no Ace or King', '½'],
          ['… with King, Dame and a small card', '½'],
          ['Sitting in forehand', '½'],
        ],
      },
      after: ['A Bube trick is sure when no higher Bube is against you: ♣B alone is 1, ♣B ♠B are 2, but ♠B ♥B only 1.'],
      afterList: [
        '**8½ or more:** bid to your limit — from 8½ you win about 7 times in 10.',
        '**7½–8:** say 18, go no higher.',
        '**Under 7½:** pass.',
      ],
    },
    {
      heading: '4 · Grand',
      text: ['Count 1 point for each Bube, each Ace, and forehand. With 5, think about Grand. With 6 or 7, play it.'],
    },
    {
      heading: '5 · How high can you bid?',
      text: ['Your limit is the game’s value: (with or without n, plus 1) × base.'],
      list: [
        '**With n:** you hold ♣B and the next cards in order (♣B ♠B ♥B ♦B, then A, 10 …).',
        '**Without n:** you are missing them.',
        '**Base:** ♦ 9 · ♥ 10 · ♠ 11 · ♣ 12 · Grand 24.',
        '**Counted before the skat:** a Bube in the skat can only shorten a “without” run — so a shaky “without” hand stops below its count. A “with” run can only grow.',
      ],
    },
    {
      heading: '6 · Your seat',
      text: ['Middlehand is the most dangerous seat. Never bid a weak hand there just to see what the others do.'],
    },
    {
      heading: '7 · Null',
      text: [
        'You must not win a single trick. In Null the 10 sits between 9 and Bube: 7 8 9 10 B D K A. You need a low card in every suit: a 7, or an 8 on its own. A 9 on its own, 8-9, or a King with just one low card are weak spots.',
        'The values are fixed, with no multiplier: Null 23 · Null Hand 35 · Null ouvert 46 · Null ouvert Hand 59.',
      ],
    },
  ],
}
