import { Show, SignInButton, UserButton } from '@clerk/tanstack-react-start'
import { Link, useRouterState } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { ChartLine, Check, ChevronDown, Monitor, Moon, Settings, Sun } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'

import { LANG_TAG } from '~/lib/site'
import { CARD_BACKS, DEFAULT_BACK, backSrc, isCardBack } from '~/lib/skat/backs'
import { AVATARS, DEFAULT_AVATAR, faceSrc, isAvatar } from '~/lib/skat/face'
import { APPEARANCES, type Appearance, nightSupported, readAppearance, useAppearance } from '~/lib/appearance'
import { type Deck, useSettings } from '~/lib/skat/settings'
import { m } from '~/paraglide/messages'
import { carryGame } from '~/lib/free-api'
import { track } from '~/lib/analytics'
import { useAccount } from '~/lib/use-account'
import { useUnread } from '~/lib/use-unread'
import { type Locale, getLocale, localizeHref, locales, setLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { timing } from '../../theme/effects.stylex'
import { elev } from '../../theme/elevation.stylex'
import { border, layer, opacity, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { FlagDE, FlagEN } from '../../theme/flags'
import { typography } from '../../theme/type'
import { Btn, Modal, linkLook, suitText } from './ui'

// The frame pieces of the lobby design (SKATGO-26, reference.md): the public site's white header over
// every page but the tables (SKATGO-43, SKATGO-47), with the language menu, the deck settings and the account. Navigation
// carries only what skatgo
// has (SKATGO-29: nothing announced).

type Section = 'home' | 'daily' | 'course' | 'rules' | 'play' | 'forum'

/** Which section a path belongs to. The router has already removed the language prefix. */
export function sectionOf(pathname: string): Section {
  // The tournament's table wears the table's frame (SKATGO-35); so does the deal of the day played again (SKATGO-177).
  if (pathname.startsWith('/daily/play') || pathname.startsWith('/daily/replay')) return 'play'
  // So does a game of the record of play played again (SKATGO-182).
  if (pathname.startsWith('/replay')) return 'play'
  // So does a private table, its lobby included (SKATGO-61), and a League round's (SKATGO-204).
  if (pathname.startsWith('/table/') || pathname.startsWith('/league/play')) return 'play'
  // So does the practice table of a shared deal (SKATGO-132).
  if (/^\/d\/[^/]+\/play/.test(pathname)) return 'play'
  if (pathname.startsWith('/daily')) return 'daily'
  if (pathname.startsWith('/course')) return 'course'
  if (pathname.startsWith('/rules')) return 'rules'
  if (pathname.startsWith('/play')) return 'play'
  // The forum's pages are sub-pages on the grey page (SKATGO-118).
  if (pathname.startsWith('/forum')) return 'forum'
  return 'home'
}

export function useSection(): Section {
  return useRouterState({ select: (s) => sectionOf(s.location.pathname) })
}

/** Which frame a path wears: the tables fill the screen; every other page, lessons included, wears the
 *  front page's header (SKATGO-43, SKATGO-47). The router has already removed the language prefix. */
export function frameOf(pathname: string): 'landing' | 'table' {
  // An open-card endgame is played on the table, one screen at any size, as free play is (SKATGO-111, the human:
  // 「如何能做到打牌界面那种效果，各种尺寸屏幕都刚好全屏」).
  if (pathname.startsWith('/skat-tricks/offenes-endspiel-')) return 'table'
  return sectionOf(pathname) === 'play' ? 'table' : 'landing'
}

export function useFrame() {
  return useRouterState({ select: (s) => frameOf(s.location.pathname) })
}

/** The public site's white bar over every page but the tables (SKATGO-43): the SkatGo mark and name, then the language
 *  switch, the settings and the account. No section links: the front page's cards are the way in (SKATGO-144, the human:
 *  「topbar上的那些菜单都删了吧，不需要了」); on a phone too, so there is no menu to fold them into. */
export function LandingHeader() {
  return (
    <header data-testid="landing-header" {...stylex.props(styles.landingHeader)}>
      <Link to="/" aria-label={m.site_name()} {...stylex.props(typography.landingHeading, styles.landingBrand)}>
        <img src="/logo-96.png" alt="" {...stylex.props(styles.landingMark)} />
        {/* The site's name beside the mark, without ".com" (SKATGO-105), at every width (SKATGO-201, the human: 「logo必须显示」):
            where both flags do not fit beside it, they become one (`LanguageSwitch`). */}
        <span {...stylex.props(typography.landingBrand)}>{m.site_name()}</span>
      </Link>
      <div {...stylex.props(styles.landingEnd)}>
        <LanguageSwitch />
        <SettingsButton />
        <Account shape="landing" />
      </div>
    </header>
  )
}

/** Signed out: the one way in, opening Clerk's window over the page. Signed in: Clerk's avatar menu.
 *  In the public site's header it takes that header's button shape, the same as "Play" beside it. */
export function Account({ shape = 'pill' }: { shape?: 'pill' | 'landing' }) {
  // The header's sign-in reads the short word, German's "Login", so the name fits beside it on a phone (SKATGO-201).
  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Btn tone="quiet" size="md" shape={shape} testId="sign-in" onClick={() => track('sign_in_clicked', { at: 'header' })}>
            {shape === 'landing' ? m.auth_sign_in_header() : m.auth_sign_in()}
          </Btn>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        {/* The account's record of play first in its menu, where a player looks for it (SKATGO-128, the human:
            「应该是点profile头像就能看到入口」). */}
        <span {...stylex.props(styles.accountPicture)}>
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Link label={m.profile_title()} labelIcon={<ChartLine size={icon.header} strokeWidth={icon.outline} />} href={localizeHref('/profile')} />
            </UserButton.MenuItems>
          </UserButton>
          <MentionCount />
        </span>
      </Show>
    </>
  )
}

/** How many forum mentions the account has not seen (SKATGO-232, the human: 「如果有人在论坛里at这个用户，就要显示提示角标」):
 *  a small round count at the corner of its picture, nothing when there are none; /profile lists them, and seeing it
 *  clears the count. The menu under the picture leads there. */
function MentionCount() {
  const unread = useUnread(Boolean(useAccount()))
  if (!unread) return null
  return (
    <span data-testid="mention-count" role="status" aria-label={m.mentions_unread({ count: unread })} {...stylex.props(typography.label, styles.mentionCount)}>
      {unread > 9 ? '9+' : unread}
    </span>
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
    <>
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
    <LanguageMenu />
    </>
  )
}

/** Where both flags do not fit (`bp.oneFlag`, SKATGO-201): the language in use alone, opening a menu of the languages,
 *  each its flag and own name. Shown only there; the two flags everywhere else. */
function LanguageMenu() {
  const current = getLocale()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', key) }
  }, [open])
  const Current = FLAG[current]
  return (
    <div ref={box} data-testid="language-menu" {...stylex.props(styles.languageMenu)}>
      <button
        type="button"
        aria-label={m.language_label()}
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="language-menu-open"
        onClick={() => setOpen((o) => !o)}
        {...stylex.props(styles.flagButton, styles.menuOpener)}
      >
        <span {...stylex.props(styles.flag)}>
          <Current />
        </span>
        <ChevronDown size={icon.header} strokeWidth={icon.outline} />
      </button>
      {open ? (
        <div role="menu" aria-label={m.language_label()} {...stylex.props(styles.languageList)}>
          {locales.map((l) => {
            const Flag = FLAG[l]
            const on = l === current
            return (
              <button
                key={l}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                lang={LANG_TAG[l]}
                data-locale={l}
                onClick={() => {
                  setOpen(false)
                  if (!on) {
                    carryGame()
                    void setLocale(l)
                  }
                }}
                {...stylex.props(typography.control, typography.link, styles.languageItem)}
              >
                <span {...stylex.props(styles.flag, on && styles.flagOn)}>
                  <Flag />
                </span>
                {NAME[l]}
              </button>
            )
          })}
        </div>
      ) : null}
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

/** The way to the player's profile, the settings' first and big button (SKATGO-232, the human: 「一个profile页面，放在setting的第一个
 *  大按钮」): the one profile, where an account's avatar, nickname, forum mentions and record of play are, and a guest's
 *  games of this device. The nickname (SKATGO-126) and the account's deletion (SKATGO-185) moved there with it. */
function ProfileEntry({ onClose }: { onClose: () => void }) {
  return (
    <Link to="/profile" data-testid="settings-profile" onClick={onClose} {...linkLook('go', 'lg', 'block')}>
      {m.profile_title()}
    </Link>
  )
}

const APPEARANCE_ICON: Record<Appearance, typeof Sun> = { system: Monitor, light: Sun, dark: Moon }
const APPEARANCE_NAME: Record<Appearance, () => string> = {
  system: m.settings_appearance_system,
  light: m.settings_appearance_light,
  dark: m.settings_appearance_dark,
}

/** The settings (SKATGO-66, SKATGO-75): the deck, how a finished trick goes, and the language. A choice
 *  applies at once — the language reloads the page in it, as the header's menu does, so both always show
 *  the same one. A `Modal` (the kit's, SKATGO-140): the page behind neither scrolls nor takes a touch. */
export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const chosen = useSettings((s) => s.deck)
  const choose = useSettings((s) => s.setDeck)
  const tapToCollect = useSettings((s) => s.tapToCollect)
  const setTapToCollect = useSettings((s) => s.setTapToCollect)
  const back = useSettings((s) => (isCardBack(s.back) ? s.back : DEFAULT_BACK))
  const setBack = useSettings((s) => s.setBack)
  const sounds = useSettings((s) => s.sounds)
  const setSounds = useSettings((s) => s.setSounds)
  const talk = useSettings((s) => s.talk)
  const setTalk = useSettings((s) => s.setTalk)
  const faces = useSettings((s) => s.faces)
  const setFaces = useSettings((s) => s.setFaces)
  const avatars = useSettings((s) => s.avatars)
  const setAvatar = useSettings((s) => s.setAvatar)
  const current = getLocale()
  const appearance = useAppearance((s) => s.chosen) ?? readAppearance()
  const chooseAppearance = useAppearance((s) => s.choose)
  return (
    <Modal title={m.settings_open()} onClose={onClose} testId="settings-dialog" closeTestId="settings-close">
        <ProfileEntry onClose={onClose} />
        {/* Day or night (SKATGO-184): like the device, or always one of them; it applies at once, on every page. A browser
            that cannot show the night (lib/appearance.ts) is not offered it. */}
        {nightSupported() ? <section {...stylex.props(styles.section)}>
          <h3 {...stylex.props(typography.small, styles.sectionTitle)}>{m.settings_appearance()}</h3>
          <div role="radiogroup" aria-label={m.settings_appearance()} {...stylex.props(styles.decks)}>
            {APPEARANCES.map((a) => {
              const Icon = APPEARANCE_ICON[a]
              const on = a === appearance
              return (
                <button
                  key={a}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  data-testid={`settings-appearance-${a}`}
                  onClick={() => chooseAppearance(a)}
                  {...stylex.props(typography.appBtnStrong, styles.deck, on && styles.deckOn)}
                >
                  <Icon aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />
                  <span {...stylex.props(styles.deckName)}>{APPEARANCE_NAME[a]()}</span>
                  <span aria-hidden="true" {...stylex.props(styles.check, !on && styles.checkOff)}>
                    <Check size={icon.inline} strokeWidth={icon.outline} />
                  </span>
                </button>
              )
            })}
          </div>
        </section> : null}
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
        {/* Lina and Noah talking at free play's and the tournament's tables (SKATGO-142), on by default. */}
        <section {...stylex.props(styles.section)}>
          <h3 {...stylex.props(typography.small, styles.sectionTitle)}>{m.settings_talk()}</h3>
          <button
            type="button"
            role="switch"
            aria-checked={talk}
            data-testid="settings-talk"
            onClick={() => setTalk(!talk)}
            {...stylex.props(typography.appBtnStrong, styles.deck, talk && styles.deckOn)}
          >
            <span {...stylex.props(styles.deckName)}>
              <span>{m.settings_talk_free()}</span>
            </span>
            <span aria-hidden="true" {...stylex.props(styles.check, !talk && styles.checkOff)}>
              <Check size={icon.inline} strokeWidth={icon.outline} />
            </span>
          </button>
        </section>
        {/* Lina's and Noah's faces above their cards (SKATGO-147), on by default. */}
        <section {...stylex.props(styles.section)}>
          <h3 {...stylex.props(typography.small, styles.sectionTitle)}>{m.settings_faces()}</h3>
          <button
            type="button"
            role="switch"
            aria-checked={faces}
            data-testid="settings-faces"
            onClick={() => setFaces(!faces)}
            {...stylex.props(typography.appBtnStrong, styles.deck, faces && styles.deckOn)}
          >
            <span {...stylex.props(styles.deckName)}>
              <span>{m.settings_faces_table()}</span>
            </span>
            <span aria-hidden="true" {...stylex.props(styles.check, !faces && styles.checkOff)}>
              <Check size={icon.inline} strokeWidth={icon.outline} />
            </span>
          </button>
          {/* Each seat's face, chosen by its picture (SKATGO-167, the human: 「设置页面可以看着头像选桌上的头像……可以男明用女头像」):
              a row of every avatar under the seat's name, the chosen one ringed as the card back is. */}
          {([1, 2] as const).map((seat) => {
            const name = seat === 1 ? m.name_lina() : m.name_max()
            const chosen = isAvatar(avatars?.[seat]) ? avatars[seat] : DEFAULT_AVATAR[seat]
            return (
              <div key={seat} {...stylex.props(styles.faceRow)}>
                <span {...stylex.props(typography.small, styles.faceSeat)}>{name}</span>
                <div role="radiogroup" aria-label={m.settings_face_for({ name })} data-testid={`settings-avatar-${seat}`} {...stylex.props(styles.faceChoices)}>
                  {AVATARS.map((a, i) => (
                    <button
                      key={a}
                      type="button"
                      role="radio"
                      aria-checked={a === chosen}
                      aria-label={m.settings_face_option({ n: i + 1 })}
                      data-testid={`settings-avatar-${seat}-${a}`}
                      onClick={() => setAvatar(seat, a)}
                      {...stylex.props(styles.backChoice, a === chosen && styles.backOn)}
                    >
                      <img src={faceSrc(a, 'neutral')} alt="" loading="lazy" {...stylex.props(styles.faceThumb)} />
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
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
    </Modal>
  )
}

const focus = {
  outlineStyle: { default: 'none', ':focus-visible': 'solid' },
  outlineWidth: border.focus,
  outlineColor: color.info,
  outlineOffset: border.focusOffset,
} as const

const styles = stylex.create({
  accountPicture: { position: 'relative', display: 'inline-flex', alignItems: 'center' },
  mentionCount: {
    position: 'absolute',
    top: dims.mentionBadgeOffset,
    insetInlineEnd: dims.mentionBadgeOffset,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    minWidth: dims.mentionBadge,
    height: dims.mentionBadge,
    paddingInline: space.x4,
    borderRadius: radii.round,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: color.surface,
    color: color.onColor,
    backgroundColor: color.stop,
    pointerEvents: 'none',
  },
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
  // The avatars in the settings (SKATGO-167): a seat's name over a row of all six, square, as the backs are chosen.
  faceRow: { display: 'flex', flexDirection: 'column', gap: space.x6 },
  faceSeat: { color: color.slate },
  faceChoices: { display: 'grid', gridTemplateColumns: dims.faceChoices, gap: space.x6 },
  faceThumb: { display: 'block', width: '100%', aspectRatio: dims.square, borderRadius: radii.card },
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
  decks: { display: 'flex', flexDirection: 'column', gap: space.x10 },
  section: { display: 'flex', flexDirection: 'column', gap: space.x8 },
  // The button takes the field's height.
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
  // The flags, the gear and sign-in or the avatar, each clear of the next (SKATGO-105); closer on a phone, so the name fits
  // at 360px (SKATGO-201).
  landingEnd: { display: 'flex', alignItems: 'center', gap: { default: space.x16, [bp.phone]: space.x8 } },

  // The language switch (SKATGO-104): two bare flags, each in a button as tall as the header's controls.
  // The two flags as far apart as the header's other controls nearly are (SKATGO-144, the human: 「英国和德国国旗距离太近」).
  flags: {
    display: { default: 'flex', [bp.oneFlag]: 'none' },
    alignItems: 'center',
    gap: { default: space.x12, [bp.phone]: space.x10 },
    flexShrink: 0,
  },
  // One flag and its menu where two do not fit (SKATGO-201).
  languageMenu: { display: { default: 'none', [bp.oneFlag]: 'block' }, position: 'relative', flexShrink: 0 },
  menuOpener: { gap: space.x2, color: color.slate },
  languageList: {
    position: 'absolute',
    insetBlockStart: '100%',
    insetInlineEnd: 0,
    marginBlockStart: space.x8,
    display: 'flex',
    flexDirection: 'column',
    padding: space.x8,
    backgroundColor: color.surface,
    borderRadius: radii.panel,
    boxShadow: elev.panel,
    zIndex: layer.window,
  },
  languageItem: {
    display: 'flex',
    alignItems: 'center',
    gap: space.x10,
    paddingBlock: space.x8,
    paddingInline: space.x12,
    borderWidth: 0,
    borderRadius: radii.tag,
    backgroundColor: { default: 'transparent', ':hover': color.page },
    color: color.text,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focusSm,
    outlineColor: color.info,
  },
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
