import * as stylex from '@stylexjs/stylex'
import { useRouterState } from '@tanstack/react-router'
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'

import { useTableSnapshot } from '~/lib/skat/table-snapshot'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { skat } from '../../theme/skat.stylex'

// The floating helper (SKATGO-9): a button in the corner of every page that opens a small chat about
// the rules and the page the learner is on — at the table, about the game in progress, seen only from
// the learner's seat (lib/skat/table-view.ts). The conversation lives in this component and nowhere
// else: no storage, no history, gone on reload, and a new one on every page, because the assistant's
// context is the page. Closing the popup keeps the conversation for that page (deep-chat drops its
// messages when hidden, so they are kept here and handed back as its history), so a learner can close
// it, play a card, and come back to the same conversation.
//
// The chat body is deep-chat, a web component, loaded only when the popup first opens: it needs
// `window`, and it is the one heavy dependency of the site — a learner who never asks never
// downloads it. The shell around it (button, panel, header) is the course's own StyleX; deep-chat's
// own colours are set through its style properties from the same palette tokens.

const DeepChat = lazy(() => import('deep-chat-react').then((mod) => ({ default: mod.DeepChat })))

const PHONE = '@media (max-width: 480px)'

type Page = { page: 'home' } | { page: 'lesson'; lessonId: string } | { page: 'play' }

/** Which page the assistant is on, from the router's (language-free) path; null where it does not appear. */
function pageOf(pathname: string): Page | null {
  if (pathname === '/') return { page: 'home' }
  if (pathname === '/play' || pathname === '/play/') return { page: 'play' }
  const lesson = /^\/lesson\/([^/]+)\/?$/.exec(pathname)
  if (lesson) return { page: 'lesson', lessonId: decodeURIComponent(lesson[1]) }
  return null
}

export function AskLauncher() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [open, setOpen] = useState(false)
  // This page's conversation so far, in deep-chat's own shape; never stored anywhere else.
  const saved = useRef<Message[]>([])
  const page = pageOf(pathname)

  // A new page is a new conversation; the popup closes with the old one.
  useEffect(() => {
    setOpen(false)
    saved.current = []
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!page) return null

  return (
    <>
      {open ? (
        <section role="dialog" aria-label={m.ask_title()} data-testid="ask-panel" {...stylex.props(styles.panel)}>
          <header {...stylex.props(styles.head)}>
            <div {...stylex.props(styles.headText)}>
              <span {...stylex.props(styles.title)}>💬 {m.ask_title()}</span>
              <span {...stylex.props(styles.subtitle)}>{m.ask_subtitle()}</span>
            </div>
            <button type="button" aria-label={m.ask_close()} data-testid="ask-close" onClick={() => setOpen(false)} {...stylex.props(styles.close)}>
              ✕
            </button>
          </header>
          <div {...stylex.props(styles.body)}>
            <Suspense fallback={<p {...stylex.props(styles.loading)}>{m.ask_loading()}</p>}>
              <Chat key={pathname} page={page} history={saved.current} onMessage={(msg) => saved.current.push(msg)} />
            </Suspense>
          </div>
        </section>
      ) : null}
      <button
        type="button"
        aria-label={m.ask_button_label()}
        aria-expanded={open}
        data-testid="ask-launcher"
        onClick={() => setOpen((o) => !o)}
        {...stylex.props(styles.launcher, open && styles.launcherOpen)}
      >
        <span aria-hidden="true" {...stylex.props(styles.launcherIcon)}>{open ? '✕' : '💬'}</span>
        <span {...stylex.props(styles.launcherText)}>{open ? m.ask_close() : m.ask_button()}</span>
      </button>
    </>
  )
}

// deep-chat's own look, from the course palette. Defined once: a new object on every render would
// re-apply the styles to the web component each time.
const chatStyle = { width: '100%', maxWidth: '100%', minWidth: '0', height: '100%', border: 'none', borderRadius: '0', backgroundColor: skat.paper, fontFamily: 'inherit', fontSize: '15px' }
const messageStyles = {
  default: {
    shared: { bubble: { maxWidth: '85%', lineHeight: '1.5', padding: '10px 14px', borderRadius: '14px' } },
    user: { bubble: { backgroundColor: skat.brassSoft, color: skat.ink } },
    ai: { bubble: { backgroundColor: skat.paperDeep, color: skat.ink } },
  },
  intro: { bubble: { backgroundColor: skat.paperDeep, color: skat.inkSoft } },
  error: { bubble: { backgroundColor: skat.badSoft, color: skat.bad } },
  // The three dots are one 0.45em element with a pseudo-element 0.7em either side of it, inside a
  // 1em-wide box — so their visual middle sits 0.275em left of the box's middle, and equal padding
  // would look lopsided. The left padding carries that 0.275em twice over; both gaps then read 0.93em.
  loading: { message: { styles: { bubble: { backgroundColor: skat.paperDeep, color: skat.inkSoft, padding: '10px 1.08em 10px 1.63em' } } } },
}
const inputAreaStyle = { backgroundColor: skat.paper, borderTop: `1px solid ${skat.paperEdge}` }
const textInput = {
  styles: {
    // deep-chat's input is 80% wide by default; in a 380px panel that leaves a 37px gutter each side.
    container: { width: 'calc(100% - 32px)', backgroundColor: skat.white, border: `1px solid ${skat.paperEdge}`, borderRadius: '999px', boxShadow: 'none', color: skat.ink },
    focus: { border: `1px solid ${skat.brass}`, boxShadow: `0 0 0 3px ${skat.brassSoft}` },
    text: { padding: '10px 12px', color: skat.ink },
  },
  placeholder: { style: { color: skat.inkFaint } },
}
const submitButtonStyles = {
  submit: { container: { default: { backgroundColor: skat.brass, borderRadius: '999px', width: '34px', height: '34px' } }, svg: { styles: { default: { filter: 'none' } } } },
  loading: { container: { default: { backgroundColor: skat.brassSoft, borderRadius: '999px', width: '34px', height: '34px' } } },
  disabled: { container: { default: { backgroundColor: skat.paperEdge, borderRadius: '999px', width: '34px', height: '34px' } } },
}

