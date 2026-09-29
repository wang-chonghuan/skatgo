import { useRouter } from '@tanstack/react-router'
import { DeepChat } from 'deep-chat-react'
import { ArrowUp } from 'lucide-react'
import { type ComponentProps, memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { type ChatMessage, historyForRequest } from '~/lib/ask/conversation'
import { LIMITS } from '~/lib/ask/limits'
import { useTableSnapshot } from '~/lib/skat/table-snapshot'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { icon } from '../../theme/constants'
import { color } from '../../theme/color.stylex'
import { elev } from '../../theme/elevation.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { fontSize, leading } from '../../theme/type.stylex'

// The message list, input and send button of the assistant (SKATGO-14, after Trovestep's
// deep-chat-thread): deep-chat — the approved third-party chat body (ui.md) — loaded only when the
// window first opens. Answers stream in as the model writes them; while they do, the send button is
// Stop. Every colour is a course token.

export type AskPage = { page: 'entry' } | { page: 'home' } | { page: 'lesson'; lessonId: string } | { page: 'play' }

type Signals = {
  onResponse: (response: { text?: string; error?: string; overwrite?: boolean }) => Promise<void>
  onOpen: () => void
  onClose: () => void
  stopClicked: { listener: () => void }
}

/**
 * deep-chat's stream mode cannot show an error before any text has streamed: finalising an empty
 * stream throws. Close the stream first, then add the error as its own message.
 */
async function fail(signals: Signals, hasText: boolean, host: HTMLElement | null, error: string): Promise<void> {
  if (hasText) {
    await signals.onResponse({ error })
    return
  }
  signals.onClose()
  ;(host as unknown as { addMessage?: (message: { error: string }) => void } | null)?.addMessage?.({ error })
}

/** Reads `data: {"text"}` / `data: {"error"}` events; each text event is the whole answer so far. */
async function readStream(response: Response, signals: Signals, active: () => boolean, host: HTMLElement | null): Promise<void> {
  const reader = response.body?.getReader()
  if (!reader) {
    await fail(signals, false, host, m.ask_error())
    return
  }
  const decoder = new TextDecoder()
  let buffer = ''
  let hasText = false
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let boundary = buffer.indexOf('\n\n')
    while (boundary >= 0) {
      const line = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)
      boundary = buffer.indexOf('\n\n')
      if (!line.startsWith('data: ') || !active()) continue
      const event = JSON.parse(line.slice(6)) as { text: string } | { error: string }
      if ('error' in event) {
        await fail(signals, hasText, host, event.error)
        return
      }
      hasText = true
      await signals.onResponse({ text: event.text, overwrite: true })
    }
  }
  if (hasText) signals.onClose()
  else if (active()) await fail(signals, false, host, m.ask_error())
}

/**
 * The React wrapper re-assigns every property on each render, and deep-chat rebuilds its DOM on any
 * assignment — even of the same value — dropping what is on screen and replacing the focused input.
 * Memoising this layer means a parent render with unchanged props never reaches the element (SKATGO-13
 * found the same: Clerk loading re-rendered the launcher and emptied the chat).
 */
const StableDeepChat = memo(function StableDeepChat({ elementRef, ...props }: ComponentProps<typeof DeepChat> & { elementRef: (element: unknown) => void }) {
  return <DeepChat ref={elementRef} {...props} />
})

export type AskThreadProps = {
  page: AskPage
  history: ReadonlyArray<ChatMessage>
  onMessage: (message: ChatMessage) => void
  /** Aborted when the page, the conversation or the owner changes. */
  signal: AbortSignal
}

