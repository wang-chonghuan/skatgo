# SKATGO-235 acceptance checks

Against the ticket's services (55235 / 56235 / 57235). The room checks are the multiplayer integration tests
(`rooms.test.ts`, real Colyseus clients); the League check its route test; the web's handler test. Then one headed
browser run: a test account seated at a private table, page closed, then League "Play" and a new private table.

1. Seated at a private room, opening a new one succeeds; the old seat is a computer's (or the old room closes if empty).
2. Seated at a private room, the League's `/play` queues (no `already_in_room`); the old seat is released.
3. Seated at a League table, opening or entering a private room succeeds; the League seat is left (`leaving`).
4. Entering another room by number while seated succeeds; the old seat is released.
5. The old table's other person sees a computer in that seat; the old connection gets `dismissed: elsewhere`.
6. No `already_in_room` is answered anywhere (code search + tests).
