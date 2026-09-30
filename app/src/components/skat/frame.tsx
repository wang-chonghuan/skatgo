import { Show, SignInButton, UserButton } from '@clerk/tanstack-react-start'
import { Link, useRouterState } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { BookOpen, CalendarDays, Check, ChevronLeft, GraduationCap, House, Menu, Settings, Spade, X } from 'lucide-react'
import { type ComponentType, type ReactNode, useEffect, useState } from 'react'

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
import { typography } from '../../theme/type'
import { Btn, linkLook, suitText } from './ui'

// The frame pieces of the lobby design (SKATGO-26, reference.md):
//   Rail           the app's left navigation, desktop;
//   TabBar         the same navigation as a bottom bar, phone;
//   LandingHeader  the public site's white header, on the front page;
//   Band           a sub-page's coloured band: back and home, the page's title, language and account.
// Navigation carries only what skatgo has (SKATGO-29: nothing announced).

type Section = 'home' | 'daily' | 'course' | 'rules' | 'play'
type Item = { key: string; section: Section; to: '/' | '/daily' | '/course' | '/rules' | '/play'; Icon: ComponentType<{ size?: number; strokeWidth?: number }>; label: () => string }

const ITEMS: Item[] = [
  { key: 'home', section: 'home', to: '/', Icon: House, label: () => m.nav_home() },
  { key: 'daily', section: 'daily', to: '/daily', Icon: CalendarDays, label: () => m.nav_daily() },
  { key: 'course', section: 'course', to: '/course', Icon: GraduationCap, label: () => m.nav_course() },
  { key: 'rules', section: 'rules', to: '/rules', Icon: BookOpen, label: () => m.nav_rules() },
  { key: 'play', section: 'play', to: '/play', Icon: Spade, label: () => m.nav_play() },
]

/** Which section a path belongs to. The router has already removed the language prefix. */
export function sectionOf(pathname: string): Section {
  if (pathname.startsWith('/daily')) return 'daily'
  if (pathname.startsWith('/course')) return 'course'
  if (pathname.startsWith('/rules')) return 'rules'
  if (pathname.startsWith('/play')) return 'play'
  return 'home'
}

export function useSection(): Section {
  return useRouterState({ select: (s) => sectionOf(s.location.pathname) })
}

export function Rail() {
  const current = useSection()
  return (
    <nav aria-label={m.nav_label()} data-testid="rail" {...stylex.props(styles.rail)}>
      <Link to="/" aria-label={m.site_name()} {...stylex.props(styles.railBrand)}>
        <img src="/logo-96.png" alt="" {...stylex.props(styles.brandMark)} />
      </Link>
      {ITEMS.map((item) => (
        <NavItem key={item.key} item={item} active={item.section === current} variant="rail" />
      ))}
    </nav>
  )
}

export function TabBar() {
  const current = useSection()
  return (
    <nav aria-label={m.nav_label()} data-testid="tab-bar" {...stylex.props(styles.tabBar)}>
      {ITEMS.map((item) => (
        <NavItem key={item.key} item={item} active={item.section === current} variant="tab" />
      ))}
    </nav>
  )
}

function NavItem({ item, active, variant }: { item: Item; active: boolean; variant: 'rail' | 'tab' }) {
  const look = variant === 'rail' ? styles.railItem : styles.tabItem
  const inner = (
    <>
      <item.Icon size={variant === 'rail' ? icon.rail : icon.tab} strokeWidth={icon.outline} />
      <span {...stylex.props(typography.railLabel)}>{item.label()}</span>
    </>
  )
  return (
    <Link to={item.to} data-nav={item.key} data-state={active ? 'active' : undefined} aria-current={active ? 'page' : undefined} {...stylex.props(look, styles.itemLink, active && styles.itemActive)}>
      {inner}
    </Link>
  )
}

