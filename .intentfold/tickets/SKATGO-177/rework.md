# SKATGO-177 rework

Rounds after the handoff (6643721), each its own commit with the human's ask as its message.

1. **One tool per moment** (5549d35) — 「每个阶段……点这个灯泡之后就显示这个阶段适用的工具，不要让用户去选择了」. The
   lightbulb opens the moment's power-up only; the card counter lists the cards still out, no count column.
2. **Both void** (32ceba9) — 「红心明明两个对手都没了，为啥只显示lina」. A suit with nothing out shows "both".
3. **No "your side" points** (919f093) — the counter's points line removed.
4. **The duplicated side-panel strip** (f37b048) — 「在本工单里全部删掉」. The strip under the side panel's tabs is gone
   from every table; charter ui.md's info-board rule says the panel repeats none of it.
5. **Tighter dialog top** (0ff9cb3) — `Modal` gained `tight`.
6. **Put-away tips instead of the AI's answer** (c69a713) — 「选合约阶段提示的太多太直白了」, 「按这个改，不留看ai的扣法」. The
   server's `/free/putaway` and `putAwayOf` were removed. Superseded by round 9.
7. **The deal of the day played again** (01e05ef) — 「每天1deal的，应该也能复盘」. `/daily/replay`: today's deal once more
   for whoever finished it, as the share's practice (`/share/practice/new` now allows today for a finished player,
   `/share/practice/review` reviews it, nothing recorded); "Replay this deal" in the result's foot and on `/daily`.
8. **Sign-in on the guest's XP line, close in the corner** (186d0f8) — 「这里也要显示简单的登录按钮」, 「close还放在右上角，
   不要下面那个close按钮了」. A "Sign in" link beside "Sign in to earn XP"; the deal of the day's result and its replay
   close from an X in the dialog's top right; the foot's Close is gone.
9. **Win chances after pickup; the tips deleted** (59a27a5) — 「记牌器和叫牌胜率表可以留着（在选合约阶段，也显示这个胜率表，
   根据用户skat的牌，让胜率自适应显示），放skat技巧的删掉」. `/free/odds` answers, once the skat is picked up, the
   chances with the twelve cards worked out on the spot (`pickupChances`); the table drops the Hand column and is
   "Win at" the bid won.
10. **The two picked count** (7fe5239) — 「我选了2个skat，还没打出去，此时胜率表没变呢？」. `/free/odds` takes the two
    picked (`discard`); the table asks again per pair.

Rechecked: the ticket's acceptance script (`tmp/ac.mjs`, 23 checks incl. the post-pickup and picked-pair chances) at
1280×820 and 375×812; `tmp/dod-replay.mjs` (17) and `tmp/close-signin.mjs` for rounds 7–8; multiplayer tests
`free-power-ups`, `dod-replay`. Not seen in a browser: the corner X on a finished deal of the day (reaching it needs a
played deal).

Net against the handoff: power-ups are two — win chances (bidding, and after pickup with the skat found and the two
picked or put away) and the card counter; no put-away answer or tips anywhere; the deal of the day can be replayed;
guests get a sign-in link on the XP line. No env key added, changed or removed.
