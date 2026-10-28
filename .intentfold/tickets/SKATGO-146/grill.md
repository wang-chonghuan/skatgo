# SKATGO-146 grill

## 替你决定的

1. **手机放不下时：** 弹层内容可以滚动，"Next deal" 按钮固定在弹层底部，始终看得见。依据：工单的重点是字号和三家得分；
   把手牌换成文字牌名会丢掉 SKATGO-145 里人逐条调过的那一墩的样子。可以直接看截图判断（不满意就返工）。
2. **区块标题**（Bidding、Biggest difference from the AI）用 `appBtnStrong`（16 粗），不用 14 的 `panelLabel`，避免再有 16 以下的字。
3. **三家得分**：名字在上（`appText`，灰），分数在下（`appBtnStrong`，深蓝），你那格白底圆角（沿用旧计分表标自己那一格的做法，在浅绿/浅粉卡片上看得见）。
4. **You/AI 标签**保持 `badge` 样式（工单 AC1 已排除）。
