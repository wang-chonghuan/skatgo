# SKATGO-233 handoff

## What changed

- `app/src/lib/forum-handler.ts`: the avatars are drawn with exactly the options of E on SKATGO-231's comparison
  sheet (`MATURE`: hair colours, beards 45%, glasses 40%, calm mouths, eyes and brows); the skin-tone limit is gone.
- `app/src/lib/forum.ts`: `AVATAR_STYLE` `a3` → `a4`, so browsers fetch the new pictures; `forum.test.ts` follows.
- Charter: product.md, ui.md, engineering.md describe the new look. Uploaded pictures are untouched.

## AC results

1. PASS — all 12 of the sheet's E files (7 titles, 5 names) are byte-identical to what the build now serves.
2. PASS — a grid of 28 avatars from the production build (`tmp/avatars-e.png`): no crying, tongues or sick.
3. Checked after deploy (see the ticket's closing comment).

Mechanical defence passed. Web only; no env change.
