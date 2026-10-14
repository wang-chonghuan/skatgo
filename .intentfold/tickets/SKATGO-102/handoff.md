# SKATGO-102 handoff

## 改了什么
- **四种新牌背**：用原牌背的同一个图像模型（Azure OpenAI `gpt-image-2`）按原版风格生成，纹样更疏、铺满整张，中间一个小圆章。
  - 四种配色：炭黑配白、海军蓝配白、酒红配白、墨绿配金。
  - 圆章里贴 SkatGo logo，用牌背本身的另一种颜色，尺寸很小。
  - 原图转成 5:7 时，上下只裁去一半的差，另一半靠横向拉宽约 3.6%，保住边缘的花纹。
- **设置**：新增「Kartenrücken」，可选原版和这四种，选择记在本浏览器。默认仍是原版。所有牌背都画在牌的白框里。
- **出处**：原图和生成参数在 `app/brand/cards/masters/`，提示词在 `prompts/`，`PROVENANCE.md` 加了一节，`calls.txt` 记了 4 次调用。
- 中间试过的免费候选和 agent 自己画的几何牌背都已删除，使用条款没有变化。
- **charter**：ui.md 的牌背描述，engineering.md 加一行牌背文件。

## 验证
- 完整机械检查全过：typecheck、build、单元测试 124/124、client bundle、设计令牌、git grep、SSR、SEO（46 页）、SEO 测试 25/25。
- 浏览器 `tmp/ac.mjs` 16 项全过（桌面、手机）。

## 之后
人说之后再考虑是否精修，比如某张重新生成，或调 logo 大小。
