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

The **`web`** service is the TanStack Start server in `app/`, which renders the page
shell for `/` (the front page), `/course`, `/lesson/$id` and `/play` and serves the built assets. The course itself runs in the
browser. `POST /api/ask` (the assistant) is part of `web`.

The independent **`multiplayer`** Colyseus service uses PostgreSQL for durable rooms
(SKATGO-20, human-approved 2026-09-27). It supports 1-3 humans, fills other seats with AI,
and gives disconnected players 30 seconds before temporary AI control. Original players
can recover the same seat within the room's 24-hour inactivity lifetime. No frontend
admission flow is shipped yet: integration clients require a separate admission secret.
Only one database-fenced process owns rooms; liveness and gameplay readiness are separate.

**Environments**

Production only, at **https://skatgo.com**. The Render service hostname
`https://skatgo.onrender.com` reaches the same deployment without the custom domain and is the
diagnostic origin for DNS and TLS checks. No staging.

- **Where it runs**: Render Docker Web Service `skatgo`, in the Render project `skatgo` and its
  `production` environment, Frankfurt region, Starter plan, one always-on instance. Render builds
  the repo-root `Dockerfile`; Nitro binds `0.0.0.0:$PORT` and starts with
  `node .output/server/index.mjs`. Automatic deploys are off: production releases pin an exact
  merged `main` commit.
- **DNS and TLS**, Cloudflare zone `skatgo.com`: apex uses a flattened `CNAME` to
  `skatgo.onrender.com` and stays **DNS-only (grey)**; `www` redirects to the apex with path and
  query preserved. Render owns the custom-domain certificate. The Clerk production instance's five
  `CNAME`s — `clerk`, `accounts`, `clkmail`, `clk._domainkey`, `clk2._domainkey` →
  `*.clerk.services` — stay **DNS-only (grey)**, as Clerk requires (SKATGO-12).
- **Accounts**: Clerk application `app_3JhPKJFpPIJR7rHWf9A8neRvdFU`. Production instance
  `ins_3JhhbSlXDnOOpj1GJJg4eh6972K` on skatgo.com — email and password; Google is switched off until it
  has its own OAuth credentials. A development instance serves local work.
- **The assistant's model**: Azure OpenAI deployment `gpt-5.6-luna`, reasoning effort medium, on the
  same Azure OpenAI resource as Trovestep.
- **Multiplayer data**: a separate paid Render PostgreSQL database; no Redis, persistent
  disk, worker or cron. New resources are API-managed in the existing project/production
  environment, Frankfurt. The backend has its own service hostname and does not change DNS.

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

Multiplayer install, local database and verification (the database script manages only
its named local container; Docker must be available):

```bash
npm --prefix multiplayer ci
node multiplayer/scripts/local-db.mjs start
npm --prefix multiplayer run check
npm --prefix multiplayer run build
npm --prefix multiplayer start
```

The local scripts load `multiplayer/.env`, never `app/.env`. Ticket ports come from
`project.json`; pass `DATABASE_PORT` to the local database script and `PORT` to the
backend. `multiplayer/README.md` owns the protocol and exact configuration contract.
Headless SDK checks are the approved acceptance surface for multiplayer. They refuse
non-loopback databases and services; production acceptance stays read-only.

```bash
npm --prefix app run build
npm --prefix app run test
npm --prefix app run typecheck
```

Anything visual is judged from what ships, not from the dev server:

```bash
npm --prefix app run build
(cd app && set -a && . ./.env && set +a && PORT=<port> node .output/server/index.mjs)
```

**Acceptance**

- **A scripted browser (Playwright), headed** — the default for every UI criterion. Install with
  `npx playwright install chromium`; run scripts from `.intentfold/tickets/<ticket-id>/tmp/` so their
  artifacts stay uncommitted.
- **Viewports**: desktop **1280×820** and phone **375×812** with `isMobile` and `hasTouch`. A UI
  criterion is checked at both.
- **No seeded data.** A fresh browser context is a signed-out learner who has done nothing. To start
  a check further into the course, write progress the way the product stores it
  (`app/src/lib/skat/progress.ts`) rather than clicking through earlier lessons.
- **A signed-in check uses the Clerk development instance.** Make its account with
  `clerk users create --app app_3JhPKJFpPIJR7rHWf9A8neRvdFU --instance dev --email <name>+clerk_test@example.com --password <password> --yes`,
  keeping the password in the ticket's `tmp/`. A `+clerk_test` address takes Clerk's fixed
  verification code `424242` when Clerk asks to confirm a new device. Accounts in the production
  instance are production data (Redline 2).
- Exercises and deals are random. Locate the expected answer through the rules engine or a stable
  `data-*` attribute, never by matching generated text.

**Environment**

Locally, `app/.env` — git-ignored, never printed, never committed — carries `LLM_BASE_URL` and
`LLM_API_KEY` (the assistant's model) and `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` (the Clerk
development instance; `clerk env pull --app app_3JhPKJFpPIJR7rHWf9A8neRvdFU --instance dev --file app/.env`
writes them). The built server reads them from its environment, so load the file when starting it:
`(cd app && set -a && . ./.env && set +a && PORT=<port> node .output/server/index.mjs)`.

