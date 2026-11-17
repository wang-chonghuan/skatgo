# SKATGO-205 acceptance checks

Local: web 55205 (production build), multiplayer 56205, database 57205; test accounts; Playwright 1280×820 and 375×812;
the service's own test against a database of its own. Deals are not played through in the browser beyond handing the
seat over for its last decision, as in SKATGO-204.

1. Per deal points: unit tests of `dealPoints` (own game won +3, beat the declarer +3, own game lost −3, defence lost −1,
   all passed 0); service test: each finished deal writes each person's points once and moves their standing; browser:
   the result dialog's first line shows the deal's points and reason, then XP and the AI comparison.
2. Up/down: unit tests — +30 up, −20 down, back to 0; Bronze never below −20 and never down; Legend never up, −20 down.
3. Fees per deal: service test — each new deal takes 3 (Bronze) from each person seated; a person with too few coins is
   taken off the table when the next deal comes (seat to a persona, no fee); browser: with too few coins the result's
   foot says so and leads back to the League; free play and the daily deal answer 200.
4. Sitting: alone → seated within 5.5 s with two personas; deals keep coming (deal 4 is dealt, no round end); `leave`
   during a deal: the seat is played by a computer, the deal counts, the next deal has a persona there and no fee taken;
   a person away when the next deal comes is taken off likewise; no person left → the sitting ends.
5. League page: tier, points with distance up/down, coins, each tier's fee per deal, the rules text per deal; Legend board.
6. Reset: an existing row on the old scale is at 0 points, same tier and coins, after the service starts; a second start
   changes nothing.
7. EN/DE words; no sideways scroll at 375 on the League page.

Mechanical defence and `npm --prefix multiplayer run check` once before the handoff.
