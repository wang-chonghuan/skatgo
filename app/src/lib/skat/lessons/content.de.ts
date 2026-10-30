// Der Kurs auf Deutsch — dieselben elf Lektionen, Karten und Antworten wie content.en.ts
// (lessons.test.ts hält beide Sprachen daran fest). Begriffe nach der Internationalen Skatordnung
// (DSkV): Alleinspieler, Gegenspieler, Vorhand / Mittelhand / Hinterhand, Stich, Augen, reizen,
// drücken, Spitzen „mit / ohne“. Karten werden wie auf dem Turnierblatt zitiert (♣B = Kreuz-Bube,
// ♠D = Pik-Dame); Lektion 1 nennt einmal die internationalen Buchstaben J und Q dazu (SKATGO-76).
// Entscheidungen und Quellen: .intentfold/tickets/SKATGO-1/terms.md.
//
// SKATGO-161: Eine Lektion verwendet nur, was sie und die Lektionen davor lehren (concepts.ts, geprüft
// von lessons.test.ts), zeigt vor der ersten Frage höchstens zwei Erklärkarten und endet mit ihrer
// Abschlussaufgabe – ihrem Versprechen, an echten Karten erfüllt.

import { cards } from '../cards'
import {
  countPointsDrill,
  dealDrill,
  gameValueDrill,
  legalDrill,
  matadorDrill,
  orderDrill,
  pickTrumpsDrill,
  settleDrill,
  settlePileDrill,
  sumDrill,
  trickWinnerDrill,
} from './drills'
import { gen, times } from './build'
import type { Lesson } from './types'

