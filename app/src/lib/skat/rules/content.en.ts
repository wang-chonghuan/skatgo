// The rules page in English (SKATGO-29): the complete reference, section by section, written from the
// rules engine (cards.ts, game.ts, value.ts). Base values, Null values, the bidding ladder and card
// points are rendered from the engine by the `engine` blocks; only worked examples type numbers.

import type { RulesText } from './types'

export const RULES_EN: RulesText = {
  intro: [
    "These are the complete rules of Skat as SkatGo plays them: the International Skat Order (ISkO), the official rules of the German Skat Association (DSkV) and the International Skat Players Association (ISPA), for three players at one table. The tables of card points, base values, Null values and bids come straight from SkatGo's rules engine, so what you read here is exactly what happens when you play.",
    'Each section ends with a link to the lesson that teaches it hands-on. Popular house rules are covered at the end, together with which of them SkatGo uses.',
  ],
  sections: [
    {
      id: 'cards',
      anchor: 'cards-and-points',
      title: 'Cards and card points',
      blocks: [
        {
          kind: 'p',
          text: 'Skat is played with **32 cards**: the four suits clubs ♣, spades ♠, hearts ♥ and diamonds ♦, each with Ace, 10, King, Queen, Jack, 9, 8 and 7. That is an ordinary French-suited deck without the 2s to 6s. Some regions use a German-suited deck (acorns, leaves, hearts and bells, with Ober and Unter for Queen and Jack); the rules are the same.',
        },
        {
          kind: 'p',
          text: "The suits have a fixed order, highest first: **♣ ♠ ♥ ♦**. It ranks the four Jacks against each other and sets the suits' base values.",
        },
        { kind: 'p', text: 'Every card carries **card points**. Only five ranks score; the 9, 8 and 7 are blanks:' },
        { kind: 'engine', table: 'cardPoints' },
        {
          kind: 'p',
          text: 'Each suit holds 30 card points, so the deck holds **120**. Card points decide suit games and Grand; in Null they do not count. Note that the **10 ranks above the King**: a side suit runs A, 10, K, Q, 9, 8, 7, without the Jack, which is a trump.',
        },
      ],
      lesson: '2',
    },
    {
      id: 'dealing',
      anchor: 'dealing',
      title: 'Dealing',
      blocks: [
        {
          kind: 'p',
          text: "Skat is a game for three players. The player on the dealer's left is **forehand**, the next player clockwise is **middlehand**, and the dealer is **rearhand**. The deal passes one seat clockwise after every game. (When four sit at the table, the dealer sits the game out and the player on the dealer's right is rearhand.)",
        },
        {
          kind: 'p',
          text: 'Each player receives **ten cards**, and **two cards** go face down in the middle: the **skat**. At a real table the dealer shuffles, the player on the right cuts, and the cards go out clockwise from forehand: three each, two to the skat, four each, three each. SkatGo shuffles by computer and deals the shuffled deck ten to each seat and the last two to the skat, which comes to the same thing.',
        },
        {
          kind: 'p',
          text: 'Forehand leads to the first trick, whatever the game. After that, whoever wins a trick leads to the next.',
        },
      ],
      lesson: '1',
    },
    {
      id: 'bidding',
      anchor: 'bidding',
      title: 'Bidding',
      blocks: [
        {
          kind: 'p',
          text: 'Before play, the players **bid** (German: reizen) to decide who becomes declarer. A bid is a number meaning: the game I intend to play is worth at least this much. Only values a suit game, a Grand or a Null can actually have may be bid:',
        },
        { kind: 'engine', table: 'biddingLadder' },
        {
          kind: 'list',
          items: [
            '**Middlehand bids to forehand.** Middlehand names numbers up the ladder; forehand answers **"Yes"** to hold each one, or **"Pass"**. The duel ends when either passes.',
            '**Rearhand bids to the survivor**, carrying on from the last number said, until one of them passes.',
            '**The last player left becomes declarer** at the last number said, and must play a game worth at least that much.',
            '**If middlehand and rearhand both pass without naming a number,** forehand may still take the game at the lowest bid, or pass too.',
          ],
        },
        {
          kind: 'p',
          text: 'If all three pass, nobody plays: the hand is **passed in** and the next dealer deals again. That is what SkatGo does; some tables play Ramsch instead (see house rules).',
        },
        {
          kind: 'p',
          text: 'At a real table a bidder may skip numbers; in SkatGo each bid is the next number on the ladder.',
        },
      ],
      lesson: '7',
    },
    {
      id: 'games',
      anchor: 'game-types',
      title: 'Game types: suit games, Grand and Null',
      blocks: [
        {
          kind: 'p',
          text: '**Suit games.** One suit is trumps. The four Jacks are always the four highest trumps, in the order **♣J, ♠J, ♥J, ♦J**, followed by the Ace, 10, King, Queen, 9, 8 and 7 of the trump suit: **eleven trumps**. The other three suits keep seven cards each, ranked A, 10, K, Q, 9, 8, 7.',
        },
        {
          kind: 'p',
          text: '**Grand.** Only the four Jacks are trumps, in the same order; all four suits are side suits. Grand has the highest base value of all.',
        },
        {
          kind: 'p',
          text: '**Null.** No trumps, and card points do not count. The declarer wins by taking **no trick at all**; the first trick they take loses the game, which ends right there. Every suit keeps its natural order, **A, K, Q, J, 10, 9, 8, 7**, with the Jack between the Queen and the 10.',
        },
        {
          kind: 'p',
          text: '**Following suit.** The leader may play any card; the others must follow the suit led if they can. All trumps count as one suit, so a Jack follows trumps, never the suit printed on it (except in Null, where it is an ordinary card). A player who cannot follow may trump or throw off anything. There is no duty to win a trick or to trump. The highest trump takes the trick; with no trump in it, the highest card of the suit led wins.',
        },
        { kind: 'p', text: 'Each suit game and Grand has a **base value**, ranked by the suit order:' },
        { kind: 'engine', table: 'baseValues' },
        { kind: 'p', text: 'Null is not multiplied. It has four fixed values, depending on whether it is played Hand, Ouvert (face up), or both:' },
        { kind: 'engine', table: 'nullValues' },
      ],
      lesson: '5',
    },
    {
      id: 'extras',
      anchor: 'hand-schneider-schwarz-ouvert',
      title: 'Hand, Schneider, Schwarz and Ouvert',
      blocks: [
        {
          kind: 'p',
          text: '**The skat.** The declarer usually picks up the two skat cards, then puts any two cards away face down (German: drücken) before announcing the game. The discards take no part in play, but their card points count for the declarer.',
        },
        {
          kind: 'p',
          text: '**Hand.** A declarer who leaves the skat untouched plays **Hand** with the ten cards dealt. Hand adds one to the multiplier. The skat still belongs to the declarer: its card points count for them, and it counts for matadors.',
        },
        {
          kind: 'p',
          text: '**Schneider.** A side with **30 card points or fewer** is Schneider: one more on the multiplier, whether the declarer wins with 90 or more or is held to 30 or fewer.',
        },
        {
          kind: 'p',
          text: '**Schwarz.** A side that takes **no trick** is Schwarz: one more again, on top of the Schneider that comes with it, and it also counts both ways.',
        },
        {
          kind: 'p',
          text: '**Announcements.** Only in a Hand game may the declarer announce **Schneider** ("at least 90") or **Schwarz** ("every trick") before play. Each announcement adds one more on top of the result it promises, and announcing Schwarz includes Schneider. Miss it, even by one card point, and the game is lost. After picking up the skat, nothing can be announced.',
        },
        {
          kind: 'p',
          text: '**Ouvert.** The declarer plays with their cards face up. In a suit game or Grand, Ouvert is Hand only and includes announcing Schwarz, and it adds one more. Null Ouvert may be played with or without picking up the skat, at its own fixed values.',
        },
      ],
      lesson: '8',
    },
    {
      id: 'value',
      anchor: 'game-value',
      title: 'Game value and matadors',
      blocks: [
        { kind: 'p', text: 'For suit games and Grand, the game value is **base value × multiplier**. The multiplier adds up:' },
        {
          kind: 'list',
          items: [
            'the **matadors** (Spitzen), "with" or "without" so many;',
            '**1 for game**;',
            '**1 each** for Hand, Schneider, Schneider announced, Schwarz, Schwarz announced and Ouvert, where they apply.',
          ],
        },
        {
          kind: 'p',
          text: "**Counting matadors.** Line up the trumps from the top: ♣J, ♠J, ♥J, ♦J, then the trump suit from the Ace down (in Grand, only the Jacks). Holding the ♣J, count the trumps you hold in an unbroken run from it: you play **with** that many. Lacking it, count the trumps missing above your highest: you play **without** that many. Both are worth the same. Matadors are counted over the declarer's ten cards **plus the skat**, in Hand games too, where the true count only shows after play.",
        },
        {
          kind: 'example',
          title: 'Clubs, with 2',
          lines: ['The declarer holds ♣J and ♠J but not ♥J.', 'With 2, game 3.', 'Clubs 12 × 3 = **36**.'],
        },
        {
          kind: 'example',
          title: 'Grand Hand, without 3',
          lines: ['The highest Jack in hand and skat is the ♦J.', 'Without 3, game 4, Hand 5.', 'Grand 24 × 5 = **120**.'],
        },
        {
          kind: 'p',
          text: '**Overbid (überreizt).** After play the game value is checked against the bid. If it is lower, the game is lost whatever the card points, and it is scored at the **smallest multiple of the base value that reaches the bid**. It happens most often in Hand games, when a Jack in the skat changes the matadors.',
        },
        {
          kind: 'example',
          title: 'Overbid: Spades Hand',
          lines: [
            "Bid 44. The declarer's highest Jack is the ♥J: without 2, game 3, Hand 4, Spades 11 × 4 = 44.",
            'After play the skat holds the ♣J: with 1, game 2, Hand 3, 11 × 3 = 33. Less than 44.',
            'Lost, scored at 44, the smallest multiple of 11 that reaches the bid: −2 × 44 = **−88**.',
          ],
        },
      ],
      lesson: '6',
    },
    {
      id: 'scoring',
      anchor: 'scoring',
      title: 'Scoring and the score sheet',
      blocks: [
        {
          kind: 'p',
          text: '**Who wins.** In a suit game or Grand the declarer needs **61 or more card points**, from their tricks plus the skat; 60 each is a loss. In Null the declarer must take no trick. A missed announcement or an overbid loses regardless. The declarer makes the defenders Schneider with 90 or more and is Schneider with 30 or fewer; Schwarz means a side took no trick.',
        },
        { kind: 'p', text: "**The score sheet.** Only the declarer's line changes:" },
        {
          kind: 'list',
          items: ['game won: **+ the game value**;', 'game lost: **− 2 × the game value**;', 'the defenders score nothing that game.'],
        },
        {
          kind: 'p',
          text: "Each player keeps a **running total**, and after an agreed number of games the highest total wins. SkatGo's table keeps a running total for all three seats this way, and in free play your own results add up from game to game.",
        },
        {
          kind: 'example',
          title: 'A short score sheet',
          lines: [
            'Game 1: Anna plays Hearts with 1 (10 × 2 = 20) and wins. Anna +20.',
            'Game 2: Ben plays Grand with 1 (24 × 2 = 48) and loses. Ben −96.',
            'Game 3: Anna plays a plain Null (23) and wins. Anna 20 + 23 = 43.',
            'Totals: Anna 43, Ben −96, Clara 0.',
          ],
        },
        {
          kind: 'p',
          text: '**List scoring.** Clubs and leagues usually use the Seeger-Fabian system, which adds 50 for each game the declarer wins, subtracts 50 for each game lost, and gives the defenders a bonus when the declarer loses. SkatGo does not use Seeger-Fabian scoring: there are no +50 or −50 bonuses, only the game values above.',
        },
      ],
      lesson: '9',
    },
    {
      id: 'house',
      anchor: 'house-rules',
      title: 'House rules: Kontra, Ramsch and Bock',
      blocks: [
        { kind: 'p', text: 'Many tables add rules of their own. The three most common:' },
        {
          kind: 'p',
          text: '**Kontra and Re.** A defender who believes the declarer will lose says **Kontra**, and the game counts double. The declarer can answer **Re**, and it doubles again. How late each may be said differs from table to table.',
        },
        {
          kind: 'p',
          text: '**Ramsch.** When all three pass, the table plays a Ramsch instead of dealing again. Usually only the Jacks are trumps, everyone plays for themselves, and whoever takes the most card points loses. Scoring varies a lot.',
        },
        {
          kind: 'p',
          text: '**Bock.** After certain events, such as a game that ends 60 to 60, a lost game with Kontra, or a very high game, the table plays a round of **Bock** games (a Bockrunde), in which every game counts double.',
        },
        {
          kind: 'p',
          text: '**What SkatGo uses: none of them.** SkatGo plays the official rules only: no Kontra or Re, no Ramsch and no Bock. When all three players pass, the cards are simply dealt again.',
        },
      ],
      lesson: '9',
    },
  ],
}
