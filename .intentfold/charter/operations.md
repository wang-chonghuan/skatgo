# Operations

Human-authored instructions for running, verifying, deploying, and operating this project. Commands
are repo-root-relative and executable as written. Section shape is fixed by
`.intentfold/readme.md`.

Most tickets end at merge. `Finish: auto-deploy` runs this file's deploy and post-deploy tools after
merge. Acceptance verification also uses this file, so stale commands block delivery.

> Seeded 2026-09-21 by intentfold cap1 from the repository and the live deployment. The deploy and
> post-deploy commands were run as written against production before being recorded here.

## Contract

**Runtime**

One long-running service, **`web`**: the TanStack Start server in `app/`, which renders the page
shell for `/`, `/lesson/$id` and `/play` and serves the built assets. The course itself runs in the
browser. There is no API process, no worker and no database in use.

**Environments**

Production only, at **https://skatgo.com**. The Azure default hostname
`https://ca-skatgo.kindsmoke-4d84c417.northeurope.azurecontainerapps.io` reaches the same revision
without the custom domain — useful when diagnosing DNS or TLS. No staging.

- **Where it runs**: Azure Container App `ca-skatgo` in the shared n-easyapp substrate (resource group
  `rg-easyapp-shared`, environment `cae-easyapp-shared`), image `acreasyapp.azurecr.io/skatgo:latest`,
  built from the repo-root `Dockerfile`, serving on port 3000 with `node .output/server/index.mjs`.
  One replica pinned (`min = max = 1`): never scale to zero, or the first request after a pause fails.
- **DNS and TLS**, Cloudflare zone `skatgo.com`: apex `A` → the environment's static IP, **DNS-only
  (grey)**, because the Azure managed certificate is issued and renewed by HTTP validation against the
  origin; `TXT asuid` → the Container App's domain-verification id; `www` `CNAME` → apex, **proxied
  (orange)**, with a Redirect Rule sending `www` to the apex, path and query kept.
- n-easyapp also created a Postgres schema and role (`skatgo-schema` / `skatgo-user`) and injects
  `DATABASE_URL`; the app does not use either.

**Evidence**

Acceptance evidence must read an authoritative surface, be reproducible, and be capable of failing.
Use the smallest observation that settles the criterion: a command, query, or browser interaction.
Code inspection alone is not evidence that behavior works.

## Tools

**Install**

```bash
npm --prefix app install
```

**Run locally**

Every long-running service uses its fixed main port from `.intentfold/project.json`;
`app/vite.config.ts` makes 3220 the dev server's default:

```bash
npm --prefix app run dev
```

For a ticket worktree, resolve ports with:

```bash
python3 <intentfold-skill>/scripts/ports.py .intentfold/project.json ticket <ticket-id>
```

The returned `web` port is passed as a flag, which overrides the config default:

```bash
npm --prefix app run dev -- --port <web-port>
```

**Build and tests**

```bash
npm --prefix app run build
npm --prefix app run test
npm --prefix app run typecheck
```

Anything visual is judged from what ships, not from the dev server:

```bash
npm --prefix app run build
(cd app && PORT=<port> node .output/server/index.mjs)
```

**Acceptance**

- **A scripted browser (Playwright), headed** — the default for every UI criterion. Install with
  `npx playwright install chromium`; run scripts from `.intentfold/tickets/<ticket-id>/tmp/` so their
  artifacts stay uncommitted.
- **Viewports**: desktop **1280×820** and phone **375×812** with `isMobile` and `hasTouch`. A UI
  criterion is checked at both.
- **No accounts, no seeded data.** A fresh browser context is a learner who has done nothing. To start
  a check further into the course, write progress the way the product stores it
  (`app/src/lib/skat/progress.ts`) rather than clicking through earlier lessons.
- Exercises and deals are random. Locate the expected answer through the rules engine or a stable
  `data-*` attribute, never by matching generated text.

**Environment**

None locally: no `.env`, no keys. In production the Container App carries the secret `database-url`
and the env vars `DATABASE_URL`, `DATABASE_SCHEMA`, `PORT`, `EASYAPP_DEPLOY_COMMIT` — names only:

