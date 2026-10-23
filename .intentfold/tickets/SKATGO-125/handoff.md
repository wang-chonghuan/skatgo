# SKATGO-125 handoff

The duplicate German 12-tricks post is deleted from the live forum; the records now say deleted, not hidden.

## What changed

- **Production data** — post 2 ("Skat Tricks: 12 Tricks, mit denen du sofort besser spielst", hidden since SKATGO-124,
  no comments) exported to the main checkout's `.intentfold/tmp/SKATGO-125/post-2-backup.json`, then deleted (the
  human: 「你彻底删掉」, 「我让你删，你凭什么不给我删」). Done before this branch, so it took effect at once.
- **`app/src/lib/moved.ts`** — comments only: post 2 is deleted; its address keeps leading to the English post.
- **Charter** — `product.md`, `engineering.md`: "deleted" for "hidden".

The ticket's proposed route (dropping the redirect so the human could press "Löschen") was not needed: the post is
deleted, and the redirect stays so its old address keeps leading to the English article.

## AC results

1. **The post can be deleted.** Superseded — deleted directly, with a backup.
2. **Gone from the forum.** PASS — live `/de/forum` and `/en/forum` list only the announcement and the English
   article; the database holds posts 1 and 3.
3. **`/skat-tricks/12-tricks` leads to the English post.** PASS — live 301 in both languages; post 2's address
   too.

Mechanical defence: typecheck, build, unit tests, client bundle, design tokens, literal check, server bundle link,
`check:seo --built`, `test:seo` — pass.

## Environment

No service started (nothing to look at locally); no env change.

## Residual

None.

## Check

1. https://skatgo.com/de/forum — signed in as SkatGo: the hidden card is gone.

## Decided for you

- The redirect from the deleted post's address to the English article stays, so its old links still lead somewhere.
- No deploy for this branch: it changes comments and the charter only; landing it is enough.
