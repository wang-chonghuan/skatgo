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
        ALTER TABLE daily_deals ADD COLUMN IF NOT EXISTS computer text NOT NULL DEFAULT 'heuristic';
        -- A day has one tournament per size (SKATGO-77). Everything stored before is the six-deal one;
        -- the default also keeps a previous version's writes right while a deploy overlaps.
        ALTER TABLE daily_deals ADD COLUMN IF NOT EXISTS size integer NOT NULL DEFAULT 6;
        ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS size integer NOT NULL DEFAULT 6;
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
             WHERE i.indrelid = 'daily_deals'::regclass AND i.indisprimary AND a.attname = 'size'
          ) THEN
            ALTER TABLE daily_entries DROP CONSTRAINT daily_entries_day_fkey;
            ALTER TABLE daily_entries DROP CONSTRAINT daily_entries_pkey;
            ALTER TABLE daily_deals DROP CONSTRAINT daily_deals_pkey;
            ALTER TABLE daily_deals ADD PRIMARY KEY (day, size);
            ALTER TABLE daily_entries ADD PRIMARY KEY (day, size, player);
            ALTER TABLE daily_entries ADD FOREIGN KEY (day, size) REFERENCES daily_deals (day, size);
          END IF;
        END $$;
        -- A player's current name (SKATGO-90): the one each newly finished entry goes on its board under.
        -- The names already on entries are never changed (the human's red line); a player who set names
        -- before keeps the last one as their current name.
        CREATE TABLE IF NOT EXISTS daily_players (
          player text PRIMARY KEY, nickname text NOT NULL, created_at bigint NOT NULL
        );
        INSERT INTO daily_players (player, nickname, created_at)
          SELECT DISTINCT ON (player) player, nickname, created_at FROM daily_entries WHERE nickname IS NOT NULL
           ORDER BY player, day DESC, finished_at DESC NULLS LAST
          ON CONFLICT DO NOTHING;
        -- One person under several ids — guest days on other devices, a guest who signed up later — written by
        -- hand (SKATGO-123, the human: 「ju开头那几个人，算一个人……mark也是同一个人」): the tournament's Elo counts
        -- the days of player as those of same_as.
        CREATE TABLE IF NOT EXISTS player_aliases (
          player text PRIMARY KEY, same_as text NOT NULL
        );
        -- The "Sieg sichern" ladder's record per account (SKATGO-109): solved once answered right, and every
        -- wrong answer counted. SKATGO-110 put new puzzles under the same step numbers, so the first table's
        -- records went with the old puzzles (the human: 「原有答题记录可以删除」).
        DROP TABLE IF EXISTS ladder_steps;
        -- Whose private table brought an account (SKATGO-117): a guest who signed up at a table, recorded once.
        CREATE TABLE IF NOT EXISTS account_referrals (
          account text PRIMARY KEY, referrer text NOT NULL, room_id text NOT NULL, created_at bigint NOT NULL
        );
        -- What people write, in each language of the site (SKATGO-124): one row per text and language, keyed by the
        -- text's sha256, so a text is translated once wherever it stands. source_lang is the language it was written
        -- in; text is it in lang, as written when the two are the same.
        CREATE TABLE IF NOT EXISTS translations (
          hash text NOT NULL, lang text NOT NULL, source_lang text NOT NULL, text text NOT NULL, created_at bigint NOT NULL,
          PRIMARY KEY (hash, lang)
        );
        -- The forum (SKATGO-118): posts per section, flat comments, and reports — once per reporter
        -- and thing reported. An author's delete removes the row and what hangs from it.
        CREATE TABLE IF NOT EXISTS forum_posts (
          id bigserial PRIMARY KEY, section text NOT NULL, author text NOT NULL,
          official boolean NOT NULL, title text NOT NULL, body text NOT NULL, indexed boolean NOT NULL DEFAULT false,
          hidden_reason text, created_at bigint NOT NULL, last_activity bigint NOT NULL
        );
        CREATE INDEX IF NOT EXISTS forum_posts_list ON forum_posts (last_activity DESC);
        CREATE INDEX IF NOT EXISTS forum_posts_author ON forum_posts (author, created_at);
        CREATE TABLE IF NOT EXISTS forum_comments (
          id bigserial PRIMARY KEY, post_id bigint NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
          author text NOT NULL, official boolean NOT NULL, body text NOT NULL, hidden_reason text, created_at bigint NOT NULL
        );
        CREATE INDEX IF NOT EXISTS forum_comments_post ON forum_comments (post_id, created_at);
        CREATE INDEX IF NOT EXISTS forum_comments_author ON forum_comments (author, created_at);
        CREATE TABLE IF NOT EXISTS forum_reports (
          id bigserial PRIMARY KEY, post_id bigint NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
          comment_id bigint REFERENCES forum_comments(id) ON DELETE CASCADE, reporter text NOT NULL, reason text,
          created_at bigint NOT NULL, resolved_at bigint
        );
        CREATE UNIQUE INDEX IF NOT EXISTS forum_reports_once ON forum_reports (reporter, post_id, (coalesce(comment_id, 0)));
        -- A signed-in player's finished free deals (SKATGO-128), for their record of play: once per game (its pool, deal
        -- and start), with the day it was played and, in the player's game and in the AI's game of the same deal, the
        -- three seats' Seeger-Fabian scores ([0] the player's), who declared and whether they won.
        CREATE TABLE IF NOT EXISTS play_deals (
          player text NOT NULL, game text NOT NULL, day text NOT NULL, at bigint NOT NULL, mine jsonb NOT NULL,
          ai jsonb NOT NULL, PRIMARY KEY (player, game)
        );
        -- A week's analysis of a player's record of play, written by hand per language (SKATGO-128, the human: 「挑重点，目前
        -- 用户少，可以手动做」): the points that mattered that week and a conclusion, in the forum's marks. Keyed by the
        -- player's id as it stands, the week's Monday and the language.
        CREATE TABLE IF NOT EXISTS profile_notes (
          player text NOT NULL, week text NOT NULL, lang text NOT NULL, body text NOT NULL, created_at bigint NOT NULL,
          PRIMARY KEY (player, week, lang)
        );
        -- A shared deal of the day (SKATGO-132): its code, the day, whose it is, the table's three Seeger-Fabian scores
        -- ([0] the player's) and the player's place among that day's players when shared — the link carries the code, so
        -- no one makes a card say what was not played. One per player and day.
        CREATE TABLE IF NOT EXISTS dod_shares (
          code text PRIMARY KEY, day text NOT NULL, player text NOT NULL, scores jsonb NOT NULL, declarer smallint,
          created_at bigint NOT NULL, UNIQUE (day, player)
        );
        CREATE TABLE IF NOT EXISTS ladder_answers (
          player text NOT NULL, step text NOT NULL, solved_at bigint, misses integer NOT NULL DEFAULT 0,
          updated_at bigint NOT NULL, PRIMARY KEY (player, step)
        );
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
      // A table stored by an earlier version of the snapshot is not restored; it expires like any other.
      "SELECT snapshot FROM multiplayer_rooms WHERE expires_at > $1 AND snapshot->>'schema' = '2' ORDER BY id", [Date.now()],
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
