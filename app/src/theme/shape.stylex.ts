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
})

export const dims = stylex.defineVars({
  // Controls and the header's mark
  control: '40px',
  iconButton: '44px',
  badge: '24px',
  /** The front page header's mark (SKATGO-31): the new icon's square carries white margin, so it is shown larger. */
  landingMark: '56px',
  landingMarkPhone: '44px',

  // The public site
  /** The front page header (SKATGO-31: 80px, lower than the reference's 100 so the hero starts higher). */
  landingHeader: '80px',
  landingHeaderPhone: '64px',
  landingColumn: '1140px',
  heroArt: '480px',

  // The front page's tiles and hero picture
  tileArtRight: '-18px',
  tileArtBottom: '-38px',
  /** The hero's picture (app/public/hero-table.webp, the human's illustration, 1448×1086, SKATGO-33): its
   *  box keeps these proportions at every width, so the whole picture shows, never cropped. */
  heroArtRatio: '1448 / 1086',
  tileHeight: '223px',

  // Sub-page
  pageColumn: '1287px',
  readingColumn: '860px',
  /** A table of values on the rules page (SKATGO-29): two columns, a name and a number. */
  rulesTable: '480px',
  /** One row of the printable score sheet: room for a handwritten number, 36 rows and the Seeger-Fabian
   *  block on one A4 page (SKATGO-53, human-approved). */
  scoreRow: '6mm',

  // The settings dialog (SKATGO-27)
  settingsWidth: 'min(420px, calc(100vw - 32px))',

  // The table
  /** The trick in the frame (SKATGO-68): its cards as big as the hand's, overlapping, each toward who
   *  played it. Both opponents' cards `trickEdge` from the frame's top and `trickSideInset` from their
   *  side of the frame (one value, so the two can never differ), never closer than 18px, which clears the
   *  seat plate lying on that edge when the stage makes the frame small (SKATGO-34); the learner's
   *  centred, `trickSideInset` above the bottom edge and its plate. */
  trickEdge: '2%',
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
  /** On a phone the board hangs from the top edge between the assistant's launcher and its mirror space. */
  boardWidthPhone: 'calc(100% - 120px)',
  /** Two rows of two at any width (SKATGO-29). */
  boardColumns: 'repeat(2, minmax(0, 1fr))',
  /** In landscape the board is one row of four (SKATGO-34), so the band at the top stays low. */
  boardColumnsWide: 'repeat(4, minmax(0, auto))',
  boardWidthWide: 'min(640px, calc(100% - 144px))',
  sidePanel: '450px',
  /** The side panel pinned beside the felt on a wide screen (SKATGO-34): about Funbridge's share. */
  sidePanelPinned: 'clamp(280px, 28vw, 400px)',
  /** The table's columns with the panel pinned: the felt takes what the panel leaves. */
  feltAndPanel: 'minmax(0, 1fr) auto',
  /** Room the pinned panel's tab row leaves at its right for the assistant's launcher above it. */
  launcherRoom: '60px',
  frameBorderPlay: '2px',
  plateHeight: '28px',
  roleTag: '28px',
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

  // The assistant (SKATGO-9/11), unchanged geometry.
  launcher: '44px',
  launcherLift: '48px',
  /** On a phone the launcher sits higher, above a lesson's sticky bar. */
  launcherLiftPhone: '80px',
  closeButton: '36px',
  windowWidth: 'min(480px, calc(100vw - 48px))',
  windowHeight: 'min(576px, calc(100dvh - 96px))',
  chatInputWidth: 'calc(100% - 32px)',
  chatBubbleMax: '88%',
  chatLoadingPadding: '10px 1.08em 10px 1.63em',
  chatButton: '36px',
  chatIcon: '18px',
  chatStopIcon: '12px',
  chatStopRadius: '2px',

  // Generic
  screen: '100vh',
  screenDynamic: '100dvh',
  /** The language menu's card (SKATGO-29): its narrowest, and where it opens, just under its button. */
  langMenu: '180px',
  langMenuTop: 'calc(100% + 6px)',
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
  heroColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
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
