import { useEffect, useRef, useState } from 'react'
import { useSettings } from '~/lib/skat/settings'

// Lina's and Noah's table talk (SKATGO-142), as free play and the daily tournament's tables share it: after each reply
// of the server the table asks whether there is a line to say now, one question at a time, three lines a deal. A line
// waits until the table has shown every move of that reply, so it never runs ahead of the felt; one later than
// TALK_LATE is about a moment long gone and is dropped. A line on the table stays until the next tap anywhere, which
// still does what it does (the human: 「最好让用户点一下屏幕再给让这个泡泡消失」). The table never waits for any of it.

/** The bidding just won, a window of the play, or the play ended early (`multiplayer/src/talk.ts`). */
export type TalkKind = 'bid' | 'w1' | 'w2' | 'w3' | 'end'
/** What the server says: a line by Lina (1) or Noah (2), or nothing. */
export type TalkReply = { kind: TalkKind; speaker: 1 | 2; line: string } | { kind: null }
export type TableTalk = { seat: 1 | 2; line: string; id: number }

const TALK_LATE = 7000
const TALK_MAX = 3

/** The line on the table, a fresh start for each deal, and the question to ask after a reply. `on` is whether this
 *  table talks at all (with the settings' switch); `shownAll` whether the table has shown every move it was sent. */
export function useTableTalk(on: boolean, shownAll: boolean) {
  const switchedOn = useSettings((s) => s.talk)
  const [talk, setTalk] = useState<TableTalk | null>(null)
  const [heard, setHeard] = useState<(TableTalk & { asked: number }) | null>(null)
  const talking = useRef({ said: [] as TalkKind[], out: false })

  function newDeal() {
    talking.current = { said: [], out: false }
    setTalk(null)
    setHeard(null)
  }

  async function listen(ask: (said: TalkKind[]) => Promise<TalkReply>) {
    const t = talking.current
    if (!on || !switchedOn || t.out || t.said.length >= TALK_MAX) return
    t.out = true
    const asked = Date.now()
    const r = await ask([...t.said])
    if (talking.current !== t) return
    t.out = false
    if (r.kind === null || t.said.includes(r.kind) || Date.now() - asked > TALK_LATE) return
    t.said.push(r.kind)
    setHeard({ seat: r.speaker, line: r.line, id: asked, asked })
  }

  useEffect(() => {
    if (!heard || !shownAll) return
    setHeard(null)
    if (Date.now() - heard.asked <= TALK_LATE) setTalk({ seat: heard.seat, line: heard.line, id: heard.id })
  }, [heard, shownAll])

  useEffect(() => {
    if (!talk) return
    const away = () => setTalk(null)
    document.addEventListener('pointerdown', away, true)
    return () => document.removeEventListener('pointerdown', away, true)
  }, [talk])

  return { talk, newDeal, listen }
}
