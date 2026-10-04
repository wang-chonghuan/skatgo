# Acceptance Checks

## AC 1: Google and existing email login

Read the production provider status, then inspect the signed-out live modal at both
Operations viewports. Google and email must both be present. Do not create a user.
Pending production configuration and release.

## AC 2: Production OAuth and actual session

Inspect the exact Google client callback and basic identity permissions; observe the
correct authorization destination. The human completes production authorization and
confirms the resulting site session. A button or consent page alone is not a pass.

## AC 3: External audience and anonymous access

Read Google Audience: External / In production, not Testing. Check course and assistant
entry without an account, at both viewports. Do not submit production assistant questions.

## AC 4: Public legal documents

At both viewports open the localized Privacy and Terms URLs without signing in. With
JavaScript disabled assert status 200, one H1, visible complete sections, localized
self-canonical and reciprocal alternates. Follow homepage footer links and each document's
cross-link; switch languages and verify the equivalent page. With JavaScript enabled,
inspect the Clerk modal policy links without submitting credentials. Check horizontal
overflow and text bounds. Assert user-approved Olena Holub, Irish postal address,
intentplex@gmail.com and phone, working mailto/tel links and no Risetive or incorporated
company claim. Follow the German Impressum footer link to the operator section.

## Local verification, 2026-10-04

- Required mechanical defence passed: typecheck, production build, 83 application tests,
  client-bundle check, design-token and literal checks, SSR import, check:seo (36 indexable
  pages, 2 noindex pages, 36 assets) and all 25 SEO regression tests.
- All four legal URLs returned 200 with JavaScript disabled in the source-derived SEO
  check, including complete text, language, canonical, alternates, sitemap and resources.
- Browser DOM and screenshots at measured 1280x820 and 375x812: all four documents contain
  the approved operator, address, mailto/tel links and no Risetive reference; one H1,
  complete sections, no horizontal overflow or text outside the reading column.
- Followed policy cross-links, English/German equivalent-page switches, homepage footer
  links and Impressum anchor. The anchor settles below the sticky header at both sizes.
- Clerk development modal at both sizes and languages: localized Privacy and Terms hrefs
  open in a new tab; Google and email UI are visible. No credentials submitted or account
  created. This proves development modal wiring, not production Google configuration.
- Evidence: tmp/legal-*.png, tmp/legal-browser-results.json, tmp/legal-anchor-results.json.
  In-app browser sizing needed calibration for its 1.75 scale; assertions use actual CSS
  viewport dimensions. Its API provides viewport sizing, not isMobile/hasTouch emulation,
  so touch-device acceptance is not claimed.

Production AC1-3 and the public-release part of AC4 remain pending. Google is still
External / Testing and Clerk production Google remains disabled as last observed.
No successful handoff, merge, release or closure.

Existing privacy risk outside this page implementation: published-host PostHog analytics
starts automatically with local-storage persistence and no consent control. Copy discloses
the behavior; adding a policy does not create a consent mechanism or certify GDPR/ePrivacy
compliance. Provider retention, transfer safeguards and processing bases need operator
confirmation before treating this minimum disclosure as a full compliance policy.
