# SKATGO-210 rework

Relative to the frozen handoff (83a459c). Five rounds, each its own commit.

## Round 1 — e616f24
Ask: 「防家拿到31就不扣分」 (after the discussion of bad hands: 「拿到坏牌很无聊，因为肯定会丢一分」)
- League scoring: a lost defence is 0 instead of −1 when the defenders took 31 card points or more, the declarer short of
  Schneider (`saved`, `SAVE_AT`); a Null game, which counts no card points, stays −1. The service passes the deal's
  defender points (`defendersOf`).
- The result line "The declarer made it – Schneider avoided" / "Der Alleinspieler hat gewonnen – Schneider abgewehrt"; the
  About bullet; charter product.md and ui.md.
- Rechecked: the outcome's unit cases; the service's League test, in which a real deal came out saved (defenders 42 → 0).
  The result line itself shows only after a played deal: left to the human.

## Round 2 — 59d813f
Ask: 「金币也要改，100个太多，而且必须每周金币清零」
- Check-in coins 30 a day (was 100); they add up Monday to Sunday (Berlin) and the week's first check-in starts again from
  the day's coins, what was left gone (SQL `date_trunc('week', …)`, no scheduled job).
- Texts (not enough coins, guest line, About), charter product.md and ui.md.
- The service test: the week's add-up, the reset; it also reads the review's own card points for round 1's check.

## Round 3 — 101687b
Ask: 「页面标题也不要用league了」
- The League page's H1 "Ranked match" / "Ranglistenspiel"; its tab title "Skat ranked match – climb from Bronze to Legend"
  / "Skat-Ranglistenspiel – von Bronze bis Legende"; the breadcrumb follows. Other "League" words unchanged.
- Rechecked: the served titles; SEO check.

## Round 4 — 6f23179
Ask: 「60，然后每个tier的扣分是：3，4，5，6，10，12」
- Check-in coins 60 a day (the week's reset from 60); fees 3, 4, 5, 6, 10, 12 by tier ("扣分" read as each deal's coins).
- Rechecked: unit and service League tests; in the page a new account 60, 40 left this week → 100, 300 left last week →
  60; the tiers' cards 3–12; About EN/DE.

## Round 5 — 4c14315
Ask: 「停，德文按个卡片标题，单词太长，溢出了，德语是如何处理这种情况的？」, then 「标准做法是行末加连字符断开。同意」
- The German tile title with soft hyphens at its syllables: "Ranglis-tenspiel" on a phone, "Ranglisten-spiel" on PC, one
  line on a tablet. The League page's H1 fits and is unchanged.
- Rechecked: the tile at 320, 375, 768, 1280 in DE and EN, inside its tile.

## Net effect
Beyond the handoff's tile name and XP badges: League scoring keeps a lost defence with 31+ card points at 0; coins 60 a
day, gone every Monday; fees 3, 4, 5, 6, 10, 12; the League page titled "Ranked match" / "Ranglistenspiel"; the German
tile hyphenated. No env key changed.
