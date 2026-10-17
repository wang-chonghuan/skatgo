import { type Card, pointsOf } from '../../cards'
import type { OpenEndgame } from './open'
import { OPEN } from './open-list'
import type { ExerciseText } from './types'

// The open-card endgames' words (SKATGO-110): one template per language. The title names the game, the side and
// the tricks to go; the task says what is needed; the explanation is the solver's: the one winning card and where
// the declarer ends up after it and after each of the others, both sides playing their best.

const GAME = {
  de: { C: 'Kreuz', S: 'Pik', H: 'Herz', D: 'Karo', G: 'Grand' },
  en: { C: 'Clubs', S: 'Spades', H: 'Hearts', D: 'Diamonds', G: 'Grand' },
} as const
const SUIT = { C: '♣', S: '♠', H: '♥', D: '♦' } as const
const RANK = { de: { J: 'B', Q: 'D' }, en: { J: 'J', Q: 'Q' } } as const

const label = (lang: 'de' | 'en', c: Card) => SUIT[c.suit] + ((RANK[lang] as Record<string, string>)[c.rank] ?? c.rank)

function words(lang: 'de' | 'en', e: OpenEndgame): ExerciseText {
  const k = e.game.declaration!.contract
  const g = GAME[lang][k.kind === 'suit' ? k.trump : 'G']
  const n = e.game.hands[0].length
  const win = e.play.win[0]
  const at = e.play.values.find((v) => v.card === win || (v.card.suit === win.suit && v.card.rank === win.rank))!.points
  const others = e.play.values.filter((v) => !(v.card.suit === win.suit && v.card.rank === win.rank)).map((v) => `${label(lang, v.card)} ${v.points}`).join(', ')
  const W = `**${label(lang, win)}**`
  // The table's board counts the tricks only; the skat counts for the declarer too, so the task says both.
  const skat = pointsOf(e.game.skat)
  const tricks = e.have - skat
  if (lang === 'de')
    return e.role === 'declarer'
      ? {
          title: `${g}: Alleinspieler, noch ${n} Stiche`,
          prompt: `Du spielst ${g} und hast ${e.have} Augen – ${tricks} in deinen Stichen, ${skat} im Skat. Hol dir die ${61 - e.have}, die noch fehlen. Alle Karten liegen offen.`,
          explain: `Nur ${W} gewinnt: Spielen beide Seiten ihr Bestes, kommst du damit auf ${at} Augen. Mit jeder anderen Karte bleibst du darunter: ${others}.`,
        }
      : {
          title: `${g}: Gegenspieler, noch ${n} Stiche`,
          prompt: `Der Alleinspieler spielt ${g} und hat ${e.have} Augen – ${tricks} in seinen Stichen, ${skat} im Skat. Halte ihn unter 61. Alle Karten liegen offen.`,
          explain: `Nur ${W} hält ihn auf: Spielen beide Seiten ihr Bestes, kommt er damit auf ${at} Augen. Mit jeder anderen Karte gewinnt er: ${others}.`,
        }
  return e.role === 'declarer'
    ? {
        title: `${g}: declarer, ${n} tricks to go`,
        prompt: `You play ${g} and have ${e.have} card points – ${tricks} in your tricks, ${skat} in the skat. Take the ${61 - e.have} you still need. Every card is open.`,
        explain: `Only ${W} wins: with both sides playing their best, it brings you to ${at} card points. Any other card leaves you short: ${others}.`,
      }
    : {
        title: `${g}: defender, ${n} tricks to go`,
        prompt: `The declarer plays ${g} and has ${e.have} card points – ${tricks} in their tricks, ${skat} in the skat. Keep them below 61. Every card is open.`,
        explain: `Only ${W} stops them: with both sides playing their best, it leaves the declarer on ${at} card points. With any other card they win: ${others}.`,
      }
}

export const OPEN_DE: Record<string, ExerciseText> = Object.fromEntries(OPEN.map((e) => [e.id, words('de', e)]))
export const OPEN_EN: Record<string, ExerciseText> = Object.fromEntries(OPEN.map((e) => [e.id, words('en', e)]))
