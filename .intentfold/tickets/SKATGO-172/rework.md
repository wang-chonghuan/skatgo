# SKATGO-172 rework

Eight rounds after the handoff, each its own commit; net effect relative to the frozen handoff below.

1. **「榜单上怎么没我 ？1天的也要显示个火焰，1就行」** (a57b1ee). The local board lacked the owner because the ticket
   database held sample accounts only: it now holds the owner's records (`demo-me.sh`) and this week's production deals,
   read only. Code: everyone on the board shows a flame of at least 1. Rechecked: backend XP test (a one-day player at 1).
2. **「Every deal earns XP · starts again in 3 days 这句去掉。标题改为本周经验和连胜天数」** (bbd9dae). Line under the title gone;
   title "This week's XP and streaks"; on a phone the folded title on its own line. Rechecked: 1280×820 and 375×812.
3. **「经验表，pc上不变，手机上显示前5名，然后可以滚动，不要横向滚动了」** (ca48e00). In one column the list shows five rows
   (145px) and scrolls; no fold, no running names; the marquee's tokens removed. Rechecked: five rows visible, a
   temporary sixth reached by scrolling; PC 522×209 unchanged.
4. **「用weekly XP 是否更好，哪个更短，德语呢」 — 「好」** (67a9664). Title "Weekly XP" / "Wochen-XP".
5. **「steak也要放上去吧」** (a6d656d). Title "Weekly XP & streaks" / "Wochen-XP & Serien", one line on a phone (211px).
6. **「你建议？」** (74ff13a). The XP card above the progress card: PC first row, phone right after the four cards.
   Rechecked: positions at both sizes.
7. **「同意你的决定」** (a45a59c). A declared deal earns extra XP (then 4), shown in the result, the toast and How XP works;
   the toast's sides 12px so its longest rule clears the way out (measured 320px in 331px). Rechecked: unit and backend
   tests; the How text.
8. **「改成+2。然后直接关闭工单上线」** (3f9156d). The extra is 2: on the regulars' 941 deals the declared ones earned 8.13 a
   deal and the rest 9.50. Rechecked: unit and backend tests.

Net effect: the week's XP card titled "Weekly XP & streaks", on top of the progress card, five rows on a phone; every
board row with a flame; a declared deal 2 XP more. Mechanical defence and the multiplayer check passed once on the
final branch.
