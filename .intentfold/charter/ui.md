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
| `table.stylex.ts` | `stageUnit`, `stage` | the card table's stage, measured in one unit that follows the felt's room (SKATGO-34), including the trick's steps (SKATGO-68) |
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
| **Colour tile** | a section on the front page: ♣ the course (`tileOrange`), ♠ free play (`tileGreen`), the tricks (`tileNavy`), a private table (`tileRed`) | its `color.tile*`, `radii.tile`, its own `elev.tile*`, its card art under `veil.tile` | `color.onColor` |
| **Felt** | where cards lie: the table, a drill's hand | `fill.felt` (`feltInner` → `feltOuter`, with a fine grain) | `color.onColor`; highlights `color.gold` / `color.amber` |
| **Board and plates** | the table's info board, the seat plates, dark pills | `color.board` with `color.boardLine`; `color.plate` | `color.onColor`, quieter `color.onColorSoft`; the player's own numbers — their score, their side's card points — in `color.amber` (SKATGO-79) |
| **Footer** | the legal links under every header page (SKATGO-46), and the Skat-Tricks and the forum (SKATGO-118) | `color.surface` with a `hairline` rule | links in `color.info` |

**Colour roles** (`color`)

| Tokens | Role |
|---|---|
| `page`, `surface`, `hairline` | the page, white surfaces, rules and borders |
| `text`, `navy`, `slate`, `slateDeep`, `onColor` | body text, titles and links, secondary text, a darker slate (the slate button), text on colour or felt |
| `go` | the one call to action, and the current state — the public site's landing buttons too (SKATGO-97, the human: 「改成我们按钮的标准绿色」); `goLanding` and `elev.btnGoLanding`, its former own green, are no longer used |
| `info` | links in text, the hint button, the focus ring, and the "AI" tag wherever the AI is named — a score sheet, the play record, the leaderboard (SKATGO-79, SKATGO-80, the human: 「AI标志都用app里那个蓝色的Ai标志」) |
| `stop` | leaving the table |
| `tileGreen`, `tileOrange`, `tileNavy`, `tileRed` | the front page's section tiles: ♠ free play, ♣ the course, the tricks, a private table |
| `feltInner`, `feltOuter`, `gold`, `amber`, `plate`, `hintTab`, `board`, `boardLine`, `onColorSoft`, `roleTag`, `auctionHead`, `tabActive` | the card table |
| `good` / `goodSoft`, `bad` / `badSoft` | right and wrong: an answer's border / fill and its verdict; a refusal or an error (`bad` text, `badSoft` behind a failed message); the play record's trick most worth improving (`badSoft`, SKATGO-79, the human: 「本app常用那种粉红的背景」). `goodSoft` is also the fill of what is chosen or one's own: a switch or pill that is on, the chosen deck, the player's own row on the leaderboard, a finished lesson |
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
- **Weights** (SKATGO-47): two by purpose — `weight.text` (500) for reading text: paragraphs,
  explanations, leads, table rows; `weight.ui` (600) for controls, navigation, links, labels and meta:
  buttons, pills, the table's names and small lines. Titles, emphasis and the large numbers keep
  `bold` (700) to `black` (900). `regular` (400) is only Bebas Neue's. **Every role that sets text
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
| `TextField` / `TextArea` | one line (Enter submits) / several: `size` `post` starts about six lines tall, `comment` about three (`dims.textPost`, `textComment`; SKATGO-119), both growing with the text | a name, a forum post's title and text, a comment, a reason |

**Components — the course's and the table's widgets**

