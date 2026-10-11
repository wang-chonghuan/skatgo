# SKATGO-81 rework

首次交付是 `a06d322`（handoff.md 冻结在那里）。之后有一轮 rework。

## `f9e5035` Saldo 全部移除

起因：人问「打牌打完，显示的也不是saldo了？」，agent 说明记分单最右边还留着 Saldo 一列作参考。人的原话：「saldo都移除吧」。

- **记分单**（`ScoreSheet`）：删掉 Saldo 一列、「Saldo ?」按钮和说明文字。每副的记分单和整个赛的记分单都只剩「Dein Platz / Lina / Noah」三列。
- **代码**：
  - 删掉 `tournament.ts` 的 `saldo()` 函数；
  - 删掉 `DealVsAi` 上的 `data-saldo-*` 属性；
  - 删掉 Saldo 用的样式（`saldo`、`saldoWhy`、`sheet`）；
  - 删掉文案 `daily_saldo`、`daily_saldo_note`；
  - 把注释里关于 Saldo 的说法一并改掉。
- **charter**：
  - product.md：不再提 Saldo，写明只有 Seeger-Fabian 总分这一个指标；
  - ui.md：`ScoreSheet` 写明三列分数旁边没有别的数；
  - engineering.md：`tournament.ts` 的职责里去掉 Saldo。
- **重新检查**：`tmp/ac81.mjs`，桌面和手机，全部通过。
  - AC3 改成：记分单只有三家的三列，`/daily` 页面上任何地方都没有「Saldo」；
  - 结算检查新开了测试玩家，结算界面的赛况是「Nach 2 von 6 Spielen: Punkte 0 · AI +170」，和数据库算出的一致，也没有 Saldo；
  - AC1、AC2 照常通过；
  - `tmp/sheet-shot.mjs` 单独截了两张记分单的图，确认版面正常；
  - typecheck（app 和 multiplayer）、build、design tokens、literal grep 都通过。

## 和冻结的 handoff 相比

- handoff 里「记分单保留 Saldo 一列作参考」不再成立：Saldo 已经从产品、代码和 charter 里全部移除。
- 其余没变：排名和各处比较都用 Seeger-Fabian 总分；不改表结构；环境变量没有变化。
- 上线顺序仍是先部署 web，再部署 multiplayer，理由见 handoff。
