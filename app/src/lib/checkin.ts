// The League's daily check-in (SKATGO-204, the human: 「签到了才能领取这100个金币吧，不打开游戏就不给，打开了就能积累」): a signed-in
// account opening SkatGo — once per page load, from the frame — asks /api/league/checkin, and the service gives the day's
// coins if this is the account's first open on that Berlin day. Nothing shows it here; the League page waits for it before
// it reads the coins. Kept apart from lib/league-api.ts, so every page's frame does not carry the table's client.

import { useEffect } from 'react'

import { jsonHeaders } from './session-token'
import { useAccount } from './use-account'

const asked = new Map<string, Promise<void>>()

/** The check-in for this account on this page load, asked once whoever asks first; it settles either way. */
export function checkInOnce(account: string): Promise<void> {
  let done = asked.get(account)
  if (!done) {
    done = jsonHeaders()
      .then((headers) => fetch('/api/league/checkin', { method: 'POST', headers, body: '{}' }))
      .then(() => {}, () => {})
    asked.set(account, done)
  }
  return done
}

/** The frame's check-in: a signed-in account's open of the site. */
export function useCheckIn() {
  const account = useAccount()
  useEffect(() => {
    if (account) void checkInOnce(account)
  }, [account])
}
