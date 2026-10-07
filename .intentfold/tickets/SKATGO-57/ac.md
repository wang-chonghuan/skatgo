# SKATGO-57 AC check plan

Built web on 55057, multiplayer on 56057, local database on 57057. A fresh local day is dealt by SkatZero, which takes about 30–35 s.

## AC1 — The finished deal keeps its result, auction included

- **Check**: play one daily deal in the browser to its end, with scripted legal moves and no game-playing beyond what is needed (memory: acceptance never plays games for its own sake).
- **Check**: read the panel: auction, contract, three scores.
- **Check**: reload `/daily/play` and `/daily`, and fetch `/api/daily/state`. The same auction and three scores come back for that deal, and also the AI's.
- **Check**: the auction equals what the engine's replay of the stored moves gives: query `daily_entries.actions` and replay through the engine in the check script.
- **True when** before and after the reload agree and match the replay.

## AC2 — The panel leads with "me vs AI"

- **Check**: in the after-deal dialog, the first block after the title is the comparison:
  - my SF score, the AI's SF score and the difference;
  - then both sides' auction and contract, and all three seats' scores.
- **Check**: the details (formula, card points, skat) and the day's table are collapsed by default and open on a tap.
- **True when** the order and the collapsed state hold.

## AC3 — One screen, no horizontal scroll

- **Check**: at 1280×820 and 375×812 (`isMobile`, `hasTouch`), the comparison block fits in the viewport, and `scrollWidth` is at most the device width.
- **True when** both hold.

## AC4 — Day totals still visible; free play unchanged

- **Check**: the day's table under the dialog opens and shows every finished deal and the totals, and `/daily` shows the same table.
- **Check**: free play's settlement still shows its result (`skat-result`) as before.
- **True when** both hold.
