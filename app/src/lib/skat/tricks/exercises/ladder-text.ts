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
    tip: 'Buben sind keine mehr draußen, also sticht niemand. Dein **♥A** ist die höchste Herzkarte und gewinnt sicher – 11 Augen, mehr als die 4, die dir fehlen.',
    trap: '♥D zuerst: ♥10 und ♥K sind höher, und dein Ass kann am Ende leer ausgehen.',
  },
  'sieg-sichern-2': {
    tip: 'Karo hat keiner mehr, und Buben sind keine draußen: Deine **♦9** gewinnt sicher. Beide Gegner müssen eine Karte abwerfen – und draußen sind nur Karten mit Augen, mindestens 4 + 4 = 8.',
    trap: '♥10 zuerst: Das ♥A schlägt sie.',
  },
  'sieg-sichern-3': {
    tip: 'Links hat keinen Trumpf mehr, also sitzt das ♥A rechts. Spiel den **♣K**: Entweder bringt er seine 4 Augen, oder Rechts sticht ihn mit dem ♥A – dann ist deine ♥D der höchste Trumpf und holt den letzten Stich.',
    trap: '♥D zuerst: Das ♥A sticht sie, und dein ♣K kann danach leer ausgehen.',
  },
  'sieg-sichern-4': {
    tip: 'Kein einziger Trumpf ist mehr draußen – kein Bube, kein Pik. Dein **♣A** ist die höchste Kreuzkarte und gewinnt sicher: 11 Augen, mehr als die 6, die dir fehlen.',
    trap: '♣K zuerst: Die ♣10 ist höher.',
  },
  'sieg-sichern-5': {
    tip: 'Buben sind keine draußen, und von Kreuz ist nur noch der ♣K übrig. Deine **♣10** ist höher und gewinnt sicher – 10 Augen, mehr als die 8, die dir fehlen.',
    trap: '♣8 zuerst: Der ♣K schlägt sie.',
  },
  'sieg-sichern-6': {
    tip: 'Draußen ist nur noch ein Trumpf, die ♦D – deine **♦10** ist höher. Spiel sie zuerst: Die Dame muss fallen, das sind 13 Augen. Danach sticht keiner mehr, und ♣10 und ♦8 holen den Rest.',
    trap: '♣10 zuerst: Wer kein Kreuz hat, sticht mit der ♦D.',
  },
  'sieg-sichern-7': {
    tip: 'Links hat weder Trumpf noch Herz: ♦B und ♥9 sitzen also rechts. Spiel die **♥10** – Rechts muss die ♥9 zugeben und kann nicht stechen. Das sind 10 Augen; die restlichen 4 bekommst du danach sicher.',
    trap: '♠K zuerst: Der ♦B rechts ist höher.',
  },
  'sieg-sichern-8': {
    tip: 'Draußen ist noch ein Trumpf, der ♠B – höher als dein ♦B. Spiel die **♣10**: Entweder gewinnt sie (10 Augen), oder ein Gegner sticht sie mit dem ♠B – dann ist dein ♦B der höchste Trumpf und holt die fehlenden Augen.',
    trap: '♦B zuerst: Der ♠B nimmt ihn.',
  },
  'sieg-sichern-9': {
    tip: 'Rechts hat keinen Trumpf mehr: ♣B und ♣D sitzen beide links. Spiel den **♣K** – so muss Links einen der beiden hergeben, solange du ♣A und ♣9 noch hast.',
    trap: '♣A zuerst: Links legt nur die Dame darunter und behält den Buben für deinen König.',
  },
  'sieg-sichern-10': {
    tip: 'Rechts hat keinen Trumpf, also sitzt der ♣B links – höher als dein ♠B. Kreuzkarten hat aber jeder noch genau eine: ♣10 und ♣D. Spiel das **♣A**: Beide müssen bedienen – 11 + 10 + 3 = 24 Augen.',
    trap: '♠B zuerst: Der ♣B links ist höher.',
  },
}

const EN: Record<string, Written> = {
  'sieg-sichern-1': {
    tip: 'No Jacks are out, so nobody can trump. Your **♥A** is the highest Heart and wins for sure – 11 card points, more than the 4 you need.',
    trap: '♥Q first: ♥10 and ♥K are higher, and your ace may come away empty at the end.',
  },
  'sieg-sichern-2': {
    tip: 'Nobody has a Diamond left and no Jacks are out: your **♦9** wins for sure. Both opponents must throw a card – and every card still out is worth points, at least 4 + 4 = 8.',
    trap: '♥10 first: the ♥A beats it.',
  },
  'sieg-sichern-3': {
    tip: 'Left has no trump, so the ♥A is on the right. Lead the **♣K**: either it brings its 4 card points, or Right trumps it with the ♥A – then your ♥Q is the highest trump and takes the last trick.',
    trap: '♥Q first: the ♥A takes it, and your ♣K may win nothing afterwards.',
  },
  'sieg-sichern-4': {
    tip: 'Not a single trump is out – no Jack, no Spade. Your **♣A** is the highest Club and wins for sure: 11 card points, more than the 6 you need.',
    trap: '♣K first: the ♣10 is higher.',
  },
  'sieg-sichern-5': {
    tip: 'No Jacks are out, and of the Clubs only the ♣K is left. Your **♣10** is higher and wins for sure – 10 card points, more than the 8 you need.',
    trap: '♣8 first: the ♣K beats it.',
  },
  'sieg-sichern-6': {
    tip: 'Only one trump is out, the ♦Q – your **♦10** is higher. Lead it first: the Queen must fall, 13 card points. After that nobody can trump, and ♣10 and ♦8 bring the rest.',
    trap: '♣10 first: whoever has no Club trumps it with the ♦Q.',
  },
  'sieg-sichern-7': {
    tip: 'Left has neither trump nor Hearts, so ♦J and ♥9 are on the right. Lead the **♥10** – Right must play the ♥9 and cannot trump. That is 10 card points; the other 4 follow for sure.',
    trap: '♠K first: the ♦J on the right is higher.',
  },
  'sieg-sichern-8': {
    tip: 'One trump is still out, the ♠J – higher than your ♦J. Lead the **♣10**: either it wins (10 card points), or an opponent trumps it with the ♠J – then your ♦J is the highest trump and brings the points you need.',
    trap: '♦J first: the ♠J takes it.',
  },
  'sieg-sichern-9': {
    tip: 'Right has no trump left: ♣J and ♣Q are both on the left. Lead the **♣K** – Left must give up one of them while you still hold ♣A and ♣9.',
    trap: '♣A first: Left plays only the Queen under it and keeps the Jack for your King.',
  },
  'sieg-sichern-10': {
    tip: 'Right has no trump, so the ♣J is on the left – higher than your ♠J. But each opponent has exactly one Club left: ♣10 and ♣Q. Lead the **♣A**: both must follow – 11 + 10 + 3 = 24 card points.',
    trap: '♠J first: the ♣J on the left is higher.',
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
