# SKATGO-173 handoff

## What changed

- `game-table.tsx`: the deal of the day asks its review as size 1 (`dailyAsk(deal, size)`, cache key with the size). It
  was asked as the six deals' deal 0, so for a player without those it never came: no AI comparison, no XP.
- `daily-comparison.tsx`: `useReview`, one fetch per deal shared by the result's parts; `DealXp`, the result's first
  line ("XP …" while the review comes); `VsAiReview` no longer carries the XP.
- `xp-earned.tsx`: no toast; one row — the XP as a pill (`go` on `goodSoft`, a guest `slate` on `page`), why beside it,
  the question mark at the right; texts "+2 own game", "Sign in to earn XP" / "Anmelden und XP sammeln"; the toast's
  rule texts removed.
- Charter ui.md / product.md.

## AC results

1. **Deal of the day** — pass. Played locally as a guest at 375×812: the result's first element is the XP line
   ("+4 XP", the guest text), the AI review `ready` under it (`tmp/phone-dod-xp.jpg`, before the row redesign). The
   weekly board reads every size's entries (unchanged, SKATGO-172).
2. **Free play / six deals** — pass. Free play signed in (test account): first element the XP line, "+6 XP · Below the AI
   by 40 ?" in one row — pill 64×28, text 191 wide, ? at the right (`tmp/phone-xp-row.png`). The six deals use the same
   `DealResult` → `DealXp` path.
3. **No pop-up** — pass. No `xp-toast` element after either deal.

Mechanical defence passed (342 tests, SEO OK); multiplayer check 47/47.

## Deviations

- The row's look was redone before this handoff after the human's 「看这截图，他妈的丑死了」 (commit 7ffe69a).
- No fresh-eyes review: the human asked to deploy at once (「等下直接部署」, 「cap4，部署」).

## Environment

Ports: web 55173, multiplayer 56173, database 57173 (Colima profile `skatgo`). No env keys changed.

## Residual

None.

## Check

1. The XP row at the top of a result, signed in and as a guest.

## Decided for you

- "XP …" holds the first line while the review comes, so the result does not jump.
- Guest text shortened to "Sign in to earn XP".
