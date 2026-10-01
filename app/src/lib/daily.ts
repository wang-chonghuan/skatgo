// The daily Skat tournament's settings for its pages (SKATGO-29): the numbers they print come from
// here, never from the copy. The settings themselves live with the tournament's rules
// (lib/skat/tournament.ts, SKATGO-35), which the multiplayer service that runs it reads too.
import { DAILY_TIME_ZONE } from './skat/tournament'

export { DAILY_DEALS, DAILY_TIME_ZONE } from './skat/tournament'

/** Today's date in the tournament's time zone, written the way the language writes a long date. */
export const dailyDate = (now: Date, locale: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: DAILY_TIME_ZONE }).format(now)

/** Hours and minutes until the next midnight in the tournament's time zone. */
export function untilNextDeals(now: Date): { h: number; m: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: DAILY_TIME_ZONE, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
      .formatToParts(now)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, Number(p.value)]),
  )
  const left = 24 * 60 - (parts.hour * 60 + parts.minute) - (parts.second > 0 ? 1 : 0)
  return { h: Math.floor(left / 60), m: left % 60 }
}
