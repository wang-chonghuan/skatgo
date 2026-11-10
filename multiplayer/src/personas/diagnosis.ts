import type pg from 'pg'
import { recordOf, type Played } from '../../../app/src/lib/skat/profile'
import { XP_SINCE } from '../../../app/src/lib/skat/xp'
import { type ActivityResult } from './play'
import { contractOf, wilsonUpper } from './metrics'
import type { Activity } from './schedule'
import type { DealSpec } from '../daily'

type Sample = { person: string; day: string; mode: string; mine: Played; ai: Played | null }
function report(rows: Sample[]) {
  const summarize = (sample: Sample[]) => {
    const r = recordOf(sample.map((s) => s.mine))
    return { ...r, deals: sample.length, dates: new Set(sample.map((s) => s.day)).size,
      winRate: r.played ? r.won / r.played : null,
      independentGameWilsonUpper95: wilsonUpper(r.won, r.played),
      uncertaintyWarning: 'Repeated daily cards/date groups are dependent; Wilson is descriptive, not a pooled acceptance bound',
      sameAiSeatScore: sample.filter((s) => s.ai && s.mine.scores[0] === s.ai.scores[0]).length,
      contracts: [...new Set(sample.map((s) => contractOf(s.mine)))].map((contract) => ({
        contract, ...recordOf(sample.filter((s) => contractOf(s.mine) === contract).map((s) => s.mine)),
      })),
    }
  }
  return {
    modes: [...new Set(rows.map((s) => s.mode))].map((mode) => ({ mode, ...summarize(rows.filter((s) => s.mode === mode)) })),
    people: [...new Set(rows.map((s) => s.person))].map((person, n) => ({
      // Human account/alias ids never leave the diagnostic surface.
      person: person.startsWith('sim:') ? person : `human-${n + 1}`,
      ...summarize(rows.filter((s) => s.person === person)),
      modes: [...new Set(rows.filter((s) => s.person === person).map((s) => s.mode))].map((mode) => ({
        mode, ...summarize(rows.filter((s) => s.person === person && s.mode === mode)),
      })),
    })),
  }
}

/** Repeatable read-only transaction, including for remote diagnosis; never migrate/start a Store here. */
export async function diagnose(pool: pg.Pool, day: string, since = XP_SINCE, player = 'sim:sunny') {
  const c = await pool.connect()
  try {
    await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
    const human = await c.query<Sample>(
      `WITH all_deals AS (
         SELECT e.player,e.day,CASE WHEN e.size=1 THEN 'daily-one' ELSE 'daily-six' END AS mode,
                x.mine,d.deals->(x.i-1)::int->'benchmark'->'summary' AS ai
           FROM daily_entries e JOIN daily_deals d ON d.day=e.day AND d.size=e.size,
                jsonb_array_elements(e.deals) WITH ORDINALITY AS x(mine,i)
          WHERE e.day >= $1 AND e.size IN (1,6)
         UNION ALL SELECT player,day,'free',mine,ai FROM play_deals WHERE day >= $1
       )
       SELECT coalesce(a.same_as,d.player) AS person,d.day,d.mode,d.mine,d.ai
         FROM all_deals d LEFT JOIN player_aliases a ON a.player=d.player
        WHERE coalesce(a.same_as,d.player) LIKE 'user:%'`, [since])
    const simulated = await c.query<Sample>(
      `SELECT j.player AS person,j.day,CASE WHEN j.size=0 THEN 'free' WHEN j.size=1 THEN 'daily-one' ELSE 'daily-six' END AS mode,
              g->'mine' AS mine,g->'ai' AS ai
         FROM persona_jobs j,jsonb_array_elements(j.result->'games') AS g
        WHERE j.day >= $1 AND j.completed_at IS NOT NULL AND j.result IS NOT NULL`, [since])
    const incident = await c.query<{ snapshot: Activity; result: ActivityResult }>(
      `SELECT snapshot,result FROM persona_jobs WHERE player=$1 AND day=$2 AND size=6 AND completed_at IS NOT NULL`,
      [player, day])
    const daily = await c.query<{ day: string; size: number; deals: DealSpec[]; computer: string }>(
      'SELECT day,size,deals,computer FROM daily_deals WHERE day BETWEEN $1 AND $2 AND size IN (1,6) ORDER BY day,size', [since, day])
    await c.query('COMMIT')
    return { readOnly: true, since, day, humans: report(human.rows), personas: report(simulated.rows),
      incident: incident.rows.map(({ result }) => ({ total: result.total, ...recordOf(result.games.map((g) => g.mine)),
        scores: result.games.map((g) => g.mine.scores[0]), aiScores: result.games.map((g) => g.ai.scores[0]),
        sameAsAi: result.games.every((g) => JSON.stringify(g.mine.scores) === JSON.stringify(g.ai.scores)),
        policy: result.policy })),
      // Only simulated records and server deals can be exported; no human games/ids/names.
      fixture: { incidents: incident.rows, daily: daily.rows },
    }
  } catch (e) {
    await c.query('ROLLBACK')
    throw e
  } finally { c.release() }
}
