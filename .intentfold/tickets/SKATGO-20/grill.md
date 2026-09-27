# SKATGO-20 Grill

2026-09-27. Human mode. Complete batch saved before asking.
Sources: live SKATGO-20 and SKATGO-17; all four Charter files; production game,
cards, AI and value modules; app manifest and Dockerfile; current Colyseus docs;
read-only Render service inventory. Existing unit tests were not a design source.

## 1. Architecture and Charter

Question: May this ticket update only `engineering.md` and `operations.md` to add
an independent Colyseus backend and PostgreSQL persistence, while leaving the
course browser-local and the existing frontend, website service, Clerk and Azure
configuration unchanged?

Recommended answer: Yes. Add `multiplayer/` as a standalone TypeScript package,
directly reuse the pure rules engine, introduce the required Colyseus server/schema,
SDK verification, PostgreSQL driver and build/test dependencies, and document their
runtime, ports, checks and release procedure. Scope the browser-randomness guidance
to course rendering; multiplayer shuffling is server-owned. Preserve the existing
mechanical defence and all unrelated Charter rules.

Reason: Engineering currently says no database and one endpoint; Operations says
one service and stateless rollback. Implementing multiplayer without explicitly
changing these boundaries would contradict the binding Charter.

Decision: APPROVED by the human on 2026-09-27: "同意 ... 其他同意。
资源放在render上，不要碰Azure". Scoped Charter and supporting dependencies approved.

## 2. Room, Identity and Recovery Contract

Question: Is the following first backend contract acceptable: invite-only rooms,
host starts with two humans plus one AI or three humans; no lobby, spectators or
mid-game seat replacement; no new account requirement; separate private seat
recovery credentials; a disconnected human pauses play rather than being silently
replaced; rooms can resume for 24 hours after last activity, then expire?

Recommended answer: Yes. Until the frontend admission flow exists, restrict cloud
room creation/joining to authenticated integration clients using a server-side
admission secret, never a browser-shipped shared secret. Keep invite and resume
credentials separate and persist only resume-token hashes. Store versioned room
snapshots and per-seat command receipts transactionally in PostgreSQL; acknowledge
only after commit. Rebuild per-seat views after reconnect/restart. Ordinary private
hands stay private; explicitly open Ouvert information follows the game rules.
After expiry, report expiry, not a silently new game. Local acceptance uses disposable
local data; production deployment checks are read-only.

Reason: A room code cannot also authenticate an existing seat. SDK reconnect alone
does not establish process-restart recovery. The initial AI choice must not turn
network loss into an unrequested replacement policy. Restricted cloud admission
avoids exposing an unfinished public room API before frontend integration.

Decision: APPROVED WITH CHANGES by the human on 2026-09-27:
"我认为可以允许一个真人2个AI，然后如果掉线，等待多少秒后（用行业惯例）
让AI接管这个掉线的人，该人再重连了可以恢复。"
Support one, two or three humans. Use a 30-second grace period after server-detected
disconnect, then temporary AI control without changing seat ownership. Rejoining
revokes AI control atomically at the next serialized transition; already committed
AI moves stand. A process restart starts a fresh grace period for previously
connected players. Retain the 24-hour recovery/expiry policy.
The official Colyseus reconnection guide uses 30 seconds in its examples and notes
that windows depend on game type; this is a project choice, not a universal standard.
Source: https://github.com/colyseus/docs/blob/master/pages/room/reconnection.mdx

## 3. Render Spend and Delivery

Question: May this ticket create one single-instance Starter Web Service and one
small paid PostgreSQL database in the existing Render `skatgo` project in Frankfurt,
initialize only that new database, and deploy the backend after verification and
merge? Proposed authorization limit: USD 25/month of added fixed resource charges;
verify current service, database and storage pricing before creation and stop if
the total exceeds that limit. This limit is not a quoted bill or a cap on variable
bandwidth, taxes or other account charges.

Recommended answer: Approve these resources and this ticket's one-time automatic
merge, first deployment and closure after successful verification. Use a separate
service hostname; no DNS changes, Redis, disk or change to the existing web service.
Use API-managed resources for headless provisioning and describe them honestly as
such. Keep automatic deploys disabled and pin a merged commit. Authorize ordinary
implementation decisions within the settled plan for this ticket only; new spend,
scope or redline changes still require the human.

Reason: This completes real infrastructure rather than stopping at configuration.
Separating PostgreSQL from the web container avoids tying game durability to one
container filesystem. The single-instance limit deliberately postpones distributed
matchmaking and routing. The current ticket otherwise remains `Finish: review`:
local implementation/verification, then human review before merge or cloud spend.

Decision: APPROVED by the human on 2026-09-27 ("同意 ... 其他同意").
Effective finish is `auto-deploy` for this ticket only. The human also approved
ordinary implementation decisions within this settled plan. No Azure operations.
