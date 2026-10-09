// SKATGO-62: every daily tournament record — all days' deals and all entries — listed, and with --yes
// deleted in one transaction (the human, 2026-10-09: existing records may go). Runs where DATABASE_URL
// points; in production as a Render one-off job in the multiplayer service, whose image has pg.
const pg = require('pg')
;(async () => {
  const yes = process.argv.includes('--yes')
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1, connectionTimeoutMillis: 10000 })
  const c = await pool.connect()
  try {
    await c.query('BEGIN')
    const days = await c.query('SELECT day, jsonb_array_length(deals) AS deals FROM daily_deals ORDER BY day')
    const entries = await c.query('SELECT day, count(*)::int AS entries, count(finished_at)::int AS finished FROM daily_entries GROUP BY day ORDER BY day')
    console.log(JSON.stringify({ days: days.rows, entries: entries.rows }))
    if (yes) {
      const e = await c.query('DELETE FROM daily_entries')
      const d = await c.query('DELETE FROM daily_deals')
      console.log(JSON.stringify({ deletedEntries: e.rowCount, deletedDays: d.rowCount }))
    }
    await c.query(yes ? 'COMMIT' : 'ROLLBACK')
  } catch (err) {
    await c.query('ROLLBACK')
    throw err
  } finally {
    c.release()
    await pool.end()
  }
})()
