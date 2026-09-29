# SKATGO-26 handoff

## What changed

Every screen of skatgo now wears the lobby design measured from Funbridge (`reference.md`). It is
rebuilt in skatgo's own code, with skatgo's own pictures and copy.

- **Registry** (`app/src/theme/`):
  - new `color.stylex.ts` (palette), `shape.stylex.ts` (radii, dimensions) and `elevation.stylex.ts`
    (own-colour shadows, fills, poses);
  - Outfit and Bebas Neue added to `type.stylex.ts`, with the measured type roles in `type.ts`;
  - the old card-room palette (`skat.stylex.ts`), radii, sizes and shadows removed.

  The token check and the literal grep still guard every value, so making the look "our own" later is
  a registry edit.
- **Frame** (`skat-layout.tsx`, new `components/skat/frame.tsx`):
  - `/` wears the public-site header (100 tall, 64 on a phone, with a menu).
  - Course and lessons wear the app rail (a bottom tab bar on a phone) and an orange band with back,
    home, language and account.
  - `/play` is a full-screen table.
- **Kit** (`ui.tsx`): pill, block and landing buttons, each with its own-colour shadow; white option
  cards; pills; the progress bar.
- **Pages**:
  - front page: landing hero with a card-fan picture, a navy facts strip, and the four sections as
    colour tiles in two groups;
  - course map: sub-page band, featured "continue" card, and the lessons as option cards;
  - lessons: band with the lesson title, the step on a white card, and block buttons;
  - drills: on table felt in a gold frame;
  - assistant and Clerk: white dialogs in the new palette.
- **Card table** (`game-table.tsx`), after the human's three review rounds:
  - felt: radial green under a fine grain drawn in CSS;
  - all three hands the same card size (120px, 88px on a phone);
  - the opponents' hands sideways, stacked down the edges and running off them;
  - a gold frame at the vertical centre, with the seat plates on its edges carrying only the role tag
    and the name;
  - an info board across the top: contract or current bid, declarer, card points with trick count,
    totals;
  - the learner's moves (Reizen, the skat, the discard, the contract) in a drawer that rises from
    the bottom and stops above the hand;
  - the hand as one row across the full width;
  - a hint tab on the left edge;
  - a 450-wide side panel with the Reizen history, which is a pull-out drawer on a phone;
  - the settlement as a white dialog.
- **Card**: skatgo's own back, a light lattice on charcoal; a `table` size.
- **Messages**: new navigation, table and info-board strings in zh, en and de.

## AC results

1. **Every page matches its reference in detail — awaiting the human's confirmation.** The agent does
   not record this one as passed. Evidence:
   - captures of every page at 1280×820 and 375×812 in `tmp/shots/` (entry, course, lesson, play;
     table in bidding, discard, contract and play; phone panel open);
   - the measured values in `reference.md`.

   The table was reworked three times on the human's review (equal card sizes; one-row hand; centred
   frame; info board; the action drawer).
2. **Front page is lobby-structured and its entries work — PASS** at both viewports (`tmp/ac2.mjs`):
   - the public-site header, the hero and four tiles are present;
   - Duplicate and Puzzles are `aria-disabled`, not links;
   - the course tile goes to `/zh/course` (with the rail, or the tab bar on a phone);
   - the play tile goes to `/zh/play`, and the table renders.
3. **Table styled and a whole game completes — PASS** at both viewports (`tmp/ac3.mjs`, 24 checks,
   exit 0):
   - the felt, frame, panel, plates, both stacks and the hand are present;
   - a defender game (always pass) and a declarer game (win the bid, pick up, discard two, choose a
     covering contract, declare, play) each reached the settlement;
   - no page errors.

   Cards were chosen by the engine's `data-legal`, and tapped on their visible strip.
4. **Nothing from Funbridge in the project — PASS**:
   - `git grep -il funbridge -- app/` finds 0 files;
   - there are 0 new image or font files since the base;
   - there is no nexa file;
   - pictures are skatgo's public-domain deck, its own card back and grain, and lucide icons; fonts
     are Outfit and Bebas Neue from Google Fonts (open licences).

Also run:
- **Mechanical defence** (engineering.md): typecheck, build, 70 tests, client bundle (13 chunks),
  design tokens (59 files), literal grep 0, SSR import — all pass.
- **`overflow_probe.mjs`**: 6 pages × 375/768/1280, no horizontal overflow. It was shown able to fail
  on a 2000px test page (it reported 1625px).
- **`page_blocks.mjs`** against `main`: no block dropped. The differences are all additions:
  - group headings on `/`;
  - the featured card's title on `/course`;
  - the lesson title band;
  - "叫分记录" on `/play`.

  The one removal is recorded under Deviations.

## Deviations

- **`/play` has no rail, top bar or language menu.** The reference's game screen is full-screen; the
  language can be changed on every other page.
- **Plan / grill Q5, as reworked on the human's review:**
  - the action box moved out of the frame into a bottom drawer;
  - the frame's corner scores gave way to the info board;
  - the seat plates hold the name only;
  - the phone's side panel is a pull-out drawer from the right edge (as the reference), not a bottom
    sheet;
  - the hand is one row at every size, so the Fan's two-row phone layout is off for the table (each
    card keeps a tap strip of about 31px on a phone).
- **No undo button.** The engine cannot take a card back (grill Q5).
- **`ips-change-ui` was not modified.** Its `page_blocks` and `overflow_probe` scripts sufficed; the
  capture and acceptance scripts stayed ticket-local in `tmp/`.

## Environment

- Ports: web 55026. The review server is running there with `app/.env` loaded.
- Env keys: none added, changed or removed.

## Residual

- **`charter/ui.md` no longer describes the product.** It still describes the card-room design:
  felt/paper/brass, the hero's no-felt redline, DM Sans / Fraunces, the kit's tones. It is
  human-owned; the agent can draft the replacement on request.
- The main checkout's `app/node_modules` was stale (missing `posthog-js` and a Clerk subpath), so
  main did not build. It was reinstalled with `npm --prefix app ci` for the block comparison.
