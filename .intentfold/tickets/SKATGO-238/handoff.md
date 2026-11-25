# SKATGO-238 handoff

## What changed
1. League start 1000 (`e6c7364`) — `START_AT` 1000 in `app/src/lib/skat/league.ts`; the column default for a new
   `league_players` row 1000 (`multiplayer/src/store.ts`, no rescale: the 0 and 2000 lines did not move); unit tests;
   charter product.md and engineering.md.
2. No hang on "Reconnecting …" (`858a06c`) — `useSeat` in `app/src/components/skat/table-room.tsx`: an entry not done in
   12 s is let go (a late room is left) and tried again; the SDK's own reconnection gets 8 s, then the seat is entered
   afresh; on coming back to the page (visible, pageshow, online) a seat still reconnecting is entered afresh at once and
   one that looks connected must answer a ping in 3 s. A let-go connection's handlers are ignored. The 2-minute limit and
   its "Try again" stay; a seat that no longer exists still goes to the League page. Charter engineering.md.
3. League opponents' avatars (`aa2260b`) — the service stores each person's face on their League seat when the table
   forms (`player_avatars`; none for a persona) and publishes it (`RoomSeat.face`); the League table passes both
   opponents' pictures to `GameTable`, which draws them still (`StillFace`) in free play's face boxes, whatever the
   Lina/Noah switch says. Charter ui.md.

## AC results
1. PASS — unit tests (1000 / 2000 / 0, moves start at 1000). Running product: a fresh test account on /en/league is
   Bronze 1000, the rules read "Every tier starts you at 1000 points. At 2000 you go up a tier, at 0 down one."; a
   multiplayer restart (migration) left all 12 existing rows' points unchanged.
2. PASS — running product, a seated League table (Playwright, no deal played by me), the network to the service through a
   cut-able proxy whose dropped connections stay hung, as a waking phone's do:
   - before the fix, cut 8 s then back: "Reconnecting …" for 90 s and on (the SDK's reconnect socket never opened or
     closed; visibility and online events did nothing) — `tmp/before-fix-stuck.png`;
   - after: same cut → table back in 2 s; same cut with no page-back events → 2 s (the 8 s give-up); the ticket request
     held unanswered → back in 14 s (12 s time-out, retry); page frozen 40 s while cut (lock) → back in 6 s; frozen
     100 s (past the one-minute away rule, seat gone) → League page, no spinner.
3. PASS — League table vs two personas: both opponent boxes show the drawing of their names; two test accounts seated
   together, one with a drawn avatar: the other sees that avatar (`m000000000001edf`) and the persona's name drawing,
   and the first's own name drawing is seen in turn. Boxes measured identical to free play's (40 px at x≈2 and x≈802,
   y 72, at 844×390).

Mechanical defence: typecheck, build, 366 app tests, client bundle, design tokens, no raw styles, SSR link, check:seo
--built, test:seo — pass (the SEO step first timed out against my own server on the same port; rerun with the port free,
pass). Multiplayer: 71 tests pass (the persona-strength file needed the ticket server stopped, as it holds the DB lease).

## Deviations
None from plan.md.

## Environment
Ports: web 55238, multiplayer 56238, database 57238. No env keys added, changed or removed.

## Residual
None.

## Check
1. The avatars' look: the fresh-eyes review said they look unlike free play's — round drawings, not stickers on the dark
   square. Position and box are the same as free play's (measured); the drawing is the product's avatar style (boards,
   forum). Look at a League table on the phone.
2. The lock on a real phone: Chrome cannot freeze a page the way iOS does; the hang was reproduced and fixed on the
   connection level, not on an iPhone.

## Decided for you
- Still avatars, no expressions (your answer).
- League avatars show even with the "Lina's and Noah's avatars" switch off — that switch names the free-play AIs.
- AI opponents show the drawing of their name, as on the boards.
- An opponent's avatar is the one stored when the table formed; a change mid-sitting shows at the next table.
- Away past one minute still costs the deal (SKATGO-206); coming back now always ends at the table or the League page.
- No points changed for anyone.
