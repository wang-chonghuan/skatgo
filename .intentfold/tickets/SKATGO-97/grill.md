# SKATGO-97 grill

人的话已说清楚（「开工单……开工单修」），没有要问的。agent 定的：
- 删掉的是定约弹窗的 `declare_prompt`（德英）。第 5 课正文里的「③ Sag dein Spiel an.」是课程内容，不动。
- 对齐的做法：信息板格子里标签下 4px（`boardLabel` 下边距 2px + 间距 2px），数字下 2px，与「Gesamt」格子里数字和名字之间的 2px 一致。「Reizwert」下的「Reizen」、「Alleinspieler」下的「Reizwert n」也随之上移 2px。

## 追加（人）
「改名字change的按钮改为绿色，否则太不明显」→ 每日赛结果处「Ändern」从 `quiet` 改为 `go`（绿色）。charter ui.md 第 245 行写的是 `quiet` "Ändern"，charter 归人管，未改，待人决定。

## 追加 2（人）
「名字和改名字的那一行，放到排行榜第一行。然后首页play today's tournament按钮改成我们按钮的标准绿色」
- 名字那一行从「Dein Ergebnis」面板移到排行榜面板最上面，在「Rangliste · Heute」之前。
- 公开站点的绿色按钮（`landing` 形状的 `go`）原来用 `color.goLanding` #00A878。只有三处在用：首页「Heute spielen」，每日赛页上的两个「Heute spielen」。三处都改成应用的标准绿色 `color.go` #00A336，免得从首页到每日赛页绿色变了。`goLanding`、`elev.btnGoLanding` 不再有人用，暂留，待人决定。
