# SKATGO-70 plan

## 代码里已有、工单没说的

- **母图**：`app/brand/skatgo-logo.png`（1254×1254）。`app/public/` 里的每个图标都由 SKATGO-23 的 `icons.mjs` 从母图剪出来：
  - `favicon.ico`（16/32/48）、`favicon-32.png`；
  - `apple-touch-icon.png`；
  - `icon-192.png`、`icon-512.png`、`icon-maskable-512.png`；
  - 页头标志 `logo-96.png`。
- **剪裁方式**：先找出母图里非近白的绘制区域，再按各自的留白比例放进正方形，最后把近白抬成纯白。
- **新图**：1408×1408 的 JPG，绘制区域 1092×1088（原母图是 855×836）；背景最暗 238，接近白色。因为先按绘制区域剪裁，图标里 logo 占的比例和现在一样。
- **分享预览图**：`app/public/og/` 下 40 张（20 页 × 2 种语言）。每张都由 `SKATGO-50/og.mjs` 用运行中网站的 `/logo-96.png` 画进去，所以要全部重画。
  - 介绍页 `/with-friends` 共用自由对局的预览图 `play`，按页面逐个重画会用介绍页的标题覆盖它，所以介绍页跳过。
- **结构化数据**：`head.ts` 里的 `logo` 指向 `icon-512.png`，图标更新后自动跟上。
- **仓库之外**：Clerk 登录窗口的 logo 在 Clerk 后台设置，代码里没有引用。

## 路线

1. 新图转成 PNG（像素不变），替换 `app/brand/skatgo-logo.png`，路径与 charter 一致。
2. 运行 `node .intentfold/tickets/SKATGO-23/icons.mjs`，重新剪出全部图标。
3. 构建并在 55070 端口启动网站，按 sitemap 列出页面（跳过与自由对局共用预览图的介绍页），运行 `og.mjs` 重画 40 张预览图。
4. 不改任何代码；charter 里的说明仍然成立。

## Redline 查对

- **engineering.md Redline 5**：生成文件不手改，用生成脚本重新生成。
- **ui.md Redline 1**：不涉及 token。
- **operations.md**：不碰生产，只在本地生成。
