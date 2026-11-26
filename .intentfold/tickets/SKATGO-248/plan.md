# SKATGO-248 plan

## Found in the code (not on the ticket)
- Free play is token-based (`multiplayer/src/free.ts`): a pool deal, every move in an encrypted token, the computers' moves worked out per request, `/review` plays the same deal with SkatZero in all three seats. A challenge can work the same way with its own start: the deal already in the skat phase, seat 0 declarer.
- SkatZero picks its own game after a pick-up (`declareAfterPickup`); a fixed game needs only its discard for that game (the per-game part of `bestGameAndDiscard`).
- The course page already links the advanced course (SKATGO-234), so only the front card goes.
- The front card pictures were drawn with Azure `gpt-image-2` from the existing cards as style references (SKATGO-234's prompts in the main checkout's `.intentfold/tmp/SKATGO-234/course-card/`).
- Free play's replay table (`shared-page.tsx` `FreeAgain`) is a ready template: token, `GameTable` with `server`, review, a "once more" foot.

## Route
1. `app/src/lib/skat/challenge.ts` (shared): the five kinds (slug, contract from the ten cards, the pattern), the start state (deal in the skat phase, seat 0 declarer, bid 18), Null weak-suit test.
2. `multiplayer/src/skatzero/bidding.ts`: `discardFor(policy, hand12, position, mode)`.
3. `multiplayer/src/challenge.ts`: the pool (JSON, committed, checked on load), SkatZero playing a challenge as declarer, routes `new` / `act` / `review` / `again` (token like free play's; the declaration is the kind's, applied by the server after the discard; Hand not offered).
4. `multiplayer/scripts/make-challenge-pool.ts`: random deals → pattern → 20 re-deals of the other 20 cards with SkatZero declaring → keep 50–90 % (bad seat: forehand ≥ 90 %, middlehand 50–90 %); 30 a kind, easiest first. Runs in parallel workers in the background.
5. Web: `/api/challenge/*` handler (as `/api/free`), pages `/hard-hands` (the five kinds) and `/hard-hands/$kind` (deal n, next, once more), messages EN/DE, sitemap/SEO inventory, front card in the advanced course's place with a new picture in the cards' style; the advanced course's front card goes.
6. Charter: product.md, ui.md (+ engineering/operations Tools for the pool script).
