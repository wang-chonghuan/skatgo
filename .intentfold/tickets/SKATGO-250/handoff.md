# SKATGO-250 handoff — hard hands: each kind's picture a typical German-suit hand

## What changed
- `app/src/components/skat/playing-card.tsx`: `PlayingCard` takes an optional `deck`, drawing that one card in it whatever
  the settings say. `card-row.tsx`: `Fan` passes a `deck` through.
- `app/src/lib/skat/challenge.ts`: `TYPICAL_HANDS`, a ten-card hand and its game per kind.
- `app/src/components/skat/challenge-page.tsx`: each stage shows that hand with `Fan row deck="german"`, sorted by
  `sortHand` for the kind's game, on the kind's contract tint, padded so the tint shows at its sides; the five-card fans of
  SKATGO-249 are gone. The list's items may be narrower than ten cards side by side (`minWidth: 0`), so the hand closes up
  as the table's does instead of widening the page.
- Charter `ui.md`: the stage's description. Test: `challenge.test.ts` — each typical hand is ten distinct cards of its kind,
  its game the kind's.

## AC results (web 55250, multiplayer 56250, DB 57250; production build; Playwright headed, 1280×820 and 375×812)
1. Six stages, ten cards each, none rotated — PASS at both widths; the page is exactly the viewport wide (no sideways
   scroll).
2. German deck in the stages with the settings on the tournament deck — PASS (`data-deck="german"` on all sixty cards);
   elsewhere the settings rule: the bidding practice's hand stays `french` — PASS.
3. Each hand of its kind, sorted for its game — PASS in the unit test; the rendered order matches the game's sort (e.g.
   Null C9 C8 C7 S9 S7 H9 H8 H7 DQ D8; Schneider CJ SJ HJ DJ CA C10 CK SA S10 HA).
4. Desktop and phone: every card inside its stage — PASS; the screenshots show the indexes of all ten.

Web mechanical defence: typecheck, build, 376 tests, client bundle, tokens, literal grep, SSR link, SEO built + tests —
all pass. Multiplayer unchanged.

## Deviations
None from `plan.md`. Of the human's two options the whole small-card row was taken: cropping to the upper half needs a new
height in the token registry (ui.md Redline 1).

## Environment
Ports web 55250, multiplayer 56250, database 57250. No env keys added, changed or removed.

## Residual
None.

## Check
1. http://localhost:55250/en/hard-hands — whether the hands read well. The fresh-eyes reviewer found the ten whole cards
   too tight, each a strip with its index (more so on a phone), and would rather see the upper half of larger cards with
   less overlap, cut at the stage's edges on a phone — the other option in the request. It needs one new value in
   `shape.stylex.ts` (the stage's height, cutting the cards below their middle), which ui.md Redline 1 leaves to you.
   The tint above and below the cards was trimmed after its look.
2. The six hands themselves: German suits, one straight row each, the tint at the sides.
3. The same page at a phone width — the hand closes up as at the table; every index still readable.
4. Settings → another deck, then the same page — the pictures stay German; a deal at the table follows your choice.

## Decided for you
- The hands: one-Jack suit game ♣ (Schellen-Unter + Eichel A 10 K 9 8 …), few trumps ♥ (Herz-Unter + three Herz, strong
  side suits), one-Jack Grand, Null with the Schellen gap, the good hand (two Unter + Eichel), Schneider (four Unter).
- Whole cards at the large size rather than their upper half.
