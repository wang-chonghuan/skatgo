import { Show, SignInButton, UserButton } from '@clerk/tanstack-react-start'
import { Link, useRouterState } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { Check, ChevronDown, Menu, Settings, X } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'

import { type CardColours, useSettings } from '~/lib/skat/settings'
import { LANG_TAG } from '~/lib/site'
import { m } from '~/paraglide/messages'
import { type Locale, getLocale, locales, setLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { timing } from '../../theme/effects.stylex'
import { elev } from '../../theme/elevation.stylex'
import { border, layer, opacity, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { suit as suitCard, fourColours, twoColours } from '../../theme/suits.stylex'
import { FlagDE, FlagUS } from '../../theme/flags'
import { typography } from '../../theme/type'
import { Btn, suitText } from './ui'

// The frame pieces of the lobby design (SKATGO-26, reference.md): the public site's white header over
// every page but the tables (SKATGO-43, SKATGO-47), with the language menu, the card-colour settings
// and the account. Navigation carries only what skatgo
// has (SKATGO-29: nothing announced).

type Section = 'home' | 'daily' | 'course' | 'rules' | 'play'

/** Which section a path belongs to. The router has already removed the language prefix. */
export function sectionOf(pathname: string): Section {
  // The tournament's table wears the table's frame (SKATGO-35).
  if (pathname.startsWith('/daily/play')) return 'play'
  if (pathname.startsWith('/daily')) return 'daily'
  if (pathname.startsWith('/course')) return 'course'
  if (pathname.startsWith('/rules')) return 'rules'
  if (pathname.startsWith('/play')) return 'play'
  return 'home'
}

export function useSection(): Section {
  return useRouterState({ select: (s) => sectionOf(s.location.pathname) })
}

/** Which frame a path wears: the tables fill the screen; every other page, lessons included, wears the
 *  front page's header (SKATGO-43, SKATGO-47). The router has already removed the language prefix. */
export function frameOf(pathname: string): 'landing' | 'table' {
  return sectionOf(pathname) === 'play' ? 'table' : 'landing'
}

export function useFrame() {
  return useRouterState({ select: (s) => frameOf(s.location.pathname) })
}

/** The front page's links, in this order (the human, 2026-10-01): today's deals, guided free play, the
 *  course, the rules. No separate "Play" button beside them. */
const HEADER_LINKS: { to: '/daily' | '/play' | '/course' | '/rules'; label: () => string }[] = [
  { to: '/daily', label: () => m.nav_header_daily() },
  { to: '/play', label: () => m.nav_header_free() },
  { to: '/course', label: () => m.nav_course() },
  { to: '/rules', label: () => m.nav_rules() },
]

/** The front page's header: the public site's white bar, also over the tournament, the course and the
 *  rules (SKATGO-43). On a phone the links fold into a menu. */
export function LandingHeader() {
  const [open, setOpen] = useState(false)
  return (
    <header data-testid="landing-header" {...stylex.props(styles.landingHeader)}>
      <Link to="/" {...stylex.props(typography.landingHeading, styles.landingBrand)}>
        <img src="/logo-96.png" alt="" {...stylex.props(styles.landingMark)} />
        <span {...stylex.props(typography.landingBrand)}>{m.site_name()}</span>
      </Link>
      <nav aria-label={m.nav_label()} {...stylex.props(styles.landingNav)}>
        {HEADER_LINKS.map((l) => (
          <Link key={l.to} to={l.to} data-nav={l.to} {...stylex.props(typography.landingNav, styles.landingLink)}>{l.label()}</Link>
        ))}
      </nav>
      <div {...stylex.props(styles.landingEnd)}>
        <LanguageSwitch />
        <SettingsButton />
        <span {...stylex.props(styles.desktopOnly)}>
          <Account shape="landing" />
        </span>
        <button type="button" aria-label={m.nav_menu()} aria-expanded={open} data-testid="landing-menu" onClick={() => setOpen((o) => !o)} {...stylex.props(styles.menuButton)}>
          {open ? <X size={icon.menu} strokeWidth={icon.outline} /> : <Menu size={icon.menu} strokeWidth={icon.outline} />}
        </button>
      </div>
      {open ? (
        <div data-testid="landing-menu-panel" {...stylex.props(styles.menuPanel)}>
          {HEADER_LINKS.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} {...stylex.props(typography.landingNav, styles.menuLink)}>{l.label()}</Link>
          ))}
          <div {...stylex.props(styles.menuAccount)}>
            <Account />
          </div>
        </div>
      ) : null}
    </header>
  )
}

