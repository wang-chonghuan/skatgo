# SKATGO-26 grill

Mode: human, delegated. The human handed every decision in Batch 1 to the agent (「你来决策，写入grill」, 2026-09-29). Inputs:
- the live ticket;
- `plan.md`, `ac.md` and `reference.md`;
- reference captures (Funbridge lobby, practice list, table in bidding and play, funbridge.com at
  desktop and phone);
- the current skatgo pages.

## Batch 1

### Q1. Which frame does each page wear?

**Recommended:**
- **`/` wears the public-site frame:** a white header (100 tall; 64 on the phone, with a menu button),
  the big hero (72px headline, green call to action), then the four sections as **lobby colour
  tiles**.
- **`/course`, `/lesson/$id` and `/play` wear the app frame:** the left rail, the top bar and the grey
  page.

**Why:** the landing and the app are the two references you named, and skatgo's `/` does both jobs.
It is what search engines and new visitors see, and it is where the sections start. Every skatgo
feature works without an account, so there is no signed-in-only lobby to put anywhere else.

**Decision:** as recommended — the agent, under the human's delegation, 2026-09-29 (「你来决策，写入grill」).

### Q2. What goes in the rail and the top bar?

**Recommended: only what skatgo has.**
- **Rail:** Home, Course, Play, then Duplicate and Puzzles marked "coming soon" (not links), then the
  assistant.
- **Top bar, left:** the page's own title, or "Welcome, <name>" when signed in.
- **Top bar, right:** the green primary action (Play), the language menu as a white pill, and sign-in
  or the avatar.

No friends, messages, shop, balance, gift or notification entries: skatgo has none, and fake entries
would be dead buttons.

**Decision:** as recommended. The rail and the top bar carry only features skatgo has; coming-soon sections are marked and are not links — the agent, under the human's delegation, 2026-09-29 (「你来决策，写入grill」).

### Q3. Typeface

**Recommended:**
- **Outfit** (Google Fonts, open licence) in place of nexa. It is a geometric sans with nexa's round
  proportions, and the heavy weights the titles need (900).
- **Bebas Neue** (open licence), as Funbridge uses it, for Reizen values and "Passe".
- CJK falls back as today.
- Loaded through the existing Google Fonts link, with no npm dependency.

**Decision:** Outfit for nexa, Bebas Neue for Reizen values and Passe, both from the existing Google Fonts link — the agent, under the human's delegation, 2026-09-29 (「你来决策，写入grill」).

### Q4. Artwork behind the tiles and on the cards

**Recommended: original only.**
- Funbridge's tiles carry photos under a colour overlay. skatgo's carry compositions of its own
  public-domain card faces and suit shapes under the same overlay treatment.
- The card back becomes a skatgo design in the new palette, not Funbridge's branded back.
- No stock photography.

"The same in detail" then holds for the treatment: colour, overlay, radius, shadow, type and position.
The picture inside is ours.

**Decision:** original art only. The tiles carry skatgo's own card faces and suit shapes under the measured overlay treatment, and the card back is a new skatgo design. No Funbridge picture is copied or redrawn — the agent, under the human's delegation, 2026-09-29 (「你来决策，写入grill」).

### Q5. The Skat table in Funbridge's language

**Recommended:**
- **Felt:** radial green, filling the space left of a **450-wide side panel** on grey.
- **Gold square frame in the centre:**
  - the trick of three plays inside it;
  - the two skat cards show there during Reizen;
  - seat plates sit on its edges: opponents left and right, you at the bottom in orange;
  - each plate has a small green role tag (V / M / H: Vorhand, Mittelhand, Hinterhand).
- **Hands:** opponents as face-down stacks along the left and right edges; your hand as the big fan
  along the bottom (two rows on a phone, as now).
- **Reizen box in the frame:**
  - the next value as a large tinted tile;
  - a wide green **Passe** in Bebas Neue;
  - "Ja / Weiter" beside it.
- **Contract picker, the bid box's column look:**
  - one tinted column per game: ♣ ♠ ♥ ♦ Grand Null;
  - toggles for Hand, Ouvert and announcements.
- **Side panel:**
  - at the top, tabs (Game / Rules help);
  - the **Reizen history** as three dark columns, one per player, using the auction-grid look;
  - the contract and game value;
  - the tricks and points.
  - Footer buttons: blue **Hint**, red **Leave / New game**.
- **Floating:** undo (only if the engine allows it; otherwise none) and the hint bulb on the left edge.
- **Dialogs** (contract announced, settlement): white on a scrim, with one full-width green button.

**Decision:** as recommended. Undo is offered only if the game engine supports taking a card back; otherwise it is left out rather than faked — the agent, under the human's delegation, 2026-09-29 (「你来决策，写入grill」).

### Q6. Phone layout — the signed-in Funbridge web app could not be measured narrow

**Recommended, derived from the same language:**
- the rail becomes a **bottom tab bar**, using the same items and icons;
- the top bar shrinks to 64, the landing phone header's height;
- tiles go to one column;
- at the table, the side panel becomes a **bottom sheet** that slides up, collapsed to one line
  showing the contract and whose turn it is; the felt keeps the frame and the hand.

The landing page itself has a measured phone layout, and it is followed exactly.

**Decision:** as recommended: a bottom tab bar on the phone, and the table's side panel as a bottom sheet — the agent, under the human's delegation, 2026-09-29 (「你来决策，写入grill」).

### Q7. Course and lessons — restyle only?

**Recommended: yes.** Every block, its order and all course text stay as they are; only the look
changes (`ips-change-ui` "restyle"):
- `/course` gets an orange sub-page band, the "continue" lesson as the featured card, and the lessons
  as option cards;
- lesson steps sit on white cards on grey;
- drills sit on table felt;
- the sticky back / continue bar becomes the table's full-width button style.

**Decision:** restyle only. Blocks, order and course copy are unchanged — the agent, under the human's delegation, 2026-09-29 (「你来决策，写入grill」).

### Q8. One ticket, one review — or a checkpoint first?

**Recommended: one checkpoint.** After the registry, the kit, the frame and `/` are built, I send you
side-by-side captures and wait for a yes before doing the other pages. This is the "prototype first"
step of `ips-change-ui`. A mismatch in the base language caught there costs one commit instead of
five pages.

**Decision:** a non-blocking checkpoint. After the registry, the kit, the frame and `/` are built, the side-by-side captures are sent to the human as a progress report, and work continues on the remaining pages without waiting. The human has delegated design decisions, and the ticket still ends in review before anything merges — the agent, under the human's delegation, 2026-09-29 (「你来决策，写入grill」).
