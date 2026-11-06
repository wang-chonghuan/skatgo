# SKATGO-176 plan

What the code already says that the ticket does not:
- The calculator (SKATGO-157) lives only in `game-table.tsx` (`BidCalc`, shown when the table has a free-play round and the
  `bidCalc` setting is on), its switch in the settings dialog (`frame.tsx`), its setting (`settings.ts`) and four messages.
- Free play's hints were switched off by SKATGO-130 with one flag: `server-table.tsx` passes `hints: mode === 'lesson'`. The
  hint machinery (left-edge lightbulb tab while playing, `info` hint buttons while bidding, at the skat and when declaring,
  the tip message) is all still in `game-table.tsx` for the course and lesson 11.
- `hints` also switched the table's words to the course's long ones (`course = p.hints`, and the long refusal). SKATGO-134
  made real tables say little; the ticket asks for the hints, not the long words.

Route:
1. Remove the calculator: component, styles, props, setting (persisted key dropped; an old stored value is ignored), the
   settings switch, the four messages, the charter's SKATGO-157 text.
2. Free play passes `hints: true`; the table's teaching words stay the course's own and lesson 11's (`course` false when the
   table has a free-play round; the short refusal there).
3. Charter: product.md, engineering.md, ui.md amended for both (the human's request is the authorization).

Redlines looked up: no token registry change (only local styles in `game-table.tsx` removed), no dependency, no generated file,
no route import change, no check weakened.
