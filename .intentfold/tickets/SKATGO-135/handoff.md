# SKATGO-135 handoff

## What changed

- **Front page** (`entry-page.tsx`): the hero's main button is the server's link alone — "1 deal today · 2 min" /
  "1 Spiel heute · 2 Min." to /daily — for everyone, played or not.
- **Removed**: `DealOfDayButton` (`deal-of-day.tsx`), which read the day's state and board in the browser and swapped the
  words for "Today's result · #k" once played, with its lazy re-exports (`client-part.tsx`, `pages.tsx`), and the
  messages `dod_hero_done` and `dod_hero_done_unranked` in both languages.
- **Charter** `ui.md`: the hero's button keeps its words once played.

## AC results

Local web 55135, multiplayer 56135, database 57135. `tmp/ac.mjs`, PC and phone, German and English: ALL PASS.

1. A guest and a test account whose deal of the day is finished (confirmed by /daily's `data-finished="true"`) see the
   same button, "1 Spiel heute · 2 Min." / "1 deal today · 2 min", after the page has loaded in the browser — passed.
2. For the finished account the button opens /daily — passed (`/de/taeglich`, `/en/daily`).
3. No "Heutiges Ergebnis" / "Today's result" on the front page — passed.

Mechanical defence: passed (typecheck, build, 283 tests, bundle, tokens, literal grep, SSR import, SEO built, SEO tests).

## Deviations

None.

## Environment

Ports: web 55135, multiplayer 56135, database 57135. No env change, no dependency change.

## Residual

None.

## Check

The look through the human's eyes was not run: the change is the request's own words, one button's text.

1. http://localhost:55135/en — the main button after playing today's deal (sign in, play the deal, come back).

## Decided for you

- The swap is removed, not kept with the same words: nothing else used it.
