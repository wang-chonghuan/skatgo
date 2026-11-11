# SKATGO-183 plan

## Approach
- One new event in the tracking plan (`app/src/lib/analytics.ts`): `powerup_opened: { tool: 'odds' | 'counter' }`.
- Free play's lightbulb (`app/src/components/skat/game-table.tsx`) sends it when pressed, with `tool` taken from `powerUpOf(game)`: the same function that decides which power-up the dialog opens.
- The event follows `track` like every other event: it is announced on the window as `skatgo:track`, and only skatgo.com sends it on to PostHog.

## Not touched
- The power-ups, the lightbulb's look, autocapture and the charter. The charter does not list events; the tracking plan in `analytics.ts` is that list.

## Redlines lookup
- No redline applies: no schema change, no secret, no new third party. The product already sends events to PostHog.
