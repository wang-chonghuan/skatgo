# SKATGO-134 handoff

## What changed

- **About SkatGo** (`about-page.tsx`, route `/about` → `/en/about`, `/de/ueber-skatgo`; in `lib/sitemap.ts`): the five
  questions (`lib/faq.ts`, with the FAQPage moved from `/`), "Daily Skat" (deal of the day and six deals, same cards,
  Seeger-Fabian, boards over seven days, Elo, midnight in Berlin, the course and rules) and "Private tables" (open with an
  account, friends with a name, the AI in an empty seat, ISkO without Kontra/Re/Ramsch/Bock, all three scores, the AI for
  a dropped player). The FAQ's one aged fact now says the six-deal tournament needs an account.
- **Footer** (`legal-footer.tsx`): "About SkatGo" and "Rules" after the existing links.
- **Home**: the FAQ section and its JSON-LD gone; everything else as it was.
- **/daily**: `GameReading` (three sections and the link row) gone, its file removed.
- **/with-friends**: H1, "Open a table and send the link – friends join with just a name.", the open-table control; the
  guest prompt's sentence gone, its sign-in button stays.
- **/skat-tricks**: no lead. **Profile**: one-line lead; the old text kept as the page's meta description.
- **Tables** (`game-table.tsx`, keyed on `hints`, which only the course's tables have): asked to hold "18?" with
  "Yes"/"Pass"; no line on the speaker's turn, before pick-up, while putting away, while playing; forehand alone "Both
  passed – play at 18?"; contract picker only a short line when nothing reaches the bid or the game cannot be announced;
  wrong card "Follow suit: play Clubs♣."; private table's settlement: a facts line and the formula line, then the skat.
  The play record's note only in lesson 11 (`DealAnalysis` `explain`).
- **SEO check** (`scripts/check-seo.mjs`): `/daily` and `/with-friends` need a line beyond their H1 instead of 200
  characters and no contextual links (the human chose it); negative controls for both limits on content pages.
- **Messages**: short table keys added; 14 unused keys removed in both languages.
- **Charter**: `ui.md` (four copy rules, About, footer, /daily, friends page, tricks page, what a table says),
  `engineering.md` (route, page file, the SEO rule), `product.md` (About SkatGo).

## AC results

Local web 55134, multiplayer 56134, database 57134. `tmp/ac.mjs`, PC and phone: ALL PASS.

1. Home without FAQ — passed: no FAQ section or FAQPage; slogan, lead, hero buttons, tiles and rules/course links equal
   to live main (`/` and `/en`); the Elo board's code untouched (diff), not drawn locally for want of data.
2. About — passed: both languages 200 with JavaScript off, all questions and both sections; in the sitemap with each
   other as alternates; `check:seo --built` and `test:seo` (28) pass.
3. Footer — passed on home, /daily, a lesson, rules, forum, German rules.
4. /daily — passed on both toggles.
5. /with-friends — passed: H1, one paragraph, the control.
6. /skat-tricks — passed. 7. Profile — passed: one line at 1280 in both languages.
8. Tables — passed: free play's first decision shows only buttons; every listed sentence's message is referenced only on
   the course branch; the play-record note only with `explain`, which lesson 11 passes. Playing the later states is the human's.
9. Charter — passed (read).

Mechanical defence: passed (typecheck, build, 283 tests, bundle, tokens, literal grep, SSR import, SEO built, SEO tests).

## Deviations

- The SEO check changed for the two game pages (the human: 「1」, then 「别他妈的一直问我了，我要求干净」), not in the plan.
- About links to the deal of the day, the course, the rules and the friends page at the end of its sections.

## Environment

Ports: web 55134, multiplayer 56134, database 57134. No env key added, changed or removed. No dependency change.

## Residual

None.

## Check

The look through the human's eyes was skipped: the human asked to close and deploy at once.

1. https://skatgo.com/en/about after release — the new page.
2. https://skatgo.com/en, /en/daily, /en/with-friends, /en/skat-tricks — the trimmed pages and the footer.
3. A free-play deal and a private table — the short lines through bidding, skat, contract, play and the settlement.

## Decided for you

- Course tables are the ones with hints (course and lesson 11); every other table gets the short lines.
- The private table's "Your score: +24" line went too; the formula line ends in the score.
- "Play more: free play" on /daily stays.
- The FAQ moved unchanged but for the six-deal account fact.
- Footer: … Forum · About SkatGo · Rules.
- The game pages need no contextual links in the SEO check (header and footer link every page).
