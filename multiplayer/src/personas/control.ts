import type pg from 'pg'
import { NAME_LOCK, dayOf } from '../daily'
import type { Store } from '../store'
import { enabled, population, populationCount, type Roster } from './config'

type Queryable = pg.Pool | pg.PoolClient
export type Control = { enabled: boolean; population: number; revision: number; updated_at: string }
export const defaults = () => ({ enabled: enabled(), population: populationCount() })

export async function readControl(c: Queryable): Promise<Control | null> {
  return (await c.query('SELECT enabled, population, revision, updated_at FROM persona_control WHERE id=1')).rows[0] ?? null
}

export async function initializeControl(store: Store, initial = defaults(), now = Date.now()) {
  await store.transaction((c) => c.query(
    `INSERT INTO persona_control (id,enabled,population,updated_at) VALUES (1,$1,$2,$3) ON CONFLICT DO NOTHING`,
    [initial.enabled, initial.population, now]))
}

export async function assertControl(c: pg.PoolClient, revision: number) {
  const row = (await c.query('SELECT enabled, revision FROM persona_control WHERE id=1 FOR SHARE')).rows[0]
  if (!row?.enabled || row.revision !== revision) throw new Error('persona_control_changed')
}

export async function reservePopulation(c: pg.PoolClient, r: Roster, now: number) {
  await c.query('SELECT pg_advisory_xact_lock($1)', [NAME_LOCK])
  const input = JSON.stringify(r.personas.map((p) => ({ player: `sim:${p.id}`, nickname: p.nickname })))
  const { rows } = await c.query(
    `WITH wanted AS (SELECT * FROM jsonb_to_recordset($1::jsonb) AS p(player text, nickname text))
     SELECT w.player FROM wanted w WHERE
       EXISTS (SELECT 1 FROM persona_players p WHERE p.player=w.player AND p.nickname<>w.nickname)
       OR EXISTS (SELECT 1 FROM persona_players p WHERE lower(p.nickname)=lower(w.nickname) AND p.player<>w.player)
       OR EXISTS (SELECT 1 FROM daily_players p WHERE lower(p.nickname)=lower(w.nickname))
       OR EXISTS (SELECT 1 FROM daily_entries e WHERE lower(e.nickname)=lower(w.nickname))
     LIMIT 1`, [input])
  if (rows.length) throw new Error(`persona_name_conflict:${rows[0].player}`)
  await c.query(
    `INSERT INTO persona_players (player,nickname,created_at)
       SELECT player,nickname,$2 FROM jsonb_to_recordset($1::jsonb) AS p(player text,nickname text)
       ON CONFLICT (player) DO NOTHING`, [input, now])
}

/** Operator writes use the control row, not room leadership. Its revision fences in-flight results. */
export async function configureControl(pool: pg.Pool, settings: { enabled?: boolean; population?: number }, now = Date.now()) {
  const c = await pool.connect()
  try {
    await c.query('BEGIN')
    const initial = defaults()
    await c.query(
      'INSERT INTO persona_control (id,enabled,population,updated_at) VALUES (1,$1,$2,$3) ON CONFLICT DO NOTHING',
      [initial.enabled, initial.population, now])
    const current = (await c.query('SELECT enabled,population FROM persona_control WHERE id=1 FOR UPDATE')).rows[0]
    const next = { ...current, ...settings } as { enabled: boolean; population: number }
    populationCount(String(next.population))
    if (typeof next.enabled !== 'boolean') throw new Error('Invalid enabled setting')
    if (next.enabled) await reservePopulation(c, population(next.population), now)
    await c.query(
      `UPDATE persona_control SET enabled=$1,population=$2,revision=revision+1,updated_at=$3 WHERE id=1`,
      [next.enabled, next.population, now])
    await c.query('COMMIT')
  } catch (e) {
    await c.query('ROLLBACK')
    throw e
  } finally { c.release() }
}

export async function serviceStatus(pool: pg.Pool, now = Date.now()) {
  const control = (await pool.query('SELECT * FROM persona_control WHERE id=1')).rows[0]
  const configured = control ?? { ...defaults(), revision: 0, heartbeat_at: null, tick_ms: null, last_error: null }
  const ids = population(configured.population).personas.map((p) => `sim:${p.id}`)
  const { rows } = await pool.query(
    `SELECT count(*)::int AS planned,
       count(*) FILTER (WHERE result IS NOT NULL)::int AS completed,
       count(*) FILTER (WHERE result IS NULL AND attempts>=3)::int AS failed,
       count(*) FILTER (WHERE result IS NULL AND attempts<3 AND due<$2)::int AS expired,
       count(*) FILTER (WHERE result IS NULL AND attempts<3 AND due BETWEEN $2 AND $3)::int AS due,
       count(*) FILTER (WHERE result IS NULL AND attempts<3 AND due>$3)::int AS future,
       min(due) FILTER (WHERE result IS NULL AND attempts<3 AND due>$3) AS next_due
     FROM persona_jobs WHERE day=$1 AND player=ANY($4::text[])`,
    [dayOf(now), now - 30 * 60_000, now, ids])
  const registered = (await pool.query('SELECT count(*)::int AS n FROM persona_players')).rows[0].n
  return { control: configured, day: dayOf(now), registered, queue: rows[0],
    heartbeatAgeMs: configured.heartbeat_at === null ? null : Math.max(0, now - Number(configured.heartbeat_at)) }
}
