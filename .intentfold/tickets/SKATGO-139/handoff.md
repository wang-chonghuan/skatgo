# SKATGO-139 handoff

## What changed

- **Front page, progress card** (`entry-page.tsx`): the curve back to `info` blue (SKATGO-138 had made it navy); 5px and no
  AI tag kept. Charter `ui.md` updated.
- **Demos with the owner's real sign-in** (`.intentfold/tmp/demo-me.sh`, git-ignored, outside the product): copies the
  owner's production records read only into a ticket's local database and makes the owner's Clerk development account
  (their Gmail) one with the production account by a local `player_aliases` row. The local web already signs in through
  Clerk's development instance, with Google.

## AC results

Local web 55139. 1 — stroke `rgb(9, 94, 207)` (`color.info`), 5px, no AI tag: passed. 2 — `/daily/profile` for the
owner's development account returns 138 deals on 14 days, all with the AI's: passed. 3 — live with the Gmail: the human's,
after release.

Mechanical defence: passed (283 tests, tokens, literal grep, SSR, SEO built, SEO tests).

## Deviations

None.

## Environment

Ports: web 55139, multiplayer 56139, database 57139. No env change.

## Residual

None.

## Check

1. https://skatgo.com/en signed in with the Gmail — the curve in blue.

## Decided for you

- The demo script lives in the main checkout's `.intentfold/tmp/`, not in the product.
