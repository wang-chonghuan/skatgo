# SKATGO-108 plan

## What the code says that the ticket does not
- The exercises are one list (`tricks/exercises/positions.ts` + `judged.ts`) shown as twelve kinds × three on `/skat-tricks` (`tricks-page.tsx`); `exercises.test.ts` holds that shape. The ladder is a thirteenth kind with ten — the shape test changes with the requirement.
- `solve.ts` already has what the proof needs: `sureOf` (the declarer sure of `need` without seeing the defenders' cards) and `openPoints`. Missing: a filter of worlds by the voids the play showed, and the facts the analysis shows (the sure line in the real deal, one losing split per other card).
- The play record a learner already knows is `TrickReplay` (`daily-comparison.tsx`): one row per trick, cards as text labels, seat 0 bold, names per seat — usable as is with seat 0 = you (declarer), 1 = left, 2 = right.
- A yield probe on the free-play pool (`.intentfold/tmp/puzzle-yield/`): 200 games give ~17 positions with exactly one sure card at 3–5 cards left; each proof takes 0–150 ms.
- The course stores progress in `localStorage` (`progress.ts`); the exercises store nothing (SKATGO-103: 「暂时不需要登录，也就不保存结果」).

## Route
1. **Generator** `multiplayer/scripts/make-endgames.ts` (one-off, like `make-free-pool.ts`): replay pool deals with SkatZero in every seat; at each declarer lead with 3–5 cards, a picked-up skat and the game still open, keep positions with exactly one sure card among ≥ 3 legal; record the deal's history, skat, hands, need. Rank by difficulty (tricks left, legal cards, whether the "obvious" card — the highest card — fails) and pick ten, rising. Output `app/src/lib/skat/tricks/endgames.json` (committed).
2. **Proof and facts** in `app/src/lib/skat/tricks/exercises/endgame.ts`: worlds consistent with voids; the sure card proven unique (`sureOf`); for every other legal card a losing world; the sure line through the real deal; voids per defender. Run when the module loads — a puzzle that does not hold fails the build — and held again by `exercises.test.ts`.
3. **Exercise model**: a new kind `sieg-sichern` (ten exercises) with a `history` row (rendered by `TrickReplay`), level 1's outstanding cards and voids, and an `analysis` block (voids → where the cards are, the opponents' hands, the line with points per trick, the traps). Words are templates per language filled from those facts — no hand prose per puzzle.
4. **Hub**: the ladder as the first card (featured, open by default? — grill), ten steps with level and tricks left; then the twelve kinds as now.
5. **Exercise page**: renders the new rows and, after the answer, the analysis block.
6. Grill outcomes (progress storage, gating, the open-card kind 8) folded in.
