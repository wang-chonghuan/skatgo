# SKATGO-69 AC check plan

Local web 55069 (built server), multiplayer 56069, database 57069. Headed Playwright at desktop 1280×820 and phone 375×812.

1. **Every issue the human pointed out is fixed and accepted.**
   - Each issue named during the open development is listed in the handoff with its page and what changed, and is looked at on the running product.
   - Pass: the human's acceptance of each fix is recorded (their words in the handoff).
2. **No overflow, covering or horizontal scroll where something was fixed.**
   - For each fixed page or element, at desktop and phone: no descendant reaches past its container's edges where it should not, the page has no horizontal scroll, and nothing covers the fixed element. A screenshot of each.
3. **Nothing else is affected.**
   - The mechanical defence (`engineering.md` Tools) passes in full, `check:seo -- --built` and `test:seo` included.
