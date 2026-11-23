# SKATGO-230 handoff

## What changed
- `app/public/compare/brands/{skat-palast,skatstube,euroskat,skat-online}.webp` — each brand's public start page, taken with
  `cloak-fetch --screenshot`, cut with `ffmpeg` (no money-play text, no cookie banner) and encoded with `cwebp`.
- `app/scripts/make-compare-shots.mjs` — a new landscape shot `table-{de,en}.webp`: free play as it opens, cards dealt.
- `app/src/lib/brands.ts` — `screenshot` (file, site) and `signup` (how one starts there, sourced) per brand.
- `app/src/components/skat/brand-page.tsx` — intro beside the brand's screenshot with "Startseite von <site>, Screenshot vom
  November 2026"; a green block "Bei SkatGo: Seite öffnen und losspielen" with SkatGo's table, three numbered steps, "Kein
  Konto, keine App, kein Download und keine Wartezeit auf Mitspieler." and a button to the front page; the side-by-side table
  opens with "Spielen ohne Anmeldung".
- Messages: the shared box now reads "Seite öffnen und sofort spielen" (also on the comparison page); new `brand_*` texts.
- Charter: product.md and ui.md amended at the human's request (pictures of the brands on their pages); engineering.md
  records how the screenshots are made.

## AC results (web 55230; headed Chromium; `tmp/ac.mjs`: 56 checks)
1. **Pass.** All 8 pages show their brand's screenshot (960 px), captioned with the site and 2026.
2. **Pass.** All 8 show the play block with `table-<lang>.webp` loaded, "Kein Konto"/"No account", button to `/de` or `/en`.
3. **Pass.** First table row "Spielen ohne Anmeldung" with SkatGo's "Seite öffnen …"; no negative words, no links away.
4. **Pass.** No sideways scroll at 1280, 375, 360 px.
5. Recorded at close.

Mechanical defence passed in full (353 tests, `check:seo -- --built` 62 indexable pages, `test:seo` 28 pass).

## Deviations
- The SkatGo table shot is landscape (desktop) so it can run full width; the phone shots are unchanged in kind.

## Environment
Ports web 55230, multiplayer 56230, database 57230 (container `skatgo-multiplayer-db-57230`). No env key changed.

## Residual
- The brand screenshots date from 22–23 November 2026; retake them if a brand redesigns its start page.

## Check
1. `/de/skat-online-vergleich/skatstube` and the other three — the screenshots and the green block.

## Decided for you
See `grill.md`.
