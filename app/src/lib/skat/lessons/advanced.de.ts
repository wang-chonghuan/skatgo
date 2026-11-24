// Der Fortgeschrittenenkurs auf Deutsch (SKATGO-234): dieselben Lektionen, Karten und Antworten wie advanced.en.ts,
// in den Wörtern von content.de.ts.

import { cards } from '../cards'
import type { LessonGuide } from '../rules/types'
import type { Lesson } from './types'

export const ADVANCED_DE: Lesson[] = [
  {
    id: '101',
    title: 'Schneider',
    promise: 'Erkennen, wann ein Schneider sicher ist – um darauf zu reizen, ihn anzusagen oder ihn zu verhindern.',
    learned: 'bis 90 und bis 31 zählen, auf den stillen Schneider reizen, einen sicheren Schneider ansagen und deine Seite aus dem Schneider schmieren.',
    minutes: 4,
    steps: [
      {
        kind: 'teach',
        title: 'Neunzig, nicht einundsechzig',
        body: [
          'Jeder Alleinspieler spielt auf **61**. Die zweite Linie ist **90**: Wer 90 Augen oder mehr holt, spielt die Gegenspieler **Schneider** – sie haben 30 oder weniger. Das Spiel steigt um eine ganze Stufe.',
          'Die Linie gilt in beide Richtungen. Die Gegenspieler brauchen **31**, dann sind sie **schneiderfrei**. Und ein Alleinspieler, der bei 30 oder weniger bleibt, verliert mit Schneider: Auch der Verlust steigt um eine Stufe.',
        ],
        tip: '**Schwarz** ist der Schritt darüber: Eine Seite bekommt keinen einzigen Stich. Noch eine Stufe.',
      },
      {
        kind: 'choice',
        prompt: 'Du bist Alleinspieler. Die Gegenspieler haben diese drei Stiche bekommen, alle anderen gehören dir. Ist das Schneider?',
        rows: [
          { label: 'Ihr 1. Stich', cards: cards('S:A 10 7') },
          { label: 'Ihr 2. Stich', cards: cards('H:K 9 8') },
          { label: 'Ihr 3. Stich', cards: cards('D:Q 8 7') },
        ],
        options: ['Ja – sie haben 28', 'Nein – sie haben 31', 'Nur beim Handspiel', 'Nur wenn du ihn angesagt hast'],
        answer: 0,
        explain: '21 + 4 + 3 = **28** für die Gegenspieler: 30 oder weniger, also Schneider – angesagt oder nicht. Eine Karte mit Augen mehr in ihren Stichen, und sie wären frei gewesen.',
        hint: 'Zähl nur ihre drei Stiche: Ass 11, 10 10, König 4, Dame 3, der Rest nichts.',
      },
      {
        kind: 'teach',
        title: 'Was ein Schneider wert ist',
        body: [
          'Ein Schneider bringt **eine Stufe mehr**. Kreuz mit 1 ist 2 × 12 = 24; mit Schneider gewonnen 3 × 12 = **36**.',
          'Den Skat aufgenommen? Der Schneider zählt trotzdem – nur versprechen kannst du ihn nicht. Wer **Hand** spielt, darf Schneider vor der ersten Karte **ansagen**: noch eine Stufe mehr. Angesagt und die 90 verfehlt, ist das Spiel verloren.',
        ],
      },
      {
        kind: 'choice',
        prompt: 'Ein Herzspiel, Hand, mit 2. Du sagst Schneider an und hast am Ende 95. Was ist das Spiel wert?',
        options: ['40', '50', '60', '70'],
        answer: 2,
        explain: 'mit 2 → 2, Spiel 1, Hand 1, Schneider 1, angesagt 1: **6** Stufen × 10 = **60**.',
        hint: 'Zähl die Stufen zusammen: Spitzen, das Spiel selbst, Hand, Schneider und die Ansage – dann mal Herz 10.',
      },
      {
        kind: 'teach',
        title: 'Der stille Schneider',
        body: [
          'Beim Reizen ist dein Blatt so viel wert, wie es sicher bringt. Machst du den Schneider auch nach der Skataufnahme sicher, zählt dein Blatt eine Stufe höher: der **stille Schneider**. Niemand hört ihn, aber du darfst darauf reizen.',
          'Pik mit 2 ist 3 × 11 = **33**. Mit sicherem Schneider sind es 4 × 11 = **44** – genug, um das Spiel gegen eine 40 zu bekommen.',
        ],
        tip: 'Der Preis: Wer auf den stillen Schneider reizt und die 90 verfehlt, hat sich **überreizt** – verloren, egal wie viele Augen.',
      },
      {
        kind: 'choice',
        prompt: 'Du reizt mit einem Pikspiel mit 2 bis 44, weil du mit Schneider rechnest, nimmst den Skat auf – und hast am Ende 87. Was passiert?',
        options: ['Du gewinnst 33', 'Du gewinnst 44', 'Du verlierst 88: überreizt', 'Du verlierst 66'],
        answer: 2,
        explain: 'Ohne Schneider ist das Spiel 3 × 11 = 33 wert, weniger als deine 44: **überreizt**. Gewertet wird das nächste Vielfache von 11, das den Reizwert erreicht, also 44, und zwar doppelt: **−88**.',
        hint: 'Sind 87 ein Schneider? Dann vergleiche, was das Spiel wert ist, mit dem, was du gereizt hast.',
      },
      {
        kind: 'teach',
        title: 'Erst gewinnen, dann Schneider',
        body: [
          'Mach zuerst die 61 sicher, dann spiel auf die 90. Ein Anspiel, das nur dem Schneider hilft, kann das ganze Spiel kosten.',
          'Zähl mit: die Augen in den Stichen der Gegenspieler. Sobald sie 31 haben, ist der Schneider weg – ab da spielst du sicher.',
        ],
      },
      {
        kind: 'play',
        prompt: 'Ein Grand, noch drei Stiche, du spielst aus. Du hast 60 Augen; der einzige Trumpf draußen ist der ♠B. Mit welcher Karte sind die 90 sicher?',
        contract: { kind: 'grand' },
        hand: cards('C:J | H:A 10'),
        trick: [],
        best: cards('C:J'),
        whyNot: 'Nicht sicher: Ein Gegenspieler ohne Herz sticht dein Herz mit dem ♠B, und der andere wirft ein Ass dazu – über 20 Augen für sie, und der Schneider ist weg.',
        explain: 'Erst den letzten Trumpf ziehen. Der ♣B holt den ♠B heraus, danach sticht niemand mehr dein ♥A oder deine ♥10: Alle drei Stiche gehören dir und der Schneider dazu.',
      },
      {
        kind: 'teach',
        title: 'Ansagen nur, was sicher ist',
        body: [
          'Bevor du ansagst, zähl die Stiche, die du abgeben könntest, und das Meiste, was die Gegenspieler hineinlegen können. Kommen sie nie auf 31, ist der Schneider sicher – sag ihn an.',
          'Unten ein Grand Hand: alle vier Buben, die Gegenspieler haben also keinen Trumpf. Kreuz und Pik machen jeden Stich, in den sie gehen. Die ♥7 ist dein einziger Verlierer.',
        ],
        rows: [{ label: 'Dein Grand Hand', cards: cards('C:J | S:J | H:J | D:J | C:A 10 K | S:A 10 | H:7') }],
      },
      {
        kind: 'choice',
        prompt: 'Mit diesem Grand Hand, auf jedem Platz: Sagst du Schneider an?',
        rows: [{ label: 'Dein Grand Hand', cards: cards('C:J | S:J | H:J | D:J | C:A 10 K | S:A 10 | H:7') }],
        options: ['Ja – sie holen höchstens 22', 'Nein – eine Zehn kann gestochen werden', 'Nur in Vorhand', 'Nein – beim Grand gibt es keine Ansage'],
        answer: 0,
        explain: 'Sie bekommen höchstens einen Stich, den deine ♥7 abgibt: Mehr als zwei Asse können sie nicht hineinlegen, also **22**. Das bleibt unter 31 – der Schneider ist sicher. Schwarz nicht: Dieser Stich gehört ihnen.',
        hint: 'Welche deiner Karten kann überhaupt einen Stich abgeben, und was können zwei Gegenspieler höchstens in diesen einen Stich legen?',
      },
      {
        kind: 'teach',
        title: 'Als Gegenspieler: auf 31 kommen',
        body: [
          'Droht ein Schneider, zählen auch die Gegenspieler: **31** zusammen, und sie sind frei. Leg deine Vollen – Asse und Zehnen – in die Stiche deines **Partners** (**schmieren**) und gib dem Alleinspieler deine Luschen.',
          'Habt ihr 31, geht es wieder um die 61. Und ein Stich lohnt sich immer: Er schützt vor Schwarz.',
        ],
      },
      {
        kind: 'play',
        prompt: 'Du bist Gegenspieler gegen ein Pikspiel und gibst als Letzter zu. Deine Seite hat 9 Augen. Dein Partner spielt ♥A aus, der Alleinspieler legt den ♥K. Du hast kein Herz. Welche Karte spielst du?',
        contract: { kind: 'suit', trump: 'S' },
        hand: cards('C:10 7 | D:K 8'),
        trick: cards('H:A K'),
        trickBy: ['Partner', 'Alleinspieler'],
        best: cards('C:10'),
        whyNot: 'Erlaubt, aber dein Partner bekommt diesen Stich – leg deine vollste Karte hinein. Mit dieser Karte bleibt deine Seite unter 31.',
        explain: 'Die ♣10 in den Stich deines Partners: 9 + 11 + 4 + 10 = **34**. Deine Seite ist schneiderfrei.',
      },
    ],
  },
]

/** Die Seite jeder Lektion auf Deutsch: Adresse, Titel als Frage, H1 und Beschreibung. */
export const ADVANCED_GUIDE_DE: Record<string, LessonGuide> = {
  '101': {
    slug: 'schneider-beim-skat',
    question: 'Schneider beim Skat: sicher gewinnen, ansagen und vermeiden',
    h1: 'Schneider beim Skat: gewinnen, ansagen, vermeiden',
    description:
      'Schneider beim Skat: was die 90 und die 31 wert sind, wann du auf den stillen Schneider reizt, wann du ihn Hand ansagst und wie die Gegenspieler frei werden.',
    rule: 'extras',
  },
}
