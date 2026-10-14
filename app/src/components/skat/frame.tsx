import { Show, SignInButton, UserButton } from '@clerk/tanstack-react-start'
import { Link, useRouterState } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { Check, Menu, Settings, X } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { LANG_TAG } from '~/lib/site'
import { CARD_BACKS, DEFAULT_BACK, backSrc, isCardBack } from '~/lib/skat/backs'
import { type Deck, useSettings } from '~/lib/skat/settings'
import { m } from '~/paraglide/messages'
import { carryGame } from '~/lib/free-api'
import { type Locale, getLocale, locales, setLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { timing } from '../../theme/effects.stylex'
import { elev } from '../../theme/elevation.stylex'
import { border, layer, opacity, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { FlagDE, FlagEN } from '../../theme/flags'
import { typography } from '../../theme/type'
import { Btn, suitText } from './ui'

// The frame pieces of the lobby design (SKATGO-26, reference.md): the public site's white header over
// every page but the tables (SKATGO-43, SKATGO-47), with the language menu, the deck settings and the account. Navigation
// carries only what skatgo
// has (SKATGO-29: nothing announced).

type Section = 'home' | 'daily' | 'course' | 'rules' | 'play'

/** Which section a path belongs to. The router has already removed the language prefix. */
export function sectionOf(pathname: string): Section {
  // The tournament's table wears the table's frame (SKATGO-35).
  if (pathname.startsWith('/daily/play')) return 'play'
  // So does a private table, its lobby included (SKATGO-61).
  if (pathname.startsWith('/table/')) return 'play'
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
// The header's links, in the human's order (SKATGO-69): the tournament, learning, free play, a private table,
// then the tricks (SKATGO-82), which took the place of the greyed-out puzzles.
const HEADER_LINKS: { to: '/daily' | '/course' | '/play' | '/with-friends' | '/skat-tricks'; label: () => string }[] = [
  { to: '/daily', label: () => m.nav_header_daily() },
  { to: '/course', label: () => m.nav_header_learn() },
  { to: '/play', label: () => m.nav_header_free() },
  { to: '/with-friends', label: () => m.nav_header_friends() },
  { to: '/skat-tricks', label: () => m.nav_header_tricks() },
]

/** The front page's header: the public site's white bar, also over the tournament, the course and the
 *  rules (SKATGO-43). Below 1100px wide the links fold into a menu (SKATGO-69). */
export function LandingHeader() {
  const [open, setOpen] = useState(false)
  return (
    <header data-testid="landing-header" {...stylex.props(styles.landingHeader)}>
      <Link to="/" {...stylex.props(typography.landingHeading, styles.landingBrand)}>
        <img src="/logo-96.png" alt="" {...stylex.props(styles.landingMark)} />
        {/* The site's address beside the mark (SKATGO-69). */}
        <span {...stylex.props(typography.landingBrand)}>
          {m.site_name()}
          <span {...stylex.props(styles.landingDomain)}>{m.site_domain()}</span>
        </span>
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

const FLAG: Record<Locale, () => ReactNode> = { en: FlagEN, de: FlagDE }

/**
 * The language switch (SKATGO-23, SKATGO-104): both languages' flags side by side, one tap switching.
 * The language in use is in full colour, ringed in green; the other keeps its colours, faded. No frame
 * and no padding round the flags (the human: 「我奇怪你为啥一定要有paddding」) — each sits in an invisible
 * button as tall as the header's other controls, so a thumb still finds it. Choosing goes through Paraglide's setLocale, which loads
 * the same page in that language and remembers the choice (cookie).
 */
export function LanguageSwitch() {
  const current = getLocale()
  return (
    <div role="radiogroup" aria-label={m.language_label()} data-testid="language-switch" {...stylex.props(styles.flags)}>
      {locales.map((l) => {
        const Flag = FLAG[l]
        const on = l === current
        return (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={NAME[l]}
            title={NAME[l]}
            lang={LANG_TAG[l]}
            data-locale={l}
            onClick={() => {
              if (!on) {
                carryGame()
                void setLocale(l)
              }
            }}
            {...stylex.props(styles.flagButton, !on && styles.flagButtonOff)}
          >
            <span {...stylex.props(styles.flag, on && styles.flagOn)}>
              <Flag />
            </span>
          </button>
        )
      })}
    </div>
  )
}

// --- The deck (SKATGO-66) --------------------------------------------------------------------------

/** The decks, the default first; each shows its corner letters. */
const DECKS: { key: Deck; label: () => string; letters: string }[] = [
  { key: 'tournament', label: () => m.deck_tournament(), letters: 'B · D · K · A' },
  { key: 'german', label: () => m.deck_german(), letters: 'U · O · K · A' },
  { key: 'jqk', label: () => m.deck_jqk(), letters: 'J · Q · K · A' },
]

/** The gear beside the language menu: opens the choice of deck. */
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

/** The settings (SKATGO-66, SKATGO-75): the deck, how a finished trick goes, and the language. A choice
 *  applies at once — the language reloads the page in it, as the header's menu does, so both always show
 *  the same one. While it is open the page behind it neither scrolls nor takes a touch: the dialog lies
 *  on `body`, and everything else there is inert. */
export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const chosen = useSettings((s) => s.deck)
  const choose = useSettings((s) => s.setDeck)
  const tapToCollect = useSettings((s) => s.tapToCollect)
  const setTapToCollect = useSettings((s) => s.setTapToCollect)
  const back = useSettings((s) => (isCardBack(s.back) ? s.back : DEFAULT_BACK))
  const setBack = useSettings((s) => s.setBack)
  const sounds = useSettings((s) => s.sounds)
  const setSounds = useSettings((s) => s.setSounds)
  const current = getLocale()
  const box = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const html = document.documentElement
    const overflow = html.style.overflow
    html.style.overflow = 'hidden'
    const others = [...document.body.children].filter((el) => el !== box.current && !el.hasAttribute('inert'))
    for (const el of others) el.setAttribute('inert', '')
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', escape)
    return () => {
      html.style.overflow = overflow
      for (const el of others) el.removeAttribute('inert')
      document.removeEventListener('keydown', escape)
    }
  }, [onClose])
  return createPortal(
    <div ref={box} data-testid="settings-dialog" {...stylex.props(styles.scrim)} onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={m.settings_open()} onClick={(e) => e.stopPropagation()} {...stylex.props(styles.dialog)}>
        <div {...stylex.props(styles.dialogHead)}>
          <h2 {...stylex.props(typography.dialogTitle, styles.dialogTitle)}>{m.settings_open()}</h2>
          <button type="button" aria-label={m.settings_close()} data-testid="settings-close" onClick={onClose} {...stylex.props(styles.close)}>
            <X size={icon.menu} strokeWidth={icon.outline} />
          </button>
        </div>
        <section {...stylex.props(styles.section)}>
          <h3 {...stylex.props(typography.small, styles.sectionTitle)}>{m.settings_title()}</h3>
          <div role="radiogroup" aria-label={m.settings_title()} {...stylex.props(styles.decks)}>
            {DECKS.map((deck) => {
              const on = deck.key === chosen
              return (
                <button
                  key={deck.key}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  data-testid={`deck-${deck.key}`}
                  onClick={() => choose(deck.key)}
                  {...stylex.props(typography.appBtnStrong, styles.deck, on && styles.deckOn)}
                >
                  <span {...stylex.props(styles.deckName)}>
                    <span>{deck.label()}</span>
                    <span {...stylex.props(typography.small, styles.deckLetters)}>{deck.letters}</span>
                  </span>
                  <span aria-hidden="true" {...stylex.props(styles.check, !on && styles.checkOff)}>
                    <Check size={icon.inline} strokeWidth={icon.outline} />
                  </span>
                </button>
              )
            })}
          </div>
        </section>
        {/* The card back (SKATGO-102): every one there is, as small cards to tap. */}
        <section {...stylex.props(styles.section)}>
          <h3 {...stylex.props(typography.small, styles.sectionTitle)}>{m.settings_back()}</h3>
          <div role="radiogroup" aria-label={m.settings_back()} {...stylex.props(styles.backs)}>
            {CARD_BACKS.map((b) => (
              <button
                key={b}
                type="button"
                role="radio"
                aria-checked={b === back}
                aria-label={b}
                data-testid={`settings-back-${b}`}
                onClick={() => setBack(b)}
                {...stylex.props(styles.backChoice, b === back && styles.backOn)}
              >
                <img src={backSrc(b)} alt="" loading="lazy" {...stylex.props(styles.backThumb)} />
              </button>
            ))}
          </div>
        </section>
        <section {...stylex.props(styles.section)}>
          <h3 {...stylex.props(typography.small, styles.sectionTitle)}>{m.settings_tricks()}</h3>
          <button
            type="button"
            role="switch"
            aria-checked={tapToCollect}
            data-testid="settings-tap-collect"
            onClick={() => setTapToCollect(!tapToCollect)}
            {...stylex.props(typography.appBtnStrong, styles.deck, tapToCollect && styles.deckOn)}
          >
            <span {...stylex.props(styles.deckName)}>
              <span>{m.settings_tap_collect()}</span>
              <span {...stylex.props(typography.small, styles.deckLetters)}>{tapToCollect ? m.settings_tap_collect_on() : m.settings_tap_collect_off()}</span>
            </span>
            <span aria-hidden="true" {...stylex.props(styles.check, !tapToCollect && styles.checkOff)}>
              <Check size={icon.inline} strokeWidth={icon.outline} />
            </span>
          </button>
        </section>
        {/* The cards' sounds at the table (SKATGO-101), on by default. */}
        <section {...stylex.props(styles.section)}>
          <h3 {...stylex.props(typography.small, styles.sectionTitle)}>{m.settings_sound()}</h3>
          <button
            type="button"
            role="switch"
            aria-checked={sounds}
            data-testid="settings-sounds"
            onClick={() => setSounds(!sounds)}
            {...stylex.props(typography.appBtnStrong, styles.deck, sounds && styles.deckOn)}
          >
            <span {...stylex.props(styles.deckName)}>
              <span>{m.settings_sound_cards()}</span>
            </span>
            <span aria-hidden="true" {...stylex.props(styles.check, !sounds && styles.checkOff)}>
              <Check size={icon.inline} strokeWidth={icon.outline} />
            </span>
          </button>
        </section>
        <section {...stylex.props(styles.section)}>
          <h3 {...stylex.props(typography.small, styles.sectionTitle)}>{m.language_label()}</h3>
          <div role="radiogroup" aria-label={m.language_label()} {...stylex.props(styles.decks)}>
            {locales.map((l) => {
              const Flag = FLAG[l]
              const on = l === current
              return (
                <button
                  key={l}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  lang={LANG_TAG[l]}
                  data-testid={`settings-locale-${l}`}
                  onClick={() => {
                    if (!on) {
                      carryGame()
                      void setLocale(l)
                    }
                  }}
                  {...stylex.props(typography.appBtnStrong, styles.deck, on && styles.deckOn)}
                >
                  <span {...stylex.props(styles.flag)}>
                    <Flag />
                  </span>
                  <span {...stylex.props(styles.deckName)}>{NAME[l]}</span>
                  <span aria-hidden="true" {...stylex.props(styles.check, !on && styles.checkOff)}>
                    <Check size={icon.inline} strokeWidth={icon.outline} />
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </div>,
    document.body,
  )
}

const focus = {
  outlineStyle: { default: 'none', ':focus-visible': 'solid' },
  outlineWidth: border.focus,
  outlineColor: color.info,
  outlineOffset: border.focusOffset,
} as const

const styles = stylex.create({
  // The card backs in the settings (SKATGO-102): small cards in rows, the chosen one ringed in green.
  backs: { display: 'grid', gridTemplateColumns: dims.backChoices, gap: space.x8 },
  backChoice: {
    padding: 0,
    borderWidth: border.focus,
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: radii.option,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focusSm,
    outlineColor: color.info,
  },
  backOn: { borderColor: color.go },
  backThumb: { display: 'block', width: '100%', aspectRatio: dims.cardAspect, borderRadius: radii.card },
  // The deck settings (SKATGO-66): the gear, its dialog and the choice tiles.
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
    zIndex: layer.modal,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.x16,
    backgroundColor: color.scrim,
    overscrollBehavior: 'contain',
    touchAction: 'none',
  },
  dialog: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x16,
    width: dims.settingsWidth,
    // A phone held sideways is shorter than the settings: they scroll inside the dialog, never the page.
    maxHeight: '100%',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    touchAction: 'pan-y',
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
  decks: { display: 'flex', flexDirection: 'column', gap: space.x10 },
  section: { display: 'flex', flexDirection: 'column', gap: space.x8 },
  sectionTitle: { margin: 0, color: color.slate, textTransform: 'uppercase' },
  deck: {
    display: 'flex',
    alignItems: 'center',
    gap: space.x12,
    minHeight: space.x48,
    paddingBlock: space.x8,
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
  deckOn: { borderColor: color.go, backgroundColor: color.goodSoft },
  deckName: { display: 'flex', flexDirection: 'column', gap: space.x2, flexGrow: 1 },
  deckLetters: { color: color.slate },
  check: { display: 'flex', color: color.go },
  checkOff: { visibility: 'hidden' },
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
    // A phone's header is tighter, so "SkatGo.com" fits beside the controls (SKATGO-69) and both
    // language flags (SKATGO-104).
    gap: { default: space.x16, [bp.phone]: space.x6 },
    height: { default: dims.landingHeader, [bp.phone]: dims.landingHeaderPhone },
    paddingInline: { default: space.x20, [bp.phone]: space.x12 },
    boxSizing: 'border-box',
    backgroundColor: color.surface,
    boxShadow: elev.landingHeader,
  },
  landingBrand: { display: 'flex', alignItems: 'center', gap: space.x10, color: color.navy, textDecoration: 'none', ...focus },
  // The narrowest phones drop ".com" rather than shrink the name (SKATGO-104).
  landingDomain: { display: { default: 'inline', [bp.narrowPhone]: 'none' } },
  landingNav: { display: { default: 'flex', [bp.headerMenu]: 'none' }, alignItems: 'center', gap: space.x32 },
  landingLink: { color: { default: color.slate, ':hover': color.navy }, textDecoration: 'none', ...focus },
  // Not there yet (SKATGO-69): greyed, and nothing answers the pointer.
  landingEnd: { display: 'flex', alignItems: 'center', gap: { default: space.x12, [bp.phone]: space.x2 } },
  desktopOnly: { display: { default: 'inline-flex', [bp.headerMenu]: 'none' } },
  menuButton: {
    display: { default: 'none', [bp.headerMenu]: 'inline-flex' },
    alignItems: 'center',
    justifyContent: 'center',
    // As small as the gear on a phone, so the flags fit (SKATGO-104).
    width: { default: dims.iconButton, [bp.phone]: space.x32 },
    height: { default: dims.iconButton, [bp.phone]: space.x32 },
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

  // The language switch (SKATGO-104): two bare flags, each in a button as tall as the header's controls.
  flags: { display: 'flex', alignItems: 'center', gap: { default: space.x8, [bp.phone]: space.x6 }, flexShrink: 0 },
  flagButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: space.x32,
    padding: 0,
    borderWidth: 0,
    borderRadius: radii.flag,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focusSm,
    outlineColor: color.info,
  },
  flagButtonOff: { opacity: { default: opacity.flagOff, ':hover': opacity.flagHover, ':focus-visible': opacity.flagHover } },
  flag: {
    display: 'flex',
    width: { default: dims.flagWidth, [bp.phone]: dims.flagWidthPhone },
    height: { default: dims.flagHeight, [bp.phone]: dims.flagHeightPhone },
    borderRadius: radii.flag,
    overflow: 'hidden',
  },
  flagOn: {
    outlineStyle: 'solid',
    outlineWidth: border.tile,
    outlineColor: color.go,
    outlineOffset: border.flagOffset,
  },

})
