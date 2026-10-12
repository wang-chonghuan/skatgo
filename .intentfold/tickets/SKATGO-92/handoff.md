# SKATGO-92 handoff

## What changed

- `app/src/components/skat/entry-page.tsx`：首页学习卡上的「5-Minuten-Crashkurs」按钮改成一直显示。原来「学过课就不显示」，那是 SKATGO-89 时 agent 自行定的规则，人没有要求过。学过课的人看到的是「Weiter mit Lektion n」「5-Minuten-Crashkurs」两个按钮，再下面是进度。
- `.intentfold/charter/ui.md`：对这个入口的描述改成「一直显示」。

## AC results

在构建产物上验证（web 55092），用 Playwright 跑 `tmp/ac92.mjs`，桌面和手机、德语和英语都跑了。学过课的情况，是在浏览器里写入「学完第 1 课」的进度来模拟的。

1. **第一次来的人** — PASS：「Lernen starten」「5-Minuten-Crashkurs」两个按钮，没有进度；英语是「Start learning」「5-minute crash course」。
2. **学过课的人** — PASS：「Weiter mit Lektion 2」「5-Minuten-Crashkurs」两个按钮，下面有「1 von 11 Lektionen geschafft」；英语是「Continue with lesson 2」「5-minute crash course」。
3. **点按钮** — PASS：两种情况都进到 `/de/kurs/skat-in-5-minuten` 或 `/en/course/skat-in-5-minutes`。

机械检查全部通过：typecheck、build、118 个测试、client bundle、design tokens（132 个文件）、literal grep、SSR link、`check:seo --built`（46 个可索引页面）、`test:seo`。

## Deviations

无。

## Environment

- 实际端口：web 55092。
- 没有新增、修改或删除环境变量。

## Residual

- **上线**：只改了 web，只部署 web。
