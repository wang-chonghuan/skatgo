# SKATGO-247 rework (during close)

1. Post-deploy check on skatgo.com failed: forum post pages had one contextual internal link ("Forum") after the section crumb went; the search check wants two. The breadcrumb is now "Home › Forum", matching the page's structured breadcrumb (Home › Forum › post). AC3 ("breadcrumb has no section name") still holds. The local `check:seo --built` had not caught it because the forum service was not running there, so posts were not checked. Rechecked: typecheck, build, unit tests, token and literal checks; then the live post-deploy check.
