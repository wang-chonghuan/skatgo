/** A private room's number (SKATGO-163): six digits, never starting with 0. Shared by the browser, the web's handler
 *  and the multiplayer service. */
export const ROOM_CODE = /^[1-9][0-9]{5}$/
/** How many digits a room's number has. */
export const ROOM_DIGITS = 6
