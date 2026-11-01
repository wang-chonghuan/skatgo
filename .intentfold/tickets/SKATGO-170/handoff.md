# SKATGO-170 handoff

## What changed

- **Server** (`free.ts`): `/free/replay` gives a finished game's token a new one of the same deal with `replay` sealed in it, kept through its moves;
  `/free/review` records no replay, whatever the page asks. `free-handler.ts` passes it on, counted with new games. `free-replay.test.ts`.
- **Page** (`server-table.tsx`): pressing replay counts the first time in the round once, then marks the round `replaying`, which is kept with the token across a
  reload; no game event for a replay; on to the next deal adds nothing more.
- **Table** (`game-table.tsx`): the result's foot is next deal over `quiet` "Replay this deal", free play only; while it is played a dark pill, "Replay – this deal
  doesn't count"; the replay's result is headed "Replay – not counted", without a Total row; board totals unchanged by it.
- Charter `product.md`, `ui.md`.

## AC results

`tmp/accept.mjs` → `tmp/accept.txt`, 64 PASS, en/de, desktop/phone, a local test account; `play_deals` read directly. No card was played: a deal all three pass.
1. Next deal over replay, same width — pass. Private table, three people passing: no replay button (`tmp/room.txt`) — pass. Tournament and lesson 11: no `again` is passed — by the code, not seen.
2. The same ten cards, deal number unchanged, the notice — pass.
3. Replay's end: says not counted once, no Total row, no new row in `play_deals`, round unchanged; a replay of a replay too — pass.
4. First time in the round and the record once; the next deal is "Deal 2 of 6" — pass.
5. Reload in a replay: still one, uncounted — pass.
6. No sideways scroll, no page errors — pass.

**Not checked: a replay of a deal with cards played**, the check plays none. The same path; the server test and these checks cover passed-in deals only. Yours to play.

Mechanical defence: pass (`tmp/defence.log`); multiplayer check: 46 pass. After them only the notice's condition changed; typecheck, build, tests and the check above rerun.

## Deviations

None.

## Environment

Ports: web 55170, multiplayer 56170, database 57170. No env keys changed.

## Residual

None.

## Check

1. Play a free deal to its end, press "Replay this deal", play it differently: the same cards; your round's total and number unchanged at its end.
2. "Next deal" after it: the round goes on.

## Decided for you

- A deal all passed can be replayed, and a replay replayed.
- The replay's result keeps the AI comparison.
- No analytics event for a replay, so its use is not measured.
- Next deal stays the green button on top, replay quiet under it.
