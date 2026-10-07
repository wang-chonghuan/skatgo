// Die Skatregeln in Kurzfassung zum Ausdrucken (SKATGO-53): höchstens zwei Seiten A4. Augen, Grundwerte,
// Nullwerte und Reizwerte rendern die `engine`-Blöcke aus der Regel-Engine; hier stehen keine Tabellenzahlen.

import type { RulesSummary } from './types'

export const SUMMARY_DE: RulesSummary = [
  {
    title: 'Karten und Augen',
    blocks: [
      { kind: 'p', text: 'Drei Spieler, **32 Karten** (♣ ♠ ♥ ♦, je 7 bis Ass). Jeder bekommt zehn Karten, zwei liegen verdeckt als **Skat** in der Mitte. Das Blatt hat **120 Augen**:' },
      { kind: 'engine', table: 'cardPoints' },
    ],
  },
  {
    title: 'Trumpf und Bedienen',
    blocks: [
      {
        kind: 'list',
        items: [
          'Die vier **Buben** sind immer die höchsten Trümpfe: ♣B, ♠B, ♥B, ♦B. Im Farbspiel folgen A, 10, K, D, 9, 8, 7 der Trumpffarbe – elf Trümpfe. Im Grand sind nur die Buben Trumpf.',
          'Fehlfarben gehen A, 10, K, D, 9, 8, 7. Im Null gibt es keinen Trumpf, und jede Farbe geht A, K, D, B, 10, 9, 8, 7.',
          'Die ausgespielte Farbe muss man **bedienen**; Trümpfe sind eine Farbe, ein Bube bedient Trumpf. Wer nicht bedienen kann, darf stechen oder abwerfen. Der höchste Trumpf gewinnt den Stich, sonst die höchste Karte der ausgespielten Farbe.',
        ],
      },
    ],
  },
  {
    title: 'Reizen',
    blocks: [
      { kind: 'p', text: 'Links vom Geber sitzt Vorhand, dann Mittelhand, der Geber ist Hinterhand. **Mittelhand reizt Vorhand** („Ja“ oder „Passe“), dann **reizt Hinterhand den Sieger**. Wer übrig bleibt, ist Alleinspieler; sein Spiel muss den letzten Reizwert erreichen. Passen alle, wird neu gegeben. Gereizt wird nur mit diesen Werten:' },
      { kind: 'engine', table: 'biddingLadder' },
    ],
  },
  {
    title: 'Skat aufnehmen, drücken oder Hand',
    blocks: [
      { kind: 'p', text: 'Der Alleinspieler **nimmt den Skat auf** und **drückt** zwei beliebige Karten verdeckt weg; ihre Augen zählen für ihn. Oder er spielt **Hand** und lässt den Skat liegen – das bringt eine Stufe mehr, und nur dann darf er Schneider oder Schwarz ansagen. Farbspiel und Grand ouvert gehen ebenfalls nur Hand; Null ouvert geht auch nach dem Aufnehmen. Dann sagt er sein Spiel an. Vorhand spielt aus.' },
    ],
  },
  {
    title: 'Spielarten und Spielwert',
    blocks: [
      { kind: 'p', text: '**Spielwert = Grundwert × Stufe.** Die Stufe ist: Spitzen **mit** oder **ohne** so viele (vom ♣B an, über Hand und Skat gezählt) + 1 für **Spiel** + je 1 für **Hand**, **Schneider**, **Schneider angesagt**, **Schwarz**, **Schwarz angesagt** und **ouvert**. Die Grundwerte:' },
      { kind: 'engine', table: 'baseValues' },
      { kind: 'p', text: '**Null** wird nicht multipliziert: Der Alleinspieler darf keinen Stich bekommen und spielt zu festen Werten:' },
      { kind: 'engine', table: 'nullValues' },
    ],
  },
  {
    title: 'Gewinnen und Abrechnen',
    blocks: [
      {
        kind: 'list',
        items: [
          'Der Alleinspieler braucht **61 Augen** (mit dem Skat); 60 zu 60 ist verloren. **Schneider**: eine Seite hat 30 Augen oder weniger. **Schwarz**: eine Seite hat keinen Stich.',
          'Gewonnen: **+ Spielwert**. Verloren: **− 2 × Spielwert**. Die Gegenspieler schreiben nichts.',
          '**Überreizt**: Ist das Spiel weniger wert als der Reizwert, ist es verloren und zählt mit dem kleinsten Vielfachen des Grundwerts, das den Reizwert erreicht.',
        ],
      },
    ],
  },
]
