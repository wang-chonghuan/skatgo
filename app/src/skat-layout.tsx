import { Show, SignInButton, UserButton } from '@clerk/tanstack-react-start'
import { Link, Outlet } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'

import { LANG_TAG } from '~/lib/site'
import { AskLauncher } from '~/components/skat/ask'
import { Btn } from '~/components/skat/ui'
import { m } from '~/paraglide/messages'
import { type Locale, getLocale, locales, setLocale } from '~/paraglide/runtime'
import { bp } from './theme/breakpoints.stylex'
import { border, radius, size, space } from './theme/scale.stylex'
import { skat } from './theme/skat.stylex'
import { typography } from './theme/type'

// The frame around every page of the course: the felt-green header and the reading column.
//
// Carried over verbatim from Parrottoon's /skat route, where this course was built (PARROT-42), so
// that skatgo.com renders what parrottoon.com/skat does. One deliberate difference: Parrottoon's
// header also carries a "← 回 Parrottoon" link. skatgo.com is its own site, so it has none.
//
// The header's right side is the language switch (SKATGO-1) and the account (SKATGO-12): one "sign in"
// button at every size — signing up is one click inside Clerk's window — or, signed in, the avatar.
// The page language itself is on <html>.
// After the reading column comes the floating helper (SKATGO-9); it decides itself which pages it is on.

export function SkatLayout() {
  return (
    <div {...stylex.props(typography.frame, styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Link to="/" {...stylex.props(typography.brand, styles.brand)}>
          <img src="/logo-96.png" alt="" {...stylex.props(styles.brandMark)} />
          {m.site_name()}
        </Link>
        <div {...stylex.props(styles.headerEnd)}>
          <LanguageSwitch />
          <Account />
        </div>
      </header>
      <main {...stylex.props(styles.main)}>
        <Outlet />
      </main>
      <AskLauncher />
    </div>
  )
}

/** Signed out: the one way in, opening Clerk's window over the page. Signed in: Clerk's avatar menu. */
function Account() {
  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Btn tone="felt" size="sm" testId="sign-in">
            {m.auth_sign_in()}
          </Btn>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </>
  )
}

/** How each language names itself, in its own script. */
const NAME: Record<Locale, string> = { zh: '中文', en: 'English', de: 'Deutsch' }

/**
 * The language, folded into one menu (SKATGO-23). A native <select>: it opens above everything, a phone
 * shows its own picker, and the keyboard works without help. Choosing goes through Paraglide's
 * setLocale, which loads the same page in that language and remembers the choice (cookie) — the only
 * way the site ever switches to Chinese without the address saying so (lib/locale.ts). Crawlers find
 * the other languages through the <link rel="alternate" hreflang> tags every page carries.
 */
function LanguageSwitch() {
  const current = getLocale()
  return (
    <span {...stylex.props(styles.switch)}>
      <select
        aria-label={m.language_label()}
        data-testid="language-switch"
        value={current}
        onChange={(e) => {
          const next = e.target.value as Locale
          if (next !== current) void setLocale(next)
        }}
        {...stylex.props(typography.switch, styles.select)}
      >
        {locales.map((l) => (
          <option key={l} value={l} lang={LANG_TAG[l]} {...stylex.props(styles.option)}>
            {NAME[l]}
          </option>
        ))}
      </select>
      <span aria-hidden="true" {...stylex.props(typography.switch, styles.chevron)}>
        ▾
      </span>
    </span>
  )
}

const styles = stylex.create({
  page: {
    minHeight: size.screen,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: skat.paper,
    color: skat.ink,
    colorScheme: 'light',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.x12,
    paddingBlock: space.x12,
    paddingInline: { default: space.x24, [bp.phone]: space.x14 },
    backgroundColor: skat.feltDeep,
    color: skat.white,
  },
  brand: { display: 'flex', alignItems: 'center', gap: space.x8, color: skat.white, textDecoration: 'none' },
  // The SkatGo logo (SKATGO-23): a square image, rounded here like a card.
  brandMark: { display: 'block', width: size.brandMark, height: size.brandMark, borderRadius: radius.card, flexShrink: 0 },
  headerEnd: { display: 'flex', alignItems: 'center', gap: { default: space.x12, [bp.phone]: space.x6 }, flexShrink: 0 },
  switch: { position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 },
  // A pill on the felt header, the chevron drawn over its right end.
  select: {
    appearance: 'none',
    margin: 0,
    paddingBlock: space.x6,
    paddingLeft: space.x12,
    paddingRight: space.x24,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: skat.feltLight,
    borderRadius: radius.round,
    color: skat.white,
    backgroundColor: { default: 'transparent', ':hover': skat.felt },
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focusSm,
    outlineColor: skat.brass,
    outlineOffset: border.focusOffsetSm,
  },
  // The open list is drawn by the browser; give its rows the page's paper and ink so they never
  // inherit the header's white-on-transparent.
  option: { color: skat.ink, backgroundColor: skat.paper },
  chevron: { position: 'absolute', right: space.x10, color: skat.white, pointerEvents: 'none' },
  main: {
    flexGrow: 1,
    width: '100%',
    maxWidth: size.column,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingBlock: { default: space.x28, [bp.phone]: space.x16 },
    paddingInline: { default: space.x24, [bp.phone]: space.x12 },
  },
})
