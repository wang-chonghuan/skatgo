import { type Played, recordOf } from '../../app/src/lib/skat/profile'
import { type XpBoard, xpOf } from '../../app/src/lib/skat/xp'
import type { Store } from './store'

// The experience points (SKATGO-172, replacing the tournament's Elo of SKATGO-123): every deal an account ever
// played against the AI — since SKATGO-179 not only this week's, and never starting again (the human: 「把weekly去掉，不要每周
// 刷新一次」) — the tournament's and the deal of the day's, from their entries against each day's
// benchmark, and free play's, from `play_deals` — earns XP by its tier (`lib/skat/xp.ts`), summed per person, beside
// the person's win rate over the same deals (SKATGO-178, where days in a row stood: 「不连续登录了有内疚感。可以把胜率放上去」). Ids
// that `player_aliases` names as one person count as that person, under the name they hold now; only accounts are on
// the board. Computed on request from the rows already kept, as the boards are; only names leave here.

/** Every deal, with the player's Seeger-Fabian score and the AI's on the same cards (null when
 *  the day was dealt before the AI played it), and the player's game for the win rate: who declared and whether they won. */
const ALL_DEALS = `
  WITH d AS (
    SELECT e.player, e.day, x.mine, d.deals -> (x.i - 1)::int -> 'benchmark' -> 'summary' AS ai
      FROM daily_entries e JOIN daily_deals d ON d.day = e.day AND d.size = e.size,
           jsonb_array_elements(e.deals) WITH ORDINALITY AS x(mine, i)
    UNION ALL
    SELECT player, day, mine, ai FROM play_deals
  )
  SELECT coalesce(a.same_as, d.player) AS person, (d.mine -> 'scores' ->> 0)::int AS mine, (d.ai -> 'scores' ->> 0)::int AS ai,
         (d.mine ->> 'declarer') = '0' AS declared, d.mine -> 'scores' AS scores, (d.mine ->> 'declarer')::int AS declarer,
         (d.mine ->> 'won')::boolean AS won
    FROM d LEFT JOIN player_aliases a ON a.player = d.player`

/** The board, `who` the asker or null. */
export async function xpBoard(store: Store, who: string | null): Promise<XpBoard> {
  const { rows: deals } = await store.pool.query(ALL_DEALS)
  const xp = new Map<string, number>()
  const games = new Map<string, Played[]>()
  for (const d of deals) {
    if (!(d.person as string).startsWith('user:')) continue
    xp.set(d.person, (xp.get(d.person) ?? 0) + xpOf(d.ai === null ? null : (d.mine as number) - (d.ai as number), d.declared === true))
    games.set(d.person, [...(games.get(d.person) ?? []), { scores: d.scores, declarer: d.declarer, won: d.won }])
  }
  const people = [...xp].sort((a, b) => b[1] - a[1])
  const { rows: named } = await store.pool.query(
    `SELECT p AS player, coalesce((SELECT nickname FROM daily_players WHERE player = p),
       (SELECT nickname FROM daily_entries WHERE player = p AND nickname IS NOT NULL ORDER BY day DESC LIMIT 1)) AS nickname
       FROM unnest($1::text[]) AS p`, [people.map(([p]) => p)])
  const nameOf = new Map(named.map((r) => [r.player as string, (r.nickname as string | null) ?? '']))
  const { rows: me } = who
    ? await store.pool.query('SELECT coalesce((SELECT same_as FROM player_aliases WHERE player = $1), $1) AS id', [who])
    : { rows: [] }
  const mine = (me[0]?.id as string | undefined) ?? null
  const rows: XpBoard['rows'] = people.map(([p, n], i) => {
    const r = recordOf(games.get(p) ?? [])
    return {
      rank: i === 0 || people[i - 1][1] !== n ? i + 1 : 0,
      nickname: nameOf.get(p) ?? '', xp: n, winRate: r.played ? Math.round((100 * r.won) / r.played) : null,
      ...(p === mine ? { you: true as const } : {}),
    }
  })
  for (let i = 1; i < rows.length; i++) if (rows[i].rank === 0) rows[i].rank = rows[i - 1].rank
  return { rows }
}
