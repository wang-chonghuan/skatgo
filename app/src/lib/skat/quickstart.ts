import type { Locale } from '~/paraglide/runtime'

// Skat in 5 Minuten (SKATGO-89): the twelve rules the human told his son, after which he could play on
// SkatGo — the human: 「这个十二条我教我儿子，口述的，他听完就会在skatgo上打牌了」, and 「我认为你不需要修改
// 它」. So each rule is the human's own, translated and nothing more: no rule added, none left out, none
// explained further. Where a rule names points or an order, the page shows the cards beside it, drawn
// from the rules engine (`cards`), never typed here. Under the lead, a small picture of SkatGo's table in a
// real game, so the reader can see what the rules are about (the human: 「附带一个游戏页面的截图，不要占空间
// 太大，主要是让读者产生直觉」); made by `.intentfold/tickets/SKATGO-89/table-shot.mjs`.

/** The cards a rule is shown with: the card points, a suit's order, the Jacks' order, the Null order. */
export type QuickCards = 'points' | 'suitOrder' | 'jacks' | 'nullOrder'

export type QuickStart = {
  metaTitle: string
  metaDescription: string
  h1: string
  lead: string
  /** The table in a real game, in the page's language: its file under app/public, and what it shows. */
  picture: { src: string; caption: string }
  rules: { text: string; cards?: QuickCards }[]
  play: { text: string; button: string }
  further: { course: string; rules: string }
}

const DE: QuickStart = {
  metaTitle: 'Skat in 5 Minuten: die 12 Regeln zum Losspielen',
  metaDescription:
    'Skat schnell lernen: zwölf kurze Regeln – Karten, Stiche, Trumpf, Reizen und Null. Danach kannst du sofort online gegen zwei Computer spielen, kostenlos und ohne Anmeldung.',
  h1: 'Skat in 5 Minuten',
  lead: 'Zwölf Regeln, dann kannst du loslegen.',
  picture: {
    src: '/quick-start-table-de.webp',
    caption: 'So sieht der Tisch bei SkatGo aus: unten deine Karten, in der Mitte der Stich, links und rechts Lina und Noah.',
  },
  rules: [
    { text: 'Es gibt **32 Karten** und **3 Spieler**: ein Kartenspiel ohne die 2, 3, 4, 5 und 6.' },
    { text: 'Jeder bekommt **10 Karten**, die übrigen **2** liegen verdeckt auf dem Tisch – das ist der **Skat**.' },
    { text: 'Skat ist ein **Stichspiel** mit **10 Stichen**: Jeder spielt eine Karte, die höchste gewinnt den Stich.' },
    { text: 'Man muss die **Farbe der ersten Karte bedienen**. Nur wer diese Farbe nicht hat, darf eine andere Karte spielen – sie gewinnt den Stich aber nicht (außer es ist **Trumpf**).' },
    { text: 'Vor dem Spiel wird **gereizt**: Wer am höchsten reizt, wird **Alleinspieler**. Die zwei **Gegenspieler** spielen zusammen gegen ihn.' },
    { text: 'Die Seite, die einen Stich gewinnt, bekommt alle Augen darin: **A = 11, 10 = 10, K = 4, D = 3, B = 2**, die anderen Karten zählen nichts.', cards: 'points' },
    { text: 'Zusammen sind es **120 Augen**. Der Alleinspieler braucht **61 Augen** zum Gewinnen, mit 60 hat er verloren.' },
    { text: 'Reihenfolge in einer Farbe: **A > 10 > K > D > 9 > 8 > 7**.', cards: 'suitOrder' },
    { text: 'Wer das Reizen gewinnt, wählt das Spiel: Im **Farbspiel** ist diese Farbe am höchsten; im **Grand** sind nur die **Buben** Trumpf.' },
    { text: 'Die **Buben** sind immer Trumpf und höher als jeder Trumpf einer Farbe. Ihre Reihenfolge: **♣ Kreuz, ♠ Pik, ♥ Herz, ♦ Karo**. Ist die ausgespielte Karte kein Trumpf, darf man mit einem Buben ihre Farbe nicht bedienen – auch wenn er dieselbe Farbe hat.', cards: 'jacks' },
    { text: 'Der Alleinspieler darf den **Skat** mit Karten aus seiner Hand **tauschen**; die Augen der zwei Karten, die er wieder ablegt, zählen für ihn.' },
    { text: '**Null**: Der Alleinspieler gewinnt, wenn er **keinen einzigen Stich** bekommt. Es gibt keinen Trumpf, die Buben gehören wieder zu ihrer Farbe. Reihenfolge: **A > K > D > B > 10 > 9 > 8 > 7**.', cards: 'nullOrder' },
  ],
  play: { text: 'Das war alles – den Rest zeigt dir der Tisch.', button: 'Jetzt spielen' },
  further: { course: 'Alles Schritt für Schritt: der Skat-Kurs', rules: 'Alle Regeln im Detail' },
}

const EN: QuickStart = {
  metaTitle: 'Skat in 5 minutes: the 12 rules to start playing',
  metaDescription:
    'Learn Skat fast: twelve short rules – cards, tricks, trumps, bidding and Null. Then play online against two computer players straight away, free and without signing up.',
  h1: 'Skat in 5 minutes',
  lead: 'Twelve rules, then you can start playing.',
  picture: {
    src: '/quick-start-table-en.webp',
    caption: "SkatGo's table: your cards at the bottom, the trick in the middle, Lina and Noah left and right.",
  },
  rules: [
    { text: 'There are **32 cards** and **3 players**: a pack of cards without the 2, 3, 4, 5 and 6.' },
    { text: 'Everyone gets **10 cards**; the other **2** lie face down on the table – that is the **Skat**.' },
    { text: 'Skat is a **trick-taking game** with **10 tricks**: everyone plays one card, and the highest wins the trick.' },
    { text: 'You must **follow the suit of the first card**. Only if you have none of that suit may you play another card – but it cannot win the trick (unless it is a **trump**).' },
    { text: 'Before play there is **bidding**: whoever bids highest becomes the **declarer**. The two **defenders** play together against the declarer.' },
    { text: 'The side that wins a trick gets all the points in it: **A = 11, 10 = 10, K = 4, D = 3, B = 2**; the other cards count nothing.', cards: 'points' },
    { text: 'There are **120 points** in all. The declarer needs **61 points** to win; with 60 the game is lost.' },
    { text: 'Order within a suit: **A > 10 > K > D > 9 > 8 > 7**.', cards: 'suitOrder' },
    { text: 'Whoever wins the bidding chooses the game: in a **suit game** that suit is highest; in a **Grand** only the **B** are trumps.' },
    { text: 'The **B** are always trumps and higher than any trump of a suit. Their order: **♣ clubs, ♠ spades, ♥ hearts, ♦ diamonds**. When the card led is not a trump, a B cannot be used to follow its suit – even if it has the same suit.', cards: 'jacks' },
    { text: 'The declarer may **exchange the Skat** with cards from the hand; the points of the two cards put back count for the declarer.' },
    { text: '**Null**: the declarer wins by taking **no trick at all**. There are no trumps; the B go back to their own suits. Order: **A > K > D > B > 10 > 9 > 8 > 7**.', cards: 'nullOrder' },
  ],
  play: { text: 'That is all – the table shows you the rest.', button: 'Play now' },
  further: { course: 'Step by step: the Skat course', rules: 'All the rules in detail' },
}

export const QUICK_START: Record<Locale, QuickStart> = { de: DE, en: EN }