```bash
az containerapp show -g rg-easyapp-shared -n ca-skatgo \
  --query 'properties.template.containers[0].env[].{name:name, secretRef:secretRef}' -o table
```

**Deploy**

First-time creation was n-easyapp cap1 on 2026-09-21 and is done; it is not a routine command. The
routine redeploy commits and pushes pending work first (`az acr build` uploads the working tree), builds
the image in ACR, updates the Container App and tags it with the shipped commit. Its output includes
database passwords, so send it to a file rather than the terminal:

```bash
python3 ~/.claude/skills/n-easyapp/scripts/redeploy_current_repo.py --project skatgo > .intentfold/tmp/redeploy.log 2>&1; echo "exit $?"
```

**Post-deploy check**

The deploy command exiting 0 is not confirmation — Azure reports success while an old revision keeps
serving. Routes are derived from the app's own generated route manifest and languages from the inlang
project, so a new route or a new language needs no edit here. Every page lives under a language prefix
(`/en`, `/de`, `/zh`); a URL without one answers 307 to the visitor's language (SKATGO-1):

```bash
URL=https://skatgo.com

# FIRST: is the revision that is serving the one just built? Everything below would happily validate
# the old one.
want=$(git rev-parse HEAD)
got=$(az containerapp show -g rg-easyapp-shared -n ca-skatgo \
  --query 'tags."easyapp.commit"' -o tsv 2>/dev/null)
if [ "$got" != "$want" ]; then
  echo "FAIL: serving $got, expected $want — the revision has not swapped yet, or the deploy shipped something else"
  exit 1
fi

# A $param is filled with its own name, which the router matches like any value.
routes=$(sed -n '/interface FileRoutesByFullPath/,/^}/p' app/src/routeTree.gen.ts \
  | grep -aoE "'/[^']*'" | tr -d "'" | sed -E 's/\$([A-Za-z_]+)/\1/g' | sort -u)
[ -n "$routes" ] || { echo "FAIL: derived 0 routes from app/src/routeTree.gen.ts"; exit 1; }
locales=$(python3 -c "import json; print(' '.join(json.load(open('app/project.inlang/settings.json'))['locales']))")
[ -n "$locales" ] || { echo "FAIL: derived 0 locales from app/project.inlang/settings.json"; exit 1; }

body=$(mktemp); fail=0; pages=0; assets=0
for l in $locales; do
  for r in $routes; do
    p="/$l${r%/}"
    code=$(curl -s -o "$body" -w '%{http_code}' "$URL$p")
    printf '%s  %s\n' "$code" "$p"
    [ "$code" = 200 ] || { fail=1; continue; }
    pages=$((pages + 1))
    # A page must be in its own language, and is only as good as the scripts and styles it names.
    grep -q "<html lang=\"$l" "$body" || { echo "   <html lang> is not $l"; fail=1; }
    for a in $(grep -aoE '(src|href)="/assets/[^"]+"' "$body" | sed -E 's/^(src|href)="//; s/"$//' | sort -u); do
      ac=$(curl -s -o /dev/null -w '%{http_code}' "$URL$a")
      assets=$((assets + 1))
      [ "$ac" = 200 ] || { printf '   %s  %s\n' "$ac" "$a"; fail=1; }
    done
  done
done
rm -f "$body"

# Without a prefix, every route redirects to one of the languages.
for r in $routes; do
  out=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "$URL$r")
  printf '%s  %s\n' "$out" "$r"
  target=${out#* }
  [ "${out%% *}" = 307 ] && echo " $locales " | grep -q " $(echo "$target" | sed -E 's#^https?://[^/]+/([^/?]+).*#\1#') " \
    || { echo "   expected 307 to a language prefix"; fail=1; }
done

# The files for crawlers are served as they are, never redirected.
for f in /sitemap.xml /robots.txt; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$URL$f")
  printf '%s  %s\n' "$code" "$f"
  [ "$code" = 200 ] || fail=1
done

[ "$pages" -gt 0 ] || { echo "FAIL: no route answered with a page"; exit 1; }
[ "$assets" -gt 0 ] || { echo "FAIL: pages named no /assets/ files — not the built app"; exit 1; }
[ "$fail" -eq 0 ] || { echo "FAIL: a page, a redirect, an asset or a crawler file is wrong"; exit 1; }
printf 'OK: %s pages in %s languages, %s asset loads, serving %s\n' "$pages" "$(echo $locales | wc -w | tr -d ' ')" "$assets" "$got"
```

