// SKATGO-128: loads the weeks' analyses written by hand (notes.json) into profile_notes, each under the player who holds
// the nickname now. Against DATABASE_URL; `--as <nickname>=<player>` puts a nickname's notes under another id too (a
// local test account). Run with multiplayer/'s node_modules on the path (pg).
import { readFileSync } from 'node:fs'
import pg from 'pg'

const notes = JSON.parse(readFileSync(new URL('./notes.json', import.meta.url), 'utf8'))
const extra = process.argv.slice(2).flatMap((a, i, all) => (all[i - 1] === '--as' ? [a.split('=')] : []))
const db = new pg.Client({ connectionString: process.env.DATABASE_URL })
await db.connect()
for (const [nickname, weeks] of Object.entries(notes)) {
  if (nickname === '_') continue
  const { rows } = await db.query('SELECT player FROM daily_players WHERE nickname = $1', [nickname])
  const players = [...rows.map((r) => r.player), ...extra.filter(([n]) => n === nickname).map(([, p]) => p)]
  for (const player of players) for (const [week, langs] of Object.entries(weeks)) for (const [lang, body] of Object.entries(langs)) {
    await db.query(
      `INSERT INTO profile_notes (player, week, lang, body, created_at) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (player, week, lang) DO UPDATE SET body = EXCLUDED.body`, [player, week, lang, body, Date.now()])
  }
  console.log(nickname, players.length, 'player(s),', Object.keys(weeks).length, 'weeks')
}
await db.end()
