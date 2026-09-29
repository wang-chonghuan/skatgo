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
  // The app frame
  rail: '120px',
  railItem: '105px',
  railItemHeight: '85px',
  railIcon: '28px',
  topBar: '96px',
  topBarPhone: '64px',
  tabBar: '64px',
  control: '40px',
  iconButton: '44px',
  badge: '24px',
  brandMark: '40px',

  // The public site
  landingHeader: '100px',
  landingHeaderPhone: '64px',
  landingColumn: '1140px',
  heroArt: '480px',

  // Lobby
  tileArtRight: '-18px',
  tileArtBottom: '-38px',
  heroArtHeight: '420px',
  heroArtHeightPhone: '260px',
  tileHeight: '223px',
  tileIcon: '48px',
  lobbyColumn: '1280px',
  eventCard: '302px',

  // Sub-page
  band: '160px',
  bandPhone: '112px',
  optionIcon: '40px',
  arrowDisc: '48px',
  pageColumn: '1287px',
  readingColumn: '860px',

  // The table
  /** The trick in the frame: each card 26% of the frame's width; both opponents' cards level at 27%
   *  from the top and the same distance from their side of the frame (one value, so the two can never
   *  differ); the learner's at 52% from the top and centred (37% = 50% less half of 26%). */
  trickCard: '26%',
  trickSideTop: '27%',
  trickSideInset: '9%',
  trickMineTop: '52%',
  trickMineLeft: '37%',
  /** The words over the frame: as wide as the table allows. */
  tipWidth: 'min(460px, calc(100vw - 32px))',
  /** The action drawer: as wide as the felt allows, sitting just above the learner's hand. */
  drawerWidth: 'min(680px, calc(100% - 24px))',
  drawerBottom: '196px',
  drawerBottomPhone: '146px',
  drawerMaxHeight: 'calc(100% - 220px)',
  drawerMaxHeightPhone: 'calc(100% - 160px)',
  drawerHandle: '40px',
  drawerHandleHeight: '4px',
  /** Every hand — the learner's and both opponents' — uses the same card (SKATGO-26): 120 wide on a
   *  desk, 88 on a phone. An opponent's card lies sideways, so its slot is the card turned. */
  sideSlotWidth: '168px',
  sideSlotHeight: '120px',
  sideSlotWidthPhone: '123px',
  sideSlotHeightPhone: '88px',
  /** Stacked down an edge, each sideways card shows 31px (16 on a phone) of the one beneath. */
  sideStep: '-89px',
  sideStepPhone: '-72px',
  /** How far a stack runs off the felt's edge: only part of it shows. */
  sideInset: '-56px',
  sideInsetPhone: '-83px',
  /** Where the frame's centre sits down the felt. */
  frameTop: '50%',
  frameTopPhone: '50%',
  hintTabWidth: '48px',
  hintTabHeight: '56px',
  hintTabBottom: '22%',
  panelPhone: 'min(360px, 88vw)',
  panelTab: '36px',
  panelTabHeight: '64px',
  panelTabOffset: '-36px',
  plateVertical: 'auto',
  /** The info board across the top of the felt, clear of the way back and the assistant. */
  boardWidth: 'min(640px, calc(100% - 240px))',
  boardWidthPhone: 'calc(100% - 16px)',
  boardTopPhone: '64px',
  boardColumns: 'repeat(4, auto)',
  boardColumnsPhone: 'repeat(2, minmax(0, 1fr))',
  /** Where an opponent's last word in Reizen shows: just inside their stack. */
  saidLeft: '124px',
  saidLeftPhone: '52px',
  sidePanel: '450px',
  frameBid: '403px',
  framePlay: '306px',
  framePhone: '240px',
  frameBorderBid: '3px',
  frameBorderPlay: '2px',
  plate: '180px',
  plateHeight: '28px',
  roleTag: '28px',
  undoWidth: '60px',
  undoHeight: '70px',
  tabTile: '56px',
  auctionColumn: '65px',
  auctionHeight: '207px',
  sheetCollapsed: '56px',
  /** How far the phone's bottom sheet may open. */
  sheetMax: '70dvh',
  /** The felt's three columns: an opponent's stack, the centre, the other opponent's stack. */
  feltColumns: '180px minmax(0, 1fr) 180px',
  feltColumnsPhone: '64px minmax(0, 1fr) 64px',
  /** The frame while it holds the action box (Reizen, the skat, the contract picker). */
  frameAction: 'min(460px, calc(100% - 240px))',
  /** A dialog over the table is not bound by the stacks. */
  dialogWidth: 'min(560px, 100%)',
  plateWidth: '180px',
  plateWidthPhone: 'auto',
  /** Where the action box starts in the frame: below the skat pile. */
  actionOffset: '104px',
  /** Face-down cards stacked down an edge overlap by all but a sliver. */
  backOverlap: '-58px',
  backOverlapPhone: '-40px',
  /** The table's least height when it sits inside a lesson card. */
  tableEmbedded: '640px',
  /** Half a table card, to centre the learner's played card in the frame. */
  trickHalf: '-36px',

  // Cards (unchanged geometry of the course's card rows and fans)
  cardXs: '34px',
  cardSm: '52px',
  cardMd: '72px',
  cardMdPhone: '58px',
  cardLg: '96px',
  cardLgPhone: '72px',
  cardTable: '120px',
  cardTablePhone: '88px',
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
  backSlot: '14px',
  backSlotMin: '6px',
  backsTail: '72px',

  // The assistant (SKATGO-9/11), unchanged geometry.
  launcher: '56px',
  launcherLift: '48px',
  /** On a phone the launcher clears the 64px tab bar and the table's collapsed sheet. */
  launcherLiftPhone: '80px',
  /** At the table the launcher and its window sit left of the 450-wide side panel. */
  launcherRightTable: '474px',
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
  half: '50%',
  oneColumn: '1fr',
  twoColumns: '1fr 1fr',
  lobbyColumns: '1fr 1fr 2fr',
  heroColumns: '1.1fr 1fr',
  contractColumns: 'repeat(6, 1fr)',
  contractColumnsPhone: 'repeat(3, 1fr)',
  auctionColumns: 'repeat(3, 1fr)',
  tabColumns: 'repeat(5, 1fr)',
  /** Free play: the felt, then the 450-wide side panel. */
  tableColumns: 'minmax(0, 1fr) 450px',
  /** The felt's rows: the seats and the frame, then the learner's hand. */
  feltRows: 'minmax(0, 1fr) auto',
  square: '1 / 1',
  column2: '2',
  column3: '3',
  row2: '2',
  lobbyTiles: 'repeat(2, minmax(0, 1fr))',
  threeColumns: 'repeat(3, minmax(0, 1fr))',
  fullRow: '1 / -1',
})
