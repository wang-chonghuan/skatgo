# SKATGO-11 grill（自行裁决）

本单是纠正 SKATGO-10 的理解错误，用户的话已经把要什么说死了，没有留给我判断的设计空间。依据是 charter 与实测。

1. **前提成立吗？** — 成立。实测：气泡由 `displayLoadingBubble` 控制；按钮加载态渲染 `.loading-submit-button`（三个点），可发送态渲染 `<svg id="submit-icon">`。deep-chat 的 `submitButtonStyles.loading.svg.content` 可以替换按钮内容，无需改第三方代码。
2. **图标从哪来？** — 照抄 deep-chat 自己的 submit 图标标记，两态因此完全一致；`stroke="currentColor"`，不含颜色字面量，不触 ui.md 的 grep。
3. **气泡的左右留白** — 沿用 SKATGO-10 之前调好的 `padding: 10px 1.08em 10px 1.63em`（三个点的视觉中心比盒子中心偏左 0.275em）。
4. **为什么不是用 auxiliaryStyle 写 CSS 把点藏掉？** — 那等于给页面加第二份样式表，ui.md Redline 3 禁止；用组件自己的属性是干净路径。
5. **红线** — 不新增 token、不写死颜色、不加依赖、不碰生成文件、不削弱检查：均满足。