export default function AskThread({ page, history, onMessage, signal }: AskThreadProps) {
  const router = useRouter()
  const locale = getLocale()
  const atTable = page.page === 'play'
  const host = useRef<HTMLElement | null>(null)
  const latest = useRef({ onMessage, page, signal })
  latest.current = { onMessage, page, signal }

  // deep-chat takes button icons as SVG markup; read it from the icon once, before the chat mounts.
  const iconSource = useRef<HTMLSpanElement | null>(null)
  const [sendIcon, setSendIcon] = useState<string | null>(null)
  useLayoutEffect(() => {
    const svg = iconSource.current?.querySelector('svg')
    // deep-chat parses icon markup as XML, so it needs the SVG namespace the serializer adds.
    setSendIcon(svg ? new XMLSerializer().serializeToString(svg) : null)
  }, [])

  // Links in an answer that point into the site navigate in place: deep-chat renders them inside its
  // shadow root, so the click is read from the composed path.
  useEffect(() => {
    const element = host.current
    if (!element) return
    const onClick = (event: MouseEvent) => {
      const anchor = event.composedPath().find((node): node is HTMLAnchorElement => node instanceof HTMLAnchorElement)
      const href = anchor?.getAttribute('href')
      if (!href || !href.startsWith('/') || href.startsWith('//')) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
      event.preventDefault()
      void router.navigate({ href })
    }
    element.addEventListener('click', onClick)
    return () => element.removeEventListener('click', onClick)
  }, [router, sendIcon])

  const config = useMemo(() => {
    // deep-chat takes plain CSS strings; the course's tokens are CSS variables, which reach inside its
    // shadow root by inheritance.
    const bubble = { maxWidth: dims.chatBubbleMax, lineHeight: leading.compact, padding: `${space.x10} ${space.x14}`, borderRadius: radii.panel, color: color.text }
    const button = { borderRadius: radii.round, width: dims.chatButton, height: dims.chatButton }
    return {
      connect: {
        stream: true,
        handler: (body: { messages?: ChatMessage[] }, signals: Signals) => {
          const { page: current, signal: pageSignal } = latest.current
          const controller = new AbortController()
          const abort = () => controller.abort()
          pageSignal.addEventListener('abort', abort, { once: true })
          signals.stopClicked.listener = abort
          const active = () => !controller.signal.aborted
          // Opening the stream at once turns the send button into Stop for the whole wait.
          signals.onOpen()
          void (async () => {
            try {
              const response = await fetch('/api/ask', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                  messages: historyForRequest(body.messages ?? [], LIMITS.messages, LIMITS.questionChars),
                  locale,
                  ...current,
                  // At the table, the learner's view of it goes with the question — read now, because
                  // the game has moved on since the window opened.
                  ...(current.page === 'play' ? { table: useTableSnapshot.getState().text ?? '' } : {}),
                }),
                signal: controller.signal,
              })
              if (!response.ok) {
                const payload = (await response.json().catch(() => null)) as { error?: string } | null
                if (active()) await fail(signals, false, host.current, payload?.error ?? m.ask_error())
                else signals.onClose()
                return
              }
              await readStream(response, signals, active, host.current)
            } catch {
              // A cancelled request (Stop, another page, a new conversation) closes quietly; anything
              // else is reported once.
              if (active()) await fail(signals, false, host.current, m.ask_error())
              else signals.onClose()
            } finally {
              pageSignal.removeEventListener('abort', abort)
            }
          })()
        },
      },
      requestBodyLimits: { maxMessages: LIMITS.messages },
      remarkable: { html: false, linkTarget: '_blank', typographer: false },
      textInput: {
        characterLimit: LIMITS.questionChars,
        placeholder: { text: atTable ? m.ask_placeholder_play() : m.ask_placeholder(), style: { color: color.slate } },
        styles: {
          container: { width: dims.chatInputWidth, backgroundColor: color.surface, border: `${border.hair} solid ${color.hairline}`, borderRadius: radii.panel, boxShadow: 'none', color: color.text },
          focus: { border: `${border.hair} solid ${color.info}`, boxShadow: elev.focus },
          text: { padding: `${space.x10} ${space.x12}`, color: color.text },
        },
      },
      chatStyle: { width: '100%', maxWidth: '100%', minWidth: '0', height: '100%', border: 'none', borderRadius: '0', backgroundColor: color.page, fontFamily: 'inherit', fontSize: fontSize.f15 },
      inputAreaStyle: { backgroundColor: color.page, borderTop: `${border.hair} solid ${color.hairline}` },
      messageStyles: {
        default: {
          shared: { bubble },
          user: { bubble: { backgroundColor: color.goodSoft } },
          ai: { bubble: { backgroundColor: color.surface } },
        },
        intro: { bubble: { ...bubble, backgroundColor: color.surface, color: color.slate } },
        error: { bubble: { ...bubble, backgroundColor: color.badSoft, color: color.bad } },
        // The padding centres deep-chat's three dots (SKATGO-11); its geometry is explained at the token.
        loading: { message: { styles: { bubble: { ...bubble, backgroundColor: color.surface, color: color.slate, padding: dims.chatLoadingPadding } } } },
      },
      submitButtonStyles: {
        submit: {
          container: { default: { ...button, backgroundColor: color.go, color: color.onColor, cursor: 'pointer' }, hover: { backgroundColor: color.roleTag } },
          svg: { content: sendIcon ?? undefined },
        },
        loading: { container: { default: { ...button, backgroundColor: color.hairline, cursor: 'progress' } } },
        stop: { container: { default: { ...button, backgroundColor: color.go, cursor: 'pointer' }, hover: { backgroundColor: color.roleTag } } },
        disabled: {
          container: { default: { ...button, backgroundColor: color.hairline, color: color.slate, cursor: 'not-allowed' } },
          svg: { content: sendIcon ?? undefined },
        },
      },
      // deep-chat's documented stylesheet hook: centre the button icons, draw the stop square in the
      // button's text colour, and keep scrolling inside the messages and the input.
      auxiliaryStyle: [
        '.input-button-svg { display: flex; align-items: center; justify-content: center; }',
        '#messages, #text-input { overscroll-behavior: contain; }',
        `.input-button-svg > svg { width: ${dims.chatIcon}; height: ${dims.chatIcon}; }`,
        `#stop-icon { position: static; width: ${dims.chatStopIcon}; height: ${dims.chatStopIcon}; border-radius: ${dims.chatStopRadius}; background-color: ${color.onColor}; }`,
      ].join('\n'),
      errorMessages: { displayServiceErrorMessages: true },
      displayLoadingBubble: true,
    }
  }, [locale, atTable, sendIcon])

  const initialHistory = useMemo(() => [...history], [history])
  const intro = useMemo(() => ({ text: atTable ? m.ask_intro_play() : m.ask_intro() }), [atTable, locale])
  // Every value handed to deep-chat keeps its identity across renders so the memoised layer above can
  // skip them; on phones the keyboard itself causes a render (the window moves above it).
  const setHost = useCallback((element: unknown) => {
    host.current = element as HTMLElement | null
  }, [])
  const handleMessage = useCallback(({ message, isHistory }: { message: { role?: string; text?: string }; isHistory: boolean }) => {
    if (isHistory) return
    if ((message.role === 'user' || message.role === 'ai') && typeof message.text === 'string' && message.text.trim()) {
      latest.current.onMessage({ role: message.role, text: message.text })
    }
  }, [])

  if (!sendIcon) {
    return (
      <span ref={iconSource} hidden>
        <ArrowUp strokeWidth={icon.sendStroke} />
      </span>
    )
  }

  return <StableDeepChat elementRef={setHost} {...config} history={initialHistory} introMessage={intro} onMessage={handleMessage} />
}
