import { Show, SignInButton, UserButton } from '@clerk/tanstack-react-start'
import { Link, useRouterState } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { ChevronLeft, Copy, GraduationCap, House, Menu, Puzzle, Spade, X } from 'lucide-react'
import { type ComponentType, type ReactNode, useState } from 'react'

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
import { typography } from '../../theme/type'
import { Btn, linkLook } from './ui'

// The frame pieces of the lobby design (SKATGO-26, reference.md):
//   Rail           the app's left navigation, desktop;
//   TabBar         the same navigation as a bottom bar, phone;
//   LandingHeader  the public site's white header, on the front page;
//   Band           a sub-page's coloured band: back and home, the page's title, language and account.
// Navigation carries only what skatgo has; sections not open yet are shown, marked, and not links.

type Section = 'home' | 'course' | 'play'
type Item = { key: string; section?: Section; to?: '/' | '/course' | '/play'; Icon: ComponentType<{ size?: number; strokeWidth?: number }>; label: () => string }

const ITEMS: Item[] = [
  { key: 'home', section: 'home', to: '/', Icon: House, label: () => m.nav_home() },
  { key: 'course', section: 'course', to: '/course', Icon: GraduationCap, label: () => m.nav_course() },
  { key: 'play', section: 'play', to: '/play', Icon: Spade, label: () => m.nav_play() },
  { key: 'duplicate', Icon: Copy, label: () => m.nav_duplicate() },
  { key: 'puzzles', Icon: Puzzle, label: () => m.nav_puzzles() },
]

/** Which section a path belongs to. The router has already removed the language prefix. */
export function sectionOf(pathname: string): Section {
  if (pathname.startsWith('/course') || pathname.startsWith('/lesson')) return 'course'
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
  if (!item.to) {
    return (
      <div aria-disabled="true" title={m.nav_soon()} data-nav={item.key} data-state="soon" {...stylex.props(look, styles.itemSoon)}>
        {inner}
      </div>
    )
  }
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
        <Link to="/course" {...stylex.props(typography.landingNav, styles.landingLink)}>{m.nav_course()}</Link>
        <Link to="/play" {...stylex.props(typography.landingNav, styles.landingLink)}>{m.nav_play()}</Link>
      </nav>
      <div {...stylex.props(styles.landingEnd)}>
        <span {...stylex.props(styles.desktopOnly)}>
          <Link to="/play" data-testid="header-play" {...linkLook('go', 'md', 'landing')}>{m.nav_play()}</Link>
        </span>
        <LanguageSwitch />
        <span {...stylex.props(styles.desktopOnly)}>
          <Account shape="landing" />
        </span>
        <button type="button" aria-label={m.nav_menu()} aria-expanded={open} data-testid="landing-menu" onClick={() => setOpen((o) => !o)} {...stylex.props(styles.menuButton)}>
          {open ? <X size={icon.tab} strokeWidth={icon.outline} /> : <Menu size={icon.tab} strokeWidth={icon.outline} />}
        </button>
      </div>
      {open ? (
        <div data-testid="landing-menu-panel" {...stylex.props(styles.menuPanel)}>
          <Link to="/course" onClick={() => setOpen(false)} {...stylex.props(typography.landingNav, styles.menuLink)}>{m.nav_course()}</Link>
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
const NAME: Record<Locale, string> = { zh: '中文', en: 'English', de: 'Deutsch' }

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
  itemLink: { transitionProperty: 'color', transitionDuration: timing.tile, color: { default: color.slateDeep, ':hover': color.navy }, ...focus },
  itemActive: { color: { default: color.go, ':hover': color.go } },
  itemSoon: { opacity: opacity.iconDisabled, cursor: 'default' },

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
  bandTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space.x12 },
  bandNav: { display: 'flex', alignItems: 'center', gap: space.x16 },
  bandLink: { display: 'inline-flex', alignItems: 'center', gap: space.x4, color: color.onColor, textDecoration: 'none', ...focus },
  bandEnd: { display: 'flex', alignItems: 'center', gap: space.x12 },
  bandTitle: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: space.x10, margin: 0, color: color.onColor },

  switch: { position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 },
  select: {
    appearance: 'none',
    margin: 0,
    height: dims.control,
    paddingLeft: space.x16,
    paddingRight: space.x32,
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
  chevron: { position: 'absolute', right: space.x14, color: color.navy, pointerEvents: 'none' },

  appShell: {
    minHeight: dims.screen,
    paddingLeft: { default: dims.rail, [bp.phone]: 0 },
    paddingBottom: { default: 0, [bp.phone]: dims.tabBar },
    boxSizing: 'border-box',
  },
})
