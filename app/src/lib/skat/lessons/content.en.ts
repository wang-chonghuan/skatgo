// The course in English — the same eleven lessons, cards and answers as content.de.ts (lessons.test.ts
// holds the two languages to that). Terms follow everyday English Skat usage — pagat.com and the
// English Wikipedia, the official ISPA wording where it is also the common one: declarer, defenders,
// forehand / middlehand / rearhand, trick, skat, matadors "with / without", card points. The German
// words every Skat table uses (Grand, Null, Hand, Schneider, Schwarz, Ouvert) stay German, and so do
// the Bube and the Dame, cited as on the tournament deck (♣B, ♠D); lesson 1 names their international
// letters J and Q once (SKATGO-76). Decisions and sources: .intentfold/tickets/SKATGO-1/terms.md.
//
// SKATGO-161: a lesson uses only what it and the lessons before it teach (concepts.ts, held by
// lessons.test.ts), opens with at most two teaching cards before the first question, and ends with its
// final challenge — its promise done on real cards.

import { cards } from '../cards'
import {
  countPointsDrill,
  dealDrill,
  gameValueDrill,
  legalDrill,
  matadorDrill,
  orderDrill,
  pickTrumpsDrill,
  settleDrill,
  settlePileDrill,
  sumDrill,
  trickWinnerDrill,
} from './drills'
import { gen, times } from './build'
import type { Lesson } from './types'

