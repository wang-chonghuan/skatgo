# SKATGO-69 handoff

This ticket went through an open development phase (vibe coding with the human). This file records what was delivered and verified, not which tool produced each edit.

## What changed

One commit per request, in order; each commit's first line is the human's ask.

**The front page**
1. **Tiles line up** (`541e563`): every tile keeps its title and text at the top and its button at the bottom. Free play's tile adds "A live AI coach guides every move and answers your questions." / „Ein KI-Coach begleitet jeden Zug in Echtzeit und beantwortet deine Fragen."
2. **A fourth tile, practice** (`d5709d2`):
   - ♦ in the slogan's navy: new tokens `color.tileNavy` (#022657) and `elev.tileNavy`; the human chose the colour.
   - Puzzles sorted by theme, like chess tactics. Not clickable, and its colour is fixed under the pointer.
3. **"Computer" becomes "AI" / „KI"** (`1869601`) wherever it means the opponents: tiles, free play's and the tournament's copy, private tables, the FAQ, meta descriptions, the `/play` title, the course's last lesson, and the assistant's context. The device sense ("phones, tablets and computers") stays; `/play`'s link previews were redrawn.
4. **The coming-soon mark** (`175d269`, `23dd502`): it looks exactly like the other tiles' buttons. A new kit helper `stillLook` gives the button look with nothing that answers the pointer, and it is no link.
5. **Course button** (`23dd502`): "Lernen starten" / "Start learning".
6. **Main call to action** (`c593ffc`): "Play today's tournament" (English only; German stays „Heute spielen").
7. **Headline and line under it** (`fe53712` → `c726f55`, `0944720`, `890be24`, `3d8e334`):
   - Headline: „Skat online kostenlos" / "Free Skat online".
   - Line: „Fordere die KI heraus, spiel mit Freunden oder miss dich mit der ganzen Community. Ein KI-Coach hilft dir beim Lernen und Üben." / "Take on the AI, play with friends or compete with the whole community. An AI coach helps you learn and practise."
   - Wording settled with the human over several rounds, without dashes.
   - Front-page link previews redrawn; the assistant's front-page context matches and no longer says the tournament cannot be played.
8. **Headline size** (`5e55e7f`): one line at every width (320–1920px), up to 66px on desktop and 36px on a phone, following the screen width. New type sizes `fontSize.fHero`, `fHeroPhone`.
9. **Third point under the main button** (`db25887`): „KI-Analyse" / "AI analysis" (was "New deals at midnight").
10. **Tile order and practice title** (`1df4ed5`): practice comes before private tables; it is titled „Besser spielen?" / "Want to improve your game?".

**The header** (`frame.tsx`)

11. **Links** (`463a97f`): Tagesturnier / Daily Tournament, Lernen / Learn, Freies Spiel / Free Play, Privater Tisch / Private Table, Aufgaben / Puzzles.
    - Puzzles is greyed (`opacity.disabled`) and is no link.
    - Rules left the header; it stays linked from the front page and the course.
    - Below 1100px the links fold into the menu (new breakpoint `bp.headerMenu`). This also ends the wrapping and sideways scroll the old header had between 481 and 1023px.
12. **Name beside the mark** (`00b579f`, `e035a1c`, `0675944`): "SkatGo.com" at every width.
    - The language button shows its flag only, with no arrow.
    - The phone header is tighter (existing spacing tokens).

**Free play's table** (`8d7b62d`)

13. `/play` is a standard web-app table: one screen, nothing to scroll, no reading text below; its title is for screen readers only.
    - It is noindex and out of the sitemap (the human's choice); the front page is free play's search entry.
    - The reading block keeps only `/daily`'s facts.
    - Charter `ui.md`: the tables never scroll and are noindex.
    - The sitemap test's German example moved to `/de/taeglich`, and it asserts `/de/spielen` is absent.

## AC results

Local web 55069 (built server), multiplayer 56069, database 57069. Each fix was checked when it was made, with headed Playwright at desktop 1280×820 and phone 375×812 (more widths where it mattered), German and English. Scripts and screenshots are in `tmp/fix*.mjs` / `tmp/fix*.png`.

1. **Every issue the human pointed out is fixed and accepted.** Met.
   - Each fix above was shown to the human with a screenshot.
   - Further asks reworked items 3–7 and 11–12 until the human moved on.
   - The human closed the ticket with 「关闭工单吧」 after the last one.
2. **No overflow, covering or horizontal scroll where something was fixed.** Met.
   - Tiles: titles 27px from their tile's top and feet 27px from its bottom, at both sizes.
   - Headline: one line from 320 to 1920px.
   - Header: fits from 360 to 1920px without the page zooming out; it folds into the menu below 1100px.
   - `/play`: nothing to scroll at desktop, phone portrait and phone landscape.
   - No horizontal scroll anywhere checked.
3. **Nothing else is affected.** Met.
   - Mechanical defence passed in full: typecheck, build, 101 tests, client bundle (21 chunks), design tokens (120 files), literal grep, SSR link, `test:seo` 25/25.
   - `check:seo -- --built`: 42 indexable and 6 noindex pages; `/play` moved to noindex by item 13.

## Deviations

- **Registry changes**, each made at the human's request for that change:
  - `color.tileNavy`, `elev.tileNavy` (the human chose the colour);
  - `fontSize.fHero`, `fontSize.fHeroPhone`;
  - `bp.headerMenu`, taken on the human's 「继续」.
- **"SkatGo.com" on phones** needed the flag-only language button and a tighter phone header, which the human approved.
- **Very small 320px phones** zoom the page out slightly, as they already did with "SkatGo".
- **The English headline** is "Free Skat online", in the site's sentence case, after the human's question about "Online".

## Environment

- Ports 55069 / 56069 / 57069; the local database container `skatgo-multiplayer-db-57069`.
- The worktree's `app/.env` `MULTIPLAYER_URL` and `multiplayer/.env` `DATABASE_URL` port were pointed at the ticket ports for local work only.
- **No env key added, changed or removed.**

## Residual

**Charter drift, not edited (the human may want these):**
- `ui.md`:
  - the front page's tiles now include ♦ practice (`tileNavy`) and the order course, free play, practice, friends;
  - the header's link list and order (a 2026-10-01 human decision, now replaced), Puzzles greyed, and the menu below 1100px;
  - the hero line;
  - the kit's `stillLook`;
  - `fHero` and `bp.headerMenu` in the registry tables;
  - the colour-roles table lacks `tileRed` / `tileNavy`.
- `product.md`: "Free play at `/play`" is unchanged, but `/play` is no longer a search entry.

**Not changed:**
- the course's last lesson (a full game) keeps its lesson text below, like every lesson;
- the German main call to action stays „Heute spielen";
- the friends and practice tiles still contain a dash.
