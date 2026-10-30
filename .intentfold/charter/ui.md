# UI Requirements

Binding on every UI change. **UI work follows this file strictly** — the agent does not invent
alternatives to what is written here. Section shape is fixed by `.intentfold/readme.md`.

> Seeded 2026-09-21 by intentfold cap1 from the repository, and accepted by the human as written.
> The design system below was extracted from the running code on 2026-09-27 (SKATGO-18) as the
> binding reference for large-scale development (「当前的风格就可以」), and turned into tokens the same
> day (SKATGO-19, 「把一切都token化」): every design value now lives in a registry under
> `app/src/theme/`, and product code names it. The lobby design (SKATGO-26) replaced that look; this
> file was brought up to date with the code on 2026-10-05 (SKATGO-47, the human: 「都在这个工单里一起
> 改掉」).

## Contract

**Styling stack — Astryx + StyleX**

Every style is a StyleX rule in the file that owns the element, compiled at build time through
Astryx's build integration. Astryx supplies the reset, the theme's prose defaults and the CSS layer
order underneath. There is no utility-CSS framework and no hand-written component CSS.

**Where components live**

`app/src/components/skat/`. The product has **its own small kit** in `ui.tsx` and renders on native
elements styled with StyleX; it uses no Astryx components, whose colours follow the app theme's
light/dark mode while this palette is fixed. A new widget reuses the kit first.

One third-party component draws its own markup and styles, approved by the human: **Clerk**'s sign-in window and
account menu (SKATGO-12); deep-chat went with the assistant (SKATGO-130).
What the product controls is what it hands it — tokens only, in `lib/clerk-appearance.ts` — and the
shell around it, which is the kit. Clerk's windows stay in English; the human
chose not to add its translation package. Icons are **lucide-react** outline icons at the sizes in
`icon` (`constants.ts`): the header's menu and settings controls, the table's side panel and
edge tabs, an exercise's controls, the comparison's open/close chevrons, and the
download button. Suits are the text glyphs ♣ ♠ ♥ ♦, never icons.

**Token registries — the only place a design value is written**

Product code outside `app/src/theme/` names tokens and never writes a colour, size, weight, duration or
breakpoint of its own; `check-design-tokens.mjs` (Tools) fails the build otherwise. The registries:

| File | Exports | Owns |
|---|---|---|
| `color.stylex.ts` | `color` | the palette (`defineVars`) |
| `suits.stylex.ts` | `suit` | the suits' colours: the French deck's four-colour tournament colouring (SKATGO-27, SKATGO-66) |
| `breakpoints.stylex.ts` | `bp` | media-query keys (`defineConsts` — a media query cannot read a variable) |
| `scale.stylex.ts` | `space`, `border`, `opacity`, `layer` | spacing, border widths, opacity, stacking |
| `shape.stylex.ts` | `radii`, `dims` | corner radii; component dimensions and geometry |
| `elevation.stylex.ts` | `elev`, `fill`, `pose`, `veil` | shadows, fills (the felt, filters), transforms of the card art and the table, a tile's veil |
| `effects.stylex.ts` | `move`, `timing`, `layerHint` | where a thing rests, is pressed or rises; CSS transition timing; the compositing hint for things that move (SKATGO-41) |
| `table.stylex.ts` | `stageUnit`, `stage` | the card table's stage, measured in one unit that follows the felt's room (SKATGO-34), including the trick's steps (SKATGO-68) and Lina's and Noah's faces (`face`, `faceTop`, `faceInset`, SKATGO-147) |
| `type.stylex.ts` | `family`, `fontSize`, `weight`, `leading` | typography primitives — used only by `type.ts` |
| `type.ts` | `typography` | the typography roles product code picks from |
| `constants.ts` | `phoneQuery`, `pinnedQuery`, `themeColor`, `icon`, `stepSlide`, `deal`, `cardIndex`, `playIn`, `trick`, `finish`, `shake`, `drawer`, `confettiBurst` | values for code that cannot read a CSS variable: `matchMedia`, the `theme-color` meta, lucide sizes, SVG attributes, `motion` and `canvas-confetti` |
| `flags.tsx`, `icons.tsx` | `FlagEN` (the United States and the United Kingdom halved on the diagonal, SKATGO-104), `FlagDE`; the Astryx icon registry | the language switch's flags; the icons the Astryx theme is built with |
| `parrottoonTheme.ts` | the Astryx theme, compiled to `parrottoon.{css,js,d.ts}` | the reset and prose defaults underneath (the name is historical) |

The registry holds the value and a comment saying what it is for; this file holds the rules for
choosing. Read the registry for any value.

**The look: the lobby design** (SKATGO-26, after Funbridge; measured in
`.intentfold/tickets/SKATGO-26/reference.md`)

A light grey page with white surfaces, navy titles and slate secondary text; one action green; the
sections as colour tiles; and the card table as a dark green felt at any hour. The palette is one
fixed light palette, not a light/dark pair.

| Surface | What it is | Built from | Text on it |
|---|---|---|---|
| **Page** | every sub-page's background; the front page's is white | `color.page` (front page `color.surface`) | `color.text`, titles `color.navy`, secondary `color.slate` |
| **Header** | the public site's white bar over every page but the tables | `color.surface`, `elev.landingHeader` | `color.navy`, links `color.slate` |
| **Option card** | a white card on the page: a lesson, the course's progress, the tournament's board and results, a panel | `color.surface`, `radii.option`, `elev.option` (the featured one `elev.optionFeatured`) | `color.navy` / `color.slate` |
| **Colour tile** | a section on the front page: ♣ the course (`tileOrange`), ♠ free play (`tileGreen`), the bidding practice (`tileNavy`, SKATGO-149), a private table (`tileRed`) | its `color.tile*`, `radii.tile`, its own `elev.tile*`, its card art under `veil.tile` | `color.onColor` |
| **Felt** | where cards lie: the table, a drill's hand | `fill.felt` (`feltInner` → `feltOuter`, with a fine grain) | `color.onColor`; highlights `color.gold` / `color.amber` |
| **Board and plates** | the table's info board, the seat plates, dark pills | `color.board` with `color.boardLine`; `color.plate` | `color.onColor`, quieter `color.onColorSoft`; the player's own numbers — their score, their side's card points — in `color.amber` (SKATGO-79) |
| **Footer** | the legal links under every header page (SKATGO-46), the Skat-Tricks and the forum (SKATGO-118), then About SkatGo and the rules (SKATGO-134) | `color.surface` with a `hairline` rule | links in `color.info` |

**Colour roles** (`color`)

| Tokens | Role |
|---|---|
| `page`, `surface`, `hairline` | the page, white surfaces, rules and borders |
| `text`, `navy`, `slate`, `slateDeep`, `onColor` | body text, titles and links, secondary text, a darker slate (the slate button), text on colour or felt |
| `go` | the one call to action, and the current state — the public site's landing buttons too (SKATGO-97, the human: 「改成我们按钮的标准绿色」); `goLanding` and `elev.btnGoLanding`, its former own green, are no longer used |
| `info` | links in text, the hint button, the focus ring, and the "AI" tag wherever the AI is named — a score sheet, a deal's bidding and trick, the leaderboard (SKATGO-79, SKATGO-80, the human: 「AI标志都用app里那个蓝色的Ai标志」) |
| `stop` | leaving the table |
| `tileGreen`, `tileOrange`, `tileNavy`, `tileRed` | the front page's section tiles: ♠ free play, ♣ the course, the bidding practice, a private table |
| `feltInner`, `feltOuter`, `gold`, `amber`, `plate`, `hintTab`, `board`, `boardLine`, `onColorSoft`, `roleTag`, `auctionHead`, `tabActive` | the card table |
| `good` / `goodSoft`, `bad` / `badSoft` | right and wrong: an answer's border / fill and its verdict; a refusal or an error (`bad` text, `badSoft` behind a failed message); a deal's result card against the AI, `goodSoft` won and `badSoft` lost (SKATGO-145). `goodSoft` is also the fill of what is chosen or one's own: a switch or pill that is on, the chosen deck, the player's own row on the leaderboard, a finished lesson |
| `tintClubs` … `tintNull` | one tint per contract, from the reference's bid boxes |
| `scrim` | the dim behind a dialog |

