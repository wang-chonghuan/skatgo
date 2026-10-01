import * as stylex from '@stylexjs/stylex'

import { bp } from './breakpoints.stylex'

// The card table's stage (SKATGO-34), after Funbridge's table: everything on the felt that is a thing
// on a table — the cards, the frame, the opponents' stacks — is measured in one unit, and that unit
// follows the room the felt has, so the whole table grows and shrinks together and nothing on it can
// run into anything else. Words (the info board, the messages, the plates, the drawer) keep their type
// sizes; the stage leaves them a fixed band at the top.
//
// The felt is the size container (`containerType: 'size'`). Its unit `u` is the largest that fits a
// design stage under that band:
//   landscape  1000u wide × 576u tall: the frame (300u) near the top, the stacks on both edges, the
//              whole hand along the bottom (the human: no card runs off the felt);
//   portrait    400u wide × 464u tall: a narrower frame (250u), the stacks deeper in the edges.
// Where the felt has more room than the stage, the frame and the stacks keep to the middle of the free
// height and the hand to the bottom: things only ever move apart.
//
// Both are read where they are used, so `cqw`/`cqh` are the felt's.

export const stageUnit = stylex.defineVars({
  u: {
    default: 'min(0.1cqw, calc((100cqh - 140px) / 576))',
    [bp.portrait]: 'min(0.25cqw, calc((100cqh - 212px) / 464))',
  },
})

const u = stageUnit.u

export const stage = stylex.defineVars({
  /** The band at the top for words: the info board (one row in landscape, two by two in portrait) and
   *  the line under it for what happens in the play. Must equal the band in `stageUnit.u`. */
  band: { default: '140px', [bp.portrait]: '212px' },
  /** The learner's card: 130u (96u in portrait), shown whole. */
  handCard: { default: `calc(${u} * 130)`, [bp.portrait]: `calc(${u} * 96)` },
  /** A card's slot in the hand at most: its card and a little gap, so a wide felt never spreads the hand
   *  out (SKATGO-29); the hand stays centred. */
  handSlotMax: { default: `calc(${u} * 138)`, [bp.portrait]: `calc(${u} * 102)` },
  /** The hand sits on the felt's bottom edge, every card whole (the human, SKATGO-34). */
  handBottom: { default: '0px', [bp.portrait]: '0px' },
  /** The edge tabs (hint, side panel) sit just above the hand's top: its 182u card (135u) and the
   *  fan's own padding. */
  tabBottom: { default: `calc(${u} * 182 + 12px)`, [bp.portrait]: `calc(${u} * 135 + 12px)` },
  /** The action drawer stops above the hand, which the discard still needs, and below the band. */
  drawerBottom: { default: `calc(${u} * 182 + 18px)`, [bp.portrait]: `calc(${u} * 135 + 18px)` },
  drawerMaxHeight: { default: `calc(100cqh - ${u} * 182 - 18px - 140px)`, [bp.portrait]: `calc(100cqh - ${u} * 135 - 18px - 212px)` },
  /** The frame: 300u square (250u), its top 10u under the band. */
  frame: { default: `calc(${u} * 300)`, [bp.portrait]: `calc(${u} * 250)` },
  /** The frame's centre down the felt: the band, half the free height, then 160u (135u). */
  frameCentre: {
    default: `calc(140px + (100cqh - 140px - ${u} * 576) / 2 + ${u} * 160)`,
    [bp.portrait]: `calc(212px + (100cqh - 212px - ${u} * 464) / 2 + ${u} * 135)`,
  },
  /** The stacks' centre: 45u above the frame's (30u in portrait), so their foot stays clear of the edge tabs. */
  stackCentre: {
    default: `calc(140px + (100cqh - 140px - ${u} * 576) / 2 + ${u} * 115)`,
    [bp.portrait]: `calc(212px + (100cqh - 212px - ${u} * 464) / 2 + ${u} * 105)`,
  },
  /** An opponent's card: 100u wide (90u), lying sideways in a slot as wide as the card is tall. */
  stackCard: { default: `calc(${u} * 100)`, [bp.portrait]: `calc(${u} * 90)` },
  stackSlotWidth: { default: `calc(${u} * 140)`, [bp.portrait]: `calc(${u} * 126)` },
  stackSlotHeight: { default: `calc(${u} * 100)`, [bp.portrait]: `calc(${u} * 90)` },
  /** Each sideways card shows 12u (13u) of the one beneath. */
  stackStep: { default: `calc(${u} * -88)`, [bp.portrait]: `calc(${u} * -77)` },
  /** How far a stack runs off the felt's edge: 82u of it shows (46u). */
  stackInset: { default: `calc(${u} * -58)`, [bp.portrait]: `calc(${u} * -80)` },
})
