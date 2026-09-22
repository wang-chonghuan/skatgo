# SKATGO-11 handoff — 聊天区留三个点，发送按钮改为不可用

首次交付基线。cap3 自主开发，Grill 自行裁决（用户的话已把要什么说死，无设计空间）。Finish: review——服务留在本机等用户过目。

本单纠正 SKATGO-10 的理解错误：当时把「发送按钮上的三个点」听成了「聊天区的三个点」，删错了对象。

## What changed

只改 `app/src/components/skat/ask.tsx`：

- **聊天区的三点等待气泡回来了**：`displayLoadingBubble` 恢复开启，`messageStyles.loading` 的气泡样式放回（含 `padding: 10px 1.08em 10px 1.63em`——三个点的视觉中心比盒子中心偏左 0.275em，这个 padding 把左右补平）。
- **按钮上的三个点没了**：deep-chat 在加载态渲染的是 `<div class="loading-submit-button">`（那三个点）。用它自己的 `submitButtonStyles.loading.svg.content` 换成与可发送态相同的纸飞机 svg（照抄它的标记，`stroke="currentColor"`，无颜色字面量），压暗到 0.45；容器沿用 SKATGO-10 的不可用外观：paperEdge 底、`cursor: not-allowed`。

没有用 `auxiliaryStyle` 写 CSS 去藏那三个点——那等于给页面加第二份样式表，ui.md Redline 3 禁止。

## AC results（`tmp/ac.mjs`，Playwright headed，对已构建的服务 :55011；9/9）

1. 等待期间聊天区有三点气泡 — PASS。
2. 气泡左右留白一致 — PASS：左右均 13.95px。
3. 按钮里没有 `.loading-submit-button`，有 svg — PASS。
4. 按钮等待时呈不可用 — PASS：可发送 `rgb(224,169,46)`/pointer，等待 `rgb(221,208,179)`/not-allowed。
5. 回答到达后按钮恢复，再问一句能得到第二个回答 — PASS。
6. `/en/lesson/4`、`/de/lesson/4`、`/zh/play` 三处一致 — PASS。

机械防线通过（typecheck、build、62 个测试、客户端包检查、样式 grep = 1、SSR 链接）。

## Deviations from plan.md

无。

## Environment

- 端口：web **55011**（本机仍在跑：http://localhost:55011/zh/lesson/4）。
- env 键无增减。

## Residual

- 线上（skatgo.com）此刻仍是 SKATGO-10 的错误版本：聊天区没有三个点、按钮上有。本单合并部署后才纠正。
- deep-chat 的加载态按钮仍没有 `aria-disabled`（空输入时它自己会加）。无障碍语义上的 disabled 需要改第三方组件或自绘按钮，未做。
