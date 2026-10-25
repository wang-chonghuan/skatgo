import { m } from '~/paraglide/messages'
import { type Locale } from '~/paraglide/runtime'
import { localizedUrl } from './site'

// Sharing the deal of the day's result (SKATGO-131, SKATGO-132): a line anyone can read, with no card and no contract
// in it, so it tells nothing of the deal to someone who has yet to play it; a link to the shared result's own page
// (`/d/<code>`), whose link preview is the card and from which the same deal is played; and the ways out — WhatsApp,
// Facebook, Telegram and X by their public share addresses (no script of theirs, nothing tracked), Instagram through
// the phone's share sheet with the card as a picture, the picture to download, the link to copy.

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')

export type Platform = 'whatsapp' | 'facebook' | 'telegram' | 'x' | 'instagram' | 'sheet' | 'copy' | 'download'

/** The line shared: the site, the day, the player's score, their place today, and the invitation — no AI, as on the
 *  card (the human: 「不要显示ai的」). */
export function shareText(locale: Locale, r: { day: string; score: number; rank: number | null; players: number | null }): string {
  const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${r.day}T00:00:00Z`))
  const place = r.rank && r.players && r.players > 1 ? ` · ${m.shared_place({ rank: r.rank, n: r.players }, { locale })}` : ''
  return `SkatGo · ${date} · ${m.dod_share_title({}, { locale })} ${signed(r.score)}${place} · ${m.shared_challenge({}, { locale })}`
}

/** The shared result's page, saying where the visitor came from (`via`, for counting what shares bring). */
export const shareUrl = (locale: Locale, code: string, via?: Platform) => `${localizedUrl(`/d/${code}`, locale)}${via ? `?via=${via}` : ''}`

/** The card: wide for link previews, tall for Instagram. */
export const cardUrl = (locale: Locale, code: string, shape: 'wide' | 'tall') => `/api/card/${code}-${locale}-${shape}.png`

/** Each platform's public share address, with the line and the link. */
export function platformLinks(locale: Locale, code: string, text: string): Record<'whatsapp' | 'facebook' | 'telegram' | 'x', string> {
  const e = encodeURIComponent
  return {
    whatsapp: `https://wa.me/?text=${e(`${text} ${shareUrl(locale, code, 'whatsapp')}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${e(shareUrl(locale, code, 'facebook'))}`,
    telegram: `https://t.me/share/url?url=${e(shareUrl(locale, code, 'telegram'))}&text=${e(text)}`,
    x: `https://x.com/intent/tweet?text=${e(text)}&url=${e(shareUrl(locale, code, 'x'))}`,
  }
}

/** The phone's share sheet with the card as a picture (where Instagram is chosen), else with the line and the link;
 *  where there is no sheet, the line and the link copied. Says which was used, or that neither worked. */
export async function shareSheet(text: string, url: string, picture: string): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches) {
      const blob = await fetch(picture).then((r) => (r.ok ? r.blob() : null)).catch(() => null)
      const file = blob ? new File([blob], 'skatgo.png', { type: 'image/png' }) : null
      if (file && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text: `${text} ${url}` })
      else await navigator.share({ text, url })
      return 'shared'
    }
    await navigator.clipboard.writeText(`${text} ${url}`)
    return 'copied'
  } catch {
    return 'failed'
  }
}

/** The card saved as a file. */
export function download(picture: string) {
  const a = document.createElement('a')
  a.href = picture
  a.download = 'skatgo.png'
  document.body.append(a)
  a.click()
  a.remove()
}