The browser's toolbar colour on phones is `themeColor` (`constants.ts`), the header's white.

**Suit colours** (`suits.stylex.ts`, SKATGO-27, SKATGO-66)

One colouring, the four-colour tournament colouring of the French-suited deck: ♣ black, ♠ green, ♥ red,
♦ gold. There is no choice of colours (SKATGO-66). `suit.card*` colours a card face's pips and corner
index; `suit.text*` colours a suit glyph in running text, where a black suit takes the text's own
colour so it stays legible on white and on felt.

**Typography** (`type.stylex.ts`, `type.ts`)

Product code picks a **role** from `typography` and never sets `fontFamily`, `fontSize`, `fontWeight`
or `lineHeight` itself. A role fixes family, size (and its phone size), weight and, where the design
sets one, leading. Colour is not part of a role — the surface decides it.

- **Families**: one geometric sans, **Red Hat Display** (`family.body`), for everything; **Bebas Neue**
  (`family.numeral`) only for Reizen values, "Passe" and the table's numbers. It has a single weight.
- **Weights** (SKATGO-47; one step heavier since SKATGO-148, the human: 「整个的字体，都太细了，大部分都太细了……加粗」):
  two by purpose — `weight.text` (600) for reading text: paragraphs, explanations, leads, table rows; `weight.ui`
  (700) for controls, navigation, links, labels and meta: buttons, pills, the table's names and small lines. Titles,
  emphasis and the large numbers keep `bold` (800) to `black` (900); `extrabold` is 900 too. `regular` (400) is only Bebas Neue's. **Every role that sets text
  states its weight** (glyph roles and `control` inherit theirs): the Astryx theme sets `<p>` and
  `<small>` to 400 itself, so a weight a role leaves out is 400, not the frame's. The frame's default is
  `weight.text`.
