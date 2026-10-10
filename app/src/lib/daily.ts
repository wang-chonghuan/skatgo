// The daily Skat tournament's settings for its pages (SKATGO-29): the numbers they print come from
// here, never from the copy. The settings themselves live with the tournament's rules
// (lib/skat/tournament.ts, SKATGO-35), which the multiplayer service that runs it reads too.
import { DAILY_SIZES } from './skat/tournament'

export { DAILY_DEALS, DAILY_SIZES, DAILY_TIME_ZONE, type DailySize, dailySize } from './skat/tournament'

/** The two tournaments' lengths as the copy names them: "6 or 12 deals" (SKATGO-77). */
export const DAILY_LENGTHS = { short: DAILY_SIZES[0], long: DAILY_SIZES[1] }
