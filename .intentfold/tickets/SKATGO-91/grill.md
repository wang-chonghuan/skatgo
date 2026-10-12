# SKATGO-91 grill

问人一次（2026-10-12），人答：「开发吧，按你推荐的改」。

1. **字号怎么改？** 直接改导语专用的字体角色 `landingHeroLead`（只有首页导语在用），从 28/24px 加粗改到 20/17px、正文粗细。这是 `app/src/theme/` 里的令牌改动，人已明确同意。不换成 `landingBody`，charter 不用改。
2. **文案？** 用工单里的建议：
   - 德文 „Spiel gegen die KI, mit Freunden oder im Turnier – mit KI-Coach.“
   - 英文 "Play the AI, your friends or the community – with an AI coach."

## 返工（人，2026-10-12）：「这样又觉得太短太淡了，而且要强调每副牌都可以与AI比较，谁打得更好。再想想文案，以及我讨厌连字符」
- 文案改成两句，第二句讲每副牌都和 AI 比、谁打得更好；去掉破折号和 „KI-Coach“ 的连字符：
  - 德文 „Spiel gegen die KI, mit Freunden oder im Turnier. Nach jedem Spiel vergleichst du dich mit der KI: Wer hat besser gespielt?“
  - 英文 "Play the AI, your friends or the tournament. After every deal, compare yourself with the AI: who played it better?"
- 不那么淡：`landingHeroLead` 改为 22/18px、`weight.ui`（600），仍比原来 28/24px、700 小。
- 人：「可以，但是我觉得字重不够，有点淡」→ 字重回到加粗 700，字号仍是 22/18px。
