import { m } from '~/paraglide/messages'
import type { Locale } from '~/paraglide/runtime'

/**
 * The big online Skat sites side by side (SKATGO-228). The page speaks well of every provider and leads to SkatGo
 * (the human: 「可以比较，但是都说好话，主要是导流到skatgo首页」): each portrait is written in our own words from what the
 * provider says about itself, attributed where it is its own claim, and nothing negative or sensitive is stated — no ads,
 * no money play, no "needs an account". Every statement about another provider carries the address it came from, read
 * once on CHECKED (the raw pages are in the ticket's tmp/crawl). Nothing is crawled again on its own: the human updates
 * this file by hand (「我们手动去更新就行了，你不要搞cron去定期爬」).
 */

export const CHECKED = '2026-11-22'

export type Text = Record<Locale, string>
/** `yes`: the provider offers it, in a few words; `unknown`: nothing found on its pages, shown as a dash. */
export type Mark = 'yes' | 'unknown'
/** `short` is the matrix's few words, `text` the portrait's full line. */
export type Cell = { mark: Mark; short: Text; text: Text; source?: string }

export const COLUMNS = ['special', 'opponents', 'platforms', 'rules', 'compete', 'learn'] as const
export type Column = (typeof COLUMNS)[number]

export type Site = {
  id: string
  name: string
  /** The provider's home page (or its app's page when it has no site to play on). */
  url: string
  operator: string
  /** Who it suits, in a few words. */
  suits: Text
  /** Its portrait: a few sentences in our own words. */
  about: Text
  aboutSource: string
  cells: Record<Column, Cell>
  /** What stands out, one line each, with its source. */
  highlights: { text: Text; source: string }[]
}

const unknown = (): Cell => ({ mark: 'unknown', short: { de: '–', en: '–' }, text: { de: 'keine Angabe', en: 'not stated' } })
const cell = (de: string, en: string, shortDe: string, shortEn: string, source?: string): Cell => ({ mark: 'yes', short: { de: shortDe, en: shortEn }, text: { de, en }, source })

const SP = 'https://www.skat-palast.de/'
const SP_PLAY = 'https://play.google.com/store/apps/details?id=air.de.rgerlach.skatpalast&hl=de&gl=DE'
const SP_FAQ = 'https://www.spiele-palast.de/faq/'
const SS = 'https://www.skatstube.de/'
const SS_HELP = 'https://www.skatstube.de/hilfe'
const ES = 'https://www.euroskat.com/'
const ST_PLAY = 'https://play.google.com/store/apps/details?id=com.gameduell.skat.treff.kartenspiel&hl=de&gl=DE'
const ST_IOS = 'https://apps.apple.com/de/app/id6443509128'
const PO = 'https://www.playok.com/de/skat/'
const P123 = 'https://www.spiele123.com/spiel/skat'
const SO = 'https://www.skat-online.com/de/'
const IS = 'https://www.skat-spiel.de/'
const IS_PLAY = 'https://play.google.com/store/apps/details?id=com.isarinteractive.skat.android.ad&hl=de&gl=DE'

