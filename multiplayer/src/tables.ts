import type { Store } from './store'

// One table at a time (SKATGO-163), kept by the table one goes to (SKATGO-235, the human: 「我要求这种时候如果用户开新桌，自动从所有
// 老桌退场。不要让用户被卡死」): opening a private room, entering one, the League's Play and a League table formed for someone
// who queued take the account out of every other table first, as its own Leave would — never a refusal. A seat
// changes only through its live table (`room.ts`), so its people and connections hear of it.

/** A live table, as `room.ts` registers it: takes an account out, as its Leave does. */
export type LiveTable = { leave: (account: string) => Promise<void> }

const live = new Map<string, LiveTable>()

export function registerTable(id: string, table: LiveTable) {
  live.set(id, table)
}

export function unregisterTable(id: string, table: LiveTable) {
  if (live.get(id) === table) live.delete(id)
}

/** Takes `account` out of every live table that holds a seat for it but `except`. */
export async function leaveOtherTables(store: Store, account: string, except: string | null = null) {
  for (const id of await store.roomsOf(account, except)) {
    await live.get(id)?.leave(account)
  }
}
