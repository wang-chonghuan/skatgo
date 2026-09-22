# SKATGO-10 plan — 等待回答时禁用发送按钮，去掉三点气泡

## 观察到的现状（工单没说的部分）

在 55010 上对已构建的应用实测，发送按钮有三种状态，都是 deep-chat 自己切的 class：

| 时机 | class | 现在的样子 |
|---|---|---|
| 输入框为空 | `disabled-button`，`aria-disabled="true"` | 我们给的 `submitButtonStyles.disabled`：paperEdge 底 |
| 等待回答 | `loading-button` | 我们给的 `submitButtonStyles.loading`：brassSoft 底，和"可按"太接近 |
| 可以发送 | `submit-button` | brass 底 |

**等待期间再按 Enter 不会发出第二次请求**——deep-chat 自己拦住了，实测发出的 POST 始终是 1 次，输入框里的文字也还在。所以工单的第 1 条验收，"不会发出第二次请求"这一半已经成立；缺的是"看得出不可用"。

三个点来自 `displayLoadingBubble`。

## 路线

`app/src/components/skat/ask.tsx` 一个文件：

1. 去掉 `displayLoadingBubble`（默认 false）。
2. `submitButtonStyles.loading` 改成和 `disabled` 一样的外观：paperEdge 底、图标压暗、`cursor: not-allowed`；尺寸不变，避免跳动。三处（submit / loading / disabled）的圆形尺寸抽成一个常量，免得以后改一处漏两处。

不新增依赖，不动服务端，不动其他组件。

## 验收

按 ac.md，在 55010 上用 Playwright 跑；不打牌。
