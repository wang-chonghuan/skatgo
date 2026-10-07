# SKATGO-52 plan

## 代码里已有、工单没说的

- 每节课的标题、描述、h1 和导语都在 `app/src/lib/skat/lessons/guide.{de,en}.ts`，服务端渲染（SKATGO-29）。
  - 标题由模板 `lesson_meta_title`「{question} – Skat-Lektion {n} | SkatGo」拼出，只能改 `question`。
  - 导语受 `rules.test.ts` 约束：100–200 词，不得出现「daily / Turnier」等词。
- slug 就是网址。改 slug 等于换网址，旧网址会变成 404（没有旧 slug 的跳转表）。
- 已被别的页面占用的词：
  - 规则页：Skat Regeln、Grand / Null ouvert / Ramsch 的锚点（只在描述里）；
  - 课程页：Skat spielen lernen、für Anfänger；
  - 叫牌表：Reiztabelle、Reizwerte；
  - 打牌页：kostenlos spielen、gegen den Computer。
- 第 7 课现在的标题含「die Reizwerte」，和叫牌表的标题撞词。
- 每节课的预览图按 h1 生成（`og/lesson-<n>-<locale>.png`）。
- 人追加：本单同时更新 SKATGO-48 留下的三处 charter 过时（product.md、engineering.md、ui.md），人已授权。

## 路线

1. `guide.de.ts`：11 节课的 question、h1、description、intro 按 grill 第 1 题的对照表改；intro 保持 100–200 词，内容只写课程里真的教的东西。
2. 第 10 课导语改成承接「Skat Tipps / Todsünden / Tricks」：列出这节课教的几条典型错误（Todsünden），都来自课程内容。
3. `guide.en.ts` 第 1 课改成英文入口：「How to play Skat」+「Skat card game」。
4. slug 不变。
5. 重新生成 h1 改了的课程预览图，用 SKATGO-50 的 `og.mjs`。
6. charter（人授权）：
   - product.md 每日赛那句改为 SKATGO-48 的对比；
   - engineering.md 写明 `DealSummary.detail`；
   - ui.md 组件表加 `VsAiTable`。
7. handoff 附「目标词 → 页面」对照表。

## Redline 查对

- ui.md Redline 1–4：不涉及（不动 theme，不新增值）。
- engineering.md：
  - Redline 4、5：不涉及（不加路由，不手改生成文件）；
  - Redline 3：不加依赖；
  - Redline 7：不放宽检查。课程导语照旧守住 100–200 词和禁词。
- product.md Redline 2（编辑 product.md 需人批准）：人在开工时已明确要求，已记在工单评论。
- operations.md：不涉及（不碰生产数据）。
