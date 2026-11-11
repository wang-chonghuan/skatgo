# SKATGO-184 handoff: night mode

## What the human gets
- **The whole site has a night mode.** It covers the public pages, course, rules, Skat-Tricks, bidding practice, forum, profile, daily, free play, friends' rooms, dialogs, sign-in and settings.
- **By default it follows the device.** In Settings, the first section, "Appearance", offers "Like this device", "Light" and "Dark". The choice applies at once, survives reloads and holds on every page.
- **The night look,** after measuring Lichess and Chess.com (Funbridge has no night mode):
  - a navy-tinted dark page, never pure black;
  - cards and panels a step lighter, with a fine edge;
  - soft grey body text and near-white titles;
  - links and the AI blue lifted;
  - the white-ground pictures on the front page dimmed.
- **The same day and night:** the action green, the section tiles, the felt and its board, and the playing cards.
- **By day nothing changed:** on four static pages, every element's colours equal production's (the AC script compares them live).

## How it works
- **Palette (`app/src/theme/color.stylex.ts`):** a colour that differs at night is its day value plus `light-dark(day, night)` behind `@supports`. Which one shows is the page's `color-scheme`, which the Astryx theme sets from `data-theme` on `<html>`. With no choice there is no `data-theme`, so the device decides.
- **Choice (`app/src/lib/appearance.ts`):** stored in the `skatgo_theme` cookie. The root loader reads it on the server, so `<html>` arrives with the right `data-theme` and nothing flashes white.
- **Settings (`frame.tsx`):** writes the cookie and updates `<html>` and the phone toolbar colour (`theme-color` metas, one per scheme when following the device) without a reload.
- **The layout's old pin** `colorScheme: 'light'` (`skat-layout.tsx`) is now unset, and light only for print.
- **New tokens:**
  - `slateStrong`: `slateDeep` as text, which lightens at night;
  - `cardFace`, `cardLine`, `tapLine`: the card face, the court frame and the tap hand, the same day and night;
  - `edge`: a card's night hairline, first in `elev.option`, `optionFeatured`, `eventCard` and `panel`, transparent by day;
  - `imageDim`: front-page pictures are multiplied with it, white by day;
  - `themeColorDark`;
  - `nightProbe`.
- **Charter:** `ui.md` describes the day/night pair, the new tokens and the settings row.
- **Privacy:** the privacy text names the appearance cookie (EN and DE), and its date moved to 2026-11-11. That date also covers SKATGO-182's guest-cookie sentence, which had not moved it.

## Acceptance
Production build on 55184/56184. Script: the main checkout's `.intentfold/tmp/SKATGO-184/ac.mjs`. 31/31 PASS.
- **AC1, follows the device.** On a dark device the front page, course, profile and free play's side panel are dark. On a light device they keep today's colours.
- **AC2, manual choice.**
  - Dark on a light device, and Light on a dark device: each changes at once, is marked chosen, holds after a reload and on another page, and sets the toolbar colour.
  - "Like this device" follows the device again, after a reload too.
- **AC3, no white flash.** With JavaScript off:
  - the dark cookie makes the server HTML carry `data-theme="dark"`, and the page is dark;
  - a dark device with no cookie gets a dark page from the stylesheet alone.
- **AC4, readable everywhere.** `sweep.mjs` screenshots 14 pages and the settings dialog at night, on desktop and phone, and scans each visible text against its background:
  - no text below 3:1;
  - no light block left except playing cards;
  - sign-in (Clerk), a wrong answer in the bidding practice, and the German front page and table were screenshotted too.
- **AC5, the table unchanged.** The felt's gradient and the cards' white are identical day and night.
- **AC6, layout unchanged.** The front page's first 400 boxes are identical day and night.
- **By day equals production:** /en/rules, /en/course, /en/skat-tricks and /en/about compared element by element (1650 elements).

## Mechanical defence
- Passed once: typecheck, build, 346 app tests, client bundle, design tokens, the literal grep, server link, check:seo --built and test:seo.
- **Test corrected:** `legal.test.ts` pinned the privacy date. It now pins 2026-11-11, the date of this change.

## Decided for you
- **Default:** follow the device. Choosing is in Settings, not a new header icon.
- **Browsers without `light-dark()`** (Safari before 17.5) keep the day look and are not offered the choice, rather than losing colours.
- **Front-page cards at night** get a hairline edge, because a shadow does not lift a card off a dark page.
- **White-ground pictures** are dimmed by multiplying with a soft grey; by day the multiply is with white, so nothing changes.
- **The navy "Bidding" tile** is lifted at night (`#1A4383`), so it does not sink into the navy-tinted page. The other tiles are unchanged.
- **Contract chips at the table** (light tints with dark text) keep their day colours: they read as coloured chips on the dark panel.

## Screenshots (English, night)
In the main checkout's `.intentfold/tmp/SKATGO-184/`:
- `dark-desktop-home.png`, `dark-phone-home.png`;
- `dark-desktop-play.png`, `dark-phone-play.png`;
- `dark-desktop-settings.png`, `dark-desktop-lesson.png`, `dark-desktop-bidding-answered.png`, `dark-desktop-clerk.png`;
- day versions: `light-*.png`.
