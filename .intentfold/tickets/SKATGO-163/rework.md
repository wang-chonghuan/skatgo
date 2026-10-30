# SKATGO-163 rework

Three rounds after the handoff (68bd9c1), one commit each, the ask as its first line. `handoff.md` is unchanged.

## Round 1 — 47cc77a

> 房间号房那里肯定不行，我建议放到退出按钮里，加一个菜单项

- **What changed:**
  - The room number is no longer at the table's top left.
  - It is now a menu item under "Keep playing": "Room 654 512 · copy link" (`quiet`, block).
  - A tap copies the room's link and the item reads "Link copied" for 2 s.
  - Nothing of the room stands on the felt.
  - `room_number` is replaced by `room_number_copy`.
  - `product.md` and `ui.md` follow.
- **Rechecked:** `tmp/rework1.mjs`, 6/6 in English and German:
  - the felt holds no number;
  - the menu item shows the right number;
  - the clipboard holds the link;
  - the item says the link was copied.

## Round 2 — 27266d8

> 房间建好后，房主点进去，应该有个等待的页面，显示口令，复制按钮，然后等待拿到口令的人加入（或者设置为AI），点开始游戏，等等必要的东西。然后私人牌桌中，不要退出按钮，而要一个牌桌按钮。以示不同。然后菜单内容还相同。

- **What changed:**
  - **A room now waits first, with nothing dealt (`deals` 0).**
    - People with the number sit in empty seats at once.
    - The host gives an empty seat to the AI or takes it back (the `computer` action).
    - The host may remove a person; the seat is then empty again.
    - The host starts once every seat is taken (the `start` action, seat 2 dealing).
    - Anyone may leave.
    - Once the room plays, the earlier rules hold: a newcomer takes a computer's seat from the next deal.
  - **The waiting page:**
    - the number with "Copy link";
    - one row per seat;
    - the host's small buttons;
    - "Start game", or for the others "Waiting for <host> to start the game.";
    - "Leave the room".
  - **The table button.** A room's top-right button is the table's (a spade, `aria-label` "Table" / "Tisch"). Its menu is unchanged. Other tables keep the way out.
  - **Records updated:**
    - the Plane ticket's Scope, Constraints and acceptance criteria (its "no lobby, no start button" reversed by the human's ask);
    - `ac.md`;
    - `product.md`, `ui.md` and `engineering.md`;
    - About's `about_friends_1` and the New room card's line.
- **Rechecked:**
  - `tmp/rework2.mjs`, 17/17 in English and German: the waiting page, Copy link, a second account sitting down, the AI given and taken back, Start, the table button and its menu, free play keeping the way out.
  - The multiplayer check, 42/42, with a new waiting-room integration test.

## Round 3 — 11b93e9

> bug: 我在创建房间页面点了leave，跳到外面后点open，报错：Rooms need a free account – sign in first. 但是实际上我已经登录了，刷新页面该错消失，请修

- **Cause:** room requests relied on Clerk's one-minute session cookie alone. The cookie was stale, renewed only in the background, or overwritten by another localhost app (ports share cookies). The server then took a signed-in account for a guest until a reload.
- **What changed:**
  - `room-client.ts` sends this page's own fresh Clerk token (`getToken`) as `Authorization: Bearer`.
  - Clerk's server check reads a header token before the cookie.
- **Rechecked:** `tmp/rework3.mjs`, 3/3:
  - open, then Leave on the waiting page, then Open again works without a reload;
  - a room request carries the page's token;
  - a guest is still asked to sign in.

## Net effect against the handoff

- **Changed:**
  - Opening a room no longer deals at once: the room waits for its people or the AI, and the host starts it.
  - The room number moved from the felt's corner into the table's menu, and onto the waiting page.
  - A room's menu button is a spade.
  - Room requests carry the Clerk token.
- **Unchanged:** everything after the first deal — joining, away seats, removing, leaving, the pause, referral.
