# SKATGO-76 课文修改清单

每一条：位置、用户原话、改成了什么。交接时在运行中的网站上逐条核对。

## 1. 牌名统一用 B、D，并注明对应国际扑克牌的 J、Q

- **用户原话**：「所有课文里，都要用法式牌的那个B，D这种叫法，要注明对应国际扑克牌里的J Q啥的，先改这个」
- **追问后的决定**：英语课文也用德语名 Bube / Dame（复数 Buben / Damen），字母用 B / D。
- **改动**：
  - **德语第 1 课「32 Karten」**：删掉过时的说法「本课程的牌印的是英文字母 J、Q」（SKATGO-66 起默认牌就印 B、D）。改为两句：
    - 牌上印的就是 B、D、K、A（德国锦标赛用牌）；
    - 国际扑克牌上对应 J (Jack)、Q (Queen)，即 B = J、D = Q。
  - **英语第 1 课「32 cards」**：新加一段：
    - B 就是 Bube，即国际扑克牌的 Jack (J)；D 就是 Dame，即 Queen (Q)；
    - 德国牌桌上听到的就是 Bube、Dame，所以课程也这么叫。
  - **英语全部 11 课课文**（`content.en.ts`）：
    - Jack(s) 改为 Bube / Buben，Queen 改为 Dame；
    - ♣J、♠Q 这类写法改为 ♣B、♠D；
    - 牌序「A, 10, K, Q, J」改为「A, 10, K, D, B」；
    - 选择题的选项 'Q'、'J' 改为 'D'、'B'。
  - **英语练习的讲解和提示**（`messages/en.json`，22 条）：
    - 牌的字母和名字（`rank_letter_*`、`rank_name_*`）；
    - 练习讲解、提示和出错提示（`drill_*`、`ex_play_illegal_jack`）；
    - 叫牌时的提示（`declare_*`）。
    - 这些也会出现在自由对局的提示里，与牌面上的 B、D 一致。
  - **英语课程页开头的介绍**（`guide.en.ts`）：同样改成 Bube / Dame、B / D。为了搜索，以下位置在首次出现处保留英文名：
    - 第 1 课介绍：Bube (the Jack)、Dame (the Queen)；
    - 第 3 课标题：The Buben (Jacks)；
    - 第 3 课页面大标题：four Buben (Jacks)；
    - 第 3 课描述：Buben (the Jacks)；
    - 第 2 课描述：Dame (Queen) 3, Bube (Jack) 2。
  - **两个课文文件开头的注释**：同步说明这个规则。
- **没改的**：
  - 给规则引擎的牌面记号 `cards('H:7 8 9 10 J Q K A')`：那是程序内部写法，不显示给学员；
  - 德语课文其余部分：原来就用 B / D 和 Bube / Dame。