export const LESSONS_DE: Lesson[] = [
  {
    id: '1',
    title: 'Drei Spieler, 32 Karten',
    promise: 'Wissen, worum es beim Skat geht: wer gegen wen spielt, worum und wie man gewinnt.',
    learned: 'ein Skatblatt geben, und du weißt, wer gegen wen spielt und was man zum Gewinnen braucht.',
    minutes: 1,
    steps: [
      {
        kind: 'teach',
        title: '32 Karten',
        body: [
          'Skat ist ein Kartenspiel für drei Personen mit **32 Karten**: vier Farben ♣ ♠ ♥ ♦ mit je acht Karten **7, 8, 9, 10, B, D, K, A** – so steht es auf dem deutschen Turnierblatt, mit dem hier gespielt wird.',
          'Auf einem internationalen Kartenspiel steht beim **Buben** ein **J** (Jack) und bei der **Dame** ein **Q** (Queen). Gemeint sind dieselben Karten: **B = J**, **D = Q**.',
        ],
        rows: [{ label: 'Alle acht Karten einer Farbe', cards: cards('H:7 8 9 10 J Q K A') }],
      },
      { kind: 'choice', prompt: 'Wie viele Karten hat ein Skatblatt?', options: ['52', '36', '32', '24'], answer: 2, explain: 'Vier Farben × acht Karten (7 bis Ass) = 32 Karten.' },
      {
        kind: 'teach',
        title: 'Einer gegen zwei',
        body: [
          'In jedem Spiel spielt einer allein: der **Alleinspieler**. Die anderen beiden tun sich für dieses Spiel als **Gegenspieler** zusammen. Wer allein spielt, wird in jedem Spiel neu entschieden.',
          'Ein Spiel hat zehn **Stiche**. Im Stich legt jeder eine Karte, und wessen Karte gewinnt, der nimmt alle drei.',
        ],
      },
      { kind: 'choice', prompt: 'Wie werden die Seiten in einem Spiel gebildet?', options: ['Jeder spielt für sich', '1 Alleinspieler gegen 2 Gegenspieler', '2 gegen 2, einer schaut zu', 'Feste Partner'], answer: 1, explain: 'In jedem Spiel spielt der Alleinspieler gegen die beiden anderen. Feste Partner gibt es nicht – im nächsten Spiel spielst vielleicht du allein.' },
      {
        kind: 'teach',
        title: 'Worum es geht',
        body: [
          'Die Karten zählen **Augen**, im ganzen Blatt **120**. Nach den zehn Stichen zählt der Alleinspieler die Augen in seinen Stichen zusammen.',
          'Er braucht **61** – mehr als die Hälfte. Mit 60 gewinnen die Gegenspieler.',
        ],
      },
      { kind: 'choice', prompt: 'Alle Augen im Blatt ergeben zusammen 120. Wie viele braucht der Alleinspieler mindestens zum Gewinnen?', options: ['60', '61', '90', '100'], answer: 1, explain: '61 – knapp mehr als die Hälfte. Bei 60 : 60 verliert der Alleinspieler.', hint: 'Denk an „mehr als die Hälfte“ – reicht genau die Hälfte?' },
      {
        kind: 'teach',
        title: 'Das Geben: 10 + 10 + 10 + 2',
        body: [
          'Jeder bekommt **zehn Karten**, und **zwei** liegen verdeckt in der Mitte: der **Skat**, nach dem das Spiel heißt. Der Skat gehört dem Alleinspieler.',
          'Am echten Tisch wird in Päckchen gegeben, im Uhrzeigersinn links vom Geber beginnend: **je 3, 2 in den Skat, je 4, je 3**.',
        ],
        rows: [{ label: 'Der Skat', cards: cards('C:7 8'), faceDown: true }],
      },
      gen(dealDrill),
    ],
  },
  {
    id: '2',
    title: 'Augen: welche Karten zählen',
    promise: 'Auf einen Blick sehen, wie viele Augen ein Stich hat.',
    learned: 'die Augen eines Stichs auf einen Blick zählen.',
    minutes: 1,
    steps: [
      {
        kind: 'teach',
        title: 'Nur fünf Kartenwerte zählen',
        body: ['Ein Stich bringt dir die **Augen** seiner drei Karten. Nur fünf Kartenwerte zählen: **A 11 · 10 10 · K 4 · D 3 · B 2**. 7, 8 und 9 sind nichts wert und heißen **Luschen**.'],
        rows: [{ cards: cards('S:A 10 K Q J 9 8 7'), captions: ['11', '10', '4', '3', '2', '0', '0', '0'] }],
        tip: 'Achtung: Die **Zehn zählt 10**, viel mehr als der König, der nur 4 zählt. Jede Farbe hat 30 Augen, das ganze Blatt also **120**.',
      },
      { kind: 'choice', prompt: 'Welche dieser Karten hat die meisten Augen?', options: ['K', 'D', '10', 'B'], answer: 2, explain: 'Die Zehn zählt 10 Augen, nur das Ass mit 11 zählt mehr. Der König hat bloß 4.' },
      ...times(3, countPointsDrill),
      { kind: 'choice', prompt: 'Wie viele Augen kann ein einzelner Stich höchstens haben?', options: ['22', '30', '32', '33'], answer: 3, explain: 'Drei Asse: 11 + 11 + 11 = **33** Augen. Selten, aber es kommt vor.', hint: 'Welche Karte zählt am meisten – und wie viele Karten hat ein Stich?' },
      ...times(2, sumDrill),
    ],
  },
  {
    id: '3',
    title: 'Trumpf und die vier Buben',
    promise: 'In jedem Spiel die Trümpfe erkennen – und wer wen sticht.',
    learned: 'die Trümpfe eines Blatts finden und sagen, welche Karte welche sticht.',
    minutes: 1,
    steps: [
      {
        kind: 'teach',
        title: 'Trumpf sticht alles',
        body: [
          'Vor dem Spiel bestimmt der Alleinspieler eine Farbe als **Trumpf** – ein **Farbspiel**, zum Beispiel ein Herzspiel. Jeder Trumpf sticht jede Karte der drei anderen Farben, der **Fehlfarben**: Eine Trumpf-7 sticht ein Ass.',
          'Innerhalb einer Farbe gilt die Reihenfolge **A, 10, K, D, 9, 8, 7** – die Zehn direkt unter dem Ass.',
        ],
        rows: [{ label: 'Eine Farbe von hoch nach niedrig', cards: cards('D:A 10 K Q 9 8 7') }],
      },
      { kind: 'choice', prompt: 'Herz ist Trumpf. Welche Karte ist höher?', options: ['♠A', '♥7'], answer: 1, explain: 'Die ♥7 ist Trumpf, und jeder Trumpf sticht jede Karte einer Fehlfarbe – auch ein Ass.' },
      {
        kind: 'teach',
        title: 'Die vier Buben: immer ganz oben',
        body: [
          'Die berühmteste Regel beim Skat: **Die vier Buben sind immer Trumpf, und zwar die vier höchsten** – egal, welche Farbe der Alleinspieler wählt.',
          'Untereinander gilt: **♣B > ♠B > ♥B > ♦B**. Der Kreuz-Bube ist die höchste Karte im Spiel; man nennt ihn „den Alten“.',
        ],
        rows: [{ label: 'Höchster → niedrigster', cards: cards('C:J | S:J | H:J | D:J'), captions: ['1.', '2.', '3.', '4.'] }],
      },
      {
        kind: 'teach',
        title: 'Beispiel Herz: 11 Trümpfe',
        body: ['Im Herzspiel gibt es **11 Trümpfe**: die vier Buben, dann Herz-Ass, -10, -König, -Dame, -9, -8, -7. Jede Fehlfarbe behält ihre 7 Karten.'],
        rows: [{ cards: cards('C:J | S:J | H:J | D:J | H:A 10 K Q 9 8 7') }],
        tip: 'Der ♥B steht an dritter Stelle, weil er ein Bube ist, nicht weil er Herz ist. Und im Herzspiel ist der ♣B **kein Kreuz** – er ist Trumpf.',
      },
      { kind: 'choice', prompt: 'Wie viele Trümpfe gibt es in einem Farbspiel?', options: ['8', '10', '11', '12'], answer: 2, explain: '4 Buben + die übrigen 7 Karten der Trumpffarbe (A 10 K D 9 8 7) = **11**. Die drei Fehlfarben haben je 7 Karten.' },
      ...times(3, () => pickTrumpsDrill()),
      ...times(2, () => orderDrill()),
    ],
  },
  {
    id: '4',
    title: 'Bedienen und Stiche gewinnen',
    promise: 'Wissen, welche Karten du spielen darfst – und wem der Stich gehört.',
    learned: 'nur erlaubte Karten spielen und sagen, wem ein Stich gehört.',
    minutes: 2,
    steps: [
      {
        kind: 'teach',
        title: 'Hast du die Farbe, musst du sie spielen',
        body: [
          'Wer die erste Karte eines Stichs legt, **spielt aus**; ihre Farbe ist die Farbe des Stichs. Die anderen beiden legen im Uhrzeigersinn dazu, und **wer diese Farbe hat, muss sie spielen** – man sagt: Farbe **bedienen**. Hoch oder niedrig, wie du willst.',
          'Hier ist **Kreuz Trumpf**, und ein Gegner spielt das ♥A aus. Du hast Herz, also kommt eine deiner beiden Herzkarten:',
        ],
        rows: [
          { label: 'Ausgespielt', cards: cards('H:A') },
          { label: 'Deine Karten: ✓ erlaubt, ✗ nicht erlaubt', cards: cards('H:10 7 | S:K | D:9'), follow: { contract: { kind: 'suit', trump: 'C' }, lead: cards('H:A')[0] } },
          { label: 'Ohne eine einzige Herzkarte darfst du jede Karte spielen', cards: cards('C:8 | S:K | D:9'), captions: ['stechen', 'abwerfen', 'abwerfen'] },
        ],
        tip: 'Hast du die ausgespielte Farbe nicht, darfst du alles spielen: einen Trumpf, um den Stich zu holen (**stechen**), oder eine Karte, die du nicht brauchst (**abwerfen**). Höher spielen muss niemand.',
      },
      {
        kind: 'teach',
        title: 'Ein Bube bedient Trumpf, nicht seine Farbe',
        body: [
          'Die vier Buben sind Trumpf, deshalb gehört ein Bube **nicht zu der Farbe, die auf ihm steht**. Hier ist **Herz Trumpf**, und nur die ausgespielte Karte ändert sich:',
          '**♣A ausgespielt** → nur ein echtes Kreuz bedient: die ♣7. Auf dem ♣B steht zwar Kreuz, aber er ist Trumpf.',
          '**♥A ausgespielt** → Trumpf ist gefragt: der ♣B oder die ♥9.',
        ],
        rows: [
          { label: 'Wenn ♣A ausgespielt wird', cards: cards('C:J 7 | H:9 | D:K'), follow: { contract: { kind: 'suit', trump: 'H' }, lead: cards('C:A')[0] } },
          { label: 'Wenn ♥A ausgespielt wird', cards: cards('C:J 7 | H:9 | D:K'), follow: { contract: { kind: 'suit', trump: 'H' }, lead: cards('H:A')[0] } },
        ],
        tip: 'Der häufigste Fehler im ganzen Kurs. Frag dich vor jedem Zugeben: „Als welche Farbe zählt die ausgespielte Karte?“',
      },
      {
        kind: 'play',
        prompt: 'Spiel: **Herz ♥**. Ein Gegner spielt ♣A aus. Welche Karte spielst du?',
        contract: { kind: 'suit', trump: 'H' },
        hand: cards('C:J 7 | H:9 | D:A K'),
        trick: cards('C:A'),
        trickBy: ['Gegner'],
        explain: 'Dein einziges echtes Kreuz ist die ♣7, also darfst du nur sie spielen. Der ♣B ist Trumpf, kein Kreuz.',
      },
      {
        kind: 'teach',
        title: 'Wem gehört der Stich?',
        body: [
          '**Jemand hat Trumpf gespielt** → der höchste Trumpf gewinnt.',
          '**Niemand hat Trumpf gespielt** → die höchste Karte **der ausgespielten Farbe** gewinnt. Eine andere Farbe gewinnt nie, egal wie hoch.',
          'Wer gewinnt, nimmt die drei Karten (ihre Augen zählen für seine Seite) und **spielt zum nächsten Stich aus**.',
        ],
      },
      ...times(3, () => legalDrill()),
      ...times(3, () => trickWinnerDrill()),
      {
        kind: 'play',
        prompt: 'Spiel: **Pik ♠**, du bist Alleinspieler. Die beiden Gegenspieler haben ♣10 und ♣K gelegt, du bist dran. Welche Karte spielst du?',
        contract: { kind: 'suit', trump: 'S' },
        hand: cards('S:9 | H:A 7 | D:K'),
        trick: cards('C:10 K'),
        trickBy: ['Gegenspieler', 'Gegenspieler'],
        best: cards('S:9'),
        whyNot: 'Die Karte ist erlaubt (du hast kein Kreuz, also darfst du alles spielen), aber es liegen 14 Augen auf dem Tisch, und du hast Trumpf – stich den Stich.',
        explain: 'Du hast kein Kreuz, also darfst du stechen. Die kleine ♠9 holt ♣10 und ♣K zusammen: 14 Augen für dich.',
      },
    ],
  },
  {
    id: '5',
    title: 'Grand und Null',
    promise: 'Die beiden anderen Spielarten beherrschen: Grand, in dem nur die Buben Trumpf sind, und Null, in dem man keinen Stich bekommen darf.',
    learned: 'Grand und Null spielen und wissen, was in beiden sticht.',
    minutes: 2,
    steps: [
      {
        kind: 'teach',
        title: 'Drei Spielarten',
        body: [
          'Außer den vier **Farbspielen** kann der Alleinspieler noch zwei wählen:',
          '**Grand** – nur die vier Buben sind Trumpf.',
          '**Null** – gar kein Trumpf, und das Ziel des Alleinspielers ist umgedreht: keinen einzigen Stich bekommen.',
        ],
      },
      {
        kind: 'teach',
        title: 'Grand: nur die Buben zählen',
        body: [
          'Im Grand sind nur die vier Buben **♣B ♠B ♥B ♦B** Trumpf. Alle vier Farben sind Fehlfarben, jede in der Reihenfolge A, 10, K, D, 9, 8, 7.',
          'Der Alleinspieler braucht weiter 61. Der Grand passt zu einem Blatt mit vielen Buben und Assen.',
        ],
        rows: [{ label: 'Alle Trümpfe im Grand', cards: cards('C:J | S:J | H:J | D:J') }],
      },
      gen(() => pickTrumpsDrill({ kind: 'grand' })),
      ...times(2, () => trickWinnerDrill({ kind: 'grand' })),
      {
        kind: 'teach',
        title: 'Null: bloß keinen Stich',
        body: [
          'Im Null **verliert der Alleinspieler, sobald er einen Stich bekommt**; nur wer gar keinen bekommt, gewinnt. Augen spielen keine Rolle.',
          'Es gibt **keinen Trumpf**: Jeder Bube kehrt in seine Farbe zurück, und jede Farbe geht **A, K, D, B, 10, 9, 8, 7** – die Zehn rutscht unter den Buben.',
        ],
        rows: [{ label: 'Eine Farbe im Null, von hoch nach niedrig', cards: cards('S:A K Q J 10 9 8 7') }],
        tip: 'Nur Siebenen, Achten und Neunen auf der Hand? Nicht seufzen – das kann ein wunderschöner Null sein.',
      },
      ...times(2, () => orderDrill({ kind: 'null' })),
      ...times(2, () => trickWinnerDrill({ kind: 'null' })),
      {
        kind: 'play',
        prompt: 'Spiel: **Null**, du bist Alleinspieler. Ein Gegenspieler spielt ♣9 aus. Du hast drei Kreuzkarten – welche ist die beste?',
        contract: { kind: 'null' },
        hand: cards('C:Q 8 7 | H:7 8 | D:9'),
        trick: cards('C:9'),
        trickBy: ['Gegenspieler'],
        best: cards('C:8'),
        whyNot: 'Erlaubt, aber nicht die beste. Die ♣D liegt über der ♣9 – du könntest den Stich bekommen und sofort verlieren. Die ♣7 ist sicher, verschenkt aber die Gelegenheit, eine höhere Karte loszuwerden.',
        explain: 'Spiel **die höchste Karte, die noch unter dem Tisch liegt**: Die ♣8 entgeht dem Stich, und die ♣7 bleibt dir als Rettungskarte für später.',
      },
    ],
  },
  {
    id: '6',
    title: 'Was ein Spiel wert ist',
    promise: 'Den Wert jedes Blattes ausrechnen.',
    learned: 'aus deinen Karten ausrechnen, was ein Spiel wert ist.',
    minutes: 2,
    steps: [
      {
        kind: 'teach',
        title: 'Spielwert = Grundwert × Stufe',
        body: [
          'Jedes Spiel hat einen **Grundwert**: **♦ Karo 9 · ♥ Herz 10 · ♠ Pik 11 · ♣ Kreuz 12 · Grand 24**.',
          'Wert ist es den Grundwert mal einer **Stufe**: die **Spitzen**, plus 1 für das **Spiel**. Ein **Null** wird nie multipliziert: Er ist **23** wert.',
        ],
      },
      {
        kind: 'teach',
        title: 'Spitzen: vom ♣B abwärts zählen',
        body: [
          'Leg die Trümpfe von hoch nach niedrig in eine Reihe: ♣B, ♠B, ♥B, ♦B, dann A, 10, K … der Trumpffarbe.',
          '**Du hast den ♣B** → zähl, wie viele Trümpfe du von ihm an **lückenlos** hast: Du spielst „**mit** so vielen“. ♣B ♠B, aber kein ♥B = mit 2.',
          '**Dir fehlt der ♣B** → zähl, wie viele Trümpfe dir von oben an **fehlen**: Du spielst „**ohne** so viele“. ♣B ♠B fehlen, ♥B hast du = ohne 2. Beides zählt gleich.',
        ],
        rows: [
          { label: 'Mit 2 (Lücke beim ♥B)', cards: cards('C:J | S:J | D:J | H:A') },
          { label: 'Ohne 2 (erst ab ♥B vorhanden)', cards: cards('H:J | D:J | H:A 10') },
        ],
      },
      ...times(3, matadorDrill),
      {
        kind: 'teach',
        title: 'Alles zusammen',
        body: [
          'Herz mit ♣B ♠B, aber ohne ♥B: **mit 2, Spiel 3** → 10 × 3 = **30**.',
          'Kreuz ganz ohne Buben, dein höchster Trumpf ist das ♣A: **ohne 4, Spiel 5** → 12 × 5 = **60**.',
        ],
        tip: 'Am Tisch rechnet man genau so laut vor: „Mit zwei, Spiel drei, mal zehn: dreißig.“',
      },
      ...times(3, () => gameValueDrill()),
      { kind: 'choice', prompt: 'Was ist ein Null wert?', options: ['18', '23', '24', 'Kommt auf die Spitzen an'], answer: 1, explain: 'Ein Null hat keine Spitzen und keine Stufe: Er ist immer **23** wert.' },
      gen(() => gameValueDrill()),
    ],
  },
  {
    id: '7',
    title: 'Reizen',
    promise: 'Das Tischgespräch „18?“ – „Ja.“ „20?“ – „Passe.“ verstehen und mitreden.',
    learned: 'beim Reizen mitmachen: bis zum Wert deines Spiels mithalten und darüber passen.',
    minutes: 2,
    steps: [
      {
        kind: 'teach',
        title: 'Was gereizt wird',
        body: [
          'Wer Alleinspieler wird, entscheidet das **Reizen**. Gereizt werden **Zahlen**, und jede heißt: „Das Spiel, das ich spielen würde, ist mindestens so viel wert.“ Wer am höchsten reizt, wird Alleinspieler.',
          'Deine Grenze ist also **der Wert deines Spiels** – die Rechnung aus der letzten Lektion. Der kleinste Reizwert ist **18** (Karo mit oder ohne 1: 9 × 2).',
        ],
      },
      {
        kind: 'teach',
        title: 'Nur echte Werte',
        body: [
          'Gereizt werden dürfen nur Zahlen, die ein Spiel wirklich wert sein kann:',
          '**18 · 20 · 22 · 23 · 24 · 27 · 30 · 33 …**',
          'Das sind die Vielfachen von 9, 10, 11, 12 und 24, dazu die 23 des Null.',
        ],
      },
      { kind: 'choice', prompt: 'Welche Zahl darf nach „18“ als Nächstes gereizt werden?', options: ['19', '20', '21', '24'], answer: 1, explain: '20 = Herz 10 × 2. Kein Spiel ist 19 oder 21 wert, deshalb darf sie niemand reizen.' },
      { kind: 'choice', prompt: 'Zu welchem Spiel gehört die 23?', options: ['Karo × 2,5', 'Zum Null', 'Grand', 'Kreuz mit 1'], answer: 1, explain: '23 ist der Wert des Null – knapp über 22, damit ein gutes Nullblatt die billigsten Farbspiele überbieten kann.' },
      {
        kind: 'teach',
        title: 'Drei Plätze, zwei Duelle',
        body: [
          '**Vorhand** sitzt links vom Geber, dann kommt **Mittelhand**, und der Geber ist **Hinterhand**.',
          'Zuerst **reizt Mittelhand Vorhand**: Mittelhand sagt die Zahlen, Vorhand antwortet **„Ja“** oder **„Passe“**. Dann **reizt Hinterhand den, der übrig ist**, genauso.',
          'Wer zuletzt übrig bleibt, ist Alleinspieler, und sein Spiel muss **mindestens so viel wert sein wie der letzte Reizwert**. Reizt niemand, wird neu gegeben.',
        ],
      },
      { kind: 'choice', prompt: 'Wer nennt beim Reizen die erste Zahl?', options: ['Vorhand', 'Mittelhand', 'Hinterhand', 'Wen der Geber bestimmt'], answer: 1, explain: 'Mittelhand reizt zuerst Vorhand, und Vorhand antwortet „Ja“ oder „Passe“. Hinterhand wartet auf den Sieger dieses Duells.' },
      gen(() => gameValueDrill()),
      {
        kind: 'bid',
        prompt: 'Du bist **Vorhand**, und Lina reizt dich. Was ist dein Spiel wert? Antworte auf jede Zahl, die sie nennt.',
        hand: cards('C:J | H:A 10 9 8 7 | S:A 9 | C:K | D:8'),
        contract: { kind: 'suit', trump: 'H' },
        seat: 'forehand',
        limits: [24, 0],
        explain: 'Herz mit 1, Spiel 2: 10 × 2 = **20**. Also hast du 18 und 20 gehalten und bei 22 gepasst. Lina spielt mit 22 – ihr Spiel muss mindestens so viel wert sein.',
      },
      {
        kind: 'teach',
        title: 'Welches Blatt lohnt das Reizen?',
        body: [
          'Grobe Faustregeln:',
          '**Farbspiel**: fünf Trümpfe oder mehr (Buben mitgezählt), dazu ein oder zwei Asse.',
          '**Grand**: zwei, drei Buben, dazu zwei, drei Asse.',
          '**Null**: kleine Karten in jeder Farbe und keine einsame hohe.',
          'Passt nichts davon? Dann passe – gewinnen die Gegenspieler, hast du auch gewonnen.',
        ],
      },
      {
        kind: 'bid',
        prompt: 'Du bist **Mittelhand**: Erst reizt du Noah, dann reizt Lina dich. Reiz so weit, wie dein Spiel wert ist – und keine Zahl weiter.',
        hand: cards('C:J | S:J | D:A 10 K 9 | H:A 8 | C:10 | S:7'),
        contract: { kind: 'suit', trump: 'D' },
        seat: 'middlehand',
        limits: [30, 20],
        explain: 'Karo mit 2, Spiel 3: 9 × 3 = **27**. Du hast Noah bis 22 gereizt, Linas 23, 24 und 27 gehalten und bei 30 gepasst. Das war ein ganzes Reizen: Lina spielt mit 30.',
      },
    ],
  },
  {
    id: '8',
    title: 'Skat, Drücken und Hand',
    promise: 'Als Alleinspieler wissen, wie man die beiden Skatkarten am besten nutzt.',
    learned: 'den Skat aufnehmen, die richtigen zwei Karten drücken und Hand spielen.',
    minutes: 2,
    steps: [
      {
        kind: 'teach',
        title: 'Das Vorrecht des Alleinspielers',
        body: [
          'Das Reizen gewonnen? **Nimm den Skat auf**: Jetzt hast du 12 Karten. **Drück zwei beliebige** verdeckt weg, dann sag dein Spiel an.',
          'Die zwei gedrückten Karten spielen nicht mit, aber ihre **Augen zählen für dich** – ein Guthaben, bevor die erste Karte fällt.',
        ],
      },
      {
        kind: 'teach',
        title: 'Welche zwei drücken? Drei Faustregeln',
        body: [
          '**Augen sichern**: Eine blanke Zehn ohne schützendes Ass wird leicht vom Ass eines Gegners gefangen. Drück sie, und die 10 Augen sind sicher.',
          '**Eine Farbe blank machen**: Drück alle Karten einer kurzen Fehlfarbe. Spielt ein Gegner sie aus, kannst du stechen.',
          '**Keine Trümpfe und keine Asse drücken**: Mit ihnen gewinnst du deine Stiche.',
        ],
      },
      {
        kind: 'pick',
        prompt: 'Du willst **Herz ♥** spielen und hast diese 12 Karten. Tippe die zwei an, die du drückst.',
        cards: cards('C:J | H:J A 10 K 9 | S:A 7 | C:10 | D:K 8 7'),
        correct: cards('C:10 | D:K'),
        explain: 'Die ♣10 steht blank: Sobald ein Gegner das ♣A spielt, verschenkt sie 10 Augen. Gedrückt sind die 10 Augen dir sicher – und du bist in Kreuz frei, kannst es also stechen. Der ♦K bringt 4 dazu: 14 Augen vor dem ersten Stich.',
        hint: 'Welche Karte ist wertvoll, aber nicht zu halten? Und welche Farbe ist leer, sobald sie gedrückt ist?',
      },
      {
        kind: 'teach',
        title: 'Hand: ohne den Skat anzusehen',
        body: [
          'Dein Blatt ist schon stark genug? Spiel **Hand**: Lass den Skat liegen und spiel mit den zehn Karten, die du bekommen hast – eine Stufe **mehr**. Ein Null Hand ist **35** wert.',
          'Der Skat gehört trotzdem dir: Seine Augen zählen nach dem Spiel für dich, und seine Karten zählen mit, wenn die Spitzen gezählt werden – auch nach dem Aufnehmen, über alle zwölf Karten.',
        ],
      },
      ...times(2, () => gameValueDrill({ hand: true })),
      {
        kind: 'choice',
        prompt: 'Dein höchster Trumpf ist der ♥B (kein ♣B, kein ♠B), also spielst du Pik Hand „ohne 2“: 11 × (2 + 1 + 1) = 44, und du hast 44 gereizt. Nach dem Spiel wird der Skat umgedreht – darin liegt der **♣B**. Was jetzt?',
        options: ['Nichts ändert sich: weiter 44', 'Es wird „mit 1“: 11 × 3 = 33, weniger als gereizt', 'Es wird „mit 3“ – mehr wert', 'Der Skat zählt nicht, also egal'],
        answer: 1,
        explain: 'Der Skat zählt zu deinen Karten. Mit dem ♣B spielst du „mit“, aber der ♠B gehört dir nicht, also nur „mit 1“: 1 + 1 + 1 = 3, 11 × 3 = 33 – weniger als deine gereizten 44, und dein Spiel muss den Reizwert erreichen. Das ist das Risiko von Hand: Ein Handspiel „ohne“ spielt man mit etwas Luft.',
        hint: 'Der ♣B gehört jetzt dir. Wie viele Trümpfe hast du vom ♣B an lückenlos?',
      },
      { kind: 'choice', prompt: 'Wem gehören im Handspiel am Ende die Augen der beiden ungesehenen Skatkarten?', options: ['Den Gegenspielern', 'Dem Alleinspieler', 'Wer den letzten Stich bekommt', 'Niemandem – sie zählen nicht'], answer: 1, explain: 'Der Skat gehört immer dem Alleinspieler, ob er ihn angesehen hat oder nicht.' },
      {
        kind: 'pick',
        prompt: 'Du willst **Pik ♠** spielen und hast diese 12 Karten. Tippe die zwei an, die du drückst.',
        cards: cards('C:J | H:J | S:A 10 9 7 | C:A K 9 8 | H:10 | D:7'),
        correct: cards('H:10 | D:7'),
        explain: 'Die blanke ♥10 ist gesichert – 10 Augen vor dem ersten Stich –, und mit der ♦7 dazu bist du in Herz und Karo frei: Beide kannst du stechen. Deine Kreuz behalten ihr Ass.',
        hint: 'Eine blanke Zehn ohne Ass und eine einzelne kleine Karte: Welche zwei machen ganze Farben leer?',
      },
    ],
  },
  {
    id: '9',
    title: 'Gewinnstufen und Abrechnung',
    promise: 'Ein fertiges Spiel selbst abrechnen – mit Schneider, Schwarz und überreizten Spielen.',
    learned: 'ein fertiges Spiel selbst abrechnen, mit Schneider und überreizten Spielen.',
    minutes: 2,
    steps: [
      {
        kind: 'teach',
        title: 'Schneider und Schwarz',
        body: [
          'Wer hoch gewinnt, bekommt mehr Stufen:',
          '**Schneider**: Die verlierende Seite hat **30 Augen oder weniger** (die Gewinner also 90 oder mehr). Eine Stufe **mehr**.',
          '**Schwarz**: Die verlierende Seite hat **keinen einzigen Stich** bekommen. **Noch** eine Stufe mehr.',
          'Das gilt in beide Richtungen: Ein Alleinspieler mit 30 Augen oder weniger zahlt den Schneider selbst.',
        ],
      },
      {
        kind: 'teach',
        title: 'Abrechnung',
        body: [
          '**Der Alleinspieler gewinnt**: + Spielwert. **Er verliert**: − **2 ×** Spielwert. Ein verlorenes Spiel kostet doppelt so viel, wie ein gewonnenes bringt.',
          '**Überreizt**: Das Spiel ist weniger wert als gereizt – verloren, egal wie viele Augen. Gewertet wird das kleinste Vielfache des Grundwerts, das den Reizwert erreicht, und zwar doppelt.',
        ],
        tip: 'Bei offiziellen Turnieren bekommt der Alleinspieler zusätzlich +50 für jedes gewonnene und −50 für jedes verlorene Spiel, und die Gegenspieler bekommen Punkte dazu (Seeger-Fabian). Zu Hause lässt man das meist weg.',
      },
      ...times(3, settleDrill),
      {
        kind: 'teach',
        title: 'Ansagen gibt es nur beim Handspiel',
        body: [
          'Wer Hand spielt, darf vor dem Spiel mehr versprechen; jedes Versprechen bringt eine Stufe **mehr**:',
          '**Schneider angesagt** – „Ich bekomme mindestens 90.“',
          '**Schwarz angesagt** – „Ich bekomme alle zehn Stiche.“',
          '**Ouvert** (offen) – „Ich lege meine Karten offen auf den Tisch und bekomme trotzdem alle zehn Stiche.“',
          'Wer ansagt und es nicht schafft – und sei es mit 89 –, hat verloren. Der Null hat noch zwei Werte: **Null ouvert 46 · Null ouvert Hand 59**.',
        ],
      },
      { kind: 'choice', prompt: 'Was ist ein Null ouvert (Skat aufgenommen, offen gespielt) wert?', options: ['23', '35', '46', '59'], answer: 2, explain: '23 (einfach) → 35 (Hand) → **46 (ouvert)** → 59 (ouvert Hand).' },
      { kind: 'choice', prompt: 'Der Alleinspieler hat am Ende 89 Augen. Ist das Schneider?', options: ['Ja', 'Nein, dafür braucht es 90', 'Kommt darauf an, ob die Gegenspieler einen Stich haben', 'Nur beim Handspiel'], answer: 1, explain: 'Die Gegenspieler dürfen höchstens 30 haben, der Alleinspieler braucht also 90. 89 : 31 – knapp daneben.' },
      ...times(2, settlePileDrill),
    ],
  },
  {
    id: '10',
    title: 'Richtig spielen: Grundlagen für Alleinspieler und Gegenspieler',
    promise: 'Nicht mehr nur erlaubte Karten legen – sondern wissen, warum du genau diese spielst.',
    learned: 'mit Plan spielen: als Alleinspieler Trumpf ziehen, als Gegenspieler dem Partner schmieren.',
    minutes: 2,
    steps: [
      {
        kind: 'teach',
        title: 'Der Plan des Alleinspielers: erst Trumpf ziehen, dann kassieren',
        body: [
          'Wovor sich der Alleinspieler am meisten fürchtet: dass ein Gegner eines seiner Asse mit einem kleinen Trumpf sticht.',
          'Deshalb spielt er meist zuerst **hohe Trümpfe aus** und zwingt beide Gegner, Trumpf zu bedienen, bis sie keinen mehr haben (**Trumpf ziehen**). Danach sind Asse und Zehnen in den Fehlfarben sichere Augen. Es gibt 11 Trümpfe – **Trümpfe zählen** verrät dir, wie viele noch draußen sind.',
        ],
      },
      {
        kind: 'play',
        prompt: 'Spiel: **Herz ♥**. Du bist Alleinspieler und spielst zum ersten Stich aus. Welche Karte?',
        contract: { kind: 'suit', trump: 'H' },
        hand: cards('C:J | S:J | H:A 10 9 | S:A 10 | C:7 | D:8 7'),
        trick: [],
        best: cards('C:J | S:J'),
        whyNot: 'Zu früh. Die Gegner haben noch 6 Trümpfe, und dein Ass kann leicht von einem kleinen Trumpf gestochen werden. Zieh erst mit deinen hohen Buben Trumpf.',
        explain: 'Den ♣B schlägt niemand, er gewinnt also sicher und holt zwei Trümpfe der Gegner heraus. Danach der ♠B, das ♥A … haben die Gegner keinen Trumpf mehr, sind ♠A und ♠10 geschenkte 21 Augen.',
      },
      { kind: 'choice', prompt: 'Herzspiel, du bist Alleinspieler mit 6 Trümpfen. Bisher sind 3 Trümpfe gefallen, 2 davon von den Gegnern. Wie viele Trümpfe haben die Gegner noch?', options: ['2', '3', '4', '5'], answer: 1, explain: 'Es gibt 11 Trümpfe. Du hast 6, die Gegner also zu Beginn 5; 2 haben sie gespielt, also bleiben **3**.', hint: '11 Trümpfe − deine 6 = wie viele hatten die Gegner am Anfang?' },
      {
        kind: 'teach',
        title: 'Der Plan der Gegenspieler: dem Partner schmieren',
        body: [
          'Die Augen der beiden Gegenspieler werden zusammengezählt. Ihr wichtigster Zug ist deshalb das **Schmieren**:',
          '**Dein Partner bekommt den Stich** → leg deine fetteste Karte dazu (ein Ass oder eine Zehn).',
          '**Der Alleinspieler bekommt den Stich** → wirf deine wertloseste Lusche ab und schenk ihm kein Auge.',
          'Und Gegenspieler **spielen nicht von sich aus Trumpf aus** – damit ziehen sie dem Alleinspieler die Trümpfe. Hast du ein Ass in einer Fehlfarbe, hol dir damit früh deinen Stich.',
        ],
      },
      {
        kind: 'play',
        prompt: 'Spiel: **Pik ♠**, du bist Gegenspieler. Dein Partner spielt ♦A aus, der Alleinspieler gibt ♦7 zu. Du bist dran – welche Karte?',
        contract: { kind: 'suit', trump: 'S' },
        hand: cards('D:10 8 | H:K 9 | C:Q'),
        trick: cards('D:A 7'),
        trickBy: ['Partner', 'Alleinspieler'],
        best: cards('D:10'),
        whyNot: 'Erlaubt, aber eine verpasste Gelegenheit. Das ♦A deines Partners hat den Stich schon sicher – jetzt ist der Moment, deine fetteste Karte dazuzulegen.',
        explain: 'Schmieren! ♦A + ♦7 + ♦10 = 21 Augen, alle für eure Seite. Mit der ♦8 wären es nur 11.',
      },
      {
        kind: 'play',
        prompt: 'Spiel: **Kreuz ♣**, du bist Gegenspieler. Der Alleinspieler spielt ♣B aus, dein Partner gibt ♣9 zu. Du musst Trumpf bedienen – mit welcher Karte?',
        contract: { kind: 'suit', trump: 'C' },
        hand: cards('C:10 8 | D:A | H:7'),
        trick: cards('C:J 9'),
        trickBy: ['Alleinspieler', 'Partner'],
        best: cards('C:8'),
        whyNot: 'Der ♣B ist die höchste Karte im Spiel: Den Stich hat der Alleinspieler sicher. Mit der ♣10 schenkst du ihm 10 Augen.',
        explain: 'Wenn du nicht gewinnen kannst, spiel klein. Heb die ♣10 auf – vielleicht holt sie später noch einen Stich.',
      },
      { kind: 'choice', prompt: 'Was sollte ein Gegenspieler normalerweise **nicht** von sich aus ausspielen?', options: ['Ein Ass einer Fehlfarbe', 'Trumpf', 'Eine kleine Karte einer kurzen Farbe', 'Eine Farbe, die der Partner gezeigt hat'], answer: 1, explain: 'Wer Trumpf ausspielt, zieht dem Alleinspieler die Trümpfe. Die Trümpfe der Gegenspieler sind dafür da, Asse und Zehnen des Alleinspielers zu stechen.' },
      {
        kind: 'play',
        prompt: 'Spiel: **Herz ♥**. Du bist Alleinspieler und sitzt hinten. Die Gegenspieler haben ♠10 und ♠A gelegt, und du hast kein Pik. Welche Karte?',
        contract: { kind: 'suit', trump: 'H' },
        hand: cards('H:J 7 | D:K 9 | C:8'),
        trick: cards('S:10 A'),
        trickBy: ['Gegenspieler', 'Gegenspieler'],
        best: cards('H:7'),
        whyNot: 'Auf dem Tisch liegen 21 Augen – die musst du holen! Und weil du hinten sitzt, kann dich danach niemand mehr überstechen: Dein kleinster Trumpf reicht. Heb die großen auf.',
        explain: 'Wer hinten sitzt, gewinnt mit der kleinsten Karte, die gerade reicht. Die ♥7 holt 21 Augen, und der ♥B bleibt dir für später.',
      },
    ],
  },
  {
    id: '11',
    title: 'Abschlussspiel: an den Tisch!',
    promise: 'Eine komplette Partie gegen zwei KI-Gegner spielen. Danach kannst du Skat.',
    learned: 'eine ganze Partie Skat spielen, vom ersten Reizwert bis zur Abrechnung.',
    minutes: 3,
    steps: [
      {
        kind: 'teach',
        title: 'Spickzettel für den Tisch',
        body: [
          '**Augen** A 11 · 10 10 · K 4 · D 3 · B 2 | der Alleinspieler braucht **61**',
          '**Trümpfe** ♣B ♠B ♥B ♦B, dann die Trumpffarbe A 10 K D 9 8 7',
          '**Bedienen** Farbe bedienen, wenn du kannst; ein Bube ist Trumpf, nicht die Farbe, die auf ihm steht',
          '**Grundwerte** ♦9 ♥10 ♠11 ♣12 Grand 24 | Null 23/35/46/59',
          '**Spielwert** Grundwert × (Spitzen + 1 + Extras)',
          '**Reizen** Mittelhand → Vorhand, Hinterhand → Sieger; nur bis zum eigenen Spielwert reizen',
        ],
        tip: 'Im Spiel kannst du jederzeit auf „Tipp“ tippen: Er sagt dir, welche Karte du spielen sollst und warum. Keine Angst vorm Verlieren – aus einem verlorenen Spiel lernst du mehr als aus einem gewonnenen.',
      },
      {
        kind: 'game',
        title: 'Eine ganze Partie',
        body: ['Reizen, Skat, Ansagen, zehn Stiche, Abrechnung – einmal alles durch. Ob gewonnen oder verloren: Danach hast du den Kurs geschafft.'],
      },
    ],
  },
]
