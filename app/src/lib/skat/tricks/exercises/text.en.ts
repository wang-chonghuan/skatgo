// The Skat puzzles in English (SKATGO-103). The answers live in positions.ts, computed there or checked by
// SkatZero; only the words are here. **bold** and suit symbols as in the lessons.

import { P_JACK_IN_SKAT, P_THREE_NIL, P_THREE_ONE, P_TWO_TWO } from './positions'
import { LADDER_EN } from './ladder-text'
import { OPEN_EN } from './open-text'
import type { ExercisesText } from './types'

/** A probability as the text says it, from the counted value. */
const pct = (p: number) => new Intl.NumberFormat('en', { style: 'percent' }).format(p)

const SURE = ['No – the game is safely won', 'Yes – it can still go wrong']
const RISK = ['Safe – however the cards lie', 'Risky – it depends on how they lie', 'Lost – however the cards lie']

export const EXERCISES_EN: ExercisesText = {
  types: {
    'offenes-endspiel': { title: 'Endgames with open cards', blurb: 'Every card is open, as in an Ouvert: play the end card by card – against the best defence.' },
    'sieg-sichern': { title: 'Lock in the win', blurb: 'Skat endgames like chess puzzles: one card wins for sure.' },
    reizen: { title: 'Bid or pass?', blurb: 'Work out your bid value and decide how far to go.' },
    druecken: { title: 'Putting away', blurb: 'Which two cards go into the skat?' },
    spielwahl: { title: 'Which game?', blurb: 'Suit game, Grand or Null – which gets the most from your cards?' },
    anspielen: { title: 'Leading as a defender', blurb: 'Which card do you open with against the declarer?' },
    schmieren: { title: 'Following and smearing', blurb: 'When to give your partner points – and which.' },
    mitzaehlen: { title: 'Counting', blurb: 'Keep track of trumps and card points.' },
    verlierbar: { title: 'Can I still lose?', blurb: 'Is your game safe already – or can it still turn?' },
    endspiel: { title: 'Endgames with open cards', blurb: 'All cards are open: find the one card that wins.' },
    'null-ouvert': { title: 'Cracking a Null ouvert', blurb: 'The declarer shows the cards. Find the gap.' },
    'null-risiko': { title: 'How safe is the Null?', blurb: 'Safe, risky or lost – judge your Null correctly.' },
    wahrscheinlichkeit: { title: 'Probabilities', blurb: 'How often is a Jack in the skat? How do the trumps split?' },
    ausspielen: { title: 'Leading as declarer', blurb: 'Your first card: draw trumps or play your aces?' },
  },
  exercises: {
    ...OPEN_EN,
    ...LADDER_EN,
    'reizen-1': {
      title: 'How high does Clubs go with two Jacks?',
      prompt: 'You want to play **Clubs**. What is the highest you may bid without overbidding?',
      explain:
        'You hold ♣J and ♠J but not ♥J: **with 2, game 3**. Clubs count 12, so 3 × 12 = **36**. If the ♥J is in the skat, your game is worth even more – but 36 is safe.',
    },
    'reizen-2': {
      title: 'Hearts without the Jack of Clubs',
      prompt: 'You want to play **Hearts**. What is the highest you may bid?',
      explain:
        'You are missing the ♣J but hold the ♠J: **without 1, game 2**. Hearts count 10, so 2 × 10 = **20**. If you find the ♣J in the skat you are "with 1" – also game 2. 20 is safe.',
    },
    'reizen-3': {
      title: 'Two aces, but only four trumps',
      prompt: 'Forehand has said 18. In Clubs you would be "without 1, game 2" – so 24 is possible. Do you say **20**, or pass?',
      options: ['Say 20', 'Pass'],
      explain:
        'The bid value is enough, the cards are not: in Clubs you have only **four trumps** (♠J ♣A ♣9 ♣7), and ♣J, ♥J and ♦J are with the opponents. Two aces change little. **Pass** – SkatZero would not even say 18 with these cards.',
    },
    'druecken-1': {
      title: 'Clubs without Jacks: what goes into the skat?',
      prompt: 'You play **Clubs**. Which two cards do you put away?',
      explain:
        'Put away **♠10 and ♠8**. The ten stands without its ace – in play the opponents would probably take it, in the skat its 10 card points are safe. And with no Spades left, you can trump Spades later.',
    },
    'druecken-2': {
      title: 'Grand: a lone King, a ten without its ace',
      prompt: 'You play **Grand**. Which two cards do you put away?',
      explain:
        'Put away **♣K and ♥10**. The ♣K stands alone and would be lost in play, and the ♥10 has no ace above it. In the skat 14 card points are safe – and you are void in Clubs.',
    },
    'druecken-3': {
      title: 'Spades: away with the weak suit',
      prompt: 'You play **Spades**. Which two cards do you put away?',
      explain:
        'Put away **♦10 and ♦Q**. Diamonds are your weakest suit: without the ace you would probably lose the ten. In the skat 13 card points are safe, and you are void in Diamonds – when they come, you trump.',
    },
    'spielwahl-1': {
      title: 'Two Jacks and four aces',
      prompt: 'You have taken the skat. Which game do you announce?',
      explain:
        'With two Jacks, **four aces** and two tens this is a **Grand**. In a Grand only the Jacks are trumps, and your aces and tens win the tricks. And a Grand counts 24 – more than twice Spades at 11.',
    },
    'spielwahl-2': {
      title: 'Long in Hearts',
      prompt: 'You have taken the skat. Which game do you announce?',
      explain:
        'Hearts are your long suit: ♣J, ♠J and four Hearts – **six trumps**, plus ♠A and ♦A. Exactly the rule of thumb of trick 1. In Spades you would have only five trumps, and for a Grand you lack the aces.',
    },
    'spielwahl-3': {
      title: 'Bid to 27 – and a Null?',
      prompt: 'You have taken the skat. The bidding went to 27. Which game do you announce?',
      explain:
        'Your cards are low, which calls for a Null. But a plain Null counts only 23 – at 27 you would be overbid. **Null ouvert** counts 46 and is enough. Put away ♣A and ♦A, the only cards that could win you a trick.',
    },
    'anspielen-1': {
      title: 'Against a Grand: the ace',
      prompt: 'You defend against a Grand Hand and lead. Which card do you play?',
      explain:
        'Against a Grand: **play your aces at once** – here the **♠A**. It has company (♠8), so it is not bare. Either it wins the trick, or the declarer must spend a Jack on it. Wait, and he may discard his Spades and trump your ace later.',
    },
    'anspielen-2': {
      title: 'Which ace first?',
      prompt: 'You defend against a Grand Hand and lead. Which card do you play?',
      explain:
        'Against a Grand you play your aces at once – first the one with company: the **♣A**, which has the ♣Q beside it. The ♥A is bare, and a bare ace calls for care.',
    },
    'anspielen-3': {
      title: 'Grand Hand: your ace of Hearts',
      prompt: 'You defend against a Grand Hand and lead. Which card do you play?',
      explain:
        'Aces at once: lead the **♥A**. It has company (♥Q, ♥8) and either takes 11 card points plus what the others add – or forces the declarer to use a Jack.',
    },
    'schmieren-1': {
      title: 'Partner trumps with a Jack',
      prompt: 'You play last. Which card do you add?',
      explain:
        'Your partner trumps with the ♠J, and nobody plays after you: the trick is his for sure. You have no trump – **smear the ♠10**. Keep it, and the declarer will probably take it later.',
    },
    'schmieren-2': {
      title: 'The King holds',
      prompt: 'You play last. Which card do you add?',
      explain:
        'The declarer went under your partner\'s ♠K with the ♠Q, and you play last: the trick is yours. You have no Spades and no trumps – **smear the ♦A**, 11 card points safe for your side. Later the declarer would probably trump it.',
    },
    'schmieren-3': {
      title: 'Grand: partner\'s ace wins',
      prompt: 'You play last. Which card do you add?',
      explain:
        'Your partner led the ♦A, the declarer followed low, and nobody plays after you: the trick is yours. You have no Diamonds – **smear the ♣10**. That is 10 card points that would otherwise probably go to the declarer.',
    },
    'ausspielen-1': {
      title: 'Grand: Jack or ace?',
      prompt: 'You play a Grand and lead. Which card do you play first?',
      explain:
        'Trumps first – in a Grand those are the Jacks. The **♣J** is the highest trump: it wins for sure and draws a Jack from the opponents. Play your aces first and an opponent trumps them as soon as he is out of the suit.',
    },
    'ausspielen-2': {
      title: 'Which Jack first?',
      prompt: 'You play a Grand and lead. Which card do you play first?',
      explain:
        'Trumps first – and the **♣J**, not the ♦J. The ♣J is the highest trump and wins for sure; with the ♦J you give the trick to a higher Jack of the opponents. Once the Jacks are out, ♥A and ♥10 come home.',
    },
    'ausspielen-3': {
      title: 'Clubs without the Jack of Clubs',
      prompt: 'You play Clubs and lead. Which card do you play first?',
      explain:
        'Trumps first: lead **a Jack**. An opponent holds the ♣J, but with ♠J, ♥J, ♦J, ♣10 and ♣K you draw the opponents\' trumps. Lead the ♥A first and someone may already trump it.',
    },
    'mitzaehlen-1': {
      title: 'How many trumps are still out?',
      prompt: 'After four tricks: how many trumps do the opponents still hold?',
      explain:
        'A Clubs game has eleven trumps: four Jacks and seven Clubs. Gone are ♣J ♣7 ♣Q, ♥J ♠J ♦J, ♣8 and ♣A ♣9 – nine. You still hold two (♣10 ♣K). 11 − 9 − 2 = **0**: the opponents have no trumps left, so your aces are safe now.',
    },
    'mitzaehlen-2': {
      title: 'How many card points do you have?',
      prompt: 'You have won all four tricks. How many card points do you have now – with the skat?',
      explain:
        'The tricks: 6 + 11 + 17 + 11 = 45 card points. Add the skat, which is yours: ♠K 4 and ♦8 0. Together **49** – 12 more to win.',
    },
    'mitzaehlen-3': {
      title: 'Is the way clear for the aces?',
      prompt: 'After two tricks: how many trumps do the opponents still hold?',
      explain:
        'A Hearts game has eleven trumps. Gone are ♣J ♠J ♦J and ♥J ♥9 ♥7 – six. You still hold ♥A ♥10 ♥K ♥8, four. 11 − 6 − 4 = **1**: the ♥Q is still out. Draw it with the ♥A, and the way is clear for ♠A and ♣A.',
    },
    'verlierbar-1': {
      title: 'Only one Jack left out',
      prompt: 'You need 18 more card points. Can you still lose the game?',
      options: SURE,
      explain:
        'Only one trump is out, the ♦J – lower than your ♥J. Lead the ♥J: whoever holds the ♦J must play it. After that nobody can trump, and ♥A and ♥10 come home: already 2 + 2 + 11 + 10 = 25. **Safely won.**',
    },
    'verlierbar-2': {
      title: 'Seven card points to go',
      prompt: 'You need only 7 more card points. Can you still lose the game?',
      options: SURE,
      explain:
        'The ♣J is still out, and it beats each of your Jacks. If one opponent holds ♣J, ♣9, ♣8 and ♦K and the other ♠9, ♠7, ♥K and ♥7, they take your Jacks and your ♣Q – and you cannot reach 7, even if you could see every card. **It can still go wrong.**',
    },
    'verlierbar-3': {
      title: 'Two high Jacks, two trumps out',
      prompt: 'You need 23 more card points. Can you still lose the game?',
      options: SURE,
      explain:
        'Two trumps are still out, ♥Q and ♥9. With ♣J and ♠J you draw them, however they lie. Then ♥10 and ♥K are the highest trumps: you win all four tricks – your own 18 card points and all 10 of the opponents\'. **Safely won.**',
    },
    'endspiel-1': {
      title: 'Grand: 37 card points to go',
      prompt: 'All cards are open. You need 37 more card points. Which card do you lead?',
      explain:
        'First the **♣J**: it draws both opponents\' Jacks (♥J and ♠J). Then ♥10 and ♥A are yours – without trumps the opponents cannot beat them and must add points: 6 + 20 + 11 = 37. Lead Hearts first and a Jack takes your ten.',
    },
    'endspiel-2': {
      title: 'Hearts: the opponents\' last trump',
      prompt: 'All cards are open. You need 38 more card points. Which card do you lead?',
      explain:
        'The opponents\' last trump is the ♥K on your right. Lead the **♥10**: he must play the King, and the trick is yours. Then ♠A and ♥8 win two more – exactly 38 in all. Lead the ♥8 first and the King takes the trick; then it is not enough.',
    },
    'endspiel-3': {
      title: 'Hearts: Jack before Ace',
      prompt: 'All cards are open. You need 25 more card points. Which card do you lead?',
      explain:
        'The opponents hold two trumps: ♥9 on the left and ♦J on the right – both lower than your ♥J. Lead the **♥J**: both must play their trump. Then your ♣A catches the ♣10: 4 + 21 = 25. Lead the ♣A at once and the right opponent trumps it with the ♦J.',
    },
    'null-ouvert-1': {
      title: 'The bare King',
      prompt: 'The declarer plays Null ouvert, all cards are open. You lead. Which card cracks the Null?',
      explain:
        'In Diamonds the declarer holds only the King. Lead the **♦8**: your partner has no Diamonds and discards, the declarer must play the ♦K – and wins the trick. The Null is lost.',
    },
    'null-ouvert-2': {
      title: 'Bring your partner in',
      prompt: 'The declarer plays Null ouvert, all cards are open. You lead. Which card cracks the Null?',
      explain:
        'You cannot catch the declarer alone – your partner can: he holds the ♥7, and the declarer has only the ♥10 in Hearts. Lead the **♣9**: your partner must play the ♣K and wins the trick. Then he leads the ♥7, and the declarer must go over it with the ♥10.',
    },
    'null-ouvert-3': {
      title: 'The Queen alone',
      prompt: 'The declarer plays Null ouvert, all cards are open. You lead. Which card cracks the Null?',
      explain:
        'In Clubs the declarer holds only the Queen. Lead the **♣7**: your partner plays the ♣J under it, and the declarer must go over with the ♣Q – the first trick.',
    },
    'null-risiko-1': {
      title: '7, 9, Jack',
      prompt: 'Null, five tricks to go, no trick taken so far. The opponents lead. How safe is your Null?',
      options: RISK,
      explain:
        'In Clubs each of your cards has a higher one of the opponents above it: on the ♣8 you play the 7, on the ♣10 the 9, on the ♣Q the Jack. Diamonds the same with 7 and 9. You have no Hearts, so you discard on them. **Safe – however the cards lie.**',
    },
    'null-risiko-2': {
      title: 'The eight of Hearts',
      prompt: 'Null, five tricks to go, no trick taken so far. The opponents lead. How safe is your Null?',
      options: RISK,
      explain:
        'The weak spot is the ♥8, because the ♥7 is still out. If one opponent leads the ♥7 and the other has no Hearts, you must go over with the 8. If the other has a Heart, he must play higher – and you are saved. **Risky: it depends on how the cards lie.**',
    },
    'null-risiko-3': {
      title: 'Bare King, Queen and Ace',
      prompt: 'Null, five tricks to go, no trick taken so far. The opponents lead. How safe is your Null?',
      options: RISK,
      explain:
        'Your ♠K is bare, and in Hearts you hold only Queen and Ace – every opponent\'s Heart is lower. The opponent who leads always has a Heart or a Spade, since Clubs alone are not enough for five cards. Whatever he leads, you must win it. **Lost – however the cards lie.**',
    },
    'wahrscheinlichkeit-1': {
      title: 'Is a Jack in the skat?',
      prompt: 'Before taking the skat: you are missing exactly two Jacks, ♣J and ♠J. How likely is at least one of them in the skat?',
      explain:
        `You do not know 22 cards, two of them are in the skat – 231 possible skats. In 190 of them neither Jack is there. That leaves 41 of 231: about **${pct(P_JACK_IN_SKAT)}**. So do not bid on the skat bringing you a Jack.`,
    },
    'wahrscheinlichkeit-2': {
      title: 'Four trumps: 2–2?',
      prompt: 'You have put away. The opponents hold four trumps between them, ten cards each. How likely is a 2–2 split exactly?',
      explain:
        `A 2–2 split comes up about **${pct(P_TWO_TWO)}** of the time. 3–1 is more common, about ${pct(P_THREE_ONE)}. So expect one opponent to hold three trumps – and draw them before you play your aces.`,
    },
    'wahrscheinlichkeit-3': {
      title: 'Three trumps with one opponent?',
      prompt: 'You have put away. The opponents hold three trumps between them, ten cards each. How likely is one of them to hold all three?',
      explain:
        `All three with one (3–0) happens about **${pct(P_THREE_NIL)}** of the time; otherwise they split 2–1 – ${pct(1 - P_THREE_NIL)}. So two rounds of trumps usually draw them.`,
    },
  },
}
