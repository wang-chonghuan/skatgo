# SKATGO-13 grill (self-adjudicated — the human: 「开个工单马上做」)

1. **Rate limit for signed-out visitors?** The endpoint costs money per call. Decision: keep the limits
   and their numbers; a signed-in learner counted by account, anyone else by address — SKATGO-9's
   original key — plus the unchanged site-wide daily cap of 500. Nothing is refused *for being signed
   out*; the same limits apply to everyone.
2. **What if Clerk fails?** Previously the request would fail. "The gate must not forbid anything" —
   so a Clerk error counts as signed out and the question is answered.
3. **Conversation per account + page?** Kept: it is not a gate, it only keeps one person's chat from
   showing to the next person who signs in on the same tab.
4. **Charter** says (engineering.md) the endpoint answers "only for a signed-in account" and "the only
   thing behind a login is the assistant"; operations/ui mention the same. Charter is human-owned and the
   human asked only for the code change → reported as drift in the handoff.
5. **Cost exposure** returns to what SKATGO-9 shipped (open endpoint, per-address rate, daily cap).
   Recorded in the handoff so the human sees it.

6. **Found in acceptance: a question asked before Clerk finished loading lost its answer.** With the gate,
   the chat only appeared after Clerk had loaded; without it, the chat can be open while Clerk loads,
   and Clerk finishing makes the launcher render again — and deep-chat clears its messages whenever it is
   rendered again. Reproduced by delaying Clerk's script (the answer arrived 200 from the server, the
   chat showed nothing). Decision: the chat body renders again only when its page or conversation
   changes (`memo` with an explicit comparison). The same re-render happens when Clerk refreshes a
   signed-in session, so this also protects signed-in learners.
