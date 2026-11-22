# SKATGO-226 handoff

## What changed

1. **German: the opponents are "Computer", not "KI"** (`app/messages/de.json`, lesson 11 in
   `app/src/lib/skat/lessons/content.de.ts` and `guide.de.ts`). Changed wherever "KI" names who you play against:
   front page card ("Zwei Computer-Gegner …"), free play's title and description, private rooms (buttons, seat label
   "{name} (Computer)", prompts), About SkatGo (friends section, the daily section's "dieselben zwei Computer-Gegner"),
   FAQ, League ("Dann spielen Computer-Gegner …"), XP explanation's first clause, lesson 11. The German front page's
   search description is new:
   "Ohne Anmeldung und ohne Werbung spielst du hier Skat direkt im Browser gegen zwei Computer-Gegner. Dazu kommt jeden
   Tag ein Turnier: 6 Spiele mit denselben Karten für alle und eine Rangliste." Its title is unchanged. English is
   unchanged (en.json only gained the new page's keys).
2. **New page "Skat Palast Alternative"**, German and English (`/de/skat-palast-alternative`,
   `/en/skat-palast-alternative`): route `app/src/routes/skat-palast-alternative.tsx`, page
   `app/src/components/skat/palast-page.tsx`, URL pattern in `app/paraglide.options.ts`, `client-page.tsx` registry,
   `PAGES` in `app/src/lib/sitemap.ts`, messages `palast_*`. Content: lead; "Der Unterschied auf einen Blick" (Gegner,
   Kosten, Ohne Konto, Lernen, Wettbewerb — SkatGo's box and Skat Palast's side by side, stacked on a phone); "Was passt
   zu dir?" with one button to free play and a text link to the daily tournament; trademark / no-connection note. About
   SkatGo's questions section ends in a link to it.
3. **Charter** (human-approved for product.md in the grill; the others follow the request): `product.md` paragraph for
   the page; `engineering.md` Structure table (page and route); `ui.md` the page's layout, and the selling-points
   guidance now names the comparison page beside About SkatGo.

### Sources for every statement about Skat Palast (checked 2026-11-22)

- https://www.skat-palast.de/ — "Kostenlos online Skat spielen gegen echte Gegner"; "Immer live, immer kostenlos";
  "Starte am Handy oder Tablet eine Runde ohne Registrierung"; Skat-Schule with Skat-Anleitung, Glossar and Lektionen;
  Liga; Turniere; apps in App Store, Google Play, Microsoft.
- https://www.spiele-palast.de/faq/ — "Mit dem optionalen Kauf einer Premium-Mitgliedschaft …", "Alle unsere Spiele
  sind grundsätzlich kostenlos"; "Auf Mobilgeräten kannst du unsere Apps auch ohne Konto-Erstellung nutzen"; Vereine,
  Vereins-Liga; Turniere.
- Not claimed (not verifiable): whether Skat Palast shows ads, its exact rules, whether its browser version needs an
  account.

## AC results (web 55226, multiplayer 56226, database 57226; headed Chromium; `tmp/ac.mjs`, output `tmp/ac-result.txt`)

1. **Pass.** `/de`, `/de/spielen`, `/de/mit-freunden`, `/de/ueber-skatgo`, `/de/kurs/bereit-fuer-eine-echte-partie`:
   no "gegen die KI", "KI-Gegner", "(KI)", "KI spielen lassen", "KI entfernen" in title, description or page text; all
   mention "Computer". English: `git diff 906fabb..HEAD -- app/messages/en.json` changes no existing string (one
   trailing comma), only adds keys.
2. **Pass.** German front page description starts "Ohne Anmeldung und ohne Werbung …", names "Computer-Gegner",
   "Turnier", "Rangliste"; title "Skat online kostenlos spielen – ohne Anmeldung | SkatGo", as before.
3. **Pass.** Both languages answer 200, robots "index, follow", listed in `/sitemap.xml`, carry the trademark note,
   show no picture; "Jetzt gegen den Computer spielen" leads to `/de/spielen` and the table deals, signed out.
   `npm run check:seo -- --built`: OK, 54 indexable pages (52 before).
4. **Pass.** No "Skat Palast" in the front page's title or header; About SkatGo links to the page.
5. **Pass.** No sideways scroll at 1280, 375 and 360 px in both languages (scrollWidth equals the viewport).

Mechanical defence (engineering.md Tools) passed in full on the final commit: typecheck, build, 353 tests, client
bundle, design tokens, literal grep, SSR link, `check:seo -- --built`, `test:seo` (28 pass).

Look through the human's eyes (fresh reviewer with the Request, this grill and earlier About/SEO tickets' records):
taken — repeated "Was du bei SkatGo bekommst" list removed; "Computer" throughout the page; "Was passt zu dir?" no
longer calls Skat Palast "eine gute Wahl"; the League named; the Skat Palast learning row neutral ("Anleitung, Glossar
und Lektionen"); "6 gleichen Spielen" reworded; new page description made two full sentences. Not taken — dropping the
Kosten and Ohne Konto rows: each is a real, sourced difference (nothing to buy vs optional Premium; browser vs apps).

## Deviations

- Plan said German only; the human chose German and English in the grill (ticket amended).
- The comparison has one button plus a text link to the daily tournament: `check:seo` requires two contextual links on
  every indexable page, and the review removed the course link.
- Grid columns use `dims.twoColumns` / `dims.oneColumn` (the design-token check refused raw `1fr`).

## Environment

Ports used: web 55226, multiplayer 56226, local PostgreSQL 57226 (container `skatgo-multiplayer-db-57226`). No env key
added, changed or removed. The worktree's own `multiplayer/.env` points `DATABASE_URL` at 57226 for this ticket's
database — local only, not to be synced back.

## Residual

- Not seen on screen: the seat label "{name} (Computer)" in a private room and the League at 360 px. Opening a room
  locally failed (Clerk development keys loop on localhost even with the test-account cookie).
- After deploy: IndexNow per operations.md; Bing URL Submission for `/` and both new addresses; Search Console
  "request indexing" for the new page.
- The Skat Palast facts should be re-checked if the page is edited later (it names "Stand: November 2026").

## Check

1. `/de/skat-palast-alternative` — the tone of the comparison, and whether "Was passt zu dir?" is the right amount of
   fairness to Skat Palast.
2. The German front page description (shows in Bing/Google results).
3. `/en/skat-palast-alternative` — the English translation.
4. A room or League table on your phone after release — "Lina (Computer)" instead of "Lina (KI)" may crowd a seat.

## Decided for you

- "Ohne Anmeldung" is not presented as a difference: Skat Palast's apps also play without an account.
- Skat Palast's strengths (real people, big community, tournaments, league, clubs) are stated plainly; nothing about
  ads or its rules, which could not be verified.
- "KI" kept where the AI is the yardstick or the analyst (profile, XP tiers, bidding practice answers, after-game
  comparison, power-up notes, "wie die KI dieselben Karten gespielt hat" on About SkatGo, legal text).
- The page is reached from About SkatGo only — not the footer, header or front page.
- Address `/skat-palast-alternative` in both languages.
- A text link to the daily tournament sits beside the one button (needed by the SEO check).
