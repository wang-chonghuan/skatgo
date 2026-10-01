import pg from 'pg'
import { assertLive, Rejected, type Snapshot } from './model'

const LOCK = 7392020
export class Store {
  pool: pg.Pool
  private leader?: pg.PoolClient
  epoch = 0
  constructor(url: string) {
    this.pool = new pg.Pool({
      connectionString: url, max: 8, connectionTimeoutMillis: 5000,
      query_timeout: 10_000, application_name: 'skatgo-multiplayer',
    })
    this.pool.on('error', () => console.error('database_pool_error'))
  }
  async migrate() {
    const c = await this.pool.connect()
    try {
      await c.query('BEGIN')
      await c.query('SELECT pg_advisory_xact_lock($1)', [LOCK + 1])
      await c.query(`
        CREATE TABLE IF NOT EXISTS multiplayer_leader (
          id integer PRIMARY KEY CHECK (id = 1), epoch integer NOT NULL
        );
        INSERT INTO multiplayer_leader VALUES (1, 0) ON CONFLICT DO NOTHING;
        CREATE TABLE IF NOT EXISTS multiplayer_rooms (
          id text PRIMARY KEY, snapshot jsonb NOT NULL, expires_at bigint NOT NULL
        );
        CREATE TABLE IF NOT EXISTS multiplayer_commands (
          room_id text NOT NULL REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
          seat integer NOT NULL, id text NOT NULL, fingerprint text NOT NULL,
          receipt jsonb NOT NULL, PRIMARY KEY (room_id, seat, id)
        );
        CREATE INDEX IF NOT EXISTS multiplayer_rooms_expiry ON multiplayer_rooms(expires_at);
        CREATE TABLE IF NOT EXISTS daily_deals (
          day text PRIMARY KEY, deals jsonb NOT NULL
        );
        CREATE TABLE IF NOT EXISTS daily_entries (
          day text NOT NULL REFERENCES daily_deals(day), player text NOT NULL,
          actions jsonb NOT NULL, deals jsonb NOT NULL, total integer NOT NULL,
          created_at bigint NOT NULL, finished_at bigint, PRIMARY KEY (day, player)
        );
        ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS nickname text;
      `)
      await c.query('COMMIT')
    } catch (e) {
      await c.query('ROLLBACK')
      throw e
    } finally { c.release() }
  }
  async acquire(onLost: () => void) {
    if (this.leader) return true
    const c = await this.pool.connect()
    const { rows } = await c.query('SELECT pg_try_advisory_lock($1) AS locked', [LOCK])
    if (!rows[0].locked) { c.release(); return false }
    this.leader = c
    c.on('error', onLost)
    const result = await c.query('UPDATE multiplayer_leader SET epoch = epoch + 1 WHERE id = 1 RETURNING epoch')
    this.epoch = result.rows[0].epoch
    return true
  }
  async transaction<T>(run: (c: pg.PoolClient) => Promise<T>): Promise<T> {
    if (!this.leader) throw new Rejected('not_ready')
    const c = await this.pool.connect()
    try {
      await c.query('BEGIN')
      const { rows } = await c.query('SELECT epoch FROM multiplayer_leader WHERE id = 1 FOR SHARE')
      if (rows[0].epoch !== this.epoch) throw new Rejected('stale_process')
      const value = await run(c)
      await c.query('COMMIT')
      return value
    } catch (e) {
      await c.query('ROLLBACK')
      throw e
    } finally { c.release() }
  }
  async create(s: Snapshot) {
    await this.transaction(async c => {
      await c.query('SELECT pg_advisory_xact_lock($1)', [LOCK + 2])
      await c.query('DELETE FROM multiplayer_rooms WHERE expires_at <= $1', [Date.now()])
      const count = await c.query('SELECT count(*)::int AS count FROM multiplayer_rooms')
      if (count.rows[0].count >= 128) throw new Rejected('room_capacity')
      await c.query('INSERT INTO multiplayer_rooms VALUES ($1, $2, $3)', [s.id, s, s.expiresAt])
    })
  }
  async read(id: string): Promise<Snapshot> {
    const { rows } = await this.pool.query('SELECT snapshot FROM multiplayer_rooms WHERE id = $1', [id])
    if (!rows[0]) throw new Rejected('room_not_found')
    assertLive(rows[0].snapshot)
    return rows[0].snapshot
  }
  async all(): Promise<Snapshot[]> {
    const { rows } = await this.pool.query(
      'SELECT snapshot FROM multiplayer_rooms WHERE expires_at > $1 ORDER BY id', [Date.now()],
    )
    return rows.map(r => r.snapshot)
  }
  async change<T>(id: string, run: (s: Snapshot, c: pg.PoolClient) => Promise<{ changed: boolean; value: T }> | { changed: boolean; value: T }) {
    return this.transaction(async c => {
      const { rows } = await c.query('SELECT snapshot FROM multiplayer_rooms WHERE id = $1 FOR UPDATE', [id])
      if (!rows[0]) throw new Rejected('room_not_found')
      const s = rows[0].snapshot as Snapshot
      assertLive(s)
      const result = await run(s, c)
      if (result.changed) {
        s.revision++
        await c.query('UPDATE multiplayer_rooms SET snapshot=$2, expires_at=$3 WHERE id=$1', [id, s, s.expiresAt])
      }
      return { snapshot: s, value: result.value }
    })
  }
  async remove(id: string) {
    await this.transaction(c => c.query('DELETE FROM multiplayer_rooms WHERE id=$1 AND expires_at <= $2', [id, Date.now()]))
  }
  async close() {
    if (this.leader) {
      await this.leader.query('SELECT pg_advisory_unlock($1)', [LOCK])
      this.leader.release()
      this.leader = undefined
    }
    await this.pool.end()
  }
}
