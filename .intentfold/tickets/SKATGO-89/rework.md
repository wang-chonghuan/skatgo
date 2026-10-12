# SKATGO-89 rework

首次交付是 `a68aeee`（handoff.md 冻结在那里）。之后有三轮 rework，每轮一个提交，提交信息就是人的原话。

## 游戏页面的截图

人的原话：「这个页面最好附带一个游戏页面的截图，不要占空间太大，主要是让读者产生直觉」。

- **截图怎么来的**：新增 `.intentfold/tickets/SKATGO-89/table-shot.mjs`，在浏览器里打一局真实的自由对局，叫牌一律 pass，出第一张能出的牌，在第一或第二墩、轮到玩家、中间有牌时截图，再用 `cwebp` 转成 960px 宽的 WebP：`app/public/quick-start-table-{de,en}.webp`，德语页用德语界面的图，英语页用英语界面的图。
- **页面**：图放在引导语下面、第 1 条上面。宽度最多和首页那张图一样（`dims.heroArt`，480px），没有新增设计值；手机上占满阅读栏。图下面一行说明（同时作替代文字）：「So sieht der Tisch bei SkatGo aus: unten deine Karten, in der Mitte der Stich, links und rechts Lina und Noah.」
- **没写图片尺寸**：图片的固有宽高（960×600）没写进代码，因为设计值检查不允许写死数字。代价是图片加载时下面的内容会略微下移。
- **charter**：
  - ui.md：这一页的版面加上了这张图；
  - engineering.md：「Generated, never hand-edited」里登记了这两张图和生成命令。
- **重新检查**：`tmp/picture.mjs`，桌面和手机、德语和英语，图片语言正确、能加载、宽度不超过 480、位置在引导语和第 1 条之间；`check:seo --built` 通过（资源从 46 个变成 48 个）。

## 首页的 5 分钟入口不够明显

人的原话：「主要你学习卡上那个5分钟，看起来不够明显」。

- 首页「Neu beim Skat?」那块的入口，原来是按钮旁边一行带下划线的小字，现在改成和「Lernen starten」一样的白色按钮，两个按钮并排。仍然只对还没学过课的人显示。
- ui.md 跟着改。
- 重新检查：桌面和手机、德语和英语，按钮和「Lernen starten」样式相同，点进去就是这一页。

## 名字改成「速成」

人先问「你这个skat in 5min会被理解成是快速打一盘吗？」，agent 建议改成「Regeln in 5 Minuten」。人又说：「rules会被以为是总结吗，其实就是5分钟速成的意思」。

- 首页按钮改为「5-Minuten-Crashkurs」，英语页是「5-minute crash course」；
- 规则页那行链接改为「Neu beim Skat? Der 5-Minuten-Crashkurs」，英语页是「New to Skat? The 5-minute crash course」；
- 页面标题「Skat in 5 Minuten」和课程页的卡片不变；
- ui.md 跟着改；
- 重新检查：同上，桌面和手机、德语和英语。

## 关闭时一并做的

- **同步 main**：rebase 到最新的 main 时多了 SKATGO-88（自由对局 6 副一轮），两边都改了 charter 和文案文件，Git 自动合并、没有冲突。核对过：两边的文案键都在（各 530 个），charter 里两张工单的内容都在。
- **重新截图**：SKATGO-88 改了自由对局的牌桌，所以在 rebase 后的代码上重新跑了 `table-shot.mjs`。这个窗口大小下牌桌的样子没变，新截的图换掉了旧图。
- **product.md**：交付时请人确认在课程那段补的那一句。人没有反对，予以保留。

## 和冻结的 handoff 相比

- 页面多了一张牌桌截图；
- 首页的入口从一行小字变成按钮「5-Minuten-Crashkurs」；
- 规则页的链接文字改成「速成」的说法；
- 其余不变：十二条原样、牌面配图、地址、三个入口的位置；只有 web 有改动，环境变量没有变化。
