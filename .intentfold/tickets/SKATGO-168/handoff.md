# SKATGO-168 handoff

## What changed

1. **Deal of the day's result** — it no longer leaves for /daily after 1.8 s (`DEAL_OF_DAY_PAUSE` gone). Its result
   dialog stays, and its foot is two buttons, one over the other: "Share with friends" (go, the same share sheet / copied
   link as /daily's result) and "Close" (quiet, to /daily). `dod-share.tsx` (`useDodShare`, `ShareSaid`, `DodDone`),
   used by /daily's result too; `Tournament.done` carries the foot into `DealResult`.
2. **Two faces** — `man-accountant` (shrewd white accountant: angular face, steel glasses, pencil behind the ear, grey
   suit, burgundy tie) and `woman-japan` (young Japanese woman: bangs, pink clip, lavender cardigan), calm / laughing /
   sulking, from the style sample alone with each face described; the picker in rows of four.
3. **Defaults and keeping a choice** — Lina's seat wears the office lady and Noah's the accountant until the player
   chooses. Only a chosen face is stored; settings version 1 (`migrateSettings`, unit-tested) treats SKATGO-167's stored
   lina / noah as never chosen, so the defaults reach everyone who never chose. The choice was already kept in the
   browser (checked on skatgo.com before the change: reload and a new tab).
4. **The grandfather** (asked during development) — `man-cap` redrawn as `man-grandpa`: bright blue eyes, neat white
   moustache, tidy cap, burgundy cardigan and bow tie, upright; a seat that chose the old one wears the new one.

Charter `ui.md`: the deal of the day's table, the faces paragraph.

## AC results

`tmp/accept.mjs` → `tmp/accept.txt`, 29 PASS; no game played.
1. Deal of the day — its table opens and deals at 1280×820 and 375×812, no page errors. The result and its two buttons
   come only after the deal is played: **not checked here**, left to your own deal.
2. Eight loaded pictures per seat with the accountant, the Japanese girl and the grandfather; chosen, their three faces
   at the table — pass (en/de, desktop/phone).
3. Fresh browser: office lady / accountant — pass. Version-0 browsers: stored lina / noah → the defaults; lina +
   man-beard → office lady + man-beard; man-cap → man-grandpa — pass.
4. A choice stays after a reload and in a new tab — pass.
5. No sideways scroll, no page errors — pass.

Mechanical defence: pass (`tmp/defence.log`, 325 passed).

## Deviations

- Item 4 (the grandfather) came in during development and is the ticket's fourth commit.

## Environment

Ports: web 55168, multiplayer 56168, database 57168. No env keys changed.

## Residual

None.

## Check

1. Play today's deal of the day (/en/daily → the one deal): the result stays; "Share with friends" over "Close".
2. The eight faces (sheet) — the accountant, the Japanese girl, the new grandfather.
3. Settings → Avatars: the defaults, choosing, and the choice still there next time.

## Decided for you

- The accountant is a man; the Japanese 美少女 is a young woman of about 20.
- Office lady in Lina's seat (left), accountant in Noah's (right).
- The choice stays in this browser, as other settings do; a stored old default counts as never chosen.
- "Close" goes to /daily, where the day's result and board are.
