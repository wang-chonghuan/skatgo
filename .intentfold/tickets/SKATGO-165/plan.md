# SKATGO-165 plan

## What the code shows

- **Where free play shows its deal.** The top board's points cell has the line "Deal 3 of 6" (`skat-info-deal`, `info_deal`). The side panel's strip has a pill "Deal 3 of 6 · total …". A room passes no deal, so both stay empty.
- **No per-deal record in a room.** The snapshot keeps only the running `scores` and the deal on the table. A finished deal's summary is gone once the next one is dealt.
- **Next deal from any one person.**
  - `next` from any person deals at once, so another person's settlement closes under them.
  - Who counts as "a person here": a seat with an account and a live session.
  - A person away is played by a computer and must not hold the table.
- **The table menu (`TableMenu`) holds:** Keep playing, the room number, Remove <name> and Leave the room.

## Route (one commit per item)

1. **Deal number.**
   - `RoomTable.deal` comes from `pub.deals`.
   - The board shows "Deal 3" / "Spiel 3" (`info_deal_n`) where free play shows "Deal 3 of 6". The strip shows the same pill.
2. **Statistics.**
   - When a deal is scored, the service records its summary (`summarize`) and who sat where. A seat a computer played, including a newcomer's waiting seat, is recorded as a computer.
   - The public view carries this as `history`.
   - The table menu gets "Statistics" / "Statistik". It opens a dialog: one block per finished deal (the game line as in the score sheets, then each seat's points with the names of that deal, the viewer as "You"), then the totals with today's names.
3. **Next deal waits for everyone here.**
   - `next` marks the seat ready (`nextBy`). The next deal is dealt once every person online is ready.
   - Leaving, being removed or dropping re-checks the condition, so the table never hangs on someone gone.
   - The public view marks each seat `ready`.
   - The settlement's Next deal button turns into a disabled "Waiting for <names>" once pressed.
   - A press that deals nothing is not a game change (`played` stays).

## Undecided, for the grill

- The menu item's name and what one deal's block shows.
- Who must press: every person with a seat, or only those online.