| Widget | File | What it is |
|---|---|---|
| `PlayingCard` | `playing-card.tsx` | one card, by default of the Turnierblatt (the German Skat association's tournament deck: French suits in German colours, SKATGO-66), drawn as one SVG: the corner index top left and turned bottom right — the rank as Bebas Neue outlines (`card-glyphs.ts`, never text, which a search engine would read), in every language official Skat's B / D / K / A, or J / Q / K / A when the learner chose that deck in the settings, over the suit's pip; the pips of 7–10 in their traditional places; the ace's one large pip; a court's double-headed figure in a frame notched for the index. Pips and index take the suit's colour. The settings also offer the Deutsches Blatt: the same layout with the German suit symbols (pictures) as pips, its own courts (Unter, Ober, König) and Daus pictures, and K / O / U / A. The court figures, Daus and German symbols are skatgo's own pictures (`app/brand/cards`, served from `/cards`). Sizes `xs`, `sm`, `md`, `lg`, `table`, `trick`, `fill`; states `selected`, `dimmed` (`fill.dimmed`), `glow`, `verdict` good/bad, `faceDown`: the back chosen in the settings, "Kartenrücken" (SKATGO-102), in the card's white frame — by default the charcoal and white ornament (SKATGO-66), or one of four in its style, less dense, with the SkatGo logo small in the middle in the back's own colour |
| `Fan` / `CardRowView` | `card-row.tsx` | a hand held as a fan (two rows of a long hand on a phone; `data-answer` / `data-order` for scripted checks), and a labelled row of cards for reading |
| `Shake` / `Feedback` | `exercises.tsx` | the wordless "no" after a wrong answer, and the good/bad panel that explains it |
| `TitleWithDownload` / `PdfLink` | `print-links.tsx` | every download (SKATGO-53): the page's h1 with, beside it, the page's one `go` button — lucide's `Download` icon at `icon.inline` and "PDF herunterladen" / "Download PDF" — which moves under the title on a phone and is left off paper |
| `PrintLinks` | `print-links.tsx` | the "Zum Ausdrucken" links to the score sheet and the short rules, on the rules page, the bidding table and the course; left off paper |
| `ScoreSheet` | `daily-comparison.tsx` | a score sheet (SKATGO-79): the three seats' Seeger-Fabian scores of one deal or of a tournament, the player's line, tagged "Du" in `navy`, over the AI's, tagged "AI" in `info`; no other number beside them (SKATGO-81); under a deal's line, what that deal was. The AI's line is left out for days dealt before it played them. Free play and lesson 11 show it after every game, the AI's line once the review has worked it out, with a note while it does or when it cannot (SKATGO-86) |
| `VsAiTable` | `daily-comparison.tsx` | the daily tournament's comparison with the computer (SKATGO-48, SKATGO-79): one row per finished deal — the deal's number, the player's and the AI's Seeger-Fabian score each with its role under the heading "Punkte", signed, never `good` / `bad` (SKATGO-81) — that opens to the deal's `ScoreSheet` and play record; under the rows, the tournament's `ScoreSheet`. Rows collapse instead of scrolling sideways; the newest opens after a deal and on `/daily` mid-day. On `/daily` while the day runs (`DayDeals`, "Die Spiele von heute", also rendered on the server; SKATGO-63) every deal of the tournament has a row: the ones not finished follow by number, "läuft" for the one being played and "offen" for the rest, with nothing of their cards; the total appears once a deal is finished. Free play's round result, "Deine Runde", is the same table over its six deals (SKATGO-88) |
| `DealAnalysis` / `TrickReplay` | `daily-comparison.tsx` | a finished deal's play record, "Spielverlauf" (SKATGO-79), after a daily deal, on a `/daily` row and after a free game; open, never folded, with no button. On top, in one line, the player's card that fell furthest below the AI's choice and the AI's card. Then a row per trick: its three cards in the order played, each under its player's name, the player's own bold, and who took the trick with its card points; under a row the player taps, and only that one, the player's hand before that trick, folded again by a tap anywhere else, with no icon (SKATGO-100). Wherever the AI would have played another card, that card stands under the player's, in the same column, with an `info` "AI" tag after it; the furthest trick's rows are `badSoft`. Under the tricks, a line for those left unplayed when the deal was decided early, and the skat |
| `ForumBody` | `forum-body.tsx` | a forum post's or comment's text (SKATGO-118): paragraphs, `##` headings, lists, `**bold**` and suits through `Rich`, links in `info` (a player's `ugc nofollow`), and a line `[♠A ♠10 ♥K]` as a `CardRowView`; in SkatGo's posts a line `![what it shows](name.svg)` as the site's picture in the page's language, the column's width on white with a `hairline` border and `radii.panel` (SKATGO-129), in a player's post that line stays text; built as elements, never as HTML |
| `AnnouncementLine` | `forum-announcement.tsx` | the forum's newest announcement of the last two weeks as one line — a `good` "Neu" `Pill` and its title as an underlined `info` link — on the front page and `/daily` (SKATGO-118); nothing when there is none |
| `GameTable` | `game-table.tsx` | the whole-game table: the felt and its stage, the info board, the seat plates, the trick, the learner's hand, the edge tabs, and the side panel — pinned beside the felt at `bp.pinned`, a drawer otherwise (SKATGO-34). The trick's cards and the skat are as big as the hand's; the trick's overlap, each toward who played it and one step higher than the card to its left (`stage.trickFirst`, `trickSecond`, `trickThird`), the three centred in the frame's height, the later on top, so every card's top-left number and suit stay in the open whatever was played last (SKATGO-68). An open hand at the side — an Ouvert declarer's, or the cards laid open when a deal is decided early — is spread at `stage.stackStepOpen`, wider than a closed one, so every card reads (SKATGO-79). As an exercise's table (`exercise`, SKATGO-110/111) every hand is open, the side hands at the learner's card size, and the exercise supplies the board at the top and the dialog at the end; there is no side panel, hint tab or settlement |

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
  - the SkatGo mark (`dims.landingMark`) and name (`landingBrand`), "SkatGo" without ".com" (SKATGO-105);
  - the six links, in this order (SKATGO-69, SKATGO-82, SKATGO-118): the daily tournament, learning (the
    course), free play, a private table, the tricks ("Tricks", which took the place of the greyed-out
    "Aufgaben"), and the forum ("Forum" in both languages; it fits the 1100px header in German with 41px to
    spare on either side);
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

  On a phone the links and the account fold into a menu. Under the page sits the legal footer. The
  header is the same on every page; it shows no current-page highlight (its links carry
  `aria-current`).
- **The front page** (`entry-page.tsx`), on white:
  - the hero: the daily tournament's headline (`landingHero`) and lead (`landingHeroLead`) in navy;
    its one green landing action, the deal of the day (SKATGO-131, the human: 「今日一副是主按钮，自由play是次按钮，都是在hero区域
    的」) — "1 Spiel heute · 2 Min." (the human chose the words: 「1 deal today · 2 min / 1 Spiel heute · 2 Min. 用这个吧」) to `/daily`, where the deal and the six deals are chosen — never straight to a table (「这个应该是入口，进去后分为1deal和
    6deal，不要一进去马上打牌」) — and "Heutiges Ergebnis · Platz k" once played — and beside it a white `quiet` one to free play, "Freies Spiel"; the forum is no longer in
    the hero (it was since SKATGO-120); no line of facts under them (SKATGO-123, the
    human: 「✓Free ✓AI analysis 这行去掉」). No picture (SKATGO-120, the human: 「手机版不要显示那个图片了」, then 「pc上我也不想要那个图片了……用你最大的艺术
    设计审美来做好没有这个图片后的布局」): the hero is type alone, centred, with only the page's own top above it
    (32px, 「这句话上方的空白太多」, 「我感觉它上下空白还是太多」) — the headline at 48px
    (`fHero`, 「pc版上slogan字太大」) with the lead held close under it (12px), the lead within the reading column,
    balanced, the two buttons — and on a phone it keeps to the left edge. The illustration stays only in the link previews (`og.mjs`). Never
    on felt (Redline 4). With the tournament's Elo board beside it (SKATGO-123, the human: 「hero区域在pc上就是左右两栏的
    布局了」) the hero is two equal columns (`dims.twoColumns`), the type on the left and kept to the left, the board
    on the right, both from the top, the board exactly as tall as the type, its list scrolling inside (「elo列表的
    高度，和hero区域的高度一样，可以滚动，不要那么高，破坏我布局」); under `bp.cards` one column, the board under the type.
    The board (`elo-board.tsx`) is a white panel like the daily board: its title (`dialogTitle`) with a circled
    question mark beside it (`info`) that opens, over the page, a white card saying how it is counted and what "?"
    means, closed by a tap elsewhere or Escape (「how it counted用一个圆圈问号图标，放在 elo标题旁边，作为toast」); the ten
    highest players — rank, name, number, a slate "?" when provisional — with the AI's row (its blue tag, no rank)
    standing among them by its number, in close rows at the text's size (`appText`, 「我刚都没说让你改成14」), one
    column (「你换成单列吧」). On a phone it is folded behind one line, its title and the players — rank, name, number — running
    slowly sideways without end (`marqueeSlide`, `timing.marquee`; still under reduced motion) — 「你这个还不如横向
    持续缓慢滚动」 — and a tap opens it, one column (「手机上可能要折叠一下排名榜」).
    Without a board the hero stays as above, centred;
  - the sections as colour tiles, each one link with only a title that says where it goes — no text, no button
    (SKATGO-120, the human: 「里面按钮去掉，描述文字去掉，只要标题，标题具备描述性即可」) — as tall as its title, its
    card art kept and cropped at the edge (「包裹着文字就行了，禁止大片空白，牌的背景还保留，但是可以剪裁」), rising on
    hover, two by two and one above the other below `bp.cards` so a title never runs onto its cards:
    "Skat interaktiv lernen" (the course; no count of lessons, which scares people off — SKATGO-127, the human:
    「把11课字样去掉，会把人吓跑」, 「入口卡片叫交互式学习skat」), "Skat gegen die KI spielen" (free play), "Mit Skat-Aufgaben
    üben" (the exercises, `tileNavy`) and "Skat mit Freunden spielen" (a private table, `tileRed`);
  - plain links to the rules and the course, and the questions people ask.
- **A sub-page** (the course, a lesson, Skat in 5 Minuten, the rules, the bidding table, the score sheet,
  the short rules, the daily tournament, the Skat-Tricks' page and their article, the legal pages; an open-card endgame is a table, below), on the grey page: its title is the column's first element, an
  `<h1>` in `landingHeading`, `color.navy`; then its content — white option cards where it offers
  choices (the course's lessons, the tournament's board), reading text and tables elsewhere. The daily
  tournament's page puts the forum's announcement line under its lead when there is one (SKATGO-118), then a
  toggle of two `toggleLook` links, "1 Spiel heute" | "Turnier · 6 Spiele" (SKATGO-131; SKATGO-77's 6 | 12 once stood
  there): the deal of the day by default, the tournament with `?t=6`. The deal of the day's side: before it is played
  its one `go` button to its table (`/daily/play?size=1`, where after the last card the result stands a moment and the
  page comes back here); once played, a white card with the player's score and the AI's (`landingHeading`, each
  tagged), "Heute n Spieler · du bist auf Platz k", "Ergebnis teilen" as the one `go` (the system's share sheet on a
  phone, the clipboard elsewhere; no card or contract in it), the time until the next deal, and folded under it the
  deal against the AI (`VsAiTable`); then its board as the tournament's, the AI's row on it; then a link to free play.
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
  SKATGO-103) is its H1 and lead, then every kind of exercise as an option card, numbered, each a `<details>`
  closed at first (one named in the address, as `#offenes-endspiel` names the first, opens by
  itself and stops under the header): first the open-card endgames (SKATGO-119, the human: 「这个要可折叠，像其他题
  一样，它作为第一类练习题」), their count solved in the head, opening to levels (SKATGO-111) — a grid of numbered
  square tiles, solved `good` with a check, gone wrong `bad` with a cross and the number of wrong answers in its
  corner, the next one ringed `go`, and for a guest a lock from the third, and under it one `go` button to the
  next ("Aufgabe n spielen"); then the other kinds of SKATGO-103, each opening to its exercises (hidden by
  SKATGO-110, shown again by SKATGO-119); under the cards, small `info` links to the article and the rules. An open-card
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
  an option card under the lessons. The header and the footer link the Skat-Tricks' page, and the table's rules panel and the
  play record ("Interaktive Übungen – spiel besser Skat") link it in a new tab, so a game is never left
  behind. A lesson starts playing at once: under its title only a
  one-line kicker and the lesson's promise, then the lesson, which keeps its "back / continue" bar
  sticky at the bottom of the screen. Its short explanation for readers and search engines follows the
  lesson, visible, under "Kurz erklärt" / "In short" (SKATGO-52); then its ways on: the next lesson,
  its section of the rules, and all lessons.
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
- **At the table**, the speaker in the auction may jump (SKATGO-87): "Höher …" (`quiet`) opens, under it,
  one row of every higher number on the ladder in pills (`toggle`), scrolling sideways so the hand stays
  in sight on a phone; a number is picked first and named with the main button. While a move of the
  player's is on its way to the server, the table shows no move buttons, so none hangs there dead
  (SKATGO-100). Free play's table shows
  its round in the strip as the tournament does, "Spiel n von 6 · gesamt X"; after the sixth deal the
  round's result takes the felt's place: a white panel with its `VsAiTable`, "Neue Runde" (`go`) and
  "Tisch verlassen" (`quiet`) (SKATGO-88).
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
  the game value alone in the course's own game; on a private table in the settlement, in free play right after the score sheet against the AI, in the tournament under the comparison.
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
