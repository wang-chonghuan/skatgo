# SEO Regression Check

Install app dependencies and the pinned browser once:

```sh
npm --prefix app ci
npm --prefix app exec -- playwright install chromium
```

From the repository root (or `app/`):

```sh
npm run check:seo
```

The default builds the current checkout, launches its production server on an owned loopback port,
and crawls with JavaScript disabled. It prints the actual target and coverage counts, returns nonzero
on failure, and closes its server and browser on completion, failure or SIGINT/SIGTERM. It needs no
multiplayer service, database, signed-in browser, or Google/Bing credentials. The usual ignored
`app/.env`, if present, is loaded for the server without being printed.

The preferred port comes from the ticket's recorded worktree or the project's main web port.
`INTENTFOLD_TICKET` can identify a ticket in a differently named checkout; its recorded worktree must
match. Occupied ports are skipped within the configured web block, not reused or killed.

For a caller that has just built this checkout, avoid a second build:

```sh
npm run check:seo -- --built
```

Do not use `--built` as a substitute for verifying current code. The default always rebuilds.

Inspect an already-running preview or production read-only:

```sh
npm run check:seo -- http://127.0.0.1:55045
npm run check:seo -- https://skatgo.com
```

This mode does not build, start, stop, deploy, submit URLs, or change consoles/DNS. It validates against
the current checkout's authoritative routes, lesson guides, URL patterns and indexability. For
production, first run the separate exact-commit guard in Operations' post-deploy tools; a successful
crawl alone cannot identify which Git commit is serving.

Run the real-response negative controls and ownership tests after building:

```sh
npm run test:seo
```

They use only a local owned preview and fault-injecting HTTP proxy. Missing sitemap targets,
canonical/language mistakes, hidden/empty SSR text, crawler directives, broken resources, redirects
and soft 404s must fail through the same crawler. New source-backed static pages and lessons join
coverage automatically; unknown dynamic page families fail discovery until their authoritative
source is supported. No fixed page count or copied page inventory is used.

`HEADED=1` runs Chromium visibly. Engineering's mechanical defence includes both commands.
Passing protects rendered SEO contracts; it does not promise indexing, selected canonical, rankings
or traffic, and cannot verify account settings or ownership DNS records.
