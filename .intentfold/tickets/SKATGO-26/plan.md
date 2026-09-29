# SKATGO-26 plan

## What the code and the reference say that the ticket does not

- **What gets copied.** "Identical in detail" can only mean the **style values**:
  - layout, spacing, type scale, colours, radii, shadows, component shapes.
  - Those are measured in `reference.md` and rebuilt here in skatgo's own code.

  Funbridge's photos, illustrations, logo, icons, card backs and copy are its artwork, and none of
  them are copied or redrawn. Where it puts a photo under a colour overlay, skatgo puts original art:
  its own public-domain card faces and suit shapes.
- **The reference is bridge; skatgo is Skat.** The lobby's four cards map neatly onto skatgo's four
  sections. The table does not map one-to-one. Bridge has four seats, a bidding box by strain, and
  claim. Skat has three players, the skat, Reizen by value, and a contract picker (Grand / Null / suit,
  Hand, Ouvert). Grill Q5.
- **Two frames.**
  - The public site (funbridge.com): a white header and a big marketing hero.
  - The app (play.funbridge.com): a left rail, a top bar, a grey page.

  skatgo today has one frame, a felt header over a paper column. Grill Q1.
- **Features skatgo does not have.** The app frame carries friends, messages, a shop, a balance, gifts
  and notifications, and skatgo has none of these. A rail with dead entries would be fake. Grill Q2.
- **nexa is a commercial typeface.** It needs a free substitute. Bebas Neue is free. Grill Q3.
- **Phone layout of the signed-in app is unmeasured** (`reference.md`, "Not measured"). Grill Q6.
- **What already makes the later redesign cheap.** skatgo's styling is StyleX with every value in
  `app/src/theme/`, enforced by `check-design-tokens.mjs` and the literal grep. This ticket replaces
  the values and the component shapes, and keeps that mechanism. "Make it our own" later is then a
  registry edit.
- **The pages and their blocks** (restyle; blocks, order and copy unchanged unless a question below
  says otherwise):

| skatgo page | Blocks today | Reference |
|---|---|---|
| frame (`skat-layout.tsx`) | brand; language menu; sign-in or avatar; reading column; assistant launcher | app frame: rail + top bar; landing header on `/` (Q1) |
| `/` (`entry-page.tsx`) | eyebrow pill + suits; title; lead; primary action; selling-point pills; four section cards (two open, two coming soon) | landing hero + lobby tiles |
| `/course` (`course-home.tsx`) | hero with title, progress box, resume / free-play actions; lesson cards (done / next / open) | sub-page band + featured card + option-card grid |
| `/lesson/$id` (`lesson-player.tsx`, `exercises.tsx`, `card-row.tsx`) | progress bar; step title; rich text; card rows; drills on felt with options / feedback; sticky back/continue bar; finish screen | sub-page band; white cards on grey; drills on table felt; lobby buttons |
| `/play` (`free-play.tsx`, `game-table.tsx`) | seats; trick; pills strip; own hand; action area (bidding, contract, play, settlement) | game table: felt, gold frame, seat plates, side panel, bid box, dialogs |
| assistant (`ask.tsx`, `ask-thread.tsx`) | launcher; window header; thread; input | side panel / dialog language |
| Clerk (`clerk-appearance.ts`) | sign-in window, account menu | dialog language |

## Route

1. **Registry**, in the files under `app/src/theme/`:
   - `skat.stylex.ts`: the new palette. Page grey, white, navy, slate and hairline. The tile colours:
     green, orange, indigo and teal. Action green, blue and red. The table felt pair, gold and the
     seat-plate dark. Suit tints.
   - `scale.stylex.ts`: radii 12 / 18 / 19.6 / 32; the rail, top bar, tile, side panel and frame
     sizes; spacing.
   - `effects.stylex.ts`: the own-colour shadows, the felt radial gradient, the scrim.
   - `type.stylex.ts` / `type.ts`: families (Q3); roles rebuilt from the measured scale, 900 20.46
     uppercase section titles, and so on.
   - `constants.ts`: the theme colour.
   - The Google Fonts link in `__root.tsx`.
2. **Kit** (`ui.tsx`), rebuilt to the new shapes:
   - `Btn`: pill, landing-rounded, the table's full-width buttons;
   - `Panel` as a white card, `Pill`, `ProgressBar`, `Stars`, `Rich`;
   - new pieces: rail item, top bar, colour tile, sub-page band, option card, dialog shell, seat
     plate.
3. **Frame** (`skat-layout.tsx`): per Q1, Q2 and Q6.
4. **Pages**, in order: `/`, then `/course`, then the lesson, then `/play` (the table, Q5), then the
   assistant and Clerk.

   For each page, block parity is checked with `ips-change-ui` `page_blocks.mjs` against `main`, and
   overflow with `overflow_probe.mjs`.
5. **Capture and compare script**, in the ticket's `tmp/`:
   - screenshots of skatgo and of the reference at 1280×820 and 375×812;
   - a computed-style probe that prints skatgo's values for the elements listed in `reference.md`.

   If this proves generally useful, it goes into `ips-change-ui` as a capture capability; the ticket
   authorises that change.
6. **Checks kept**: the mechanical defence in full, including the token check and the literal grep.

## Out of scope

- New features behind rail entries.
- A dark mode.
- Editing `charter/ui.md`: it will be stale after this ticket, and the human decides. The agent can
  draft it on request.
