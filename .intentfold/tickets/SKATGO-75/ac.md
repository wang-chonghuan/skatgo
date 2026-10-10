# SKATGO-75 acceptance check plan

Free play on the built product, scripted legal moves (`tmp/check.mjs`, `tmp/reveal.mjs`), desktop
1280×800 and phone 390×844.

## 1. Default: a trick goes by itself after about 1.2 s, no hand
- Met when: the trick line disappears 1.1–1.4 s after the trick completes, with no tap hand shown.

## 2. Tap-to-collect on: the trick waits with the hand; a tap takes it
- Met when: 2.5 s after the trick completes it is still there with the hand; one tap removes it.

## 3. An early end is always laid open until a tap, whatever the setting
- Met when: with the default setting, a claim shows the reveal and no settlement until a tap.

## 4. Language in the settings follows the header and vice versa
- Met when: choosing English in the settings loads the English page and the header's menu ticks English.

## 5. The page behind the open settings neither scrolls nor takes a touch
- Met when: with the dialog open the page's scrolling is off and a point over the hand does not reach
  the hand; after closing, both are back.
