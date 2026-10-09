# SKATGO-66 plan

## What the code already does that the ticket does not say

- **One component draws every card**: `PlayingCard` (`components/skat/playing-card.tsx`), used by the table (`game-table.tsx`), the course's rows and fans (`card-row.tsx`, `exercises.tsx`) and the front page (`entry-page.tsx`). Its faces are the public-domain SVG deck `@letele/playing-cards`, rewritten at render time so pips and corner indices take `currentColor` (SKATGO-27, SKATGO-47). Sizes run from `cardXs` 34 px (the skat in the info panel) to `cardLg` 96 px, phone hand `cardMdPhone` 58 px; aspect `5 / 7`.
- **The corner index is drawn as paths, not text.** SVG text is page text: the deck's one text node (on the Ace of Spades) was read into the front page by a search engine (SKATGO-29). The new faces keep the index out of the page's text.
- **Suit colours** are the `suit` vars in `theme/suits.stylex.ts`. Its default, "Deutsches Skatblatt" (♣ black, ♠ green, ♥ red, ♦ gold `#D97706`), is exactly the ticket's four-colour tournament colouring. The other two schemes are `fourColours` and `twoColours` themes, chosen in the header's settings dialog (`frame.tsx`, store `lib/skat/settings.ts` `cardColours`). That dialog holds nothing but this choice.
- **The back** is CSS: `color.cardBack` with the `fill.cardBack` lattice inside a white frame.
- **The image endpoint**: `gpt-image-2` (version 2026-04-21, capacity 12) on `FinleySwedenCentralInstance`, the same Azure OpenAI resource as the assistant's `gpt-5.6-luna`. It is reached through n-azure's `generate_image.py`; the key comes from the local credential file and never enters the repo or the command line. Transparent backgrounds are supported.
- **Local tools**: `cwebp` is installed (PNG → WebP with alpha). There is no PIL, `potrace` or `fonttools`.

## Route

### A. Generate the images (human checkpoints in bold)

1. Prompts in `app/brand/cards/prompts.json`: one per image, all sharing a style block. Each is the traditional pattern drawn fresh, never a copy of a current commercial deck.
   - Court tops (half figures for double-headed courts), 1536×1024: French K / D / B × 4; German König / Ober / Unter × 4.
   - German Daus × 4, 1024×1536.
   - German suit symbols × 4, 1024×1024.
   - One back, 1024×1536.
   All on a transparent background, with no text, letters or numbers in the picture.
2. **Style sample** (grill Q3): both decks' Herz courts (6 images). Shown to the human; batch only after their approval.
3. The batch, with the approved samples passed as reference images for a consistent style. Each image is looked at; a broken one gets one targeted retry.
4. Masters (PNG) and each call's metadata (prompt, size, quality, date, deployment, SHA-256; no credential) go to `app/brand/cards/`, with `PROVENANCE.md`: tool, model, dates, prompts, and that no commercial deck was copied or traced. A script `app/scripts/make-card-images.mjs` cuts the masters into the served WebP files under `app/public/cards/{french,german}/` and `app/public/cards/back.webp` (via `cwebp`), the way the icons are cut from the brand logo.
5. **Overview**: a script renders both whole decks (the composed faces, French and German, every card plus the back) into one picture, shown to the human. Their confirmation is recorded as a ticket comment before anything goes into the product.

### B. Put the French deck into the product

6. `PlayingCard` draws its own face as one SVG (viewBox 500×700), with no library:
   - corner index top-left and, turned, bottom-right: the rank as paths (grill Q4), the suit pip under it;
   - 7–10: the pips in the traditional layouts; the ace: one large pip;
   - courts: a thin frame, the court's top image and the same image turned 180° (double-headed), and a pip beside the index;
   - pips are SVG paths for ♣ ♠ ♥ ♦, drawn in code, in `currentColor` from `suit.card*`.
   - The rank letter follows the page language: `de` B / D / K / A, `en` J / Q / K / A (the locale comes from the URL, so server and browser agree).
   - The face keeps `data-card`, the sizes and every state (`selected`, `dimmed`, `glow`, `verdict`, `faceDown`). It adds `data-deck="french"` and `data-index` (the letter shown) for scripted checks.
7. The back: the generated `back.webp` inside the card's white frame.
8. Court images load as `<image href="/cards/french/…webp">` only where a court is shown. The German files ship in the repo, but nothing requests them until SKATGO-67.
9. Settings: the colour-scheme choice goes (grill Q6).
10. Clean-up, each subject to the approvals asked in grill Q5:
    - `fourColours` / `twoColours`, and `fill.cardBack` / `color.cardBack` / `color.cardBackLight` once the image back replaces them;
    - the dependency `@letele/playing-cards`;
    - the `scheme_*` messages and `cardColours` in the settings store;
    - charter `ui.md` / `engineering.md` updated.

## Files

- `app/brand/cards/` (new): masters, prompts, PROVENANCE.md
- `app/public/cards/` (new): served WebP
- `app/scripts/make-card-images.mjs` (new)
- `app/src/components/skat/playing-card.tsx` (rewritten), `card-glyphs.ts` (new: index and pip paths)
- `app/src/components/skat/frame.tsx`, `app/src/lib/skat/settings.ts`, `app/src/theme/suits.stylex.ts`, `elevation.stylex.ts`, `color.stylex.ts`
- `app/package.json` / lock (dependency removed)
- `app/messages/{de,en}.json`
- `.intentfold/charter/ui.md`, `engineering.md`
