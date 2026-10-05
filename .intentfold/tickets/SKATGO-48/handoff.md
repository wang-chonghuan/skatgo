# SKATGO-48 handoff

## What changed

The daily comparison against the AI tells what happened on each deal, not only the seat's score.

- `app/src/lib/skat/tournament.ts`:
  - `DealSummary.detail` (required; null for a passed-in deal) = game value, declarer's and defenders'
    card points, overbid, Schneider, Schwarz;
  - `summarize` writes it, so the player's finished deals (`daily_entries`) and the AI's prepared
    results (`daily_deals` benchmarks) both carry it. `multiplayer/src/daily.ts` is unchanged; the
    service picks the new summary up from the shared engine.
- No compatibility code for old records (the human, 2026-10-06). Old tournament records are deleted
  in production at deploy time instead (cap4).
- `app/src/components/skat/daily-comparison.tsx` is rewritten as one component, `VsAiTable`:
  - a header, one **foldable row per finished deal**, and a total row;
  - a row shows the deal, your Seeger-Fabian score with your role (declarer, defender, passed in), the
    AI's score with its role, and the difference you − AI, with a chevron;
  - opened, it gives two lines, one for you and one for the AI: declarer and contract (with Hand,
    announcements, Ouvert), won or lost with card points (none for Null), Schneider, Schwarz or
    overbid, game value, and that side's card points;
  - the total row gives both totals and the running difference;
  - `openLatest` opens the newest row: after each deal (the result dialog) and on `/daily` mid-day.
    The day's result starts closed.

  The difference is shown with its sign and in bold, not in red/green, because ui.md keeps
  `good`/`bad` for judging an answer. The old one-line `AiThisDeal` is gone.
- `game-table.tsx`: the after-deal box is the table with the newest row open.
- `daily-table.tsx`: `/daily` mid-day opens the newest row.
- Messages (en/de):
  - added: `daily_col_diff`, `daily_role_declarer`, `daily_role_defender`, `daily_won`, `daily_lost`,
    `daily_overbid`, `daily_value`, `daily_side_you`, `daily_side_ai`, `daily_show_deal`;
  - removed: `daily_ai_deal`.
- `app/src/theme/shape.stylex.ts`: `dims.vsAiColumns` retuned to four columns
  (`3.5em minmax(0,1fr) minmax(0,1fr) 5em`) under the human's "你思考后决定UI" (grill Q5). No new
  tokens.

## AC results

Built web on 55048, multiplayer on 56048, local database on 57048, both built from this branch. The
local tournament tables were wiped first, so the service dealt 2026-10-06 with the new code.

1. **Every place shows both sides, scores, difference, totals** — pass. `tmp/ui48.mjs`, headed,
   1280×820 and 375×812: 26/26 checks.
   - The result dialog after a deal shows the table with the newest row open and both sides' story,
     for example "You — Lina: Grand Hand · won 85:35 · game value 96 · your side 35 points" against
     "AI — Lina: Grand Hand · won 86:34 · … the AI's side 34 points".
   - `/daily` mid-day shows the same rows, newest open; another row opens on a tap.
   - On the day's result (en and de) there are 12 closed rows, and your total equals the day's total.
   - Every difference is you − AI, and the totals and the running difference add up.
   - The headless check `tmp/check48.mts` agrees: your total is the sum of your rows.
2. **Both defend, the declarer wins** — pass.
   - The headless check found 9 of 12 deals where you and the AI both defend. Each carries the
     declarer, contract, card points and side points; for example deal 2 is 0 : 0 with your side 25 card
     points against the AI's 53.
   - In the browser a 0 : 0 deal opened shows both stories: "Lina: Hearts ♥ · won 70:50 · game value
     20 · your side 50 points".
3. **Old records gone, days re-dealt with the new code** (as amended 2026-10-06) — local part pass.
   - All 12 prepared AI results and every finished deal on both sides carry their ending.
   - Card points add up to 120 except in Null.
   - The stored entry keeps them.
   - The production part (delete all old tournament records, the service re-deals today and tomorrow,
     the live state carries the detail) is cap4's, after the deploy.
4. **Readable, no overflow, en and de** — pass. No horizontal overflow on `/daily` or in the result
   dialog at either size and in either language, and nothing in the table is clipped. Screenshots
   `tmp/after-deal-*.png`, `so-far-*.png` and `result-*-{en,de}.png` were looked at. The first look
   found the total row's label colliding with the first total on desktop: the deal column was 2em. It
   was widened to 3.5em and the whole check rerun.

Mechanical defence (engineering.md Tools) passed:
- app: typecheck, build, 83 tests, client bundle, design tokens (98 files), literal grep, SSR link,
  `check:seo -- --built` (36 pages), `test:seo` (25);
- `npm --prefix multiplayer run check`: 19 pass.

## Deviations

- The first implementation derived the ending of deals already played by replaying their stored
  moves. The human then ruled out compatibility code (2026-10-06): it was removed before the first
  commit, `daily.ts` is unchanged, and the ticket's AC3 and constraint were amended with a comment.
- The local run was disturbed twice by a restarted server failing to bind its port while the old
  process still held it. The old build then served, and its assets answered 500. Both were restarted
  cleanly and rerun; these are not product faults.

## Environment

- Ports: web 55048, multiplayer 56048, database 57048. The comparison build of `main` ran from a
  detached worktree `../skatgo--SKATGO-48-base` for the dropped AC3 approach; it is removed at close.
- Env keys: none added, changed or removed.

## Residual

- Production data: every `daily_deals` / `daily_entries` row is deleted at deploy (the human's
  instruction), so today's and tomorrow's days are re-dealt and any play so far is lost.
- Charter drift, not edited (human-owned):
  - `product.md`'s daily tournament sentence still describes SKATGO-42's comparison (contract,
    declarer and score);
  - `engineering.md`'s key decisions do not mention `DealSummary.detail`;
  - `ui.md`'s widget table has no `VsAiTable`.
