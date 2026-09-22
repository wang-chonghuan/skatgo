# SKATGO-10 handoff — 等待回答时禁用发送按钮，去掉三点气泡

首次交付基线。cap3 自主开发，Grill 自行裁决（用户本会话授权）。本次运行的 Finish 由 `review` 改为 **auto-deploy**（用户 2026-09-22「同意，开始，做完部署」，已在工单评论记录）。

## What changed

只改一个文件：`app/src/components/skat/ask.tsx`。

- **三个点没了**：`displayLoadingBubble={false}`。原先只是漏写了值，属性的默认就是开；等待时的三点气泡样式一并删掉，没有东西再用它。
- **等待时按钮看得出按不动**：`submitButtonStyles.loading` 改成与 `disabled` 同一套外观——`skat.paperEdge` 底、图标压到 0.45、`cursor: not-allowed`；三种状态的圆形尺寸抽成一个 `sendButton` 常量，颜色仍只用既有 token。
- **每个状态都写全颜色和光标**：deep-chat 把每个状态的样式叠加在前一个上，不重置没写的属性——`loading` 设了 `not-allowed` 之后，回到可发送状态时光标仍是 `not-allowed`（验收第一轮就是这么红的）。现在 `submit` 明写 `pointer` 和图标透明度 1，`disabled` 明写图标透明度，状态之间不再互相渗。

**没有改的**：等待期间本来就发不出第二个请求——deep-chat 自己拦着，实测按 Enter 时 POST 数不变。工单第 1 条验收的这一半原本就成立。

## AC results（`tmp/ac.mjs`，Playwright headed，对已构建的服务 :55010；9/9）

1. **等待期间没有三点气泡** — PASS。
2. **等待期间按钮呈不可用** — PASS：可发送 `rgb(224,169,46)` / `pointer`，等待中 `rgb(221,208,179)` / `not-allowed`。
3. **等待期间再按 Enter 不发第二次请求** — PASS：POST 恒为 1。
4. **等待期间输入框仍可输入** — PASS：输入的文字读得回来。
5. **回答到达后按钮恢复** — PASS：回到 brass + pointer；再问一句得到第二个回答（POST = 2）。
6. **三语与对局页一致** — PASS：`/en/lesson/4`、`/de/lesson/4`、`/zh/play` 等待期间均无气泡、按钮均 `not-allowed`。

机械防线通过（typecheck、build、62 个测试、客户端包检查、样式 grep = 1、SSR 链接）。

## Deviations from plan.md

无。计划里预判的两处改动就是实际改动，外加发现并修掉"状态样式互相渗"这一条。

## Environment

- 端口：web **55010**（本机仍在跑，供查看）。
- env 键无增减；`app/.env` 从主检出复制，未提交。

## Residual

- **等待时的按钮和"输入框为空"时长得一样**（都是 paperEdge + not-allowed），这是工单要求"不另加转圈、骨架屏或文字"的直接后果：发出问题后输入框清空，按钮本来就变灰，于是等待期间没有独立的"正在处理"信号，回答直接出现。若要把两者区分开，可以给等待态单独一档颜色，属另开工单的小改动。
- deep-chat 的加载态按钮没有 `aria-disabled`（空输入时它自己会加）。要的若是无障碍语义上的 disabled，需要改第三方组件或自绘按钮，本单未做。
