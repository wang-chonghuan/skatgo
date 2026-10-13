# SKATGO-100 handoff

## 改了什么
- **恢复连字符**：「KI-Analyse」、「5-Minuten-Crashkurs」/「5-minute crash course」（按钮和规则页链接）、「No sign-up」、隐私说明「Free-play」/「Spiel-Token」。首页导语不动。
- **首页导语第二句**：德文 „Nach jedem Spiel siehst du, wie die KI deine Karten gespielt hätte.“，英文 "After every deal, see how the AI would have played your cards."。
- **信息板不再溢出**：
  - Hand、Ouvert 在定约名下面的小字行；
  - 长名字换行，小字行以省略号结尾；
  - 总分等宽三列，手机上数字随屏宽变小，四位数时再小一号；
  - 新令牌 `infoTotal`、`infoTotalLong`、`fBoardTotal`、`fBoardTotalLong`、`dims.boardTotals`。
- **跳叫按钮**：玩家的动作等服务器回复期间，牌桌不再留着失效的动作按钮（原来点了没反应，回复一到就消失）。规则上只有报数的一方能跳叫，不变。
- **打牌记录**：「Deine Hand」默认收起，点一墩显示它的，只显示一个，点别处收起。
- **顺带修的**：结果弹窗原来盖住右上角的退出按钮。现在按钮在弹窗之上，弹窗下移让位，桌面上侧栏固定时它仍在牌桌的右上角。新令牌 `dims.feltCell`、`dims.scrimTop`、`dims.scrimTopPhone`。
- **charter**：product.md、ui.md 中与上述矛盾的描述。

## 验证
- 完整机械检查全过（单元测试 124、SEO 46 页、SEO 测试 25、multiplayer 21）。
- 浏览器验收见 ac.md，全部通过。

## 部署
只改网页，multiplayer 不动。
