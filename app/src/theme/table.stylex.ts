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
// Above that stage Lina's and Noah's faces have their own room (SKATGO-147, the human chose it: the table a little
// smaller on a short screen rather than a face over the cards): 131u (113u in portrait), a face above a stack of
// twelve cards, the most a hand ever has. The stage sits where it always sat when the free height above it already
// holds that room, and only moves down when it does not.
// Where the felt has more room than the stage, the frame and the stacks keep to the middle of the free
// height and the hand to the bottom: things only ever move apart.
//
// Both are read where they are used, so `cqw`/`cqh` are the felt's.

export const stageUnit = stylex.defineVars({
  u: {
    default: 'min(0.1cqw, calc((100cqh - 140px) / 707))',
    [bp.portrait]: 'min(0.25cqw, calc((100cqh - 212px) / 577))',
  },
})

const u = stageUnit.u
/** The stage's top under the band: half the free height, or the faces' room when that is more (SKATGO-147). */
const above = {
  default: `max((100cqh - 140px - ${u} * 576) / 2, ${u} * 131)`,
  portrait: `max((100cqh - 212px - ${u} * 464) / 2, ${u} * 113)`,
}

export const stage = stylex.defineVars({
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
  /** The frame's centre down the felt: the band, the stage's top, then 160u (135u). */
  frameCentre: {
    default: `calc(140px + ${above.default} + ${u} * 160)`,
    [bp.portrait]: `calc(212px + ${above.portrait} + ${u} * 135)`,
  },
  /** The stacks' centre: 45u above the frame's (30u in portrait), so their foot stays clear of the edge tabs. */
  stackCentre: {
    default: `calc(140px + ${above.default} + ${u} * 115)`,
    [bp.portrait]: `calc(212px + ${above.portrait} + ${u} * 105)`,
  },
  /** Lina's and Noah's faces (SKATGO-147, the human: 「头像太小了，需要增大」; SKATGO-148: 「头像有点大，应该小点」, 「手机上65吧」): 92u (69u,
   *  65px on a 375px phone); in portrait their top 87.5u above the stage's, 4u clear of a twelve-card stack and at least 25u under the band,
   *  whose line may run past it. */
  face: { default: `calc(${u} * 92)`, [bp.portrait]: `calc(${u} * 69)` },
  // On a wide table the face sits higher, in the felt's corner beside the info board and under the way out (72px), so a
  // hand laid open under it stays clear of it (SKATGO-148, the human: 「头像位置往上面移动一点，这样就不当着亮的牌了」).
  faceTop: {
    default: '72px',
    [bp.portrait]: `calc(212px + ${above.portrait} - ${u} * 87.5)`,
  },
  /** How far a face sits in from the felt's edge, over the part of the stack that shows. */
  faceInset: { default: `calc(${u} * 4)`, [bp.portrait]: `calc(${u} * 4)` },
  /** The table talk beside the speaker's face, level with it (SKATGO-157, the human: 「泡泡要始终从头像的同水平线的位置发出去，
   *  挨着头像」): in from the felt's edge by the face's inset, the face and 8px; no wider than the talk's 220px nor the room
   *  between the faces (the felt's width less a face, its inset and 4u on each side). */
  talkBeside: { default: `calc(${u} * 96 + 8px)`, [bp.portrait]: `calc(${u} * 73 + 8px)` },
  talkMax: { default: `min(220px, calc(100cqw - ${u} * 200))`, [bp.portrait]: `min(220px, calc(100cqw - ${u} * 154))` },
  /** An opponent's card: as big as the learner's and the trick's, 130u wide (96u), only part of it on the felt (SKATGO-148,
   *  the human: 「ai的牌的尺寸应该和玩家的牌的尺寸，桌面的牌的尺寸一样，只不过ai的牌只显示半截而已」), lying sideways in a slot
   *  as wide as the card is tall. */
  stackCard: { default: `calc(${u} * 130)`, [bp.portrait]: `calc(${u} * 96)` },
  stackSlotWidth: { default: `calc(${u} * 182)`, [bp.portrait]: `calc(${u} * 134)` },
  stackSlotHeight: { default: `calc(${u} * 130)`, [bp.portrait]: `calc(${u} * 96)` },
  /** Each sideways card shows 12u (13u) of the one beneath. */
  stackStep: { default: `calc(${u} * -118)`, [bp.portrait]: `calc(${u} * -83)` },
  /** The step between cards laid open when a deal is decided early (SKATGO-65): 32u of each shows (30u
   *  in portrait), so each card reads clearly. */
  stackStepOpen: { default: `calc(${u} * -98)`, [bp.portrait]: `calc(${u} * -66)` },
  /** The trick's steps (SKATGO-68): its cards are as big as the hand's and overlap, so each card to the
   *  right lies one step higher than the one to its left — a step is a little more than a card's corner
   *  index is tall (50u, 37u in portrait: the number and the suit under it take 25% of a 182u / 134u
   *  card) — and every card's top-left number and suit stay in the open whatever was played last. The
   *  three cards, two steps and a card tall (282u, 208u in portrait), sit in the middle of the frame's
   *  height: the top card as far from the frame's top as the bottom card from its bottom (the human),
   *  measured from the frame's middle so its border cannot tip the balance. These are the tops of the
   *  first card (Noah's), the second (the learner's) and the third (Lina's). */
  trickFirst: { default: `calc(50% - ${u} * 141)`, [bp.portrait]: `calc(50% - ${u} * 104)` },
  trickSecond: { default: `calc(50% - ${u} * 91)`, [bp.portrait]: `calc(50% - ${u} * 67)` },
  trickThird: { default: `calc(50% - ${u} * 41)`, [bp.portrait]: `calc(50% - ${u} * 30)` },
  /** How far a stack runs off the felt's edge: half of it shows, 91u (54u in portrait, clear of the seat plate). */
  stackInset: { default: `calc(${u} * -91)`, [bp.portrait]: `calc(${u} * -80)` },
  /** An open endgame's stacks (SKATGO-111, the human: 「左右两家的牌，尺寸要和我的手牌一样大…不一定完整显示，但是要大」):
   *  each card as big as the learner's (`handCard`), lying sideways in a slot as wide as it is tall,
   *  182u (134u in portrait). */
  openStackSlot: { default: `calc(${u} * 182)`, [bp.portrait]: `calc(${u} * 134)` },
  /** 52u of each card shows (46u in portrait): its index and a good part of its face. */
  openStackStep: { default: `calc(${u} * -78)`, [bp.portrait]: `calc(${u} * -50)` },
  /** 146u of a card runs onto the felt (56u in portrait, up to the seat's plate). */
  openStackInset: { default: `calc(${u} * -36)`, [bp.portrait]: `calc(${u} * -78)` },
})
