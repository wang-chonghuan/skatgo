// The advanced course in English (SKATGO-234, the human: 「新增一个进阶课程，或者高级课程之类的，用来放之前就规划的那个书上的专题」):
// one topic a lesson, for players who know the rules, after SKATGO-225's plan — the topics and their order follow two
// Skat books' advanced chapters, the text is SkatGo's own, written anew and plainer than the books, and every hand is
// SkatGo's own (the human: 「你要参考他的结构和主题点，顺序，然后要参考原文，重写，不是改写，你重写的要比原文更加深入浅出」).
// Same ids, cards and answers as advanced.de.ts; advanced.test.ts proves every answer with the rules engine and the
// solver. Terms as in content.en.ts.

import { cards } from '../cards'
import type { LessonGuide } from '../rules/types'
import type { Lesson } from './types'

export const ADVANCED_EN: Lesson[] = [
  {
    id: '101',
    title: 'Schneider',
    promise: 'Know when a Schneider is sure — to bid on it, announce it, or stop it.',
    learned: 'count to 90 and to 31, bid on a silent Schneider, announce a sure one, and smear your side out of one.',
    minutes: 4,
    steps: [
      {
        kind: 'teach',
        title: 'Ninety, not sixty-one',
        body: [
          'Every declarer plays for **61**. The second line is **90**: take 90 card points or more and the defenders are **Schneider** — they have 30 or fewer. The game climbs a whole level on the multiplier.',
          'The line cuts both ways. The defenders need **31** to be **schneiderfrei**, out of Schneider. And a declarer who ends on 30 or fewer loses with Schneider: the loss climbs a level too.',
        ],
        tip: '**Schwarz** is the step beyond: one side takes no trick at all. One more level.',
      },
      {
        kind: 'choice',
        prompt: 'You are the declarer. The defenders took these three tricks, and every other trick is yours. Is it Schneider?',
        rows: [
          { label: 'Their 1st trick', cards: cards('S:A 10 7') },
          { label: 'Their 2nd trick', cards: cards('H:K 9 8') },
          { label: 'Their 3rd trick', cards: cards('D:Q 8 7') },
        ],
        options: ['Yes — they have 28', 'No — they have 31', 'Only in a Hand game', 'Only if you announced it'],
        answer: 0,
        explain: '21 + 4 + 3 = **28** for the defenders: 30 or fewer, so Schneider, whether you announced it or not. One more point-heavy card in their tricks and they would have been out.',
        hint: 'Count only their three tricks: A 11, 10 10, K 4, D 3, the rest nothing.',
      },
      {
        kind: 'teach',
        title: 'What a Schneider is worth',
        body: [
          'A Schneider adds **1** to the multiplier. ♣ with 1 is 2 × 12 = 24; won with Schneider, 3 × 12 = **36**.',
          'Picked up the skat? The Schneider still counts — you just cannot promise it. Played **Hand**, you may **announce** Schneider before the first card: one level more again. Announce it and miss the 90, and the game is lost.',
        ],
      },
      {
        kind: 'choice',
        prompt: 'A ♥ game, Hand, with 2. You announce Schneider and finish with 95. What is the game worth?',
        options: ['40', '50', '60', '70'],
        answer: 2,
        explain: 'with 2 → 2, game 1, Hand 1, Schneider 1, announced 1: multiplier **6** × 10 = **60**.',
        hint: 'Add up the levels: matadors, the game itself, Hand, Schneider, and the announcement — then multiply by ♥ 10.',
      },
      {
        kind: 'teach',
        title: 'The silent Schneider',
        body: [
          'In the auction your hand is worth the most it is sure to score. If you will make a Schneider even after picking up the skat, your hand counts one level higher: the **silent Schneider**. Nobody hears it, but you may bid on it.',
          '♠ with 2 is 3 × 11 = **33**. Sure of Schneider, it is 4 × 11 = **44** — enough to keep the game against a 40.',
        ],
        tip: 'The price: bid on the silent Schneider and miss the 90, and you have **overbid** — lost, whatever your card points.',
      },
      {
        kind: 'choice',
        prompt: 'You bid 44 with a ♠ game with 2, counting on Schneider, pick up the skat — and finish with 87. What happens?',
        options: ['You win 33', 'You win 44', 'You lose 88: overbid', 'You lose 66'],
        answer: 2,
        explain: 'Without the Schneider the game is worth 3 × 11 = 33, below your 44: **overbid**. It is scored at the next multiple of 11 that reaches the bid, 44, and doubled: **−88**.',
        hint: 'Is 87 a Schneider? Then compare what the game is worth with what you bid.',
      },
      {
        kind: 'teach',
        title: 'Win first, Schneider second',
        body: [
          'First make the 61 safe, then play for the 90. An opening that only helps the Schneider can cost the whole game.',
          'Count as you go: the card points in the defenders\' tricks. Once they have 31, the Schneider is gone — play safe from there.',
        ],
      },
      {
        kind: 'play',
        prompt: 'A Grand, three tricks left, and you lead. You have 60 card points; the only trump still out is ♠B. Which card makes the 90 sure?',
        contract: { kind: 'grand' },
        hand: cards('C:J | H:A 10'),
        trick: [],
        best: cards('C:J'),
        whyNot: 'Not sure: a defender with no hearts takes your heart with ♠B, and the other throws an Ace into that trick — over 20 card points for them, and the Schneider is gone.',
        explain: 'Draw the last trump first. ♣B pulls out ♠B, and then nobody can take your ♥A or ♥10: all three tricks are yours, and the Schneider with them.',
      },
      {
        kind: 'teach',
        title: 'Announce only what is certain',
        body: [
          'Before you announce, count the tricks you might lose and the most the defenders can put into them. If they can never reach 31, the Schneider is sure — announce it.',
          'Below, a Grand Hand: all four Buben, so the defenders have no trump. Your clubs and spades take every trick they lead to. The ♥7 is your only loser.',
        ],
        rows: [{ label: 'Your Grand Hand', cards: cards('C:J | S:J | H:J | D:J | C:A 10 K | S:A 10 | H:7') }],
      },
      {
        kind: 'choice',
        prompt: 'With this Grand Hand, in any seat: do you announce Schneider?',
        rows: [{ label: 'Your Grand Hand', cards: cards('C:J | S:J | H:J | D:J | C:A 10 K | S:A 10 | H:7') }],
        options: ['Yes — they can take at most 22', 'No — a ten can be trumped', 'Only in forehand', 'No — a Grand cannot be announced'],
        answer: 0,
        explain: 'They take one trick at most, the one your ♥7 loses: the best they can put into it is two Aces, **22**. That stays under 31 — Schneider is certain. Schwarz is not: that trick is theirs.',
        hint: 'Which of your cards can lose a trick at all, and what is the most two defenders can put into that one trick?',
      },
      {
        kind: 'teach',
        title: 'Defending: get to 31',
        body: [
          'When a Schneider threatens, the defenders count too: **31** together and they are out. Put your full cards — Aces and tens — into your **partner\'s** tricks (**smearing**), and give the declarer your blanks.',
          'Once you have 31, the job is the 61 again. And one trick is always worth having: it saves you from Schwarz.',
        ],
      },
      {
        kind: 'play',
        prompt: 'You defend against a ♠ game, last to play. Your side has 9 card points. Your partner led ♥A; the declarer played ♥K. You have no hearts. Which card do you play?',
        contract: { kind: 'suit', trump: 'S' },
        hand: cards('C:10 7 | D:K 8'),
        trick: cards('H:A K'),
        trickBy: ['Partner', 'Declarer'],
        best: cards('C:10'),
        whyNot: 'Allowed, but your partner is taking this trick — put your fullest card into it. With that card your side stays under 31.',
        explain: '♣10 into your partner\'s trick: 9 + 11 + 4 + 10 = **34**. Your side is schneiderfrei.',
      },
    ],
  },
]

/** Each lesson's page in English: its address, the question-style title, the H1 and the description. */
export const ADVANCED_GUIDE_EN: Record<string, LessonGuide> = {
  '101': {
    slug: 'schneider-in-skat',
    question: 'Schneider in Skat: How to Win It, Announce It and Avoid It',
    h1: 'Schneider in Skat: win it, announce it, avoid it',
    description:
      'Schneider in Skat: what the 90 and the 31 are worth, when to bid on a silent Schneider, when to announce one in a Hand game, and how defenders get out.',
    rule: 'extras',
  },
}
