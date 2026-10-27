# SKATGO-142 plan

## Found in the code

- Free play's server keeps nothing per game; the token holds the deal's record. Its replies carry every computer move
  until the player's next turn, and the browser shows them one by one (`BOT_DELAY` 850 ms, a trick 1.2 s).
- SkatZero already values every legal card (`Policy.ranked`, the play record's `judgePlays`); the pool holds SkatZero's
  highest bid for the player's seat (`computers['0'].maxBid`).
- The model is called in `translate.ts` only; Luna low answers in about 2 s (measured 1.7–2.3 s).
- SkatZero's values, measured on 25 deals of its own play: best vs second median 0.8, p90 6.4; best vs worst p90 33.

## Route

1. `multiplayer/src/llm.ts`: the model call, shared with the translations.
2. `multiplayer/src/talk.ts`: the moment among new moves from the deal's record (decided > trick > bidding), public
   facts only, SkatZero's verdict on the player's own bid or card, the line from the model, a daily ceiling.
3. `POST /free/talk` in `free.ts`; `/api/free/talk` passed on with free play's per-address limit.
4. Browser (`server-table.tsx`): ask after each reply, one question at a time, three lines a deal, drop late ones;
   the line in the felt's top band on the speaker's side (`game-table.tsx`); the settings switch.
5. Charter: product, engineering, ui.
