import type { Endgame } from './endgame'
import { ENDGAMES } from './ladder'
import type { ExerciseText } from './types'

// The ladder's words (SKATGO-108, SKATGO-109). The title and the question are one template per language; the
// tip and the trap are written for each puzzle (the human: a template cannot say "let the Jack win"), and
// every claim in them is a fact the solver proved for that position — endgame.ts and the tests.

const GAME = {
  de: { C: 'Kreuz', S: 'Pik', H: 'Herz', D: 'Karo', G: 'Grand' },
  en: { C: 'Clubs', S: 'Spades', H: 'Hearts', D: 'Diamonds', G: 'Grand' },
} as const

type Written = { tip: string; trap: string }

const DE: Record<string, Written> = {
  'sieg-sichern-1': {
    tip: 'Buben sind keine draußen, und dein **♣A** ist die höchste Kreuzkarte: Es gewinnt sicher – 11 Augen, mehr als die 3, die dir fehlen.',
    trap: '♣D zuerst: ♣10 und ♣K sind höher.',
  },
  'sieg-sichern-2': {
    tip: 'Draußen ist nur noch ein Trumpf, der ♦B – dein ♣B ist höher. Spiel den **♣B**: Wer den ♦B hat, muss ihn zugeben. Danach sticht keiner mehr, und Herz hat keiner: Auch deine ♥7 gewinnt.',
    trap: '♥7 zuerst: Herz hat keiner, also sticht der ♦B sie.',
  },
  'sieg-sichern-3': {
    tip: 'Buben sind keine draußen, und dein **♣A** ist die höchste Kreuzkarte: Es gewinnt sicher – 11 Augen, mehr als die 8, die dir fehlen.',
    trap: '♣K zuerst: Die ♣10 ist höher.',
  },
  'sieg-sichern-4': {
    tip: 'Draußen ist nur noch ein Trumpf, die ♥10, und dein **♥A** ist höher. Spiel es zuerst: Links muss die ♥10 zugeben – danach hat keiner mehr Trumpf, und alle Stiche gehören dir.',
    trap: '♥K zuerst: Die ♥10 nimmt ihn.',
  },
  'sieg-sichern-5': {
    tip: 'Du brauchst alle vier Stiche. Draußen ist nur ein Trumpf, der ♠B – dein ♣B ist höher. Spiel den **♣B**: Wer den ♠B hat, muss ihn zugeben. Danach hat keiner mehr Trumpf, und deine drei Herz gewinnen.',
    trap: '♥A zuerst: Der ♠B ist höher und nimmt es.',
  },
  'sieg-sichern-6': {
    tip: 'Draußen ist nur noch ein Trumpf, die ♣7. Spiel das **♣A**: Wer die ♣7 hat, muss sie zugeben. Danach sticht keiner mehr dein ♦A – zusammen mindestens 22 Augen, mehr als die 19, die dir fehlen.',
    trap: '♦A zuerst: Wer kein Karo hat, sticht es mit der ♣7.',
  },
  'sieg-sichern-7': {
    tip: 'Draußen ist nur noch ein Trumpf, die ♥D, rechts – deine **♥10** ist höher. Spiel sie zuerst: Rechts muss die Dame zugeben, mindestens 13 Augen. Danach sticht keiner mehr dein ♣A: noch mal mindestens 11.',
    trap: '♣A zuerst: Wer kein Kreuz hat, sticht es mit der ♥D.',
  },
  'sieg-sichern-8': {
    tip: 'Draußen ist nur noch ein Trumpf, das ♣A – dein ♦B ist höher, denn jeder Bube schlägt das Ass. Spiel den **♦B**: Wer das ♣A hat, muss es zugeben. Danach sind ♣9 und ♣7 die einzigen Trümpfe, beide deine, und Herz hat keiner: Alle Stiche gehören dir.',
    trap: '♥K zuerst: Wer kein Herz hat, sticht ihn mit dem ♣A.',
  },
  'sieg-sichern-9': {
    tip: 'Draußen ist nur noch ein Trumpf, der ♦B, rechts – dein ♥B ist höher. Spiel den **♥B**: Rechts muss den ♦B zugeben. Danach sticht keiner mehr, und ♦10 und ♣A sind die höchsten Karten ihrer Farbe: 4 + 10 + 11 = 25 Augen, genau die 25, die dir fehlen.',
    trap: '♦10 zuerst: Hat Rechts kein Karo mehr, sticht der ♦B sie.',
  },
  'sieg-sichern-10': {
    tip: 'Draußen ist nur noch ein Trumpf, der ♦B – dein ♣B ist höher. Spiel den **♣B**: Wer den ♦B hat, muss ihn zugeben. Danach sticht keiner mehr, und ♠A, ♠10 und ♦D sind die höchsten Karten ihrer Farbe: Alle Stiche gehören dir.',
    trap: '♠10 zuerst: Wer kein Pik hat, sticht sie mit dem ♦B.',
  },
  'sieg-sichern-11': {
    tip: 'Draußen ist nur ein Trumpf, der ♥B, rechts – aber Rechts hat auch die ♣8, die letzte Kreuzkarte. Spiel die **♣10**: Rechts muss Kreuz bedienen und darf nicht stechen. Das sind 10 Augen, mehr als die 6, die dir fehlen.',
    trap: '♠A zuerst: Hat Rechts kein Pik mehr, sticht der ♥B das Ass.',
  },
  'sieg-sichern-12': {
    tip: 'Draußen ist nur ein Trumpf, der ♣B – höher als dein ♥K. Spiel das **♠A**: Entweder gewinnt es – 11 Augen, mehr als die 7, die dir fehlen –, oder der ♣B sticht es. Dann ist dein ♥K der höchste Trumpf.',
    trap: '♥K zuerst: Der ♣B nimmt ihn, und du machst keinen Stich mehr.',
  },
  'sieg-sichern-13': {
    tip: 'Draußen ist nur ein Trumpf, der ♣B, links – höher als dein ♦B. Spiel das **♥A**: Entweder gewinnt es – 11 Augen, mehr als die 4, die dir fehlen –, oder Links sticht es mit dem ♣B. Dann ist dein ♦B der höchste Trumpf.',
    trap: '♦B zuerst: Der ♣B nimmt ihn, und du machst keinen Stich mehr.',
  },
  'sieg-sichern-14': {
    tip: 'Draußen ist nur ein Trumpf, der ♣B – höher als deine ♦D. Spiel das **♥A**: Entweder gewinnt es – 11 Augen, mehr als die 7, die dir fehlen –, oder der ♣B sticht es. Dann ist deine ♦D der höchste Trumpf.',
    trap: '♦D zuerst: Der ♣B nimmt sie, und du machst keinen Stich mehr.',
  },
  'sieg-sichern-15': {
    tip: 'Draußen ist nur ein Trumpf, der ♦B, links – höher als deine ♣7. Spiel das **♥A**: Entweder gewinnt es – 11 Augen, mehr als die 10, die dir fehlen –, oder Links sticht es mit dem ♦B. Dann ist deine ♣7 der höchste Trumpf.',
    trap: '♣7 zuerst: Der ♦B nimmt sie, und du machst keinen Stich mehr.',
  },
  'sieg-sichern-16': {
    tip: 'Draußen ist nur ein Trumpf, die ♠10, rechts – höher als deine ♠7. Spiel das **♥A**: Entweder gewinnt es – 11 Augen, mehr als die 3, die dir fehlen –, oder Rechts sticht es mit der ♠10. Dann ist deine ♠7 der höchste Trumpf.',
    trap: '♠7 zuerst: Die ♠10 nimmt sie, und du machst keinen Stich mehr.',
  },
  'sieg-sichern-17': {
    tip: 'Draußen ist nur ein Trumpf, der ♠B, links – höher als deine ♣D. Spiel das **♠A**: Entweder gewinnt es – 11 Augen, mehr als die 10, die dir fehlen –, oder Links sticht es mit dem ♠B. Dann ist deine ♣D der höchste Trumpf.',
    trap: '♣D zuerst: Der ♠B nimmt sie, und du machst keinen Stich mehr.',
  },
  'sieg-sichern-18': {
    tip: 'Draußen ist nur ein Trumpf, der ♥B – höher als dein ♦B. Spiel das **♦A**: Entweder gewinnt es – 11 Augen, mehr als die 9, die dir fehlen –, oder der ♥B sticht es. Dann ist dein ♦B der höchste Trumpf.',
    trap: '♦B zuerst: Der ♥B nimmt ihn, und du machst keinen Stich mehr.',
  },
  'sieg-sichern-19': {
    tip: 'Draußen ist nur ein Trumpf, der ♠B, links – höher als dein ♥B. Spiel das **♠A**: Entweder gewinnt es, oder Links sticht es mit dem ♠B – dann ist dein ♥B der höchste Trumpf. So oder so kommen die 15 Augen, die dir fehlen.',
    trap: '♥B zuerst: Der ♠B nimmt ihn, und du machst keinen Stich mehr.',
  },
  'sieg-sichern-20': {
    tip: 'Draußen ist nur ein Trumpf, der ♠B, links – höher als dein ♥B. Spiel das **♣A**: Entweder gewinnt es, oder Links sticht es mit dem ♠B – dann ist dein ♥B der höchste Trumpf. So oder so kommen die 12 Augen, die dir fehlen.',
    trap: '♥B zuerst: Der ♠B nimmt ihn, und du machst keinen Stich mehr.',
  },
  'sieg-sichern-21': {
    tip: 'Draußen ist nur ein Trumpf, der ♦B, links – höher als dein ♥K. Spiel die **♠10**, die höchste Pikkarte: Entweder gewinnt sie, oder Links sticht sie mit dem ♦B – dann ist dein ♥K der höchste Trumpf. So oder so kommen die 17 Augen, die dir fehlen.',
    trap: '♥K zuerst: Der ♦B nimmt ihn, und du machst keinen Stich mehr.',
  },
  'sieg-sichern-22': {
    tip: 'Pik hat keiner mehr, und draußen ist nur ein Trumpf, der ♠B, rechts – höher als dein ♦B. Spiel die **♠7**: Entweder gewinnt sie, oder Rechts sticht sie mit dem ♠B – dann ist dein ♦B der höchste Trumpf. So oder so kommen die 7 Augen, die dir fehlen.',
    trap: '♦B zuerst: Der ♠B nimmt ihn, und du machst keinen Stich mehr.',
  },
  'sieg-sichern-23': {
    tip: 'Draußen ist nur ein Trumpf, der ♠B, links – höher als dein ♥B. Spiel die **♦10**, die höchste Karokarte: Entweder gewinnt sie, oder Links sticht sie mit dem ♠B – dann ist dein ♥B der höchste Trumpf. So oder so kommen die 30 Augen, die dir fehlen.',
    trap: '♥B zuerst: Der ♠B nimmt ihn, und du machst keinen Stich mehr.',
  },
  'sieg-sichern-24': {
    tip: 'Karo hat keiner mehr, und draußen ist nur ein Trumpf, der ♦B, rechts. Spiel die **♦D**: Entweder gewinnt sie, oder Rechts sticht sie mit dem ♦B – dann hat keiner mehr Trumpf, und deine Asse kann niemand stechen. So oder so kommen die 13 Augen, die dir fehlen.',
    trap: '♣K zuerst: Die ♣10 ist höher.',
  },
  'sieg-sichern-25': {
    tip: 'Draußen ist nur ein Trumpf, der ♥B – höher als deine beiden. Spiel die **♥8**: Wer den ♥B hat, muss ihn zugeben. Danach ist deine ♥10 der höchste Trumpf und bringt dir mindestens ihre 10 Augen.',
    trap: '♥10 zuerst: Der ♥B nimmt sie – und mit ihr deine 10 Augen.',
  },
  'sieg-sichern-26': {
    tip: 'Draußen ist nur ein Trumpf, der ♦B, rechts – höher als deine beiden. Spiel die **♣7**: Rechts muss den ♦B zugeben. Danach ist deine ♣10 der höchste Trumpf, und die 12 Augen, die dir fehlen, kommen sicher.',
    trap: '♣10 zuerst: Der ♦B nimmt sie – und mit ihr deine 10 Augen.',
  },
  'sieg-sichern-27': {
    tip: 'Draußen ist nur ein Trumpf, das ♣A, rechts – höher als deine beiden. Spiel die **♣9**: Rechts muss das Ass zugeben. Danach ist deine ♣D der höchste Trumpf, und die 15 Augen, die dir fehlen, kommen sicher.',
    trap: '♣D zuerst: Das ♣A nimmt sie – 3 Augen mehr für die Gegner, und am Ende fehlt dir ein Auge.',
  },
  'sieg-sichern-28': {
    tip: 'Draußen ist nur ein Trumpf, der ♣B – höher als deine beiden. Spiel den **♥B**: Wer den ♣B hat, muss ihn zugeben. Danach ist deine ♦10 der höchste Trumpf, und die 25 Augen, die dir fehlen, kommen sicher.',
    trap: '♦10 zuerst: Der ♣B nimmt sie – und mit ihr deine 10 Augen.',
  },
  'sieg-sichern-29': {
    tip: 'Draußen ist nur ein Trumpf, der ♠B – höher als deine beiden. Spiel die **♥8**: Wer den ♠B hat, muss ihn zugeben. Danach ist dein ♥A der höchste Trumpf, und die 25 Augen, die dir fehlen, kommen sicher.',
    trap: '♥A zuerst: Der ♠B nimmt es – und mit ihm deine 11 Augen.',
  },
  'sieg-sichern-30': {
    tip: 'Das ♣A ist noch draußen, Buben keine. Spiel den **♣K**: Nimmt ihn das Ass, verlierst du nur 4 Augen, und deine ♣10 ist danach die höchste Kreuzkarte.',
    trap: '♣10 zuerst: Das ♣A nimmt sie – 10 Augen statt 4, und am Ende fehlt dir ein Auge.',
  },
}

