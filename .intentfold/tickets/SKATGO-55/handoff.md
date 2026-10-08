# SKATGO-55 handoff

## What changed

A chore. No product code changed; the work happened in Google Cloud, Search Console and the local OpenSEO.

- **Google Cloud** (the human approved it; done in the human's browser):
  - project `skatgo-openseo`;
  - OAuth consent screen, External / Testing, with the human's account as the test user;
  - Web OAuth client "OpenSEO local", calling back to `localhost:3001`.
- **OpenSEO `.env`** (`/Users/yong/work/open-seo/.env`, outside this repo):
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `BETTER_AUTH_SECRET` were written by script from the downloaded client JSON and never displayed;
  - `NODE_OPTIONS=--max-old-space-size=1100`;
  - the old file is kept as `.env.bak.20261008T090601Z`.
- **colima** now runs with `--memory 4 --cpu 2`. The OpenSEO container builds itself at start, and under 2 GB that build was killed (exit 137).
- **Search Console** `sc-domain:skatgo.com` is connected to the OpenSEO project "SkatGo".
- **Rank tracker** `b38b815a-…` for skatgo.com:
  - Google Germany, German, desktop, weekly, depth 100;
  - 53 keywords: the tagged ones plus the German ones from SKATGO-52/53.
- **Baseline report** "SEO-Ausgangslage — 8. Okt. 2026" is saved in OpenSEO (report `d66f3d35-…`). The same HTML is committed here as `baseline.html`, so the December checkpoint does not depend on the local OpenSEO database.
- **Search Console submissions** (scope the human added at the start):
  - sitemap resubmitted on 2026-10-08. Google last read it on 10-07 and found 38 pages; the sitemap now has 42.
  - The 9 URLs left over from SKATGO-52/53 were tried again; the answer was still "Quota exceeded". See Residual.

## AC results

1. **Search Console data by query, last 28 days.** Met.
   - `get_search_console_performance` on the SkatGo project, `dimensions: ["query"]`, returned 3 rows for 2026-09-07 → 2026-10-05: "pc skat" at position 52, "scatgoô" at 5, "skat reizwerte" at 18.
   - The page view returned 13 rows.
2. **Rank tracking set up, first check complete, estimate and approval in a ticket comment.** Met.
   - Estimate: about $1.19 a month (OpenSEO, for 50 keywords weekly), about $1.05 per check for 53 keywords.
   - The human's approval, 「同意你的决定，你执行，你写 .env」, is recorded in the Plane comment of 2026-10-08.
   - Run `a8069d27-…` completed and measured 47/53 keywords. The other 6 failed on DataForSEO's side ("Internal SE Server Error" or timeout), with no charge.
   - Only "skat drücken" ranks: position 24, on `/de/kurs/was-tun-mit-dem-skat`. The other 46 are outside the top 100.
3. **Baseline report saved in OpenSEO.** Met.
   - `save_report` returned `created: true`, 6258 bytes.
   - It covers impressions, clicks, top pages and keyword positions.

Mechanical defence passed in full: typecheck, build, 83 tests, bundle, tokens, literal grep, SSR link, `check:seo -- --built`, and `test:seo` (25/25). The first `check:seo` run failed for two reasons, both fixed and the check rerun:
- `ticket.json` had no ports;
- the new worktree had no `app/.env`.

## Deviations

- The Proposed solution suggested about 40 keywords; 53 were tracked, inside the estimate the human approved.
- Rank-tracking schedules do not run in OpenSEO's Docker mode; its startup log says so. The tracker is set to weekly, but each weekly check has to be triggered from the Rank Tracking page, or via MCP `run_rank_tracker`.

## Environment

- Ports `55055/56055/57055` are recorded in `ticket.json`. Only `check:seo`'s own preview ran on 55055, and it stopped itself. No service is left running for this ticket.
- `app/.env` was copied from the main checkout into this worktree. It is ignored by git, and no key was added or changed in it.
- Outside this repo: the OpenSEO `.env` keys and the colima memory listed above.

## Residual

- Request indexing in Google for these 9 URLs once the rolling 24-hour quota frees up:
  - `/de/kurs/wie-bedient-man-beim-skat`
  - `/de/kurs/was-sind-grand-und-null`
  - `/de/kurs/wie-berechnet-man-den-spielwert`
  - `/de/kurs/was-tun-mit-dem-skat`
  - `/de/kurs/wie-rechnet-man-skat-ab`
  - `/de/kurs/bereit-fuer-eine-echte-partie`
  - `/de/regeln/skatliste`
  - `/de/regeln/zum-ausdrucken`
  - `/en/course/how-to-play-skat-well`

  The resubmitted sitemap also leads Google to them.
- The weekly rank check is not automatic in Docker mode. A local scheduled job that calls `run_rank_tracker` would fix that, if the human wants one.
- The 6 unmeasured keywords will be measured on the next check.
