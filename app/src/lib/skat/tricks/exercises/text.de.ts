// Die Skat-Aufgaben auf Deutsch (SKATGO-103). Die Antworten stehen in positions.ts und werden dort
// berechnet oder von SkatZero geprüft; hier stehen nur die Worte dazu. **fett** und Farbsymbole wie in den
// Lektionen.

import { P_JACK_IN_SKAT, P_THREE_NIL, P_THREE_ONE, P_TWO_TWO } from './positions'
import { LADDER_DE } from './ladder-text'
import type { ExercisesText } from './types'

/** A probability as the text says it, from the counted value. */
const pct = (p: number) => new Intl.NumberFormat('de', { style: 'percent' }).format(p)

const SURE = ['Nein – das Spiel ist sicher gewonnen', 'Ja – es kann noch schiefgehen']
const RISK = ['Sicher – egal, wie die Karten sitzen', 'Riskant – es kommt darauf an, wie sie sitzen', 'Verloren – egal, wie die Karten sitzen']

export const EXERCISES_DE: ExercisesText = {
  types: {
    'sieg-sichern': { title: 'Sieg sichern', blurb: 'Skat-Endspiele wie Schachaufgaben: Eine Karte gewinnt sicher.' },
    reizen: { title: 'Reizen oder passen?', blurb: 'Reizwert ausrechnen und entscheiden, wie weit du gehst.' },
    druecken: { title: 'Drücken', blurb: 'Welche zwei Karten legst du in den Skat?' },
    spielwahl: { title: 'Welches Spiel?', blurb: 'Farbspiel, Grand oder Null – was holt am meisten aus deinen Karten?' },
    anspielen: { title: 'Anspielen im Gegenspiel', blurb: 'Mit welcher Karte gehst du gegen den Alleinspieler los?' },
    schmieren: { title: 'Zugeben und Schmieren', blurb: 'Wann du deinem Partner Augen gibst – und welche.' },
    mitzaehlen: { title: 'Mitzählen', blurb: 'Trümpfe und Augen im Kopf behalten.' },
    verlierbar: { title: 'Kann ich noch verlieren?', blurb: 'Ist dein Spiel schon sicher – oder kann es noch kippen?' },
    endspiel: { title: 'Endspiel mit offenen Karten', blurb: 'Alle Karten liegen offen: Finde die eine Karte, die gewinnt.' },
    'null-ouvert': { title: 'Null ouvert knacken', blurb: 'Der Alleinspieler zeigt seine Karten. Finde die Lücke.' },
    'null-risiko': { title: 'Wie sicher ist der Null?', blurb: 'Sicher, riskant oder verloren – schätz deinen Null richtig ein.' },
    wahrscheinlichkeit: { title: 'Wahrscheinlichkeiten', blurb: 'Wie oft liegt ein Bube im Skat? Wie sitzen die Trümpfe?' },
    ausspielen: { title: 'Ausspielen als Alleinspieler', blurb: 'Deine erste Karte: Trumpf ziehen oder Asse spielen?' },
  },
  exercises: {
    ...LADDER_DE,
    'reizen-1': {
      title: 'Wie hoch geht Kreuz mit zwei Buben?',
      prompt: 'Du willst **Kreuz** spielen. Bis wie viel darfst du höchstens reizen, ohne dich zu überreizen?',
      explain:
        'Du hast ♣B und ♠B, aber nicht den ♥B: **mit 2, Spiel 3**. Kreuz zählt 12, also 3 × 12 = **36**. Liegt der ♥B im Skat, wird dein Spiel sogar mehr wert – sicher sind aber 36.',
    },
    'reizen-2': {
      title: 'Herz ohne den Kreuz-Buben',
      prompt: 'Du willst **Herz** spielen. Bis wie viel darfst du höchstens reizen?',
      explain:
        'Dir fehlt der ♣B, den ♠B hast du: **ohne 1, Spiel 2**. Herz zählt 10, also 2 × 10 = **20**. Findest du den ♣B im Skat, bist du „mit 1“ – auch das ist Spiel 2. 20 ist sicher.',
    },
    'reizen-3': {
      title: 'Zwei Asse, aber nur vier Trümpfe',
      prompt: 'Vorhand hat 18 gesagt. Mit Kreuz wärst du „ohne 1, Spiel 2“ – 24 ginge also. Sagst du **20**, oder passt du?',
      options: ['20 sagen', 'Passen'],
      explain:
        'Der Reizwert reicht, die Karten nicht: Mit Kreuz hast du nur **vier Trümpfe** (♠B ♣A ♣9 ♣7), und ♣B, ♥B und ♦B sitzen bei den Gegnern. Zwei Asse ändern daran wenig. **Passen** – SkatZero würde mit diesen Karten nicht einmal 18 sagen.',
    },
    'druecken-1': {
      title: 'Kreuz ohne Buben: Was kommt in den Skat?',
      prompt: 'Du spielst **Kreuz**. Welche zwei Karten drückst du?',
      explain:
        'Drück **♠10 und ♠8**. Die Zehn steht ohne ihr Ass da – im Spiel holen sie dir die Gegner wahrscheinlich ab, im Skat sind dir ihre 10 Augen sicher. Und weil dir dann Pik ganz fehlt, kannst du Pik später mit Trumpf stechen.',
    },
    'druecken-2': {
      title: 'Grand: König allein, Zehn ohne Ass',
      prompt: 'Du spielst **Grand**. Welche zwei Karten drückst du?',
      explain:
        'Drück **♣K und ♥10**. Der ♣K steht allein und ginge im Spiel verloren, über der ♥10 fehlt das Ass. Im Skat sind dir 14 Augen sicher – und Kreuz fehlt dir ganz.',
    },
    'druecken-3': {
      title: 'Pik: die schwache Farbe weg',
      prompt: 'Du spielst **Pik**. Welche zwei Karten drückst du?',
      explain:
        'Drück **♦10 und ♦D**. Karo ist deine schwächste Farbe: Ohne Ass würdest du die Zehn wohl verlieren. Im Skat sind 13 Augen sicher, und Karo fehlt dir ganz – kommt Karo, stichst du.',
    },
    'spielwahl-1': {
      title: 'Zwei Buben und vier Asse',
      prompt: 'Du hast den Skat aufgenommen. Welches Spiel sagst du an?',
      explain:
        'Mit zwei Buben, **vier Assen** und zwei Zehnen ist das ein **Grand**. Im Grand sind nur die Buben Trumpf, deine Asse und Zehnen machen die Stiche. Und der Grand zählt 24 – mehr als doppelt so viel wie Pik mit 11.',
    },
    'spielwahl-2': {
      title: 'Lang in Herz',
      prompt: 'Du hast den Skat aufgenommen. Welches Spiel sagst du an?',
      explain:
        'Herz ist deine lange Farbe: ♣B, ♠B und vier Herz – **sechs Trümpfe**, dazu ♠A und ♦A. Genau die Faustregel aus Trick 1. In Pik hättest du nur fünf Trümpfe, und für einen Grand fehlen dir die Asse.',
    },
    'spielwahl-3': {
      title: 'Gereizt bis 27 – und ein Null?',
      prompt: 'Du hast den Skat aufgenommen. Gereizt ist bis 27. Welches Spiel sagst du an?',
      explain:
        'Deine Karten sind klein, das ruft nach einem Null. Aber ein einfacher Null zählt nur 23 – bei 27 wärst du überreizt. **Null ouvert** zählt 46 und geht. Drück ♣A und ♦A, die einzigen Karten, die dir einen Stich bringen könnten.',
    },
    'anspielen-1': {
      title: 'Gegen den Grand: das Ass',
      prompt: 'Du spielst gegen einen Grand Hand und kommst raus. Welche Karte spielst du?',
      explain:
        'Gegen einen Grand gilt: **Asse sofort spielen** – hier das **♠A**. Es hat Begleitung (♠8), ist also nicht blank. Entweder macht es den Stich, oder der Alleinspieler muss einen Buben dafür opfern. Wartest du, wirft er seine Pik vielleicht ab und sticht dein Ass später.',
    },
    'anspielen-2': {
      title: 'Welches Ass zuerst?',
      prompt: 'Du spielst gegen einen Grand Hand und kommst raus. Welche Karte spielst du?',
      explain:
        'Gegen einen Grand spielst du deine Asse sofort – zuerst das mit Begleitung: das **♣A**, neben dem die ♣D steht. Das ♥A steht blank, und bei einem blanken Ass ist Vorsicht geboten.',
    },
    'anspielen-3': {
      title: 'Grand Hand: dein Herz-Ass',
      prompt: 'Du spielst gegen einen Grand Hand und kommst raus. Welche Karte spielst du?',
      explain:
        'Asse sofort: Spiel das **♥A**. Es hat Begleitung (♥D, ♥8) und holt entweder 11 Augen und was die anderen zugeben – oder es zwingt den Alleinspieler, einen Buben einzusetzen.',
    },
    'schmieren-1': {
      title: 'Partner sticht mit dem Buben',
      prompt: 'Du bist als Letzter dran. Welche Karte legst du zu?',
      explain:
        'Dein Partner sticht mit dem ♠B, und nach dir kommt niemand mehr: Der Stich gehört ihm sicher. Trumpf hast du keinen – **schmier die ♠10**. Behältst du sie, holt sie sich später wahrscheinlich der Alleinspieler.',
    },
    'schmieren-2': {
      title: 'Der König hält',
      prompt: 'Du bist als Letzter dran. Welche Karte legst du zu?',
      explain:
        'Der Alleinspieler ist mit der ♠D unter dem ♠K deines Partners geblieben, und du kommst als Letzter: Der Stich gehört euch. Pik und Trumpf hast du nicht – **schmier das ♦A**, 11 Augen sicher bei euch. Später würde es der Alleinspieler wohl abstechen.',
    },
    'schmieren-3': {
      title: 'Grand: Partners Ass gewinnt',
      prompt: 'Du bist als Letzter dran. Welche Karte legst du zu?',
      explain:
        'Dein Partner hat das ♦A gespielt, der Alleinspieler bedient klein, und nach dir kommt niemand: Der Stich gehört euch. Karo hast du keins – **schmier die ♣10**. Das sind 10 Augen, die sonst wohl beim Alleinspieler landen.',
    },
    'ausspielen-1': {
      title: 'Grand: Bube oder Ass?',
      prompt: 'Du spielst Grand und kommst raus. Welche Karte spielst du zuerst?',
      explain:
        'Trumpf zuerst – im Grand sind das die Buben. Der **♣B** ist der höchste Trumpf: Er gewinnt sicher und holt den Gegnern einen Buben heraus. Spielst du erst deine Asse, sticht sie ein Gegner, sobald er die Farbe nicht mehr hat.',
    },
    'ausspielen-2': {
      title: 'Welcher Bube zuerst?',
      prompt: 'Du spielst Grand und kommst raus. Welche Karte spielst du zuerst?',
      explain:
        'Trumpf zuerst – und zwar der **♣B**, nicht der ♦B. Der ♣B ist der höchste Trumpf und gewinnt sicher; mit dem ♦B schenkst du den Stich einem höheren Buben der Gegner. Erst wenn die Buben raus sind, laufen ♥A und ♥10.',
    },
    'ausspielen-3': {
      title: 'Kreuzspiel ohne den Kreuz-Buben',
      prompt: 'Du spielst Kreuz und kommst raus. Welche Karte spielst du zuerst?',
      explain:
        'Trumpf zuerst: Spiel **einen Buben**. Den ♣B hat ein Gegner, aber mit ♠B, ♥B, ♦B, ♣10 und ♣K holst du die Trümpfe der Gegner heraus. Spielst du zuerst das ♥A, sticht es vielleicht schon jemand ab.',
    },
    'mitzaehlen-1': {
      title: 'Wie viele Trümpfe sind noch draußen?',
      prompt: 'Nach vier Stichen: Wie viele Trümpfe haben die Gegner noch?',
      explain:
        'Im Kreuzspiel gibt es elf Trümpfe: vier Buben und sieben Kreuz. Gefallen sind ♣B ♣7 ♣D, ♥B ♠B ♦B, ♣8 und ♣A ♣9 – neun. Zwei hast du noch (♣10 ♣K). 11 − 9 − 2 = **0**: Die Gegner haben keinen Trumpf mehr, deine Asse laufen jetzt sicher.',
    },
    'mitzaehlen-2': {
      title: 'Wie viele Augen hast du schon?',
      prompt: 'Du hast alle vier Stiche gemacht. Wie viele Augen hast du jetzt – mit dem Skat?',
      explain:
        'Die Stiche: 6 + 11 + 17 + 11 = 45 Augen. Dazu kommen die Augen im Skat, denn der gehört dir: ♠K 4 und ♦8 0. Zusammen **49** – noch 12 bis zum Sieg.',
    },
    'mitzaehlen-3': {
      title: 'Ist der Weg für die Asse frei?',
      prompt: 'Nach zwei Stichen: Wie viele Trümpfe haben die Gegner noch?',
      explain:
        'Im Herzspiel gibt es elf Trümpfe. Gefallen sind ♣B ♠B ♦B und ♥B ♥9 ♥7 – sechs. Du hast noch ♥A ♥10 ♥K ♥8, also vier. 11 − 6 − 4 = **1**: Die ♥D ist noch draußen. Zieh sie mit dem ♥A, dann ist der Weg für ♠A und ♣A frei.',
    },
    'verlierbar-1': {
      title: 'Nur noch ein Bube draußen',
      prompt: 'Du brauchst noch 18 Augen. Kannst du das Spiel noch verlieren?',
      options: SURE,
      explain:
        'Draußen ist nur noch ein Trumpf, der ♦B – und der ist kleiner als dein ♥B. Spiel den ♥B: Wer den ♦B hat, muss ihn zugeben. Danach sticht niemand mehr, ♥A und ♥10 gehen durch: schon 2 + 2 + 11 + 10 = 25 Augen. **Sicher gewonnen.**',
    },
    'verlierbar-2': {
      title: 'Sieben Augen fehlen noch',
      prompt: 'Du brauchst nur noch 7 Augen. Kannst du das Spiel noch verlieren?',
      options: SURE,
      explain:
        'Der ♣B ist noch draußen, und er sticht jeden deiner Buben. Hat ein Gegner ♣B, ♣9, ♣8 und ♦K, der andere ♠9, ♠7, ♥K und ♥7, holen sie deine Buben und deine ♣D – und du kommst nicht mehr auf 7 Augen, auch wenn du alle Karten sehen könntest. **Es kann noch schiefgehen.**',
    },
    'verlierbar-3': {
      title: 'Zwei hohe Buben, zwei Trümpfe draußen',
      prompt: 'Du brauchst noch 23 Augen. Kannst du das Spiel noch verlieren?',
      options: SURE,
      explain:
        'Draußen sind noch zwei Trümpfe, ♥D und ♥9. Mit ♣B und ♠B ziehst du sie heraus – wie auch immer sie sitzen. Danach sind ♥10 und ♥K die höchsten Trümpfe: Du machst alle vier Stiche, deine 18 Augen und alle 10 der Gegner. **Sicher gewonnen.**',
    },
    'endspiel-1': {
      title: 'Grand: 37 Augen fehlen',
      prompt: 'Alle Karten liegen offen. Du brauchst noch 37 Augen. Welche Karte spielst du aus?',
      explain:
        'Erst den **♣B**: Er holt beide Buben der Gegner (♥B und ♠B). Dann gehören ♥10 und ♥A dir – ohne Trumpf können die Gegner sie nicht stechen und müssen Augen dazulegen: 6 + 20 + 11 = 37. Spielst du zuerst Herz, sticht ein Bube deine Zehn.',
    },
    'endspiel-2': {
      title: 'Herz: der letzte Trumpf der Gegner',
      prompt: 'Alle Karten liegen offen. Du brauchst noch 38 Augen. Welche Karte spielst du aus?',
      explain:
        'Der letzte Trumpf der Gegner ist der ♥K rechts. Spiel die **♥10**: Er muss den König zugeben, und du machst den Stich. Danach holen ♠A und ♥8 noch zwei Stiche – zusammen genau 38. Mit der ♥8 zuerst gewinnt der König den Stich, und es reicht nicht mehr.',
    },
    'endspiel-3': {
      title: 'Herz: Bube vor Ass',
      prompt: 'Alle Karten liegen offen. Du brauchst noch 25 Augen. Welche Karte spielst du aus?',
      explain:
        'Die Gegner haben noch zwei Trümpfe: ♥9 links und ♦B rechts – beide kleiner als dein ♥B. Spiel den **♥B**: Beide müssen ihren Trumpf zugeben. Danach fängt dein ♣A die ♣10: 4 + 21 = 25. Spielst du gleich das ♣A, sticht rechts mit dem ♦B.',
    },
    'null-ouvert-1': {
      title: 'Der blanke König',
      prompt: 'Der Alleinspieler spielt Null ouvert, alle Karten liegen offen. Du spielst aus. Mit welcher Karte knackst du den Null?',
      explain:
        'In Karo hat der Alleinspieler nur den König. Spiel die **♦8**: Dein Partner hat kein Karo und wirft ab, der Alleinspieler muss den ♦K zugeben – und macht den Stich. Null verloren.',
    },
    'null-ouvert-2': {
      title: 'Hol den Partner ans Spiel',
      prompt: 'Der Alleinspieler spielt Null ouvert, alle Karten liegen offen. Du spielst aus. Mit welcher Karte knackst du den Null?',
      explain:
        'Du allein kannst ihn nicht fangen – dein Partner schon: Er hat die ♥7, und der Alleinspieler hat in Herz nur die ♥10. Spiel die **♣9**: Dein Partner muss den ♣K legen und gewinnt den Stich. Dann spielt er die ♥7, und der Alleinspieler muss mit der ♥10 drüber.',
    },
    'null-ouvert-3': {
      title: 'Die Dame allein',
      prompt: 'Der Alleinspieler spielt Null ouvert, alle Karten liegen offen. Du spielst aus. Mit welcher Karte knackst du den Null?',
      explain:
        'In Kreuz hat der Alleinspieler nur die Dame. Spiel die **♣7**: Dein Partner legt den ♣B darunter, und der Alleinspieler muss mit der ♣D drüber – sein erster Stich.',
    },
    'null-risiko-1': {
      title: '7, 9, Bube',
      prompt: 'Null, noch fünf Stiche, du hast bisher keinen Stich. Die Gegner spielen aus. Wie sicher ist dein Null?',
      options: RISK,
      explain:
        'In Kreuz liegt über jeder deiner Karten eine höhere der Gegner: Auf die ♣8 legst du die 7, auf die ♣10 die 9, auf die ♣D den Buben. In Karo dasselbe mit 7 und 9. Herz hast du nicht, das wirfst du ab. **Sicher – egal, wie die Karten sitzen.**',
    },
    'null-risiko-2': {
      title: 'Die Herz-Acht',
      prompt: 'Null, noch fünf Stiche, du hast bisher keinen Stich. Die Gegner spielen aus. Wie sicher ist dein Null?',
      options: RISK,
      explain:
        'Die Schwachstelle ist die ♥8, denn die ♥7 ist noch draußen. Spielt ein Gegner die ♥7 und der andere hat kein Herz, musst du mit der 8 drüber. Hat der andere aber ein Herz, muss er höher zugeben – dann bist du gerettet. **Riskant: Es kommt darauf an, wie die Karten sitzen.**',
    },
    'null-risiko-3': {
      title: 'König blank, Dame und Ass',
      prompt: 'Null, noch fünf Stiche, du hast bisher keinen Stich. Die Gegner spielen aus. Wie sicher ist dein Null?',
      options: RISK,
      explain:
        'Dein ♠K ist blank, und in Herz hast du nur Dame und Ass – jedes Herz der Gegner ist kleiner. Der Gegner, der ausspielt, hat immer Herz oder Pik, denn Kreuz allein reicht nicht für fünf Karten. Was er auch spielt: Du musst stechen. **Verloren – egal, wie die Karten sitzen.**',
    },
    'wahrscheinlichkeit-1': {
      title: 'Liegt ein Bube im Skat?',
      prompt: 'Vor dem Skataufnehmen: Dir fehlen genau zwei Buben, ♣B und ♠B. Wie wahrscheinlich liegt mindestens einer davon im Skat?',
      explain:
        `22 Karten kennst du nicht, zwei davon liegen im Skat – das sind 231 mögliche Skats. In 190 davon ist keiner der beiden Buben. Bleiben 41 von 231: rund **${pct(P_JACK_IN_SKAT)}**. Reiz also nicht darauf, dass dir der Skat einen Buben bringt.`,
    },
    'wahrscheinlichkeit-2': {
      title: 'Vier Trümpfe: 2 : 2?',
      prompt: 'Du hast gedrückt. Die Gegner haben zusammen noch vier Trümpfe, jeder zehn Karten. Wie wahrscheinlich sitzen sie genau 2 : 2?',
      explain:
        `Eine 2 : 2-Verteilung kommt in rund **${pct(P_TWO_TWO)}** der Fälle vor. Häufiger ist 3 : 1 mit rund ${pct(P_THREE_ONE)}. Rechne also eher damit, dass ein Gegner drei Trümpfe hat – und zieh sie, bevor du deine Asse spielst.`,
    },
    'wahrscheinlichkeit-3': {
      title: 'Drei Trümpfe bei einem?',
      prompt: 'Du hast gedrückt. Die Gegner haben zusammen noch drei Trümpfe, jeder zehn Karten. Wie wahrscheinlich hat einer von ihnen alle drei?',
      explain:
        `Alle drei bei einem (3 : 0) gibt es in rund **${pct(P_THREE_NIL)}** der Fälle; sonst sitzen sie 2 : 1 – in ${pct(1 - P_THREE_NIL)}. Meistens reichen also zwei Runden Trumpf, um sie herauszuholen.`,
    },
  },
}