In production the Render Web Service carries exactly the application configuration
`LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_EFFORT`, `CLERK_SECRET_KEY` and
`CLERK_PUBLISHABLE_KEY`; Render supplies `PORT` and its own `RENDER_*` runtime variables. List
application keys without printing values:

```bash
eval "$(grep '^export RENDER_API_KEY' ~/.zshrc)"
SERVICE_ID=$(render services --output json --confirm | python3 -c \
  "import json,sys; print(next(x['service']['id'] for x in json.load(sys.stdin) if x.get('service',{}).get('name') == 'skatgo'))")
curl -s "https://api.render.com/v1/services/$SERVICE_ID/env-vars" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  | python3 -c "import json,sys; print('\\n'.join(sorted(x['envVar']['key'] for x in json.load(sys.stdin))))"
```

**Deploy**

The Render Web Service has automatic deploys disabled. Deploy only a pushed commit that is the head
of `main`, to exactly the service named `skatgo` — found by name the same way the post-deploy check
finds it. `--wait` exits non-zero if the deploy fails; the post-deploy check then proves the commit is
the one serving:

```bash
git fetch origin main
test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)"
eval "$(grep '^export RENDER_API_KEY' ~/.zshrc)"
SERVICE_ID=$(render services --output json --confirm | python3 -c \
  "import json,sys; print(next(x['service']['id'] for x in json.load(sys.stdin) if x.get('service',{}).get('name') == 'skatgo'))")
render deploys create "$SERVICE_ID" --commit "$(git rev-parse HEAD)" --wait --confirm --output text
```

Not `release.py --only skatgo`: `--only` matches any service whose name *contains* the text, so it also
releases `skatgo-multiplayer`, which has its own deploy below (found while deploying SKATGO-23).

**Post-deploy check**

For multiplayer-only releases, do not redeploy `web`. After a merged revision:

```bash
node multiplayer/scripts/render.mjs deploy
node multiplayer/scripts/render.mjs verify
```

These commands target only `skatgo-multiplayer`, confirm the exact merged commit,
and require both liveness and gameplay readiness. The initial `provision` command
in that script is approval-required; subsequent deploys are explicit and automatic
deploys remain disabled. Provisioning writes only the new service/database.

The deploy command exiting 0 is not confirmation — Render can report success while an old deploy keeps
serving. Routes are derived from the app's own generated route manifest and languages from the inlang
project, so a new route or a new language needs no edit here. Every page lives under a language prefix
(`/en`, `/de`, `/zh`); a URL without one answers 307 to the visitor's language (SKATGO-1):

```bash
bash <<'BASH'
URL=https://skatgo.com

# FIRST: is the live Render deploy the commit just released? Everything below would happily validate
# an older deploy.
want=$(git rev-parse HEAD)
eval "$(grep '^export RENDER_API_KEY' ~/.zshrc)"
SERVICE_ID=$(render services --output json --confirm | python3 -c \
  "import json,sys; print(next(x['service']['id'] for x in json.load(sys.stdin) if x.get('service',{}).get('name') == 'skatgo'))")
got=$(render deploys list "$SERVICE_ID" --output json --confirm | python3 -c \
  "import json,sys; row=json.load(sys.stdin)[0]; d=row.get('deploy',row); print((d.get('commit') or {}).get('id',''))")
if [ "$got" != "$want" ]; then
  echo "FAIL: Render reports $got live/newest, expected $want"
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
rm "$body"

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
BASH
```

Run against a commit the app is not serving, it must exit 1 — that was checked before this was
written down (first version 2026-09-21; the language-prefix version checked the same way when it
replaced it, SKATGO-1).

**Operations**

```bash
# status, logs, deploy and rollback
# ips-render-ops cap1, cap2, cap3 and cap7 respectively
eval "$(grep '^export RENDER_API_KEY' ~/.zshrc)"
render services --output json --confirm
render logs --resources "$SERVICE_ID" --limit 100 --output text --confirm
render deploys list "$SERVICE_ID" --output json --confirm

# custom domains and TLS: ips-render-ops cap9
curl -s "https://api.render.com/v1/services/$SERVICE_ID/custom-domains" \
  -H "Authorization: Bearer $RENDER_API_KEY"

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

**A rollback must not touch data.** The course web server is stateless. Multiplayer
snapshots are versioned: roll back code only when it can read the stored schema;
never erase or reset rooms to make an older revision start.

## Redlines

1. **Recording a criterion as passed when its check did not run** — forbidden outright.
2. **Mutating external or production data from an acceptance check** — forbidden outright.
3. **Creating or deleting cloud resources** — not without the human's explicit approval.
4. **Creating or first-deploying a production Render service for this project** — not without the
   human's explicit approval.
5. **Changing production schema, infrastructure, ingress, scaling, or required environment keys** —
   not without the human's explicit approval. Includes: the Render service needing an env key or
   secret it does not already have; region, plan, instance count, ingress or health check changing;
   the `Dockerfile`'s base image, exposed port or start command changing.
6. **Pointing a production domain at a new target** — not without the human's explicit approval.
   Includes any DNS or Redirect Rule change in the `skatgo.com` Cloudflare zone and any Render
   custom-domain change.
7. **Reporting a deploy as complete without running the post-deploy check** — forbidden outright.
8. **Proxying the `skatgo.com` apex through Cloudflare** — forbidden outright. It must stay
   DNS-only so Render owns the production certificate and origin remains directly observable.
