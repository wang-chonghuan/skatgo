# SKATGO-147 handoff

## What changed

- **Faces** — six cartoon pictures in the style the human chose (style 1, Lina dark red, Noah blue, Noah neat with a
  skin-tone nose), made with Azure `gpt-image-2` from the approved sample, transparent, 192px WebP (~9 KB each) in
  `app/public/faces/` (`lina-neutral|laugh|sad.webp`, `noah-…`).
- **When which face** — `app/src/lib/skat/face.ts` `faceOf(game, seat)`: the bidding's winner laughs from the end of
  the auction until the first card; at a finished trick the side that took it laughs and the other side sulks,
  until the trick is collected; otherwise neutral. `face.test.ts` covers the cases.
- **On the table** — `game-table.tsx` `SeatFace`: above each opponent's stack at the felt's edge, all three pictures
  in the page so a change never waits for a download; `alt` the name. Not at a private table (`room`) and not on an
  exercise's open board.
- **Room for them** — `table.stylex.ts` (Redline 1 approved in the grill): the stage unit counts the faces' room
  (88u landscape, 82u portrait) and the stage moves down only when the free height above it lacks that room; new
  `stage.face`, `faceTop`, `faceInset`, `talkBetweenFaces`. The band's table talk (phones, unpinned) keeps between
  the two faces.
- **Charter** — `ui.md`: the faces' paragraph and the stage registry row.

## AC results

1. **Avatars, chosen style** — pass. /en/play at 1280×820 (faces 74px) and 375×812 (60px), /en/daily/play at 375×812
   (signed in with a local test account): both faces shown, pictures loaded. Screenshots `tmp/desktop-final.jpg`,
   `tmp/phone-final.jpg`, `tmp/phone-daily.jpg`, the six in `tmp/faces/sheet.jpg`.
2. **Bid won → laugh** — pass. Unit check; in the browser (one pass of a deal) the faces went
   `skat: laugh/neutral → declare: laugh/neutral → play: laugh/neutral → play: neutral/neutral` as Lina declared.
3. **Trick won/lost** — pass. Unit check (declarer's trick, defenders' trick with the player or Lina declaring,
   collected); in the browser `trickEnd: laugh/sad` on Lina's trick.
4. **No overlap** — pass. `getBoundingClientRect` of the faces against every card, stack card, plate, the frame, the
   info board, the table's line and the talk card: no intersection at 1280×820, 375×812 and 375×667. A three-line
   talk card on the phone runs x 68–308 between the faces (68–371 before the fix would have covered Lina's hair).

## Deviations

- After the human-eyes look: faces enlarged from 64u/56u to 80u/64u, the two sulking faces regenerated (the first
  Lina sulk read as a side-eye), and the stage now keeps its old place where the room already exists — on 375×812
  nothing moves; at 1280×820 the frame moves 6px down; at 375×667 the hand's card is 81px.
- Talk-row width limit added (not in the plan) when the phone's two-line talk card was found 11px over Lina's face.

## Environment

Ports: web 55147, multiplayer 56147, database 57147. No env keys changed. The local multiplayer was started with
`LLM_BASE_URL` / `LLM_API_KEY` from `app/.env` so table talk shows.

## Residual

None.

## Check

1. The faces' size and place on desktop and phone (74px / 60px at the felt's edges).
2. The three expressions in play: laughing after a won bid and on a trick taken, sulking on a trick lost.
3. Hints, refusals and the table's line lie over the table on their own layer as before; a long one can cover the
   top of a face while it is shown.

## Decided for you

- The reviewer's other points were not taken: Noah's blue stays as the human approved it; the faces stay at the
  felt's edge over the part of the stack that shows.
- Faces are cut-out stickers on the felt, no circle behind them.
- At the end of a deal and in the result dialog the faces are neutral.
