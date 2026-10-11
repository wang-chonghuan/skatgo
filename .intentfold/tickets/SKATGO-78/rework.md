# SKATGO-78 rework

相对冻结的 handoff，有一轮返工。

## 第 1 轮：「规则页里，要写清楚这个对应关系，因为看规则的人往往只知道J，Q」

- **英语规则页**：「Cards and card points」一节开头单独加了一个块：
  - 先说一句：桌上和锦标赛用牌用德语字母写两张人头牌；
  - 再逐条列出：B = J（Bube 就是 Jack，♣B 就是梅花 J）、D = Q（Dame 就是 Queen，♠D 就是黑桃 Q）、K 和 A 两种牌相同；
  - 原来接在段尾的那句说明删掉了，换成这个块；
  - 讲将牌顺序处补上「(the four Jacks)」。
- **可打印摘要**：「Trumps and following suit」第一条改为「B = J (Bube = Jack) and D = Q (Dame = Queen); K and A are the same as in an international deck.」。
- **PDF**：`skat-rules.pdf` 重新生成，仍是两页。
- **重新检查**：
  - 两页文字：除对照说明外，没有其他 Jack、Queen、J、Q 写法；
  - 截图：`tmp/rules-mapping.png`；
  - 规则单元测试：5 个通过；
  - 合并前同步 main 后，机械防线重跑一次。
- **净效果**：对应关系从段尾的一句话，变成规则页开头一个醒目的对照块。
