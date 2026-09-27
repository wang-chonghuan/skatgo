import { Show, SignInButton, UserButton } from '@clerk/tanstack-react-start'
import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'

import { LANG_TAG } from '~/lib/site'
import { AskLauncher } from '~/components/skat/ask'
import { Btn } from '~/components/skat/ui'
import { m } from '~/paraglide/messages'
import { type Locale, getLocale, localizeHref, locales, setLocale } from '~/paraglide/runtime'
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
          <span {...stylex.props(typography.markGlyph, styles.brandMark)}>♣</span>
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

/** How each language names itself in the switch: short enough for a phone header, in its own script. */
const SELF_NAME: Record<Locale, string> = { zh: '中文', en: 'EN', de: 'DE' }
const FULL_NAME: Record<Locale, string> = { zh: '中文', en: 'English', de: 'Deutsch' }

/**
 * The same page in the other languages. Each is a real link to that language's URL — crawlers and
 * "open in new tab" follow it — and a click goes through Paraglide's setLocale, which also remembers
 * the choice (cookie) for the next visit to skatgo.com.
 */
function LanguageSwitch() {
  const path = useRouterState({ select: (s) => s.location.pathname })
  const current = getLocale()
  return (
    <nav aria-label={m.language_label()} data-testid="language-switch" {...stylex.props(styles.switch)}>
      {locales.map((l) => (
        <a
          key={l}
          href={localizeHref(path, { locale: l })}
          hrefLang={LANG_TAG[l]}
          lang={LANG_TAG[l]}
          aria-label={FULL_NAME[l]}
          aria-current={l === current ? 'true' : undefined}
          data-locale={l}
          onClick={(e) => {
            e.preventDefault()
            if (l !== current) void setLocale(l)
          }}
          {...stylex.props(typography.switch, styles.lang, l === current && styles.langCurrent)}
        >
          {SELF_NAME[l]}
        </a>
      ))}
    </nav>
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
  brandMark: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: size.brandMark,
    height: size.brandMark,
    borderRadius: radius.card,
    backgroundColor: skat.brass,
    color: skat.ink,
  },
  headerEnd: { display: 'flex', alignItems: 'center', gap: { default: space.x12, [bp.phone]: space.x6 }, flexShrink: 0 },
  switch: { display: 'flex', alignItems: 'center', gap: space.x2, flexShrink: 0 },
  lang: {
    paddingBlock: space.x6,
    paddingInline: { default: space.x10, [bp.phone]: space.x8 },
    borderRadius: radius.round,
    color: skat.white,
    backgroundColor: { default: 'transparent', ':hover': skat.felt },
    textDecoration: 'none',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focusSm,
    outlineColor: skat.brass,
    outlineOffset: border.focusOffsetSm,
  },
  langCurrent: { backgroundColor: { default: skat.brass, ':hover': skat.brass }, color: skat.ink },
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
