import { SignInButton } from '@clerk/tanstack-react-start'
import * as stylex from '@stylexjs/stylex'
import { CircleHelp } from 'lucide-react'
import { useState } from 'react'

import { track } from '~/lib/analytics'
import { useAccount } from '~/lib/use-account'
import { XP, XP_FAR, XP_OWN_GAME, type XpTier, xpOf } from '~/lib/skat/xp'
import { m } from '~/paraglide/messages'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { border, space } from '../../theme/scale.stylex'
import { radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { Modal } from './ui'

/** The deal's difference to the AI in words: above or below by how much, or the same. */
const versus = (diff: number | null) =>
  diff === null || diff === 0 ? m.xp_vs_same() : diff > 0 ? m.xp_vs_above({ d: diff }) : m.xp_vs_below({ d: -diff })

/**
 * The XP a finished deal earned (SKATGO-172), the result's first line (SKATGO-173, the human: 「经验值放在打牌结果页的第一行，
 * 不要单独做一个弹窗」): "+12 XP" and why — above or below the AI by how much, and the own game's +2 — with the tiers
 * behind a circled question mark; no toast. A guest is told that signed-in players earn XP, with a link to sign in
 * beside it (SKATGO-177, the human: 「这里也要显示简单的登录按钮，可以用链接」). `mine` and `ai` are the
 * deal's Seeger-Fabian scores in the player's seat, the AI's null when it has none; `declared` when the player was the
 * declarer, a game of their own that earns 2 more.
 */
export function XpEarned({ mine, ai, declared }: { mine: number; ai: number | null; declared: boolean }) {
  const account = useAccount()
  const [how, setHow] = useState(false)
  if (account === undefined) return null
  const diff = ai === null ? null : mine - ai
  const xp = xpOf(diff, declared)
  const why = account ? (declared ? `${versus(diff)} · ${m.xp_own({ n: XP_OWN_GAME })}` : versus(diff)) : m.xp_guest()
  return (
    <>
      <div data-testid="xp-earned" data-xp={xp} data-guest={account ? undefined : 'true'} {...stylex.props(styles.line)}>
        <span {...stylex.props(typography.appBtnStrong, styles.pill, account ? styles.plus : styles.plusGuest)}>{m.xp_earned({ n: xp })}</span>
        <span {...stylex.props(typography.appText, account ? styles.why : styles.whyGuest)}>{why}</span>
        {account ? null : (
          <SignInButton mode="modal">
            <button type="button" data-testid="xp-sign-in" onClick={() => track('sign_in_clicked', { at: 'xp' })} {...stylex.props(typography.appLink, styles.signIn)}>
              {m.auth_sign_in()}
            </button>
          </SignInButton>
        )}
        <button type="button" data-testid="xp-earned-how" aria-label={m.xp_how()} title={m.xp_how()} onClick={() => setHow(true)} {...stylex.props(styles.help)}>
          <CircleHelp aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />
        </button>
      </div>
      {how ? <XpHow onClose={() => setHow(false)} testId="xp-earned-how-text" /> : null}
    </>
  )
}

const TIERS: XpTier[] = ['farBelow', 'below', 'same', 'above', 'farAbove']
const tierText = (t: XpTier) =>
  ({
    farBelow: m.xp_tier_farBelow({ n: XP_FAR }),
    below: m.xp_tier_below({ n: XP_FAR - 1 }),
    same: m.xp_tier_same(),
    above: m.xp_tier_above({ n: XP_FAR - 1 }),
    farAbove: m.xp_tier_farAbove({ n: XP_FAR }),
  })[t]

/** How XP is earned (SKATGO-172): what a deal is measured by, the five tiers and what each earns, and the win rate. A dialog
 *  in the middle of the screen with its own close button, as the Elo's was (SKATGO-140). */
export function XpHow({ onClose, testId }: { onClose: () => void; testId: string }) {
  return (
    <Modal title={m.xp_how()} onClose={onClose} testId={testId}>
      <div {...stylex.props(styles.how)}>
        <p {...stylex.props(typography.appText, styles.howText)}>{m.xp_how_lead()}</p>
        <table {...stylex.props(styles.tiers)}>
          <tbody>
            {TIERS.map((t) => (
              <tr key={t} data-tier={t}>
                <td {...stylex.props(typography.appText, styles.tierCell)}>{tierText(t)}</td>
                <td {...stylex.props(typography.appBtnStrong, styles.tierCell, styles.tierXp)}>{m.xp_points({ n: XP[t] })}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p {...stylex.props(typography.appText, styles.howText)}>{m.xp_how_own()}</p>
        <p {...stylex.props(typography.appText, styles.howText)}>{m.xp_how_rate()}</p>
      </div>
    </Modal>
  )
}

const styles = stylex.create({
  // One row (SKATGO-173, the human: 「看这截图，他妈的丑死了」): the XP as a pill at the left, why beside it — wrapping, if it
  // must, within its own column — and the question mark at the right, all on the pill's middle.
  line: { display: 'flex', alignItems: 'center', gap: space.x10 },
  pill: { flexShrink: 0, paddingBlock: space.x2, paddingInline: space.x10, borderRadius: radii.pill, whiteSpace: 'nowrap' },
  plus: { color: color.go, backgroundColor: color.goodSoft },
  plusGuest: { color: color.slate, backgroundColor: color.page },
  why: { flexGrow: 1, minWidth: 0, color: color.navy },
  whyGuest: { flexGrow: 1, minWidth: 0, color: color.slate },
  signIn: {
    flexShrink: 0,
    margin: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: color.info,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    textDecoration: { default: 'none', ':hover': 'underline' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
    borderRadius: radii.column,
  },
  help: {
    display: 'inline-flex',
    flexShrink: 0,
    margin: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: color.info,
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
    borderRadius: radii.column,
  },
  how: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  howText: { margin: 0, color: color.text },
  tiers: { width: '100%', borderCollapse: 'collapse' },
  tierCell: { paddingBlock: space.x6, borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: color.hairline, color: color.navy },
  tierXp: { textAlign: 'end', whiteSpace: 'nowrap' },
})
