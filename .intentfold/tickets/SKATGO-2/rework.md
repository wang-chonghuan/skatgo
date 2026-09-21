# SKATGO-2 rework (after the frozen handoff)

The human used this ticket to collect further small copy fixes. Each ask, in order:

1. 「定约是 Grand。把这手牌里所有的主牌都点出来。这句，我都不知知道定约是grand是啥意思，你就突然冒出来了」
   — lessons 3–4 drills (find the trumps, which cards may be played, who takes the trick) drew Grand
   by default though Grand is taught in lesson 5. Their default contract is now a suit game only.
   New test: no drill before lesson 5 names Grand or Null in any language (red on the old code, green
   on the new). `75a9ced`
2. 「68分钟学完改为20分钟学完，马上改，禁止测试」 — lesson durations scaled to total 20 minutes
   (1,1,1,2,2,2,2,2,2,2,3), same in all three languages; the home page sums them. No test run at the
   human's instruction. `8177de2`
3. 「首页改为，半小时，学会Skat」 — home title: 「半小时，学会 Skat」 / "Learn Skat in half an hour" /
   "Skat lernen in einer halben Stunde". `268d1d5`
4. 「年龄改为6-99岁」 — home age pill: 「6–99 岁」 / "Ages 6–99" / "Von 6 bis 99 Jahren". `1e5ed75`
5. 「charter改一下，然后关闭工单」 — `charter/product.md` (who it is for) and `charter/ui.md` (content
   tone) now say 6 to 99, matching the page. `22dc816`

**Rechecked:** after 2–4 the built server's home page was read back (title, 「约 20 分钟」, 「6–99 岁」).
At close, the mechanical defence ran once over the final branch — typecheck, build, 50 tests,
client-bundle check, grep = 1, SSR link — all pass. The original AC (lesson 2 tip) is untouched by these
changes.

**Net effect vs the handoff:** the tip fix, plus: no Grand/Null before lesson 5, 20-minute course
length, new home title, ages 6–99, charter aligned.
