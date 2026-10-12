# SKATGO-93 acceptance checks

构建产物 web 55093，Playwright 有头浏览器，桌面 1280×820、手机 375×812。用 localStorage 写入两课已学完（不打牌）。

## AC1 ✓ 行没有连字符
- 德文首页 `/` 的 ✓ 行三项是「Kostenlos」「Ohne Anmeldung」「Analyse mit KI」，整行没有 `-`；英文 `/en` 仍是 "AI analysis"。

## AC2 首页课程卡没有进度小字
- 学过两课时，德文 `/` 和英文 `/en` 的课程卡里没有 „von 11 Lektionen geschafft“ / "of 11 lessons done"；继续学习按钮（„… Lektion 3“ 一类）和 5 分钟速成按钮都在。

## AC3 课程页进度还在
- 同一状态下，`/de/kurs` 和 `/en/course` 的进度卡显示 „2 von 11 Lektionen geschafft“ / "2 of 11 lessons done"。