type Message = { role?: string; text?: string }

function Chat({ page, history, onMessage }: { page: Page; history: Message[]; onMessage: (msg: Message) => void }) {
  const locale = getLocale()
  const atTable = page.page === 'play'
  // deep-chat re-renders itself — and drops its messages — whenever a property object changes
  // identity, so every object it is given is built once per page and language, not per render.
  const props = useMemo(
    () => ({
      connect: { url: '/api/ask', additionalBodyProps: { locale, ...page } },
      // At the table, the learner's current view of it goes with every question — read at the moment
      // of sending, because the game has moved on since the popup opened.
      requestInterceptor: atTable
        ? (details: { body: Record<string, unknown> }) => ({ ...details, body: { ...details.body, table: useTableSnapshot.getState().text ?? '' } })
        : undefined,
      requestBodyLimits: { maxMessages: 6 },
      textInput: { ...textInput, characterLimit: 500, placeholder: { ...textInput.placeholder, text: atTable ? m.ask_placeholder_play() : m.ask_placeholder() } },
      introMessage: { text: atTable ? m.ask_intro_play() : m.ask_intro() },
      errorMessages: { displayServiceErrorMessages: true, overrides: { default: m.ask_error() } },
      // The conversation as it was when the popup last closed, and how new turns are kept.
      history: [...history],
      onMessage: ({ message, isHistory }: { message: Message; isHistory: boolean }) => {
        if (!isHistory && typeof message.text === 'string' && (message.role === 'user' || message.role === 'ai')) onMessage({ role: message.role, text: message.text })
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `page` is identified by its fields
    [locale, atTable, page.page, page.page === 'lesson' ? page.lessonId : ''],
  )
  return (
    <DeepChat
      connect={props.connect}
      requestInterceptor={props.requestInterceptor}
      requestBodyLimits={props.requestBodyLimits}
      textInput={props.textInput}
      introMessage={props.introMessage}
      errorMessages={props.errorMessages}
      history={props.history}
      onMessage={props.onMessage}
      chatStyle={chatStyle}
      messageStyles={messageStyles}
      inputAreaStyle={inputAreaStyle}
      submitButtonStyles={submitButtonStyles}
      displayLoadingBubble
    />
  )
}

const styles = stylex.create({
  launcher: {
    position: 'fixed',
    right: { default: 20, [PHONE]: 14 },
    bottom: { default: 20, [PHONE]: 14 },
    zIndex: 40,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    paddingBlock: 10,
    paddingInline: { default: 16, [PHONE]: 12 },
    borderWidth: 0,
    borderRadius: 999,
    backgroundColor: { default: skat.feltLight, ':hover': skat.felt },
    color: skat.white,
    fontFamily: 'inherit',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: `0 3px 0 ${skat.feltDeep}, 0 8px 20px ${skat.shadowSoft}`,
    transform: { default: 'translateY(0)', ':active': 'translateY(2px)' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: 3,
    outlineColor: skat.brass,
    outlineOffset: 2,
  },
  launcherOpen: { backgroundColor: { default: skat.feltDeep, ':hover': skat.feltDeep } },
  launcherIcon: { fontSize: 18, lineHeight: 1 },
  launcherText: { display: { default: 'inline', [PHONE]: 'none' } },
  panel: {
    position: 'fixed',
    right: { default: 20, [PHONE]: 0 },
    left: { default: 'auto', [PHONE]: 0 },
    bottom: { default: 76, [PHONE]: 0 },
    zIndex: 41,
    display: 'flex',
    flexDirection: 'column',
    width: { default: 380, [PHONE]: 'auto' },
    maxWidth: { default: 'calc(100vw - 40px)', [PHONE]: 'none' },
    height: { default: 'min(560px, calc(100vh - 100px))', [PHONE]: '78vh' },
    boxSizing: 'border-box',
    overflow: 'hidden',
    borderRadius: { default: 18, [PHONE]: '18px 18px 0 0' },
    // A bottom sheet on a phone: no side borders, or the sheet is 2px wider than the screen.
    borderWidth: { default: 1, [PHONE]: '1px 0 0 0' },
    borderStyle: 'solid',
    borderColor: skat.paperEdge,
    backgroundColor: skat.paper,
    color: skat.ink,
    boxShadow: `0 14px 40px ${skat.shadow}`,
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingBlock: 10,
    paddingInline: 14,
    backgroundColor: skat.feltDeep,
    color: skat.white,
  },
  headText: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  title: { fontSize: 15, fontWeight: 800, lineHeight: 1.3 },
  subtitle: { fontSize: 12, opacity: 0.85, lineHeight: 1.3 },
  close: {
    flexShrink: 0,
    width: 32,
    height: 32,
    borderWidth: 0,
    borderRadius: 999,
    backgroundColor: { default: skat.felt, ':hover': skat.feltLight },
    color: skat.white,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: 2,
    outlineColor: skat.brass,
  },
  // Clipped in both directions: deep-chat lays itself out before its styles land, and on a phone that
  // first, wider pass would stretch the layout viewport past the screen.
  body: { flexGrow: 1, minHeight: 0, minWidth: 0, display: 'flex', overflow: 'hidden' },
  loading: { margin: 'auto', fontSize: 14, color: skat.inkSoft },
})
