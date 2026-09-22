# SKATGO-11 plan — 聊天区留三个点，发送按钮改为不可用

## 观察到的现状

实测 55011（当前 main，即 SKATGO-10 之后）：

- 聊天区的三点等待气泡被 SKATGO-10 用 `displayLoadingBubble={false}` 关掉了。
- 发送按钮在等待时渲染的是 `<div class="loading-submit-button">`——那三个点就在按钮里；可发送时渲染的是 `<svg id="submit-icon">` 纸飞机。

用户要的正好相反：气泡留下，按钮上的点去掉。

## 路线

`app/src/components/skat/ask.tsx` 一个文件：

1. `displayLoadingBubble` 恢复开启，并把 SKATGO-10 删掉的 `messageStyles.loading` 气泡样式放回来（含当时调好的 `padding: 10px 1.08em 10px 1.63em`，让三个点左右留白一致）。
2. 按钮加载态用 deep-chat 的 `submitButtonStyles.loading.svg.content` 换成与可发送态相同的纸飞机 svg，压暗到 0.45；容器保持 SKATGO-10 的不可用外观（paperEdge 底、`cursor: not-allowed`）。svg 用 `stroke="currentColor"`，不含颜色字面量。

不碰第三方组件内部，不加依赖，不动服务端。

## 验收

按 ac.md 在 55011 上跑；不打牌。
