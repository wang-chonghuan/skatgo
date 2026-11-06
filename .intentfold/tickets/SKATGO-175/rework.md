# SKATGO-175 rework

## Round 1 — 「Daily Skat: 1 deal or a tournament of 6 改成这个字token如何？下面的margin要改」 (36d9aaf)
- The slogan takes the sub-pages' H1 style, `landingHeading` (as "Daily Skat: 1 deal or a tournament of 6"): 36px on
  PC, 24px on a phone, where it now fits one line. `landingHero` and the `fHero` tokens went, unused.
- The space under the slogan to the cards: 16px (32 / 24 on a phone before), as above it; the picture cards keep
  their 32 / 24 under the colour cards.
- Rechecked: typecheck, build, design tokens; measured at `/en` — desktop 36px, 16 above, 16 below; phone 24px, one
  line, 16 above, 16 below (`tmp/after2-*.jpg`).

## Net effect against the handoff
The slogan is the sub-pages' H1 (36px PC, 24px phone instead of the handoff's 36 / 28), 16px above and below it.
