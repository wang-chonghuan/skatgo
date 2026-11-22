import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { CHECKED, type Text } from './compare'
import { breadcrumbs, pageHead, samePath } from './head'
import { localizedUrl } from './site'

/**
 * One page per big Skat brand (SKATGO-229), under the comparison of Skat sites: for the people who search a brand's
 * name, what it offers and the questions asked about it, each in our own words from the brand's own pages, read once
 * on compare.ts's CHECKED date and updated by hand. Every page is its own: its words are the brand's, not a template
 * with the name swapped (Google's "doorway pages"). Nothing negative or sensitive is said — no ads, no money play — and
 * every page leads to SkatGo. Spiele123 has no page: too little is known about it to say anything of substance.
 */

export type Sourced = { text: Text; source: string }
export type Brand = {
  /** The id in compare.ts's SITES, also the last part of the address. */
  id: 'skat-palast' | 'skatstube' | 'euroskat' | 'skat-online'
  name: string
  /** The name as a sentence's subject ("die Skatstube") and after "Fragen" ("zur Skatstube"). */
  subject: Text
  about: Text
  title: Text
  description: Text
  heading: Text
  intro: Text
  introSource: string
  offers: Sourced[]
  faq: { q: Text; a: Text; source: string }[]
}

const s = (de: string, en: string, source: string): Sourced => ({ text: { de, en }, source })
const qa = (qde: string, ade: string, qen: string, aen: string, source: string) => ({ q: { de: qde, en: qen }, a: { de: ade, en: aen }, source })

const SP = 'https://www.skat-palast.de/'
const SP_PLAY = 'https://play.google.com/store/apps/details?id=air.de.rgerlach.skatpalast&hl=de&gl=DE'
const SP_FAQ = 'https://www.spiele-palast.de/faq/'
const SP_IOS = 'https://apps.apple.com/de/app/id526976110'
const SS = 'https://www.skatstube.de/'
const SS_HELP = 'https://www.skatstube.de/hilfe'
const SS_APP = 'https://www.skatstube.de/skat-app'
const SS_LEARN = 'https://www.skatstube.de/skat-lernen'
const ES = 'https://www.euroskat.com/'
const ES_GAMES = 'https://www.euroskat.com/spiele'
const ES_FAQ = 'https://www.euroskat.com/faq'
const ES_AI = 'https://www.euroskat.com/ki'
const ES_MOBILE = 'https://www.euroskat.com/mobil-spielen'
const ES_TERMS = 'https://www.euroskat.com/agb'
const SO = 'https://www.skat-online.com/de/'
const SO_FAQ = 'https://www.skat-online.com/de/regeln-hilfe/faq.html'
const SO_FEES = 'https://www.skat-online.com/de/regeln-hilfe/gebuehren.html'
const SO_PREMIUM = 'https://www.skat-online.com/de/regeln-hilfe/premium-mitglied.html'
const SO_INSTALL = 'https://www.skat-online.com/de/skat-online-installieren.html'

