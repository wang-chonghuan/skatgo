// Der Einstiegstext der Lektionen auf Deutsch (SKATGO-29): Fragetitel, H1 und Meta-Beschreibung (der
// Text unter der Lektion fiel mit SKATGO-161 weg). Begriffe wie in content.de.ts; jede Aussage lehrt die
// Lektion selbst, die Engine spielt sie so, und keine gehört einer späteren Lektion (concepts.ts).

import type { LessonGuide } from '../rules/types'

export const GUIDE_DE: Record<string, LessonGuide> = {
  '1': {
    slug: 'wie-funktioniert-skat',
    question: 'Wie spielt man Skat? Skat kurz erklärt',
    h1: 'Wie spielt man Skat? Drei Spieler, 32 Karten',
    description:
      'Wie spielt man Skat? Kurz erklärt: drei Spieler, 32 Karten, zehn für jeden und zwei im Skat. Ein Alleinspieler spielt gegen zwei und braucht 61 von 120 Augen.',
    rule: 'dealing',
  },
  '2': {
    slug: 'welche-karte-zaehlt-wie-viele-augen',
    question: 'Skat Kartenwerte: Welche Karte zählt wie viele Augen?',
    h1: 'Skat Kartenwerte: welche Karten Augen zählen',
    description:
      'Die Skat Kartenwerte zum Punkte zählen: Ass 11, Zehn 10, König 4, Dame 3, Bube 2, und 7, 8, 9 zählen nichts. Warum die Zehn mehr zählt als der König.',
    rule: 'cards',
  },
  '3': {
    slug: 'was-ist-trumpf-beim-skat',
    question: 'Skat Trumpf-Reihenfolge: die Buben und die Farben',
    h1: 'Die Trumpf-Reihenfolge beim Skat und die vier Buben',
    description:
      'Die Trumpf-Reihenfolge beim Skat: Die vier Buben sind immer die höchsten Trümpfe, ♣B, ♠B, ♥B, ♦B. Danach A, 10, K, D, 9, 8, 7 der Trumpffarbe, elf Trümpfe.',
    rule: 'games',
  },
  '4': {
    slug: 'wie-bedient-man-beim-skat',
    question: 'Bedienen beim Skat: Wann muss man bedienen?',
    h1: 'Bedienen beim Skat und wer den Stich bekommt',
    description:
      'Bedienen beim Skat: Hast du die ausgespielte Farbe, musst du sie spielen. Buben zählen als Trumpf, und der höchste Trumpf oder die höchste Farbkarte gewinnt.',
    rule: 'games',
  },
  '5': {
    slug: 'was-sind-grand-und-null',
    question: 'Grand und Null beim Skat: die zwei anderen Spielarten',
    h1: 'Grand und Null: die beiden anderen Spielarten',
    description:
      'Grand und Null beim Skat: Im Grand sind nur die Buben Trumpf, beim Nullspiel darf der Alleinspieler keinen einzigen Stich bekommen. So gehen beide Spielarten.',
    rule: 'games',
  },
  '6': {
    slug: 'wie-berechnet-man-den-spielwert',
    question: 'Skat Spielwert berechnen: Grundwert, Spitzen, Stufe',
    h1: 'Spielwert berechnen beim Skat: Grundwert × Stufe',
    description:
      'Spielwert berechnen beim Skat: Grundwert × Stufe. Die Grundwerte von Farbspielen und Grand, Spitzen „mit“ und „ohne“ vom Kreuz-Buben an, dazu eins fürs Spiel.',
    rule: 'value',
  },
  '7': {
    slug: 'wie-reizen-funktioniert',
    question: 'Skat reizen erklärt: Wie Reizen beim Skat funktioniert',
    h1: 'Wie Reizen beim Skat funktioniert',
    description:
      'Reizen beim Skat erklärt: die Reihenfolge, wer wen reizt – Mittelhand reizt Vorhand, Hinterhand den Sieger – und wann du Ja oder Passe sagst.',
    rule: 'bidding',
  },
  '8': {
    slug: 'was-tun-mit-dem-skat',
    question: 'Skat drücken oder Hand spielen: Was tun mit dem Skat?',
    h1: 'Skat drücken, aufnehmen oder Hand spielen',
    description:
      'Skat drücken oder Handspiel: Der Alleinspieler nimmt die zwei Skatkarten auf und drückt zwei Karten, oder er spielt Hand. Welche Karten du drückst und warum.',
    rule: 'extras',
  },
  '9': {
    slug: 'wie-rechnet-man-skat-ab',
    question: 'Skat Abrechnung: Schneider, Schwarz, überreizt',
    h1: 'Skat Abrechnung: Schneider, Schwarz und überreizte Spiele',
    description:
      'Die Skat Abrechnung Schritt für Schritt: Gewonnen zählt der Spielwert, verloren das Doppelte. Dazu Schneider, Schwarz, Ansagen im Handspiel und Überreizen.',
    rule: 'scoring',
  },
  '10': {
    slug: 'wie-spielt-man-gut-skat',
    question: 'Skat Tipps: Tricks und die häufigsten Todsünden',
    h1: 'Skat Tipps: so spielen Allein- und Gegenspieler gut',
    description:
      'Skat Tipps für Allein- und Gegenspieler: erst Trumpf ziehen, dann Asse holen, dem Partner schmieren – und die häufigsten Todsünden, die dich Spiele kosten.',
    rule: 'games',
  },
  '11': {
    slug: 'bereit-fuer-eine-echte-partie',
    question: 'Skat üben: eine ganze Partie zum Abschluss',
    h1: 'Skat üben im Abschlussspiel: eine ganze Partie',
    description:
      'Skat üben in einer kompletten Partie gegen zwei KI-Gegner: Reizen, Skat, Ansagen, zehn Stiche und Abrechnung, mit Tipps, wann immer du willst.',
    rule: 'scoring',
  },
}
