# SKATGO-66 grill

Batch 1, written before asking. Decision-maker: the human.

## Q1. Budget for the image model

Planned calls:
- 33 images: 12 French courts, 12 German courts, 4 Daus, 4 German suit symbols, 1 back;
- the 6 style samples;
- up to about 30% retries.
That makes about 50–60 calls.

Price: no official Azure per-image price for `gpt-image-2` was found. Third-party sources put a high-quality 1024×1536 image at about $0.17, and one at up to $0.42.

**Recommendation:** approve up to **70 calls and US$30**, generated at high quality. The work stops and asks if either is reached.

**Reason:** the ticket requires an estimate before generating and a question when it is exceeded.

**Answer:** approved: up to 70 calls and US$30, high quality (the human, 2026-10-09).

## Q2. The style of the figures

**Recommendation:** each deck's traditional pattern, drawn fresh as clean flat colour with bold, even outlines, with no texture, shading or text.
- French courts: dressed mainly in their suit's colour (♣ black, ♠ green, ♥ red, ♦ gold), so the suit reads at a glance on a 58 px phone card.
- German courts: the traditional German palette, with their suit symbol held or worn as the pattern has it.

**Reason:** the ticket asks for a consistent style that is recognisable at small sizes. Fine engraving detail turns to mush at 34–58 px.

**Answer:** the recommendation (the human, 2026-10-09).

## Q3. The style sample

**Recommendation:** first generate both decks' Herz courts together (French K / D / B, German König / Ober / Unter: 6 images) and show them to you. After your approval, the rest is generated with the samples as reference images.

**Reason:** the ticket's proposal samples one suit's three courts. Sampling both decks at once settles that the two styles match before 33 images are made.

**Answer:** the recommendation: both decks' Herz courts first (the human, 2026-10-09).

## Q4. The corner letters and numbers

The index must be paths, not text (search engines read SVG text).

**Recommendation:** take the outlines of **Bebas Neue**, the product's numeral font (OFL), once.
- Tools: `fonttools` installed with pip into a throwaway folder outside the repo, and `BebasNeue-Regular.ttf` downloaded from the `google/fonts` GitHub repository (about 60 KB).
- Committed: only the path data and the extraction script.

**Alternative:** hand-drawn single-stroke letters, with no download. They look closer to today's index but less finished.

**Answer:** the recommendation: Bebas Neue outlines; the fonttools install and the font download are approved (the human, 2026-10-09).

## Q5. Approvals the route needs

- **(a) Token registries (ui.md Redline 1):**
  - delete the `fourColours` and `twoColours` themes;
  - delete `fill.cardBack`, `color.cardBack` and `color.cardBackLight`, replaced by the generated back.
  - No new design value is planned. The ♣ ♠ ♥ ♦ colours stay `suit`'s defaults.
- **(b) Dependency (engineering.md Redline 3):** remove `@letele/playing-cards`, which nothing would use any more.
- **(c) Charter:** update `ui.md` (the `PlayingCard` row, the suit schemes, the settings) and `engineering.md` (course libraries, the card images and how they are made) to the new deck.

**Recommendation:** approve all three.

**Answer:** all three approved: (a) registries, (b) dependency removal, (c) charter edits (the human, 2026-10-09; recorded on the ticket).

## Q6. The settings gear until SKATGO-67

**Recommendation:** remove the gear from the header in this ticket; SKATGO-67 brings it back with the French / German choice.

**Reason:** after this ticket the dialog would have nothing to choose. A gear that opens an empty dialog is worse than none.

**Answer:** the recommendation: remove the gear now, SKATGO-67 brings it back (the human, 2026-10-09).

## Q7. The German suit symbols

**Recommendation:** commit them now as transparent images (master PNG and WebP). Whether to trace them into SVG is decided in SKATGO-67, which first uses them.

**Reason:** tracing needs `potrace`, which is not installed. Nothing in this ticket shows the symbols, and the ticket requires the images, not their vector form.

**Answer:** the recommendation: transparent images now, tracing decided in SKATGO-67 (the human, 2026-10-09).

## Q8. The back

**Recommendation:** one back for both decks: a symmetrical traditional ornament in the product's charcoal and white, so it reads as a back at 34 px. No text and no logo, since the image model cannot reproduce the SkatGo mark exactly. It sits inside the card's existing white frame.

**Answer:** the recommendation: charcoal and white symmetrical ornament (the human, 2026-10-09).

## Changed after the style samples

- **Q2, colour** (the human, 2026-10-09, on the samples): 「你重新生成一个版本，你的老prompt改改，别基于垃圾去修改，颜色也不用拘泥于全是大红色」.
  - Every prompt was rewritten from scratch, and all 6 samples were regenerated without reference images.
  - The costumes now use a balanced palette. The suit is shown by its emblem, not by a costume mainly in the suit's colour.
- Earlier on the samples: 「你不觉得留白太多吗」, 「主要是那个U，留白太多，还有D」. Pictures are now trimmed to the figure and fitted head to waist, and the prompts ask the figure to fill the width.
- **Q6 overturned and the corner letters changed** (the human, 2026-10-09, after the first delivery): 「字母为啥换成J了，默认的套应该是德国正规skat比赛的套，可选的套是另一个，就这样。J的那个字母如果不正规，就作为第三个套，还是恢复那个选牌的地方」.
  - The letters no longer follow the language. The default is the German tournament deck's B / D / K / A everywhere.
  - J / Q / K / A becomes an optional deck.
  - The gear is back as the choice of deck. SKATGO-67 adds the German deck.
  - The ticket's scope and AC 4 were updated, with a comment.
