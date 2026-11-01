import * as stylex from '@stylexjs/stylex'
import { Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { track } from '~/lib/analytics'
import { type Platform, shareSheet, shareText, shareUrl } from '~/lib/share'
import { shareCode } from '~/lib/share-api'
import { type DailyStatus, PLAYER } from '~/lib/skat/tournament'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { space } from '../../theme/scale.stylex'
import { typography } from '../../theme/type'
import { Btn } from './ui'

/**
 * Sharing the deal of the day's result (SKATGO-132): its code, asked once — the link carries it, never the score — the
 * share sheet or, where there is none, the link copied, and what came of it. The day's result on /daily and the result
 * at its table (SKATGO-168) share it.
 */
export function useDodShare(status: DailyStatus) {
  const [said, setSaid] = useState<'copied' | 'failed' | null>(null)
  const [code, setCode] = useState<string | null>(null)
  useEffect(() => {
    void shareCode().then((r) => setCode('error' in r ? null : r.code))
  }, [])
  const locale = getLocale()
  const text = shareText(locale, { day: status.day, score: status.totals[PLAYER] })
  async function share(via: Platform) {
    if (!code) return
    const r = await shareSheet(text, shareUrl(locale, code, via))
    track('dod_shared', { how: r === 'shared' ? 'sheet' : r === 'copied' ? 'copy' : 'failed' })
    setSaid(r === 'shared' ? null : r)
  }
  return { code, text, said, setSaid, share }
}

/** What came of sharing, under the buttons. */
export function ShareSaid({ said }: { said: 'copied' | 'failed' | null }) {
  return said ? <p role="status" {...stylex.props(typography.small, styles.muted)}>{said === 'copied' ? m.dod_copied() : m.dod_share_failed()}</p> : null
}

/**
 * The way on after the deal of the day at its table (SKATGO-168, the human: 「打完弹出结果页面，很快就闪了……应该改成2个按钮，share
 * 的那个按钮，显示在结果页，下面是关闭按钮。就是两个按钮」): in the result's foot, "share" as on the day's result, and under it
 * "close", to the day's page. The result no longer goes by itself.
 */
export function DodDone({ status, onClose }: { status: DailyStatus; onClose: () => void }) {
  const { code, said, share } = useDodShare(status)
  return (
    <div data-testid="dod-done" {...stylex.props(styles.done)}>
      <Btn testId="dod-share" shape="block" size="lg" disabled={!code} onClick={() => void share('sheet')}>
        <Share2 aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />
        {m.dod_share()}
      </Btn>
      <Btn testId="dod-close" tone="quiet" shape="block" size="lg" onClick={onClose}>
        {m.dod_close()}
      </Btn>
      <ShareSaid said={said} />
    </div>
  )
}

const styles = stylex.create({
  // The two ways on, one over the other, each the foot's width.
  done: { display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: space.x10 },
  muted: { margin: 0, color: color.slate, textAlign: 'center' },
})
