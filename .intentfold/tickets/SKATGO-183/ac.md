# SKATGO-183 acceptance check

Run on a production build at http://127.0.0.1:55183, with the ticket's multiplayer on 56183. Free play at /en/play. The `skatgo:track` window events are recorded by a listener.

1. While bidding, press the lightbulb (`skat-power-ups-tab`). Expect a `powerup_opened` event with `tool: 'odds'`, and the win chances dialog opens.
2. Pass the bidding, so the AI plays. Once the cards are played, press the lightbulb. Expect a `powerup_opened` event with `tool: 'counter'`, and the counter dialog opens.
3. After deploy, the live bundle on skatgo.com contains `powerup_opened`. Only the published site sends events to PostHog, through `track`, as every other event does.
