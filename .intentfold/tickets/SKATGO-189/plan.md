# SKATGO-189 plan

## What the code says that the ticket does not
- Both lists come from one file, `app/src/components/skat/deal-history.tsx`: `DealLines` (front card, one line a
  game) and `DealRows` (profile, with the Replay `action` from `profile-page.tsx`). Same data, `ProfileDeal`.
- The other players' names come from `dealLine` (`result_head_won/lost` with Lina / Max). The row's role is
  `mine.declarer` (0 = you, 1/2 = another seat, null = all passed); the contract is `mine.game` ("grand",
  "C hand", …), missing on free deals recorded before SKATGO-169 — then the row says only the role.
- A deal's hand is missing where its cards are not kept; then the cards line is empty.
- Replay today is a `link` (`info`, underlined) under the row; it stays exactly as it is (the human: 「replay要和当前的一样，不要按钮」).
- The difference to the AI stays at the right, signed, never `good` / `bad` (SKATGO-81).

## Route
1. `deal-history.tsx`: one `Row` used by both lists — line 1 the contract (`appBtnStrong`) and a role tag
   (`badge`: declarer `youTag` + `onColor`, defender `page` + `slate`), "Passed in" in slate without a tag; at
   the right the difference. Line 2 the jacks, aces and tens (`Rich`, suits in their colours, J → A → 10, ♣♠♥♦
   within), a wider space between the groups; at the right the date (`meta`, slate). `DealRows` adds the action
   under it. Head: "Game · your jacks, aces, tens" | "vs. AI".
2. Drop `dealLine`, `modeOf` and the now unused messages (`history_game`, `history_free`, `history_dod`,
   `history_tournament`, `history_cards`); add `history_head`, `history_declarer`, `history_defender` (EN + DE).
3. Charter: `ui.md` (front card and record rows) and `product.md` (the card's line) say what the rows now show —
   amended by the ticket's request.
No token changes, no new dependency.
