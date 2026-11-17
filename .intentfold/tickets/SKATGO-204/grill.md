# SKATGO-204 grill

Grill: human. Coverage over the ticket, plan.md, ac.md and the Charter. No question passed the bar (expensive if
wrong, nothing on record settles it, cannot be shown instead): the colour and icon of the League tile and the bidding
practice's picture are built and shown as screenshots, as the ticket's Proposed solution says.

## Decided for you

1. **Do League seats use personas even while the persona board runner is switched off?**
   Decided: yes. The switch (`persona_control.enabled`) governs the batch board simulation of SKATGO-180; the ticket
   makes personas the League's empty seats, and without them no round could start. Deploying the League is the
   human's separate decision anyway. Basis: the ticket's Scope (匹配) and product.md SKATGO-180.
2. **Which personas sit at which tier, and how strong?** Decided: the deterministic `population(500)` sorted weakest →
   strongest by their own card-error rates (the `/2` strength policy the boards use since 11 Nov), cut into six equal
   bands; tier i draws its two from band i. They play their cards with that policy, its card errors kept by tier — 1,
   0.8, 0.6, 0.4, 0.2, 0 (Legend plays SkatZero's cards) — and bid on the pool's SkatZero plan. A persona already at a
   live League table, or with a board activity planned within 30 minutes, or whose name a human account holds, is
   skipped (the skill's one-timeline rule). Basis: the ticket (档位越高对手越强，传奇接近 SkatZero; a regular climbing a
   tier in about 11–21 rounds). Measured in calibration.txt (400 rounds a tier): SkatZero in a seat earns +1.90 a round
   in Bronze down to +0.97 in Legend (37/38/26 %, near parity); the median persona +1.06 down to −0.51. The first try,
   the legacy policy banded by `mistake`, gave SkatZero only +1.54 → +0.86 — Bronze nearly as strong as Legend — and was
   dropped.
3. **Do personas get XP, records or League standings from League tables?** Decided: no — only accounts. Basis:
   product.md (identities and records stay separate), personas skill rooms.md.
4. **What is "今日金币" on the page?** Decided: the coin balance, with "+100 today" once today's check-in counted.
   Basis: the ticket's AC 2 (balance accumulates).
5. **When does the check-in fire?** Decided: once per page load of the site by a signed-in browser (the Android app
   too), a single POST after the page is up; the service grants 100 if the account has not checked in on that Berlin
   day. A new account starts with 0 and gets 100 on its first open. Basis: the ticket (打开就能积累), `dayOf`.
6. **How is a deal's review and XP computed when the player sat in seat 1 or 2?** Decided: the deal is turned so
   their seat is seat 0 (same deck, dealer turned, log turned) and free play's review is reused unchanged; the
   `play_deals` row is written when the player's own result asks for it, as in free play — a deal the AI finished for
   an absent player earns nothing unless they come back and open its result. Basis: free play's `/review`, product.md XP.
7. **League deals in "History & analysis"?** Decided: they are listed (cards, declarer, difference to the AI), keyed
   `league:<pool>:<poolId>:<seat>:<match>:<deal>`; "Again" is not offered for them in this ticket (a replay of a turned
   deal needs free play's tokens and win chances turned too). Basis: AC do not ask for it; listed in the handoff.
8. **Leaving mid-round?** Decided: the table's menu has "Continue" and "Leave table"; leaving goes back to the League
   page, the seat stays the player's (the AI plays it after the 30 s grace) and the League page offers "Back to your
   table" until the round ends. No refund. Basis: ticket (中途离开不退, AC 7).
9. **The round's end.** Decided: the third deal's result has "Round result" in its foot; the round result shows place,
   the three totals, ±points and the new total, promotion/relegation, then "Play again · N coins" (`go`) and "Back to
   League" (`quiet`). The round is scored the moment the third deal ends (not when someone taps), once.
10. **Ties on the Legend board.** Decided: points, then who reached them first (`updated_at`). Basis: daily board's
    "ties to the earlier finish".
11. **Addresses and indexing.** Decided: `/en/league`, `/de/liga`; the table `/en/league/play`, `/de/liga/spielen`; both
    noindex (personal state, like `/profile`; the table like every table). Basis: engineering.md (indexability).
12. **A finished League room and "one room at a time".** Decided: once the round is scored the room stops counting
    for `roomOf` and expires within 10 minutes; nobody enters a League room by its number. Basis: model.ts, ticket.
13. **Matching across a deploy.** Decided: the 5-second queue lives in the leader's memory; a request caught by a
    deploy gets `not_ready` and the page tries again. No table, no lock. Basis: one-instance service (operations.md).
14. **The League tile.** Built with the existing `tileNavy` (the bidding practice's tile colour, so no registry change)
    and lucide `Trophy`; alternatives shown as screenshots; a colour not in the registry needs the human's pick first
    (ui.md Redline 1).
15. **The bidding practice picture.** Generated in the existing flat style of `practice-card.webp` / `forum-card.webp`
    (Azure `gpt-image-2`), one auction scene; shown as a screenshot.
17. **Bronze points below −8?** Decided: they stop at −8 (Bronze has no relegation, so the line is its floor and a
    beginner is never more than 20 points from Silver). Basis: the ticket says only 「青铜不降」; a floor keeps the climb
    in reach. Cheap to change if the human wants the points to run on.
16. **Charter.** product.md: the League paragraph and SKATGO-180's sentence as the ticket says; ui.md: front page and
    League pages; engineering.md: League in the stack and structure, and its own "No arena or public matchmaking is
    introduced" amended (the human's request contradicts it). Recorded in a ticket comment.
