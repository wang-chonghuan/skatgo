// Re-deal tournament days (SKATGO-42): delete the named days' deals and every entry played on them,
// so the leader deals them anew — with the computer's results — on the next request or hourly round.
// Entries are lost for good: run it only for days the human named.
//
//   DATABASE_URL=… node multiplayer/scripts/redeal-days.mjs 2026-10-03 2026-10-04          (dry run)
//   DATABASE_URL=… node multiplayer/scripts/redeal-days.mjs 2026-10-03 2026-10-04 --yes    (delete)
//
// Prints, per day, each tournament's computer label and how many entries and finished entries it has
// (two tournaments a day, 6 and 12 deals, since SKATGO-77).
import pg from 'pg'

const yes = process.argv.includes('--yes')
const days = process.argv.slice(2).filter((a) => a !== '--yes')
if (!days.length || days.some((d) => !/^\d{4}-\d{2}-\d{2}$/.test(d))) {
  console.error('Usage: redeal-days.mjs YYYY-MM-DD… [--yes]')
  process.exit(2)
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required')
  process.exit(2)
}
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1, connectionTimeoutMillis: 10_000 })
const c = await pool.connect()
try {
  await c.query('BEGIN')
  for (const day of days) {
    const deals = await c.query('SELECT size, computer FROM daily_deals WHERE day = $1 ORDER BY size FOR UPDATE', [day])
    const entries = await c.query(
      'SELECT size, count(*)::int AS n, count(finished_at)::int AS finished FROM daily_entries WHERE day = $1 GROUP BY size', [day])
    const tournaments = deals.rows.map((d) => {
      const e = entries.rows.find((x) => x.size === d.size)
      return { size: d.size, computer: d.computer, n: e?.n ?? 0, finished: e?.finished ?? 0 }
    })
    const before = { day, tournaments }
    if (yes) {
      const e = await c.query('DELETE FROM daily_entries WHERE day = $1', [day])
      const d = await c.query('DELETE FROM daily_deals WHERE day = $1', [day])
      console.log(JSON.stringify({ ...before, deletedEntries: e.rowCount, deletedDeals: d.rowCount }))
    } else {
      console.log(JSON.stringify({ ...before, dryRun: true }))
    }
  }
  await c.query(yes ? 'COMMIT' : 'ROLLBACK')
} catch (e) {
  await c.query('ROLLBACK')
  throw e
} finally {
  c.release()
  await pool.end()
}
