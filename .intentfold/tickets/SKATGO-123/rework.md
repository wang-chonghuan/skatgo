# SKATGO-123 rework

Ten rework rounds after the handoff (75edf0e), one commit each, the human's ask as its first line.

1. **Alice and Olena are one player; the tournament needs an account** (ab429ff) — 「alice跟olena是一个人，而且要求参加
   锦标赛必须登录」. A third `player_aliases` merge. `/api/daily/*` refuses a guest's opening of the deals and moves
   with 401, looking stays open; the tournament's page offers "Anmelden und mitspielen" in place of the way in, and
   a guest at the table is sent back. Copy that promised play without an account follows: the daily lead, the
   tournament's intro, the FAQ answer on accounts, the hero's "No sign-up" tick.
2. **The rule behind a circled question mark; the board as tall as the type** (2746396) — the explanation opens
   as a white card over the page from an `info` question mark beside the title; on PC the board stands out of the
   grid's flow and fills the type's height (`Panel`'s new `fill`), its list scrolling inside.
3. **No ✓ line in the hero** (535b34a) — 「✓Free ✓AI analysis 这行去掉」.
4. **Two columns, tighter rows; a carousel on the phone** (ebfcb5c) — 「我觉得A和B……名字要能像carousel那样自动轮换」.
5. **A slow sideways scroll instead of the carousel** (adb67af) — 「你这个还不如横向持续缓慢滚动」: the folded phone
   line runs all players sideways without end (`timing.marquee`, `marqueeSlide`), still under reduced motion.
6. **The forum's newest post in the forum button's place** (7d13934) — a white button with a pill; corrected in 7.
7. **The announcement line as it always looked** (54b3168) — 「完全错！！！……之前我让你删掉那个首页上的公告链接长啥样，就换成
   那个」: beside the tournament button, `AnnouncementLine` (light green pill, blue linked title), its pill reading
   "Neu im Forum" / "New in the forum"; without an announcement, "Zum Skat-Forum".
8. **Rows back at 16px** (23278cf) — 「我刚都没说让你改成14」: round 4 had made them 14px (`boardDense`, now removed).
9. **One column** (cbd3fdd) — 「你换成单列吧，elo卡片」.
10. **More room right of the numbers** (1204ae1) — 「数字的右padding太小吧」: 16px right, 8px left.

Each round was checked on the running build at 1280×820 and 375×812 (measurements, links, the scroll's motion in
Chromium), with the acceptance script, typecheck, unit tests, the token and bundle checks and `check:seo`.

Net effect against the handoff: the hero's type sits beside an Elo board exactly as tall as it — one column of
16px rows scrolling inside, its rule behind a question mark — the forum's newest announcement beside the
tournament button, no line of facts; on a phone the board's folded line scrolls the players sideways; the
tournament is played signed in; three merges stand in `player_aliases` (Julien's ids, Mark's two, Alice into
Olena).
