import { skat } from '../theme/skat.stylex'

// Clerk's own windows — sign-in, sign-up, the account menu (SKATGO-12) — in the course's colours.
// Clerk draws them itself, like deep-chat draws the chat; what we control is the palette it is
// handed, and that is the course's tokens, never a colour of its own. The windows stay in English:
// the human chose not to add Clerk's translation package.
export const clerkAppearance = {
  variables: {
    colorPrimary: skat.brass,
    colorPrimaryForeground: skat.ink,
    colorBackground: skat.paper,
    colorForeground: skat.ink,
    colorMutedForeground: skat.inkSoft,
    colorInput: skat.white,
    colorInputForeground: skat.ink,
    colorBorder: skat.paperEdge,
    colorDanger: skat.bad,
    colorRing: skat.brass,
    borderRadius: '12px',
  },
}
