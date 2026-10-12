# SKATGO-92 acceptance checks

在构建产物上跑：web 55092。桌面 1280×820 和手机 375×812、德语和英语都检查。用 `tmp/ac92.mjs`：学过课的情况，是在浏览器里写入「学完第 1 课」的进度来模拟的。

1. **第一次来的人**：学习卡上有「Lernen starten」「5-Minuten-Crashkurs」两个按钮，没有进度。
2. **学过课的人**：学习卡上有「Weiter mit Lektion 2」「5-Minuten-Crashkurs」两个按钮，还有「1 von 11 Lektionen geschafft」。
3. **点按钮**：两种情况下点「5-Minuten-Crashkurs」都进入 5 分钟速成页，德语是 `/de/kurs/skat-in-5-minuten`，英语是 `/en/course/skat-in-5-minutes`。
