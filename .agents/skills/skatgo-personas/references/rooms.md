# Existing Private-Room Integration

Read with [runtime.md](runtime.md) and [sessions.md](sessions.md).
This is a target adapter contract, not a claim that the batch runner joins rooms.

## Admission and Seats

Read `multiplayer/src/room.ts`, `model.ts`, `referral.ts`,
`app/src/lib/skat/room-view.ts` and the Charter's private-table contract first.
Resolve actual admission, grace, start, next-deal, takeover and closure rules
there instead of copying constants into this skill.

Only supply personas to existing computer seats explicitly assigned by the
host under the ticket's approved behavior. Do not search invitation numbers,
auto-join private rooms as a stranger, create persona-only public tables or
introduce matchmaking. Keep actual guests/friends and their admission unchanged.

Represent persona ownership explicitly in the authoritative seat model.
Do not forge `user:`/Clerk identities, loosen human admission validation,
reuse human session tokens or classify actors by whether a string is non-null.
Keep human presence, computer control and persona identity distinct.
Use the same stable `sim:` identity/name as the boards.

An internal authenticated actor adapter may submit persona intents bound to
one persona, room, seat and lease. The room validates phase, legal move,
ownership and idempotence; the persona service never writes a room snapshot
directly. Do not give the adapter general human/account authority.
Actors need no fake browsers or one human WebSocket client per identity.

## Preserve the Table Contract

- The human host retains existing start, seat and removal controls; a persona
  neither becomes host nor starts a waiting room on its own.
- A real friend has the existing right to replace a computer seat. Preserve
  the current-deal/next-deal boundary and score reset; account for persona
  lease release and attribution without delaying that friend.
- Persona readiness must not count as a human's acknowledgement or bypass
  required connected-human `next` commands. Persona delays stay bounded.
- Retain actual dropped-human grace and autopilot behavior. Replacing an
  assigned computer seat is not permission to change a real player's
  disconnected-seat policy or their takeover AI.
- The last real participant leaving still closes the room. Personas must not
  keep it alive, continue unwatched games or consume room slots indefinitely.
- Room results remain room scores/history. Do not create a daily entry or award
  XP for room play unless the live ticket explicitly changes those rules.

## Decisions, State and Recovery

Use only that seat's permitted view and public observations, never other
players' hidden hands or information exchanged between two personas.
Apply persona bidding/card style to the assigned seat only; the pinned engine,
standard benchmark and Lina/Noah stay unchanged.
The existing valid early-end rules are not removed just to extend play.

Separate snapshot reading, persona inference and deadline scheduling from the
short authoritative move commit. Check the current played state, seat lease and
leadership fence when committing; reject late results after a takeover.
Store chosen actions and deadlines so a reconnect or retry does not redraw
cards, change decisions or duplicate results.

Restore actor leases, session state and pending decisions before scheduling
new work after restart. A real seat replacement supersedes a stale reservation.
Deployment/transport failure is not a persona's manufactured network event.
If the service is disabled or cannot decide, cancel new actor work and follow
the ticket's explicitly approved room stop/drain behavior; do not silently
substitute a different policy or hide infrastructure failure.
