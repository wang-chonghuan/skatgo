import * as stylex from '@stylexjs/stylex'

// Corner radii and component dimensions of the lobby design (SKATGO-26), measured from the reference
// (.intentfold/tickets/SKATGO-26/reference.md) unless marked "derived".

export const radii = stylex.defineVars({
  /** Pills and the app's buttons (40 tall, radius 32 — fully round). */
  pill: '32px',
  /** The public site's buttons. */
  landingBtn: '14px',
  /** Lobby tiles and event cards. */
  tile: '18.18px',
  /** Option cards on a sub-page. */
  option: '19.6px',
  /** Dialogs. */
  dialog: '21.6px',
  /** The side panel's left corners, its tab tiles and its full-width buttons. */
  panel: '12px',
  /** An auction column. */
  column: '8px',
  /** The role tag on a seat plate. */
  tag: '6px',
  /** A playing card. */
  card: '8px',
  cardSm: '6px',
  cardXs: '4px',
  round: '999px',
  /** A language flag in the header (SKATGO-104). */
  flag: '3px',
})

export const dims = stylex.defineVars({
  // Controls and the header's mark
  control: '40px',
  iconButton: '44px',
  badge: '24px',
  /** The front page header's mark (SKATGO-31): the new icon's square carries white margin, so it is shown larger. */
  landingMark: '56px',
  landingMarkPhone: '44px',
  /** A language flag (SKATGO-104): 3:2, a little smaller on a phone so both fit beside "SkatGo.com". */
  flagWidth: '30px',
  flagHeight: '20px',
  flagWidthPhone: '28px',
  flagHeightPhone: '19px',

  // The public site
  /** The front page header (SKATGO-31: 80px, lower than the reference's 100 so the hero starts higher). */
  landingHeader: '80px',
  landingHeaderPhone: '64px',
  landingColumn: '1140px',
  heroArt: '480px',
  /** The white disc on the felt while a table loads, and the logo turning in it (SKATGO-93). */
  tableLoader: '144px',
  tableLoaderMark: '96px',

  // The front page's tiles and hero picture
  tileArtRight: '-18px',
  tileArtBottom: '-38px',

  // Sub-page
  pageColumn: '1287px',
  readingColumn: '860px',
  /** The forum's text boxes (SKATGO-119, the human: 「发帖框高一点」, 「不要给的行太多」): a post's text starts about six
   *  lines tall, a comment about three, and both grow with what is written. A line is the box's own line height
   *  (`lh`); 22px is its padding and border. */
  textPost: 'calc(6lh + 22px)',
  textComment: 'calc(3lh + 22px)',
  /** A table of values on the rules page (SKATGO-29): two columns, a name and a number. */
  rulesTable: '480px',
  /** One row of the printable score sheet: room for a handwritten number, 36 rows and the Seeger-Fabian
   *  block on one A4 page (SKATGO-53, human-approved). */
  scoreRow: '6mm',

  // The settings dialog (SKATGO-27)
  settingsWidth: 'min(420px, calc(100vw - 32px))',

  // The table
  /** The trick in the frame (SKATGO-68): both opponents' cards `trickSideInset` from their side of the
   *  frame (one value, so the two can never differ), never closer than 18px, which clears the seat plate
   *  lying on that edge when the stage makes the frame small (SKATGO-34); the learner's centred. How high
   *  each lies is the stage's (`stage.trickFirst`, `trickSecond`, `trickThird`). */
  trickSideInset: 'max(9%, 18px)',
  /** The words over the frame: as wide as the table allows. */
  tipWidth: 'min(460px, calc(100vw - 32px))',
  /** The action drawer: as wide as the felt allows, sitting just above the learner's hand. */
  drawerWidth: 'min(680px, calc(100% - 24px))',
  drawerHandle: '40px',
  drawerHandleHeight: '4px',
  hintTabWidth: '48px',
  hintTabHeight: '56px',
  panelPhone: 'min(360px, 88vw)',
  panelTab: '28px',
  panelTabHeight: '48px',
  /** On a phone the board hangs from the top edge between the corners' round buttons' room (the assistant's launcher's
   *  until SKATGO-130, the way out's). */
  boardWidthPhone: 'calc(100% - 120px)',
  /** Two rows of two at any width (SKATGO-29). */
  boardColumns: 'repeat(2, minmax(0, 1fr))',
  /** The info board's three running totals, side by side (SKATGO-100). */
  boardTotals: 'repeat(3, minmax(0, 1fr))',
  /** In landscape the board is one row of four (SKATGO-34), so the band at the top stays low. */
  boardColumnsWide: 'repeat(4, minmax(0, auto))',
  boardWidthWide: 'min(640px, calc(100% - 144px))',
  sidePanel: '450px',
  /** The side panel pinned beside the felt on a wide screen (SKATGO-34): about Funbridge's share. */
  sidePanelPinned: 'clamp(280px, 28vw, 400px)',
  /** The table's columns with the panel pinned: the felt takes what the panel leaves. */
  feltAndPanel: 'minmax(0, 1fr) auto',
  /** Room the pinned panel's tab row leaves at its right, where the assistant's launcher was (until SKATGO-130). */
  launcherRoom: '60px',
  /** The side panel's three tabs, in equal columns (SKATGO-75). */
  panelTabs: 'repeat(3, minmax(0, 1fr))',
  /** The panel's rules view: the way back, then the title centred in what is left (SKATGO-75). */
  panelBackRow: 'auto 1fr auto',
  frameBorderPlay: '2px',
  plateHeight: '28px',
  roleTag: '28px',
  /** The tap-to-collect hand (SKATGO-72). */
  tapHand: '48px',
  tabTile: '56px',
  auctionHeight: '207px',
  /** A dialog over the table is not bound by the stacks. */
  dialogWidth: 'min(560px, 100%)',
  /** The table's least height when it sits inside a lesson card. */
  tableEmbedded: '640px',

  // Cards (unchanged geometry of the course's card rows and fans)
  cardXs: '34px',
  cardSm: '52px',
  cardMd: '72px',
  cardMdPhone: '58px',
  cardLg: '96px',
  cardLgPhone: '72px',
  cardAspect: '5 / 7',
  /** The card backs to choose from in the settings (SKATGO-102): as many small cards to a row as fit. */
  backChoices: 'repeat(auto-fill, minmax(52px, 1fr))',
  slotXs: '38px',
  slotSm: '58px',
  slotMd: '80px',
  slotMdPhone: '64px',
  slotLg: '104px',
  slotLgPhone: '78px',
  slotTable: '64px',
  slotTablePhone: '74px',
  slotMin: '22px',
  badgeOffsetTop: '-8px',
  badgeOffsetLeft: '-4px',
  /** The height a drill's trick row keeps while it is still empty. */
  cardSlotRow: '110px',
  fanRowOverlap: '-34px',

  // The round buttons on the table — the way out at the top right — the size the assistant's launcher had (its
  // window and chat are gone, SKATGO-130).
  launcher: '44px',
  /** Room above a dialog on the table for the way-out button over it (SKATGO-100): its top offset, its size and a
   *  gap. */
  scrimTop: '68px',
  scrimTopPhone: '60px',
  /** The felt's cell in the table's grid: the way-out button keeps to it beside a pinned panel (SKATGO-100). */
  feltCell: '1 / 1 / 2 / 2',
  /** The table's menu under its way-out button (SKATGO-96). */
  tableMenu: '240px',

  // Generic
  screen: '100vh',
  screenDynamic: '100dvh',
  /** A visually hidden element (a heading only screen readers and crawlers get): one pixel, clipped away. */
  visuallyHidden: '1px',
  visuallyHiddenClip: 'inset(50%)',
  half: '50%',
  oneColumn: '1fr',
  twoColumns: '1fr 1fr',
  /** The daily table of you against the AI (SKATGO-42, SKATGO-48): the deal's number (wide enough for
   *  "Total" / "Gesamt"), you and the AI in two equal columns, then the difference with the row's
   *  chevron. Every row is its own grid, so the columns line up only if none sizes to its content. */
  vsAiColumns: '3.5em minmax(0, 1fr) minmax(0, 1fr) 5em',
  /** The front page's hero: the headline two thirds, the picture one third (the human, SKATGO-29). */
  contractColumns: 'repeat(6, 1fr)',
  contractColumnsPhone: 'repeat(3, 1fr)',
  /** The contracts in the pinned side panel (SKATGO-34): two by three, the panel is narrow. */
  contractColumnsPanel: 'repeat(2, minmax(0, 1fr))',
  auctionColumns: 'repeat(3, 1fr)',
  /** The narrowest a column of bids gets (SKATGO-29): one bid chip and the column's padding. */
  auctionCell: '56px',
  square: '1 / 1',
  /** Every row of a card grid the height of its tallest card (1fr rows in a grid of no fixed height). */
  equalRows: '1fr',
})
