# SKATGO-249 rework — after the handoff

Four rounds the human asked for, one commit each. `handoff.md` stays as delivered.

1. **「这里不要提AI了，而且这句话啰嗦」** (ae5a69e) — the hard-hands lead, shorter and without the AI, EN and DE.
   Rechecked: SEO built check; the lead read in the browser on both languages.
2. **「两件都改，题库按拿底牌后的牌重做」** (0eb56b3) — after the human asked whether setting the game before the skat is
   sound and whether "the game is set" is standard English: each kind judged on the twelve cards with the skat (a Null keeps
   one weak spot whichever two are put away; `twelveOf`, `ofKind`, `gameOfKind`); the pool regenerated (seed
   `skatgo-challenge/2`) and `--check`ed; the EN lead "the game is chosen for you"; the few-trumps line counts the skat.
   Rechecked: multiplayer check (76), web defence (373), the first deal of each kind opened on the ticket service.
3. **「能否改为6个，偶数」→「Schneider 挑战」** (ffa0ddc) — a sixth kind, Schneider as the aim: three or four Jacks (Grand) or
   seven trumps or more, counted with the skat; 30 deals SkatZero makes with Schneider in 50–90 %; passed when Schneider is
   made or the AI missed it too (`madeAim`, `passedDeal(review, kind)`); the aim said over the skat step and the points
   against 90 in the result's foot. The other five kinds' deals unchanged. Rechecked: pool `--check`, multiplayer check
   (77), web defence (375), six cards and the Schneider skat step in the browser.
4. **「这个页面不要全部白色……大胆设计，要美观」, then 「和home页面的四个卡片太像了」** (ae933c7) — the list redesigned: each
   kind a card whose top is one of the table's six contract tints with five of skatgo's cards fanned on it, telling the
   kind; title, line and progress under it. A first try as the front page's colour tiles was dropped before commit at the
   human's word. Rechecked: web checks (375 tests, tokens, literals, bundle, SSR, SEO), desktop / phone / night screenshots
   from a build.

Net effect against the handoff: six kinds instead of five, judged with the skat; a sixth progress bar; the page's new look;
the lead reworded. The progress record, its routes and the pass rule for the five first kinds are as handed off.
