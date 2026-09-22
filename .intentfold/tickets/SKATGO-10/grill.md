# SKATGO-10 grill（自行裁决）

用户 2026-09-22 说「同意，开始，做完部署」，并在本会话中已授权由我自行回答 grill 的问题。依据只有 charter 与实测。

1. **前提成立吗？** — 成立。实测 55010：等待期间 deep-chat 把按钮切到 `loading-button` 并拦下第二次提交（POST 恒为 1），三个点来自 `displayLoadingBubble`。两处都可以只靠现有的 `submitButtonStyles` / 属性解决，不必碰 deep-chat 内部。
2. **"按钮 disable"是要真的 disabled 属性吗？** — deep-chat 的按钮是 `role="button"` 的 div，空输入时它自己加 `aria-disabled="true"`；加载态它不加，且属性不可由外部控制。工单验收要的是"按下去不发第二次请求"（已成立）加"外观看得出不可用"，因此按外观与光标实现，不追求 DOM 属性。若用户要的是无障碍语义上的 disabled，那需要改第三方组件或自绘按钮——这属于只有人能拍板的取舍，若被提出则停下来问。
3. **去掉三个点后用什么表示"在等"？** — 只有按钮的不可用外观，这是工单 Constraints 自己写死的（不另加转圈、骨架屏或文字）。
4. **颜色从哪来？** — 复用 `skat.paperEdge`（已用于 disabled 态）与 `skat.brass`，不新增 token、不写颜色字面量（ui.md Redline 1、3）。
5. **会不会影响别处？** — 只改 `ask.tsx` 里给 deep-chat 的样式常量与一个属性，其他组件不受影响；服务端不动。
6. **红线查了吗？** — ui.md：不新增 token、不写死颜色、不引入第二份样式表（用的是 deep-chat 现有属性）；engineering.md：不加依赖、不碰生成文件、不削弱检查；operations.md：本单只改前端，部署照 charter 流程走。均无冲突。
