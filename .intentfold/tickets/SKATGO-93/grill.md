# SKATGO-93 grill

人的话已经把两件事说清楚（「可以改，然后课程卡的11 of 11 are done这个小字也给我删了」），没有再问。agent 自己定的：
- 「KI-Analyse」换成 „Analyse mit KI“：德语里「KI Analyse」分开写是错的，只有改语序才能既去掉连字符又意思不变。英文 "AI analysis" 本来没有连字符，不动。
- 「课程卡」指首页的课程卡（人看到的「11 of 11」就在那里）。课程页 `/de/kurs` 的进度卡是另一处，按 product.md「Overall progress is visible from the course map」保留。

## 返工
人：「你把这几个地方的中英文连字符改对，别墨迹」。agent 定的写法：英文 "No account needed"；速成课 „Crashkurs in 5 Minuten“ / "Crash course in 5 minutes"，规则页链接跟着改。

## 返工 2（人，附截图 skatgo-20.jpeg）
「这个打牌结果页面，显示的时候， you are lost的卡片顶部和结果卡的顶部竟然没有padding，像是被滚动过了一点一样。要改。然后your seat 这个字不要被灰色阴影遮住。然后打牌界面里，那个当前是第几墩，没必要，应该改为显示，当前是第几个deal，这个要根据用户打的局里面来判断。比如练习11课是 1/1 deal，自由打牌是 x/6 deal，锦标赛是x/6或者x/12」
- 原因：结果出现时把结果内容 `scrollIntoView`，内容比框高，于是框自己也往下滚了一个内边距。改为只把框本身滚进视野。
- 「Your seat」的灰底只去掉表头，分数格保留灰底，仍能看出哪列是自己。
- 第几副：显示在牌桌信息板「Augen」下（原来的「Stich n von 10」处）；侧栏里那个「Stich n von 10」小标签删掉（侧栏已有比赛和自由对局的「Spiel n von x · gesamt」）。好友房间不数副数，那里留空。
