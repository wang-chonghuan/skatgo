import type { Store } from './store'

// An account deleted by its owner (SKATGO-185): what SkatGo holds under it goes — its entries on the daily boards, its
// nickname, its record of play, its practice answers, its weeks' notes, its shared results, the referrals it is part of,
// its reports — and so do the games of every device signed in to it (SKATGO-182: they are the account's). Its forum
// posts and comments stay, under no one (the human: 「帖子改匿名」). Private rooms are left to expire as they do.

/** The author of a post or comment whose account was deleted: no player, so no name. */
export const GONE = 'gone'

/** The tables keyed by the player alone. */
const OWN = ['daily_entries', 'daily_players', 'play_deals', 'ladder_answers', 'bidding_answers', 'profile_notes', 'dod_shares']

/**
 * Deletes everything held under the account `who` (`user:<id>`), at once; asking again finds nothing more to delete.
 * The account's person (`player_aliases`) is the account and the devices joined to it. When a hand-written alias makes
 * another account the same person, that account keeps the person and its devices; only this account's own rows go.
 */
export async function forgetPlayer(store: Store, who: string): Promise<{ forgotten: true }> {
  return store.transaction(async (c) => {
    const { rows } = await c.query(
      `WITH me AS (SELECT coalesce((SELECT same_as FROM player_aliases WHERE player = $1), $1) AS id)
       SELECT id FROM me UNION SELECT player FROM player_aliases, me WHERE same_as = me.id`, [who])
    const person = rows.map((r) => r.id as string)
    const root = (await c.query('SELECT same_as FROM player_aliases WHERE player = $1', [who])).rows[0]?.same_as ?? who
    const others = person.filter((id) => id.startsWith('user:') && id !== who)
    const ids = others.length > 0 ? [who] : [...new Set([who, ...person.filter((id) => id.startsWith('anon:'))])]

    for (const table of OWN) await c.query(`DELETE FROM ${table} WHERE player = ANY($1)`, [ids])
    await c.query('DELETE FROM account_referrals WHERE account = ANY($1) OR referrer = ANY($1)', [ids])
    await c.query('DELETE FROM forum_reports WHERE reporter = ANY($1)', [ids])
    await c.query('UPDATE forum_posts SET author = $2 WHERE author = ANY($1)', [ids, GONE])
    await c.query('UPDATE forum_comments SET author = $2 WHERE author = ANY($1)', [ids, GONE])

    if (others.length === 0) {
      await c.query('DELETE FROM player_aliases WHERE player = ANY($1) OR same_as = ANY($1)', [ids])
    } else {
      await c.query('DELETE FROM player_aliases WHERE player = $1', [who])
      // The account was the person everyone else points to: another of its accounts is the person now.
      if (root === who) {
        const next = others[0]
        await c.query('DELETE FROM player_aliases WHERE player = $1', [next])
        await c.query('UPDATE player_aliases SET same_as = $2 WHERE same_as = $1', [who, next])
      }
    }
    return { forgotten: true as const }
  })
}
