import { Show, SignInButton, useAuth } from '@clerk/tanstack-react-start'
import * as stylex from '@stylexjs/stylex'
import { useRouterState } from '@tanstack/react-router'
import { Suspense, lazy, useEffect, useMemo, useState } from 'react'

import { useTableSnapshot } from '~/lib/skat/table-snapshot'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { skat } from '../../theme/skat.stylex'
import { Btn } from './ui'

// The floating helper (SKATGO-9): a button in the corner of every page that opens a small chat about
// the rules and the page the learner is on — at the table, about the game in progress, seen only from
// the learner's seat (lib/skat/table-view.ts). The conversation lives in this module and nowhere
// else: no storage, gone on reload, and a new one on every page, because the assistant's
// context is the page. Closing the popup keeps that page's conversation — deep-chat forgets its
// messages when it goes away, so they are kept beside it and handed back as its history — which lets
// a learner close the popup, play a card, and come back to where they were.
//
// The chat body is deep-chat, a web component, loaded only when the popup first opens: it needs
// `window`, and it is the one heavy dependency of the site — a learner who never asks never
// downloads it. The shell around it (button, panel, header) is the course's own StyleX; deep-chat's
// own colours are set through its style properties from the same palette tokens.

const DeepChat = lazy(() => import('deep-chat-react').then((mod) => ({ default: mod.DeepChat })))

type Message = { role?: string; text?: string }

// The open page's conversation. It lives here rather than in the component, because it has to outlive
// every time the popup closes and the component with it; a different page, a different account
// (SKATGO-12 — signing out and someone else signing in on the same tab must not see it), or a
// reload, starts an empty one. It is never written to storage and never leaves the tab.
const conversation: { key: string; messages: Message[] } = { key: '', messages: [] }

function conversationFor(key: string): Message[] {
  if (conversation.key !== key) {
    conversation.key = key
    conversation.messages = []
  }
  return conversation.messages
}

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
  const { userId } = useAuth()
  const page = pageOf(pathname)
  const messages = conversationFor(`${userId ?? ''} ${pathname}`)

  // A new page is a new conversation; the popup closes with the old one.
  useEffect(() => setOpen(false), [pathname])

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
            {/* The chat is for signed-in learners only (SKATGO-12); the endpoint refuses anyone else. */}
            <Show when="signed-out">
              <div data-testid="ask-sign-in" {...stylex.props(styles.gate)}>
                <p {...stylex.props(styles.gateText)}>{m.ask_login_required()}</p>
                <SignInButton mode="modal">
                  <Btn testId="ask-sign-in-button">{m.auth_sign_in()}</Btn>
                </SignInButton>
              </div>
            </Show>
            <Show when="signed-in">
              <Suspense fallback={<p {...stylex.props(styles.loading)}>{m.ask_loading()}</p>}>
                <Chat key={`${userId ?? ''} ${pathname}`} page={page} history={messages} onMessage={(msg) => messages.push(msg)} />
              </Suspense>
            </Show>
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
  // The three dots that say the answer is on its way. They are one 0.45em element with a
  // pseudo-element 0.7em either side of it, inside a 1em-wide box — so their visual middle sits
  // 0.275em left of the box's middle, and equal padding would look lopsided. The left padding carries
  // that 0.275em twice over; both gaps then read 0.93em.
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
// The send button is round and the same size in every state, so nothing jumps as it changes.
const sendButton = { borderRadius: '999px', width: '34px', height: '34px' }
// deep-chat's own submit icon, repeated here because its loading state otherwise draws three dots in
// the button (SKATGO-11): the dots belong in the chat, where they say the answer is coming; the
// button just says it cannot be pressed. Copied markup — including its id, which is what deep-chat's
// own stylesheet sizes the icon by; without it the plane fills the whole button.
const SEND_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="none" stroke-width="1" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" id="submit-icon"><line x1="22" y1="2" x2="11" y2="14"></line><polygon points="22 2 15 22 11 14 2 10 22 2"></polygon></svg>'
// Nothing to send, and — while the answer is on its way — nothing that may be sent: deep-chat refuses
// a second question until the reply lands, and the button says so rather than inviting the click.
const sendInert = { ...sendButton, backgroundColor: skat.paperEdge, cursor: 'not-allowed' }
// deep-chat applies each state's styles over the previous one and never resets what a state does not
// name, so every state says both the colour and the cursor.
const submitButtonStyles = {
  submit: { container: { default: { ...sendButton, backgroundColor: skat.brass, cursor: 'pointer' } }, svg: { styles: { default: { filter: 'none', opacity: '1' } } } },
  loading: { container: { default: sendInert }, svg: { content: SEND_ICON, styles: { default: { opacity: '0.45' } } } },
  disabled: { container: { default: sendInert }, svg: { styles: { default: { opacity: '0.45' } } } },
}

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
  gate: {
    margin: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    paddingInline: 24,
    textAlign: 'center',
  },
  gateText: { margin: 0, fontSize: 16, lineHeight: 1.5, color: skat.ink },
})
