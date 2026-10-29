// The bidding cheat sheet (SKATGO-151, the human: 「这个要做成一个卡片弹窗放在叫牌页面……名字叫叫牌秘籍之类的」, then 「你必须覆盖
// 刚才书上原文所有的点，还要写的更好更易懂，但是不能啰嗦和重复」, 「你还没说null呢」): the order a bidder thinks in, the rules of
// thumb and the point count the Skat books teach, Grand's count, how high to bid, the seat, and Null — in SkatGo's own
// words, no book's passages. Text per language (cheat-sheet.{en,de}.ts); `**bold**` as everywhere (Rich).

export type CheatSection = {
  heading: string
  /** Lines before the table, each a paragraph or (list) a bullet. */
  text?: string[]
  list?: string[]
  /** Label and points, one row each. */
  table?: { head: [string, string]; rows: [string, string][] }
  /** Lines after the table. */
  after?: string[]
  afterList?: string[]
}

export type CheatSheet = { title: string; sections: CheatSection[] }
