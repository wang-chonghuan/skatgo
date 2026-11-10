# SKATGO-182 rework

Rounds after the handoff (frozen at b8ad19e), one commit each.

1. **「改：每一行显示用户拿到了啥牌，以及和ai差几分，不管是否登录，这个my progress卡片都显示这个，想点击，必须登录」** (b3158e4).
   The service sends each record deal's ten cards as dealt (the day's deck, or the free pool's deal while it is the same
   pool); every history row shows them in a Grand's order with suit colours, and the score less the AI's on the same
   cards. The front page card lists the games for accounts and guests alike (SKATGO-169's win rate, average and curve
   gone from it); an account's card links to the record, a guest's games open Clerk's sign-in first, then the record.
   Rechecked: card and record, desktop/phone, en/de, guest and account (18 checks); hands tested in `guest.test.ts`.
2. **「Your level against the AI, day by day 这里的day by day去掉，然后曲线还换成那个平滑曲线」, 「应该是每个deal是一个点，就像本来
   显示在首页卡片上的那个chart一样」** (c34720d). Title "Your level against the AI" / "Dein Niveau gegen die KI"; a point a
   deal, the 30-deal rolling average against the AI, drawn as the home card's smooth line (`smooth-path.ts`).
   Rechecked: the curve, desktop/phone, en/de.
3. **「平滑点，然后纵轴也要有，然后下面文字太多，让人费解，必须一针见血」** (5fbf7d2). The series averaged again over seven
   points either side and drawn through at most 40; an axis of the highest, middle and lowest value with fine lines;
   the note one line ("Above 0 you beat the AI on the same cards; below it, the AI beat you."). Rechecked on the owner's
   275 deals, desktop/phone, en/de.
4. **「卡片名称 my progress改为my history and analyse」** (0d3701d). "My history & analysis" / "Verlauf & Analyse".
5. **「手牌列最好也加个列名」** (51cee41). A head over the cards beside "vs. AI", on the card and the record.
6. **「不太对，我觉得应该是你的手牌，最新的在最上面。这个意思。但是禁止直译」** (4ebfbeb). "Your hands, newest first" /
   "Deine Blätter, neueste zuerst".
7. **「改吧」 (on 「my history还是history」)** (2004a39). "History & analysis"; German unchanged.

## Net effect against the handoff

- The history's rows and the front page card show the ten cards and the gap to the AI instead of the two scores; the
  card shows the games for accounts too, and opening it as a guest signs in first.
- The front page card is "History & analysis" / "Verlauf & Analyse".
- The record's curve is a point a deal, smoothed, with an axis and a one-line note, titled without "day by day".
- `homeCurve` in `shape.stylex.ts` is no longer used by any component (left in the registry; removing it is a registry
  change).
