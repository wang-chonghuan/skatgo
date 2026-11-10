import { deal } from '../../app/src/lib/skat/game'
import type { Card } from '../../app/src/lib/skat/cards'
import type { DealSummary } from '../../app/src/lib/skat/tournament'
import { card } from './computers'
import type { Played, ProfileDeal, ProfileNote } from '../../app/src/lib/skat/profile'
import type { Store } from './store'

// A player's record of play (SKATGO-128, the human: 「每个用户的打牌档案页面，每天打了几副牌，就按deal算，而且每个deal都要算和ai的
// 差值，做成一个曲线」): every deal they played against the AI on the same cards — the daily tournament's, from its
// entries and its days' benchmarks, and free play's, recorded here when a player's finished deal is reviewed
// (`/free/review`) — a signed-in player's, and since SKATGO-182 a guest device's; in the player's game and in the AI's,
// all three seats' Seeger-Fabian scores, who declared and whether they won. Each deal carries the key that names it, so
// it can be played again (SKATGO-182).

/** How one game of a deal went, from a deal's summary. */
export const played = (s: Pick<DealSummary, 'scores' | 'declarer' | 'won'> & Partial<Pick<DealSummary, 'declaration' | 'detail'>>): Played => {
  const c = s.declaration?.contract
  return {
    scores: s.scores, declarer: s.declarer, won: s.won,
    // Which game it was and its card points (SKATGO-169): where the difference to the AI comes from.
    ...(c ? { game: `${c.kind === 'suit' ? c.trump : c.kind}${s.declaration?.hand ? ' hand' : ''}` } : {}),
    ...(s.detail ? { points: [s.detail.declarerPoints, s.detail.defenderPoints] as [number, number] } : {}),
  }
}

/** A finished free deal of a player, an account or a guest device, once per game however often its review is asked. */
export async function recordFreeDeal(store: Store, d: { player: string; game: string; day: string; at: number; mine: Played; ai: Played }) {
  await store.pool.query(
    'INSERT INTO play_deals (player, game, day, at, mine, ai) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING',
    [d.player, d.game, d.day, d.at, JSON.stringify(d.mine), JSON.stringify(d.ai)])
}

/** The ids one person plays under, `who`'s first: those `player_aliases` names as one person, as on the XP board — a
 *  guest device that signed in among them (SKATGO-182). A device's own record is that device's only: on a shared device,
 *  signed out, no account's record shows through it. */
export async function idsOf(store: Store, who: string): Promise<string[]> {
  if (who.startsWith('anon:')) return [who]
  const { rows } = await store.pool.query(
    `WITH me AS (SELECT coalesce((SELECT same_as FROM player_aliases WHERE player = $1), $1) AS id)
     SELECT id FROM me UNION SELECT player FROM player_aliases, me WHERE same_as = me.id`, [who])
  return [who, ...rows.map((r) => r.id as string).filter((id) => id !== who)]
}

/**
 * Every deal of the player, in the order played: the tournament's (finished entries and the finished deals of
 * today's unfinished one) — the twelve-deal tournament's kept rows too (SKATGO-77, gone since SKATGO-119), whose deals
 * were played against the same AI on the same cards (the human: 「他的全档案必须建立好」) — and free play's. The ids `player_aliases` names as one person count as that person,
 * as on the Elo board. A tournament deal of a day dealt before the AI played it has no AI score.
 */
/** The player's ten cards of a deal, as `C10` …, the dealer and deck known (SKATGO-182, the human: 「每一行显示用户拿到了啥牌」). */
const handOf = (dealer: 0 | 1 | 2, deck: Card[]) => deal(dealer, deck).hands[0].map((c) => `${c.suit}${c.rank}`)

/** Free play's pool, as far as a record needs it: its version and each deal's dealer and deck. */
export type PoolDecks = { version: string; deals: { dealer: 0 | 1 | 2; deck: string }[] }

export async function playProfile(store: Store, who: string, pool: PoolDecks | null = null): Promise<{ deals: ProfileDeal[]; notes: ProfileNote[] }> {
  const players = await idsOf(store, who)
  const { rows: entries } = await store.pool.query(
    `SELECT e.day, e.size, e.deals, e.created_at, d.deals AS specs FROM daily_entries e
       JOIN daily_deals d ON d.day = e.day AND d.size = e.size
      WHERE e.player = ANY($1) ORDER BY e.created_at`, [players])
  const deals: (ProfileDeal & { at: number })[] = []
  for (const e of entries) {
    const specs = e.specs as { dealer?: 0 | 1 | 2; deck?: Card[]; benchmark?: { summary: DealSummary } }[]
    ;(e.deals as DealSummary[]).forEach((mine, i) => deals.push({
      day: e.day, source: 'daily', key: `daily:${e.day}:${e.size}:${i}`, at: Number(e.created_at) + i,
      ...(specs[i]?.deck && specs[i].dealer !== undefined ? { hand: handOf(specs[i].dealer!, specs[i].deck!) } : {}),
      mine: played(mine), ai: specs[i]?.benchmark ? played(specs[i].benchmark!.summary) : null,
    }))
  }
  const { rows: free } = await store.pool.query('SELECT game, day, at, mine, ai FROM play_deals WHERE player = ANY($1)', [players])
  for (const f of free) {
    // A deal of this pool is dealt again from it: `free:<pool>:<deal>:<start>`.
    const [, version, id] = (f.game as string).split(':')
    const d = pool && version === pool.version ? pool.deals[Number(id)] : undefined
    deals.push({ day: f.day, source: 'free', key: f.game, at: Number(f.at), ...(d ? { hand: handOf(d.dealer, d.deck.split(' ').map(card)) } : {}), mine: f.mine, ai: f.ai })
  }
  deals.sort((a, b) => a.day.localeCompare(b.day) || a.at - b.at)
  // The weeks' analyses written for this person, under any of their ids (SKATGO-128); none for a guest device.
  const { rows: notes } = who.startsWith('anon:')
    ? { rows: [] }
    : await store.pool.query('SELECT week, lang, body FROM profile_notes WHERE player = ANY($1) ORDER BY week DESC', [players])
  return { deals: deals.map(({ at: _, ...d }) => d), notes: notes.map((n) => ({ week: n.week, lang: n.lang, body: n.body })) }
}