- **Sizes** are named by their px (`f12` … `f72`, with the reference's measured sizes such as `f19_6`);
  **leadings** `glyph`, `tight`, `control`, `compact`, `reading`, `ui`.
- **Roles**, by where they are used:
  - the public site: `landingHero`, `landingHeroLead`, `landingBrand`, `landingHeading` (the h1 of
    every sub-page, and the front page's section headings), `landingBody`, `landingNav`, `landingBtn`,
    `landingCta`;
  - the app's pages: `appText`, `appBtn`, `appBtnStrong`, `appLink`, `optionTitle`, `optionDesc`,
    `tileTitle`, `tileSub`, `dialogTitle`;
  - the course and its exercises: `prompt`, `body`, `bodySmall`, `note`, `context`, `loading`,
    `emphasis` (**bold** in course text), `link`, `small`, `meta`, `smallBold`, `label`, `micro`,
    `badge`, `toggle`, `option`, `control`, `stars`, `verdictMark`;
  - the card table: `tabLabel` (the side panel's tabs), `plateName`, `roleTag`, `tricksLabel`,
    `auctionHead`, `panelLabel`, `bidChip`, `contractTile`, `infoLabel`, `infoValue`, `infoNumber`,
    `infoSub`;
  - `frame`: the family and default weight everything inside inherits.

  A new combination is a new role in `type.ts`, never an inline style.

**Shape** (`radii`, `border`)

`radii.pill` for the app's buttons and pills, `landingBtn` for the public site's buttons, `tile` for
colour tiles, `option` for option cards, `dialog` for dialogs, `panel` for the table's side panel, its
tabs and block buttons, `column` for an auction column, `tag` for a seat's role tag, `card` / `cardSm` /
`cardXs` for playing cards, `round` for round things. Borders: `border.hair` for panels and inputs,
`border.tile` for interactive tiles, `border.frame` for a card back's frame; the focus ring is
`border.focus` offset `border.focusOffset` (`focusSm` on small header controls).

**Spacing and dimensions** (`space`, `dims`)

Spacing steps are named by their px (`space.x2` … `x80`, with the reference's `x15`, `x27`, `x32`,
`x48`, `x72`). Component dimensions — the header, the reading column (`dims.readingColumn`) and the
wider page column (`dims.pageColumn`), controls, card sizes and slots, the table's panel and drawer,
grid templates, the printable score sheet's handwriting row (`dims.scoreRow`, 6 mm) — are named in
`dims`; the table's stage in `stage` (`table.stylex.ts`).

**Elevation and motion** (`elev`, `fill`, `pose`, `move`, `timing`, `layer`, `layerHint`)

- Every coloured surface casts a shadow in its own colour (`elev.tile*`, `elev.btn*`); white cards
  `elev.option` / `optionFeatured`; floating panels `elev.panel`; playing cards `elev.card`, a raised
  one `elev.cardRaised`, a glowing (hinted or winning) one `elev.cardGlow`, a judged one
  `elev.verdictGood` / `verdictBad`.
- A tile rises `pose.lift` on hover; a clickable card `move.cardHover`, a selected one `move.cardRaised`;
  a pressed button `move.press`.
- **Things that move over the felt** (SKATGO-41): a flying card carries `layerHint.moving` while it
  moves, so the browser moves a finished bitmap instead of repainting the felt under it; a card at rest
  in the trick sits on `move.ownLayer`, drawn at its final size and sharp. The felt's own backdrop is a
  separate element at `layer.backdrop` inside an isolated felt, so nothing that moves repaints it.
- **Transitions** (`timing`): `press`, `tile`, `card`, `progress`, eased `easeOut`; under
  `bp.reducedMotion` every transition is `timing.instant`, and animations follow motion's
  `MotionConfig reducedMotion="user"` (SKATGO-29).
- **Animations** (`constants.ts`, for `motion`): a lesson step slides by `stepSlide`; cards are dealt by
  `deal`; a drill's played card rises by `playIn`; a played card flies onto the table by `trick`; the
  side panel's drawer rises by `drawer`; the finish emoji springs in by `finish`; a wrong answer shakes
  by `shake`.
- **Celebration** (`confettiBurst`): on finishing a lesson and on winning a game — nowhere else.
- Stacking: `layer.launcher` for the header and the table's round buttons, `layer.window` for menus and dialogs.

**Components — the kit (`ui.tsx`)**

| Component | Variants | Use it for |
|---|---|---|
| `Btn` | tone `go` (the one main action), `quiet` (white: secondary), `info` (hints), `stop` (leaving the table), `slate`; shape `pill` (the app's buttons), `block` (the table's full-width buttons), `landing` (the public site's, heavier type); size `sm` / `md` / `lg`; `grow`; `disabled` | every action |
| `linkLook(tone, size, shape)` | the same tones, sizes and shapes as `Btn`, for a router `<Link>` | navigation that looks like a button: an action is a `Btn`, navigation is a link |
| `Panel` / `Tip` | tone `card` (white), `tip` (white with an amber border), `good`, `bad`; `pad` | tips, feedback on an answer, a refusal, a settlement |
| `Pill` | tone `quiet`, `go`, `good`, `dark`, `amber` | short facts, never actions |
| `ProgressBar` | `value`, `label` | progress through a lesson |
| `Stars` | `n` of 3 | a lesson's result |
| `Rich` | — | every piece of course text: renders `**bold**` and each suit glyph in its suit's colour |
| `Toggle` / `toggleLook(pressed)` | pressed or not; a button, or the same pill on a router `<Link>` | a choice that is on or off: a forum post's section, the forum's section filter (SKATGO-118) |
| `Modal` | `title`, `onClose` | every dialog over the page (SKATGO-140; the settings' since SKATGO-66): its title and an X in its head, a tap on the dim around it or Escape closing it too, the page behind locked and inert, focus moved into it and back. Its body scrolls, never the box: the scroll bar stands 8px in from the dialog's edge, clear of its rounded corner, the content 24px in — so too the table's own dialog in `game-table.tsx` (SKATGO-156, the human: 「所有的弹窗，都要让滚动条在弹窗内部，而不是贴道外部」; SKATGO-157: 「滚动条右侧多了一个空白条，不能接受」) |
| `TextField` / `TextArea` | one line (Enter submits) / several: `size` `post` starts about six lines tall, `comment` about three (`dims.textPost`, `textComment`; SKATGO-119), both growing with the text | a name, a forum post's title and text, a comment, a reason |

**Components — the course's and the table's widgets**

| Widget | File | What it is |
|---|---|---|
| `PlayingCard` | `playing-card.tsx` | one card, by default of the Turnierblatt (the German Skat association's tournament deck: French suits in German colours, SKATGO-66), drawn as one SVG: the corner index top left and turned bottom right — the rank as Bebas Neue outlines (`card-glyphs.ts`, never text, which a search engine would read), in every language official Skat's B / D / K / A, or J / Q / K / A when the learner chose that deck in the settings, over the suit's pip; the pips of 7–10 in their traditional places; the ace's one large pip; a court's double-headed figure in a frame notched for the index. Pips and index take the suit's colour. The settings also offer the Deutsches Blatt: the same layout with the German suit symbols (pictures) as pips, its own courts (Unter, Ober, König) and Daus pictures, and K / O / U / A. The court figures, Daus and German symbols are skatgo's own pictures (`app/brand/cards`, served from `/cards`). Sizes `xs`, `sm`, `md`, `lg`, `table`, `trick`, `fill`; states `selected`, `dimmed` (`fill.dimmed`), `glow`, `verdict` good/bad, `faceDown`: the back chosen in the settings, "Kartenrücken" (SKATGO-102), in the card's white frame — by default the charcoal and white ornament (SKATGO-66), or one of four in its style, less dense, with the SkatGo logo small in the middle in the back's own colour |
| `Fan` / `CardRowView` | `card-row.tsx` | a hand held as a fan (two rows of a long hand on a phone; `data-answer` / `data-order` for scripted checks), and a labelled row of cards for reading |
| `Shake` / `Feedback` | `exercises.tsx` | the wordless "no" after a wrong answer, and the good/bad panel that explains it |
| `TitleWithDownload` / `PdfLink` | `print-links.tsx` | every download (SKATGO-53): the page's h1 with, beside it, the page's one `go` button — lucide's `Download` icon at `icon.inline` and "PDF herunterladen" / "Download PDF" — which moves under the title on a phone and is left off paper |
| `PrintLinks` | `print-links.tsx` | the "Zum Ausdrucken" links to the score sheet and the short rules, on the rules page, the bidding table and the course; left off paper |
| `ScoreSheet` | `daily-comparison.tsx` | a score sheet (SKATGO-79): the three seats' Seeger-Fabian scores of a tournament so far, the player's line, tagged "Du" in `navy`, over the AI's, tagged "AI" in `info`; no other number beside them (SKATGO-81). The AI's line is left out for days dealt before it played them. Under `VsAiTable`'s rows only; a single deal has none since SKATGO-145 |
| `VsAiTable` | `daily-comparison.tsx` | the daily tournament's comparison with the computer (SKATGO-48, SKATGO-79): one row per finished deal — the deal's number, the player's and the AI's Seeger-Fabian score each with its role under the heading "Punkte", signed, never `good` / `bad` (SKATGO-81) — that opens to the deal's `VsAiReview` (a row without a review to open does not fold); under the rows, the tournament's `ScoreSheet`. Rows collapse instead of scrolling sideways; the newest opens after a deal and on `/daily` mid-day. On `/daily` while the day runs (`DayDeals`, "Die Spiele von heute", also rendered on the server; SKATGO-63) every deal of the tournament has a row: the ones not finished follow by number, "läuft" for the one being played and "offen" for the rest, with nothing of their cards; the total appears once a deal is finished. Free play's round result, "Deine Runde", is the same table over its six deals (SKATGO-88), each row opening to the review kept with the round (SKATGO-145) |
| `VsAiReview` / `GameTag` / `SeatScores` | `daily-comparison.tsx` | a finished deal against the AI (SKATGO-145), after a daily deal, a free game and lesson 11's game, and on a `VsAiTable` row; no button, nothing folded. "Bidding": the player's line over the AI's in three shared columns — the `Who` tag(s), what was said (`appBtnStrong`) over how the deal went with the card points (`appText`, `slate`), the score (`appBtnStrong`) — each row's tag(s) and score on the baseline of its first line (SKATGO-148, 「you 和AI的两个结果的行都没对齐」), one line with both tags side by side when the two read the same. Under a fine `hairline` rule, "Biggest difference from the AI" (no judgement in the name, the human: 「为啥说ai打得更好呢」): "Trick n: the AI would play X", then, each label at the left of its cards (on the line of "You led" when the player led, SKATGO-148), the cards already on the table and the player's hand before the trick as `xs` cards 8px apart, their card ringed `navy` with a "You" tag under it and the AI's ringed `info` with an "AI" tag, then who took the trick and its points. A deal where every card was the AI's choice: one line; a passed-in deal: no trick. `GameTag` is the game in its contract's tint (`tint*`, as the table's contract tiles) and "Declarer: name", under the result card's title. Words `appText`, headings and numbers `appBtnStrong` (SKATGO-146). Last, under the trick, a folded card (SKATGO-153): a `hairline` box, `radii.panel`, "Every trick vs. the AI" (`appBtnStrong`, navy) and a chevron as the line to tap; opened, SKATGO-79's play record as it was — a table of the ten tricks, each card under its player's name, the player's bold, the AI's card with its tag under the player's where it differs, the trick of the biggest difference on `badSoft`, who took each with its points, a tapped trick's hand under it, the skat under the table |
| `ForumBody` | `forum-body.tsx` | a forum post's or comment's text (SKATGO-118): paragraphs, `##` headings, lists, `**bold**` and suits through `Rich`, links in `info` (a player's `ugc nofollow`), and a line `[♠A ♠10 ♥K]` as a `CardRowView`; in SkatGo's posts a line `![what it shows](name.svg)` as the site's picture in the page's language, the column's width on white with a `hairline` border and `radii.panel` (SKATGO-129), in a player's post that line stays text; built as elements, never as HTML |
| `AnnouncementLine` | `forum-announcement.tsx` | the forum's newest announcement of the last two weeks as one line — a `good` "Neu" `Pill` and its title as an underlined `info` link — on the front page and `/daily` (SKATGO-118); nothing when there is none |
| `GameTable` | `game-table.tsx` | the whole-game table: the felt and its stage, the info board, the seat plates, the trick, the learner's hand, the edge tabs, and the side panel — pinned beside the felt at `bp.pinned`, a drawer otherwise (SKATGO-34). The trick's cards, the skat and Lina's and Noah's cards are as big as the hand's — theirs sideways at the felt's edges, half of each on the felt (54u of 134u on a phone, clear of the seat plate; SKATGO-148, the human: 「ai的牌的尺寸应该和玩家的牌的尺寸，桌面的牌的尺寸一样，只不过ai的牌只显示半截而已」); the trick's overlap, each toward who played it and one step higher than the card to its left (`stage.trickFirst`, `trickSecond`, `trickThird`), the three centred in the frame's height, the later on top, so every card's top-left number and suit stay in the open whatever was played last (SKATGO-68). An open hand at the side — an Ouvert declarer's, or the cards laid open when a deal is decided early — is spread at `stage.stackStepOpen`, wider than a closed one, so every card reads (SKATGO-79). As an exercise's table (`exercise`, SKATGO-110/111) every hand is open, the side hands at the learner's card size, and the exercise supplies the board at the top and the dialog at the end; there is no side panel, hint tab or settlement |

Recurring patterns — reuse them rather than inventing a neighbour:

- **Option card** — a white `radii.option` card with `elev.option`, `optionTitle` over `optionDesc`;
  a lesson card's states: `next` (a `go` border), `done` (`goodSoft`), open.
- **Choice tile** — a white tile with a `border.tile` in `hairline` that turns `go` on hover; chosen,
  right and wrong as the `go`, `good` and `bad` tokens say. Answer options, contracts and the settings'
  decks are this.

**Frames and pages**

- **The frame** (`skat-layout.tsx`, `components/skat/frame.tsx`): every page but the tables — an open-card
  endgame's page among them (SKATGO-111) — wears the
  public site's header (SKATGO-43; lessons too since SKATGO-47). The header has:
  - the SkatGo mark (`dims.landingMark`) and name (`landingBrand`), "SkatGo" without ".com" (SKATGO-105), under
    `bp.narrowPhone` the mark alone so sign-in fits;
  - no section links (SKATGO-144, the human: 「topbar上的那些菜单都删了吧，不需要了」): the front page's cards are the way in;
  - on the right, the language switch — both flags side by side, bare, one tap switching; the language in
    use in full colour ringed in `color.go`, the other in its own colours faded (`opacity.flagOff`, never
    grey; SKATGO-104) — the settings gear (for an account first its nickname — a text field and beside it "Speichern" as tall and as rounded
    (`block`, `md`), a refusal in
    `bad` when the name may not be used or another player holds it (SKATGO-126) — then the
    choice of deck: the Turnierblatt by default, the Deutsches Blatt, or the Turnierblatt with English
    letters J / Q / K / A — SKATGO-66), and sign-in
    or the account. The account's menu (Clerk's, under its picture) starts with the account's record of play,
    "Dein Skat-Profil", with lucide's `ChartLine` (SKATGO-128, the human: 「应该是点profile头像就能看到入口」); the
    settings carry the same link in `info` under the nickname.

  A phone's header is the same, with no menu: the flags, the gear and sign-in or the avatar beside the mark. Under the
  page sits the legal footer. The header is the same on every page.
- **The front page** (`entry-page.tsx`), on white (SKATGO-135, after the human's two pictures: 「topbar下，先显示slogan，然后
  显示下面的四个卡片，按我发你的两个响应式版本……长卡片做两个，一个是my progress……一个是 elo ranking」):
  - the slogan alone as the H1 (`landingHero`, navy, at the column's left; `entry_title`: "Free Skat play and progress",
    German "Skat kostenlos spielen und besser werden", SKATGO-132 — never reworded otherwise; 48px, `fHero`) — no lead
    (「这个副标题删了」), no buttons, no picture (SKATGO-120), never felt (Redline 4); the illustration stays only in the link
    previews (`og.mjs`);
  - then the ways in (`dims.homeWays`): on the left four colour cards two by two, each one link, `dims.homeCard` in shape — the shape, never the title, sets the height
    (SKATGO-151, 「和左边的learn卡片，上下没对齐」) —
    a white icon at the top (`icon.tile`) and its title at the bottom (`homeTileTitle`, bold, 36px, 28px on a phone — the
    human: 「卡片上的字，应该用这种尺寸和粗的字」, then 「四个卡片上的字还是太小」; the other cards' titles `homeCardTitle`, bold, 28px), its card art cropped at the
    corner under its colour, rising on hover — "1 Spiel heute" (`tileGreen`, `CalendarDays`, to `/daily`; the same words
    once played, 「这个按钮文字不变」), "Freies Spiel" (`tileRed`, lucide's `Swords`, crossed — the human: 「不要用机器人」, then 「用两个交错的剑吧，x形的」 — to
    `/play`), "Lernen" (`tileOrange`,
    `GraduationCap`, the course) and "Reizen" (`tileNavy`, lucide's `Gavel`, an auction's hammer, to `/bidding-practice`; one line since SKATGO-151, the page
    keeping "Reizen üben"; SKATGO-149, the
    human: 「practice卡片的位置，做成一个叫牌练习的东西」 — the exercises' "Üben" with its `Puzzle` stood there before); on the right two long white cards, each
    a row tall: "Mein Fortschritt" (`homeCardTitle` with lucide's `ChartLine` in `info`), for an account a link to the record of play
    showing its days as on `/profile`, without dates or scale, as one smooth line — a monotone cubic through the days'
    points, never above or below two days between them — 5px (`progressCurve`, SKATGO-136: 「我希望平缓的，粗一点的」, SKATGO-137: 「再粗一点」,
    SKATGO-138: 「线稍微细一点」), in `info` blue (SKATGO-139, the human: 「不如原来的蓝色好看，你马上给我改回来」; SKATGO-138 had
    made it navy) and with no AI tag (SKATGO-138, 「不要AI标签因为看起来都是蓝色的，用户觉得好像是ai的表现」), a single day as its dot; framed lightly, no larger: the first
    and the last day under it (`meta`, slate) (「最好上面带一些日期……不要扩大，一两个即可」); for a guest "Melde dich an und verfolge, wie du besser wirst – mit der
    Analyse der KI." (「最好能提现出进步，提高的意思，但是还是要简洁」) and the large `go` "Anmelden" in the middle of the card (「progress如果用户没登录，就要显示登录后
    保存你的表现记录以及ai分析，中间放个登录按钮」); and the tournament's Elo
    board (`elo-board.tsx`) — its title with a circled question mark (`info`) opening how it is counted in a `Modal`, three
    short lines (SKATGO-140, the human: 「点问号显示算法，文字啰嗦，而且点开后那个toast不好关」); the ten highest players — rank, name, number, a slate "?" when provisional — with
    the AI's row (its blue tag, no rank) among them by its number, close rows at `appText`, one column, the list
    scrolling inside the card, which is never taller than the cards beside it — it takes the row's height and never
    sets it (SKATGO-144, the human: 「高度不能超过它相邻卡片的高度，所以可以滚动，要一致」); wherever the page is one column
    (`bp.cards`, phones and narrow screens alike; 「只要变成列式布局，就用现在那种横向滚动的」) folded behind one line where the
    players run slowly sideways (`marqueeSlide`, `timing.marquee`), a tap opening it (SKATGO-123), the opened list five
    rows and a half tall (`dims.eloListNarrow`), the rest scrolling (「elo也在窄屏上也不能全高」). Under `bp.cards` the four stay two by two
    (`dims.homeWaysNarrow`) and the long cards follow, the whole width;
  - under them, in the same columns, white picture cards (the human: 「私人牌桌和论坛，用卡片的形式，继续放到下面」, after a
    picture of event cards): the picture to the card's edges at the top (`dims.homePicture`), then the title
    (`optionTitle`, navy) and one line (`optionDesc`, slate) — "Privater Tisch" with the illustration the hero once had
    (`hero-table.webp`, SKATGO-33) to `/with-friends`, and "Forum" with the human's picture of friends at a card table
    (`forum-card.webp`, cropped to the card's shape, no icon; 「论坛的卡片图片用这个图片，剪裁成合适的，不要加图标」) and "News,
    articles, discussion and feedback." to `/forum`, then "Üben" with cover B of three drawn for it (`practice-card.webp`, a grandfather
    and a girl over cards, a puzzle piece above, in the forum picture's flat style; SKATGO-149, the human: 「把practice放到forum下面」, 「选B」) and "Endspiel-Rätsel und
    Aufgaben für alle, die die Regeln schon kennen." to `/skat-tricks` — on PC in the wide third column at `dims.half`, so as wide as a
    colour card, under `bp.cards` the next free place. The rules are the footer's; the questions people ask are on About SkatGo (SKATGO-134).
    The page's new tokens — `dims.homeWays`, `homeWaysNarrow`, `homeCard`, the long cards' placement, `homeCurve`,
    `homePicture`, `icon.tile`, `progressCurve` (SKATGO-136) and the roles `homeCardTitle` and `homeTileTitle` — came with the human's pictures, which were the approval (Redline 1).
- **A sub-page** (the course, a lesson, Skat in 5 Minuten, the rules, the bidding table, the score sheet,
  the short rules, the daily tournament, the Skat-Tricks' page and their article, the bidding practice, a private table's page, About SkatGo,
  the legal pages; an open-card endgame is a table, below), on the grey page: its title is the column's first element, an
  `<h1>` in `landingHeading`, `color.navy`; then its content — white option cards where it offers
  choices (the course's lessons, the tournament's board), reading text and tables elsewhere. The daily
  tournament's page has no lead under its title (SKATGO-132, the human: 「你显示着一坨垃圾干什么啊」), then the forum's
  announcement line when there is one (SKATGO-118), then a
  pair of the app's standard buttons (`linkLook`, `md`; the chosen one `go`, the other `quiet` — SKATGO-156, the human:
  「1 deal today和 tournament 6 deals按钮的字太小，应该用app里的标准按钮风格」), "1 Spiel heute" | "Turnier · 6 Spiele"
  (SKATGO-131; SKATGO-77's 6 | 12 once stood there): the deal of the day by default, the tournament with `?t=6`. The deal of the day's side: before it is played
  its one `go` button to its table (`/daily/play?size=1`, where after the last card the result stands a moment and the
  page comes back here); once played, a white card that says it is done and what sharing is for — "Du hast das Spiel von heute
  gespielt" (`dialogTitle`) over "Deine Freunde bekommen dieselben Karten – schau, wie viele Punkte sie holen." — and no
  scores, no place: the card below carries them (SKATGO-132, 「我不懂你显示这些垃圾干什么……你完成了same one deal today,
  分享给朋友，看看他们能打几分」, 「1 played today · you're #1 这个不要显示」) — "Mit Freunden teilen" as the one `go`
  with lucide's `Share2` (the phone's share sheet with the line and the link, the clipboard elsewhere; no card or
  contract in it), under it `quiet` small buttons, each with its icon (「全部都要图标」) — the platforms' own marks in their brand
  colours (`brand-icon.tsx`, Simple Icons, CC0) and names, WhatsApp, Facebook, Telegram, X, then lucide's `Link` and
  "Link kopieren" (SKATGO-132; no Instagram, no picture download), then the card itself as it goes out (the link's
  preview, at most 600px, a `hairline` border: 「最好让用户看到待显示的卡片，再可以点发送……下面是待分享的卡片」), the time
  until the next deal; then its board as the tournament's, the
  AI's row on it (a guest who has not played sees it too, under the `go` "Jetzt spielen · 2 Min."); then, folded, how
  the AI played the deal (`VsAiTable`); then a link to free play — and nothing more on either side: the page's
  explanations and its link row went to About SkatGo (SKATGO-134).
  The tournament's side (six deals; SKATGO-77's twelve gone, SKATGO-119): its one
  `go` button, its deals, its result and its board. The board names its day beside its title — "Heute",
  "Gestern", or the weekday and date — and steps through the last seven days with two round arrow
  buttons at the right, earlier on the left, the one at the end of the range spent (SKATGO-80). The
  board has no name line and no renaming (SKATGO-126, the human: 「禁止改名了」): the nickname is set in the settings;
  there is no form to join the board.
  A guest finds, in the way in's place, a `go` "Anmelden und mitspielen" opening Clerk's sign-in, the lead above
  saying it is played with a free account (SKATGO-123); a guest who reaches the table is sent back to the page.
  A printable has its download beside the title (`TitleWithDownload`). Skat in 5 Minuten
  (`quick-start-page.tsx`, SKATGO-89) is one reading column: its H1 and one-line lead, a small picture of
  the table in a real game in the page's language — no wider than the front page's picture (`dims.heroArt`),
  with a caption naming what is where (the human: 「不要占空间太大，主要是让读者产生直觉」) — the twelve rules
  numbered, each a line of text, the ones that name points or an order with that row of cards under them
  (`CardRowView`, the points as captions), then a `tip` panel with the `go` button to free play, and links
  to the course and the rules. Its ways in: a `quiet` button under the rules' lead, "Neu beim Skat? Der
  5-Minuten-Crashkurs" (SKATGO-120, the human: 「5分钟的按钮，放到规则页面的一个按钮中」), and on the course page under its
  one-sentence lead — no facts pills, no "no rulebook" line (SKATGO-127) — a large `quiet` landing button, "5-Minuten-Schnellstart, dann spielen" (SKATGO-127, the human:
  「学习页面里，要有明显的按钮，5分钟快速入门开始打牌」) — not the front page. The Skat-Tricks' page (`tricks-page.tsx`,
  SKATGO-103) is its H1 — no lead under it (SKATGO-134) — then every kind of exercise as an option card, numbered, each a `<details>`
  closed at first (one named in the address, as `#offenes-endspiel` names the first, opens by
  itself and stops under the header): first the open-card endgames (SKATGO-119, the human: 「这个要可折叠，像其他题
  一样，它作为第一类练习题」), their count solved in the head, opening to levels (SKATGO-111) — a grid of numbered
  square tiles, solved `good` with a check, gone wrong `bad` with a cross and the number of wrong answers in its
  corner, the next one ringed `go`, and for a guest a lock from the third, and under it one `go` button to the
  next ("Aufgabe n spielen"); then the other kinds of SKATGO-103, each opening to its exercises (hidden by
  SKATGO-110, shown again by SKATGO-119); under the cards, small `info` links to the article and the rules. The bidding practice
  (`bidding-practice-page.tsx`, SKATGO-149) is a Skat-Tricks exercise's page without the way back: the H1 with the place
  in the run beside it, "1/600" in the same type in slate (SKATGO-150, 「上面那个单列进度的行不要」), and beside that the
  header's round white button with lucide's `LayoutGrid` (SKATGO-156) opening "All questions" in the cheat sheet's `Modal`:
  every question as the Skat-Tricks levels' tiles, the one shown ringed `go`, a mistake not yet put right on `badSoft` in
  `bad`, the ones not reached yet slate and shut — the questions run in order from the first, any before can be opened
  again (「最好不要让用户能选择后面的题，要从1题开始按顺序做，但是能回到之前的题」); then the white card —
  "You sit in middlehand" in the question's type (`prompt`, navy; SKATGO-150: 「不要小字，要和how high do you bid同一字体」) with
  the cheat sheet's link at the line's right, on the same line on a phone too, no icon (`appLink`, `info`, "Bidding cheat
  sheet" / "Reiz-Spickzettel", on a phone "Cheat sheet" / "Spickzettel" so the line holds; SKATGO-151, SKATGO-156: 「bidding cheat sheet前面的图标去掉，要和you sit in forehand在同一行」), the ten cards as big as the hand at the table, in one row (`Fan`, `lg`, `row`; SKATGO-109 「最好和手牌一样大」)
  over a `hairline` rule; then the two steps of SKATGO-151, each a `Choice` that marks right and wrong at once: "What do you
  play?" with ♣ ♠ ♥ ♦ Grand Null two by two, on a phone too, and "Pass" last, alone on its row; and, unless the AI passes, over a `hairline`
  rule "The AI plays Diamonds ♦. How high can you bid?" with three numbers (four for a Null), two by two. Once both are answered, the
  verdict `Panel` as an exercise's — "Right!" with its check / "Not quite." with no red cross (SKATGO-151, 「不要红叉那个图标」), then a
  paragraph per step: the contract (trumps per suit and the
  cheat sheet's rule), the bid ("**Up to 18:** Without 1 (♣B not in your hand), plus 1 for game = 2, × 9 = **18**."), and when
  wrong, the contract chosen and the number chosen, a paragraph each — and "Next question" as the one `go`. The cheat sheet is the site's `Modal`:
  its seven sections one under another, each heading `appBtnStrong` navy over `appText`, the point count a plain table of
  `hairline` rows. A guest's third question is the ladder's gate in the card's place (SKATGO-112: no lock), its line the
  reason to sign in and nothing more, "Save your mistakes and get better." (SKATGO-150). Once anything is answered, a second
  white card under it: "Your stats" (chess.com's and Funbridge's word; 「your biding这个词不好」; `prompt`, navy) with
  "n answered" (`appText`, slate) at the right, then three rows, one per outcome of the two steps (SKATGO-154, the human: 「问题是item太多了，名字莫名其妙，百分比倒没啥」) —
  "Right", "Wrong contract" (step 1), "Wrong bid" (step 2) — each over a `hairline` rule, the name and its share
  (`appBtnStrong`) at the two ends, the three adding up to 100% (the folded "Mistakes" of SKATGO-150 is gone: the mistakes are
  red in "All questions", SKATGO-156). No bar, no colour of its own (SKATGO-150: 「不要花哨，不要垃圾重复文字」).
  Under it, as under the Skat-Tricks, small `info` links to the bidding table and the rules, and under them one small slate
  line saying what the page is, for its search entry — at the foot, never a lead under the title (SKATGO-135, 「这个副标题删了」). An open-card
  endgame's page (`tricks-exercise-page.tsx`, `open-endgame.tsx`) is the game's full-screen table (SKATGO-111,
  the human: 「打牌界面那种效果，各种尺寸屏幕都刚好全屏」): no site header, every hand open, the opponents' cards
  as big as the learner's (`stage.openStack*`); at the top, in the info board's place and make, a board with
  the puzzle's place ("Aufgabe 1 von 20"), the H1 ("Karo · du bist Alleinspieler") and the learner's side's
  points against its goal as a `ProgressBar`; the settings in the felt's top left corner and the way out at
  the top right, both white round buttons; no side panel, hint or words line. Once the game is
  decided, a white dialog over the table: "Gelöst!" with the key card, or "Nicht gelöst" with the mistake and
  the card that would have won; "Nächste Aufgabe" (`go`), "Warum?" (the reason, only when asked) and "Noch
  mal" (`quiet`). For a guest from the third puzzle the table waits under the sign-in dialog, an invitation
  with no lock (SKATGO-112). An
  article of the Skat-Tricks is a post in the forum's Articles and reads as any post: its headings, short
  paragraphs and links, each trick a numbered sub-heading, the ways into the daily tournament and to the
  exercises as links; nothing outside the forum links it (SKATGO-120, the human: 「就放论坛里」). The course lists the exercises as
  an option card under the lessons. The header and the footer link the Skat-Tricks' page, and the table's rules panel links it in a new tab, so a game is never left
  behind. A lesson starts playing at once: under its title only a
  one-line kicker and the lesson's promise, then the lesson, which keeps its "back / continue" bar
  sticky at the bottom of the screen. Its short explanation for readers and search engines follows the
  lesson, visible, under "Kurz erklärt" / "In short" (SKATGO-52); then its ways on: the next lesson,
  its section of the rules, and all lessons.
- **A private table's page** (`friends-page.tsx`, `/with-friends`, SKATGO-61): its H1, one line (`landingBody`), and the
  way to open a table — for a guest only the `go` sign-in button, for an account its name and the button; how a table
  goes and its rules are on About SkatGo (SKATGO-134).
- **About SkatGo** (`about-page.tsx`, `/about`, SKATGO-134, the human: 「所有seo的都专门做seo页面」): one reading column —
  the H1, then three sections under `optionTitle` headings: the questions people ask (`lib/faq.ts`, also the page's
  FAQPage), each question bold over its answer; "Tägliches Skat", how the deal of the day and the six deals are played,
  scored and ranked; "Private Tische", how a table is opened and played. Each section ends in plain `info` links to
  where it is played or learnt.
- **The record of play** (`profile-page.tsx`, SKATGO-128) is a sub-page on the grey page in the reading column,
  noindex: its H1, "Dein Skat-Profil", and one-line lead; for a guest a `go` "Anmelden und Profil ansehen" opening
  Clerk's sign-in; with no deal yet a white card saying so, with `go` to the tournament and `quiet` to free play.
  Otherwise a line of how many deals on how many days, and under it the last day against the days before ("Zuletzt
  −22 pro Spiel gegen die KI, davor −31: ↑ besser als zuvor", → or ↓, in navy, never `good` / `bad`); then a white
  card, "Dein Niveau gegen die KI, Tag für Tag": the curve in SVG at the card's width (`profileChart` in
  `constants.ts`), one `info` dot per day, the same size on every screen, on an `info` line — the day's average per
  deal against the AI, judged against the whole table (`lib/skat/profile.ts`) — the zero line in `slate`, the highest
  and lowest value beside it and each day's date under its dot in `meta`, every second, third … when more days than
  fit, fewer on a phone (the human: 「一天一个点，为啥你的图上没显示几个点呢」), and a `meta` note on how to read it; then "Woche für Woche": a white card per
  week with an analysis, newest first — "Woche vom 19. Okt.", its deals and average per deal, then the analysis as a
  forum text (`ForumBody`: its points as a list, each led in bold, and the bold "Fazit"), in the page's language; then a white card, "Pro Tag", a row per day, newest first: the date, the deals, and the day's average per deal against the AI, signed. The same
  line of the last day against before stands under a finished tournament's heading, with the link to the profile.
- **A shared result** (`shared-page.tsx`, SKATGO-132), `/d/<code>`: the H1 "Kannst du das schlagen?", a line of its
  day, a white card with the table's three scores — the shared one ("Zu schlagen") marked `goodSoft`, the declarer's
  name followed by an `amber` pill ("Alleinspieler") — and the one `go`, "Dieses Spiel spielen · 2 Min.", with a line that it is practice and a link to today's; its practice
  table is a full-screen table, and at its end a white card with the player's score and the shared one.
  The card picture (`multiplayer/src/card.ts`) is the same on white: the logo with "SkatGo.com" (「logo文字后面加上.com」), "1 deal today · 2 min" as the site's green button with the day beside it (「1 deal today 这个字应该强调……否则看到的人不知道能要打几副」), the score large, the three
  scores with the declarer's yellow badge, "Same cards – what will you score?" (German "Gleiche Karten – wie viele Punkte holst du?", the human: 「不要说can you beat me，应该说试试你能得几分」).
- **The forum** (`forum-page.tsx`, SKATGO-118) is two sub-pages on the grey page in the reading column. The
  list: its H1, with no lead under it, and beside it the one `go` button — "Anmelden" for a guest, "Neuer Beitrag"
  for a player, which opens the composer in a white card (the human: 「sign in放在 Forum 的旁边，放个按钮就行」) — the sections the author may use as
  `Toggle`s, the title (`TextField`), the text (`TextArea`) with a line on its marks, "Veröffentlichen" (`go`) and
  "Abbrechen" (`quiet`); for the official, while there are any, the open reports in a `tip` panel, each with its reasons, a link to
  it, a reason field, "Ausblenden" and "Ignorieren" (`quiet`); the section filter as `toggleLook` links, "Alle"
  first; then the posts as white
  option cards — the title (`optionDesc`, navy, a link) and the start of its text (`bodySmall`, SKATGO-119), both in
  the reader's language (SKATGO-124), and one
  line of small facts (`meta`): the section in slate, the author in navy or "SkatGo" in `go` (`smallBold`), the
  date and the count of comments; at the foot of the list, in small slate print, a line on what the forum is for
  (the human chose 「摘要+底部小字」, SKATGO-119; nothing under the title). A post: "← Alle Beiträge" and its
  section as links, then the post in a white card of its own, as each comment is (the human: 「每一个帖子或回复，都放在
  卡片里」): the H1, the same line of facts, a hidden post's reason in a `bad` panel for its author and
  the official, the text (`ForumBody`) — the post and each comment in the reader's language when written in another,
  with one small slate line, "Automatisch übersetzt", and a very small underlined `info` button, "Original
  anzeigen" / "Übersetzung anzeigen" (`micro`; SKATGO-124, the human: 「有个非常小的链接式的小按钮」): a post's under its
  line of facts, where it is seen before a long text, a comment's under its text — the viewer's `quiet` small actions — "Melden", "Löschen" for their own
  (asked once more, "Ja, löschen" `stop`), and for the official "Ausblenden" / "Wieder anzeigen" and a player's
  post that is not hidden "Für Suchmaschinen freigeben" — then "Kommentare": each a white card with its line of facts, text and
  actions, in the order written, with no way to reply to one, and the comment box under them (a `TextArea`, the
  "@Name" hint, "Kommentieren" `go`), or for a guest the invitation with the `go` sign-in. Dates are the day in
  UTC, the same on the server and in the browser.
- **The tables** (`/play`, `/daily/play`, a private table, and an open-card endgame's page since SKATGO-111):
  the felt fills the screen and never scrolls;
  nothing to read sits below it, and none is a search entry page (noindex) — the human, SKATGO-69, for a
  standard web-app table. Free play's search entry is the front page.
- **What a table says** (SKATGO-134; the line is hidden while it has nothing to say, SKATGO-143): the course's tables — its own and lesson 11's, the ones with hints — explain every
  step as before. A real table (free play, the daily ones, a private table, a shared deal's practice) says at most one
  short line, the buttons the rest. In the bidding it says whom the player bids with and what an answer means, as the
  course does (SKATGO-141, the human: 「叫牌时的文案删除太多，你给我恢复点」): on the speaker's turn "Du reizt Lina – sag den
  nächsten Wert oder spring höher."; asked to hold, "Lina fragt dich: „18?“" with "Ja (ich halte 18)" / "Passe"; no line
  before the skat is picked up, while putting two away or while playing; forehand alone, "Beide haben gepasst – spielst du 18?"; the
  contract picker only "Kein Spiel erreicht 18 – das Spiel ist verloren." or that the chosen game cannot be announced; a
  wrong card, "Bedienen: spiel Kreuz♣."; a private table's settlement, under its title, the facts in one line
  ("Kreuz · gereizt bis 18 · Alleinspieler 74 : Gegenspieler 46") and the calculation in one, then the skat and the
  standings.
- **At the table**, the speaker in the auction may jump (SKATGO-87): "Höher …" (`quiet`) opens, under it,
  one row of every higher number on the ladder in pills (`toggle`), scrolling sideways so the hand stays
  in sight on a phone; a number is picked first and named with the main button. While a move of the
  player's is on its way to the server, the table shows no move buttons, so none hangs there dead
  (SKATGO-100). Free play's table shows
  its round in the strip as the tournament does, "Spiel n von 6 · gesamt X"; after the sixth deal the
  round's result takes the felt's place: a white panel with its `VsAiTable`, "Neue Runde" (`go`) and
  "Tisch verlassen" (`quiet`) (SKATGO-88). Lina's and Noah's table talk (SKATGO-142) is a white speech bubble (`radii.panel`,
  `elev.option`, `appText` in `navy`, the speaker's name in `appBtnStrong`) beside the speaker's face on every screen,
  level with its top and 8px from it (`stage.talkBeside`, at most `stage.talkMax`; with the faces off, where the face
  would be) (SKATGO-157, 「泡泡要始终从头像的同水平线的位置发出去，挨着头像」). As in a comic its tail points out of its side
  at the speaker's face (SKATGO-148, 「像漫画一样，用哪种有箭头的泡泡，指向说话人」). One thing at a
  time (「按顺序来显示这些信息」): it waits while the table asks for a tap — a claim laid open, a trick to collect — or shows
  a hint or a refusal. It comes once the table has shown the moves it is about and stays
  until the next tap anywhere, which still does what it does (the human: 「最好让用户点一下屏幕再给让这个泡泡消失」); in its
  corner the blinking hand of a trick's tap (`dims.talkHand`, half of `tapHand`). A line later than seven seconds after
  its question is dropped. The daily tournament's tables, its six deals and the deal of the day, show it the
  same way (「锦标赛也加进去，1deal和6deal都加」). The settings carry the switch, "Tischgespräche" — "Lina und Noah reden am
  Tisch", on by default, as the sounds' switch.
- **Lina's and Noah's faces** (SKATGO-147, the human: 「给noah和lina的牌的上方，加两个头像，一男，一女……有点搞笑的的风格」):
  on every table where they sit — not a private table, not an exercise's open-card board — a cartoon face above each
  one's stack at the felt's edge (`stage.face`, `faceTop`, `faceInset`) — on a wide table higher, in the felt's corner
  beside the info board and under the way out, clear of a hand laid open; on a phone a hand laid open long enough lies
  over the face, never under it (SKATGO-148, 「头像位置往上面移动一点，这样就不当着亮的牌了」) — from `app/public/faces/`, each on a square with rounded corners (`radii.panel`) as large as the picture
  (SKATGO-148), dark and see-through, the info board's `color.board` (SKATGO-155, 「白框不要了，太显眼了」,
  「暗色透明的阴影方块」): Lina a friendly woman in
  red with a light-blue scarf and brown-blond hair (SKATGO-148, 「目前的攻击性太强……衣服红色，围巾浅蓝色，头发棕黄色，皮肤白一点」),
  Noah a man in blue (「暗红和蓝……不是海军蓝」, so neither melts into the felt), in the flat sticker style
  the human chose from five. Three faces each — neutral, laughing, sulking: the bidding's winner laughs until the
  first card; a finished trick makes the side that took it laugh and the other side sulk, by
  side as Skat scores, the other way round in a Null (「null是反过来的」) (`faceOf`); at the deal's end the side that won laughs and the other sulks, the declarer against the two
  defenders (「最后谁赢了也要笑，和不高兴」); a laugh or a sulk lasts 1.5 seconds
  at most, then the face is neutral again (SKATGO-148, 「最多持续2秒……就要自动复原」). The stage keeps their room above it (131u, 113u in portrait; faces 92u and 69u: 「头像太小了，需要增大」, then 「头像有点大，应该小点」 and 「手机上65吧」): where the free height
  already holds it nothing moves; on a screen short of height the table is a little smaller rather than a face over
  the cards. The settings carry the switch,
  "Avatare" — "Avatare von Lina und Noah am Tisch", on by default (「配置里要加上一个配置……默认是开的」), under the table
  talk's; off, the table keeps the faces' room.
- **Free play's bid calculator** (SKATGO-157): under the bid's buttons in the drawer, a slate "Game value" / "Spielwert"
  and the contracts as the jump bid's toggles (♦ ♥ ♠ ♣ Grand Null), wrapping on a phone; a picked one (`toggleOn`)
  shows one centred line, "without 4 · 5 × 24 = **120** · Hand 144", and stays picked through the deal's bidding. Its
  switch in the settings, on by default, follows the faces'.
- **The way out of a table** (SKATGO-96, the human: 「退出按钮……放到打牌界面上」): a white round button in the
  felt's top right corner, the size the assistant's launcher had (`dims.launcher`; the assistant is gone, SKATGO-130),
  on every full-screen table. It opens a small white menu under it: "Weiterspielen" (`go`), on free play "Neue Runde"
  (`quiet`, which asks once more: "Ja, neue Runde" `stop`, "Nein, weiterspielen" `quiet`), and "Tisch
  verlassen" (`stop`). The side panel has no way out of its own. The button stays over the table's dialogs,
  which start below it, and keeps to the felt beside a pinned panel; an open drawer covers it (SKATGO-100).
- **The info board** (SKATGO-100): a cell's content never runs past its padding. Hand and Ouvert stand on
  the small line under the contract; a long name wraps, a small line ends in an ellipsis; the three running
  totals share the cell in equal columns, smaller on a phone (`infoTotal`) and smaller again once one has four
  digits (`infoTotalLong`). The "Augen" cell is a button with nothing of a button's look: a tap switches it to
  "Stiche", the tricks each side has taken, and back, and the choice stays in this browser (SKATGO-127, the human:
  「用户可以选择，最好是在这个格子上，用户点一下，就能切换，而且记住」); the strip's pill follows it.
- **A deal's result** carries its whole calculation in one line (SKATGO-127): the multiplier's parts, base ×
  multiplier = value, then the score — won, lost and doubled, or overbid with its bid — ending in the score the
  table counts: Seeger-Fabian (+50 won, −50 more lost, each defender +40) wherever the totals are Seeger-Fabian,
  the game value alone in the course's own game; on a private table in the settlement. Against the AI — the
  tournament, free play, lesson 11 — the same steps are a step a row in the result card (SKATGO-145): a `Panel`,
  `good` when the player's side won and `bad` when it lost; its title and the player's score at its right, both
  `dialogTitle`; `GameTag`; the deal's score of each of the three, name and score on one line (SKATGO-148), the player's cell named "You"
  and not boxed (`SeatScores`, SKATGO-146, the human: 「contract下面要显示本轮每个人得几分，这个是重点」); then the calculation in two rows
  (SKATGO-148, 「那个公式占用的行数太多」) — the game value from its contract's base value and multiplier with the
  multiplier's parts ("Grand 24 × 3 (with 1 + game 1 + Schneider 1)" 72), then the outcome to its Seeger-Fabian number
  under a `hairline` rule ("Lina won: 72 + 50" +122), an overbid's row between them — each label (`appText`, `slate`) at
  the left and its number (`appBtnStrong`, `navy`) at the right; the player's own score is the title's. The dialog speaks in the app's roles only (SKATGO-146, the human: 「结果卡片上的字太小……我哪来那么小的字？！」): the
  title `dialogTitle` (22), headings and numbers `appBtnStrong` (16), words `appText` (16); only the You/AI tags are
  `badge`. The dialog's body is the scroll
  area, its scrollbar inside the dialog's box, and the way on sits in a foot under a `hairline` rule that stays at the
  dialog's bottom over the scrolled content (`Dialog`'s `foot`, SKATGO-146).
- **Public search content** (SKATGO-44): titles, explanations and contextual links remain visible
  without JavaScript, in the lobby's own tokens and typography — never hidden keyword text or new
  decorative containers.

**Responsive**

- **The phone step is `bp.phone`** (480), used throughout; `bp.cards` takes option cards to one column,
  `bp.hero` stacks the hero, `bp.contracts` wraps the contract picker, `bp.portrait` turns the table's stage upright, `bp.pinned` pins its side panel.
- **Print** (`bp.print`, SKATGO-50): on paper every page leaves out the header and the footer
  (`skat-layout.tsx`). The bidding table and the printables print only their title and their
  tables: the score sheet on one A4 page, the short rules
  on two, whose tables run across on paper and wide screens (a phone keeps them tall). Their PDFs are
  these printouts (`engineering.md` Tools).
- On a phone a hand of more than six cards is held as two rows.
- **Every UI change is checked at desktop 1280×820 and phone 375×812.**

**Design source of truth**

The registries under `app/src/theme/` hold the values, and this file holds the rules: what each
surface, token, role and component is for. `.intentfold/tickets/SKATGO-26/reference.md` is the
measured reference of the lobby design. The course began as a byte copy of parrottoon.com/skat; that
is not a reference for new work.

## Tools

The token check — part of `engineering.md`'s mechanical defence. It parses every source file under
`app/src` outside `theme/` and fails, naming file and line, on a design value written there instead of
named (the rules are in the script's header):

```bash
node app/scripts/check-design-tokens.mjs
```

The literal check — also part of the mechanical defence:

```bash
git grep -nE "className=|style=\{\{|#[0-9a-fA-F]{6}" -- app/src ':(exclude)app/src/theme/**'
```

It must return **no** tracked product line. `app/src/theme/` is excluded because literal values are
what a registry is made of; ignored generated output is not product source.

Rebuilding the Astryx theme after an approved change to `parrottoonTheme.ts`:

```bash
(cd app && npx @astryxdesign/cli theme build src/theme/parrottoonTheme.ts --out src/theme/parrottoon.css --icons-specifier ./icons)
```

## Guidance

**Build from the tokens.** A new screen is assembled from the surfaces, roles, scales, elevation forms
and components above. A value the registries do not have — a new size, radius, shadow, role, weight or
spacing step — is a question for the human (Redline 1), not a judgement call, and never an inline
value.

**Choosing components.** Reach for a custom component only when the kit genuinely has nothing that
fits — not because the existing one needs configuring, and not because writing one looks faster.

**One primary per view.** A view has at most one `go` action; the rest are `quiet`, or on the table
`block` buttons in their own tones. Hints are an `info` button.

**Choosing a token.** Use the role, not the value that looks right: `navy` for titles and strong text,
`text` for body, `slate` for secondary text, `onColor` on colour and felt, `go` for the one call to
action and the current state, `good` / `bad` (with their `Soft` fills) only for judging an answer.
State the text colour on every heading and paragraph, and give every text a role that carries its
weight: the Astryx theme colours `h*` and `p` and sets `p` and `small` to 400 itself. A missing token
is a stop, not a reason to compose one.

**Interaction states.** A wrong answer explains itself, shakes, and never advances; "continue" stays
disabled until the step is solved. An illegal card is refused with the follow-suit reason and stays in
the hand. Anything still loading shows the product's own loading line (`m.loading()`, "dealing the
cards…"). A card that cannot be played now is dimmed but still tappable, so the table can say why.
Every control shows the focus ring in `color.info`.

**Content and tone.** Direct and a little playful in every language the product speaks, written for
learners from six to ninety-nine alike (「不枯燥的」). The German words a Skat table actually uses —
Grand, Null, Hand, Schneider, Schwarz, Ouvert, Matador — stay German, because those are what the
learner will hear at a real table.

**Few words on the game pages** (SKATGO-134, the human: 「我现在特别讨厌游戏页面里那么多垃圾的文字，受够了」):

- A game page says at most one sentence per state; what a button can say is not written as a sentence.
- A thing is said once, at the moment it is needed — "the six deals need an account" when a guest reaches for them.
- Selling points — free, no sign-up, the same cards for everyone — go only in a page's title, its search description
  and About SkatGo; the slogan is the exception.
- What explains the rules belongs to the course's tables and the content pages.

## Redlines

1. **Changing a governed token registry** — adding, renaming, removing or retuning a value — not
   without the human's explicit approval. Registries: every file under `app/src/theme/` —
   `color.stylex.ts`, `suits.stylex.ts`, `breakpoints.stylex.ts`, `scale.stylex.ts`,
   `shape.stylex.ts`, `elevation.stylex.ts`, `effects.stylex.ts`, `table.stylex.ts`,
   `type.stylex.ts`, `type.ts`, `constants.ts`, `flags.tsx`, `icons.tsx`, and `parrottoonTheme.ts`
   (with its generated `parrottoon.{css,js,d.ts}`). A missing token is a stop; reaching for a raw value instead of asking
   is the evasion this entry exists to name.
2. **Tailwind, or any utility-CSS framework** — forbidden outright. Detectable from
   `app/package.json` and from any class attribute.
3. **`className=`, `style={{…}}`, a second stylesheet, or a design value written in `app/src` outside
   `app/src/theme/`** — forbidden outright. Detectable by the token check and the literal check in
   `Tools`. `app/src/styles/app.css` is the only stylesheet.
4. **A felt surface in the front page's hero** — forbidden outright (the human, 2026-09-27:
   「hero区域禁止再用绿色卡了」). Detectable from the hero's styles in
   `app/src/components/skat/entry-page.tsx`: no `color.feltInner` / `color.feltOuter` background and
   no `fill.felt`.
