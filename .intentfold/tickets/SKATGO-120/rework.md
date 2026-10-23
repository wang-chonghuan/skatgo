# SKATGO-120 rework

Twelve rework rounds after the handoff (eb432c2), one commit each, the human's ask as its first line.
The handoff removed the hero picture on phones; the rounds below carried the front page much further.

1. **Tiles title only; the crash course only on the rules page** (30b2698) — 「四个卡片要改，里面按钮去掉，描述文字去掉，
   只要标题……5分钟的按钮，放到规则页面的一个按钮中，其他地方别放了」. Each tile is one link with a descriptive title
   (four new titles in both languages); the "5-minute crash course" is a quiet button under the rules' lead and
   nowhere else (front page and course link removed). Unused tile texts and buttons' messages removed.
2. **Tiles as tall as their title** (c8223f6) — 「卡片还弄那么大干嘛？包裹着文字就行了……牌的背景还保留，但是可以剪裁」.
   No minimum height; the card art kept and cropped at the tile's edge; two by two, one column below `bp.cards`.
3. **No picture on PC either** (3f7b6b8) — 「pc上我也不想要那个图片了……用你最大的艺术设计审美来做好没有这个图片后的布局」.
   The hero is type alone, centred (left-aligned on a phone); the link previews build their art from
   `/hero-table.webp` directly. Unused hero tokens removed.
4. **Less room above the headline** (3a22bcb) — 「这句话上方的空白太多……缩小它」. 48px, and no empty announcement line.
5. **English slogan back to "Free Skat online"** (847ea24) — SKATGO-114 had changed it; the page title unchanged.
6. **Lead's second sentence** (bd7aa09, then 7994625) — 「After every deal……英语德语都去了？」, corrected by 「After every
   deal 我只让你删这个」: only "After every deal," / "Nach jedem Spiel" went; the AI sentence stays.
7. **Smaller slogan on PC** (46f7361) — 「pc版上slogan字太大」. `fHero` up to 48px (was 66px); phone unchanged.
8. **Tighter around the slogan** (ddea0e8) — 「我感觉它上下空白还是太多」. 32px above it on PC, the lead 12px under it.
9. **Forum button in the hero** (8ccba7d, then 78b2234) — 「把solve puzzles 换成论坛按钮」, then 「就你建议的吧，英文的the能否
   去掉」: the white button beside the tournament reads "Visit Skat forum" / "Zum Skat-Forum" and opens the forum;
   tracking `home_cta_clicked` button `forum` instead of `ladder`.
10. **The 12 Skat tricks into the forum** (1510a92) — 「论坛里的这个是干嘛的……移除这个文章在app里的所有其他引用的，就放论坛里」.
    SkatGo's posts 2 (German) and 3 (English) in production's forum Articles, written from the article's data; the
    article's page, route, data, test, preview images and messages removed, with its links from the forum and the
    puzzles page and its sitemap entry; `/{en,de}/skat-tricks/12-tricks` answers 301 with the post in its language.
    The puzzles page links the bidding table beside the rules, to keep the SEO check's two contextual links.

Each round was checked on the running build at 1280×820 and 375×812 (measurements, the rendered text, links and
redirects), with typecheck, unit tests and, where routes or text changed, `check:seo` and `test:seo`. Charter
`ui.md`, `product.md` and `engineering.md` follow every change the human asked for.

Net effect against the handoff: the front page is type alone on every screen — the slogan, one lead, the
tournament and forum buttons, the ✓ line — over four title-only tiles; the crash course lives on the rules page;
the Skat tricks are forum posts. No env change.
