# SKATGO-61 AC check plan

Built web on 55061, multiplayer on 56061, local database on 57061. Two separate headed browser contexts, the host and a friend, each at desktop 1280×820 or phone 375×812 (`isMobile`, `hasTouch`); every UI criterion is seen at both sizes across the runs.

No game is played for its own sake (memory: acceptance never plays games). A deal is driven to its end by scripted legal moves: pass in the auction, the first legal card, and the computer's own declaration when a computer declares.

## AC1 — Open a room, join by link with a nickname only, one shared game

- **Check**: the host opens `/de/raum` and creates a room with a nickname, and gets an invite link.
- **Check**: the friend's fresh context, never signed in, opens the link, enters only a nickname, and sits down. Both lobbies show both nicknames.
- **Check**: after the start, both tables show the same deal state at every step: the same dealer, auction, contract, trick and revision, from `data-*` attributes. Each sees only their own hand.
- **True when**:
  - the link works without sign-in;
  - the two views agree on all public state;
  - neither page has the other's hand in its DOM.

## AC2 — Two humans plus a computer play a deal to the end

- **Check**: with host and friend seated, the host starts. Seat 3 is a computer, named and marked on its plate.
- **Check**: the deal is driven to its end. The computer bids and plays by itself, and the result dialog appears in both contexts.
- **True when**:
  - both show the same result;
  - the deal took no third human.

## AC3 — Two deals; running Seeger-Fabian totals match the results

- **Check**: start a second deal from the result. The dealer moves on. Drive it to its end.
- **Check**: read each seat's total in the info board, in both contexts.
- **Check**: compute Seeger-Fabian for each deal from its result as the server published it, with the engine's `seegerFabian`.
- **True when** each seat's total equals the sum of its two deal scores, the same in both contexts.

## AC4 — A player who closes the page is replaced by the computer and gets the seat back

- **Check**: the friend's page closes mid-deal. After the 30-second grace, the seat is computer-controlled; its plate says so. When it is that seat's turn, the computer moves for it.
- **Check**: the friend opens the same invite link again in the same browser context, so localStorage is kept. They are back in the same seat with their hand, and their moves count again.
- **True when** both hold.

## Also checked

Because the plan touches these:
- `/api/room/ticket`: refuses beyond its limits; a forged or expired ticket is denied by the room;
- the room page is noindex and not in the sitemap;
- `check:seo`.

## Mechanical defence

As `engineering.md` Tools names it, plus `npm --prefix multiplayer run check` (multiplayer changes, including the updated room tests).
