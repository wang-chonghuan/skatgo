# SKATGO-106 AC check plan

Playwright (desktop 1280×820 and phone 375×812, touch), served build on 55106 with multiplayer on 56106.
An init script wraps `AudioBufferSourceNode.prototype.start` and records each start with its buffer's
duration (the 1-sample unlock buffer is ignored); the deal sound is identified by the decoded
`deal.mp3` duration.

1. **First deal heard** — fresh context, open `/en`, tap the free-play link; within 2 s of the table's
   first deal a start with the deal duration is recorded. Control: the same script against
   https://skatgo.com (before the fix) records none.
2. **Every new deal, other sounds unchanged** — play the deal out with scripted legal moves only
   where the product requires (or give up via "Neue Runde" for a new deal) and see a second deal start;
   a card played records a play-sound start.
3. **Settings off = silent** — switch "Töne · Kartengeräusche" off, start a new deal: no start recorded.
