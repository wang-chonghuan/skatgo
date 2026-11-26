# SKATGO-248 acceptance checks (web 55248, multiplayer 56248, db 57248)

1. Front page → the Hard hands card → `/en/hard-hands` lists five kinds (one-Jack suit, short trumps, one-Jack Grand, Null with one weak spot, good hand in a bad seat), each saying the player is declarer. Pass = 5 entries.
2. Each kind: open deal 1 → the table is in the skat phase with the player declaring, no bidding; the hand matches the kind (checked from the dealt cards with the kind's predicate); "Pick up" then discard two; the game played is the kind's. Pass = all five.
3. Finish a deal (Playwright plays legal cards until done — acceptance of the flow, not of play) → the result shows the player's result and SkatZero's on the same cards and contract. Pass = both shown.
4. "Once more" → the player's ten cards and the skat equal the previous; the two opponents' hands differ. Pass = by the state the page holds.
5. Pool file: every deal's recorded SkatZero rate is 0.5–0.9; bad-seat deals' forehand rate ≥ 0.9; a recheck command recomputes a sample and agrees. Pass = script output.
6. No League points: a finished challenge deal changes no `league_players` row and adds no `league_deals`. Pass = DB unchanged.
7. Front page: four colour tiles, private table, forum, Skat Tricks as before; no advanced course card; the hard hands card in its place, opening `/hard-hands`; the course page links the advanced course. Pass = by testids.
8. Each kind has 30 deals ordered by SkatZero rate, highest first. Pass = pool check.