const EN: Record<string, Written> = {
  'sieg-sichern-1': {
    tip: 'No Jacks are out, and your **♣A** is the highest Club: it wins for sure – 11 card points, more than the 3 you need.',
    trap: '♣Q first: ♣10 and ♣K are higher.',
  },
  'sieg-sichern-2': {
    tip: 'Only one trump is out, the ♦J – your ♣J is higher. Lead the **♣J**: whoever has the ♦J must play it. After that nobody can trump, and nobody has a Heart: your ♥7 wins too.',
    trap: '♥7 first: nobody has a Heart, so the ♦J trumps it.',
  },
  'sieg-sichern-3': {
    tip: 'No Jacks are out, and your **♣A** is the highest Club: it wins for sure – 11 card points, more than the 8 you need.',
    trap: '♣K first: the ♣10 is higher.',
  },
  'sieg-sichern-4': {
    tip: 'Only one trump is out, the ♥10, and your **♥A** is higher. Lead it first: Left must play the ♥10 – after that nobody has a trump, and every trick is yours.',
    trap: '♥K first: the ♥10 takes it.',
  },
  'sieg-sichern-5': {
    tip: 'You need all four tricks. Only one trump is out, the ♠J – your ♣J is higher. Lead the **♣J**: whoever has the ♠J must play it. After that nobody has a trump, and your three Hearts win.',
    trap: '♥A first: the ♠J is higher and takes it.',
  },
  'sieg-sichern-6': {
    tip: 'Only one trump is out, the ♣7. Lead the **♣A**: whoever has the ♣7 must play it. After that nobody can trump your ♦A – at least 22 card points together, more than the 19 you need.',
    trap: '♦A first: whoever has no Diamond trumps it with the ♣7.',
  },
  'sieg-sichern-7': {
    tip: 'Only one trump is out, the ♥Q on the right – your **♥10** is higher. Lead it first: Right must play the Queen, at least 13 card points. After that nobody can trump your ♣A: at least 11 more.',
    trap: '♣A first: whoever has no Club trumps it with the ♥Q.',
  },
  'sieg-sichern-8': {
    tip: 'Only one trump is out, the ♣A – your ♦J is higher, as every Jack beats the Ace. Lead the **♦J**: whoever has the ♣A must play it. Then ♣9 and ♣7 are the only trumps, both yours, and nobody has a Heart: every trick is yours.',
    trap: '♥K first: whoever has no Heart trumps it with the ♣A.',
  },
  'sieg-sichern-9': {
    tip: 'Only one trump is out, the ♦J on the right – your ♥J is higher. Lead the **♥J**: Right must play the ♦J. After that nobody can trump, and ♦10 and ♣A are the highest of their suits: 4 + 10 + 11 = 25 card points, exactly the 25 you need.',
    trap: '♦10 first: if Right has no Diamond left, the ♦J trumps it.',
  },
  'sieg-sichern-10': {
    tip: 'Only one trump is out, the ♦J – your ♣J is higher. Lead the **♣J**: whoever has the ♦J must play it. After that nobody can trump, and ♠A, ♠10 and ♦Q are the highest of their suits: every trick is yours.',
    trap: '♠10 first: whoever has no Spade trumps it with the ♦J.',
  },
  'sieg-sichern-11': {
    tip: 'Only one trump is out, the ♥J on the right – but Right also has the ♣8, the last Club. Lead the **♣10**: Right must follow suit and cannot trump. That is 10 card points, more than the 6 you need.',
    trap: '♠A first: if Right has no Spade left, the ♥J trumps the Ace.',
  },
  'sieg-sichern-12': {
    tip: 'Only one trump is out, the ♣J – higher than your ♥K. Lead the **♠A**: either it wins – 11 card points, more than the 7 you need – or the ♣J trumps it. Then your ♥K is the highest trump.',
    trap: '♥K first: the ♣J takes it, and you win no trick after that.',
  },
  'sieg-sichern-13': {
    tip: 'Only one trump is out, the ♣J on the left – higher than your ♦J. Lead the **♥A**: either it wins – 11 card points, more than the 4 you need – or Left trumps it with the ♣J. Then your ♦J is the highest trump.',
    trap: '♦J first: the ♣J takes it, and you win no trick after that.',
  },
  'sieg-sichern-14': {
    tip: 'Only one trump is out, the ♣J – higher than your ♦Q. Lead the **♥A**: either it wins – 11 card points, more than the 7 you need – or the ♣J trumps it. Then your ♦Q is the highest trump.',
    trap: '♦Q first: the ♣J takes it, and you win no trick after that.',
  },
  'sieg-sichern-15': {
    tip: 'Only one trump is out, the ♦J on the left – higher than your ♣7. Lead the **♥A**: either it wins – 11 card points, more than the 10 you need – or Left trumps it with the ♦J. Then your ♣7 is the highest trump.',
    trap: '♣7 first: the ♦J takes it, and you win no trick after that.',
  },
  'sieg-sichern-16': {
    tip: 'Only one trump is out, the ♠10 on the right – higher than your ♠7. Lead the **♥A**: either it wins – 11 card points, more than the 3 you need – or Right trumps it with the ♠10. Then your ♠7 is the highest trump.',
    trap: '♠7 first: the ♠10 takes it, and you win no trick after that.',
  },
  'sieg-sichern-17': {
    tip: 'Only one trump is out, the ♠J on the left – higher than your ♣Q. Lead the **♠A**: either it wins – 11 card points, more than the 10 you need – or Left trumps it with the ♠J. Then your ♣Q is the highest trump.',
    trap: '♣Q first: the ♠J takes it, and you win no trick after that.',
  },
  'sieg-sichern-18': {
    tip: 'Only one trump is out, the ♥J – higher than your ♦J. Lead the **♦A**: either it wins – 11 card points, more than the 9 you need – or the ♥J trumps it. Then your ♦J is the highest trump.',
    trap: '♦J first: the ♥J takes it, and you win no trick after that.',
  },
  'sieg-sichern-19': {
    tip: 'Only one trump is out, the ♠J on the left – higher than your ♥J. Lead the **♠A**: either it wins, or Left trumps it with the ♠J – then your ♥J is the highest trump. Either way, the 15 card points you need will come.',
    trap: '♥J first: the ♠J takes it, and you win no trick after that.',
  },
  'sieg-sichern-20': {
    tip: 'Only one trump is out, the ♠J on the left – higher than your ♥J. Lead the **♣A**: either it wins, or Left trumps it with the ♠J – then your ♥J is the highest trump. Either way, the 12 card points you need will come.',
    trap: '♥J first: the ♠J takes it, and you win no trick after that.',
  },
  'sieg-sichern-21': {
    tip: 'Only one trump is out, the ♦J on the left – higher than your ♥K. Lead the **♠10**, the highest Spade: either it wins, or Left trumps it with the ♦J – then your ♥K is the highest trump. Either way, the 17 card points you need will come.',
    trap: '♥K first: the ♦J takes it, and you win no trick after that.',
  },
  'sieg-sichern-22': {
    tip: 'Nobody has a Spade left, and only one trump is out, the ♠J on the right – higher than your ♦J. Lead the **♠7**: either it wins, or Right trumps it with the ♠J – then your ♦J is the highest trump. Either way, the 7 card points you need will come.',
    trap: '♦J first: the ♠J takes it, and you win no trick after that.',
  },
  'sieg-sichern-23': {
    tip: 'Only one trump is out, the ♠J on the left – higher than your ♥J. Lead the **♦10**, the highest Diamond: either it wins, or Left trumps it with the ♠J – then your ♥J is the highest trump. Either way, the 30 card points you need will come.',
    trap: '♥J first: the ♠J takes it, and you win no trick after that.',
  },
  'sieg-sichern-24': {
    tip: 'Nobody has a Diamond left, and only one trump is out, the ♦J on the right. Lead the **♦Q**: either it wins, or Right trumps it with the ♦J – then nobody has a trump, and nobody can trump your Aces. Either way, the 13 card points you need will come.',
    trap: '♣K first: the ♣10 is higher.',
  },
  'sieg-sichern-25': {
    tip: 'Only one trump is out, the ♥J – higher than both of yours. Lead the **♥8**: whoever has the ♥J must play it. Then your ♥10 is the highest trump and brings you at least its 10 card points.',
    trap: '♥10 first: the ♥J takes it – and your 10 card points with it.',
  },
  'sieg-sichern-26': {
    tip: 'Only one trump is out, the ♦J on the right – higher than both of yours. Lead the **♣7**: Right must play the ♦J. Then your ♣10 is the highest trump, and the 12 card points you need will come for sure.',
    trap: '♣10 first: the ♦J takes it – and your 10 card points with it.',
  },
  'sieg-sichern-27': {
    tip: 'Only one trump is out, the ♣A on the right – higher than both of yours. Lead the **♣9**: Right must play the Ace. Then your ♣Q is the highest trump, and the 15 card points you need will come for sure.',
    trap: '♣Q first: the ♣A takes it – 3 more card points for them, and in the end you are one short.',
  },
  'sieg-sichern-28': {
    tip: 'Only one trump is out, the ♣J – higher than both of yours. Lead the **♥J**: whoever has the ♣J must play it. Then your ♦10 is the highest trump, and the 25 card points you need will come for sure.',
    trap: '♦10 first: the ♣J takes it – and your 10 card points with it.',
  },
  'sieg-sichern-29': {
    tip: 'Only one trump is out, the ♠J – higher than both of yours. Lead the **♥8**: whoever has the ♠J must play it. Then your ♥A is the highest trump, and the 25 card points you need will come for sure.',
    trap: '♥A first: the ♠J takes it – and your 11 card points with it.',
  },
  'sieg-sichern-30': {
    tip: 'The ♣A is still out, and no Jacks are. Lead the **♣K**: if the Ace takes it, you lose only 4 card points, and your ♣10 is then the highest Club.',
    trap: '♣10 first: the ♣A takes it – 10 card points instead of 4, and in the end you are one short.',
  },
}

function words(lang: 'de' | 'en', e: Endgame): ExerciseText {
  const g = GAME[lang][e.contract.kind === 'suit' ? e.contract.trump : 'G']
  const n = e.hand.length
  const w = (lang === 'de' ? DE : EN)[e.id]
  if (!w) throw new Error(`${e.id}: no tip written`)
  return lang === 'de'
    ? {
        title: `${g}: noch ${n} Stiche, ${e.need} Augen fehlen`,
        prompt: 'Welche Karte spielst du aus?',
        explain: w.tip,
        trap: w.trap,
      }
    : {
        title: `${g}: ${n} tricks to go, ${e.need} card points short`,
        prompt: 'Which card do you lead?',
        explain: w.tip,
        trap: w.trap,
      }
}

export const LADDER_DE: Record<string, ExerciseText> = Object.fromEntries(ENDGAMES.map((e) => [e.id, words('de', e)]))
export const LADDER_EN: Record<string, ExerciseText> = Object.fromEntries(ENDGAMES.map((e) => [e.id, words('en', e)]))
