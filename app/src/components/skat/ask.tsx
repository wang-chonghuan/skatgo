import { useAuth } from '@clerk/tanstack-react-start'
import * as stylex from '@stylexjs/stylex'
import { useRouterState } from '@tanstack/react-router'
import { Check, Copy, MessageCircle, Plus, X } from 'lucide-react'
import { type ComponentType, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { GUEST, type ChatMessage, clearConversation, loadConversation, saveConversation } from '~/lib/ask/conversation'
import { lessonById } from '~/lib/skat/lessons/content'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { icon, phoneQuery } from '../../theme/constants'
import { move, shadow } from '../../theme/effects.stylex'
import { border, layer, opacity, radius, size, space } from '../../theme/scale.stylex'
import { skat } from '../../theme/skat.stylex'
import { typography } from '../../theme/type'
import type { AskPage, AskThreadProps } from './ask-thread'

// The floating assistant (SKATGO-9), rebuilt after Trovestep's context chat (SKATGO-14): a round
// button in the corner of every course page opens a window about the rules and the page the learner
// is on — at the table, seen only from the learner's seat (lib/skat/table-view.ts). On a desk the
// window floats bottom-right; on a phone it fills the screen and keeps its input above the keyboard.
//
// One conversation for the whole site, kept in this tab (lib/ask/conversation.ts): moving between
// pages and reloading keep it, "New conversation" clears it. Every question still carries the page it
// is asked on. It belongs to the signed-in account, or to the guest when nobody is signed in —
// signing in or out changes whose conversation it is, and never whether the chat may be used.

// deep-chat is a browser web component; the server build folds this branch away so the library never
// enters the SSR bundle, and a learner who never opens the window never downloads it.
const AskThread = lazy<ComponentType<AskThreadProps>>(() => (import.meta.env.SSR ? Promise.resolve({ default: () => null }) : import('./ask-thread')))

/** Which page the assistant is on, from the router's (language-free) path; null where it does not appear. */
function pageOf(pathname: string): AskPage | null {
  if (pathname === '/') return { page: 'entry' }
  if (pathname === '/course' || pathname === '/course/') return { page: 'home' }
  if (pathname === '/play' || pathname === '/play/') return { page: 'play' }
  const lesson = /^\/lesson\/([^/]+)\/?$/.exec(pathname)
  if (lesson) return { page: 'lesson', lessonId: decodeURIComponent(lesson[1]) }
  return null
}

/** The page's own title, as the window's subtitle. */
function titleOf(page: AskPage): string {
  if (page.page === 'entry') return m.ask_page_entry()
  if (page.page === 'home') return m.ask_page_home()
  if (page.page === 'play') return m.free_title()
  const lesson = lessonById(page.lessonId)
  return lesson ? m.lesson_heading({ id: lesson.id, title: lesson.title }) : m.ask_page_home()
}

// --- The tab's conversation ---------------------------------------------------------------------

const conversation: { owner: string | null; messages: ChatMessage[] } = { owner: null, messages: [] }

function tabStorage(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function conversationFor(owner: string | null): ChatMessage[] {
  if (owner === null) return []
  if (conversation.owner !== owner) {
    conversation.owner = owner
    conversation.messages = loadConversation(tabStorage(), owner)
  }
  return conversation.messages
}

function forgetConversation(): void {
  conversation.messages = []
  clearConversation(tabStorage())
}

/**
 * Whose conversation it is: the account, or the guest. Unknown while Clerk is still loading — the
 * stored conversation must not be read as the guest's and thrown away before Clerk says who is here.
 * If Clerk never answers (blocked, down), the visitor is the guest after a few seconds: signing in
 * gates nothing (SKATGO-13), so its failure must not keep the chat closed either.
 */
function useOwner(): string | null {
  const { isLoaded, userId } = useAuth()
  const [gaveUp, setGaveUp] = useState(false)
  useEffect(() => {
    if (isLoaded) return
    const timer = setTimeout(() => setGaveUp(true), 4_000)
    return () => clearTimeout(timer)
  }, [isLoaded])
  if (isLoaded) return userId ?? GUEST
  return gaveUp ? GUEST : null
}

// --- Phone behaviour ------------------------------------------------------------------------------

function usePhone(): boolean {
  const [phone, setPhone] = useState(() => window.matchMedia(phoneQuery).matches)
  useEffect(() => {
    const query = window.matchMedia(phoneQuery)
    const update = () => setPhone(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return phone
}

/**
 * The visible area while a phone keyboard is open, or null when it is closed. Phone browsers overlay
 * the keyboard and may scroll the page to reveal the focused input, so only the visual viewport says
 * where the visible area is; while it is smaller than the window the sheet is placed exactly over it,
 * which keeps the input directly above the keyboard however the browser scrolled.
 */
function useKeyboardViewport(enabled: boolean): { top: number; height: number } | null {
  const [area, setArea] = useState<{ top: number; height: number } | null>(null)
  useEffect(() => {
    const viewport = window.visualViewport
    if (!enabled || !viewport) {
      setArea(null)
      return
    }
    const update = () => {
      const covered = window.innerHeight - viewport.height
      // A pinch-zoomed page also shrinks the visual viewport; that is not a keyboard.
      const keyboard = covered > 0 && Math.abs(viewport.scale - 1) < 0.01
      setArea(keyboard ? { top: Math.round(viewport.offsetTop), height: Math.round(viewport.height) } : null)
    }
    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
    }
  }, [enabled])
  return area
}

/** The page behind a full-screen window stays still, and is back where it was when the window closes. */
function usePageScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return
    const root = document.documentElement
    const previous = root.style.overflow
    const x = window.scrollX
    const y = window.scrollY
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
      window.scrollTo(x, y)
    }
  }, [locked])
}

