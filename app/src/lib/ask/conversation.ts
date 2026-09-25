// The assistant's conversation in this browser tab (SKATGO-14, after Trovestep's conversation store):
// one conversation for the whole site, kept in the tab's sessionStorage so it survives moving between
// pages and reloading. It belongs to one owner — the signed-in account, or the guest — and another
// owner never sees it: the stored conversation is discarded instead. Nothing here reaches a server
// except as the questions the learner sends.

export type ChatMessage = { role: 'user' | 'ai'; text: string }

export const CONVERSATION_STORAGE_KEY = 'skatgo:assistant'
export const STORED_MESSAGES_MAX = 60

/** The owner of a signed-out visitor's conversation. */
export const GUEST = 'guest'

type Stored = { owner: string; messages: ChatMessage[] }
type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function isMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false
  const { role, text } = value as Record<string, unknown>
  return (role === 'user' || role === 'ai') && typeof text === 'string'
}

export function clearConversation(storage: KeyValueStorage | null): void {
  try {
    storage?.removeItem(CONVERSATION_STORAGE_KEY)
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
  }
}

export function loadConversation(storage: KeyValueStorage | null, owner: string): ChatMessage[] {
  try {
    const raw = storage?.getItem(CONVERSATION_STORAGE_KEY)
    if (!raw) return []
    const stored = JSON.parse(raw) as Partial<Stored>
    if (stored.owner !== owner || !Array.isArray(stored.messages)) {
      clearConversation(storage)
      return []
    }
    return stored.messages.filter(isMessage).slice(-STORED_MESSAGES_MAX)
  } catch {
    clearConversation(storage)
    return []
  }
}

export function saveConversation(storage: KeyValueStorage | null, owner: string, messages: ReadonlyArray<ChatMessage>): void {
  const stored: Stored = { owner, messages: messages.slice(-STORED_MESSAGES_MAX).map(({ role, text }) => ({ role, text })) }
  try {
    storage?.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(stored))
  } catch {
    // A full or blocked storage only loses persistence, never the chat.
  }
}

/**
 * The messages sent with a question: the last `max` turns, the assistant's trimmed to `chars`. The
 * endpoint refuses any message longer than its question limit, and answers may be longer than that;
 * without the trim, one long answer would make every later question in the conversation fail.
 */
export function historyForRequest(messages: ReadonlyArray<ChatMessage>, max: number, chars: number): ChatMessage[] {
  return messages
    .filter((message) => message.text.trim())
    .slice(-max)
    .map((message) => ({ role: message.role, text: message.role === 'ai' ? message.text.slice(0, chars) : message.text }))
}
