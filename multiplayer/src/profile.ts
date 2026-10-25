import type { DealSummary } from '../../app/src/lib/skat/tournament'
import { DAILY_DEALS, PLAYER } from '../../app/src/lib/skat/tournament'
import type { ProfileDeal } from '../../app/src/lib/skat/profile'
import type { Store } from './store'

// A player's record of play (SKATGO-128, the human: 「每个用户的打牌档案页面，每天打了几副牌，就按deal算，而且每个deal都要算和ai的
// 差值，做成一个曲线」): every deal they played against the AI on the same cards — the daily tournament's, from its
// entries and its days' benchmarks, and free play's, recorded here when a signed-in player's finished deal is
// reviewed (`/free/review`); both scored by Seeger-Fabian from the player's seat.

/** A finished free deal of a signed-in player, once per game however often its review is asked. */
export async function recordFreeDeal(store: Store, d: { player: string; game: string; day: string; at: number; score: number; ai: number }) {
  await store.pool.query(
    'INSERT INTO play_deals (player, game, day, at, score, ai) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING',
    [d.player, d.game, d.day, d.at, d.score, d.ai])
}

/**
 * Every deal of the player, in the order played: the tournament's (finished entries and the finished deals of
 * today's unfinished one) and free play's. The ids `player_aliases` names as one person count as that person,
 * as on the Elo board. A tournament deal of a day dealt before the AI played it has no AI score.
 */
export async function playProfile(store: Store, who: string): Promise<{ deals: ProfileDeal[] }> {
  const { rows: ids } = await store.pool.query(
    `WITH me AS (SELECT coalesce((SELECT same_as FROM player_aliases WHERE player = $1), $1) AS id)
     SELECT id FROM me UNION SELECT player FROM player_aliases, me WHERE same_as = me.id`, [who])
  const players = ids.map((r) => r.id as string)
  const { rows: entries } = await store.pool.query(
    `SELECT e.day, e.deals, e.created_at, d.deals AS specs FROM daily_entries e
       JOIN daily_deals d ON d.day = e.day AND d.size = e.size
      WHERE e.size = $1 AND e.player = ANY($2) ORDER BY e.created_at`, [DAILY_DEALS, players])
  const deals: (ProfileDeal & { at: number })[] = []
  for (const e of entries) {
    const specs = e.specs as { benchmark?: { summary: DealSummary } }[]
    ;(e.deals as DealSummary[]).forEach((mine, i) => deals.push({
      day: e.day, source: 'daily', at: Number(e.created_at) + i,
      score: mine.scores[PLAYER], ai: specs[i]?.benchmark?.summary.scores[PLAYER] ?? null,
    }))
  }
  const { rows: free } = await store.pool.query('SELECT day, at, score, ai FROM play_deals WHERE player = ANY($1)', [players])
  for (const f of free) deals.push({ day: f.day, source: 'free', at: Number(f.at), score: f.score, ai: f.ai })
  deals.sort((a, b) => a.day.localeCompare(b.day) || a.at - b.at)
  return { deals: deals.map(({ at: _, ...d }) => d) }
}
