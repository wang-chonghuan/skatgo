import { type Contract } from '../../cards'
import { cards } from './cards-of'
import type { Exercise } from './types'

// The Skat-Tricks exercises SkatZero judges (SKATGO-103): what to bid, put away, choose, lead and play.
// Each position is from a game SkatZero played against itself (the free-play pool, multiplayer/skatzero/
// free-pool.json.gz), with everything played before it, as SkatZero saw it (`judge`). The answer is
// SkatZero's own choice, and multiplayer/test/tricks-exercises.test.ts asks it again and holds the answer to
// beating the next choice by 10 game points. The learner sees the situation and the trick on the table.

const c = (s: string) => cards(s)[0]
const suit = (trump: 'C' | 'S' | 'H' | 'D'): Contract => ({ kind: 'suit', trump })
const GRAND: Contract = { kind: 'grand' }

export const JUDGED: Exercise[] = [
  {
    id: 'reizen-3',
    type: 'reizen',
    trick: 1,
    situation: { role: 'bidder', position: 'middlehand', rows: [{ kind: 'hand', who: 'you', cards: cards('SJ CA C9 C7 HA H10 SK S8 D9 D8') }] },
    ask: { kind: 'choice', options: [{ kind: 'text' }, { kind: 'text' }], answer: 1 },
    proof: { by: 'skatzero', judge: { kind: 'bid', position: 1, bid: 20 } },
  },
  {
    id: 'druecken-1',
    type: 'druecken',
    trick: 3,
    situation: { contract: suit('C'), role: 'declarer', position: 'rearhand', bid: 20, rows: [] },
    ask: { kind: 'pick', cards: cards('CA C10 CK CQ C8 S10 S8 HA DA D10 D9 D7'), correct: cards('S10 S8') },
    proof: { by: 'skatzero', judge: { kind: 'discard', game: 'C', position: 2 } },
  },
  {
    id: 'druecken-2',
    type: 'druecken',
    trick: 3,
    situation: { contract: GRAND, role: 'declarer', position: 'forehand', bid: 23, rows: [] },
    ask: { kind: 'pick', cards: cards('SJ HJ SA SK S8 S7 HK H10 H8 DA D8 CK'), correct: cards('CK H10') },
    proof: { by: 'skatzero', judge: { kind: 'discard', game: 'G', position: 0 } },
  },
  {
    id: 'druecken-3',
    type: 'druecken',
    trick: 3,
    situation: { contract: suit('S'), role: 'declarer', position: 'forehand', bid: 18, rows: [] },
    ask: { kind: 'pick', cards: cards('SJ HJ S10 SK S9 CA CK HK H10 H8 D10 DQ'), correct: cards('D10 DQ') },
    proof: { by: 'skatzero', judge: { kind: 'discard', game: 'S', position: 0 } },
  },
  {
    id: 'spielwahl-1',
    type: 'spielwahl',
    situation: { role: 'declarer', position: 'forehand', bid: 18, rows: [{ kind: 'hand12', cards: cards('CJ DJ CA SA S10 SQ S7 HA H10 HQ DA DQ') }] },
    ask: { kind: 'choice', options: [{ kind: 'game', game: 'G' }, { kind: 'game', game: 'S' }, { kind: 'game', game: 'H' }, { kind: 'game', game: 'D' }], answer: 0 },
    proof: { by: 'skatzero', judge: { kind: 'game', position: 0, bid: 18 } },
  },
  {
    id: 'spielwahl-2',
    type: 'spielwahl',
    trick: 1,
    situation: { role: 'declarer', position: 'rearhand', bid: 18, rows: [{ kind: 'hand12', cards: cards('CJ SJ H10 HQ H8 H7 SA SK S7 DA D8 C8') }] },
    ask: { kind: 'choice', options: [{ kind: 'game', game: 'H' }, { kind: 'game', game: 'S' }, { kind: 'game', game: 'G' }, { kind: 'game', game: 'N' }], answer: 0 },
    proof: { by: 'skatzero', judge: { kind: 'game', position: 2, bid: 18 } },
  },
  {
    id: 'spielwahl-3',
    type: 'spielwahl',
    situation: { role: 'declarer', position: 'rearhand', bid: 27, rows: [{ kind: 'hand12', cards: cards('DJ CA S8 S7 H10 H9 H8 H7 DA DQ D8 D7') }] },
    ask: { kind: 'choice', options: [{ kind: 'game', game: 'H' }, { kind: 'game', game: 'D' }, { kind: 'game', game: 'N' }, { kind: 'game', game: 'NO' }], answer: 3 },
    proof: { by: 'skatzero', judge: { kind: 'game', position: 2, bid: 27 } },
  },
  {
    id: 'anspielen-1',
    type: 'anspielen',
    trick: 8,
    situation: { contract: GRAND, hand: true, trickNo: 5, role: 'defender', position: 'rearhand', declarer: 'forehand', rows: [] },
    ask: { kind: 'play', contract: GRAND, hand: cards('CK SA S8 C8 D10 D8'), trick: [], best: cards('SA') },
    proof: { by: 'skatzero', judge: { kind: 'card', me: 2, trace: [[0, c('CJ')], [1, c('C9')], [2, c('HJ')], [0, c('HK')], [1, c('CQ')], [2, c('H10')], [2, c('HA')], [0, c('H8')], [1, c('S10')], [2, c('SJ')], [0, c('DJ')], [1, c('SK')]], skat: [], points: [4, 46], handGame: true } },
  }, // deal 195 trick 5: [['SA', 53.9], ['S8', 18.1], ['CK', 12.2], ['C8', 10.7]]
  {
    id: 'anspielen-2',
    type: 'anspielen',
    trick: 8,
    situation: { contract: GRAND, hand: true, trickNo: 4, role: 'defender', position: 'rearhand', declarer: 'forehand', rows: [] },
    ask: { kind: 'play', contract: GRAND, hand: cards('CQ D9 S7 S9 SK HA CA'), trick: [], best: cards('CA') },
    proof: { by: 'skatzero', judge: { kind: 'card', me: 2, trace: [[0, c('H7')], [1, c('C10')], [2, c('H9')], [2, c('DQ')], [0, c('H8')], [1, c('DA')], [1, c('D8')], [2, c('D10')], [0, c('HK')]], skat: [], points: [0, 38], handGame: true } },
  }, // deal 882 trick 4: [['CA', 1], ['SK', -16.3], ['S7', -16.4], ['HA', -16.7]]
  {
    id: 'anspielen-3',
    type: 'anspielen',
    trick: 8,
    situation: { contract: GRAND, hand: true, trickNo: 6, role: 'defender', position: 'forehand', declarer: 'rearhand', rows: [] },
    ask: { kind: 'play', contract: GRAND, hand: cards('HA H8 D8 S9 HQ'), trick: [], best: cards('HA') },
    proof: { by: 'skatzero', judge: { kind: 'card', me: 1, trace: [[1, c('SK')], [2, c('S8')], [0, c('SA')], [0, c('CJ')], [1, c('HJ')], [2, c('D7')], [0, c('C10')], [1, c('D9')], [2, c('C8')], [0, c('S7')], [1, c('S10')], [2, c('D10')], [1, c('SJ')], [2, c('H10')], [0, c('DJ')]], skat: [], points: [29, 34], handGame: true } },
  }, // deal 531 trick 6: [['HA', 40.9], ['HQ', 24.1], ['H8', 15.7], ['D8', 12.1]]
  {
    id: 'schmieren-1',
    type: 'schmieren',
    trick: 11,
    situation: { contract: suit('C'), hand: false, trickNo: 7, role: 'defender', position: 'middlehand', declarer: 'rearhand', rows: [] },
    ask: { kind: 'play', contract: suit('C'), hand: cards('D8 SQ S10 S8'), trick: [{ who: 'declarer', card: c('C8') }, { who: 'partner', card: c('SJ') }], best: cards('S10') },
    proof: { by: 'skatzero', judge: { kind: 'card', me: 2, trace: [[1, c('DQ')], [2, c('D9')], [0, c('D7')], [1, c('H7')], [2, c('HA')], [0, c('S9')], [2, c('D10')], [0, c('DA')], [1, c('C10')], [1, c('H10')], [2, c('H9')], [0, c('HJ')], [0, c('C7')], [1, c('DJ')], [2, c('CJ')], [2, c('DK')], [0, c('C9')], [1, c('H8')], [0, c('C8')], [1, c('SJ')]], skat: [], points: [16, 49], handGame: false } },
  }, // deal 197 trick 7: [['S10', 33.1], ['SQ', -16.8], ['S8', -17.2], ['D8', -17.2]]
  {
    id: 'schmieren-2',
    type: 'schmieren',
    trick: 11,
    situation: { contract: suit('C'), hand: false, trickNo: 7, role: 'defender', position: 'middlehand', declarer: 'forehand', rows: [] },
    ask: { kind: 'play', contract: suit('C'), hand: cards('DQ H9 DA D8'), trick: [{ who: 'partner', card: c('SK') }, { who: 'declarer', card: c('SQ') }], best: cards('DA') },
    proof: { by: 'skatzero', judge: { kind: 'card', me: 1, trace: [[0, c('CJ')], [1, c('DJ')], [2, c('C8')], [0, c('HJ')], [1, c('C10')], [2, c('SJ')], [2, c('D10')], [0, c('CA')], [1, c('D7')], [0, c('S8')], [1, c('S9')], [2, c('S7')], [1, c('HA')], [2, c('HQ')], [0, c('C7')], [0, c('S10')], [1, c('H10')], [2, c('SA')], [2, c('SK')], [0, c('SQ')]], skat: [], points: [39, 45], handGame: false } },
  }, // deal 777 trick 7: [['DA', 33.6], ['H9', -18.1], ['D8', -18.3], ['DQ', -18.5]]
  {
    id: 'schmieren-3',
    type: 'schmieren',
    trick: 11,
    situation: { contract: GRAND, hand: false, trickNo: 8, role: 'defender', position: 'middlehand', declarer: 'forehand', rows: [] },
    ask: { kind: 'play', contract: GRAND, hand: cards('CQ SK C10'), trick: [{ who: 'partner', card: c('DA') }, { who: 'declarer', card: c('D8') }], best: cards('C10') },
    proof: { by: 'skatzero', judge: { kind: 'card', me: 1, trace: [[0, c('CJ')], [1, c('C7')], [2, c('HJ')], [0, c('HA')], [1, c('H7')], [2, c('H8')], [0, c('H10')], [1, c('HQ')], [2, c('S7')], [0, c('HK')], [1, c('S8')], [2, c('S9')], [0, c('H9')], [1, c('SQ')], [2, c('D7')], [0, c('SA')], [1, c('S10')], [2, c('SJ')], [2, c('D10')], [0, c('D9')], [1, c('CA')], [2, c('DA')], [0, c('D8')]], skat: [], points: [35, 44], handGame: false } },
  }, // deal 928 trick 8: [['C10', 45.5], ['CQ', 30.3], ['SK', 16.5]]
  {
    id: 'ausspielen-1',
    type: 'ausspielen',
    trick: 4,
    situation: { contract: GRAND, hand: false, trickNo: 1, role: 'declarer', position: 'forehand', rows: [{ kind: 'skat', cards: cards('DK D8') }] },
    ask: { kind: 'play', contract: GRAND, hand: cards('CA SA S7 CK CJ C8 HJ S9 S8 SK'), trick: [], best: cards('CJ') },
    proof: { by: 'skatzero', judge: { kind: 'card', me: 0, trace: [], skat: cards('DK D8'), points: [4, 0], handGame: false } },
  }, // deal 200 trick 1: [['CJ', 85.2], ['SA', 53.9], ['CA', 51.8], ['HJ', 43.5]]
  {
    id: 'ausspielen-2',
    type: 'ausspielen',
    trick: 4,
    situation: { contract: GRAND, hand: false, trickNo: 1, role: 'declarer', position: 'forehand', rows: [{ kind: 'skat', cards: cards('D10 SK') }] },
    ask: { kind: 'play', contract: GRAND, hand: cards('D9 HK H9 S7 H10 DJ CJ HA C8 C10'), trick: [], best: cards('CJ') },
    proof: { by: 'skatzero', judge: { kind: 'card', me: 0, trace: [], skat: cards('D10 SK'), points: [14, 0], handGame: false } },
  }, // deal 908 trick 1: [['CJ', 45.3], ['DJ', 19.8], ['S7', 19.5], ['C8', 19.1]]
  {
    id: 'ausspielen-3',
    type: 'ausspielen',
    trick: 4,
    situation: { contract: suit('C'), hand: false, trickNo: 1, role: 'declarer', position: 'forehand', rows: [{ kind: 'skat', cards: cards('S10 D9') }] },
    ask: { kind: 'play', contract: suit('C'), hand: cards('DJ HK D8 HA C10 SJ HJ CK H7 H8'), trick: [], best: cards('SJ DJ HJ') },
    proof: { by: 'skatzero', judge: { kind: 'card', me: 0, trace: [], skat: cards('S10 D9'), points: [10, 0], handGame: false } },
  }, // deal 172 trick 1: [['SJ', 29], ['DJ', 26.9], ['HJ', 26.7], ['CK', 11.4]]
]