/** The front page's header: the public site's white bar. On a phone the links fold into a menu. */
export function LandingHeader() {
  const [open, setOpen] = useState(false)
  return (
    <header data-testid="landing-header" {...stylex.props(styles.landingHeader)}>
      <Link to="/" {...stylex.props(typography.landingHeading, styles.landingBrand)}>
        <img src="/logo-96.png" alt="" {...stylex.props(styles.brandMark)} />
        <span {...stylex.props(typography.dialogTitle)}>{m.site_name()}</span>
      </Link>
      <nav aria-label={m.nav_label()} {...stylex.props(styles.landingNav)}>
        <Link to="/daily" {...stylex.props(typography.landingNav, styles.landingLink)}>{m.nav_daily()}</Link>
        <Link to="/course" {...stylex.props(typography.landingNav, styles.landingLink)}>{m.nav_course()}</Link>
        <Link to="/rules" {...stylex.props(typography.landingNav, styles.landingLink)}>{m.nav_rules()}</Link>
        <Link to="/play" {...stylex.props(typography.landingNav, styles.landingLink)}>{m.nav_play()}</Link>
      </nav>
      <div {...stylex.props(styles.landingEnd)}>
        <span {...stylex.props(styles.desktopOnly)}>
          <Link to="/play" data-testid="header-play" {...linkLook('go', 'md', 'landing')}>{m.nav_play()}</Link>
        </span>
        <LanguageSwitch />
        <SettingsButton />
        <span {...stylex.props(styles.desktopOnly)}>
          <Account shape="landing" />
        </span>
        <button type="button" aria-label={m.nav_menu()} aria-expanded={open} data-testid="landing-menu" onClick={() => setOpen((o) => !o)} {...stylex.props(styles.menuButton)}>
          {open ? <X size={icon.tab} strokeWidth={icon.outline} /> : <Menu size={icon.tab} strokeWidth={icon.outline} />}
        </button>
      </div>
      {open ? (
        <div data-testid="landing-menu-panel" {...stylex.props(styles.menuPanel)}>
          <Link to="/daily" onClick={() => setOpen(false)} {...stylex.props(typography.landingNav, styles.menuLink)}>{m.nav_daily()}</Link>
          <Link to="/course" onClick={() => setOpen(false)} {...stylex.props(typography.landingNav, styles.menuLink)}>{m.nav_course()}</Link>
          <Link to="/rules" onClick={() => setOpen(false)} {...stylex.props(typography.landingNav, styles.menuLink)}>{m.nav_rules()}</Link>
          <Link to="/play" onClick={() => setOpen(false)} {...stylex.props(typography.landingNav, styles.menuLink)}>{m.nav_play()}</Link>
          <div {...stylex.props(styles.menuAccount)}>
            <Account />
          </div>
        </div>
      ) : null}
    </header>
  )
}

/** A sub-page's band, in its section's colour: back and home on the left, language and account on the
 *  right, the page's icon and title centred at the bottom. */
