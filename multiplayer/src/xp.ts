import { type XpBoard, daysToReset, streakOf, weekStart, xpOf } from '../../app/src/lib/skat/xp'
import type { Store } from './store'

// The week's experience points (SKATGO-172, replacing the tournament's Elo of SKATGO-123): every deal an account
// played against the AI this week — the tournament's and the deal of the day's, from their entries against each day's
// benchmark, and free play's, from `play_deals` — earns XP by its tier (`lib/skat/xp.ts`), summed per person. Ids
// that `player_aliases` names as one person count as that person, under the name they hold now; only accounts are on
// the board. Computed on request from the rows already kept, as the boards are; only names leave here.

/** Every deal of the week from `since`, with the player's Seeger-Fabian score and the AI's on the same cards (null when
 *  the day was dealt before the AI played it). */
const WEEK_DEALS = `
  WITH d AS (
    SELECT e.player, e.day, x.mine, d.deals -> (x.i - 1)::int -> 'benchmark' -> 'summary' AS ai
      FROM daily_entries e JOIN daily_deals d ON d.day = e.day AND d.size = e.size,
           jsonb_array_elements(e.deals) WITH ORDINALITY AS x(mine, i)
     WHERE e.day >= $1
    UNION ALL
    SELECT player, day, mine, ai FROM play_deals WHERE day >= $1
  )
  SELECT coalesce(a.same_as, d.player) AS person, (d.mine -> 'scores' ->> 0)::int AS mine, (d.ai -> 'scores' ->> 0)::int AS ai
    FROM d LEFT JOIN player_aliases a ON a.player = d.player`

/** Every day each person played at least one deal, for the streak. */
const DEAL_DAYS = `
  SELECT DISTINCT coalesce(a.same_as, d.player) AS person, d.day FROM (
    SELECT player, day FROM daily_entries WHERE jsonb_array_length(deals) > 0
    UNION SELECT player, day FROM play_deals
  ) d LEFT JOIN player_aliases a ON a.player = d.player`

/** The week's board on `today` (a tournament day), `who` the asker or null. */
export async function weeklyXp(store: Store, who: string | null, today: string): Promise<XpBoard> {
  const { rows: deals } = await store.pool.query(WEEK_DEALS, [weekStart(today)])
  const xp = new Map<string, number>()
  for (const d of deals) {
    if (!(d.person as string).startsWith('user:')) continue
    xp.set(d.person, (xp.get(d.person) ?? 0) + xpOf(d.ai === null ? null : (d.mine as number) - (d.ai as number)))
  }
  const people = [...xp].sort((a, b) => b[1] - a[1])
  const { rows: dayRows } = await store.pool.query(DEAL_DAYS)
  const days = new Map<string, string[]>()
  for (const r of dayRows) if (xp.has(r.person)) days.set(r.person, [...(days.get(r.person) ?? []), r.day as string])
  const { rows: named } = await store.pool.query(
    `SELECT p AS player, coalesce((SELECT nickname FROM daily_players WHERE player = p),
       (SELECT nickname FROM daily_entries WHERE player = p AND nickname IS NOT NULL ORDER BY day DESC LIMIT 1)) AS nickname
       FROM unnest($1::text[]) AS p`, [people.map(([p]) => p)])
  const nameOf = new Map(named.map((r) => [r.player as string, (r.nickname as string | null) ?? '']))
  const { rows: me } = who
    ? await store.pool.query('SELECT coalesce((SELECT same_as FROM player_aliases WHERE player = $1), $1) AS id', [who])
    : { rows: [] }
  const mine = (me[0]?.id as string | undefined) ?? null
  const rows: XpBoard['rows'] = people.map(([p, n], i) => ({
    rank: i === 0 || people[i - 1][1] !== n ? i + 1 : 0,
    // Everyone on the board played this week, so a flame at least 1 (the human: 「1天的也要显示个火焰，1就行」).
    nickname: nameOf.get(p) ?? '', xp: n, streak: Math.max(1, streakOf(days.get(p) ?? [], today)),
    ...(p === mine ? { you: true as const } : {}),
  }))
  for (let i = 1; i < rows.length; i++) if (rows[i].rank === 0) rows[i].rank = rows[i - 1].rank
  return { rows, resetsIn: daysToReset(today) }
}
