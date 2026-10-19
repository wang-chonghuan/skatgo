import express from 'express'
import { z } from 'zod'
import { hash, Rejected, secretEquals } from './model'
import type { Store } from './store'

// Whose table brought an account (SKATGO-117): a guest who sat down at a private table by invitation
// and signed up there is recorded as brought by the table's host. The web service calls this with the
// admission key once the new account exists, naming it and the seat it sat in; it has already checked
// the account is new. The seat proves the account sat at that table as an invited guest — the host's own
// seat does not count, nor does a table without a host account. One account is brought once: the first
// table it signs up at keeps it.

const input = z.object({
  account: z.string().regex(/^user:[A-Za-z0-9_]{1,64}$/),
  roomId: z.string().regex(/^[A-Za-z0-9_-]{1,32}$/),
  seatToken: z.string().regex(/^[a-f0-9]{64}$/),
}).strict()

export async function recordReferral(store: Store, account: string, roomId: string, seatToken: string, now = Date.now()): Promise<boolean> {
  const s = await store.read(roomId)
  const seat = s.seats.findIndex(p => p.tokenHash === hash(seatToken))
  if (seat <= 0) throw new Rejected('not_a_guest')
  if (!s.host || s.host === account) throw new Rejected('no_host')
  return store.transaction(async c => {
    const { rowCount } = await c.query(
      'INSERT INTO account_referrals (account, referrer, room_id, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (account) DO NOTHING',
      [account, s.host, roomId, now],
    )
    return rowCount === 1
  })
}

/** The route, behind the admission key. */
export function referralRoutes(store: Store, key: string, ready: () => boolean) {
  const router = express.Router()
  router.use(express.json({ limit: '4kb' }))
  router.use((req, res, nextHandler) => {
    if (!ready()) return void res.status(503).json({ error: 'not_ready' })
    if (!secretEquals(req.get('x-admission-key'), key)) return void res.status(403).json({ error: 'admission_denied' })
    nextHandler()
  })
  router.post('/referral', async (req, res) => {
    try {
      const i = input.parse(req.body)
      res.set('cache-control', 'no-store').json({ recorded: await recordReferral(store, i.account, i.roomId, i.seatToken) })
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
