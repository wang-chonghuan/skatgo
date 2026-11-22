# SKATGO-228 handoff

## What changed

A comparison page of the big online Skat providers, German and English: `/de/skat-online-vergleich`,
`/en/skat-sites-compared` (route pattern `/skat-sites-compared`).

- `app/src/lib/compare.ts` — the data: nine providers (SkatGo, Skat Palast, Skatstube, Euroskat, Skat Treff by GameDuell,
  PlayOK, Skat on Spiele123, Skat-Online, Isar Interactive's Skat app). Per provider: a portrait in our own words, six
  criteria (Besonderheit, Gegner, Plattformen, Regeln, Wettbewerb, Lernen) each with a short matrix label and a full line,
  highlights, and the source URL of every statement about another provider. `CHECKED = 2026-11-22`; the FAQ list
  (`compareFaq`, also the route's FAQPage).
- `app/src/components/skat/compare-page.tsx` — H1 with the brand names, lead, a SkatGo box (free, no sign-up, button to the
  front page) at the top, after SkatGo's own section and at the end; the matrix (slides sideways on a phone with the name
  column fixed); "Was SkatGo dir bietet" with four SkatGo screenshots and a list; a four-part guide; provider portraits;
  six questions; trademark/no-connection note and a correction line linking the imprint. No other provider's picture, no
  links away to them, nothing negative (no ads, money play, "needs an account").
- `app/src/routes/skat-sites-compared.tsx` (WebPage, FAQPage, breadcrumbs), `paraglide.options.ts` pattern, `client-page.tsx`
  entry, `PAGES` in `lib/sitemap.ts`, the footer link in `legal-footer.tsx` ("Skat-Seiten im Vergleich") — the page's one
  way in. Messages `compare_*` in `messages/{de,en}.json`.
- `app/scripts/make-compare-shots.mjs` and its output `app/public/compare/{odds,bidding,endgame,lesson}-{de,en}.webp`:
  SkatGo's own screens, taken from the local build (refuses any non-local origin).
- Charter: `product.md` paragraph (approved in the grill), `engineering.md` structure and generated assets, `ui.md` footer,
  the page's layout, and the selling-points guidance naming this page (the human: 「并介绍免费免登录玩」).

### Sources

One crawl on 2026-11-22 with `cloak-fetch`; facts with quotes in `tmp/facts.md`, raw pages in `tmp/crawl/` (both
uncommitted, kept in the worktree tmp). Every statement about another provider in `lib/compare.ts` names its URL. No
scheduled crawl (the human: 「你不要搞cron去定期爬」).

## AC results (web 55228, multiplayer 56228, database 57228; headed Chromium; `tmp/ac.mjs`, output `tmp/ac-result.txt`: 50 checks)

1. **Pass.** Both addresses 200, robots "index, follow", both in `/sitemap.xml`; `check:seo -- --built` OK with 54 indexable
   pages (52 on main).
2. **Pass.** Matrix 9 rows; "Stand 22.11.2026" shown; 60+ statements about other providers in `lib/compare.ts`, none
   without a source.
3. **Pass.** All nine `#<id>` anchors open at their section, both languages.
4. **Pass.** Four SkatGo screenshots from `/compare/`, loaded, each with a title and a line.
5. **Pass.** Six questions shown; the FAQPage has six.
6. **Pass.** Only `/compare/` pictures; trademark note present; no ✗, no money or "Echtgeld"/"Zockerstube" wording; no
   links to other providers.
7. **Pass.** No sideways page scroll at 1280, 375, 360; at 360 the matrix slides to its last column with the name column in
   view.
8. **Pass.** Footer links the page on `/de`, `/en`, About and the rules; no other link to it anywhere; the three boxes
   lead to the front page and say free and no sign-up; the top button opens `/de`.

Mechanical defence (engineering.md Tools) passed in full on `fd0e776`: typecheck, build, 353 tests, client bundle,
design tokens, literal grep, SSR link, `check:seo -- --built`, `test:seo` (28 pass).

Look through the human's eyes (fresh reviewer with the Request, grill and screenshots): taken — a third button after
SkatGo's section; links away to providers removed; empty "keine Angabe" lines left out of portraits; the
friends-only-tables line removed; FAQ 6 no longer ranks; comma-tail lines rewritten; the bidding screenshot shows a right
answer; a "Besonderheit" column; SkatGo's row "Browser, ohne Konto"; the lead speaks to the reader; brand names in title
and H1; clumsier German rewritten. Not taken — the phone matrix being cut off at the edge: it slides by design (AC 7).

## Deviations

- Plan had a negative-capable matrix (ads, money, account) and outbound links; the human turned the page positive-only and
  the review removed outbound links.
- Plan had the About page as entry; the human chose the footer only.
- Finish is `auto-deploy` (the human: 「你做完后，加入到gsc和bing上，然后直接部署」), recorded on the ticket.

## Environment

Ports: web 55228, multiplayer 56228, local PostgreSQL 57228 (container `skatgo-multiplayer-db-57228`). No env key
added, changed or removed. The worktree's own `multiplayer/.env` points `DATABASE_URL` at 57228 — local only, not synced.

## Residual

- The facts date from 2026-11-22; the human updates `lib/compare.ts` by hand when a provider changes.
- If Search Console shows impressions for one brand, a dedicated "<brand> Alternative" page could follow.

## Check

1. `/de/skat-online-vergleich` — the wording of the portraits and the three SkatGo boxes.
2. `/en/skat-sites-compared` — the English.

## Decided for you

- Providers: the nine above (search volume and the crawl); Skat 123 is Spiele123's Skat, Skat Online is skat-online.com
  (both the closest match found, not proven to be what searchers mean).
- Screenshots: SkatGo's win chances, bidding practice (right answer), an open endgame, lesson 1.
- "laut Anbieter" kept only on numbers the providers state about themselves.
- The correction line links the imprint rather than repeating the address.
- No outbound links to the providers.
