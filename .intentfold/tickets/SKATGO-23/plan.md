# SKATGO-23 plan

## What the code says that the ticket does not

- `/` is the course map today (`routes/index.tsx` → `CourseHome`). It is the one course page rendered
  on the server, for search engines (SKATGO-1). The entry page takes `/`, so the map needs a route of
  its own.
- Four places link to `/` meaning "the course map":
  - the lesson's ✕ (`lesson-player.tsx`);
  - the finish screen's "回到目录" (`lesson-player.tsx`);
  - an unknown lesson id's redirect (`lesson-page.tsx`);
  - free play's "← 课程目录" (`free-play.tsx`).

  The header brand also links to `/`, and should keep meaning "the front page".
- `public/sitemap.xml` is static, and `lib/sitemap.test.ts` fails until every parameter-free route
  is listed in every language. A new route means new sitemap entries.
- The assistant decides which page it is on from the path (`ask.tsx` `pageOf`). The server describes
  `home` to the model as "the course map, listing all lessons" (`lib/ask/context.ts`). On the new
  `/` that description would be wrong.
- Course copy lives in `app/messages/{zh,en,de}.json` (Paraglide). Every new string needs all three.
- The design system is `ui.md`, with its tokens. The card art can be built from what exists: felt
  (`texture.feltDrill`), real card faces (`PlayingCard`), `Pill`, emoji. Two things are missing:
  - a height for an art band;
  - the tilt of fanned cards.

  Both need new tokens, which fall under Redline 1 (grill Q4).

## Route

1. **Routes.**
   - `routes/course.tsx` (`/course`) renders `CourseHome` exactly as today, still server-rendered.
   - `routes/index.tsx` (`/`) renders the new `EntryPage`, also server-rendered (it is static
     content).
   - `ClientPage` gains `entry` and `course`.
2. **`components/skat/entry-page.tsx`**: a short title and lead, then a 2×2 grid of cards (one column
   on a phone).
   - Each card has a felt art band, a title (`pageTitle`), one line of description (`note`), and a
     footer.
   - **Course and Play cards** are router `<Link>`s. Their footers are a `linkLook` button; the
     Course footer also shows progress after mount, the way `CourseHome` applies progress.
   - **Duplicate and Puzzles cards** are plain `<div aria-disabled="true" data-state="soon">` with a
     "coming soon" `Pill`, dimmed art and no hover lift. There is nothing to click.
   - `data-testid="entry-card"` and `data-section` on every card.
3. **Art** (tokens only):
   - Course: three Jacks fanned on felt.
   - Play: a trick in progress, two face-down cards and a face-up Ace.
   - Duplicate: the same three cards twice, side by side.
   - Puzzles: a face-down card with a "?" badge.

   The unavailable cards' art uses `texture.dimmed`.
4. **Links.**
   - Lesson ✕, the finish screen's back button and the unknown-lesson redirect → `/course`.
   - Free play's back link → `/`, relabelled "← 首页 / ← Home / ← Start" (grill Q2).
   - The course map's own buttons (continue, free play) are unchanged.
5. **Assistant.** `pageOf('/course')` → the existing `home` (course map) context. `/` → per grill Q3.
6. **Sitemap.** Add `/course` in three languages with its hreflang alternates.
7. **Copy.** zh/en/de below.

## Copy (agent-designed, per the request)

| Key | zh | en | de |
|---|---|---|---|
| entry title | 斯卡特，从这里开始 | Skat starts here | Hier beginnt Skat |
| entry lead | 学规则、上牌桌——很快还能和大家比同一副牌。 | Learn the rules, take a seat at the table — and soon, play the same deals as everyone else. | Regeln lernen, am Tisch spielen – und bald dieselben Blätter wie alle anderen. |
| course | 教程 · 11 节小课，从 32 张牌讲到打完整一局。 · 开始学 | Course · Eleven short lessons, from the 32 cards to a whole game. · Start learning | Kurs · Elf kurze Lektionen – von den 32 Karten bis zum ganzen Spiel. · Loslegen |
| play | 打牌 · 和两个电脑对手开一桌，想打就打。 · 开一桌 | Play · Take a seat against two computer players, any time. · Deal me in | Spielen · Setz dich mit zwei Computergegnern an den Tisch – jederzeit. · Karten geben |
| duplicate | 复式 · 每天同样的几副牌：人人各自对 AI，看谁分数最高。 | Duplicate · The same few deals for everyone, every day — play them against the AI and see who scores highest. | Duplikat · Jeden Tag dieselben Blätter für alle: gegen die KI spielen und sehen, wer am meisten holt. |
| puzzles | 题库 · 一道道牌局难题：该叫多少？这张牌该怎么出？ | Puzzles · Bite-sized Skat problems: how high to bid, which card to play. | Aufgaben · Kleine Skat-Rätsel: Wie hoch reizen? Welche Karte spielen? |
| soon | 即将推出 | Coming soon | Bald verfügbar |
| course progress | 已完成 {finished} / {total} 课 (existing `home_done`) | | |
