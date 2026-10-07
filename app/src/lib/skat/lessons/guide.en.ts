// The lessons' landing text in English (SKATGO-29): the question-style title, H1, meta description and
// the 100–200 word intro a lesson page renders on the server above the interactive player. Same terms
// as content.en.ts; every fact is one the lesson itself teaches and the engine plays.

import type { LessonGuide } from '../rules/types'

export const GUIDE_EN: Record<string, LessonGuide> = {
  '1': {
    slug: 'how-does-skat-work',
    question: 'How to Play Skat: the Skat Card Game Explained',
    h1: 'How to play Skat, the card game for three',
    description:
      'How to play Skat, the card game: three players, 32 cards, ten each and two in the skat. One declarer plays against two and needs 61 of 120 card points.',
    intro: [
      "The Skat card game is Germany's national card game, a trick-taking game for three players. It uses a **32-card deck**: the four suits ♣ ♠ ♥ ♦, each with 7, 8, 9, 10, Jack, Queen, King and Ace. Everyone gets **ten cards**, and the last **two** go face down in the middle. Those two are the **skat**, which gives the game its name.",
      'Every deal is **one against two**. Bidding decides who plays alone: that player is the **declarer**, gets the skat and names the game. The other two become the **defenders** and team up for that one deal. Next deal, the sides are fought out again.',
      'Then come ten tricks. The cards in them carry **card points**, 120 in the whole deck, and the declarer needs **at least 61** to win. Sixty each is not enough: exactly half is a loss. This lesson walks you through it all, with a few quick questions to check it stuck.',
    ],
    rule: 'dealing',
  },
  '2': {
    slug: 'what-are-skat-card-values',
    question: 'What Are the Card Values in Skat?',
    h1: 'Card values in Skat: which cards count',
    description:
      'Skat card points explained: Ace 11, ten 10, King 4, Queen 3, Jack 2, while 7, 8 and 9 score nothing. Why the 10 outranks the King, and how 120 points add up.',
    intro: [
      "When you win a trick in Skat, you don't score the trick itself. You score the **card points** of the three cards in it. Only five kinds of card count: **Ace 11, ten 10, King 4, Queen 3, Jack 2**. The 7, 8 and 9 are worth nothing and are called blanks.",
      'Each suit holds 30 points, so the whole deck holds **120**, and the declarer needs 61 of them. That makes counting the real skill of the game: one trick with an Ace and a ten is worth more than three tricks full of blanks.',
      'One surprise for newcomers: the **10 ranks second**, right below the Ace and above the King, in points and in trick-taking power alike. A side suit runs A, 10, K, Q, 9, 8, 7 from high to low. Here you practise adding up tricks until you can do it at a glance.',
    ],
    rule: 'cards',
  },
  '3': {
    slug: 'what-is-trump-in-skat',
    question: 'What Is Trump in Skat? The Jacks and Trump Order',
    h1: 'Trumps in Skat and the four Jacks',
    description:
      'In Skat the four Jacks are always the highest trumps: ♣J, ♠J, ♥J, ♦J. Then come the A, 10, K, Q, 9, 8, 7 of the trump suit, eleven trumps in a suit game.',
    intro: [
      'When the declarer names a suit as **trumps**, every card of that suit beats every card of the other suits. A trump 7 takes a side-suit Ace. That is the whole privilege of trumps, and it decides most deals.',
      "Skat's most famous rule sits on top of that: **the four Jacks are always trumps, and they are the four highest**, whatever suit is chosen. Among themselves they rank ♣J, ♠J, ♥J, ♦J, and the ♣J is the highest card in the game. Below the Jacks come the Ace, 10, King, Queen, 9, 8 and 7 of the trump suit, so a suit game has **eleven trumps**.",
      'The catch: a Jack no longer belongs to the suit printed on it. In a hearts game the ♣J is not a club; it is a trump. In this lesson you pick out the trumps of a hand and put them in order until the ranking feels natural.',
    ],
    rule: 'games',
  },
  '4': {
    slug: 'must-you-follow-suit-in-skat',
    question: 'Must You Follow Suit in Skat? Who Wins a Trick',
    h1: 'Following suit and winning tricks in Skat',
    description:
      'The Skat rule for following suit: play the suit that was led if you can, Jacks count as trumps, and the highest trump or highest card of the led suit wins.',
    intro: [
      'Each trick starts with a **lead**. The suit of that first card is the suit of the trick, and the other two players follow clockwise. The rule is strict: **if you hold a card of the suit that was led, you must play one**. Which one is up to you, and there is no duty to play higher.',
      "Only when you have none of the led suit may you play anything: **trump** it to win, or **throw off** a card you don't need. Trumps count as one suit, so the Jacks follow trumps, never the suit printed on them. That is the most common beginner mistake, and this lesson tackles it head on.",
      'Who takes the trick? If anyone played a trump, the highest trump wins. If not, the highest card of the suit that was led wins; a card of another suit never does. The winner collects the three cards and leads to the next trick.',
    ],
    rule: 'games',
  },
  '5': {
    slug: 'what-are-grand-and-null',
    question: 'What Are Grand and Null in Skat?',
    h1: 'Grand and Null: the other two Skat games',
    description:
      'Besides the four suit games, Skat has Grand, where only the four Jacks are trumps, and Null, where the declarer must not take a single trick. How each works.',
    intro: [
      'The declarer is not limited to naming a suit. Skat has three kinds of game: **suit games**, where one suit is trumps, **Grand** and **Null**.',
      'In **Grand** only the four Jacks are trumps, ♣J ♠J ♥J ♦J. All four suits become side suits, each ranked A, 10, K, Q, 9, 8, 7. The declarer still needs 61 card points. Grand is the most valuable game, so it wants plenty of Jacks and Aces.',
      "**Null** turns everything upside down. There are no trumps, card points don't matter, and the declarer wins only by taking **no trick at all**: the first trick they take loses the game on the spot. The Jacks go back to their own suits, and the order becomes A, K, Q, J, 10, 9, 8, 7, so the 10 drops below the Jack. A hand full of 7s and 8s can make a lovely Null. Here you practise tricks in both games.",
    ],
    rule: 'games',
  },
  '6': {
    slug: 'how-to-calculate-game-value',
    question: 'How to Calculate the Game Value in Skat',
    h1: 'How to work out what a Skat game is worth',
    description:
      'Skat game value is base value × multiplier. Learn the base values, how to count matadors "with" or "without" from the ♣J, and how game and extras add up.',
    intro: [
      'Every Skat game has a **value**, and bidding is nothing but naming values, so this is the sum to know: **base value × multiplier**. The base value depends on the game: ♦ Diamonds 9, ♥ Hearts 10, ♠ Spades 11, ♣ Clubs 12, Grand 24. Null is different and has fixed values of its own.',
      "The multiplier starts with the **matadors**. Line up the trumps from the ♣J down. Hold the ♣J, and you are **with** as many trumps as you hold in an unbroken run; lack it, and you are **without** as many as you are missing from the top. Both count the same, and the skat counts as the declarer's cards.",
      'Then add **1 for game**, plus any extras such as Hand or Schneider. Holding ♣J ♠J but not ♥J in a hearts game: with 2, game 3, 10 × 3 = **30**. You practise counting until it is quick.',
    ],
    rule: 'value',
  },
  '7': {
    slug: 'how-bidding-works',
    question: 'How Bidding Works in Skat',
    h1: 'How bidding works in Skat',
    description:
      'Skat bidding step by step: middlehand bids to forehand, rearhand challenges the survivor, the answer is yes or pass, and only real game values may be bid.',
    intro: [
      'Bidding decides who becomes declarer. Each bid is a number that says: **the game I mean to play is worth at least this much**. So before you bid, work out what your hand is worth. That is your limit.',
      'It runs as two duels. The player on the dealer\'s left is **forehand**, the next one is **middlehand**, and the dealer is **rearhand**. First **middlehand bids to forehand**: middlehand names the numbers, forehand answers **"Yes"** or **"Pass"**. Then **rearhand bids to the survivor**. The last player left is the declarer, and their game must be worth at least the final bid.',
      'Only values a game can really have may be bid: 18, 20, 22, 23, 24, 27, 30 and on up. If nobody bids, not even forehand at 18, the cards are dealt again. In this lesson you follow real bidding and learn when to pass.',
    ],
    rule: 'bidding',
  },
  '8': {
    slug: 'how-to-use-the-skat',
    question: 'How to Use the Skat: Discarding and Hand Games',
    h1: 'The skat, discarding and Hand',
    description:
      'What the declarer does with the two skat cards: pick them up and discard two face down, or play Hand without looking. Which cards to discard, and why.',
    intro: [
      'Win the bidding and the two face-down skat cards are yours. Usually you **pick them up**, so you hold twelve cards, then **put any two away face down** before naming your game. The discarded cards take no part in play, but their card points count for you: points in the bank before the first trick.',
      'Which two? Three rules of thumb: bank points by putting away a lone 10 that an Ace could catch; make a suit **void** so you can trump it later; and never throw away trumps or Aces.',
      'If your hand is strong enough already, you can play **Hand**: leave the skat untouched and play the ten cards you were dealt, for one extra step on the multiplier. The skat still counts for you, including when matadors are counted. That is the risk: a Jack hidden there can change your game value after play.',
    ],
    rule: 'extras',
  },
  '9': {
    slug: 'how-is-skat-scored',
    question: 'How Is Skat Scored? Schneider, Schwarz and Overbids',
    h1: 'Scoring a Skat game: Schneider, Schwarz and overbids',
    description:
      'How a Skat game is scored: a win adds the game value and a loss costs double. With Schneider, Schwarz, announcements in Hand games, Null values and overbids.',
    intro: [
      'Once the last trick is played, the game is settled. If the declarer wins, the game value goes on their score as a plus. If they lose, **twice the game value** comes off. A loss costs double what a win brings, which is a good reason to bid with care.',
      'Big results raise the multiplier. **Schneider**: the losing side ends with 30 card points or fewer, +1. **Schwarz**: the losing side takes no trick at all, +1 more. It cuts both ways: a declarer held to 30 pays for the Schneider too. A declarer playing Hand may also **announce** Schneider or Schwarz, or go **Ouvert**, face up. Each adds one more, but a missed announcement loses the game.',
      'Then the **overbid**: if the game turns out worth less than the bid, it is lost whatever the card points, and scored at the smallest multiple of the base value that reaches the bid. In this lesson you settle finished games yourself.',
    ],
    rule: 'scoring',
  },
  '10': {
    slug: 'how-to-play-skat-well',
    question: 'How to Play Skat Well: Declarer and Defence Tips',
    h1: 'Playing well: basics for declarer and defenders',
    description:
      "Skat strategy for beginners: as declarer, draw trumps before cashing your Aces; as a defender, load points onto your partner's tricks and don't lead trumps.",
    intro: [
      "Knowing which cards are legal is only the start; this lesson is about **why** you play a card. The declarer's biggest fear is an Ace trumped by a small trump. So the usual plan is to **draw trumps** first: lead high trumps until the defenders have none left, then collect the side-suit Aces and 10s in safety. A suit game has eleven trumps, so counting them tells you how many are still out.",
      "The defenders add their card points together, so their key move is to **smear**: when your partner is winning the trick, put your fattest card on it; when the declarer is winning, throw your cheapest blank. Defenders usually **don't lead trumps**, because that does the declarer's work for them.",
      'And one habit for everyone: when you play last to a trick, win it with the smallest card that is just enough.',
    ],
    rule: 'games',
  },
  '11': {
    slug: 'ready-for-a-real-game',
    question: 'Ready for a Real Game? Play a Full Deal of Skat',
    h1: 'Graduation game: play a whole deal of Skat',
    description:
      'Put it all together in one complete game of Skat against two computer opponents: bidding, the skat, announcing, ten tricks and scoring, with hints on hand.',
    intro: [
      'Time to take a seat. This lesson is one **complete deal** against two computer opponents, from the first bid to the final score. You bid, and if you win the bidding you pick up the skat or play Hand, put two cards away and announce your game. Then come ten tricks, and the result is settled just as a real table would settle it.',
      'A short cheat sheet comes first: card points, the trump order, following suit, base values, how a game value is built and who bids to whom. During play you can ask for a **hint** whenever you are unsure; it names a card and says why.',
      'Win or lose, finishing the game completes the lesson. A lost game teaches you more than a won one, and after this you are ready for a real Skat table.',
    ],
    rule: 'scoring',
  },
}
