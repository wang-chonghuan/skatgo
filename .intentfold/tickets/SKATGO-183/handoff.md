# SKATGO-183 handoff

## What changed
- `app/src/lib/analytics.ts`: the tracking plan adds `powerup_opened: { tool: 'odds' | 'counter' }`.
- `app/src/components/skat/game-table.tsx`: free play's lightbulb sends the event each time it is pressed. `tool` comes from `powerUpOf(game)`, the same function that picks the dialog, so the event always names the tool that opens.

## Acceptance (local production build, 55183 web / 56183 multiplayer)
- **AC1, PASS:** the first press while bidding opened the win chances and sent `powerup_opened {tool: odds}`.
- **AC2, PASS:** after passing, a press in play opened the card counter and sent `powerup_opened {tool: counter}`.
- **Every press:** 17 presses each sent exactly one event naming the dialog that opened.
- **AC3** is checked after deploy, on skatgo.com: the live bundle carries the event. As with every event, only the published site forwards it to PostHog.
- The script is in the main checkout's `.intentfold/tmp/SKATGO-183/ac.mjs`.

## Mechanical defence
- Passed once on this branch: typecheck, build, 346 app tests, client bundle, design tokens, the literal grep, server link, check:seo --built and test:seo.

## Reading it in PostHog
- Event `powerup_opened`, broken down by `tool`. Count unique persons for how many people open each tool, and total count for how many presses.
