# SKATGO-23 rework

Six rounds after the frozen handoff, each committed with the human's ask as its first line. The net
effect relative to `handoff.md`:

1. **「卡片不好看，下面的白色太多了……四种扑克花色……大浮雕暗纹」**
   - **Cards**: each entry card is now a felt card, one suit per section in Skat order (♣ Course, ♠ Play,
     ♥ Duplicate, ♦ Puzzles). The suit is pressed large into the lower right (`typography.watermark`,
     `shadow.emboss`), and a corner index sits beside the title. Unopened sections use deep felt.
   - **Removed**: the white body and the small card illustrations.
   - **Tokens**: new tokens approved by the human (「经批准」); the four first-version art tokens are
     removed.
2. **「topbar里的logo改为SkatGo……仿照那个funbridge的文案……定位不是学习了，二是现代的skat」**
   - **Name and meta**: the site name is SkatGo in every language; the meta title and description follow
     the new positioning.
   - **Hero**: rewritten after Funbridge's pattern — an eyebrow, a headline, a lead, one "play now"
     action and three selling points.
   - **Course card**: its button became quiet.
3. **「hero区域禁止再用绿色卡了」**: the hero sits on the page's paper, with the four suits beside the
   eyebrow.
4. **「修一下文案和charter」**
   - **Assistant**: its standing instructions describe SkatGo as modern Skat for ages 6–99.
   - **Language pill**: names the languages in each page's own language. The existing en/de "no Chinese"
     test caught the first version.
   - **Charter**:
     - `engineering.md` and `operations.md` list `/course` and the server-rendered front page.
     - `ui.md` describes the front page and adds Redline 4 (no felt in the hero).
     - `product.md` is not edited, because of its own Redline 2. A proposed text is in `tmp/`, and the
       human has not applied it.
5. **Logo**
   - **Master**: the human's logo is `app/brand/skatgo-logo.png`. Every icon is cut from it by
     `icons.mjs` (in this ticket's directory).
   - **Icons**: `favicon.ico` (16/32/48), `favicon-32.png`, `apple-touch-icon.png` (square),
     `icon-192/512.png` (rounded) and `icon-maskable-512.png`.
   - **Header**: `logo-96.png`, shown at 30px and rounded.
   - **Head and manifest**: a new `site.webmanifest`, plus `og:image` and `twitter:card`. The old
     `favicon.svg` is removed.
6. **「右上角的语言，用下拉菜单折叠起来……中文只有用户明确选择才切换到」**
   - **Menu**: the language switch is one native `<select>`.
   - **Rule**: `src/lib/locale.ts`, used as Paraglide's `custom-skatgo` server strategy. The order is the
     URL's language, then the saved choice (written only by the menu), then German or English from the
     browser, then English. Chinese is never inferred. The rule has three unit tests.

**Rechecked after the last round, on the built server**:
- AC1–AC4: 66/66.
- Hero (brand, `<title>`, hero text, the button to `/play`, all in zh/en/de).
- Icons (each decodes at its declared size; header logo 30×30, radius 8px).
- Language redirects: nine cases; `/zh`, `/de`, `/en` are served directly.
- Language menu, desktop and phone.
- Mechanical defence: 70/70 tests. All 211 token names in ui.md resolve.
