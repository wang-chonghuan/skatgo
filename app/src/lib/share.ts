import { m } from '~/paraglide/messages'
import { type Locale } from '~/paraglide/runtime'
import { localizedUrl } from './site'

// Sharing the deal of the day's result (SKATGO-131): a line anyone can read, with no card and no contract in it, so it
// tells nothing of the deal to someone who has yet to play it, and a link back that says it came from a share.

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')

/** The line shared: the site, the day, the player's score and the AI's, a ✅ when the player did as well or better,
 *  and the link to /daily in the page's language. */
export function shareText(locale: Locale, r: { day: string; score: number; ai: number | null }): string {
  const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${r.day}T00:00:00Z`))
  const url = `${localizedUrl('/daily', locale)}?ref=share`.replace(/^https?:\/\//, '')
  const ai = r.ai === null ? '' : ` ${m.dod_share_ai({ ai: signed(r.ai) }, { locale })}`
  const mark = r.ai !== null && r.score >= r.ai ? ' ✅' : ''
  return `SkatGo · ${date} · ${m.dod_share_title({}, { locale })} ${signed(r.score)}${ai}${mark} ${url}`
}

/** The system's share sheet where there is one (a phone), else the clipboard. Says which was used, or that neither
 *  worked. */
export async function share(text: string): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches) {
      await navigator.share({ text })
      return 'shared'
    }
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
