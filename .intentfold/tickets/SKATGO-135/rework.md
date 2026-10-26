# SKATGO-135 rework — 交付后（handoff 冻结于 7d902d5）

八轮，全部来自用户在审查期间的要求，每轮一个提交。`handoff.md` 保持原样；下面是相对它的净变化。

## 1. 删掉首页副标题（0aabdb3）

**用户的要求**：「Play the AI, your friends or the tournament. See how the AI would have played your cards. ===== 这个副标题删了」

**改了什么**：首页 slogan 下的导语（`entry_lead`）删除。首页因此不足 200 字，SEO 检查把首页（自由对局的搜索入口）归入游戏页：大标题外再有一行即可，反向对照改用第一个内容页。charter `ui.md`、`engineering.md` 同步。

## 2. 首页改成卡片（e56edab）

**用户的要求**：「topbar下，先显示slogan，然后显示下面的四个卡片，按我发你的两个响应式版本。四个卡片分别是：1 deal today, free play, learn, practice 长卡片做两个，一个是my progress……一个是 elo ranking，颜色你根据我的设计系统，现有颜色，自己决定」（附两张图）

**改了什么**：slogan 之下，左边四张彩色卡片 2×2（1 deal today 绿、Free play 红、Learn 橙、Practice 藏青），图标在上、标题在下、保留牌面图；右边两张白色长卡片：My progress（账号的曲线，点进 /profile）和 Elo 排行榜。≤1023px 时四张仍 2×2、长卡片在下方全宽。删去 hero 按钮、旧四张卡片（含私人桌）、规则/课程链接行及其文案。新 token：`dims.homeWays`、`homeWaysNarrow`、`homeCard`、长卡片位置、`homeCurve`、`icon.tile`（以人的设计图为批准）。

## 3. 私人牌桌和论坛的图片卡片（53d4df5）

**用户的要求**：「私人牌桌和论坛，用卡片的形式，继续放到下面……私人牌桌的卡片，用老的hero区的插画……论坛的你随便弄个图片就行。本工单改。」（附图）

**改了什么**：下方两张白色图片卡片，与彩色卡片同列：Private table（原 hero 插画）去 /with-friends，Forum 去 /forum；图片在上（16:9，`dims.homePicture`），标题和一行说明在下。

## 4. 图标、游客的进度卡、卡片标题（6626814）

**用户的要求**：「free play的卡片上的机器人图标，换成两个交错的卡牌的图标……progress如果用户没登录，就要显示登录后保存你的表现记录以及ai分析，中间放个登录按钮。」「另外卡片上的字，应该用这种尺寸和粗的字」（附图）

**改了什么**：Free play 图标换成自绘的交错扑克牌（第 6 轮再换）；My progress 游客显示一句话和居中的 Clerk 登录按钮；首页所有卡片标题用新角色 `homeCardTitle`（28px 粗体，手机 22px）。

## 5. 四张卡片的字再大（468d31b）

**用户的要求**：「四个卡片上的字还是太小」

**改了什么**：四张彩色卡片标题用新角色 `homeTileTitle`（36px 粗体，手机 28px）。

## 6. 交叉双剑图标（1db5016）

**用户的要求**：「不要两个交错的牌了，用两个交错的剑吧，x形的，lucid肯定有这个图标」

**改了什么**：Free play 图标改为 lucide 的 `Swords`，自绘图标删除。

## 7. 进度卡的登录文案和按钮（820e922）

**用户的要求**：「my progress的登录文字，最好能提现出进步，提高的意思，但是还是要简洁，然后登录按钮大点」

**改了什么**：“Sign in to track how you improve, with the AI's analysis.” / “Melde dich an und verfolge, wie du besser wirst – mit der Analyse der KI.”；按钮改为大号。

## 8. 论坛卡片的图片和文字（a17d918）

**用户的要求**：「/Users/yong/Downloads/000.jpg 论坛的卡片图片用这个图片，剪裁成合适的，不要加图标。文字换成 news, articles, discussion and feedback」

**改了什么**：人的图片剪裁为 16:9，存为 `app/public/forum-card.webp`（612×344，19 KB），无图标；说明改为 “News, articles, discussion and feedback.” / “Neuigkeiten, Artikel, Diskussion und Feedback.”

## 复验

每轮后：类型检查、设计 token、`tmp/ac.mjs`（首页 1 deal today 卡片在打完前后文字不变、去 /daily，PC/手机、德/英）、改动版式的轮次跑 `check:seo --built` 与 `test:seo`；截图看 PC、平板、手机。合并前在最终分支上跑一次完整机械防线。

## 相对 handoff 的净效果

- 首页：slogan；四张彩色卡片（1 Spiel heute / Freies Spiel / Lernen / Üben，打完后文字不变）；My progress（游客：一句话 + 登录）和 Elo 排行榜两张长卡片；Privater Tisch 和 Forum 两张图片卡片。没有副标题、hero 按钮、链接行，也没有 “Heutiges Ergebnis”。
- SEO 检查：首页与 /daily、/with-friends 同为游戏页。
- 新 token：`dims.homeWays`、`homeWaysNarrow`、`homeCard`、`homeLongColumn`、`homeFullWidth`、`homeRowFirst`、`homeRowSecond`、`homeRowAuto`、`homeCurve`、`homePicture`，`icon.tile`，字体角色 `homeCardTitle`、`homeTileTitle`。
