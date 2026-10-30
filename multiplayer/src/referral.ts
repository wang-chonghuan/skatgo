import express from 'express'
import { z } from 'zod'
import { ROOM_CODE } from '../../app/src/lib/room-ticket'
import { freeSeat, Rejected, secretEquals } from './model'
import type { Store } from './store'

// The web's questions about rooms (SKATGO-163), behind the admission key: which room an account is in, for "Back to
// room"; what a number is to an account — no room, its own, or one it may come into or that is full — before a join
// ticket is signed for it; and whose room brought an account (SKATGO-117).
//
// Whose room brought an account: a newcomer who signed up to come into a room is recorded as brought by its host. The
// web calls this once the new account sits in the room; it has already checked the account is new. The account's own
// seat in the room proves it — the host's does not count, nor a room without a host. One account is brought once: the
// first room it signs up at keeps it.

const ACCOUNT = /^user:[A-Za-z0-9_]{1,64}$/
const input = z.object({
  account: z.string().regex(ACCOUNT),
  roomId: z.string().regex(ROOM_CODE),
}).strict()

export async function recordReferral(store: Store, account: string, roomId: string, now = Date.now()): Promise<boolean> {
  const s = await store.read(roomId)
  if (!s.seats.some(p => p.account === account)) throw new Rejected('not_a_guest')
  if (!s.host || s.host === account) throw new Rejected('no_host')
  return store.transaction(async c => {
    const { rowCount } = await c.query(
      'INSERT INTO account_referrals (account, referrer, room_id, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (account) DO NOTHING',
      [account, s.host, roomId, now],
    )
    return rowCount === 1
  })
}

/** What a room's number is to `account`: its own room, one it may come into, a full one — or no room. */
export async function roomStatus(store: Store, code: string, account: string): Promise<'member' | 'open' | 'full'> {
  const s = await store.read(code)
  if (s.seats.some(p => p.account === account)) return 'member'
  return freeSeat(s) >= 0 ? 'open' : 'full'
}

/** The routes, behind the admission key. */
export function roomRoutes(store: Store, key: string, ready: () => boolean) {
  const router = express.Router()
  router.use(express.json({ limit: '4kb' }))
  router.use((req, res, nextHandler) => {
    if (!ready()) return void res.status(503).json({ error: 'not_ready' })
    if (!secretEquals(req.get('x-admission-key'), key)) return void res.status(403).json({ error: 'admission_denied' })
    nextHandler()
  })
  router.get('/mine', async (req, res) => {
    const account = String(req.query.account ?? '')
    if (!ACCOUNT.test(account)) return void res.status(400).json({ error: 'invalid_request' })
    try {
      res.set('cache-control', 'no-store').json({ room: await store.roomOf(account) })
    } catch {
      res.status(503).json({ error: 'storage_unavailable' })
    }
  })
  router.get('/:code', async (req, res) => {
    const account = String(req.query.account ?? '')
    if (!ROOM_CODE.test(req.params.code) || !ACCOUNT.test(account)) return void res.status(400).json({ error: 'invalid_request' })
    try {
      const status = await roomStatus(store, req.params.code, account)
      const elsewhere = status === 'member' ? null : await store.roomOf(account, req.params.code)
      res.set('cache-control', 'no-store').json({ status, elsewhere })
    } catch (e) {
      if (e instanceof Rejected) res.status(404).json({ error: 'room_not_found' })
      else res.status(503).json({ error: 'storage_unavailable' })
    }
  })
  router.post('/referral', async (req, res) => {
    try {
      const i = input.parse(req.body)
      res.set('cache-control', 'no-store').json({ recorded: await recordReferral(store, i.account, i.roomId) })
    } catch (e) {
      if (e instanceof z.ZodError) res.status(400).json({ error: 'invalid_request' })
      else if (e instanceof Rejected) res.status(409).json({ error: e.message })
      else {
        console.error('referral_storage_unavailable')
        res.status(503).json({ error: 'storage_unavailable' })
      }
    }
  })
  router.use((_err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(400).json({ error: 'invalid_request' })
  })
  return router
}
