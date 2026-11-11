# SKATGO-184 plan: night mode

## What the code already says (not on the ticket)
- **Astryx can switch, the product cannot.** Astryx's theme (`parrottoon.css`) already carries light and dark values, and `color-scheme` follows `data-theme` on `<html>`. It is pinned with `APP_THEME_MODE = 'light'` (`app/src/theme.ts`).
- **The product draws nothing with Astryx.** It uses its own kit, and every colour is a token from `color.stylex.ts` (`defineVars`, 60 values). About 50 files name them, and none writes a colour (token check). So night mode is a token-layer change, not a page-by-page one.
- **How the tokens are used, measured over `app/src`:**
  - `navy`, `slate`, `text`, `info`: text colours, 104/65/36/31 uses. They must turn light on dark.
  - `surface`: 38 backgrounds, the white cards and panels. They must turn dark.
  - `page`: the grey page.
  - `hairline`: rules.
  - `goodSoft`, `badSoft`, tints: light fills, which need dark equivalents.
- **Tokens that serve two roles:**
  - `surface` is also the face of a playing card and the white `quiet` button. A card stays white at night (the ticket), so a card face needs its own token that does not turn dark.
  - `plate`, a dark pill, is also used as text colour on light pills (5 uses). Each use is checked on its surface.
- **Colours outside `color`:**
  - `elev` shadows are black or tinted rgba, which disappear on a dark page. Dark surfaces get a hairline edge, or lighter elevation, instead.
  - `themeColor` (`constants.ts`) is the phone toolbar's white.
  - The suits' colours (`suit.card*` on the white card face) stay. `suit.text*` black takes the text colour already; green, red and gold are checked for contrast on dark.
- **Settings:** the site's settings (header gear, `frame.tsx` `SettingsDialog`, also opened at the table) are kept in `useSettings` (localStorage). The server cannot read localStorage, so a manual choice that must render right on first paint is kept in a cookie as well.

## Route
1. **Tokens (`color.stylex.ts`):**
   - Each value gets a dark counterpart: `{ default: light, '@media (prefers-color-scheme: dark)': dark }`, so a device in dark mode gets night mode with no setting at all.
   - Two `createTheme` overrides, `lightTheme` and `darkTheme`, carry the full light or dark set for a manual choice. Put on `<html>`, they win over the media query.
   - The dark values are written once and shared.
   - New tokens where a role splits, e.g. `cardFace` (stays white). Felt, board and table tokens keep their values in both modes.
2. **Other registries:**
   - `elevation.stylex.ts`: shadows get dark values.
   - `constants.ts`: `themeColorDark`.
   - `theme.ts`: Astryx mode follows the choice instead of being pinned to light.
3. **Choice and first paint:**
   - A cookie `skatgo_theme` (`system` | `light` | `dark`, absent = system).
   - The root loader reads it on the server. `<html>` gets the matching theme class, `data-theme` and `color-scheme`.
   - `theme-color` metas are written per scheme (media metas for system, a single one for a manual choice).
   - Changing it in settings writes the cookie and swaps the class on `<html>` without a reload.
4. **Settings UI:** an "Appearance" row in the site's settings dialog with three choices, System, Light and Dark, in the dialog's existing option style. EN and DE messages.
5. **Sweep every surface at night:** front page, course, rules, Skat-Tricks, bidding practice, forum, profile, daily, free play, friends' rooms, dialogs, Clerk and settings, on desktop and phone. Fix each place where a token's role reads wrong on dark: a new token or a different existing role, never a raw value.
6. **Charter:** ui.md's "one fixed light palette" and the colour-role table become a light/dark pair. The Astryx note changes too.

## Redlines lookup
- **ui.md Redline 1** (changing any registry under `app/src/theme/`) is on the route: steps 1 and 2. This needs the human's explicit approval before code; asked in the grill.
- **Redlines 2 to 4:** nothing on the route. No utility CSS, no raw values, no felt in the hero.