export const LESSONS_EN: Lesson[] = [
  {
    id: '1',
    title: 'Three players, 32 cards',
    promise: 'Know what Skat is about: who plays against whom, what for, and how you win.',
    learned: 'deal a Skat deck, and say who plays against whom and how the declarer wins.',
    minutes: 1,
    steps: [
      {
        kind: 'teach',
        title: '32 cards',
        body: [
          'Skat is a card game for three players, played with **32 cards**: four suits ♣ ♠ ♥ ♦, each with the eight cards **7, 8, 9, 10, B, D, K, A**.',
          '**B** is the **Bube**, the Jack (**J**) of an international deck, and **D** is the **Dame**, the Queen (**Q**). At a German table you hear Bube and Dame, so this course uses them too (plural: Buben, Damen).',
        ],
        rows: [{ label: 'All eight cards of one suit', cards: cards('H:7 8 9 10 J Q K A') }],
      },
      { kind: 'choice', prompt: 'How many cards are in a Skat deck?', options: ['52', '36', '32', '24'], answer: 2, explain: 'Four suits × eight cards (7 to A) = 32 cards.' },
      {
        kind: 'teach',
        title: 'One against two',
        body: [
          'In every deal one player goes it alone: the **declarer**. The other two team up for that deal as the **defenders**. Who goes it alone is settled afresh in every deal.',
          'A deal has ten **tricks**. In a trick everyone plays one card, and the player whose card wins takes all three.',
        ],
      },
      { kind: 'choice', prompt: 'How are the sides formed in a deal?', options: ['Everyone plays for themselves', '1 declarer against 2 defenders', '2 against 2, with one watching', 'Fixed partners'], answer: 1, explain: 'In every deal the declarer plays alone against the other two. Partners are never fixed — next deal it might be you going it alone.' },
      {
        kind: 'teach',
        title: 'What you play for',
        body: [
          'The cards carry **card points**, **120** in the whole deck. After the ten tricks the declarer adds up the points in the tricks they took.',
          'The declarer needs **61** — more than half. With 60 the defenders win.',
        ],
      },
      { kind: 'choice', prompt: 'All the card points in the deck add up to 120. How many does the declarer need to win?', options: ['60', '61', '90', '100'], answer: 1, explain: '61 — just over half. 60 : 60 is a loss for the declarer.', hint: 'Think "more than half" — is exactly half enough?' },
      {
        kind: 'teach',
        title: 'The deal: 10 + 10 + 10 + 2',
        body: [
          'Everyone gets **ten cards**, and **two** go face down in the middle: the **skat**, which gives the game its name. The skat belongs to the declarer.',
          'At a real table the cards go out in packets, clockwise from the dealer\'s left: **3 each, 2 into the skat, 4 each, 3 each**.',
        ],
        rows: [{ label: 'The skat', cards: cards('C:7 8'), faceDown: true }],
      },
      gen(dealDrill),
    ],
  },
  {
    id: '2',
    title: 'Card points: which cards count',
    promise: 'See at a glance how many points a trick is worth.',
    learned: 'count the points of a trick at a glance.',
    minutes: 1,
    steps: [
      {
        kind: 'teach',
        title: 'Only five kinds of card score',
        body: ['A trick brings you the **card points** of its three cards. Only five kinds of card score: **A 11 · 10 10 · K 4 · D 3 · B 2**. The 7, 8 and 9 score nothing; they are called **blanks**.'],
        rows: [{ cards: cards('S:A 10 K Q J 9 8 7'), captions: ['11', '10', '4', '3', '2', '0', '0', '0'] }],
        tip: 'Careful: the **10 is worth 10**, far more than the King\'s 4. Each suit holds 30 points, so the deck holds **120**.',
      },
      { kind: 'choice', prompt: 'Which of these cards is worth the most points?', options: ['K', 'D', '10', 'B'], answer: 2, explain: 'The 10 is worth 10 points, second only to the Ace\'s 11. The King is worth just 4.' },
      ...times(3, countPointsDrill),
      { kind: 'choice', prompt: 'What is the most a single trick can be worth?', options: ['22', '30', '32', '33'], answer: 3, explain: 'Three Aces: 11 + 11 + 11 = **33** points. Rare, but it happens.', hint: 'Which card is worth the most — and how many cards make a trick?' },
      ...times(2, sumDrill),
    ],
  },
  {
    id: '3',
    title: 'Trumps and the four Buben',
    promise: 'Recognise the trumps in a suit game, and which one beats which.',
    learned: 'pick out the trumps of a hand and say which card beats which.',
    minutes: 1,
    steps: [
      {
        kind: 'teach',
        title: 'Trumps beat everything',
        body: ['Before play the declarer chooses one suit as **trumps** — a **suit game**, such as a hearts game. Any trump beats any card of the other three suits, the **side suits**: a trump 7 takes an Ace.'],
      },
      { kind: 'choice', prompt: 'Hearts are trumps. Which card is higher?', options: ['♠A', '♥7'], answer: 1, explain: 'The ♥7 is a trump, and any trump beats any card of a side suit — even an Ace.' },
      {
        kind: 'teach',
        title: 'The four Buben: always on top',
        body: [
          "Skat's most famous rule: **the four Buben are always trumps, and they are the four highest**, whichever suit the declarer chooses.",
          'Among themselves they rank **♣B > ♠B > ♥B > ♦B**. The ♣B is the highest card in the game; Germans call it "der Alte" — "the old one".',
        ],
        rows: [{ label: 'Highest → lowest', cards: cards('C:J | S:J | H:J | D:J'), captions: ['1st', '2nd', '3rd', '4th'] }],
      },
      {
        kind: 'teach',
        title: 'Hearts as trumps: 11 trumps',
        body: ['In a hearts game there are **11 trumps**: the four Buben, then the hearts in the order of every suit, **A, 10, K, D, 9, 8, 7** — the 10 right below the Ace. Each side suit keeps its 7 cards in that order.'],
        rows: [{ cards: cards('C:J | S:J | H:J | D:J | H:A 10 K Q 9 8 7') }],
        tip: 'The ♥B ranks third because it is a Bube, not because it is a heart. And in a hearts game the ♣B is **not a club** — it is a trump.',
      },
      { kind: 'choice', prompt: 'How many trumps are there in a suit game?', options: ['8', '10', '11', '12'], answer: 2, explain: '4 Buben + the other 7 cards of the trump suit (A 10 K D 9 8 7) = **11**. Each of the three side suits keeps 7 cards.' },
      ...times(3, () => pickTrumpsDrill()),
      ...times(2, () => orderDrill()),
    ],
  },
  {
    id: '4',
    title: 'Following suit and winning tricks',
    promise: 'Know which cards you may play on your turn, and who takes the trick.',
    learned: 'play only the cards you are allowed to, and say who takes a trick.',
    minutes: 2,
    steps: [
      {
        kind: 'teach',
        title: 'If you have the suit, you must play it',
        body: [
          'The first card of a trick is the **lead**; its suit is the suit of the trick. The other two **follow**, clockwise, and **if you hold that suit, you must play it** — high or low, as you like.',
          'Here **Clubs are trumps**, and an opponent leads the ♥A. You hold hearts, so one of your two hearts it is:',
        ],
        rows: [
          { label: 'The lead', cards: cards('H:A') },
          { label: 'Your hand: ✓ may be played, ✗ may not', cards: cards('H:10 7 | S:K | D:9'), follow: { contract: { kind: 'suit', trump: 'C' }, lead: cards('H:A')[0] } },
          { label: 'With no hearts at all, any card may be played', cards: cards('C:8 | S:K | D:9'), captions: ['trump', 'throw off', 'throw off'] },
        ],
        tip: 'None of the led suit? Then play anything: a trump to win the trick (**trumping**), or a card you don\'t need (**throwing off**).',
      },
      {
        kind: 'teach',
        title: 'A Bube follows trumps, not its suit',
        body: [
          'The Buben are trumps, so a Bube does **not belong to the suit printed on it**. Here **Hearts are trumps**:',
          '**♣A led** → only the ♣7 may follow; the ♣B is a trump. **♥A led** → the ♣B or the ♥9.',
        ],
        rows: [
          { label: 'When the ♣A is led', cards: cards('C:J 7 | H:9 | D:K'), follow: { contract: { kind: 'suit', trump: 'H' }, lead: cards('C:A')[0] } },
          { label: 'When the ♥A is led', cards: cards('C:J 7 | H:9 | D:K'), follow: { contract: { kind: 'suit', trump: 'H' }, lead: cards('H:A')[0] } },
        ],
        tip: 'Before you follow, ask: "Which suit does the lead count as?"',
      },
      {
        kind: 'play',
        prompt: 'Game: **Hearts ♥**. An opponent leads ♣A. Which card do you play?',
        contract: { kind: 'suit', trump: 'H' },
        hand: cards('C:J 7 | H:9 | D:A K'),
        trick: cards('C:A'),
        trickBy: ['Opponent'],
        explain: 'Your only real club is ♣7, so that is the only card you may play. The ♣B is a trump, not a club.',
      },
      {
        kind: 'teach',
        title: 'Who takes the trick',
        body: [
          '**Someone played a trump** → the highest trump wins.',
          '**Nobody played a trump** → the highest card **of the suit that was led** wins. A card of another suit cannot win, however high it is.',
          'The winner takes the three cards (their points go to that side) and **leads to the next trick**.',
        ],
      },
      ...times(3, () => legalDrill()),
      ...times(3, () => trickWinnerDrill()),
      {
        kind: 'play',
        prompt: 'Game: **Spades ♠**, and you are the declarer. The two defenders have played ♣10 and ♣K; your turn. Which card do you play?',
        contract: { kind: 'suit', trump: 'S' },
        hand: cards('S:9 | H:A 7 | D:K'),
        trick: cards('C:10 K'),
        trickBy: ['Defender', 'Defender'],
        best: cards('S:9'),
        whyNot: 'That card is allowed (you have no clubs, so anything goes), but there are 14 points on the table and you hold a trump — trump the trick.',
        explain: 'You have no clubs, so you may trump. The little ♠9 takes the ♣10 and ♣K together: 14 points for you.',
      },
    ],
  },
  {
    id: '5',
    title: 'Grand and Null',
    promise: 'Play the two other kinds of game: Grand, where only the Buben are trumps, and Null, where you must not take a single trick.',
    learned: 'play Grand and Null, and know what beats what in each.',
    minutes: 2,
    steps: [
      {
        kind: 'teach',
        title: 'Three kinds of game',
        body: [
          'Besides the four **suit games** the declarer can choose two more:',
          '**Grand** — only the four Buben are trumps.',
          '**Null** — no trumps at all, and the declarer\'s aim is turned upside down: take no trick.',
        ],
      },
      {
        kind: 'teach',
        title: 'Grand: only the Buben rule',
        body: [
          'In Grand the only trumps are the four Buben **♣B ♠B ♥B ♦B**. All four suits are side suits, each ranked A, 10, K, D, 9, 8, 7.',
          'The declarer still needs 61. Grand suits a hand with many Buben and Aces.',
        ],
        rows: [{ label: 'All the trumps in Grand', cards: cards('C:J | S:J | H:J | D:J') }],
      },
      gen(() => pickTrumpsDrill({ kind: 'grand' })),
      ...times(2, () => trickWinnerDrill({ kind: 'grand' })),
      {
        kind: 'teach',
        title: 'Null: take nothing',
        body: [
          'In Null **the declarer loses the moment they take a trick**; only taking none at all wins. Card points mean nothing.',
          'There are **no trumps**: each Bube goes back to its own suit, and every suit ranks **A, K, D, B, 10, 9, 8, 7** — the 10 drops below the Bube.',
        ],
        rows: [{ label: 'One suit in Null, high to low', cards: cards('S:A K Q J 10 9 8 7') }],
        tip: 'A hand full of 7s, 8s and 9s? Don\'t sigh — it might be a beautiful Null.',
      },
      ...times(2, () => orderDrill({ kind: 'null' })),
      ...times(2, () => trickWinnerDrill({ kind: 'null' })),
      {
        kind: 'play',
        prompt: 'Game: **Null**, and you are the declarer. A defender leads ♣9. You hold three clubs — which is best?',
        contract: { kind: 'null' },
        hand: cards('C:Q 8 7 | H:7 8 | D:9'),
        trick: cards('C:9'),
        trickBy: ['Defender'],
        best: cards('C:8'),
        whyNot: 'Allowed, but not the best. The ♣D is higher than the ♣9 — you might win the trick and lose the game on the spot. The ♣7 is safe, but it wastes a chance to get rid of a higher card.',
        explain: 'Play **the highest card that is still below the table**: the ♣8 ducks this trick and keeps the ♣7 as your life-saver for later.',
      },
    ],
  },
  {
    id: '6',
    title: 'What a game is worth',
    promise: 'Work out the value of any hand.',
    learned: 'work out what a game is worth from your cards.',
    minutes: 2,
    steps: [
      {
        kind: 'teach',
        title: 'Game value = base value × multiplier',
        body: [
          'Every game has a **base value**: **♦ Diamonds 9 · ♥ Hearts 10 · ♠ Spades 11 · ♣ Clubs 12 · Grand 24**.',
          'What it is worth is the base value times a **multiplier**: the **matadors**, plus 1 for the **game**. A **Null** is never multiplied: it is worth **23**.',
        ],
      },
      {
        kind: 'teach',
        title: 'Matadors: count down from ♣B',
        body: [
          'Line up the trumps from high to low: ♣B, ♠B, ♥B, ♦B, then A, 10, K… of the trump suit.',
          '**You hold ♣B** → count how many trumps you hold **in an unbroken run** from it downwards: you are "**with** that many". ♣B ♠B but no ♥B = with 2.',
          "**You don't hold ♣B** → count how many trumps in a row you are **missing** from the top: you are \"**without** that many\". Missing ♣B ♠B, holding ♥B = without 2. Both count the same.",
        ],
        rows: [
          { label: 'With 2 (broken at ♥B)', cards: cards('C:J | S:J | D:J | H:A') },
          { label: 'Without 2 (holding starts at ♥B)', cards: cards('H:J | D:J | H:A 10') },
        ],
      },
      ...times(3, matadorDrill),
      {
        kind: 'teach',
        title: 'Putting it together',
        body: [
          'Hearts, holding ♣B ♠B but not ♥B: **with 2, game 3** → 10 × 3 = **30**.',
          'Clubs without a single Bube, your highest trump the ♣A: **without 4, game 5** → 12 × 5 = **60**.',
        ],
        tip: 'At the table you count it out loud just like this: "With 2, game 3, times 10: thirty."',
      },
      ...times(3, () => gameValueDrill()),
      { kind: 'choice', prompt: 'What is a Null worth?', options: ['18', '23', '24', 'It depends on the matadors'], answer: 1, explain: 'A Null has no matadors and no multiplier: it is always worth **23**.' },
      gen(() => gameValueDrill()),
    ],
  },
  {
    id: '7',
    title: 'Bidding',
    promise: 'Understand — and join in — the table talk that goes "18?" — "Yes." "20?" — "Pass."',
    learned: 'take part in the bidding: go up to your game\'s value, and pass above it.',
    minutes: 2,
    steps: [
      {
        kind: 'teach',
        title: 'What you are bidding',
        body: [
          'Who becomes declarer is decided by **bidding**. Each bid is a **number**, meaning: "the game I would play is worth at least this much." Whoever bids highest is declarer.',
          'So your limit is **your game\'s value**, worked out as in the last lesson. The lowest bid is **18** (Diamonds with or without 1: 9 × 2).',
        ],
      },
      {
        kind: 'teach',
        title: 'Only real values',
        body: [
          'You may only bid a number a game can really be worth:',
          '**18 · 20 · 22 · 23 · 24 · 27 · 30 · 33 …**',
          'They are the multiples of 9, 10, 11, 12 and 24, and the 23 of a Null.',
        ],
      },
      { kind: 'choice', prompt: 'After "18", what is the next number you may bid?', options: ['19', '20', '21', '24'], answer: 1, explain: '20 = Hearts 10 × 2. No game is worth 19 or 21, so nobody may bid them.' },
      { kind: 'choice', prompt: 'Which game does the 23 belong to?', options: ['Diamonds × 2.5', 'A Null', 'Grand', 'Clubs with 1'], answer: 1, explain: '23 is the value of a Null — just above 22, so a good Null hand can outbid the cheapest suit games.' },
      {
        kind: 'teach',
        title: 'Three seats, two duels',
        body: [
          '**Forehand** sits on the dealer\'s left, **middlehand** next, and the dealer is **rearhand**.',
          'First **middlehand bids to forehand**: middlehand names the numbers, forehand answers **"Yes"** or **"Pass"**. Then **rearhand bids to whoever is left**, the same way.',
          'The last one left is the declarer, and their game must be worth **at least the final bid**. If nobody bids at all, the cards are dealt again.',
        ],
      },
      { kind: 'choice', prompt: 'Who names the first number in the bidding?', options: ['Forehand', 'Middlehand', 'Rearhand', 'Whoever the dealer picks'], answer: 1, explain: 'Middlehand bids to forehand first, and forehand answers "Yes" or "Pass". Rearhand waits for the winner of that duel.' },
      gen(() => gameValueDrill()),
      {
        kind: 'bid',
        prompt: 'You are **forehand**, and Lina bids to you. What is your game worth? Answer each number she names.',
        hand: cards('C:J | H:A 10 9 8 7 | S:A 9 | C:K | D:8'),
        contract: { kind: 'suit', trump: 'H' },
        seat: 'forehand',
        limits: [24, 0],
        explain: 'Your game: Hearts with 1, game 2 → 10 × 2 = **20**. Yes to 18 and 20, Pass at 22 — Lina plays.',
      },
      {
        kind: 'teach',
        title: 'What is worth bidding?',
        body: [
          '**Suit game**: five trumps or more, Buben included, and an Ace or two.',
          '**Grand**: two or three Buben and two or three Aces.',
          '**Null**: only low cards in every suit.',
          'Nothing fits? Pass.',
        ],
      },
      {
        kind: 'bid',
        prompt: 'You are **middlehand**: first you bid to Noah, then Lina bids to you. Bid as far as your game is worth — and not a number further.',
        hand: cards('C:J | S:J | D:A 10 K 9 | H:A 8 | C:10 | S:7'),
        contract: { kind: 'suit', trump: 'D' },
        seat: 'middlehand',
        limits: [30, 20],
        explain: 'Your game: Diamonds with 2, game 3 → 9 × 3 = **27**. You stayed in up to 27 and passed at 30 — Lina plays.',
      },
    ],
  },
  {
    id: '8',
    title: 'The skat, discarding and Hand',
    promise: 'Once you are declarer, know how to make the most of the two skat cards.',
    learned: 'pick up the skat, put the right two cards away, and play Hand.',
    minutes: 2,
    steps: [
      {
        kind: 'teach',
        title: "The declarer's privilege",
        body: [
          'Won the bidding? **Pick up the skat**: you hold 12 cards. **Put any two away** face down, then name your game.',
          'The two you put away take no part in play, but their **card points count for you** — money in the bank before the first card is played.',
        ],
      },
      {
        kind: 'teach',
        title: 'Which two? Three rules of thumb',
        body: [
          '**Bank points**: a lone 10 with no Ace beside it is easily caught by an opponent\'s Ace. Put it away and its 10 points are safe.',
          '**Make a void**: put away every card of a short side suit. When an opponent leads it, you can trump it.',
          "**Keep trumps and Aces**: they are what win you tricks.",
        ],
      },
      {
        kind: 'pick',
        prompt: 'You will play **Hearts ♥** and hold these 12 cards. Tap the two you put away.',
        cards: cards('C:J | H:J A 10 K 9 | S:A 7 | C:10 | D:K 8 7'),
        correct: cards('C:10 | D:K'),
        explain: 'The lone ♣10 is banked — 10 points — and clubs are now void, so you can trump them. The ♦K adds 4.',
        hint: 'Which card is valuable but cannot be kept safe? And which suit is empty once it is put away?',
      },
      {
        kind: 'teach',
        title: 'Hand: not looking at the skat',
        body: [
          'Hand strong enough already? Play **Hand**: leave the skat where it is and play the ten cards you were dealt, for **+1** on the multiplier. A Null played Hand is worth **35**.',
          'The skat stays yours: its points count for you, and so do its cards when matadors are counted.',
        ],
      },
      ...times(2, () => gameValueDrill({ hand: true })),
      {
        kind: 'choice',
        prompt: 'Your highest trump is the ♥B (no ♣B, no ♠B), so you play Spades Hand "without 2": 11 × (2 + 1 + 1) = 44, and you bid 44. After play the skat is turned over — and it holds the **♣B**. What now?',
        options: ['Nothing changes: still 44', 'It becomes "with 1": 11 × 3 = 33, less than you bid', 'It becomes "with 3" — worth more', "The skat doesn't count, so it doesn't matter"],
        answer: 1,
        explain: 'The skat counts as yours: with the ♣B but not the ♠B you are only "with 1" — 11 × 3 = 33, less than your bid of 44. That is the risk of Hand.',
        hint: 'The ♣B is yours now. Counting down from ♣B, how many trumps in a row do you hold?',
      },
      { kind: 'choice', prompt: 'In a Hand game, who gets the points of the two unseen skat cards in the end?', options: ['The defenders', 'The declarer', 'Whoever wins the last trick', 'Nobody — they don\'t count'], answer: 1, explain: 'The skat always belongs to the declarer, looked at or not.' },
      {
        kind: 'pick',
        prompt: 'You will play **Spades ♠** and hold these 12 cards. Tap the two you put away.',
        cards: cards('C:J | H:J | S:A 10 9 7 | C:A K 9 8 | H:10 | D:7'),
        correct: cards('H:10 | D:7'),
        explain: '10 points banked, and hearts and diamonds are void: both can be trumped.',
        hint: 'A lone 10 with no Ace, and a lone low card: which two leave whole suits empty?',
      },
    ],
  },
  {
    id: '9',
    title: 'Extras and scoring',
    promise: 'Score a finished game yourself — big wins, heavy losses and overbids included.',
    learned: 'score a finished game yourself, Schneider and overbids included.',
    minutes: 2,
    steps: [
      {
        kind: 'teach',
        title: 'Schneider and Schwarz',
        body: [
          'Win big, and the multiplier grows:',
          '**Schneider**: the losing side has **30 card points or fewer** (so the winners have 90 or more). Multiplier **+1**.',
          '**Schwarz**: the losing side took **no trick at all**. Multiplier **+1 more**.',
          'It cuts both ways: a declarer held to 30 or fewer pays for the Schneider too.',
        ],
      },
      {
        kind: 'teach',
        title: 'Scoring',
        body: [
          '**Declarer wins**: + the game value. **Declarer loses**: − **2 ×** the game value. A loss costs twice what a win brings.',
          '**Overbid**: the game turns out worth less than the bid — lost, whatever the card points. It is scored at the smallest multiple of the base value that reaches the bid, and doubled.',
        ],
      },
      ...times(3, settleDrill),
      {
        kind: 'teach',
        title: 'Announcing: only in Hand',
        body: [
          'Playing Hand, the declarer may promise more before play, each **+1**: **Schneider**, **Schwarz**, or **Ouvert** — cards face up on the table.',
          'Miss a promise and the game is lost. A Null has two more values: **Null Ouvert 46 · Null Ouvert Hand 59**.',
        ],
      },
      { kind: 'choice', prompt: 'What is a Null Ouvert (skat picked up, played face up) worth?', options: ['23', '35', '46', '59'], answer: 2, explain: '23 (plain) → 35 (Hand) → **46 (Ouvert)** → 59 (Ouvert Hand).' },
      { kind: 'choice', prompt: 'The declarer ends with 89 card points. Is that Schneider?', options: ['Yes', 'No, it takes 90', 'Depends on whether the defenders took a trick', 'Only in a Hand game'], answer: 1, explain: 'The defenders must have 30 or fewer, which means the declarer needs 90. 89 : 31 — just short.' },
      ...times(2, settlePileDrill),
    ],
  },
  {
    id: '10',
    title: 'How to play: declarer and defence basics',
    promise: 'Stop just playing legal cards — know why you play each one.',
    learned: 'play with a plan: draw trumps as declarer, feed your partner as a defender.',
    minutes: 2,
    steps: [
      {
        kind: 'teach',
        title: "The declarer's plan: draw trumps, then collect",
        body: [
          "The declarer's fear: an Ace trumped by a small trump.",
          'So the declarer first **leads high trumps** until the defenders have none left — **drawing trumps**. Then the Aces and 10s are safe. There are 11 trumps: **counting trumps** tells you how many are still out.',
        ],
      },
      {
        kind: 'play',
        prompt: 'Game: **Hearts ♥**. You are the declarer and lead to the first trick. Which card?',
        contract: { kind: 'suit', trump: 'H' },
        hand: cards('C:J | S:J | H:A 10 9 | S:A 10 | C:7 | D:8 7'),
        trick: [],
        best: cards('C:J | S:J'),
        whyNot: 'Too early. The opponents still hold 6 trumps, and your Ace could easily be trumped by a small one. Draw trumps with your high Buben first.',
        explain: 'Nobody can beat the ♣B, so leading it wins for sure and pulls two of the opponents\' trumps. Then the ♠B, the ♥A… once the opponents are out of trumps, the ♠A and ♠10 are 21 free points.',
      },
      { kind: 'choice', prompt: 'Hearts game, you are the declarer with 6 trumps. 3 trumps have been played so far, 2 of them by the opponents. How many trumps do the opponents still have?', options: ['2', '3', '4', '5'], answer: 1, explain: 'There are 11 trumps. You hold 6, so the opponents started with 5; they have played 2, so **3** are left.', hint: '11 trumps − your 6 = how many did the opponents start with?' },
      {
        kind: 'teach',
        title: "The defenders' plan: feed your partner",
        body: [
          'The defenders\' points count together, so they **smear**: when your partner wins the trick, add your fattest card (A or 10); when the declarer wins it, throw your cheapest blank.',
          'And defenders **don\'t lead trumps** — that draws them for the declarer.',
        ],
      },
      {
        kind: 'play',
        prompt: 'Game: **Spades ♠**, and you are a defender. Your partner leads ♦A, the declarer follows with ♦7. Your turn — which card?',
        contract: { kind: 'suit', trump: 'S' },
        hand: cards('D:10 8 | H:K 9 | C:Q'),
        trick: cards('D:A 7'),
        trickBy: ['Partner', 'Declarer'],
        best: cards('D:10'),
        whyNot: "Allowed, but a missed chance. Your partner's ♦A has already won — this is the moment to add your fattest card.",
        explain: 'Smear! ♦A + ♦7 + ♦10 = 21 points, all for your side. With the ♦8 it would be just 11.',
      },
      {
        kind: 'play',
        prompt: 'Game: **Clubs ♣**, and you are a defender. The declarer leads ♣B, your partner follows with ♣9. You must follow with a trump — which one?',
        contract: { kind: 'suit', trump: 'C' },
        hand: cards('C:10 8 | D:A | H:7'),
        trick: cards('C:J 9'),
        trickBy: ['Declarer', 'Partner'],
        best: cards('C:8'),
        whyNot: 'The ♣B is the highest card in the game: the declarer has won this trick. The ♣10 would just hand over 10 points.',
        explain: "If you can't win, play low. Keep the ♣10 — it may still take a trick later.",
      },
      { kind: 'choice', prompt: 'What should a defender usually **not** lead?', options: ['A side-suit Ace', 'A trump', 'A small card of a short suit', "A suit your partner has shown"], answer: 1, explain: "Leading trumps draws them for the declarer. A defender's trumps are for trumping the declarer's Aces and 10s." },
      {
        kind: 'play',
        prompt: 'Game: **Hearts ♥**. You are the declarer and play last. The defenders have played ♠10 and ♠A, and you have no spades. Which card?',
        contract: { kind: 'suit', trump: 'H' },
        hand: cards('H:J 7 | D:K 9 | C:8'),
        trick: cards('S:10 A'),
        trickBy: ['Defender', 'Defender'],
        best: cards('H:7'),
        whyNot: "There are 21 points on the table — take them! And since you play last, nobody can beat you afterwards: your smallest trump is enough. Keep the big ones.",
        explain: 'When you play last, win with the smallest card that is "just enough". The ♥7 takes 21 points and the ♥B stays in your hand for later.',
      },
    ],
  },
  {
    id: '11',
    title: 'Graduation game: take a seat!',
    promise: 'Play a complete game against two AI opponents. After that, you can play Skat.',
    learned: 'play a whole game of Skat, from the first bid to the score.',
    minutes: 3,
    steps: [
      {
        kind: 'teach',
        title: 'Cheat sheet for the table',
        body: [
          '**Card points** A 11 · 10 10 · K 4 · D 3 · B 2 | declarer needs **61**',
          '**Trumps** ♣B ♠B ♥B ♦B, then the trump suit A 10 K D 9 8 7',
          '**Following** follow suit if you can; a Bube is a trump, not the suit printed on it',
          '**Base values** ♦9 ♥10 ♠11 ♣12 Grand 24 | Null 23/35/46/59',
          '**Game value** base value × (matadors + 1 + extras)',
          '**Bidding** middlehand → forehand, rearhand → the winner; bid only up to your own game value',
        ],
        tip: 'During the game you can tap "Hint" at any time: it tells you which card to play and why. Don\'t be afraid to lose — you learn more from a lost game than from a won one.',
      },
      {
        kind: 'game',
        title: 'Play a whole game',
        body: ['Bidding, the skat, announcing, ten tricks, scoring — the whole thing once through. Win or lose: when it is over, you have graduated.'],
      },
    ],
  },
]