export const BRANDS: Brand[] = [
  {
    id: 'skat-palast',
    name: 'Skat Palast',
    subject: { de: 'der Skat Palast', en: 'Skat Palast' },
    about: { de: 'zum Skat Palast', en: 'about Skat Palast' },
    title: { de: 'Skat Palast: kostenlos spielen, App, Regeln und Turniere | SkatGo', en: 'Skat Palast: Free Play, App, Rules and Tournaments | SkatGo' },
    description: {
      de: 'Der Skat Palast im Überblick: Live-Skat gegen echte Gegner, Apps für iOS, Android und Windows, Standardtisch nach ISkO, Liga, Vereine und Skat-Schule. Dazu die häufigsten Fragen.',
      en: 'Skat Palast at a glance: live Skat against real opponents, apps for iOS, Android and Windows, a standard table by the ISkO, league, clubs and a Skat school. Plus the most common questions.',
    },
    heading: { de: 'Skat Palast im Überblick: App, Regeln, Liga und Turniere', en: 'Skat Palast at a glance: app, rules, league and tournaments' },
    intro: {
      de: 'Der Skat Palast der Spiele-Palast GmbH ist seit über zwölf Jahren eine bewährte Live-Plattform für Skat. Laut Anbieter treffen sich dort rund 100.000 aktive Spieler im Monat, organisiert in über 1.700 Vereinen. Man spielt im Browser, unter Windows oder in den Apps für iPhone, iPad und Android, am Standardtisch nach der Internationalen Skatordnung oder mit Sonderregeln wie Ramsch und Bock.',
      en: 'Spiele-Palast GmbH\'s Skat Palast has been a proven live platform for Skat for over twelve years. By its own account around 100,000 active players meet there every month, organised in over 1,700 clubs. You play in the browser, on Windows or in the apps for iPhone, iPad and Android, at the standard table by the International Skat Order or with special rules such as Ramsch and Bock.',
    },
    introSource: SP_PLAY,
    offers: [
      s('Live-Skat gegen echte Gegner aus ganz Deutschland', 'Live Skat against real opponents from all over Germany', SP),
      s('Standardtisch nach der Internationalen Skatordnung des DSkV, dazu Sonderregeln wie Ramsch, Bock, Kontra und Re', 'A standard table by the DSkV\'s International Skat Order, plus special rules such as Ramsch, Bock, Kontra and Re', SP_PLAY),
      s('Eine Liga mit TrueSkill-Wertung und Saisonturniere wie das Herbstturnier', 'A league rated by TrueSkill and seasonal tournaments such as the autumn tournament', SP_FAQ),
      s('Über 1.700 aktive Vereine', 'Over 1,700 active clubs', SP_PLAY),
      s('Skat-Schule mit Anleitung, Glossar, Lektionen und kompakten Regeln zum Ausdrucken', 'A Skat school with a guide, glossary, lessons and compact rules to print', SP),
      s('Im Browser, unter Windows, auf iOS und Android, über Facebook und Amazon', 'In the browser, on Windows, iOS and Android, via Facebook and Amazon', SP),
      s('Auf Deutsch und Englisch', 'In German and English', SP_IOS),
      s('Fällt ein Mitspieler aus, vertritt ihn bis zu zwei Minuten eine KI', 'If a player drops out, an AI stands in for up to two minutes', SP_FAQ),
    ],
    faq: [
      qa('Ist der Skat Palast kostenlos?', 'Ja. Laut Anbieter ist der Skat Palast dauerhaft komplett kostenlos spielbar. Wer mag, kann im Spiel Erweiterungen wie Chips, eine Premium-Mitgliedschaft oder besondere Spielkarten dazukaufen.',
        'Is Skat Palast free?', 'Yes. By its own account Skat Palast can be played completely free for good. Anyone who likes can buy extras in the game such as chips, a Premium membership or special decks.', SP_PLAY),
      qa('Gibt es den Skat Palast als App?', 'Ja, für iPhone und iPad, für Android und für Windows. Außerdem läuft er im Browser, über Facebook und über Amazon. Im App Store hat er 4,5 Sterne bei 13.528 Bewertungen (Stand 22.11.2026).',
        'Is Skat Palast available as an app?', 'Yes, for iPhone and iPad, for Android and for Windows. It also runs in the browser, via Facebook and via Amazon. On the App Store it has 4.5 stars from 13,528 ratings (as of 22 November 2026).', SP_IOS),
      qa('Kann man im Skat Palast ohne Anmeldung spielen?', 'Auf Mobilgeräten kannst du laut Anbieter ohne Account-Erstellung loslegen. Bei SkatGo spielst du sofort im Browser, ganz ohne Konto.',
        'Can I play Skat Palast without signing up?', 'On mobile devices you can start without creating an account, it says. On SkatGo you play straight away in the browser, with no account at all.', SP),
      qa('Nach welchen Regeln wird im Skat Palast gespielt?', 'Am Standardtisch nach der Internationalen Skatordnung des DSkV. Dazu gibt es Sonderregeln wie Ramsch, Bockrunden, Kontra und Re; Tische mit Sonderregeln eröffnen Premium-Spieler, mitspielen können alle.',
        'Which rules does Skat Palast use?', 'At the standard table the DSkV\'s International Skat Order. There are also special rules such as Ramsch, Bock rounds, Kontra and Re; Premium players open tables with special rules, and everyone can join them.', SP_FAQ),
      qa('Welche Turniere und Ligen gibt es im Skat Palast?', 'Eine Liga mit TrueSkill-Wertung, Saisonturniere wie das Herbst- oder das Halloweenturnier und über 1.700 aktive Vereine mit eigener Vereins-Liga.',
        'Which tournaments and leagues does Skat Palast have?', 'A league rated by TrueSkill, seasonal tournaments such as the autumn or Halloween tournament, and over 1,700 active clubs with their own club league.', SP_FAQ),
      qa('Wo kann man Skat lernen?', 'Im Skat Palast in der Skat-Schule mit Anleitung, Glossar und Lektionen. Bei SkatGo lernst du in elf Lektionen, in denen du die Karten selbst spielst, und übst mit 150 Reizaufgaben.',
        'Where can I learn Skat?', 'At Skat Palast in its Skat school with a guide, glossary and lessons. On SkatGo you learn in eleven lessons in which you play the cards yourself, and practise with 150 bidding exercises.', SP),
    ],
  },
  {
    id: 'skatstube',
    name: 'Skatstube',
    subject: { de: 'die Skatstube', en: 'Skatstube' },
    about: { de: 'zur Skatstube', en: 'about Skatstube' },
    title: { de: 'Skatstube: kostenlos Skat spielen, App und Regeln | SkatGo', en: 'Skatstube: Free Skat, App and Rules | SkatGo' },
    description: {
      de: 'Die Skatstube im Überblick: kostenlose Anmeldung, Spielräume wie die „Kneipe“ mit Kontra, Re und Ramsch, Apps für iPhone und iPad mit Trainingsmodus, Turniere und Vereine. Dazu die häufigsten Fragen.',
      en: 'Skatstube at a glance: free sign-up, rooms such as the "Kneipe" with Kontra, Re and Ramsch, apps for iPhone and iPad with a training mode, tournaments and clubs. Plus the most common questions.',
    },
    heading: { de: 'Skatstube im Überblick: Spielräume, App und Regeln', en: 'Skatstube at a glance: rooms, app and rules' },
    intro: {
      de: 'Die Skatstube ist ein Skat-Portal der Skatstube GmbH aus Berlin. Laut Anbieter spielen dort 370.000 Skatspieler, sodass jeder die passenden Mitspieler findet. Anmeldung und Spielen sind kostenlos, gespielt wird im Browser oder in den Apps für iPhone und iPad. Wer es gesellig mag, setzt sich in die „Kneipe“, wo Kontra, Re und Ramsch dazugehören.',
      en: 'Skatstube is a Skat portal run by Skatstube GmbH in Berlin. By its own account 370,000 Skat players play there, so everyone finds the right partners. Signing up and playing are free, and you play in the browser or in the apps for iPhone and iPad. If you like it sociable, take a seat in the "Kneipe", where Kontra, Re and Ramsch belong.',
    },
    introSource: SS,
    offers: [
      s('Kostenlose Anmeldung und kostenloses Spiel, so lange man mag', 'Free sign-up and free play for as long as you like', SS_HELP),
      s('Verschiedene Spielräume, darunter die „Kneipe“ mit Kontra, Re und Ramsch', 'Several rooms, among them the "Kneipe" with Kontra, Re and Ramsch', SS_HELP),
      s('Regeln nach der Internationalen Skatordnung', 'Rules by the International Skat Order', SS_HELP),
      s('Regelmäßige Turniere, Spielstatistik und Ehrentribüne', 'Regular tournaments, game statistics and a hall of fame', SS_HELP),
      s('Vereine, denen jeder Spieler beitreten kann', 'Clubs that every player can join', SS_HELP),
      s('Apps für iPhone und iPad mit Offline-Trainingsmodus gegen einen starken Computergegner', 'Apps for iPhone and iPad with an offline training mode against a strong computer opponent', SS_APP),
      s('Regelseiten zu Blatt, Trumpf, Reizen, Nullspiel und Ouvert, dazu ein Reizassistent', 'Rules pages on the deck, trumps, bidding, Null and Ouvert, plus a bidding assistant', SS_LEARN),
      s('Keine ablenkenden Werbebanner', 'No distracting ad banners', SS_HELP),
    ],
    faq: [
      qa('Ist die Skatstube kostenlos?', 'Ja: Laut Anbieter kann jeder kostenlos Skat spielen, so lange er mag. Wer die Skatstube unterstützen will, wird Fördermitglied (5 € im Monat, ermäßigt 3 €) und kann dann zum Beispiel Tische nur für Freunde eröffnen oder Vereine gründen.',
        'Is Skatstube free?', 'Yes: by its own account everyone can play Skat free for as long as they like. Anyone who wants to support Skatstube becomes a supporting member (€5 a month, reduced €3) and can then, for example, open friends-only tables or found clubs.', SS_HELP),
      qa('Gibt es die Skatstube als App?', 'Für das iPhone gibt es „Skatstube Skat“, für das iPad „Skatstube HD“. Auf anderen Geräten spielst du im Browser: Seite aufrufen, einloggen und auf „Spielen!“ tippen.',
        'Is Skatstube available as an app?', 'For iPhone there is "Skatstube Skat", for iPad "Skatstube HD". On other devices you play in the browser: open the site, log in and tap "Spielen!".', SS_HELP),
      qa('Kann man in der Skatstube gegen den Computer spielen?', 'Ja, in den Apps für iPhone und iPad gibt es einen Trainingsmodus mit starkem Computergegner, auch offline. Im Browser spielst du gegen den Computer zum Beispiel bei SkatGo, ohne Konto.',
        'Can I play against the computer at Skatstube?', 'Yes, the apps for iPhone and iPad have a training mode with a strong computer opponent, offline too. In the browser you can play against the computer on SkatGo, for example, with no account.', SS_APP),
      qa('Nach welchen Regeln spielt die Skatstube?', 'Sie orientiert sich an der Internationalen Skatordnung. In der „Kneipe“ kommen Kontra, Re und das Ramsch-Spiel dazu.',
        'Which rules does Skatstube use?', 'It follows the International Skat Order. In the "Kneipe" Kontra, Re and Ramsch are added.', SS_HELP),
      qa('Gibt es in der Skatstube Vereine und Turniere?', 'Ja. Jeder kann einem bestehenden Verein beitreten, und es gibt regelmäßig Turniere. Die Spielstatistik und die Ehrentribüne zeigen, wer vorn liegt.',
        'Does Skatstube have clubs and tournaments?', 'Yes. Everyone can join an existing club, and there are tournaments regularly. The game statistics and the hall of fame show who is ahead.', SS_HELP),
    ],
  },
  {
    id: 'euroskat',
    name: 'Euroskat',
    subject: { de: 'Euroskat', en: 'Euroskat' },
    about: { de: 'zu Euroskat', en: 'about Euroskat' },
    title: { de: 'Euroskat: Turniere, DSkV-Wettbewerbe und Skatschule | SkatGo', en: 'Euroskat: Tournaments, DSkV Competitions and Skat School | SkatGo' },
    description: {
      de: 'Euroskat im Überblick: seit 2007 Turnierskat im Browser, offizielle DSkV-Wettbewerbe wie die Online-Bundesliga, tägliche Turniere, Moderatoren und Skatschule. Dazu die häufigsten Fragen.',
      en: 'Euroskat at a glance: tournament Skat in the browser since 2007, official DSkV competitions such as the online Bundesliga, daily tournaments, moderators and a Skat school. Plus the most common questions.',
    },
    heading: { de: 'Euroskat im Überblick: Turniere, Online-Bundesliga und Skatschule', en: 'Euroskat at a glance: tournaments, online Bundesliga and Skat school' },
    intro: {
      de: 'Euroskat wird von der Ver-Ma-Web GmbH aus Elsfleth betrieben und ist seit 2007 eine feste Adresse für Turnierskat im Internet. In Kooperation mit dem Deutschen Skatverband finden dort offizielle Wettbewerbe statt, darunter die Online-Bundesliga, der Damenpokal und Einzelmeisterschaften. Gespielt wird direkt im Browser, und deutschsprachige Moderatoren betreuen das Spiel täglich von morgens bis spät in die Nacht.',
      en: 'Euroskat is run by Ver-Ma-Web GmbH in Elsfleth and has been a fixed address for online tournament Skat since 2007. With the German Skat association it hosts official competitions, among them the online Bundesliga, the women\'s cup and individual championships. You play right in the browser, and German-speaking moderators look after the games every day from morning until late at night.',
    },
    introSource: ES,
    offers: [
      s('Zahlreiche Turniere täglich zwischen 8:15 und 23:55 Uhr', 'Many tournaments every day between 8:15 am and 11:55 pm', ES),
      s('Offizielle DSkV-Wettbewerbe: Online-Bundesliga, Damenpokal, Einzelmeisterschaften', 'Official DSkV competitions: online Bundesliga, women\'s cup, individual championships', ES),
      s('Championship-Saison, Ranglisten, Skat Community Club und Treueprogramm', 'A championship season, rankings, the Skat Community Club and a loyalty programme', ES),
      s('Regeln nach der Internationalen Skatordnung', 'Rules by the International Skat Order', ES_TERMS),
      s('Deutsches, französisches und Senioren-Blatt', 'German, French and large-print decks', ES),
      s('Zweier-Skat „EnDeux“', 'Two-player Skat "EnDeux"', ES_GAMES),
      s('Skatschule, Skatregeln und Tipps für Anfänger', 'A Skat school, Skat rules and tips for beginners', ES_FAQ),
      s('Die Skat-KI „Robi“ springt ein, wenn ein Mitspieler ausfällt', 'The Skat AI "Robi" steps in when a player drops out', ES_AI),
    ],
    faq: [
      qa('Ist Euroskat kostenlos?', 'Es gibt einen kostenlosen Fun-Bereich: Jeder bekommt bei der Anmeldung 50 Fun$ gutgeschrieben, ohne Mitgliedschaft und ohne Abo.',
        'Is Euroskat free?', 'There is a free fun area: everyone gets 50 Fun$ when signing up, with no membership and no subscription.', ES_GAMES),
      qa('Gibt es Euroskat als App?', 'Euroskat läuft im Browser, ohne Download. Auf dem iPad oder einem Android-Tablet legst du dir laut Anbieter eine Verknüpfung auf den Home-Bildschirm.',
        'Is Euroskat available as an app?', 'Euroskat runs in the browser, with no download. On an iPad or Android tablet you put a shortcut on the home screen, it explains.', ES_MOBILE),
      qa('Welche offiziellen Wettbewerbe gibt es bei Euroskat?', 'In Kooperation mit dem Deutschen Skatverband finden bei Euroskat offizielle Wettbewerbe statt, darunter die Online-Bundesliga, der Damenpokal und Einzelmeisterschaften.',
        'Which official competitions does Euroskat host?', 'Together with the German Skat association Euroskat hosts official competitions, among them the online Bundesliga, the women\'s cup and individual championships.', ES),
      qa('Wann finden bei Euroskat Turniere statt?', 'Zwischen 8:15 Uhr und 23:55 Uhr starten täglich zahlreiche Turniere, betreut von deutschsprachigen Moderatoren.',
        'When are tournaments held at Euroskat?', 'Many tournaments start every day between 8:15 am and 11:55 pm, looked after by German-speaking moderators.', ES),
      qa('Kann man bei Euroskat Skat lernen?', 'Ja, mit der Skatschule lernt man laut Anbieter die Grundlagen Schritt für Schritt, dazu gibt es Regelseiten und Tipps für Anfänger. Bei SkatGo übst du mit 150 Reizaufgaben und 20 Endspielen mit offenen Karten.',
        'Can I learn Skat at Euroskat?', 'Yes, its Skat school teaches the basics step by step, it says, and there are rules pages and tips for beginners. On SkatGo you practise with 150 bidding exercises and 20 open-card endgames.', ES_FAQ),
    ],
  },
  {
    id: 'skat-online',
    name: 'Skat-Online',
    subject: { de: 'Skat-Online', en: 'Skat-Online' },
    about: { de: 'zu Skat-Online', en: 'about Skat-Online' },
    title: { de: 'Skat-Online: Clubskat nach ISkO, Programm und Ranglisten | SkatGo', en: 'Skat-Online: Club Skat by the ISkO, Program and Rankings | SkatGo' },
    description: {
      de: 'Skat-Online im Überblick: seit 20 Jahren die Plattform vieler Online-Clubs, streng nach der Internationalen Skatordnung, Programm für Windows, Linux und Mac, Turniere und Ranglisten. Dazu die häufigsten Fragen.',
      en: 'Skat-Online at a glance: the platform of many online clubs for 20 years, strictly by the International Skat Order, a program for Windows, Linux and Mac, tournaments and rankings. Plus the most common questions.',
    },
    heading: { de: 'Skat-Online im Überblick: Clubs, Programm und Regeln', en: 'Skat-Online at a glance: clubs, program and rules' },
    intro: {
      de: 'Skat-Online ist eine Skat-Plattform der MY Skat GmbH & Co. KG und laut Anbieter seit 20 Jahren im Netz, mit über einer Million Mitgliedern und 30 Millionen gespielten Spielen im Jahr. Viele Online-Clubs tragen hier ihre Serien aus, und gespielt wird streng nach der Internationalen Skatordnung, so wie im Verein. Man spielt mit einem kleinen Programm, das unter Windows, Linux und Mac läuft.',
      en: 'Skat-Online is a Skat platform run by MY Skat GmbH & Co. KG and, by its own account, has been online for 20 years, with over a million members and 30 million games a year. Many online clubs play their series here, and the rules are strictly the International Skat Order, just like in a club. You play with a small program that runs on Windows, Linux and Mac.',
    },
    introSource: SO,
    offers: [
      s('Streng nach der Internationalen Skatordnung, mit eigener Skat-Online-Skatordnung', 'Strictly by the International Skat Order, with its own Skat-Online rules', SO_FAQ),
      s('Die Plattform vieler Online-Clubs', 'The platform of many online clubs', SO),
      s('Turniere, Monats- und Jahresranglisten und Spielerstatistik', 'Tournaments, monthly and yearly rankings and player statistics', SO),
      s('Laut Anbieter über 25.000 registrierte Turnierspieler', 'By its own account over 25,000 registered tournament players', SO),
      s('Zweier-Skat „Skat En Deux“', 'Two-player "Skat En Deux"', SO_FAQ),
      s('Kostenloser Standardbereich', 'A free standard area', SO_FEES),
      s('Premium mit Buddys, Spielerfilter, exklusiver Rangliste, gespeicherten Spielen und Serien zu 36 Spielen', 'Premium with buddies, player filters, an exclusive ranking, saved games and series of 36 games', SO_PREMIUM),
      s('Programm für Windows, Linux und Mac, nur 272 KB groß', 'A program for Windows, Linux and Mac, only 272 KB', SO_INSTALL),
    ],
    faq: [
      qa('Ist Skat-Online kostenlos?', 'Der Standardbereich ist kostenlos. Premium kostet 24 € im Jahr (einmalig 5 € Einrichtung) und bringt Extras wie Buddys, Spielerfilter und Serien zu 36 Spielen.',
        'Is Skat-Online free?', 'The standard area is free. Premium costs €24 a year (a one-off €5 set-up) and brings extras such as buddies, player filters and series of 36 games.', SO_FEES),
      qa('Wie spielt man Skat-Online?', 'Mit einem Programm für Windows, Linux und Mac, das Java braucht; der Download ist 272 KB groß. Ganz ohne Installation spielst du zum Beispiel bei SkatGo direkt im Browser.',
        'How do I play Skat-Online?', 'With a program for Windows, Linux and Mac that needs Java; the download is 272 KB. With no installing at all you can play on SkatGo, for example, right in the browser.', SO_INSTALL),
      qa('Nach welchen Regeln spielt Skat-Online?', 'Streng nach der Internationalen Skatordnung, so wie bei offiziellen Turnieren: Kontra, Re, Bock und Ramsch gehören nicht dazu.',
        'Which rules does Skat-Online use?', 'Strictly the International Skat Order, as at official tournaments: Kontra, Re, Bock and Ramsch are not part of it.', SO_FAQ),
      qa('Gibt es bei Skat-Online Clubs und Ranglisten?', 'Ja: Skat-Online ist die Plattform vieler Online-Clubs, und Monats- und Jahresranglisten, Spielerstatistik und Turnierergebnisse zeigen, wer vorn liegt.',
        'Does Skat-Online have clubs and rankings?', 'Yes: Skat-Online is the platform of many online clubs, and monthly and yearly rankings, player statistics and tournament results show who is ahead.', SO),
      qa('Wie viele spielen bei Skat-Online?', 'Laut Anbieter über eine Million Mitglieder in 20 Jahren, 30 Millionen Spiele im Jahr und über 25.000 registrierte Turnierspieler.',
        'How many play on Skat-Online?', 'By its own account over a million members in 20 years, 30 million games a year and over 25,000 registered tournament players.', SO),
    ],
  },
]

export const brandOf = (id: Brand['id']): Brand => {
  const brand = BRANDS.find((b) => b.id === id)
  if (!brand) throw new Error(`Unknown brand: ${id}`)
  return brand
}

/** The address of a brand's page, the same in both languages but for the comparison's own part. */
export const brandPath = (id: Brand['id']) => `/skat-sites-compared/${id}` as const

/** A brand page's head: its own title and description, a WebPage, its questions as a FAQPage, and the way back. */
export function brandHead(id: Brand['id']) {
  const brand = brandOf(id)
  const locale = getLocale()
  const path = brandPath(id)
  return pageHead({
    title: brand.title[locale],
    description: brand.description[locale],
    paths: samePath(path),
    image: 'home',
    jsonLd: [
      { '@type': 'WebPage', name: brand.heading[locale], description: brand.description[locale], url: localizedUrl(path, locale), inLanguage: locale, dateModified: CHECKED },
      { '@type': 'FAQPage', mainEntity: brand.faq.map(({ q, a }) => ({ '@type': 'Question', name: q[locale], acceptedAnswer: { '@type': 'Answer', text: a[locale] } })) },
      breadcrumbs([[m.compare_title(), '/skat-sites-compared'], [brand.name, path]]),
    ],
  })
}
