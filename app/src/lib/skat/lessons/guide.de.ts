// Der Einstiegstext der Lektionen auf Deutsch (SKATGO-29): Fragetitel, H1, Meta-Beschreibung und die
// 100–200 Wörter, die eine Lektionsseite über dem interaktiven Teil auf dem Server rendert. Begriffe
// wie in content.de.ts; jede Aussage lehrt die Lektion selbst, und die Engine spielt sie so.

import type { LessonGuide } from '../rules/types'

export const GUIDE_DE: Record<string, LessonGuide> = {
  '1': {
    slug: 'wie-funktioniert-skat',
    question: 'Wie funktioniert Skat? Spieler, Karten und Ziel',
    h1: 'Wie Skat funktioniert: drei Spieler, 32 Karten',
    description:
      'Skat kurz erklärt: drei Spieler, 32 Karten, zehn für jeden und zwei im Skat. Ein Alleinspieler spielt gegen zwei Gegenspieler und braucht 61 von 120 Augen.',
    intro: [
      'Skat ist das deutsche Nationalkartenspiel, ein Stichspiel für drei Personen. Gespielt wird mit **32 Karten**: vier Farben ♣ ♠ ♥ ♦ mit je 7, 8, 9, 10, Bube, Dame, König und Ass. Jeder bekommt **zehn Karten**, die letzten **zwei** liegen verdeckt in der Mitte. Das ist der **Skat**, nach dem das Spiel heißt.',
      'In jedem Spiel heißt es **einer gegen zwei**. Beim Reizen wird entschieden, wer allein spielt: Der **Alleinspieler** bekommt den Skat und sagt das Spiel an. Die anderen beiden sind die **Gegenspieler** und halten für dieses eine Spiel zusammen. Im nächsten Spiel wird neu gereizt.',
      'Dann folgen zehn Stiche. Die Karten darin haben **Augen**, im ganzen Blatt 120, und der Alleinspieler braucht **mindestens 61**. 60 zu 60 reicht nicht: Genau die Hälfte ist verloren. In dieser Lektion lernst du das alles und prüfst es gleich mit ein paar kurzen Fragen.',
    ],
    rule: 'dealing',
  },
  '2': {
    slug: 'welche-karte-zaehlt-wie-viele-augen',
    question: 'Welche Karte zählt beim Skat wie viele Augen?',
    h1: 'Augen beim Skat: welche Karten zählen',
    description:
      'Die Augen beim Skat: Ass 11, Zehn 10, König 4, Dame 3, Bube 2, und 7, 8, 9 zählen nichts. Warum die Zehn über dem König steht und wie 120 Augen zusammenkommen.',
    intro: [
      'Wer beim Skat einen Stich bekommt, gewinnt nicht einfach „einen Stich“, sondern die **Augen** seiner drei Karten. Nur fünf Kartenwerte zählen: **Ass 11, Zehn 10, König 4, Dame 3, Bube 2**. Siebenen, Achten und Neunen sind nichts wert und heißen Luschen.',
      'Jede Farbe hat zusammen 30 Augen, das ganze Blatt also **120**, und der Alleinspieler braucht davon 61. Deshalb ist Zählen die eigentliche Kunst: Ein einziger Stich mit Ass und Zehn bringt mehr als drei Stiche voller Luschen.',
      'Für Neulinge eine Überraschung: Die **Zehn ist die zweithöchste Karte**, direkt unter dem Ass und über dem König, bei den Augen wie im Rang. Eine Fehlfarbe geht von oben nach unten A, 10, K, D, 9, 8, 7. Hier übst du das Zusammenzählen, bis es auf einen Blick klappt.',
    ],
    rule: 'cards',
  },
  '3': {
    slug: 'was-ist-trumpf-beim-skat',
    question: 'Was ist Trumpf beim Skat? Die Buben und die Reihenfolge',
    h1: 'Trumpf beim Skat und die vier Buben',
    description:
      'Beim Skat sind die vier Buben immer die höchsten Trümpfe: ♣B, ♠B, ♥B, ♦B. Danach kommen A, 10, K, D, 9, 8, 7 der Trumpffarbe, elf Trümpfe im Farbspiel.',
    intro: [
      'Sagt der Alleinspieler eine Farbe als **Trumpf** an, sticht jede Karte dieser Farbe jede Karte der anderen Farben. Eine Trumpf-7 sticht das Ass einer Fehlfarbe. Das ist das ganze Vorrecht des Trumpfs, und es entscheidet die meisten Spiele.',
      'Darüber steht die berühmteste Regel beim Skat: **Die vier Buben sind immer Trumpf, und zwar die vier höchsten**, egal welche Farbe gewählt wird. Untereinander gilt ♣B, ♠B, ♥B, ♦B; der Kreuz-Bube ist die höchste Karte im Spiel. Unter den Buben folgen Ass, Zehn, König, Dame, 9, 8 und 7 der Trumpffarbe. Ein Farbspiel hat also **elf Trümpfe**.',
      'Der Haken: Ein Bube gehört nicht mehr zu der Farbe, die auf ihm steht. Im Herzspiel ist der ♣B kein Kreuz, sondern Trumpf. In dieser Lektion suchst du die Trümpfe aus einem Blatt heraus und ordnest sie, bis die Reihenfolge sitzt.',
    ],
    rule: 'games',
  },
  '4': {
    slug: 'wie-bedient-man-beim-skat',
    question: 'Wie bedient man beim Skat? Wer den Stich bekommt',
    h1: 'Bedienen und Stiche gewinnen beim Skat',
    description:
      'Bedienen beim Skat: Hast du die ausgespielte Farbe, musst du sie spielen. Buben zählen als Trumpf, und der höchste Trumpf oder die höchste Farbkarte gewinnt.',
    intro: [
      'Jeder Stich beginnt damit, dass einer **ausspielt**. Die Farbe dieser Karte ist die Farbe des Stichs, und die anderen beiden geben im Uhrzeigersinn zu. Dabei gilt eine feste Regel: **Hast du eine Karte der ausgespielten Farbe, musst du sie spielen** – du musst **bedienen**. Welche, entscheidest du; höher spielen musst du nicht.',
      'Nur wer die Farbe nicht hat, darf jede Karte legen: mit Trumpf **stechen** oder eine unnütze Karte **abwerfen**. Trümpfe gelten als eine Farbe, deshalb bedienen Buben Trumpf und nie die Farbe, die auf ihnen steht. Das ist der häufigste Anfängerfehler, und diese Lektion nimmt ihn sich gezielt vor.',
      'Wem gehört der Stich? Liegt ein Trumpf darin, gewinnt der höchste Trumpf. Sonst gewinnt die höchste Karte der ausgespielten Farbe; eine abgeworfene Karte gewinnt nie. Wer den Stich bekommt, nimmt die drei Karten und spielt zum nächsten Stich aus.',
    ],
    rule: 'games',
  },
  '5': {
    slug: 'was-sind-grand-und-null',
    question: 'Was sind Grand und Null beim Skat?',
    h1: 'Grand und Null: die beiden anderen Spielarten',
    description:
      'Neben den vier Farbspielen gibt es beim Skat den Grand, in dem nur die Buben Trumpf sind, und Null, bei dem der Alleinspieler keinen Stich bekommen darf.',
    intro: [
      'Der Alleinspieler muss nicht unbedingt eine Farbe ansagen. Beim Skat gibt es drei Spielarten: **Farbspiele**, in denen eine Farbe Trumpf ist, den **Grand** und das **Nullspiel**.',
      'Im **Grand** sind nur die vier Buben Trumpf, ♣B ♠B ♥B ♦B. Alle vier Farben sind Fehlfarben, jede in der Reihenfolge A, 10, K, D, 9, 8, 7. Der Alleinspieler braucht weiterhin 61 Augen. Der Grand ist das wertvollste Spiel und will viele Buben und Asse.',
      '**Null** stellt alles auf den Kopf. Es gibt keinen Trumpf, Augen zählen nicht, und der Alleinspieler gewinnt nur, wenn er **keinen einzigen Stich** bekommt: Der erste Stich, den er nimmt, beendet das Spiel als verloren. Die Buben kehren in ihre Farben zurück, und die Reihenfolge lautet A, K, D, B, 10, 9, 8, 7 – die Zehn rutscht unter den Buben. Ein Blatt voller Siebenen und Achten kann ein wunderschöner Null sein. Hier übst du Stiche in beiden Spielen.',
    ],
    rule: 'games',
  },
  '6': {
    slug: 'wie-berechnet-man-den-spielwert',
    question: 'Wie berechnet man den Spielwert beim Skat?',
    h1: 'Den Spielwert beim Skat ausrechnen',
    description:
      'Spielwert beim Skat = Grundwert × Stufe. Die Grundwerte von Farbspielen und Grand, Spitzen „mit“ und „ohne“ vom Kreuz-Buben an, dazu Spiel und Extras.',
    intro: [
      'Jedes Spiel beim Skat hat einen **Spielwert**, und Reizen heißt nichts anderes, als Spielwerte zu nennen. Deshalb ist diese Rechnung so wichtig: **Grundwert × Stufe**. Der Grundwert hängt vom Spiel ab: ♦ Karo 9, ♥ Herz 10, ♠ Pik 11, ♣ Kreuz 12, Grand 24. Null ist anders und hat eigene feste Werte.',
      'Die Stufe beginnt mit den **Spitzen**. Leg die Trümpfe vom ♣B abwärts in eine Reihe. Hast du den ♣B, spielst du **mit** so vielen Trümpfen, wie du lückenlos von oben hast; fehlt er dir, spielst du **ohne** so viele, wie dir von oben fehlen. Beides zählt gleich, und der Skat gehört beim Zählen zu den Karten des Alleinspielers.',
      'Dazu kommt **1 für „Spiel“** und mögliche Extras wie Hand oder Schneider. Herzspiel mit ♣B ♠B, aber ohne ♥B: mit 2, Spiel 3, 10 × 3 = **30**. Du übst, bis das Zählen schnell geht.',
    ],
    rule: 'value',
  },
  '7': {
    slug: 'wie-reizen-funktioniert',
    question: 'Wie Reizen beim Skat funktioniert: die Reizwerte',
    h1: 'Wie Reizen beim Skat funktioniert',
    description:
      'Reizen beim Skat Schritt für Schritt: Mittelhand reizt Vorhand, Hinterhand fordert den Sieger, die Antwort ist Ja oder Passe, und nur echte Spielwerte zählen.',
    intro: [
      'Beim Reizen wird entschieden, wer Alleinspieler wird. Jeder Reizwert ist eine Zahl und heißt: **Das Spiel, das ich vorhabe, ist mindestens so viel wert.** Bevor du reizt, rechnest du also aus, was dein Blatt wert ist. Das ist deine Grenze.',
      'Gereizt wird in zwei Duellen. Links vom Geber sitzt **Vorhand**, danach kommt **Mittelhand**, und der Geber selbst ist **Hinterhand**. Zuerst **reizt Mittelhand Vorhand**: Mittelhand sagt die Zahlen, Vorhand antwortet **„Ja“** oder **„Passe“**. Dann **reizt Hinterhand den Sieger**. Wer übrig bleibt, ist Alleinspieler, und sein Spiel muss mindestens den letzten Reizwert erreichen.',
      'Gereizt werden nur Werte, die ein Spiel wirklich haben kann: 18, 20, 22, 23, 24, 27, 30 und so weiter. Reizt niemand, nicht einmal Vorhand bei 18, wird eingepasst und neu gegeben. In dieser Lektion verfolgst du echtes Reizen und lernst, wann du passen solltest.',
    ],
    rule: 'bidding',
  },
  '8': {
    slug: 'was-tun-mit-dem-skat',
    question: 'Was tun mit dem Skat? Drücken und Handspiel',
    h1: 'Skat aufnehmen, drücken oder Hand spielen',
    description:
      'Was der Alleinspieler mit den zwei Skatkarten macht: aufnehmen und zwei Karten drücken oder Hand spielen, ohne hinzusehen. Welche Karten du drückst und warum.',
    intro: [
      'Wer das Reizen gewinnt, bekommt die beiden verdeckten Skatkarten. Meist **nimmst du sie auf**, hast dann zwölf Karten und **drückst zwei beliebige** verdeckt weg, bevor du dein Spiel ansagst. Die gedrückten Karten spielen nicht mit, aber ihre Augen zählen für dich – ein Guthaben vor dem ersten Stich.',
      'Welche zwei? Drei Faustregeln: Augen sichern, indem du eine blanke Zehn drückst, die ein Ass fangen könnte; eine Farbe **blank machen**, damit du sie später stechen kannst; und niemals Trümpfe oder Asse drücken.',
      'Ist dein Blatt schon stark genug, spielst du **Hand**: Du lässt den Skat liegen und spielst mit den zehn Karten, die du bekommen hast, und bekommst dafür eine Stufe mehr. Der Skat zählt trotzdem für dich, auch beim Zählen der Spitzen. Genau das ist das Risiko: Ein Bube im Skat kann deinen Spielwert nach dem Spiel verändern.',
    ],
    rule: 'extras',
  },
  '9': {
    slug: 'wie-rechnet-man-skat-ab',
    question: 'Wie rechnet man Skat ab? Schneider, Schwarz, überreizt',
    h1: 'Abrechnung beim Skat: Schneider, Schwarz und überreizte Spiele',
    description:
      'So wird ein Skatspiel abgerechnet: Gewonnen zählt der Spielwert, verloren das Doppelte. Dazu Schneider, Schwarz, Ansagen im Handspiel, Nullwerte, Überreizen.',
    intro: [
      'Nach dem letzten Stich wird abgerechnet. Gewinnt der Alleinspieler, bekommt er den Spielwert gutgeschrieben. Verliert er, werden ihm **zweimal der Spielwert** abgezogen. Ein verlorenes Spiel kostet doppelt so viel, wie ein gewonnenes bringt – ein guter Grund, mit Bedacht zu reizen.',
      'Hohe Ergebnisse bringen mehr Stufen. **Schneider**: Die verlierende Seite hat 30 Augen oder weniger, eine Stufe mehr. **Schwarz**: Die verlierende Seite bekommt keinen Stich, noch eine Stufe. Das gilt in beide Richtungen: Ein Alleinspieler mit 30 Augen oder weniger zahlt den Schneider selbst. Beim Handspiel darf der Alleinspieler außerdem Schneider oder Schwarz **ansagen** oder **ouvert** spielen, also offen. Jede Ansage bringt eine Stufe mehr, aber wer sie verfehlt, verliert.',
      'Und das **Überreizen**: Ist das Spiel am Ende weniger wert als gereizt, ist es verloren, egal wie viele Augen. Gewertet wird das kleinste Vielfache des Grundwerts, das den Reizwert erreicht. In dieser Lektion rechnest du fertige Spiele selbst ab.',
    ],
    rule: 'scoring',
  },
  '10': {
    slug: 'wie-spielt-man-gut-skat',
    question: 'Wie spielt man gut Skat? Tipps für beide Seiten',
    h1: 'Richtig spielen: Grundlagen für Allein- und Gegenspieler',
    description:
      'Skat-Taktik für Einsteiger: Als Alleinspieler erst Trumpf ziehen, dann Asse holen; als Gegenspieler dem Partner schmieren und nicht selbst Trumpf ausspielen.',
    intro: [
      'Zu wissen, welche Karten erlaubt sind, ist erst der Anfang; hier geht es darum, **warum** du eine Karte spielst. Der Alleinspieler fürchtet am meisten, dass ein Gegner sein Ass mit einem kleinen Trumpf sticht. Deshalb ist der übliche Plan, zuerst **Trumpf zu ziehen**: hohe Trümpfe ausspielen, bis die Gegenspieler keine mehr haben, und dann die Asse und Zehnen der Fehlfarben in Ruhe kassieren. Ein Farbspiel hat elf Trümpfe, also verrät dir das Zählen, wie viele noch draußen sind.',
      'Die Gegenspieler zählen ihre Augen zusammen, deshalb ist ihr wichtigster Zug das **Schmieren**: Bekommt dein Partner den Stich, leg deine fetteste Karte dazu; bekommt ihn der Alleinspieler, wirf deine billigste Lusche ab. Gegenspieler **spielen meist nicht selbst Trumpf aus**, denn damit erledigen sie die Arbeit des Alleinspielers.',
      'Und eine Gewohnheit für alle: Wer als Letzter zum Stich legt, gewinnt ihn mit der kleinsten Karte, die gerade reicht.',
    ],
    rule: 'games',
  },
  '11': {
    slug: 'bereit-fuer-eine-echte-partie',
    question: 'Bereit für eine echte Partie Skat? Das Abschlussspiel',
    h1: 'Abschlussspiel: eine ganze Partie Skat',
    description:
      'Alles zusammen in einer kompletten Partie Skat gegen zwei Computergegner: Reizen, Skat, Ansagen, zehn Stiche und Abrechnung, mit Tipps, wann immer du willst.',
    intro: [
      'Jetzt geht es an den Tisch. Diese Lektion ist **ein komplettes Spiel** gegen zwei Computergegner, vom ersten Reizwert bis zur Abrechnung. Du reizt mit, und gewinnst du das Reizen, nimmst du den Skat auf oder spielst Hand, drückst zwei Karten und sagst dein Spiel an. Dann folgen zehn Stiche, und das Ergebnis wird so abgerechnet wie an einem echten Skattisch.',
      'Vorher gibt es einen kurzen Spickzettel: Augen, Trumpfreihenfolge, Bedienen, Grundwerte, wie sich der Spielwert zusammensetzt und wer wen reizt. Während des Spiels kannst du jederzeit einen **Tipp** holen; er nennt dir eine Karte und sagt dir, warum.',
      'Ob gewonnen oder verloren: Wenn das Spiel vorbei ist, hast du die Lektion geschafft. Aus einem verlorenen Spiel lernst du mehr als aus einem gewonnenen, und danach bist du bereit für einen echten Skattisch.',
    ],
    rule: 'scoring',
  },
}
