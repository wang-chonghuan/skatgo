# SKATGO-33 plan

- The hero picture was a 434×602 screenshot shown at 353×490: about 1.2 pixels per point, blurry on a 2× or
  3× screen. Funbridge's hero is 1723×1198 shown at 704×490 (2.4×).
- The route changed once. At first the table was to be captured at 3× by a script. The human then chose
  their own illustration (「/Users/yong/Downloads/6.png 你就用这个图，不要剪裁」, 1448×1086).
- Route:
  - `6.png` → `app/public/hero-table.webp`, WebP quality 88.
  - `dims.heroArtRatio` → `1448 / 1086`, so the box keeps the picture's proportions and never crops it.
  - The alt text describes the illustration.
  - The 32 share images are regenerated. The script now fits the picture by width, so a landscape
    picture no longer runs off the edge.
- Redlines: a token value changed on the human's instruction (the picture's own proportions); no dependency.
