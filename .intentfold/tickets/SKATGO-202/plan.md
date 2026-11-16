# SKATGO-202 plan

Found: a stored deal of the day (`daily_deals`, size 1) is `{ dealer, deck, benchmark: { summary, log }, pick }`; seat 0
is the player; `benchmark` is SkatZero's game from the player's seat — the answer, and also what tells which decision
the deal turns on. The site's cards are `PlayingCard` (StyleX, zustand settings, paraglide), drawn from SVG plus
`/cards/*.webp` court pictures. No server-side card drawing exists.

Route:
1. `video/`, its own package (Remotion 4.0.539 and Babel/StyleX at the app's versions, exact) — no change to `app/` or
   `multiplayer/`.
2. `remotion.config.ts`: the app's `PlayingCard` compiled with StyleX's Babel plugin (runtime injection), packages from
   `video/node_modules`, `/cards/...` paths rewritten to the render's static base.
3. `scripts/plan.ts` (through the multiplayer's tsx): quiz = the day's hand + one question chosen from the AI's own
   decision (pass / bid / game / hand), answer never said; answer = the day before: auction, skat and discard,
   contract, the ten tricks, result.
4. `scripts/make.mjs`: read both deals (Render CLI, read-only), plan, Azure TTS per line (Seraphina HD; length from
   the CBR MP3 size), render two MP4s.
5. Charter: engineering.md (`video/`), operations.md (how to run, the Azure resource).
