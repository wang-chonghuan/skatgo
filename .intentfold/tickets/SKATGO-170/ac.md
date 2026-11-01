# SKATGO-170 acceptance checks

No card played: a deal all three pass, found through the API, seeded as the kept game; en/de, 1280×820 and 375×812, signed in by a local test account;
`play_deals` read directly. `multiplayer/test/free-replay.test.ts` for the server.
1. Next deal over replay in free play; none at a private table (three passing); tournament and lesson by construction, no `again`.
2. Replay: the same ten cards, the deal's number unchanged, the notice.
3. Replay's end: heading says not counted, no Total row, no new row in play_deals, round unchanged.
4. First time in round and record once; next deal continues the round.
5. Reload during a replay: still one, still uncounted.
6. No sideways scroll, no page errors.