// --- The launcher and the window ----------------------------------------------------------------

export function AskLauncher() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const page = pageOf(pathname)
  // Rendered only after hydration: a button that does nothing until the page's script has loaded is
  // worse than no button, and where the window goes depends on the viewport.
  if (!mounted || !page) return null
  return <AskWindow page={page} pathname={pathname} />
}

function AskWindow({ page, pathname }: { page: AskPage; pathname: string }) {
  const owner = useOwner()
  const phone = usePhone()
  const [open, setOpen] = useState(false)
  const title = titleOf(page)

  // Closing hands focus back to the button it was opened from.
  const launcher = useRef<HTMLButtonElement | null>(null)
  const wasOpen = useRef(false)
  useEffect(() => {
    if (wasOpen.current && !open) launcher.current?.focus()
    wasOpen.current = open
  }, [open])

  const keyboardArea = useKeyboardViewport(open && phone)
  usePageScrollLock(open && phone)

  // Bumped by "New conversation"; with the owner it identifies the conversation the thread shows.
  const [generation, setGeneration] = useState(0)
  const threadKey = `${owner ?? ''}|${generation}`
  const messages = conversationFor(owner)

  // Signing out forgets the account's conversation in this tab (the guest starts with none).
  const previousOwner = useRef(owner)
  useEffect(() => {
    if (previousOwner.current && previousOwner.current !== GUEST && owner === GUEST) forgetConversation()
    previousOwner.current = owner
  }, [owner])

  // Another page, a new conversation or another owner aborts an answer still streaming; finished
  // messages stay in the conversation.
  const abort = useRef(new AbortController())
  const signal = useMemo(() => {
    abort.current.abort()
    abort.current = new AbortController()
    return abort.current.signal
  }, [threadKey, pathname])
  useEffect(() => () => abort.current.abort(), [])

  // Changing page closes the window; coming back does not reopen it.
  const lastPath = useRef(pathname)
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname
      setOpen(false)
    }
  }, [pathname])

  // Neither wheel nor touch over the window ever scrolls the page. A gesture is let through only inside
  // a region that can still scroll that way (the messages or a long input); at its ends, and anywhere
  // else in the window, it stops here instead of carrying on to the page behind.
  const panel = useRef<HTMLElement | null>(null)
  useEffect(() => {
    const element = panel.current
    if (!open || !element) return
    const scroller = (event: Event) =>
      event.composedPath().find((node): node is HTMLElement => node instanceof HTMLElement && (node.id === 'messages' || node.id === 'text-input') && node.scrollHeight > node.clientHeight)
    // `delta` > 0 moves the content down, as the wheel's deltaY does.
    const blocked = (event: Event, delta: number) => {
      if (delta === 0) return false
      const region = scroller(event)
      if (!region) return true
      return delta < 0 ? region.scrollTop <= 0 : region.scrollTop + region.clientHeight >= region.scrollHeight - 1
    }
    const onWheel = (event: WheelEvent) => {
      if (blocked(event, event.deltaY)) event.preventDefault()
    }
    let lastY = 0
    const onTouchStart = (event: TouchEvent) => {
      lastY = event.touches[0]?.clientY ?? 0
    }
    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY ?? lastY
      const delta = lastY - y
      lastY = y
      if (event.cancelable && blocked(event, delta)) event.preventDefault()
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    element.addEventListener('touchstart', onTouchStart, { passive: true })
    element.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      element.removeEventListener('wheel', onWheel)
      element.removeEventListener('touchstart', onTouchStart)
      element.removeEventListener('touchmove', onTouchMove)
    }
  }, [open])

  // When the keyboard opens or the visible area changes, keep the latest message in view.
  const keyboardHeight = keyboardArea?.height ?? null
  useEffect(() => {
    if (keyboardHeight === null) return
    const chat = panel.current?.querySelector('deep-chat') as (Element & { scrollToBottom?: () => void }) | null
    chat?.scrollToBottom?.()
  }, [keyboardHeight])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // The message count only drives the header buttons; the conversation itself stays in the store.
  const [messageCount, setMessageCount] = useState(messages.length)
  useEffect(() => setMessageCount(conversationFor(owner).length), [owner, generation])
  const onMessage = useCallback(
    (message: ChatMessage) => {
      if (owner === null || conversation.owner !== owner) return
      conversation.messages.push(message)
      saveConversation(tabStorage(), owner, conversation.messages)
      setMessageCount(conversation.messages.length)
    },
    [owner],
  )
  const newConversation = useCallback(() => {
    forgetConversation()
    setGeneration((value) => value + 1)
    setMessageCount(0)
  }, [])

  // Copy the whole conversation as plain text; the icon confirms for two seconds, then returns.
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2_000)
    return () => clearTimeout(timer)
  }, [copied])
  const copyConversation = useCallback(async () => {
    const text = conversationFor(owner)
      .map((message) => `${message.role === 'user' ? m.ask_copy_you() : m.ask_name()}: ${message.text}`)
      .join('\n\n')
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }, [owner])

  return (
    <>
      {open ? null : (
        <button
          ref={launcher}
          type="button"
          aria-label={m.ask_button_label()}
          title={m.ask_button_label()}
          data-testid="ask-launcher"
          onClick={() => setOpen(true)}
          {...stylex.props(styles.launcher)}
        >
          <MessageCircle aria-hidden="true" size={icon.launcher} strokeWidth={icon.launcherStroke} />
        </button>
      )}
      {open ? (
        <section
          ref={panel}
          role="dialog"
          aria-label={`${m.ask_name()} · ${title}`}
          data-testid="ask-panel"
          data-sheet={phone ? 'true' : 'false'}
          {...stylex.props(styles.panel, phone && styles.sheet, phone && keyboardArea && dynamic.overKeyboard(keyboardArea.top, keyboardArea.height))}
        >
          <header {...stylex.props(styles.head)}>
            <div {...stylex.props(styles.headText)}>
              <span {...stylex.props(typography.windowName)}>{m.ask_name()}</span>
              <span title={title} data-testid="ask-title" {...stylex.props(typography.windowSub, styles.pageTitle)}>
                {title}
              </span>
            </div>
            <button
              type="button"
              aria-label={m.ask_new()}
              title={m.ask_new()}
              data-testid="ask-new"
              disabled={messageCount === 0}
              onClick={newConversation}
              {...stylex.props(styles.icon, messageCount === 0 && styles.iconDisabled)}
            >
              <Plus aria-hidden="true" size={icon.header} />
            </button>
            <button
              type="button"
              aria-label={copied ? m.ask_copied() : m.ask_copy()}
              title={copied ? m.ask_copied() : m.ask_copy()}
              data-testid="ask-copy"
              data-copied={copied ? 'true' : 'false'}
              disabled={messageCount === 0}
              onClick={() => void copyConversation()}
              {...stylex.props(styles.icon, messageCount === 0 && styles.iconDisabled)}
            >
              {copied ? <Check aria-hidden="true" size={icon.header} /> : <Copy aria-hidden="true" size={icon.header} />}
            </button>
            <button type="button" aria-label={m.ask_close()} title={m.ask_close()} data-testid="ask-close" onClick={() => setOpen(false)} {...stylex.props(styles.icon)}>
              <X aria-hidden="true" size={icon.header} />
            </button>
          </header>
          <div {...stylex.props(styles.body)}>
            {owner === null ? (
              <p {...stylex.props(typography.context, styles.loading)}>{m.ask_loading()}</p>
            ) : (
              <Suspense fallback={<p {...stylex.props(typography.context, styles.loading)}>{m.ask_loading()}</p>}>
                <AskThread key={threadKey} page={page} history={messages} onMessage={onMessage} signal={signal} />
              </Suspense>
            )}
          </div>
        </section>
      ) : null}
    </>
  )
}

