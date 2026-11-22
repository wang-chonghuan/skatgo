# SKATGO-229 plan

## 代码里看到、工单没说的
- SEO 检查（`scripts/seo-inventory.mjs`）只把课程当作带参数路由的合法目标；一个 `$brand` 路由会让检查失败。每个品牌用一个静态路由（`skat-sites-compared_.<brand>.tsx`），检查原样覆盖，不用改检查。
- `lib/compare.ts` 已有每家的对比格子；品牌页复用它做"品牌 vs SkatGo"表，正文（介绍、提供什么、FAQ）另写在 `lib/brands.ts`，保证每页文字不同。

## 路线
1. `lib/brands.ts`：四个品牌（Skat Palast、Skatstube、Euroskat、Skat-Online）的标题、描述、H1、介绍、8 条"提供什么"、5–6 个 FAQ，每条带来源；`brandHead` 生成 head（WebPage、FAQPage、面包屑）。
2. `components/skat/brand-page.tsx`；4 个路由；URL 模式；`client-page` 注册；`PAGES`。
3. 总对比页每个品牌介绍末尾加"Mehr über …"链接；页脚不动。
4. charter：product.md（人已同意）、engineering.md、ui.md。
