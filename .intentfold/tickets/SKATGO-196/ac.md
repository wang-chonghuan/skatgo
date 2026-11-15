# SKATGO-196 acceptance checks

1. German front page title, og:title and twitter:title.
   Check: production build on web 55196, `curl http://localhost:55196/` and read `<title>`, `og:title`,
   `twitter:title`; after deploy the same against https://skatgo.com/.
   True when all three are "Skat online kostenlos spielen – ohne Anmeldung | SkatGo".
2. English front page title unchanged.
   Check: same read of `/en`. True when the title is "Skat Card Game – Play Free Online | SkatGo".
3. German front page's visible text and meta description unchanged.
   Check: visible text (H1/slogan and body text) and `meta description` of `/` on this branch vs the base
   build (main checkout). True when they are identical.