const dynamic = stylex.create({
  overKeyboard: (top: number, height: number) => ({ top, height, paddingBottom: 0 }),
})

const styles = stylex.create({
  launcher: {
    position: 'fixed',
    right: space.x24,
    bottom: { default: size.launcherLift, [bp.phone]: space.x24 },
    zIndex: layer.launcher,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: size.launcher,
    height: size.launcher,
    padding: 0,
    borderWidth: 0,
    borderRadius: radius.round,
    backgroundColor: { default: skat.feltLight, ':hover': skat.felt },
    color: skat.white,
    cursor: 'pointer',
    boxShadow: shadow.launcher,
    transform: { default: move.rest, ':active': move.press },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: skat.brass,
    outlineOffset: border.focusOffset,
  },
  panel: {
    position: 'fixed',
    right: space.x24,
    bottom: size.launcherLift,
    zIndex: layer.window,
    display: 'flex',
    flexDirection: 'column',
    width: size.windowWidth,
    height: size.windowHeight,
    boxSizing: 'border-box',
    overflow: 'hidden',
    borderRadius: radius.window,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: skat.paperEdge,
    backgroundColor: skat.paper,
    color: skat.ink,
    boxShadow: shadow.float,
  },
  // A phone gets the whole screen: the visible area is too small to share, and nothing behind the
  // window should be reachable while it is open.
  sheet: {
    top: 0,
    right: 0,
    bottom: 'auto',
    left: 0,
    width: '100%',
    height: size.screenDynamic,
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: 'env(safe-area-inset-bottom)',
    borderRadius: 0,
    borderWidth: 0,
    boxShadow: 'none',
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    gap: space.x4,
    paddingBlock: space.x10,
    paddingInline: space.x14,
    backgroundColor: skat.feltDeep,
    color: skat.white,
    flexShrink: 0,
  },
  headText: { display: 'flex', flexDirection: 'column', minWidth: 0, flexGrow: 1, marginRight: space.x4 },
  pageTitle: { opacity: opacity.meta, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  icon: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: size.iconButton,
    height: size.iconButton,
    padding: 0,
    borderWidth: 0,
    borderRadius: radius.round,
    backgroundColor: { default: 'transparent', ':hover': skat.felt },
    color: skat.white,
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focusSm,
    outlineColor: skat.brass,
  },
  iconDisabled: { opacity: opacity.iconDisabled, cursor: 'not-allowed', backgroundColor: { default: 'transparent', ':hover': 'transparent' } },
  // Clipped in both directions: deep-chat lays itself out before its styles land, and on a phone that
  // first, wider pass would stretch the layout viewport past the screen.
  body: { flexGrow: 1, minHeight: 0, minWidth: 0, display: 'flex', overflow: 'hidden' },
  loading: { margin: 'auto', color: skat.inkSoft },
})