export function Band({ title, Icon, back, testId }: { title: string; Icon: ComponentType<{ size?: number; strokeWidth?: number }>; back: '/' | '/course'; testId?: string }) {
  return (
    <header data-testid={testId ?? 'band'} {...stylex.props(styles.band)}>
      <div {...stylex.props(styles.bandTop)}>
        <div {...stylex.props(styles.bandNav)}>
          <Link to={back} data-testid="band-back" {...stylex.props(typography.bandBack, styles.bandLink)}>
            <ChevronLeft size={icon.bandNav} strokeWidth={icon.outline} />
            {m.nav_back()}
          </Link>
          <Link to="/" aria-label={m.nav_home_link()} {...stylex.props(styles.bandLink)}>
            <House size={icon.bandNav} strokeWidth={icon.outline} />
          </Link>
        </div>
        <div {...stylex.props(styles.bandEnd)}>
          <LanguageSwitch />
          <SettingsButton />
          <Account />
        </div>
      </div>
      <h1 {...stylex.props(typography.bandTitle, styles.bandTitle)}>
        <Icon size={icon.band} strokeWidth={icon.outline} />
        {title}
      </h1>
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

/**
 * The language, folded into one menu (SKATGO-23), drawn as the design's white pill. A native <select>:
 * it opens above everything, a phone shows its own picker, and the keyboard works without help.
 * Choosing goes through Paraglide's setLocale, which loads the same page in that language and remembers
 * the choice (cookie).
 */
export function LanguageSwitch() {
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
        {...stylex.props(typography.appBtn, styles.select)}
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
        <Settings size={icon.bandNav} strokeWidth={icon.outline} />
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
            <X size={icon.tab} strokeWidth={icon.outline} />
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

/** Wraps page content that needs the space the rail and the tab bar take. */
export function AppShell({ children }: { children: ReactNode }) {
  return <div {...stylex.props(styles.appShell)}>{children}</div>
}

const focus = {
  outlineStyle: { default: 'none', ':focus-visible': 'solid' },
  outlineWidth: border.focus,
  outlineColor: color.info,
  outlineOffset: border.focusOffset,
} as const

const styles = stylex.create({
  // The rail: 120 wide, white, full height, items stacked under the brand mark.
  rail: {
    position: 'fixed',
    insetBlock: 0,
    left: 0,
    zIndex: layer.launcher,
    display: { default: 'flex', [bp.phone]: 'none' },
    flexDirection: 'column',
    alignItems: 'center',
    width: dims.rail,
    paddingTop: space.x16,
    boxSizing: 'border-box',
    backgroundColor: color.surface,
    overflowY: 'auto',
  },
  railBrand: { display: 'flex', paddingBottom: space.x16, ...focus },
  brandMark: { display: 'block', width: dims.brandMark, height: dims.brandMark, borderRadius: radii.card, flexShrink: 0 },
  railItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.x4,
    width: dims.railItem,
    minHeight: dims.railItemHeight,
    boxSizing: 'border-box',
    paddingBlock: space.x16,
    paddingInline: space.x6,
    borderTopWidth: border.hair,
    borderTopStyle: 'solid',
    borderTopColor: color.hairline,
    backgroundColor: color.surface,
    color: color.slateDeep,
    textDecoration: 'none',
  },
  tabBar: {
    position: 'fixed',
    insetInline: 0,
    bottom: 0,
    zIndex: layer.launcher,
    display: { default: 'none', [bp.phone]: 'grid' },
    gridTemplateColumns: dims.tabColumns,
    height: dims.tabBar,
    borderTopWidth: border.hair,
    borderTopStyle: 'solid',
    borderTopColor: color.hairline,
    backgroundColor: color.surface,
  },
  tabItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.x2,
    color: color.slateDeep,
    textDecoration: 'none',
  },
  itemLink: { transitionProperty: 'color', transitionDuration: { default: timing.tile, [bp.reducedMotion]: timing.instant }, color: { default: color.slateDeep, ':hover': color.navy }, ...focus },
  itemActive: { color: { default: color.go, ':hover': color.go } },

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

  band: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: { default: dims.band, [bp.phone]: dims.bandPhone },
    boxSizing: 'border-box',
    paddingBlock: space.x16,
    paddingLeft: { default: space.x16, [bp.phone]: space.x12 },
    paddingRight: { default: space.x24, [bp.phone]: space.x12 },
    backgroundColor: color.tileOrange,
    boxShadow: elev.band,
    color: color.onColor,
  },
  // On a phone the band's row holds back, home, the language, the settings gear and the account in
  // 351px (the longest labels, German): its gaps, the gear and the language pill's padding tighten there.
  bandTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: { default: space.x12, [bp.phone]: space.x8 } },
  bandNav: { display: 'flex', alignItems: 'center', gap: { default: space.x16, [bp.phone]: space.x8 } },
  bandLink: { display: 'inline-flex', alignItems: 'center', gap: space.x4, color: color.onColor, textDecoration: 'none', ...focus },
  bandEnd: { display: 'flex', alignItems: 'center', gap: { default: space.x12, [bp.phone]: space.x6 } },
  bandTitle: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: space.x10, margin: 0, color: color.onColor },

  switch: { position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 },
  select: {
    appearance: 'none',
    margin: 0,
    height: dims.control,
    paddingLeft: { default: space.x16, [bp.phone]: space.x12 },
    paddingRight: { default: space.x32, [bp.phone]: space.x24 },
    borderWidth: 0,
    borderRadius: radii.pill,
    color: color.navy,
    backgroundColor: color.surface,
    boxShadow: elev.option,
    cursor: 'pointer',
    ...focus,
  },
  // The open list is drawn by the browser; give its rows the page's surface and text.
  option: { color: color.text, backgroundColor: color.surface },
  chevron: { position: 'absolute', right: { default: space.x14, [bp.phone]: space.x10 }, color: color.navy, pointerEvents: 'none' },

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
  appShell: {
    minHeight: dims.screen,
    paddingLeft: { default: dims.rail, [bp.phone]: 0 },
    paddingBottom: { default: 0, [bp.phone]: dims.tabBar },
    boxSizing: 'border-box',
  },
})
