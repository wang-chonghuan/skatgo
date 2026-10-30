import type { CheatSheet } from './cheat-sheet'

export const CHEAT_SHEET_DE: CheatSheet = {
  title: 'Reiz-Spickzettel',
  sections: [
    {
      heading: '1 · Was kannst du spielen?',
      text: [
        'Zähl für jede Farbe deine Trümpfe: die Karten dieser Farbe plus jeden Buben, den du hast. Die Farbe mit den meisten Trümpfen ist dein Spiel. Viele Buben und Asse? Prüf den Grand (4). Kaum Trümpfe, aber in jeder Farbe kleine Karten? Prüf den Null (7).',
      ],
    },
    {
      heading: '2 · Reicht das?',
      list: [
        '**6 Trümpfe und ein Ass:** ein gutes Spiel.',
        '**5 Trümpfe und ein Ass:** das Mindeste. Ohne Ass: passen.',
        '**4 Trümpfe oder weniger:** zu wenig für ein Farbspiel.',
        '**2 Buben und 2 Asse:** immer 18 wert.',
      ],
    },
    {
      heading: '3 · Unsicher? Zähl Punkte',
      table: {
        head: ['', 'Punkte'],
        rows: [
          ['Jeder Trumpf', '1'],
          ['Trumpf-Ass, Trumpf-10', 'je 1 mehr'],
          ['Jeder sichere Bubenstich', '1'],
          ['Eine Beifarbe mit dem Ass', '1'],
          ['… mit Ass und 10', '2'],
          ['… mit Ass, 10 und König', '2½'],
          ['… mit 10 und König', '1'],
          ['… mit der 10, aber ohne Ass und König', '½'],
          ['… mit König, Dame und einer kleinen Karte', '½'],
          ['In Vorhand', '½'],
        ],
      },
      after: ['Ein Bubenstich ist sicher, wenn kein höherer Bube gegen dich steht: ♣B allein ist 1, ♣B ♠B sind 2, aber ♠B ♥B nur 1.'],
      afterList: [
        '**8½ oder mehr:** bis zu deiner Grenze reizen — ab 8½ gewinnst du etwa 7 von 10.',
        '**7½–8:** 18 sagen, nicht höher.',
        '**Unter 7½:** passen.',
      ],
    },
    {
      heading: '4 · Grand',
      text: ['Zähl 1 Punkt für jeden Buben, jedes Ass und die Vorhand. Mit 5 über Grand nachdenken, mit 6 oder 7 spielen.'],
    },
    {
      heading: '5 · Wie hoch darfst du reizen?',
      text: ['Deine Grenze ist der Spielwert: (mit oder ohne n, plus 1) × Grundwert.'],
      list: [
        '**Mit n:** du hast ♣B und die nächsten Karten der Reihe (♣B ♠B ♥B ♦B, dann A, 10 …).',
        '**Ohne n:** sie fehlen dir.',
        '**Grundwert:** ♦ 9 · ♥ 10 · ♠ 11 · ♣ 12 · Grand 24.',
        '**Vor dem Skat gezählt:** Ein Bube im Skat kann ein „ohne“ nur verkürzen — darum bleibt ein wackliges „ohne“-Blatt unter seinem Wert. Ein „mit“ kann nur länger werden.',
      ],
    },
    {
      heading: '6 · Dein Platz',
      text: ['Mittelhand ist der gefährlichste Platz. Reiz dort nie ein schwaches Blatt an, nur um zu sehen, was die anderen tun.'],
    },
    {
      heading: '7 · Null',
      text: [
        'Du darfst keinen einzigen Stich machen. Beim Null steht die 10 zwischen 9 und Bube: 7 8 9 10 B D K A. Du brauchst in jeder Farbe eine kleine Karte: eine 7 oder eine blanke 8. Eine blanke 9, 8-9 oder ein König mit nur einer kleinen Karte sind Schwachstellen.',
        'Die Werte sind fest, ohne Multiplikator: Null 23 · Null Hand 35 · Null ouvert 46 · Null ouvert Hand 59.',
      ],
    },
  ],
}
