# SKATGO-185 rework

## Round 1 — 「rebase一下」

The branch was rebased onto main after SKATGO-186, which left the forum with Announcements and Articles only. No
textual conflict. The deletion test (`multiplayer/test/forget.test.ts`) wrote its post under the removed Discussion
section and now writes it under Articles; the local review data was moved the same way (production has no post in a
removed section). Rechecked: `forget` and forum tests, web typecheck, build and unit tests, and AC 2–5 in the browser
on desktop and phone — all pass.

Net effect against the handoff: none in the product; the delivered behaviour is the same on the newer main.
