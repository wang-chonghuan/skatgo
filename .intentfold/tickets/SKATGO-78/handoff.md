# SKATGO-78 handoff

本单经开放开发阶段完成。本文件记录交付了什么、怎么验证。

## 改了什么

- **`app/src/lib/skat/rules/content.en.ts`**（英语规则页）：
  - Jack(s) 改为 Bube / Buben，Queen 改为 Dame；
  - ♣J 这类写法改为 ♣B；
  - 牌序「K, Q」改为「K, D」；
  - 开头介绍牌的地方加一句：Bube (B) 就是国际扑克牌的 Jack (J)，Dame (D) 就是 Queen (Q)。
- **`app/src/lib/skat/rules/summary.en.ts`**（可打印的英语规则摘要）：同样改，第一次提到 Buben 处注明「B, the Jacks of an international deck」。
- **`app/public/downloads/skat-rules.pdf`**：用 `make-printables.mjs` 从正式构建的页面重新生成。另外三个 PDF 也被重写了，但只是字节变化，内容没变，已还原。

## AC 结果

1. **通过**：在正式构建的网站（55078）上读 `/en/rules` 和 `/en/rules/printable` 的页面文字，除首次出现处的括注外，没有 Jack、Queen、♣J 这类写法（`tmp/ac.mjs`）。重新生成的 PDF 文字里也是 Buben、Bube、♣B。
2. **通过**：两页第一次提到这两张牌时，都有对应 J、Q 的说明。

**机械防线**全部通过：typecheck、build、test、bundle、tokens、literal grep、SSR、`check:seo --built`、`test:seo`（25/25）。

## 偏差

无。

## 环境

- **端口**：web 55078。
- **env 键**：没有改动。

## 遗留

无。
