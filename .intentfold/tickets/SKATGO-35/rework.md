# SKATGO-35 rework

Changes after the first delivery (`handoff.md`, frozen at 73f8072).

## Round 1 — 736b454

**Ask** (the human, relayed by the pm session, 2026-10-01): write the `skatgo_daily` cookie only when
the player actually starts playing — no cookie consent banner (「我不喜欢cookie那个弹窗」).

**Changed** (`app/src/lib/daily-handler.ts`): a guest without the cookie who only looks at `/daily`
gets "not started" and no cookie. The cookie is set only when a guest's play — opening the day's
deals, or a move — is accepted by the service. Signed-in players get none. A move without the cookie
is refused (409) and sets nothing. Continuing a deal and claiming after sign-in are unchanged; no
browser storage was added.

**Rechecked** (only what it touches, headed, 1280×820):
1. a fresh visitor on `/en/daily` gets no Set-Cookie;
2. starting the first deal sets it once (httpOnly, Path `/api/daily`);
3. reloading mid-deal resumes the same deal and hand.

The tournament keeps no `localStorage` / `sessionStorage`. Mechanical defence passed once on the
final branch.

**Net effect against the handoff**: the handoff's Environment and What changed said the cookie is
"set on first use"; it is now set on first play only. Everything else in the handoff stands.
