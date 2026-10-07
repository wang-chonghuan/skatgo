# SKATGO-53 rework

Relative to the frozen `handoff.md` (`663e85e`).

## Round 1 — 「pdf这里你用两列不对，你可以用多列，否则太长了」(2026-10-07)

- In the rules summary, the card points, base values and Null values tables now run across: names in one row, values under them.
- This applies on paper and on wide screens. On a phone the tall table stays: the wide one pushed the page to 401 and 455 px.
- `Block` / `EngineTableView` gained a `wide` option, used only by the summary page; the rules page is unchanged. Both layouts render from the same engine data.
- The AC script's horizontal-scroll check now compares against the device width. A phone's layout viewport grows with content that is too wide, which had hidden the problem.
- PDFs regenerated.
- Rechecked: AC2 and AC4 (46/46 in total), tests 83, `check:seo` 42 pages.

## Round 2 — 「Kurzfassung als PDF herunterladen 这个应该在标题旁边，有个下载图标……下载的地方都这么搞」(2026-10-07)

- Every download is now one shared pattern, `TitleWithDownload` / `PdfLink`: the page's single `go` button with lucide's `Download` icon at `icon.inline`, beside the h1.
  - On desktop it sits to the right of the h1; on a phone it wraps under the title.
  - It is hidden on paper.
- The two download messages became one, `printables_download`: "PDF herunterladen" / "Download PDF". The title already names the file.
- PDFs regenerated.
- Rechecked: the full AC (46/46), tests 83, `check:seo` 42 pages.

## Net effect

- The delivery is the handoff's.
- The summary's tables run across on paper.
- The PDF download is a prominent button beside each printable's title.
- The PDFs keep 1 page (score sheet) and 2 pages (rules summary).
