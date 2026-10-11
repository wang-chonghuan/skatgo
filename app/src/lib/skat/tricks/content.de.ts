// Die Skat-Tricks auf Deutsch (SKATGO-82): zwölf Tricks, einfach erklärt – was du tust und warum es
// funktioniert. Grundwerte und Augen kommen aus der Regel-Engine.

import { POINTS } from '../cards'
import { GRAND_BASE, SUIT_BASE } from '../value'
import type { TricksArticle } from './types'

const heartsWith2 = SUIT_BASE.H * 3

export const TRICKS_DE: TricksArticle = {
  metaTitle: 'Skat Tricks: 12 Tricks für Anfänger und Fortgeschrittene | SkatGo',
  metaDescription:
    '12 Skat-Tricks fürs Reizen, Alleinspiel und Gegenspiel. Probier jeden Trick direkt im täglichen Skat-Turnier aus und vergleiche dich mit der KI.',
  h1: 'Skat Tricks: 12 Tricks, mit denen du sofort besser spielst',
  intro: [
    'Gute Karten allein gewinnen beim Skat noch kein Spiel. Den Unterschied machen ein paar einfache Skat-Tricks, die erfahrene Spieler fast automatisch anwenden. Hier sind zwölf davon – fürs Reizen, fürs Alleinspiel und fürs Gegenspiel. Jeder Trick ist kurz erklärt: was du tust und warum es funktioniert.',
  ],
  blocks: [
    {
      kind: 'cta',
      text: '**Gleich ausprobieren:** Im täglichen Skat-Turnier spielen alle dieselben Karten. Nach jedem Spiel zeigt dir SkatGo, in welchem Stich die KI anders gespielt hätte.',
      button: 'Zum täglichen Turnier',
    },
    { kind: 'h2', title: 'Skat Tricks beim Reizen' },
    {
      kind: 'trick',
      n: 1,
      title: 'Zähl deine Trümpfe, bevor du reizt',
      paragraphs: [
        'Trümpfe sind die Karten, die alle anderen stechen. Im Farbspiel sind das die vier Buben und die sieben Karten deiner Trumpffarbe – zusammen elf.',
        'Als Faustregel gilt: **Sechs Trümpfe und ein Ass** sind eine gute Grundlage für ein Farbspiel. Mit **fünf Trümpfen** brauchst du mindestens ein Ass dazu, und auch dann ist das Spiel kein Selbstläufer. **Vier Trümpfe** reichen meistens nicht.',
      ],
    },
    {
      kind: 'trick',
      n: 2,
      title: 'Rechne deinen Reizwert aus, bevor das Reizen losgeht',
      paragraphs: [
        `Wie hoch du reizen darfst, hängt vom Spiel ab, das du spielen willst. Jede Farbe hat einen Grundwert: Karo ♦ ${SUIT_BASE.D}, Herz ♥ ${SUIT_BASE.H}, Pik ♠ ${SUIT_BASE.S}, Kreuz ♣ ${SUIT_BASE.C} und Grand ${GRAND_BASE}. Diesen Grundwert nimmst du mal deine **Spitzen plus eins**.`,
        `Die Spitzen zählst du so: Hast du den Kreuz-Buben, zählst du von oben, wie viele Trümpfe du ohne Lücke hast („mit 2“). Fehlt dir der Kreuz-Bube, zählst du, wie viele dir von oben fehlen („ohne 2“). Beispiel: Herz mit 2 ist ${SUIT_BASE.H} × (2 + 1) = ${heartsWith2}.`,
        'Rechne das aus, bevor jemand „18“ sagt. Dann weißt du, wann du passen musst, und überreizt dich nicht.',
      ],
      link: { to: '/rules/bidding-table', label: 'Alle Reizwerte in der Reiztabelle' },
    },
    {
      kind: 'trick',
      n: 3,
      title: 'Drück Augen und mach eine Farbe frei',
      paragraphs: [
        `Augen sind die Punkte auf den Karten: Ass ${POINTS.A}, Zehn ${POINTS['10']}, König ${POINTS.K}, Dame ${POINTS.Q}, Bube ${POINTS.J}. Als Alleinspieler gewinnst du mit mehr als 60 Augen.`,
        'Nimmst du den Skat auf, legst du danach zwei Karten weg – du **drückst** sie. Diese zwei Karten zählen am Ende für dich. Drück deshalb Karten mit vielen Augen, die du im Spiel wahrscheinlich verlieren würdest, zum Beispiel eine Zehn, neben der nur eine kleine Karte steht.',
        'Noch besser: Drück so, dass dir eine Farbe ganz fehlt. Wird diese Farbe später gespielt, kannst du sie mit einem Trumpf stechen.',
      ],
    },
    {
      kind: 'cta',
      text: '**Wie gut drückst du?** Im täglichen Turnier siehst du nach jedem Spiel, wie die KI mit denselben Karten gespielt hat.',
      button: 'Jetzt vergleichen',
    },
    { kind: 'h2', title: 'Skat Tricks im Alleinspiel' },
    {
      kind: 'trick',
      n: 4,
      title: 'Trumpf zuerst',
      paragraphs: [
        'Bist du Alleinspieler – also der, der das Spiel macht – und kommst raus, dann spiel zuerst Trumpf.',
        'Viele spielen lieber erst ihre Asse, um sie „in Sicherheit“ zu bringen. Das ist gefährlich: Hat ein Gegner diese Farbe nicht mehr, sticht er dein Ass mit einem kleinen Trumpf. Ziehst du erst die Trümpfe heraus, laufen deine Asse danach sicher durch.',
      ],
    },
    {
      kind: 'trick',
      n: 5,
      title: 'Erst gewinnen, dann an Schneider denken',
      paragraphs: [
        'Mach dir vor der ersten Karte einen kleinen Plan: Wie viele Stiche darfst du abgeben? Wo können die Gegner ihre Augen holen?',
        'Spiel zuerst auf **61 Augen** – damit hast du gewonnen. Schneider ist nur ein Bonus. Wer zu früh darauf spielt, verliert manchmal das ganze Spiel.',
      ],
    },
    {
      kind: 'trick',
      n: 6,
      title: 'Zähl mit – wenigstens die Trümpfe',
      paragraphs: [
        'Im Farbspiel gibt es elf Trümpfe, im Grand nur die vier Buben. Wenn du mitzählst, wie viele schon gefallen sind, weißt du, wann deine Asse sicher sind.',
        'Später zählst du auch die Augen mit. Knappe Spiele entscheiden sich oft in den letzten zwei, drei Stichen.',
      ],
    },
    { kind: 'h2', title: 'Skat Tricks im Gegenspiel' },
    {
      kind: 'trick',
      n: 7,
      title: 'Dem Freunde kurz, dem Feinde lang',
      paragraphs: [
        'Das ist die bekannteste Skatweisheit fürs Ausspielen. Gegenspieler sind die beiden, die zusammen gegen den Alleinspieler spielen.',
        'Sitzt dein Partner direkt nach dir, spiel ihm keine Farbe an, von der du viele Karten, aber kein Ass hast. Hat er die Farbe nicht, muss er stechen oder den Stich dem Alleinspieler lassen. Spiel ihm lieber eine kurze Farbe an.',
        'Sitzt der Alleinspieler direkt nach dir, ist eine lange Farbe oft gut: Er muss sich entscheiden, bevor dein Partner dran ist.',
      ],
    },
    {
      kind: 'trick',
      n: 8,
      title: 'Gegen einen Grand: Asse sofort spielen',
      paragraphs: [
        'Im Grand sind nur die vier Buben Trumpf. Kommst du raus und hast ein Ass, spiel es gleich.',
        'Dann passiert eins von drei Dingen: Du machst den Stich. Oder der Alleinspieler muss einen seiner wenigen Buben einsetzen. Oder er wirft eine Karte ab – dann hat er diese Farbe nicht und vermutlich wenig Trümpfe. Vorsicht nur bei einem **blanken Ass**, also einem Ass ohne weitere Karte dieser Farbe.',
      ],
    },
    {
      kind: 'trick',
      n: 9,
      title: 'Spiel die Farbe deines Partners zurück',
      paragraphs: [
        'Hat dein Partner eine Farbe angespielt, hat er meistens einen Grund dafür. Spiel diese Farbe zurück, sobald du drankommst.',
        'Wechselst du ohne Grund die Farbe, bringst du ihn durcheinander: Er kann dann nicht mehr richtig einschätzen, wer welche Karten hat.',
      ],
    },
    {
      kind: 'trick',
      n: 10,
      title: 'Ass und Zehn sind weg? Dann wechsle die Farbe',
      paragraphs: [
        'Sind Ass und Zehn einer Farbe schon gefallen, lohnt es sich meist nicht mehr, diese Farbe weiterzuspielen. Oft sticht der Alleinspieler dann billig oder wird eine schlechte Karte los. Such dir lieber eine andere Farbe.',
      ],
    },
    {
      kind: 'trick',
      n: 11,
      title: 'Gib deinem Partner Augen – und nimm deine Stiche mit',
      paragraphs: [
        'Gehört ein Stich sicher deinem Partner, leg eine Zehn oder ein Ass dazu. Beim Skat heißt das **schmieren**: So landen die Augen bei eurer Seite.',
        'Und umgekehrt: Kannst du selbst einen Stich machen, dann mach ihn. Trümpfe „für später“ aufzuheben, geht oft schief.',
      ],
    },
    { kind: 'h2', title: 'Der wichtigste Skat-Trick' },
    {
      kind: 'trick',
      n: 12,
      title: 'Ärger dich nicht über Fehler – lern hinterher daraus',
      paragraphs: [
        'Während des Spiels kostet Grübeln über den letzten Fehler nur Konzentration. Spiel weiter und schau dir das Spiel danach in Ruhe an.',
        'Genau dafür gibt es im täglichen Turnier den Spielverlauf: Nach jedem Spiel siehst du Stich für Stich, welche Karte die KI an deiner Stelle gespielt hätte. Der Stich mit dem größten Unterschied ist markiert.',
      ],
    },
    {
      kind: 'cta',
      text: '**Probier die 12 Skat-Tricks im täglichen Turnier aus** – gleiche Karten für alle, nach jedem Spiel der Vergleich mit der KI.',
      button: 'Jetzt spielen',
    },
  ],
  further: {
    title: 'Weiterlesen',
    links: [
      { to: '/rules', label: 'Skat-Regeln' },
      { to: '/rules/bidding-table', label: 'Reiztabelle' },
      { to: '/course', label: 'Skatkurs' },
    ],
  },
}
