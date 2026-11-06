import * as stylex from '@stylexjs/stylex'

import { type Card, type Contract, SUITS } from '~/lib/skat/cards'
import { contractName, matadorLabel } from '~/lib/skat/i18n'
import { NULL_VALUES, baseValue, matadors } from '~/lib/skat/value'
import { m } from '~/paraglide/messages'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { typography } from '../../theme/type'
import { Modal, Rich } from './ui'

const GAMES: Contract[] = [...[...SUITS].reverse().map((trump): Contract => ({ kind: 'suit', trump })), { kind: 'grand' }]

/**
 * Free play's "How high can I bid?" (SKATGO-176, the human: 「这个点了应该显示一个表，就是这幅牌能叫到多少分，每个合约，就是一个
 * 弹窗」): every contract with what the ten cards in hand make it worth — the matadors and the count, the highest bid without
 * Hand, and with Hand; Null's fixed values. It counts, and leaves which game and whether to bid to the player.
 */
export function BidValues({ hand, onClose }: { hand: Card[]; onClose: () => void }) {
  const rows = GAMES.map((c) => {
    const t = matadors(hand, c)
    const base = baseValue(c)
    return { key: contractName(c), name: contractName(c), count: `${matadorLabel(t.with, t.count)} · ${t.count + 1} × ${base}`, bid: base * (t.count + 1), hand: base * (t.count + 2) }
  })
  rows.push(
    { key: 'null', name: 'Null', count: '', bid: NULL_VALUES.plain, hand: NULL_VALUES.hand },
    { key: 'null-ouvert', name: m.rules_null_ouvert(), count: '', bid: NULL_VALUES.ouvert, hand: NULL_VALUES.handOuvert },
  )
  return (
    <Modal title={m.bid_hint_button()} onClose={onClose} testId="skat-bid-values">
      <table {...stylex.props(styles.table)}>
        <thead>
          <tr>
            <th {...stylex.props(typography.smallBold, styles.head)}>{m.bidvalues_game()}</th>
            <th {...stylex.props(typography.smallBold, styles.head)}>{m.bidvalues_count()}</th>
            <th {...stylex.props(typography.smallBold, styles.head, styles.number)}>{m.bidvalues_bid()}</th>
            <th {...stylex.props(typography.smallBold, styles.head, styles.number)}>{m.bidvalues_hand()}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} data-testid="skat-bid-value">
              <td {...stylex.props(typography.appText, styles.cell, styles.name)}><Rich text={r.name} /></td>
              <td {...stylex.props(typography.appText, styles.cell, styles.count)}>{r.count}</td>
              <td {...stylex.props(typography.appBtnStrong, styles.cell, styles.number, styles.name)}>{r.bid}</td>
              <td {...stylex.props(typography.appText, styles.cell, styles.number, styles.count)}>{r.hand}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p {...stylex.props(typography.appText, styles.note)}>{m.bidvalues_note()}</p>
    </Modal>
  )
}

const styles = stylex.create({
  table: { width: '100%', borderCollapse: 'collapse' },
  head: { paddingBottom: space.x6, textAlign: 'start', color: color.slate },
  cell: { paddingBlock: space.x6, paddingRight: space.x10, borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: color.hairline, verticalAlign: 'baseline' },
  name: { color: color.navy, whiteSpace: 'nowrap' },
  count: { color: color.slate },
  number: { textAlign: 'end', whiteSpace: 'nowrap' },
  note: { marginBlock: 0, marginTop: space.x12, color: color.slate },
})
