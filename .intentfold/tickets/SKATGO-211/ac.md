# SKATGO-211 acceptance check

`tmp/ac.mts` against the ticket's production build (web 55211, multiplayer 56211, db 57211), 1280×820. Seeded into the
ticket DB only: personas of the Legend and Gold bands with XP, an account in Gold, an account without a League row.

1. AC1 — both personas' rows show the Bronze badge.
2. AC2 — the Gold account shows Gold, the account without a League row Bronze.
`multiplayer/test/xp.test.ts` holds the persona case too, and fails on the code before the fix.