/** Signed out: the one way in, opening Clerk's window over the page. Signed in: Clerk's avatar menu.
 *  In the public site's header it takes that header's button shape, the same as "Play" beside it. */
export function Account({ shape = 'pill' }: { shape?: 'pill' | 'landing' }) {
  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Btn tone="quiet" size="md" shape={shape} testId="sign-in">
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
const NAME: Record<Locale, string> = { en: 'English', de: 'Deutsch' }

const FLAG: Record<Locale, () => ReactNode> = { en: FlagUS, de: FlagDE }

/**
 * The language menu (SKATGO-23), drawn the way Funbridge draws it (SKATGO-29): a small bordered button
 * with the current language's flag, opening a card of flags and names, the current one ticked. Choosing
 * goes through Paraglide's setLocale, which loads the same page in that language and remembers the
 * choice (cookie). Closes on a choice, a click outside or Escape.
 */
export function LanguageSwitch() {
  const current = getLocale()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLSpanElement | null>(null)
  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', away)
      document.removeEventListener('keydown', escape)
    }
  }, [open])
  const Current = FLAG[current]
  return (
    <span ref={root} {...stylex.props(styles.switch)}>
      <button
        type="button"
        aria-label={m.language_label()}
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="language-switch"
        onClick={() => setOpen((o) => !o)}
        {...stylex.props(styles.langButton)}
      >
        <Current />
        <ChevronDown size={icon.inline} strokeWidth={icon.outline} />
      </button>
      {open ? (
        <div role="menu" aria-label={m.language_label()} data-testid="language-menu" {...stylex.props(styles.langMenu)}>
          {locales.map((l) => {
            const Flag = FLAG[l]
            const chosen = l === current
            return (
              <button
                key={l}
                type="button"
                role="menuitemradio"
                aria-checked={chosen}
                lang={LANG_TAG[l]}
                data-locale={l}
                onClick={() => {
                  setOpen(false)
                  if (!chosen) void setLocale(l)
                }}
                {...stylex.props(typography.appLink, styles.langItem, chosen && styles.langItemChosen)}
              >
                <Flag />
                <span {...stylex.props(styles.langName)}>{NAME[l]}</span>
                {chosen ? <Check size={icon.inline} strokeWidth={icon.outline} /> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </span>
  )
}

// --- Card colours (SKATGO-27) --------------------------------------------------------------------

const SCHEMES: { key: CardColours; label: () => string }[] = [
  { key: 'german', label: () => m.scheme_german() },
  { key: 'four', label: () => m.scheme_four() },
  { key: 'two', label: () => m.scheme_two() },
]
const THEMES = { german: null, four: fourColours, two: twoColours }

/**
 * The chosen scheme's theme, for the frame's root. Null until after mount: the server and the first
 * client render use the default (German), so the markup hydrates; a stored choice applies at once after.
 */
export function useCardColourTheme() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const chosen = useSettings((s) => s.cardColours)
  return mounted ? THEMES[chosen] : null
}

/** The gear beside the language menu: opens the card-colour choice. */
export function SettingsButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" aria-label={m.settings_open()} title={m.settings_open()} data-testid="settings-open" onClick={() => setOpen(true)} {...stylex.props(styles.gear)}>
        <Settings size={icon.gear} strokeWidth={icon.outline} />
      </button>
      {open ? <SettingsDialog onClose={() => setOpen(false)} /> : null}
    </>
  )
}

/** The three schemes, each shown as its four suits in its own colours; choosing applies at once. */
export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const chosen = useSettings((s) => s.cardColours)
  const choose = useSettings((s) => s.setCardColours)
  return (
    <div data-testid="settings-dialog" {...stylex.props(styles.scrim)} onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={m.settings_title()} onClick={(e) => e.stopPropagation()} {...stylex.props(styles.dialog)}>
        <div {...stylex.props(styles.dialogHead)}>
          <h2 {...stylex.props(typography.dialogTitle, styles.dialogTitle)}>{m.settings_title()}</h2>
          <button type="button" aria-label={m.settings_close()} data-testid="settings-close" onClick={onClose} {...stylex.props(styles.close)}>
            <X size={icon.menu} strokeWidth={icon.outline} />
          </button>
        </div>
        <div role="radiogroup" aria-label={m.settings_title()} {...stylex.props(styles.schemes)}>
          {SCHEMES.map((scheme) => {
            const on = scheme.key === chosen
            const theme = THEMES[scheme.key]
            return (
              <button
                key={scheme.key}
                type="button"
                role="radio"
                aria-checked={on}
                data-testid={`scheme-${scheme.key}`}
                onClick={() => choose(scheme.key)}
                {...stylex.props(typography.appBtnStrong, styles.scheme, on && styles.schemeOn)}
              >
                <span {...stylex.props(styles.schemeName)}>{scheme.label()}</span>
                {/* The swatch wears its own scheme, whatever the page's is. */}
                <span aria-hidden="true" {...stylex.props(typography.dialogTitle, styles.swatch, theme)}>
                  {(['♣', '♠', '♥', '♦'] as const).map((g) => (
                    <span key={g} {...stylex.props(swatchInk[g])}>{g}</span>
                  ))}
                </span>
                <span aria-hidden="true" {...stylex.props(styles.check, !on && styles.checkOff)}>
                  <Check size={icon.inline} strokeWidth={icon.outline} />
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// A swatch shows the scheme's card colours (on the white dialog, exactly as on a card face).
const swatchInk = stylex.create({
  '♣': { color: suitCard.cardClubs },
  '♠': { color: suitCard.cardSpades },
  '♥': { color: suitCard.cardHearts },
  '♦': { color: suitCard.cardDiamonds },
})

const focus = {
  outlineStyle: { default: 'none', ':focus-visible': 'solid' },
  outlineWidth: border.focus,
  outlineColor: color.info,
  outlineOffset: border.focusOffset,
} as const

const styles = stylex.create({
  // The header's mark (SKATGO-31).
  landingMark: {
    display: 'block',
    width: { default: dims.landingMark, [bp.phone]: dims.landingMarkPhone },
    height: { default: dims.landingMark, [bp.phone]: dims.landingMarkPhone },
    borderRadius: radii.card,
    flexShrink: 0,
  },
  landingHeader: {
    position: 'sticky',
    top: 0,
    zIndex: layer.launcher,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.x16,
    height: { default: dims.landingHeader, [bp.phone]: dims.landingHeaderPhone },
    paddingInline: space.x20,
    boxSizing: 'border-box',
    backgroundColor: color.surface,
    boxShadow: elev.landingHeader,
  },
  landingBrand: { display: 'flex', alignItems: 'center', gap: space.x10, color: color.navy, textDecoration: 'none', ...focus },
  landingNav: { display: { default: 'flex', [bp.phone]: 'none' }, alignItems: 'center', gap: space.x32 },
  landingLink: { color: { default: color.slate, ':hover': color.navy }, textDecoration: 'none', ...focus },
  landingEnd: { display: 'flex', alignItems: 'center', gap: space.x12 },
  desktopOnly: { display: { default: 'inline-flex', [bp.phone]: 'none' } },
  menuButton: {
    display: { default: 'none', [bp.phone]: 'inline-flex' },
    alignItems: 'center',
    justifyContent: 'center',
    width: dims.iconButton,
    height: dims.iconButton,
    padding: 0,
    borderWidth: 0,
    borderRadius: radii.round,
    backgroundColor: 'transparent',
    color: color.navy,
    cursor: 'pointer',
    ...focus,
  },
  menuPanel: {
    position: 'absolute',
    top: '100%',
    insetInline: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: space.x8,
    paddingBlock: space.x16,
    paddingInline: space.x20,
    backgroundColor: color.surface,
    boxShadow: elev.landingHeader,
  },
  menuLink: { paddingBlock: space.x8, color: color.navy, textDecoration: 'none', ...focus },
  menuAccount: { paddingTop: space.x8 },

  switch: { position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 },
  // The menu's button: a bordered white box with the flag and a small chevron.
  langButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.x6,
    height: { default: dims.control, [bp.phone]: space.x32 },
    paddingInline: { default: space.x12, [bp.phone]: space.x8 },
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: color.hairline,
    borderRadius: radii.panel,
    backgroundColor: color.surface,
    color: color.navy,
    cursor: 'pointer',
    ...focus,
  },
  // The open card of languages, under the button's right edge.
  langMenu: {
    position: 'absolute',
    top: dims.langMenuTop,
    right: 0,
    zIndex: layer.window,
    display: 'flex',
    flexDirection: 'column',
    minWidth: dims.langMenu,
    padding: space.x6,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: color.hairline,
    borderRadius: radii.panel,
    backgroundColor: color.surface,
    boxShadow: elev.panel,
  },
  langItem: {
    display: 'flex',
    alignItems: 'center',
    gap: space.x10,
    width: '100%',
    paddingBlock: space.x8,
    paddingInline: space.x10,
    borderWidth: 0,
    borderRadius: radii.column,
    backgroundColor: { default: 'transparent', ':hover': color.page },
    color: color.navy,
    textAlign: 'start',
    cursor: 'pointer',
    ...focus,
  },
  langItemChosen: { backgroundColor: color.page },
  langName: { flexGrow: 1 },

  gear: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: { default: dims.control, [bp.phone]: space.x32 },
    height: { default: dims.control, [bp.phone]: space.x32 },
    padding: 0,
    borderWidth: 0,
    borderRadius: radii.round,
    backgroundColor: color.surface,
    color: color.navy,
    boxShadow: elev.option,
    cursor: 'pointer',
    ...focus,
  },
  scrim: {
    position: 'fixed',
    inset: 0,
    zIndex: layer.window,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.x16,
    backgroundColor: color.scrim,
  },
  dialog: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x16,
    width: dims.settingsWidth,
    boxSizing: 'border-box',
    padding: space.x24,
    borderRadius: radii.dialog,
    backgroundColor: color.surface,
    boxShadow: elev.panel,
    color: color.text,
  },
  dialogHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space.x12 },
  dialogTitle: { margin: 0, color: color.navy },
  close: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: dims.control,
    height: dims.control,
    padding: 0,
    borderWidth: 0,
    borderRadius: radii.round,
    backgroundColor: { default: 'transparent', ':hover': color.page },
    color: color.navy,
    cursor: 'pointer',
    ...focus,
  },
  schemes: { display: 'flex', flexDirection: 'column', gap: space.x10 },
  scheme: {
    display: 'flex',
    alignItems: 'center',
    gap: space.x12,
    minHeight: space.x48,
    paddingInline: space.x16,
    borderRadius: radii.panel,
    borderWidth: border.tile,
    borderStyle: 'solid',
    borderColor: { default: color.hairline, ':hover': color.go },
    backgroundColor: color.surface,
    color: color.navy,
    textAlign: 'left',
    cursor: 'pointer',
    ...focus,
  },
  schemeOn: { borderColor: color.go, backgroundColor: color.goodSoft },
  schemeName: { flexGrow: 1 },
  swatch: { display: 'inline-flex', gap: space.x6 },
  check: { display: 'flex', color: color.go },
  checkOff: { visibility: 'hidden' },
})
