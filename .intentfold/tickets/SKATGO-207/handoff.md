# SKATGO-207 handoff

## What changed

- `app/src/lib/skat/league.ts`：新增 `BRONZE_FLOOR = 0`；`standingAfter` 在青铜里分数下限从 −20 改为 0。其他档不变：到 −20 降一档，从 0 开始。
- `app/src/components/skat/league.tsx`：联赛卡片的进度条从所在档的下限算起，青铜从 0 到 +30，其他档从 −20 到 +30。
- 文案 `league_about_move`：
  - EN "+30 points: up a tier. −20: down one, back to 0. In Bronze you never go below 0."
  - DE "+30 Punkte: eine Liga höher. −20: eine tiefer, wieder bei 0. In Bronze geht es nie unter 0."
- `multiplayer/src/store.ts`：每次启动执行 `UPDATE league_players SET points = 0 WHERE tier = 0 AND points < 0`（幂等）。
- 测试：
  - app 单元测试改为青铜停在 0、白银 −18 再 −3 降到青铜 0。
  - 联赛服务测试的期望分数改为按 `standingAfter` 逐副累计。原来是直接求和，在青铜分数下限为 0 后不再成立。
  - 榜单比较里，同档同分的先后按账号排列，与榜单查询一致。
- charter：product.md（青铜停在 0）、ui.md（青铜进度条从 0 开始）。

## AC results

1. 通过。单元测试：青铜 2 分输 3 分为 0，0 分再输仍为 0；白银 −18 输 3 分降到青铜 0；白银 −10 输 3 分为 −13。联赛服务测试通过。
2. 通过。浏览器 1280 和 375：
   - 青铜 0 分：进度条 0%，显示 "30 to promotion"，没有“距降级”。
   - 白银 −10 分：进度条 20%，显示 "40 to promotion · 10 to relegation"。
   - 规则说明的英文和德文都是新的说法。
3. 本地通过：服务启动后，青铜 −6 变为 0，青铜 5 和白银 −10 不变；库里没有负分的青铜账号。生产库在上线后检查。

机械防线（在 77b4b5b 上）：typecheck、build、352 个测试、client bundle、design tokens、literal grep、SSR link、check:seo（52 页）、test:seo 全部通过。multiplayer 全套 69/70 通过。没通过的一个是联赛测试，原因是它的期望分数还按直接相加算，已按上面所说改正，单独重跑后通过。

## Deviations

无。

## Environment

端口 web 55207、multiplayer 56207、database 57207。env 键没有变化。worktree 里 multiplayer/.env 的 DATABASE_URL 端口改为 57207，只在本地使用。

## Residual

无。

## Check

上线后看 https://skatgo.com/en/league ：青铜玩家的分数不出现负数，进度条从 0 开始。

## Decided for you

- 只改青铜，其他档的升降规则不变。
- 已经是负分的青铜账号，在服务启动时一次性提到 0。
- 每副牌的得分记录（league_deals.points）保持原样，只有当前档位的分数受下限影响。