Run against a commit the app is not serving, it must exit 1 — that was checked before this was
written down (first version 2026-09-21; the language-prefix version checked the same way when it
replaced it, SKATGO-1).

**Operations**

```bash
# logs (last 100 lines of the running revision)
az containerapp logs show -g rg-easyapp-shared -n ca-skatgo --tail 100

# revisions, newest first — rollback is reactivating a previous one
az containerapp revision list -g rg-easyapp-shared -n ca-skatgo \
  --query '[].{name:name, active:properties.active, created:properties.createdTime}' -o table
az containerapp revision activate -g rg-easyapp-shared -n ca-skatgo --revision <name>

# custom domain + certificate binding
az containerapp hostname list -g rg-easyapp-shared -n ca-skatgo -o json

# readiness of the public site (ips-golive cap1, read-only)
python3 ~/.claude/skills/ips-golive/scripts/readiness_audit.py https://skatgo.com
```

There are no scheduled jobs.

## Guidance

**Start before verifying.** Confirm each required service responds before driving it. A startup
failure is a stop and a report, not an acceptance failure.

**Choose authoritative evidence.** A database query proves a row exists but not that the UI shows
it. A browser proves rendered behavior but may not prove a background write completed. Use both only
when the criterion spans both surfaces.

**Use headed browser verification for formal UI acceptance.** Fall back to headless only when no GUI
is available and record that limitation.

**Use stable locators.** Prefer role, label, placeholder, visible text, or a stable `data-testid`.
Locate the stable container first, then assert its contents.

**Treat dynamic output as dynamic.** Assert completion, placement, non-empty output, and shape rather
than exact generated wording. For streaming, wait for a completion signal or stable text; stale
content from a previous action cannot satisfy the check.

**Wait on conditions, not fixed sleeps.** For asynchronous behavior, poll or use web-first
assertions.

**Diagnose a failed check before changing it.** Decide whether the implementation failed or the
check targeted the wrong surface, then rerun the same check.

**Deploy from the merged revision.** A successful deploy command is not completion; the post-deploy
check is.

**The computers play on a timer.** In a whole game they bid and play after a short delay, so two
screenshots of the table taken "at the same moment" can show different states. Compare tables in the
same game state (for example, once it is the learner's turn), not after the same wait.

**Screenshots mid-animation differ.** Steps slide in and the progress bar animates; a pixel comparison
taken before they settle shows a few anti-aliasing differences that are not real.

**Diagnose DNS from a public resolver.** This machine's resolver can cache an earlier NXDOMAIN for up
to half an hour; `dig +short <host> @8.8.8.8` and `curl --resolve` are the authorities.

**A rollback must not touch data.** Revisions are stateless and the app has no data of its own;
reactivating an older revision is the correct first move when a deploy broke the site.

## Redlines

1. **Recording a criterion as passed when its check did not run** — forbidden outright.
2. **Mutating external or production data from an acceptance check** — forbidden outright.
3. **Creating or deleting cloud resources** — not without the human's explicit approval.
4. **Deploying this project for the first time** — not without the human's explicit approval.
   Lookupable: `az containerapp revision list -g rg-easyapp-shared -n ca-skatgo` returns no revision.
5. **Changing production schema, infrastructure, ingress, scaling, or required environment keys** —
   not without the human's explicit approval. Includes: the Container App needing an env key or
   secret it does not already have; ingress, scale, target port, resource group or environment
   changing; the `Dockerfile`'s base image, exposed port or start command changing.
6. **Pointing a production domain at a new target** — not without the human's explicit approval.
   Includes any DNS or Redirect Rule change in the `skatgo.com` Cloudflare zone, and
   `az containerapp hostname add/bind`.
7. **Reporting a deploy as complete without running the post-deploy check** — forbidden outright.
8. **Flipping the `skatgo.com` apex between DNS-only and proxied** — forbidden outright. It breaks
   issuance and renewal of the Azure managed certificate.
