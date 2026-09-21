# SKATGO-2 acceptance check plan

Built server on port 55002. Per the user's rule, acceptance checks basic function only.

1. **zh** — open `/zh/lesson/1` … lesson 2 is locked for a new learner, so write progress the way the
   product stores it (localStorage `parrottoon.skat.progress.v1`, lesson 1 done) and open
   `/zh/lesson/2`: the first step's tip shows the agreed sentence, and no longer the bare
   「一门花色 30 点」.
2. **en / de** — same step shows the agreed English / German sentence; no other language mixed in.
3. **Nothing else moved** — `git diff <base>` touches only the three `tip` lines (plus ticket files);
   mechanical defence passes.
