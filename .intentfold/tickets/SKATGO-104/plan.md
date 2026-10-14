# SKATGO-104 plan

Found in the code: `LanguageSwitch` (`components/skat/frame.tsx`) is a bordered button showing the
current flag, opening a menu card; the settings dialog lists the languages again with `FLAG`. Flags are
drawn in `theme/flags.tsx` at 22×15. `/` is always German (lib/locale.ts), which is why the switch must
be obvious. The charter's ui.md describes "a flag button opening a card of flags" — it follows the change.

1. `theme/flags.tsx`: `FlagEN` (US/UK diagonal, `useId` for clip ids so SSR matches) replaces `FlagUS`;
   flags 24×16.
2. Tokens: `opacity.flagOff`, `opacity.flagHover`, `border.flagOffset`, `radii.flag`; drop
   `dims.langMenu`, `dims.langMenuTop`.
3. `LanguageSwitch`: a radiogroup of two 32px buttons, each a flag; chosen ringed in `color.go`, other
   faded. Remove the menu's state, effects and styles.
4. Charter ui.md: header line, flags row.
5. Check on the ticket port, desktop 1280 and phone 375 / 320.
