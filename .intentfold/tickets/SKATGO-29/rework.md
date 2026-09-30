# SKATGO-29 rework

Reconstructed at close from the 24 commits after the handoff (a6ca51e). Each commit's first line is
the human's ask. `handoff.md` is unchanged.

## Front page hero

- **Duplicate copy, copy first** (「你别管实际有没有，文案先行」). The hero now leads the daily Skat
  tournament:
  - Headline and lead: "Daily Skat tournament" / "Same deals for everyone. Highest score takes the
    board.". The German, "Tägliches Skat-Turnier" / "Dieselben Spiele für alle. Die höchste Punktzahl
    führt die Rangliste an.", is the agent's translation.
  - Buttons: "Play today's deals" → `/daily`, and "Never played Skat? Start here".
  - Small print: new deals at midnight (Berlin time), about 20 minutes, no sign-up.
  - Title and meta: the brief's state A.
  - The eyebrow tag was added and later removed.
  - `lib/daily.ts` holds `DAILY_DEALS` (12), `DAILY_EST_MINUTES` (20) and the Berlin time zone.
- **New daily page** `/en/daily` / `/de/taeglich`, with a Daily / Täglich nav item. It carries the
  brief's title, meta and H1, today's date and a countdown to Berlin midnight. Its button opens free
  play, because the tournament does not exist yet.
- **Type**
  - H1 and lead take Funbridge's measured hero sizes: 72/36px black and 28/24px bold, both at line
    height 1.2 (new roles `landingHero`, `landingHeroLead`).
  - The site font is Red Hat Display instead of Outfit, in the tokens and in the Astryx theme (theme
    rebuilt). This was approved in the ticket (ui Redline 1). It also fixes every h1–h6 and p that had
    fallen back to system fonts through the theme's unloaded Fraunces / DM Sans.
- **Picture**
  - The hero takes two-thirds text, one-third picture, aligned to the top.
  - The picture is the human's free-play screenshot `hero-table.webp` (from `3.png`, 434×602). Its
    box keeps the image's proportions at every width, so it is never cropped.
- **Decorative icons removed**
  - The suits beside the eyebrow, and the tile icons.
  - Icons in every sub-page band title, beside each lesson title, and above a finished lesson's title.
  - The tip lightbulb, the arrows in back links, and the lightbulbs in the table's hint buttons.

## Free play

- **Page layout**
  - The top bar ("Home" plus the title) and the intro block below the table are gone. The table is
    exactly one screen, and the page does not scroll.
  - The H1 stays as a visually hidden heading (new tokens `visuallyHidden*`).
- **Hand spacing:** a hand slot is at most one card plus a small gap (`rowSlotMax`), so the hand stays
  together and centred on wide screens.
- **Info board:** pinned to the felt's top edge, and two rows of two at every width.
- **Side panel**
  - It is a drawer over the felt at every width, closed by default.
  - Its handle is a slim tab (28×48) at the hint tab's height on the right edge.
  - The bidding columns are as wide as their bids.
  - Each column names its seat's position this deal (Forehand / Middlehand / Rearhand).
  - The black phase pill is gone.
- **Chat launcher:** 56 → 44px, in the felt's top-right corner.

## Language

- **Menu:** Funbridge's style, a bordered flag button opening a card of flag plus name, the current
  one ticked (`theme/flags.tsx`, US and German flags).
- **Rule:** a URL or saved choice first. Otherwise the browser's first language, German for German and
  English for any other. German when the browser names none.

## Criteria rechecked in rework

- Each round was checked where it touched, at 1280 and 375:
  - AC2 for the head of the daily page;
  - AC4 phone width on all 32 pages after the font change, and on the front, play and German pages
    after their changes;
  - the `/` redirect probe for the new language rule;
  - `locale.test.ts`, updated to the new rule.
- The share images were regenerated after every change to a title or the hero picture: 32 pages.
- The mechanical defence runs once more at close.

## Net effect against the frozen handoff

- The hero now describes the daily tournament, and `/daily` exists. This reverses grill Q1–Q2's "no
  Duplicate copy", on the human's instruction.
- The play page has no visible title or intro text.
- The site font changed.
- `/` sends a browser that names no language to German.
- The residual in `handoff.md` still stands: the post-deploy check in `operations.md` expects the old
  addresses.
