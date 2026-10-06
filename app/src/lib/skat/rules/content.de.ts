// Die Regelseite auf Deutsch (SKATGO-29): die vollständige Referenz, Abschnitt für Abschnitt, aus der
// Regel-Engine geschrieben (cards.ts, game.ts, value.ts). Grundwerte, Nullwerte, Reizwerte und Augen
// rendern die `engine`-Blöcke aus der Engine; Zahlen stehen nur in den Rechenbeispielen.

import type { RulesText } from './types'

export const RULES_DE: RulesText = {
  intro: [
    'Hier sind die Skat Regeln einfach erklärt und vollständig, so wie SkatGo spielt: nach der Internationalen Skatordnung (ISkO), den offiziellen Regeln des Deutschen Skatverbands (DSkV) und der International Skat Players Association (ISPA), für drei Spieler an einem Tisch. Die Tabellen mit Augen, Grundwerten, Nullwerten und Reizwerten kommen direkt aus der Regel-Engine von SkatGo – was du hier liest, passiert also genau so, wenn du spielst.',
    'Jeder Abschnitt endet mit einem Link zu der Lektion, in der du ihn selbst ausprobierst. Beliebte Hausregeln stehen am Ende, zusammen mit der Antwort, welche davon SkatGo verwendet.',
  ],
  sections: [
    {
      id: 'cards',
      anchor: 'karten-und-augen',
      title: 'Karten und Augen',
      blocks: [
        {
          kind: 'p',
          text: 'Skat wird mit **32 Karten** gespielt: den vier Farben Kreuz ♣, Pik ♠, Herz ♥ und Karo ♦, jede mit Ass, Zehn, König, Dame, Bube, 9, 8 und 7. Das ist ein französisches Blatt ohne die Karten 2 bis 6. In manchen Gegenden spielt man mit dem deutschen Blatt (Eichel, Grün, Rot und Schellen, mit Ober und Unter statt Dame und Bube); die Regeln sind dieselben.',
        },
        {
          kind: 'p',
          text: 'Die Farben haben eine feste Reihenfolge, von oben nach unten: **♣ ♠ ♥ ♦**. Nach ihr richten sich die vier Buben untereinander und die Grundwerte der Farben.',
        },
        { kind: 'p', text: 'Jede Karte hat **Augen**. Nur fünf Kartenwerte zählen; 9, 8 und 7 sind Luschen:' },
        { kind: 'engine', table: 'cardPoints' },
        {
          kind: 'p',
          text: 'Jede Farbe hat 30 Augen, das ganze Blatt also **120**. Die Augen entscheiden Farbspiele und Grand; im Null zählen sie nicht. Wichtig: Die **Zehn steht über dem König**. Eine Fehlfarbe geht A, 10, K, D, 9, 8, 7 – ohne den Buben, denn der ist Trumpf.',
        },
      ],
      lesson: '2',
    },
    {
      id: 'dealing',
      anchor: 'geben',
      title: 'Geben',
      blocks: [
        {
          kind: 'p',
          text: 'Skat ist ein Spiel für drei Spieler. Links vom Geber sitzt **Vorhand**, im Uhrzeigersinn danach **Mittelhand**, und der Geber selbst ist **Hinterhand**. Nach jedem Spiel gibt der nächste Spieler im Uhrzeigersinn. (Sitzen vier am Tisch, setzt der Geber aus, und Hinterhand ist der Spieler rechts vom Geber.)',
        },
        {
          kind: 'p',
          text: 'Jeder bekommt **zehn Karten**, und **zwei Karten** liegen verdeckt in der Mitte: der **Skat**. Am echten Tisch mischt der Geber, der rechte Nachbar hebt ab, und gegeben wird im Uhrzeigersinn ab Vorhand: je drei, zwei in den Skat, je vier, je drei. SkatGo mischt per Computer und verteilt das gemischte Blatt zu je zehn Karten an jeden Platz, die letzten zwei in den Skat – das Ergebnis ist dasselbe.',
        },
        {
          kind: 'p',
          text: 'Vorhand spielt zum ersten Stich aus, egal welches Spiel gespielt wird. Danach spielt aus, wer den letzten Stich bekommen hat.',
        },
      ],
      lesson: '1',
    },
    {
      id: 'bidding',
      anchor: 'reizen',
      title: 'Reizen',
      blocks: [
        {
          kind: 'p',
          text: 'Vor dem Spiel wird **gereizt**, um den Alleinspieler zu bestimmen. Ein Reizwert heißt: Das Spiel, das ich vorhabe, ist mindestens so viel wert. Gereizt werden dürfen nur Werte, die ein Farbspiel, ein Grand oder ein Null wirklich haben kann:',
        },
        { kind: 'engine', table: 'biddingLadder' },
        {
          kind: 'list',
          items: [
            '**Mittelhand reizt Vorhand.** Mittelhand sagt die Reizwerte aufsteigend an; Vorhand hört und antwortet **„Ja“**, um mitzuhalten, oder **„Passe“**. Das Duell ist vorbei, wenn einer der beiden passt.',
            '**Hinterhand reizt den Sieger** und macht beim zuletzt genannten Wert weiter, bis einer passt.',
            '**Wer übrig bleibt, wird Alleinspieler** zum letzten genannten Reizwert und muss ein Spiel ansagen, das mindestens so viel wert ist.',
            '**Passen Mittelhand und Hinterhand, ohne eine Zahl zu nennen,** kann Vorhand das Spiel noch zum kleinsten Reizwert übernehmen oder ebenfalls passen.',
          ],
        },
        {
          kind: 'p',
          text: 'Passen alle drei, wird nicht gespielt: Das Spiel wird **eingepasst**, und der nächste Geber gibt neu. So macht es SkatGo; manche Runden spielen stattdessen einen Ramsch (siehe Hausregeln).',
        },
        {
          kind: 'p',
          text: 'Am echten Tisch darf man beim Reizen Werte überspringen; bei SkatGo ist jedes Gebot der nächste Reizwert.',
        },
      ],
      lesson: '7',
    },
    {
      id: 'games',
      anchor: 'spielarten',
      title: 'Spielarten: Farbspiele, Grand und Null',
      blocks: [
        {
          kind: 'p',
          text: '**Farbspiele.** Eine Farbe ist Trumpf. Die vier Buben sind immer die vier höchsten Trümpfe, in der Reihenfolge **♣B, ♠B, ♥B, ♦B**, danach kommen Ass, Zehn, König, Dame, 9, 8 und 7 der Trumpffarbe: **elf Trümpfe**. Die drei anderen Farben behalten je sieben Karten in der Reihenfolge A, 10, K, D, 9, 8, 7.',
        },
        {
          kind: 'p',
          text: '**Bedienen.** Wer ausspielt, darf jede Karte legen; die anderen müssen die ausgespielte Farbe bedienen, wenn sie können. Alle Trümpfe gelten als eine Farbe: Ein Bube bedient Trumpf, nie die Farbe, die auf ihm steht (außer im Null, wo er eine gewöhnliche Karte ist). Wer nicht bedienen kann, darf stechen oder abwerfen. Einen Zwang, den Stich zu gewinnen oder zu stechen, gibt es nicht. Der höchste Trumpf bekommt den Stich; liegt keiner darin, gewinnt die höchste Karte der ausgespielten Farbe.',
        },
        { kind: 'p', text: 'Jedes Farbspiel und der Grand haben einen **Grundwert**, geordnet nach der Farbreihenfolge:' },
        { kind: 'engine', table: 'baseValues' },
        { kind: 'sub', anchor: 'grand', title: 'Grand' },
        {
          kind: 'p',
          text: '**Grand.** Nur die vier Buben sind Trumpf, in derselben Reihenfolge; alle vier Farben sind Fehlfarben. Der Grand hat den höchsten Grundwert von allen; mit nur vier Trümpfen lebt er von Buben und langen Farben mit Assen und Zehnen.',
        },
        { kind: 'sub', anchor: 'null-ouvert', title: 'Null und Null ouvert' },
        {
          kind: 'p',
          text: '**Null.** Kein Trumpf, und Augen zählen nicht. Der Alleinspieler gewinnt, wenn er **keinen einzigen Stich** bekommt; mit dem ersten Stich hat er verloren, und das Spiel endet sofort. Jede Farbe hat ihre natürliche Reihenfolge, **A, K, D, B, 10, 9, 8, 7**: Der Bube steht zwischen Dame und Zehn.',
        },
        {
          kind: 'p',
          text: '**Null ouvert.** Der Alleinspieler legt seine Karten vor dem ersten Ausspiel offen auf den Tisch und darf trotzdem keinen Stich bekommen; die Gegenspieler sehen sein Blatt und spielen gezielt dagegen. Null ouvert geht nach dem Aufnehmen des Skats oder als Handspiel (Null ouvert Hand).',
        },
        { kind: 'p', text: 'Null wird nicht multipliziert. Es hat vier feste Werte, je nachdem, ob es Hand, ouvert (offen) oder beides gespielt wird:' },
        { kind: 'engine', table: 'nullValues' },
      ],
      lesson: '5',
    },
    {
      id: 'extras',
      anchor: 'hand-schneider-schwarz-ouvert',
      title: 'Hand, Schneider, Schwarz und Ouvert',
      blocks: [
        {
          kind: 'p',
          text: '**Der Skat.** Meist nimmt der Alleinspieler die beiden Skatkarten auf und **drückt** dann zwei beliebige Karten verdeckt weg, bevor er das Spiel ansagt. Die gedrückten Karten spielen nicht mit, aber ihre Augen zählen für den Alleinspieler.',
        },
        {
          kind: 'p',
          text: '**Hand.** Wer den Skat liegen lässt, spielt **Hand** mit den zehn gegebenen Karten. Hand bringt eine Stufe mehr. Der Skat gehört trotzdem dem Alleinspieler: Seine Augen zählen für ihn, und er zählt bei den Spitzen mit.',
        },
        {
          kind: 'p',
          text: '**Schneider.** Eine Seite mit **30 Augen oder weniger** ist Schneider: eine Stufe mehr, egal ob der Alleinspieler mit 90 oder mehr gewinnt oder selbst bei 30 oder weniger hängen bleibt.',
        },
        {
          kind: 'p',
          text: '**Schwarz.** Eine Seite **ohne einen einzigen Stich** ist schwarz: noch eine Stufe, zusätzlich zum Schneider, der immer dazugehört, und ebenfalls in beide Richtungen.',
        },
        {
          kind: 'p',
          text: '**Ansagen.** Nur beim Handspiel darf der Alleinspieler vor dem Spiel **Schneider** („mindestens 90“) oder **Schwarz** („alle Stiche“) ansagen. Jede Ansage bringt eine Stufe zusätzlich zu dem Ergebnis, das sie verspricht, und Schwarz angesagt schließt Schneider angesagt ein. Wer die Ansage verfehlt, und sei es um ein Auge, hat verloren. Nach dem Aufnehmen des Skats kann nichts mehr angesagt werden.',
        },
        {
          kind: 'p',
          text: '**Ouvert.** Der Alleinspieler spielt mit offen aufgelegten Karten. Im Farbspiel und im Grand geht ouvert nur als Handspiel und schließt Schwarz angesagt ein; es bringt eine weitere Stufe. Null ouvert hat eigene Regeln und feste Werte (siehe Null und Null ouvert).',
        },
      ],
      lesson: '8',
    },
    {
      id: 'value',
      anchor: 'spielwert',
      title: 'Spielwert und Spitzen',
      blocks: [
        { kind: 'p', text: 'Bei Farbspielen und Grand gilt: **Spielwert = Grundwert × Stufe**. Die Stufe ist die Summe aus:' },
        {
          kind: 'list',
          items: [
            'den **Spitzen**, „mit“ oder „ohne“ so viele;',
            '**1 für „Spiel“**;',
            '**je 1** für Hand, Schneider, Schneider angesagt, Schwarz, Schwarz angesagt und ouvert, soweit zutreffend.',
          ],
        },
        {
          kind: 'p',
          text: '**Spitzen zählen.** Leg die Trümpfe von oben in eine Reihe: ♣B, ♠B, ♥B, ♦B, dann die Trumpffarbe vom Ass abwärts (im Grand nur die Buben). Hast du den ♣B, zählst du, wie viele Trümpfe du von ihm an lückenlos hast: Du spielst **mit** so vielen. Fehlt er dir, zählst du, wie viele über deinem höchsten Trumpf fehlen: Du spielst **ohne** so viele. Beides zählt gleich. Gezählt wird über die zehn Karten des Alleinspielers **und den Skat**, auch im Handspiel, wo sich die wahre Zahl erst nach dem Spiel zeigt.',
        },
        {
          kind: 'example',
          title: 'Kreuz mit 2',
          lines: ['Der Alleinspieler hat ♣B und ♠B, aber nicht den ♥B.', 'Mit 2, Spiel 3.', 'Kreuz 12 × 3 = **36**.'],
        },
        {
          kind: 'example',
          title: 'Grand Hand ohne 3',
          lines: ['Der höchste Bube in Hand und Skat ist der ♦B.', 'Ohne 3, Spiel 4, Hand 5.', 'Grand 24 × 5 = **120**.'],
        },
        {
          kind: 'p',
          text: '**Überreizt.** Nach dem Spiel wird der Spielwert mit dem Reizwert verglichen. Ist er kleiner, ist das Spiel verloren, egal wie viele Augen, und es wird mit dem **kleinsten Vielfachen des Grundwerts gewertet, das den Reizwert erreicht**. Das passiert vor allem im Handspiel, wenn ein Bube im Skat die Spitzen verändert.',
        },
        {
          kind: 'example',
          title: 'Überreizt: Pik Hand',
          lines: [
            'Gereizt ist 44. Der höchste Bube des Alleinspielers ist der ♥B: ohne 2, Spiel 3, Hand 4, Pik 11 × 4 = 44.',
            'Nach dem Spiel liegt im Skat der ♣B: mit 1, Spiel 2, Hand 3, 11 × 3 = 33. Weniger als 44.',
            'Verloren, gewertet mit 44, dem kleinsten Vielfachen von 11, das den Reizwert erreicht: −2 × 44 = **−88**.',
          ],
        },
      ],
      lesson: '6',
    },
    {
      id: 'scoring',
      anchor: 'abrechnung',
      title: 'Abrechnung und Spielliste',
      blocks: [
        {
          kind: 'p',
          text: '**Wer gewinnt.** Im Farbspiel und im Grand braucht der Alleinspieler **61 Augen oder mehr**, aus seinen Stichen plus dem Skat; 60 zu 60 ist verloren. Im Null darf er keinen Stich bekommen. Eine verfehlte Ansage oder ein überreiztes Spiel ist immer verloren. Mit 90 Augen oder mehr spielt der Alleinspieler die Gegenspieler Schneider, mit 30 oder weniger ist er selbst Schneider; schwarz heißt, eine Seite hat keinen Stich.',
        },
        { kind: 'p', text: '**Die Spielliste.** Nur die Zeile des Alleinspielers ändert sich:' },
        {
          kind: 'list',
          items: ['Spiel gewonnen: **+ Spielwert**;', 'Spiel verloren: **− 2 × Spielwert**;', 'die Gegenspieler schreiben in diesem Spiel nichts.'],
        },
        {
          kind: 'p',
          text: 'Jeder Spieler hat einen **laufenden Punktestand**, und nach einer vereinbarten Zahl von Spielen gewinnt, wer die meisten Punkte hat. Der Spieltisch von SkatGo führt so einen laufenden Stand für alle drei Plätze, und im freien Spiel summieren sich deine eigenen Ergebnisse von Spiel zu Spiel.',
        },
        {
          kind: 'example',
          title: 'Eine kurze Spielliste',
          lines: [
            'Spiel 1: Anna spielt Herz mit 1 (10 × 2 = 20) und gewinnt. Anna +20.',
            'Spiel 2: Ben spielt Grand mit 1 (24 × 2 = 48) und verliert. Ben −96.',
            'Spiel 3: Anna spielt einen einfachen Null (23) und gewinnt. Anna 20 + 23 = 43.',
            'Stand: Anna 43, Ben −96, Clara 0.',
          ],
        },
        {
          kind: 'p',
          text: '**Listenwertung.** Im Verein und im Ligaspiel wird meist nach dem Seeger-Fabian-System gewertet: 50 Punkte dazu für jedes gewonnene Spiel des Alleinspielers, 50 ab für jedes verlorene, und Punkte für die Gegenspieler, wenn der Alleinspieler verliert. Bei SkatGo wird das **tägliche Turnier** nach Seeger-Fabian gewertet; am freien Spieltisch zählen nur die Spielwerte von oben, ohne +50 oder −50.',
        },
      ],
      lesson: '9',
    },
    {
      id: 'house',
      anchor: 'hausregeln',
      title: 'Hausregeln: Kontra, Ramsch und Bock',
      blocks: [
        { kind: 'p', text: 'Viele Runden spielen zusätzlich eigene Regeln. SkatGo spielt nur nach der Skatordnung, ohne eine davon; das sind die drei häufigsten:' },
        {
          kind: 'p',
          text: '**Kontra und Re.** Glaubt ein Gegenspieler, dass der Alleinspieler verliert, sagt er **Kontra**, und das Spiel zählt doppelt. Der Alleinspieler kann mit **Re** antworten, dann verdoppelt es sich noch einmal. Bis wann man Kontra oder Re sagen darf, ist von Runde zu Runde verschieden.',
        },
        {
          kind: 'p',
          text: '**Bock.** Nach bestimmten Ereignissen, etwa einem Spiel, das 60 zu 60 ausgeht, einem verlorenen Spiel mit Kontra oder einem sehr hohen Spiel, folgt eine **Bockrunde**, in der jedes Spiel doppelt zählt.',
        },
        { kind: 'sub', anchor: 'ramsch', title: 'Ramsch' },
        {
          kind: 'p',
          text: '**Ramsch** spielen viele Runden, wenn alle drei passen, statt neu zu geben. Die Regeln sind von Gegend zu Gegend und von Runde zu Runde verschieden; verbreitet ist diese Form:',
        },
        {
          kind: 'list',
          items: [
            'Nur die vier **Buben** sind Trumpf, wie im Grand. Es gibt keinen Alleinspieler: **Jeder spielt für sich.**',
            'Wer am Ende **die meisten Augen** hat, verliert und schreibt sie als Minuspunkte. Den **Skat** bekommt meist, wer den letzten Stich macht.',
            '**Jungfrau:** Wer keinen einzigen Stich bekommt, ist Jungfrau, und das Ergebnis des Verlierers zählt doppelt.',
            '**Durchmarsch:** Wer alle zehn Stiche macht, gewinnt den Ramsch, statt ihn zu verlieren.',
            '**Schieben:** Vor dem ersten Ausspiel darf jeder reihum den Skat aufnehmen und zwei Karten verdeckt weitergeben; jedes Schieben verdoppelt den Wert. In vielen Runden dürfen dabei keine Buben geschoben werden.',
          ],
        },
        {
          kind: 'p',
          text: 'Wie viel ein Ramsch zählt und welche dieser Zusätze gelten, wird vorher am Tisch vereinbart. **SkatGo spielt keinen Ramsch:** Passen alle drei, wird einfach neu gegeben.',
        },
      ],
      lesson: '9',
    },
  ],
}
