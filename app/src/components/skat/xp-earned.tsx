import * as stylex from '@stylexjs/stylex'
import { CircleHelp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { useAccount } from '~/lib/use-account'
import { XP, XP_FAR, XP_OWN_GAME, type XpTier, xpOf, xpTier } from '~/lib/skat/xp'
import { m } from '~/paraglide/messages'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { elev } from '../../theme/elevation.stylex'
import { border, layer, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { Modal } from './ui'

/** How long the toast with a deal's XP stays, unless tapped away first. */
const TOAST_MS = 5000

/** A tier as the toast's rule says it, short: "1–49 below AI". */
const ruleText = (t: XpTier) =>
  ({
    farBelow: m.xp_rule_farBelow({ n: XP_FAR }),
    below: m.xp_rule_below({ n: XP_FAR - 1 }),
    same: m.xp_rule_same(),
    above: m.xp_rule_above({ n: XP_FAR - 1 }),
    farAbove: m.xp_rule_farAbove({ n: XP_FAR }),
  })[t]

/** The deal's difference to the AI in words: above or below by how much, or the same. */
const versus = (diff: number | null) =>
  diff === null || diff === 0 ? m.xp_vs_same() : diff > 0 ? m.xp_vs_above({ d: diff }) : m.xp_vs_below({ d: -diff })

/**
 * The XP a finished deal earned (SKATGO-172, the human: 「打完一副牌，就要跳出来，得了多少xp，或者在结算页面显示，弄个toast来显示计算
 * 方法」): in the result, under its title, "+14 XP" and why — above or below the AI by how much — with the tiers behind a
 * circled question mark; and once, over the page above the dialog, a toast in one line with the rule that applied
 * ("+6 XP · 1–49 below AI = 6 XP", "+12 XP · same as AI 10 + own game 2"), which goes by itself or with a tap. A guest is
 * told that signed-in players earn XP. `mine` and `ai` are the deal's Seeger-Fabian scores in the player's seat, the AI's
 * null when it has none; `declared` when the player was the declarer, a game of their own that earns 2 more.
 */
export function XpEarned({ mine, ai, declared }: { mine: number; ai: number | null; declared: boolean }) {
  const account = useAccount()
  const [toast, setToast] = useState(true)
  const [how, setHow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setToast(false), TOAST_MS)
    return () => clearTimeout(t)
  }, [])
  if (account === undefined) return null
  const diff = ai === null ? null : mine - ai
  const xp = xpOf(diff, declared)
  const why = account ? (declared ? `${versus(diff)} · ${m.xp_own({ n: XP_OWN_GAME })}` : versus(diff)) : m.xp_guest()
  // The toast tells the rule that applied, which the line in the result does not repeat (SKATGO-172).
  const tier = xpTier(diff)
  const rule = declared ? m.xp_rule_own({ tier: ruleText(tier), n: XP[tier], b: XP_OWN_GAME }) : m.xp_rule({ tier: ruleText(tier), n: xp })
  return (
    <>
      <div data-testid="xp-earned" data-xp={xp} data-guest={account ? undefined : 'true'} {...stylex.props(styles.line)}>
        <span {...stylex.props(typography.appBtnStrong, account ? styles.plus : styles.plusGuest)}>{m.xp_earned({ n: xp })}</span>
        <span {...stylex.props(typography.appText, styles.why)}>{why}</span>
        <button type="button" data-testid="xp-earned-how" aria-label={m.xp_how()} title={m.xp_how()} onClick={() => setHow(true)} {...stylex.props(styles.help)}>
          <CircleHelp aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />
        </button>
      </div>
      {how ? <XpHow onClose={() => setHow(false)} testId="xp-earned-how-text" /> : null}
      {toast
        ? createPortal(
            <button type="button" role="status" data-testid="xp-toast" onClick={() => setToast(false)} {...stylex.props(styles.toast)}>
              <span {...stylex.props(typography.appBtnStrong, account ? styles.plus : styles.plusGuest)}>{m.xp_earned({ n: xp })}</span>
              <span {...stylex.props(typography.appText, styles.why)}>{rule}</span>
            </button>,
            document.body,
          )
        : null}
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

/** How XP is earned (SKATGO-172): what a deal is measured by, the five tiers and what each earns, and the week. A dialog
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
        <p {...stylex.props(typography.appText, styles.howText)}>{m.xp_how_week()}</p>
      </div>
    </Modal>
  )
}

const styles = stylex.create({
  line: { display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', columnGap: space.x8, rowGap: space.x2 },
  plus: { color: color.go, whiteSpace: 'nowrap' },
  plusGuest: { color: color.slate, whiteSpace: 'nowrap' },
  why: { color: color.navy },
  help: {
    display: 'inline-flex',
    alignSelf: 'center',
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
  // Over the page, at the top in the middle, above the dialog and clear of the way out: a white pill as wide as its one
  // line of words.
  toast: {
    position: 'fixed',
    top: space.x8,
    left: 0,
    // Centred in the width left of the way out, which sits in the top right corner (`dims.launcher`).
    right: dims.launcher,
    zIndex: layer.tip,
    display: 'flex',
    alignItems: 'baseline',
    gap: space.x8,
    width: 'max-content',
    maxWidth: dims.tipWidth,
    marginInline: 'auto',
    paddingBlock: space.x8,
    // Narrow enough sideways that the longest rule ("50+ above AI 20 + own game 2") stays clear of the way out on a phone.
    paddingInline: space.x12,
    borderWidth: 0,
    borderRadius: radii.pill,
    backgroundColor: color.surface,
    boxShadow: elev.option,
    textAlign: 'center',
    cursor: 'pointer',
  },
  how: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  howText: { margin: 0, color: color.text },
  tiers: { width: '100%', borderCollapse: 'collapse' },
  tierCell: { paddingBlock: space.x6, borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: color.hairline, color: color.navy },
  tierXp: { textAlign: 'end', whiteSpace: 'nowrap' },
})
