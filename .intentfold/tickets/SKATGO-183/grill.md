# SKATGO-183 grill (Grill: agent)

The agent decided the following; none reaches the human bar.

1. **Event name and shape:** `powerup_opened` with `tool: 'odds' | 'counter'`, following the tracking plan's `object_action` rule. What differs between occasions goes in a property, not in the name.
2. **One event per press:** the event is sent every time the lightbulb is pressed. Whether people open the tools is the question, and PostHog counts both presses and unique persons from the same event.
3. **No phase property:** `odds` already covers bidding and the moment after the skat is picked up. The ask is who opens the tools, not when.
