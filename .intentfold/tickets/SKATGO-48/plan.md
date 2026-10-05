# SKATGO-48 plan

## What the code says that the ticket does not

- A deal's record (`DealSummary`, `app/src/lib/skat/tournament.ts`) keeps declarer, declaration, bid,
  won and the Seeger-Fabian scores — not the game value or card points. The engine's finished game has
  them (`result.value`, `declarerPoints`, `defenderPoints`, `overbid`, the multiplier parts).
- Old records have no details. The human (2026-10-06) ruled out any compatibility code: old
  tournament records are deleted in production and today and tomorrow are re-dealt with the new code.
- UI: `daily-comparison.tsx`:
  - `AiThisDeal` is one line after a deal;
  - `VsAiTable` is used after each deal (`game-table.tsx`), on `/daily` mid-day and on the result
    (`daily-table.tsx`);
  - its grid is `dims.vsAiColumns`.
- ui.md keeps `good` / `bad` for judging an answer only.

## Route

1. `tournament.ts`: `DealSummary.detail` = `{ value, declarerPoints, defenderPoints, overbid, schneider,
   schwarz }`, required; null for a passed-in deal. `summarize` writes it, so the player's deals and the
   AI's prepared results both carry it.
2. No change in `daily.ts`. After the deploy, all `daily_deals` and `daily_entries` are deleted
   (`redeal-days.mjs` as a Render one-off job) and the service deals today and tomorrow afresh.
3. `daily-comparison.tsx` is rewritten as one component, `VsAiTable`:
   - a header, one row per deal, and a total row;
   - a row reads deal number, your SF score with your role, the AI's SF score with its role, and the
     difference (you − AI), with a chevron;
   - the row is a button with `aria-expanded`; open, it shows two result lines, one for you and one for
     the AI: declarer, contract with Hand / announcements / Ouvert, won or lost, card points
     declarer:defenders (no card points for Null), Schneider / Schwarz / overbid, game value, and that
     side's card points;
   - `openLatest` opens the newest row (after a deal, and on `/daily` mid-day);
   - the total row gives both totals and the running difference.
   `AiThisDeal` and its message go.
4. Messages en/de for roles, won/lost, value, side points, difference, Schneider/Schwarz/overbid.
5. `dims.vsAiColumns` retuned to four columns (grill Q5); no new tokens.
6. Charter: not edited (human-owned); the drift goes to the handoff.
