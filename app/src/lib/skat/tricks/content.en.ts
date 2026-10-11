// The Skat tricks in English (SKATGO-82): a faithful translation of the German article. Base values and
// card points come from the rules engine.

import { POINTS } from '../cards'
import { GRAND_BASE, SUIT_BASE } from '../value'
import type { TricksArticle } from './types'

const heartsWith2 = SUIT_BASE.H * 3

export const TRICKS_EN: TricksArticle = {
  metaTitle: 'Skat Tricks: 12 Tricks for Beginners and Advanced Players | SkatGo',
  metaDescription:
    '12 Skat tricks for bidding, playing alone and defending. Try every trick in the daily Skat tournament and compare yourself with the AI.',
  h1: 'Skat Tricks: 12 tricks that make you a better player right away',
  intro: [
    'Good cards alone do not win a game of Skat. What makes the difference are a few simple Skat tricks that experienced players use almost without thinking. Here are twelve of them – for bidding, for playing alone and for defending. Each trick is explained in a few lines: what you do and why it works.',
  ],
  blocks: [
    {
      kind: 'cta',
      text: '**Try it right away:** In the daily Skat tournament everyone plays the same cards. After each deal, SkatGo shows you in which trick the AI would have played differently.',
      button: 'To the daily tournament',
    },
    { kind: 'h2', title: 'Skat tricks for bidding' },
    {
      kind: 'trick',
      n: 1,
      title: 'Count your trumps before you bid',
      paragraphs: [
        'Trumps are the cards that beat all the others. In a suit game they are the four jacks and the seven cards of your trump suit – eleven in all.',
        'As a rule of thumb: **six trumps and an ace** are a good basis for a suit game. With **five trumps** you need at least one ace as well, and even then the game is no sure thing. **Four trumps** are usually not enough.',
      ],
    },
    {
      kind: 'trick',
      n: 2,
      title: 'Work out your bid before the bidding starts',
      paragraphs: [
        `How high you may bid depends on the game you want to play. Every suit has a base value: diamonds ♦ ${SUIT_BASE.D}, hearts ♥ ${SUIT_BASE.H}, spades ♠ ${SUIT_BASE.S}, clubs ♣ ${SUIT_BASE.C} and Grand ${GRAND_BASE}. Multiply that base value by your **matadors plus one**.`,
        `You count the matadors like this: if you hold the jack of clubs, count from the top how many trumps you have without a gap ("with 2"). If you do not hold the jack of clubs, count how many are missing from the top ("without 2"). Example: hearts with 2 is ${SUIT_BASE.H} × (2 + 1) = ${heartsWith2}.`,
        'Work this out before anyone says "18". Then you know when to pass, and you do not overbid.',
      ],
      link: { to: '/rules/bidding-table', label: 'Every bid value in the bidding table' },
    },
    {
      kind: 'trick',
      n: 3,
      title: 'Discard points and void a suit',
      paragraphs: [
        `Card points are what the cards are worth: ace ${POINTS.A}, ten ${POINTS['10']}, king ${POINTS.K}, queen ${POINTS.Q}, jack ${POINTS.J}. As the declarer you win with more than 60 card points.`,
        'If you pick up the skat, you then put two cards away – you **discard** them. These two cards count for you at the end. So discard cards worth a lot of points that you would probably lose in play, for example a ten with only one small card beside it.',
        'Even better: discard so that you have no cards left in one suit. When that suit is played later, you can take it with a trump.',
      ],
    },
    {
      kind: 'cta',
      text: '**How well do you discard?** In the daily tournament you see after every deal how the AI played the same cards.',
      button: 'Compare now',
    },
    { kind: 'h2', title: 'Skat tricks as the declarer' },
    {
      kind: 'trick',
      n: 4,
      title: 'Trumps first',
      paragraphs: [
        'If you are the declarer – the one who plays the game – and you lead, play trumps first.',
        'Many players would rather play their aces first to get them "to safety". That is dangerous: if an opponent has no cards left in that suit, they take your ace with a small trump. If you draw the trumps first, your aces are safe afterwards.',
      ],
    },
    {
      kind: 'trick',
      n: 5,
      title: 'Win first, then think about Schneider',
      paragraphs: [
        'Before the first card, make a small plan: how many tricks can you give away? Where can the opponents get their card points?',
        'Play for **61 card points** first – that wins the game. Schneider is only a bonus. Whoever goes for it too early sometimes loses the whole game.',
      ],
    },
    {
      kind: 'trick',
      n: 6,
      title: 'Keep count – at least of the trumps',
      paragraphs: [
        'In a suit game there are eleven trumps, in a Grand only the four jacks. If you count how many have already been played, you know when your aces are safe.',
        'Later you count the card points too. Close games are often decided in the last two or three tricks.',
      ],
    },
    { kind: 'h2', title: 'Skat tricks for defending' },
    {
      kind: 'trick',
      n: 7,
      title: 'Short to a friend, long to a foe',
      paragraphs: [
        'This is the best-known Skat saying about leading. The defenders are the two players who play together against the declarer.',
        'If your partner sits directly after you, do not lead a suit of which you have many cards but no ace. If your partner has none of that suit, they must trump it or leave the trick to the declarer. Lead a short suit instead.',
        'If the declarer sits directly after you, a long suit is often good: the declarer has to decide before your partner plays.',
      ],
    },
    {
      kind: 'trick',
      n: 8,
      title: 'Against a Grand: play your aces at once',
      paragraphs: [
        'In a Grand only the four jacks are trumps. If you lead and you have an ace, play it straight away.',
        'Then one of three things happens: you take the trick. Or the declarer has to use one of their few jacks. Or the declarer throws off another card – then they have none of that suit and probably few trumps. Only be careful with a **bare ace**, an ace with no other card of its suit.',
      ],
    },
    {
      kind: 'trick',
      n: 9,
      title: "Return your partner's suit",
      paragraphs: [
        'If your partner has led a suit, they usually have a reason. Play that suit back as soon as it is your turn to lead.',
        'If you switch suits for no reason, you confuse your partner: they can no longer tell who holds which cards.',
      ],
    },
    {
      kind: 'trick',
      n: 10,
      title: 'Ace and ten are gone? Then switch suits',
      paragraphs: [
        'Once the ace and the ten of a suit have been played, it is usually no longer worth playing that suit. The declarer often trumps it cheaply or gets rid of a bad card. Pick another suit instead.',
      ],
    },
    {
      kind: 'trick',
      n: 11,
      title: 'Give your partner points – and take your own tricks',
      paragraphs: [
        'If a trick is sure to go to your partner, add a ten or an ace. In Skat this is called **schmieren**: it puts the card points on your side.',
        'And the other way round: if you can take a trick yourself, take it. Saving trumps "for later" often goes wrong.',
      ],
    },
    { kind: 'h2', title: 'The most important Skat trick' },
    {
      kind: 'trick',
      n: 12,
      title: 'Do not dwell on mistakes – learn from them afterwards',
      paragraphs: [
        'During the game, brooding over your last mistake only costs concentration. Play on and look at the game calmly afterwards.',
        'That is exactly what the play record in the daily tournament is for: after each deal you see trick by trick which card the AI would have played in your place. The trick with the biggest difference is marked.',
      ],
    },
    {
      kind: 'cta',
      text: '**Try the 12 Skat tricks in the daily tournament** – the same cards for everyone, a comparison with the AI after every deal.',
      button: 'Play now',
    },
  ],
  further: {
    title: 'Read on',
    links: [
      { to: '/rules', label: 'Skat rules' },
      { to: '/rules/bidding-table', label: 'Bidding table' },
      { to: '/course', label: 'Skat course' },
    ],
  },
}