/** SkatGo first, as one row among the others; its own facts need no outside source. */
export const SITES: Site[] = [
  {
    id: 'skatgo',
    name: 'SkatGo',
    url: 'https://skatgo.com',
    operator: 'SkatGo',
    suits: { de: 'Sofort spielen, üben und besser werden', en: 'Playing straight away, practising, getting better' },
    about: { de: '', en: '' },
    aboutSource: '',
    cells: {
      special: cell('Nach jedem Spiel der Vergleich mit dem Computer auf denselben Karten', 'After every game, a comparison with the computer on the same cards', 'Jedes Spiel mit dem Computer verglichen', 'Every game compared with the computer'),
      opponents: cell('Zwei Computer-Gegner, jederzeit bereit; in der Liga auch Menschen', 'Two computer opponents, ready any time; people too in the League', 'Computer; Liga: Menschen', 'Computer; League: people'),
      platforms: cell('Im Browser auf Handy, Tablet und PC, ohne Download und ohne Konto', 'In the browser on phone, tablet and PC, no download', 'Browser, ohne Konto', 'Browser, no account'),
      rules: cell('Internationale Skatordnung', 'International Skat Order', 'ISkO', 'ISkO'),
      compete: cell('Jeden Tag ein Turnier mit denselben Karten für alle, dazu eine Liga mit sechs Stufen', 'A daily tournament with the same cards for everyone, and a League with six tiers', 'Tagesturnier, Liga', 'Daily tournament, League'),
      learn: cell('Kurs mit elf Lektionen, 150 Reizaufgaben, 20 Endspiele', 'A course of eleven lessons, 150 bidding exercises, 20 endgames', 'Kurs, 170 Aufgaben', 'Course, 170 exercises'),
    },
    highlights: [],
  },
  {
    id: 'skat-palast',
    name: 'Skat Palast',
    url: SP,
    operator: 'Spiele-Palast GmbH',
    suits: { de: 'Live gegen Menschen und mit vielen Vereinen', en: 'Live play against people and many clubs' },
    about: {
      de: 'Der Skat Palast ist eine der bekanntesten Adressen für Live-Skat. Seit über zwölf Jahren treffen sich dort Spielerinnen und Spieler aus ganz Deutschland, laut Anbieter rund 100.000 im Monat. Gespielt wird am Standardtisch nach der Internationalen Skatordnung, und wer mag, wählt Sonderregeln wie Ramsch und Bock. Über 1.700 Vereine, eine Liga und Saisonturniere sorgen für Wettbewerb.',
      en: 'Skat Palast is one of the best-known places for live Skat. For over twelve years players from all over Germany have met there, by its own account around 100,000 a month. The standard table follows the International Skat Order, and anyone who likes can choose special rules such as Ramsch and Bock. Over 1,700 clubs, a league and seasonal tournaments keep it competitive.',
    },
    aboutSource: SP_PLAY,
    cells: {
      special: cell('Rund 100.000 aktive Spieler im Monat und über 1.700 Vereine', 'Around 100,000 active players a month and over 1,700 clubs', '100.000 Spieler im Monat', '100,000 players a month', SP_PLAY),
      opponents: cell('Echte Spieler, live', 'Real players, live', 'Menschen, live', 'People, live', SP),
      platforms: cell('Browser, Windows, iOS, Android, Facebook, Amazon', 'Browser, Windows, iOS, Android, Facebook, Amazon', 'Browser, Windows, Apps', 'Browser, Windows, apps', SP),
      rules: cell('ISkO am Standardtisch; Kontra, Re, Ramsch, Bock wählbar', 'ISkO at the standard table; Kontra, Re, Ramsch, Bock optional', 'ISkO, Sonderregeln', 'ISkO, special rules', SP),
      compete: cell('Liga mit TrueSkill-Wertung, Saisonturniere, Vereine', 'League rated by TrueSkill, seasonal tournaments, clubs', 'Liga, Turniere, Vereine', 'League, tournaments, clubs', SP_FAQ),
      learn: cell('Skat-Schule mit Anleitung, Glossar und Lektionen', 'Skat school with guide, glossary and lessons', 'Skat-Schule', 'Skat school', SP),
    },
    highlights: [
      { text: { de: 'Auf Mobilgeräten ohne Konto startklar.', en: 'Ready to go on mobile devices without an account.' }, source: SP },
      { text: { de: 'App Store 4,5 Sterne bei 13.528 Bewertungen.', en: 'App Store 4.5 stars from 13,528 ratings.' }, source: 'https://apps.apple.com/de/app/id526976110' },
      { text: { de: 'Kompakte Skatregeln zum Ausdrucken.', en: 'Compact Skat rules to print.' }, source: SP },
    ],
  },
  {
    id: 'skatstube',
    name: 'Skatstube',
    url: SS,
    operator: 'Skatstube GmbH, Berlin',
    suits: { de: 'Gesellige Runden gegen Menschen', en: 'Sociable games against people' },
    about: {
      de: 'Die Skatstube aus Berlin ist eine große Skat-Gemeinschaft im Netz, laut Anbieter mit 370.000 Skatspielern. In der „Kneipe“ wird mit Kontra, Re und Ramsch gespielt, für alle, die es gesellig mögen. Anmeldung und Spielen sind kostenlos, und Turniere, Ranglisten und Vereine bringen Abwechslung.',
      en: 'Skatstube from Berlin is a large Skat community online, by its own account with 370,000 Skat players. Its "Kneipe" plays with Kontra, Re and Ramsch, for everyone who likes it sociable. Signing up and playing are free, and tournaments, rankings and clubs add variety.',
    },
    aboutSource: SS,
    cells: {
      special: cell('Die „Kneipe“ mit Kontra, Re und Ramsch', 'The "Kneipe" with Kontra, Re and Ramsch', 'Kneipe mit Ramsch', 'Pub room with Ramsch', SS_HELP),
      opponents: cell('Echte Spieler; in der iOS-App auch ein starker Computergegner', 'Real players; a strong computer opponent in the iOS app too', 'Menschen; iOS: Computer', 'People; iOS: computer', 'https://www.skatstube.de/skat-app'),
      platforms: cell('Browser, iPhone, iPad', 'Browser, iPhone, iPad', 'Browser, iOS', 'Browser, iOS', SS_HELP),
      rules: cell('ISkO; Kontra, Re und Ramsch in der „Kneipe“', 'ISkO; Kontra, Re and Ramsch in the "Kneipe"', 'ISkO, Kneipe', 'ISkO, pub room', SS_HELP),
      compete: cell('Turniere, Ehrentribüne und Vereine', 'Tournaments, hall of fame and clubs', 'Turniere, Vereine', 'Tournaments, clubs', SS_HELP),
      learn: cell('Regelseiten und ein Reizassistent', 'Rules pages and a bidding assistant', 'Regeln, Reizhilfe', 'Rules, bidding aid', 'https://www.skatstube.de/skat-lernen'),
    },
    highlights: [
      { text: { de: 'Setzt nicht auf ablenkende Werbebanner.', en: 'Does without distracting ad banners.' }, source: SS_HELP },
      { text: { de: 'Offline-Trainingsmodus für iPhone und iPad.', en: 'Offline training mode for iPhone and iPad.' }, source: SS },
    ],
  },
  {
    id: 'euroskat',
    name: 'Euroskat',
    url: ES,
    operator: 'Ver-Ma-Web GmbH, Elsfleth',
    suits: { de: 'Turnierskat und offizielle Online-Wettbewerbe', en: 'Tournament Skat and official online competitions' },
    about: {
      de: 'Euroskat ist seit 2007 eine feste Größe für Turnierskat im Internet. In Kooperation mit dem Deutschen Skatverband laufen dort offizielle Wettbewerbe wie die Online-Bundesliga, der Damenpokal und Einzelmeisterschaften. Zwischen 8:15 und 23:55 Uhr starten täglich zahlreiche Turniere, und deutschsprachige Moderatoren betreuen das Spiel bis spät in die Nacht.',
      en: 'Euroskat has been a fixture of online tournament Skat since 2007. With the German Skat association it hosts official competitions such as the online Bundesliga, the women\'s cup and individual championships. Between 8:15 am and 11:55 pm many tournaments start every day, and German-speaking moderators look after the games until late at night.',
    },
    aboutSource: ES,
    cells: {
      special: cell('Offizielle Online-Wettbewerbe mit dem Deutschen Skatverband', 'Official online competitions with the German Skat association', 'DSkV-Online-Bundesliga', 'DSkV online Bundesliga', ES),
      opponents: cell('Echte Spieler; die KI „Robi“ springt ein, wenn jemand ausfällt', 'Real players; the AI "Robi" steps in when someone drops out', 'Menschen', 'People', 'https://www.euroskat.com/ki'),
      platforms: cell('Im Browser, auch auf dem Tablet, ohne Download', 'In the browser, tablets too, no download', 'Browser', 'Browser', ES),
      rules: cell('Internationale Skatordnung', 'International Skat Order', 'ISkO', 'ISkO', 'https://www.euroskat.com/agb'),
      compete: cell('Tägliche Turniere, DSkV-Online-Bundesliga, Ranglisten', 'Daily tournaments, DSkV online league, rankings', 'Turniere, DSkV-Liga', 'Tournaments, DSkV league', ES),
      learn: cell('Skatschule und Tipps für Anfänger', 'Skat school and tips for beginners', 'Skatschule', 'Skat school', 'https://www.euroskat.com/faq'),
    },
    highlights: [
      { text: { de: 'Deutsches, französisches und Senioren-Blatt.', en: 'German, French and large-print decks.' }, source: ES },
      { text: { de: 'Kostenloser Fun-Bereich zum Kennenlernen.', en: 'A free fun area to get to know it.' }, source: 'https://www.euroskat.com/spiele' },
      { text: { de: 'Auch Zweier-Skat „EnDeux“.', en: 'Two-player Skat "EnDeux" too.' }, source: 'https://www.euroskat.com/spiele' },
    ],
  },
  {
    id: 'skat-treff',
    name: 'Skat Treff (GameDuell)',
    url: 'https://www.skattreff.de/',
    operator: 'GameDuell GmbH',
    suits: { de: 'Live-Skat auf dem Handy', en: 'Live Skat on a phone' },
    about: {
      de: 'Skat Treff von GameDuell bringt Live-Skat aufs Handy: Gegner aus ganz Deutschland oder die eigene Runde aus der Kneipe. Gespielt wird nach Turnier- oder Kneipenregeln, mit altdeutschem, französischem oder Turnierblatt. Im Liga-Modus steigt man in der Rangliste auf, und Skat Treff ist langjähriger Partner des Deutschen Skatverbands.',
      en: 'GameDuell\'s Skat Treff brings live Skat to the phone: opponents from all over Germany or your own pub group. You play by tournament or pub rules, with an old German, French or tournament deck. In league mode you climb the ranking, and Skat Treff is a long-standing partner of the German Skat association.',
    },
    aboutSource: ST_PLAY,
    cells: {
      special: cell('Langjähriger Partner des Deutschen Skatverbands', 'Long-standing partner of the German Skat association', 'Partner des DSkV', 'DSkV partner', ST_PLAY),
      opponents: cell('Echte Spieler aus ganz Deutschland', 'Real players from all over Germany', 'Menschen', 'People', ST_PLAY),
      platforms: cell('iPhone, iPad und Android', 'iPhone, iPad and Android', 'Apps', 'Apps', ST_IOS),
      rules: cell('Turnier- oder Kneipenregeln', 'Tournament or pub rules', 'Turnier, Kneipe', 'Tournament, pub', ST_PLAY),
      compete: cell('Liga-Modus und Turniere', 'League mode and tournaments', 'Liga, Turniere', 'League, tournaments', ST_PLAY),
      learn: cell('Hilfeseiten und deutsche Kundenbetreuung', 'Help pages and German customer support', 'Hilfeseiten', 'Help pages', ST_PLAY),
    },
    highlights: [
      { text: { de: 'App Store 4,6 Sterne bei 23.208 Bewertungen.', en: 'App Store 4.6 stars from 23,208 ratings.' }, source: ST_IOS },
      { text: { de: 'Google Play 4,3 Sterne bei 22.300 Rezensionen.', en: 'Google Play 4.3 stars from 22,300 reviews.' }, source: ST_PLAY },
    ],
  },
  {
    id: 'playok',
    name: 'PlayOK (Kurnik)',
    url: PO,
    operator: 'PlayOK',
    suits: { de: 'Eine schnelle Partie gegen Gegner aus aller Welt', en: 'A quick game against players from all over the world' },
    about: {
      de: 'PlayOK, früher Kurnik, ist ein internationales Spieleportal mit Skat-Sälen, in denen Gegner aus aller Welt sitzen. Man spielt kostenlos im Browser, auch auf dem Handy, und kann als Gast vorbeischauen. Ranglisten, Statistiken und Profile zeigen, wie man sich schlägt.',
      en: 'PlayOK, formerly Kurnik, is an international games portal with Skat rooms full of opponents from all over the world. You play free in the browser, phones too, and can drop in as a guest. Rankings, statistics and profiles show how you are doing.',
    },
    aboutSource: PO,
    cells: {
      special: cell('Skat-Säle in 36 Sprachen', 'Skat rooms in 36 languages', '36 Sprachen', '36 languages', PO),
      opponents: cell('Live-Gegner aus aller Welt', 'Live opponents from all over the world', 'Menschen, weltweit', 'People, worldwide', PO),
      platforms: cell('Im Browser, auch auf dem Handy', 'In the browser, phones too', 'Browser', 'Browser', PO),
      rules: unknown(),
      compete: cell('Ranglisten, Statistiken und Profile', 'Rankings, statistics and profiles', 'Ranglisten', 'Rankings', PO),
      learn: unknown(),
    },
    highlights: [
      { text: { de: 'In 36 Sprachen.', en: 'In 36 languages.' }, source: PO },
      { text: { de: 'Gastzugang ohne Anmeldung.', en: 'Guest access without signing up.' }, source: PO },
    ],
  },
  {
    id: 'skat-123',
    name: 'Skat auf Spiele123',
    url: P123,
    operator: 'Popcom d.o.o., Ljubljana',
    suits: { de: 'Ein schnelles Spiel zwischendurch', en: 'A quick game in between' },
    about: {
      de: 'Auf dem Spieleportal Spiele123 gibt es Skat als schnelles Browserspiel für zwischendurch, ohne Download. Wer sein Ergebnis festhalten will, legt ein Konto an. Eine Highscore-Liste mit Bronze-, Silber- und Gold-Marken zeigt, wie man im Vergleich abschneidet.',
      en: 'On the Spiele123 games portal Skat is a quick browser game for in between, with no download. Anyone who wants to keep a score creates an account. A high-score table with bronze, silver and gold marks shows how you compare.',
    },
    aboutSource: P123,
    cells: {
      special: cell('Highscore-Liste mit Bronze-, Silber- und Gold-Marken', 'High-score table with bronze, silver and gold marks', 'Medaillen für Highscores', 'Medals for high scores', P123),
      opponents: unknown(),
      platforms: cell('Im Browser auf jedem Gerät', 'In the browser on any device', 'Browser', 'Browser', 'https://about.play123.com'),
      rules: unknown(),
      compete: cell('Highscore-Liste mit Medaillen', 'High-score table with medals', 'Highscores', 'High scores', P123),
      learn: unknown(),
    },
    highlights: [
      { text: { de: 'Teil eines Portals mit über 7.500 Spielen.', en: 'Part of a portal with over 7,500 games.' }, source: 'https://about.play123.com' },
    ],
  },
  {
    id: 'skat-online',
    name: 'Skat-Online',
    url: SO,
    operator: 'MY Skat GmbH & Co. KG',
    suits: { de: 'Clubskat streng nach Skatordnung', en: 'Club Skat strictly by the rules' },
    about: {
      de: 'Skat-Online gibt es seit rund 20 Jahren, und viele Online-Clubs tragen dort ihre Serien aus. Gespielt wird streng nach der Internationalen Skatordnung, so wie im Verein. Laut Anbieter zählt die Plattform über eine Million Mitglieder und 30 Millionen Spiele im Jahr, und Monats- und Jahresranglisten zeigen die Besten.',
      en: 'Skat-Online has been around for about 20 years, and many online clubs play their series there. It follows the International Skat Order strictly, just like a club. By its own account the platform has over a million members and 30 million games a year, and monthly and yearly rankings show the best.',
    },
    aboutSource: SO,
    cells: {
      special: cell('Seit rund 20 Jahren die Plattform vieler Online-Clubs', 'For about 20 years the platform of many online clubs', 'Clubskat seit 20 Jahren', 'Club Skat for 20 years', SO),
      opponents: cell('Echte Spieler, viele Online-Clubs', 'Real players, many online clubs', 'Menschen', 'People', SO),
      platforms: cell('Programm für Windows, Linux und Mac', 'A program for Windows, Linux and Mac', 'Windows, Linux, Mac', 'Windows, Linux, Mac', SO),
      rules: cell('Streng nach der Internationalen Skatordnung', 'Strictly by the International Skat Order', 'Streng ISkO', 'Strict ISkO', 'https://www.skat-online.com/de/regeln-hilfe/faq.html'),
      compete: cell('Turniere, Monats- und Jahresranglisten, Clubs', 'Tournaments, monthly and yearly rankings, clubs', 'Turniere, Clubs', 'Tournaments, clubs', SO),
      learn: cell('Ausführliches Regelwerk', 'A detailed rulebook', 'Regelwerk', 'Rulebook', SO),
    },
    highlights: [
      { text: { de: 'Kostenloser Standardbereich.', en: 'A free standard area.' }, source: 'https://www.skat-online.com/de/regeln-hilfe/gebuehren.html' },
      { text: { de: 'Laut Anbieter über 25.000 registrierte Turnierspieler.', en: 'By its own account over 25,000 registered tournament players.' }, source: SO },
      { text: { de: 'Auch Zweier-Skat „Skat En Deux“.', en: 'Two-player "Skat En Deux" too.' }, source: 'https://www.skat-online.com/de/regeln-hilfe/faq.html' },
    ],
  },
  {
    id: 'isar-skat',
    name: 'Skat (Isar Interactive)',
    url: IS,
    operator: 'Isar Interactive GmbH & Co. KG',
    suits: { de: 'Skat unterwegs und auch offline', en: 'Skat on the go and offline' },
    about: {
      de: 'Die Skat-App von Isar Interactive ist eine der meistbewerteten Skat-Apps, mit über einer Million Downloads und 4,5 Sternen bei Google Play. Man spielt offline gegen starke Computergegner oder online an öffentlichen Tischen, nach DSkV-Regeln oder wie am Stammtisch mit Kontra, Re, Ramsch und Bock. Ein Strategie-Trainer von Skatmeister Daniel Schäfer und ein Analysemodus helfen beim Besserwerden.',
      en: 'Isar Interactive\'s Skat is one of the most-rated Skat apps, with over a million downloads and 4.5 stars on Google Play. You play offline against strong computer opponents or online at public tables, by DSkV rules or pub-style with Kontra, Re, Ramsch and Bock. A strategy trainer by Skat master Daniel Schäfer and an analysis mode help you improve.',
    },
    aboutSource: IS_PLAY,
    cells: {
      special: cell('Strategie-Trainer von Skatmeister Daniel Schäfer', 'Strategy trainer by Skat master Daniel Schäfer', 'Trainer vom Skatmeister', 'Trainer by a Skat master', IS_PLAY),
      opponents: cell('Starke Computergegner und echte Mitspieler', 'Strong computer opponents and real players', 'Computer, Menschen', 'Computer, people', IS_PLAY),
      platforms: cell('Android, iPhone, iPad, Mac und Windows', 'Android, iPhone, iPad, Mac and Windows', 'Apps, Mac, Windows', 'Apps, Mac, Windows', IS),
      rules: cell('DSkV-Regeln oder Stammtisch mit Kontra, Re, Ramsch, Bock', 'DSkV rules or pub rules with Kontra, Re, Ramsch, Bock', 'DSkV, Stammtisch', 'DSkV, pub rules', IS_PLAY),
      compete: cell('Private Turniere mit Freunden', 'Private tournaments with friends', 'Private Turniere', 'Private tournaments', IS_PLAY),
      learn: cell('Strategie-Trainer, interaktive Einführung, Analysemodus', 'Strategy trainer, interactive introduction, analysis mode', 'Trainer, Analyse', 'Trainer, analysis', IS_PLAY),
    },
    highlights: [
      { text: { de: 'Online-Tische ohne Anmeldung.', en: 'Online tables without signing up.' }, source: IS_PLAY },
      { text: { de: 'Abrechnung nach Seeger-Fabian oder Bierlachs.', en: 'Scoring by Seeger-Fabian or Bierlachs.' }, source: IS_PLAY },
      { text: { de: 'App Store „Skat LITE“ 4,6 Sterne bei 69.950 Bewertungen.', en: 'App Store "Skat LITE" 4.6 stars from 69,950 ratings.' }, source: 'https://apps.apple.com/de/app/skat-lite/id574907037' },
    ],
  },
]

/** The page's questions, also its FAQPage (the route's head). */
export function compareFaq(): { q: string; a: string }[] {
  return [
    { q: m.compare_faq_1_q(), a: m.compare_faq_1_a() },
    { q: m.compare_faq_2_q(), a: m.compare_faq_2_a() },
    { q: m.compare_faq_3_q(), a: m.compare_faq_3_a() },
    { q: m.compare_faq_4_q(), a: m.compare_faq_4_a() },
    { q: m.compare_faq_5_q(), a: m.compare_faq_5_a() },
    { q: m.compare_faq_6_q(), a: m.compare_faq_6_a() },
  ]
}
