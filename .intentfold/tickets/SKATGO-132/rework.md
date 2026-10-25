# SKATGO-132 rework — 交付后（handoff 冻结于 e74d932）

十四轮，全部来自用户在验收期间的要求，每轮一个提交。`handoff.md` 保持原样；下面是相对它的净变化。

## 1. 白底卡片、三家分数、不显示 AI（cad5db1）

**用户的要求**：「非常丑。我建议分享的卡片，就显示三家的fabian分数，不要显示ai的，邀请看到的人来打同一副牌，要让玩家有能得瑟的地方，然后要白底，不要绿底，你本工单改」

**改了什么**：`card.ts` 重画为白底、顶部绿条、三家 Seeger-Fabian 分数（自己一行绿框）、邀请语；去掉 AI 分与牌背。`dod_shares` 存三家分数（及当时名次，见第 3 轮去掉）。分享页、分享文案同步，不再出现 AI。

## 2. 给用户看的都用英文（4c8eab6）

**用户的要求**：「你改charter以后让我审查任何东西，都是英文，我不看的德文」

**改了什么**：`charter/operations.md` Guidance 加 "Show the human English"。

## 3. logo 放大、去掉排名、declarer 黄色徽章（19f59e1）

**用户的要求**：「logo大一点，不要显示排名，declarer的名字后跟一个declarer的标志，黄色badge形式」

**改了什么**：卡片 logo 60→88px；去掉名次徽章；庄家名字后加 `amber` 徽章 "Declarer"/"Alleinspieler"（文字宽度由 resvg 自己量）。`dod_shares` 改存 `declarer`，不存名次。分享页同样去名次、加小号 amber 标签；分享文案与页面描述去名次。

## 4. 新 slogan，并放上卡片（76471d7）

**用户的要求**：「slogan换成 free skat play and progress, 还要放到卡片上，本工单改」

**改了什么**：`entry_title` 英文 "Free Skat play and progress"、德文 "Skat kostenlos spielen und besser werden"；卡片品牌旁加 slogan；首页链接预览图 `og/home-{en,de}.png` 用 SKATGO-50 的 `og.mjs` 重画。charter `ui.md` 记下新 slogan。

## 5. 邀请语不换行（ed8ae1a）

**用户的要求**：「妈的这里换行干什么」

**改了什么**：竖版卡片的邀请语改为一行，字号按宽度缩放。（竖版卡片在第 12 轮删掉。）

## 6. 邀请语改为"你能得几分"（682365f）

**用户的要求**：「我觉得不要说can you beat me，应该说试试你能得几分，同类意思，你想个合适和简洁的」

**改了什么**：卡片与分享文案 "Same cards – what will you score?" / "Gleiche Karten – wie viele Punkte holst du?"。

## 7. 品牌字加 .com（40e2624）

**用户的要求**：「卡片的logo文字后面加上.com」

**改了什么**：卡片品牌字 "SkatGo.com"。

## 8–9. 卡片地址带版本号，随即撤回（5a4cef6，5feb9d7）

**用户的要求**：「缓存了，预览不了」，随后「他妈的以后每次分享都带个版本号，傻逼吗？」

**改了什么**：第 8 轮给卡片地址加了 `?v=`；第 9 轮整轮撤回，代码与第 8 轮之前相同。净变化：无。

## 10. 强调 "1 deal today"（df9fea6）

**用户的要求**：「1 deal today 这个字应该强调我认为，否则看到的人不知道能要打几副。你独立深度思考……」

**改了什么**：卡片上 "1 deal today · 2 min" / "1 Spiel heute · 2 Min." 画成首页那颗绿按钮的样子，放在分数正上方，日期灰字在旁。

## 11. 平台图标，去掉 Instagram 与下载图片（1c2747e）

**用户的要求**：「大错特错，你他妈的连这几个平台的logo都没有。然后picture不要了，不分享instagram。全部都要图标，返工」

**改了什么**：新增 `brand-icon.tsx`——WhatsApp、Facebook、Telegram、X 的标志（Simple Icons 16.36.0 的图形，CC0，内嵌，无新依赖），品牌色入 `color.stylex.ts`；分享主按钮用 lucide `Share2`，复制链接用 lucide `Link`。去掉 Instagram 按钮、"Bild herunterladen" 及其 `download` 和文案。

## 12. 去掉排名行，分享按钮下显示待分享的卡片（fc8cf69）

**用户的要求**：「1 played today · you're #1 这个不要显示。然后最好让用户看到待显示的卡片，再可以点发送，分享按钮可以在页面上面显示，下面是待分享的卡片」

**改了什么**：结果页去掉 "n played today · you're #k"（`dod_rank`）；分享按钮下显示卡片（最宽 600px，细边框）。为了让看到的就是发出去的：手机系统分享改为只发文字和链接；竖版卡片不再使用，删除；卡片地址改为 `/api/card/<code>-<lang>.png`。

## 13. 结果页的文案（eee95a9）

**用户的要求**：「妈的我不懂你显示这些垃圾干什么 我觉得你应该显示: 你完成了same one deal today, 分享给朋友，看看他们能打几分。大概是这个意思。你的文案太垃圾了」

**改了什么**：结果页去掉 "Your deal today" 与 You/AI 分数，改为 "You've finished today's deal" / "Your friends get the same cards – see what they score."，按钮 "Share with friends"；德文 "Du hast das Spiel von heute gespielt" / "Deine Freunde bekommen dieselben Karten – schau, wie viele Punkte sie holen." / "Mit Freunden teilen"。

## 14. 去掉 /daily 标题下的介绍（a844d01）

**用户的要求**：（粘贴该段）「你显示着一坨垃圾干什么啊我操」

**改了什么**：删掉 `daily_static_lead`（两种语言）与它的段落。

## 复验

每轮后跑受影响的检查：类型检查、设计 token、分享单元测试、`tmp/ac.mjs`（最后一轮全部通过，含新加的"无排名行""卡片在按钮下且加载""每个按钮带图标"三项）；改 slogan 与删介绍两轮另跑了 `test:seo`（28 通过）与 `check:seo --built`；第 12 轮跑了 `npm --prefix multiplayer run check`（30 通过）。合并前在最终分支上跑一次完整机械防线。

## 相对 handoff 的净效果

- 卡片：白底，一个尺寸 1200×630；SkatGo.com + slogan、绿色 "1 deal today · 2 min"、日期、分数、三家分数（庄家黄色徽章）、"Same cards – what will you score?"；无 AI、无名次、无牌背、无竖版。
- `dod_shares`：(code, day, player, scores, declarer, created_at)；无 AI、无名次。
- 结果页：完成说明 + "Share with friends" + 四个平台（带标志）+ 复制链接 + 卡片预览；无分数、无排名、无 Instagram、无下载。
- 分享页：三家分数，庄家标签，无名次、无 AI。
- 首页 slogan 与其链接预览图换新；/daily 标题下无介绍。
