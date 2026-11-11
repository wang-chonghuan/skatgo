# SKATGO-184 grill

## Your decisions
1. **Approval: token registries (ui.md Redline 1).** The asked change:
   - `color.stylex.ts`: every colour gets a dark value, plus new tokens where a role splits, such as `cardFace`;
   - `elevation.stylex.ts`: shadows for dark;
   - `constants.ts`: `themeColorDark`;
   - `theme.ts`: Astryx no longer pinned to light.

   Light values stay exactly as they are.
   - Your answer: 「批准。但是要先调研一下同类的游戏，比如funbridge等等是如何做夜间模式的，如果他们没做，就忽略。夜间模式不错，但是不要做的丑陋。」
   - Approved, with research first.
   - **Research, 2026-11-11:** each site was opened with the device set to dark.
     - **Funbridge** (funbridge.com and play.funbridge.com): white page, no `prefers-color-scheme` rule. They have no night mode, so ignored as asked.
     - **Lichess:**
       - follows the device by default (`data-theme="system"`);
       - warm near-black page (`#161512`), boxes one step lighter (`hsl(37 7% 14%)`);
       - body text a soft grey (`#bababa`), dim text `#949494`;
       - blue lifted to `#3692e7`, borders `#404040`, no shadows;
       - the board keeps its colours.
     - **Chess.com:**
       - warm dark grey page (`#302e2b`), a darker sidebar, white headings;
       - the green action button unchanged, shadow included;
       - the board keeps its colours.
   - **What it means for SkatGo:**
     - no pure black, but a dark tinted with the brand's own navy;
     - layered: the page darkest, cards a step lighter;
     - body text a soft light grey, titles near-white;
     - the action green unchanged, links lifted;
     - rules instead of shadows;
     - the felt and cards unchanged;
     - follows the device by default.

## Decided for you
2. **Default:** follows the device's light/dark setting, and the user can force Light or Dark in settings. Basis: the request (「夜间太刺眼」). Following the device is what fixes it for most users without them finding a setting, and the ticket's scope says so.
3. **Where the switch is:** the site's existing settings dialog (header gear; the table opens the same settings), as a three-way choice: System, Light, Dark. Basis: one settings place already exists, and a new header icon would crowd the header on phones.
4. **The felt, board, plates and the playing cards keep their colours.** Section tiles keep their hue and may deepen slightly, if they glare on a dark page. Basis: the table is already dark ("dark felt at any hour"), and cards are white like real cards.
5. **Palette:** dark navy-grey page and slightly lighter cards, not pure black. Titles go from navy to a near-white with a blue tint, slate to a mid grey-blue, and the action green and link blue lift for contrast. Shown in the handoff screenshots rather than asked (the grill's rule: colour is shown, not described).
6. **Storage:** a cookie, so the server renders the right mode and nothing flashes. localStorage is not readable on the server. The cookie holds only `system`, `light` or `dark`.
7. **Old browsers:** a browser without `light-dark()` keeps the day look and the settings hide the choice. Basis: the alternative is a page that loses its colours by day.
8. **Night edges and dimmed pictures** (`color.edge`, `color.imageDim`): found in the night screenshots (cards melting into the page, white pictures glaring). Fixed with tokens that are inert by day. Basis: the human's 「不要做的丑陋」.
