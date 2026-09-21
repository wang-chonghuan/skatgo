import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'

import { LANG_TAG } from '~/lib/site'
import { m } from '~/paraglide/messages'
import { type Locale, getLocale, localizeHref, locales, setLocale } from '~/paraglide/runtime'
import { skat } from './theme/skat.stylex'

// The frame around every page of the course: the felt-green header and the reading column.
//
// Carried over verbatim from Parrottoon's /skat route, where this course was built (PARROT-42), so
// that skatgo.com renders what parrottoon.com/skat does. One deliberate difference: Parrottoon's
// header also carries a "← 回 Parrottoon" link. skatgo.com is its own site, so it has none.
//
// The header's right side is the language switch (SKATGO-1). The page language itself is on <html>.

export function SkatLayout() {
  return (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Link to="/" {...stylex.props(styles.brand)}>
          <span {...stylex.props(styles.brandMark)}>♣</span>
          {m.site_name()}
        </Link>
        <LanguageSwitch />
      </header>
      <main {...stylex.props(styles.main)}>
        <Outlet />
      </main>
    </div>
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
          {...stylex.props(styles.lang, l === current && styles.langCurrent)}
        >
          {SELF_NAME[l]}
        </a>
      ))}
    </nav>
  )
}

const styles = stylex.create({
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: skat.paper,
    color: skat.ink,
    colorScheme: 'light',
    fontFamily: '"DM Sans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingBlock: 12,
    paddingInline: { default: 24, '@media (max-width: 480px)': 14 },
    backgroundColor: skat.feltDeep,
    color: skat.white,
  },
  brand: { display: 'flex', alignItems: 'center', gap: 8, color: skat.white, textDecoration: 'none', fontWeight: 800, fontSize: 17 },
  brandMark: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: skat.brass,
    color: skat.ink,
    fontSize: 20,
  },
  switch: { display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 },
  lang: {
    paddingBlock: 5,
    paddingInline: { default: 10, '@media (max-width: 480px)': 8 },
    borderRadius: 999,
    color: skat.white,
    backgroundColor: { default: 'transparent', ':hover': skat.felt },
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.2,
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: 2,
    outlineColor: skat.brass,
    outlineOffset: 1,
  },
  langCurrent: { backgroundColor: { default: skat.brass, ':hover': skat.brass }, color: skat.ink },
  main: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 860,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingBlock: { default: 28, '@media (max-width: 480px)': 16 },
    paddingInline: { default: 24, '@media (max-width: 480px)': 12 },
  },
})
