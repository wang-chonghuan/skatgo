# SKATGO-56 AC check plan

The checks are commands only: a charter change has no running product to drive.

## AC1 — Everything the charter names exists

- **Check**: extract every backticked repo path (`app/…`, `multiplayer/…`, `.intentfold/…`) and every route path (`/…`) from the four charter files. Each path must exist on disk, and each route must be in `app/src/routes/` or be a known server path (`/api/*`, `/sitemap.xml`, `/daily`, `/downloads/*`).
- **Check**: every npm script and script file named in the charter exists in `package.json` or `scripts/`.
- **Check**: every theme registry key the charter names in backticks (`dims.x`, `bp.x`, `color.x`, `space.x`) exists in its registry.
- **True when** nothing is missing.

## AC2 — Everything that exists is described

- **Check**: every file in `app/src/routes/` maps to a route the charter names.
- **Check**: every file in `app/src/theme/` appears in ui.md's registry table.
- **Check**: every page component under `components/skat/*-page.tsx` is named in engineering.md or ui.md.
- **True when** none is missing.

## AC3 — Format

- **Check**: each of the four files has exactly the headings `## Contract`, `## Tools`, `## Guidance`, `## Redlines`, in that order.
- **Check**: grep the charter for "removed", "deleted", "已删除", "曾经", "formerly", and for template placeholders (`<…>`). Nothing marks a deletion, and no placeholder remains.
- **True when** both hold.

## AC4 — No product code

- **Check**: `git diff --stat <base>..HEAD` touches only `.intentfold/`.
- **True when** it does.
