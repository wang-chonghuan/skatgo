# SKATGO-170 plan

Found: the free game's state is a sealed token, the server keeps nothing per game; a signed-in player's deal is recorded when its review is
asked; the round lives in the page and goes with the kept token. So "counted nowhere" belongs in the token, where no page can change it.

1. `/free/replay`: a finished game's token gives a new one of the same deal with `replay`, kept through its moves; `/free/review` records no replay.
2. The page: pressing replay counts the first time in the round, then marks the round `replaying`, kept with the token across a reload; a
   replay adds nothing to the round or the totals and sends no event.
3. The result's foot: next deal over replay, free play only; the notice over the felt; the result's heading; no Total row.
