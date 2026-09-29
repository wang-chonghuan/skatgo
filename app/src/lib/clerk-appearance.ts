import { color } from '../theme/color.stylex'
import { radii } from '../theme/shape.stylex'

// Clerk's own windows — sign-in, sign-up, the account menu (SKATGO-12) — in the product's colours.
// Clerk draws them itself, like deep-chat draws the chat; what we control is the palette it is
// handed, and that is the registry's tokens, never a colour of its own. In the lobby design
// (SKATGO-26) they are white dialogs with the green action and the table's 12px corners. The windows
// stay in English: the human chose not to add Clerk's translation package.
export const clerkAppearance = {
  variables: {
    colorPrimary: color.go,
    colorPrimaryForeground: color.onColor,
    colorBackground: color.surface,
    colorForeground: color.text,
    colorMutedForeground: color.slate,
    colorInput: color.surface,
    colorInputForeground: color.text,
    colorBorder: color.hairline,
    colorDanger: color.stop,
    colorRing: color.info,
    borderRadius: radii.panel,
  },
}
