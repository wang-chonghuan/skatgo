# SKATGO-227 Grill

Grill: self（人：「Yes, add and deploy」，回答 agent 说明完整做法后的提问）。

## Decided for you

1. **位置怎么算？** 卡片在页面上的阅读顺序：1 deal today 1、Free play 2、Learn 3、Ranked match 4，电脑和手机一样（都是两列两行）。由同一张顺序表得出，以后改顺序时位置跟着变。
2. **`button` 怎么处理？** 1 deal today 和 Free play 保留 `primary` / `free`；Learn 和 Ranked match 不带。依据：agent 提议、人同意；旧报表接得上。
3. **线上怎么验收？** 不点击线上卡片（点了会把测试数据发进 PostHog，违反 operations.md Redline 2）。点击统计在本地正式构建上验证；线上只确认部署的是本单的提交、首页外观不变。
