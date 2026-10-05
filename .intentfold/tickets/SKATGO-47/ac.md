# SKATGO-47 AC checks

The built server runs on the ticket ports (`operations.md` Tools), with the multiplayer service and the
local database running for the tables. The measurement script is `tmp/weights.mjs`:
- desktop 1440×900 and phone 390×844 (`isMobile`, `hasTouch`);
- the charter's 1280×820 and 375×812 for the screenshots.

Pages:
- home `/en`, course `/en/course`, a lesson, rules `/en/rules`;
- daily `/en/daily`, free play `/en/play`, the daily table `/en/daily/play`.

It records every visible text element's computed weight, element, enclosing control and family.
`tmp/weights-before.json` is the baseline on `d36eb0d`.

## AC1 — weights

Pass, on every page at both sizes, Bebas Neue excluded:
- every visible text element computes ≥ 500;
- every text inside a control (`a`, `button`, `select`, `label`, `summary`, a tab, a menu item) and
  every UI-role text (the table's names, the info board's lines, the history lines, pills, small and
  micro text) computes ≥ 600;
- no element that was 700–900 at baseline (same page, size, text and tag) computes lower.

## AC2 — card corners

Pass:
- in the served markup, every face's index path (`fill="none"`, stroked, inside the inked symbol)
  carries the token's width, ≥ 107 (80 × 4⁄3), for all 32 cards;
- every other path keeps its width;
- close-up screenshots of 7, 10, A, J, Q, K in all four suits, before and after, show visibly thicker
  indices with no clipped stroke ends and pips and figures unchanged.

## AC3 — tokens

Pass:
- the weights and the stroke come only from `app/src/theme/`;
- the design-token check and the literal grep from the mechanical defence pass;
- a temporary edit of `weight.text` to 900 makes every reading-role text compute 900 in the built
  page (one page sampled), and is then reverted.

## AC4 — no overflow

At 1440 and 390, and also 1280 and 375:
- `scrollWidth ≤ innerWidth` on every page;
- in the header, the nav links and controls stay on one line (each one's height equals a single line);
- buttons do not wrap where they did not before (height compared with baseline);
- the table's info board and sidebar have no element whose `scrollWidth > clientWidth`.

Screenshots of each page, looked at.
