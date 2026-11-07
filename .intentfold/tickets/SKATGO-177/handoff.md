# SKATGO-177 handoff

## What changed

- **Power-ups dialog** (`app/src/components/skat/power-ups.tsx`, new): in free play the lightbulb on the felt's left edge stands
  through the whole deal and opens "Power-ups" / "Extras" — three cards in the order a deal goes, the one that serves now
  in a green border with a "Now" pill and its content, the others one row saying when they serve:
  - **Win chances** (bidding): per game its matadors, value, Hand value and "Win at N" — SkatZero's chance to make it at the
    number the player would say or hold now, after picking up, over every skat. Null: values only.
  - **Put away** (after picking up the skat): the two cards SkatZero would put away and the game it would play.
  - **Card counter** (play): the side's card points against 61/60; per trumps and side suit the cards still out and who is void.
- **Free play has no other hint any more**: `server-table.tsx` passes `hints` for lesson 11 only (the card hint and the blue
  Skat-or-Hand / put-away / game buttons are gone from free play); SKATGO-176's bid table dialog (`bid-values.tsx`) and its
  wiring (`bidTab`, `bidHints`) are replaced by the power-ups; lesson 11 unchanged.
- **Server** (`multiplayer/`):
  - `scripts/make-free-odds.ts` (new) — `seatGames(...).made` for seat 0 of all 1000 pool deals (13 processes, 3.9 min)
    into `skatzero/free-odds.json.gz` (32,659 bytes) and the manifest's `freeOdds`, tied to the pool's SHA-256.
  - `src/free.ts` — `loadPool` checks and loads the odds (`{ odds: false }` for the generators); `POST /free/odds` and
    `POST /free/putaway` (409 `not_at_put_away` before picking up). `src/computers.ts` `putAwayOf` — the computers' own answer.
  - `test/free-power-ups.test.ts` (new): both routes and the refused altered file.
- **Web**: `/api/free/odds` and `/api/free/putaway` passed through (`free-handler.ts`, the moves' rate limit); `free-api.ts`
  `freeOdds`, `freePutAway`.
- **Token**: `dims.powerUpIcon` (40px) in `theme/shape.stylex.ts` — the one new design value (grill 3).
- **Messages**: `powerups_*`, `powerup_*` (en, de); `bidvalues_bid` now "Value" / "Wert"; `bidvalues_count`, `bidvalues_note` removed.
- **Charter**: product.md (free play's power-ups, no hint; SkatZero's chances shown there only), engineering.md (odds file,
  routes), ui.md (the power-ups dialog; SKATGO-176's tab text replaced).

## AC results

Production build, web 55177 / multiplayer 56177, Playwright headed (`tmp/ac.mjs`, log `tmp/ac-final.log`), 1280×820 and
375×812 (isMobile, hasTouch). The moments were reached through the server's own routes (bidding only; one card played for
the counter's update), then the table opened on that game.

1. Lightbulb opens Power-ups with three cards; no element overflows the dialog — PASS both.
2. Bidding: Win chances is open, 7 rows, the five suit/Grand rows a percent, Null rows "—" — PASS both.
3. After picking up: Put away shows two cards and "The AI puts these away and plays Hearts ♥." — PASS both; server test:
   two cards from the twelve, 409 before picking up.
4. Card counter: "Your side 0 · 60 more to 60", trumps and side suits with the cards still out; after Lina's or Noah's
   next card the rows change — PASS (both sizes; the update checked at desktop).
5. Deal of the day: no lightbulb, no power-ups — PASS both. No page errors.

Mechanical defence (engineering.md Tools) on the final code: exit 0 (`tmp/defence-final.log`; 342 unit tests, SEO 28/28).
Multiplayer defence (`npm --prefix multiplayer run check`): exit 0, 49/49 (`tmp/mp-check.log`).

## Deviations

From `plan.md`: none in route. The inactive cards became one compact row each (name and when), so the open one is in
view on a phone; the value column is headed "Value" instead of "Bid up to" so the table fits 375px on one line a row.

## Environment

Ports: web 55177, multiplayer 56177, database 57177. No env key added, changed or removed.
Deploy note: the release changes both services — `multiplayer` first (operations.md), since the web's new routes call it.

## Residual

- Acorns, the shop and limits (the human: 「先不考虑橡果」) — a later ticket; the research is in `.intentfold/tmp/hints-research.md`.
- Deals with power-ups earn XP as any other for now (grill 4).

## Check

1. http://localhost:55177/en/play — at your bidding turn, tap the lightbulb (bottom-left of the felt): the look of the
   Power-ups dialog and the Win chances table — are the AI's percentages what you want to see?
2. Same page — win a bidding and pick up the skat, then the lightbulb: the two cards and the game.
3. Same page — while the cards are played, the lightbulb: the card counter (cards still out, who is void, your side's points).
4. Free play has no card hint and no blue hint buttons any more.

## Decided for you

- Win chance = SkatZero's chance to make each game at the number you'd say or hold now, after picking up; Null shows values only.
- Free play's blue Skat-or-Hand / put-away / game buttons went with the card hint (you: no card hint); lesson 11 keeps all.
- Names: "Power-ups" / "Extras"; "Win chances" / "Gewinnchancen", "Put away" / "Drücken", "Card counter" / "Kartenzähler".
- The counter lives in the lightbulb's dialog, not on the felt; deals with power-ups earn XP as before.
- One new token, `dims.powerUpIcon` (40px), for the icon squares.
