import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { dailyProfile, isError } from '~/lib/daily-api'
import { type ProfileDeal, daysOf, trendOf } from '~/lib/skat/profile'
import { useAccount } from '~/lib/use-account'
import { m } from '~/paraglide/messages'
import { color } from '../../theme/color.stylex'
import { space } from '../../theme/scale.stylex'
import { typography } from '../../theme/type'

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')

/**
 * Under a finished tournament, for an account: how the day went against the AI, per deal, and whether that is better
 * than before (SKATGO-128, the human: 「我主要想让这个做为一个留存点」), with the way to the record of play. Nothing
 * for a guest, or while the record is not there.
 */
export function ProfileLine() {
  const account = useAccount()
  const [deals, setDeals] = useState<ProfileDeal[] | null>(null)
  useEffect(() => {
    if (!account) return
    let live = true
    void dailyProfile().then((r) => { if (live && !isError(r)) setDeals(r.deals) })
    return () => { live = false }
  }, [account])
  if (!account || !deals?.length) return null
  const trend = trendOf(deals)
  const today = daysOf(deals).at(-1)?.perDeal ?? null
  const text = trend
    ? (trend.verdict === 'up' ? m.profile_trend_up : trend.verdict === 'down' ? m.profile_trend_down : m.profile_trend_same)({ last: signed(trend.last), before: signed(trend.before) })
    : today !== null ? m.profile_today({ last: signed(today) }) : null
  if (!text) return null
  return (
    <div data-testid="profile-line" data-verdict={trend?.verdict ?? 'first'} {...stylex.props(styles.line)}>
      <p {...stylex.props(typography.appText, styles.text)}>{text}</p>
      <Link to="/profile" {...stylex.props(typography.appLink, styles.link)}>{m.profile_title()}</Link>
    </div>
  )
}

const styles = stylex.create({
  line: { display: 'flex', flexDirection: 'column', gap: space.x4 },
  text: { margin: 0, color: color.navy },
  link: { alignSelf: 'flex-start', color: color.info },
})
