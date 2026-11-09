import type { Pool } from '../free'
import type { Policy } from '../skatzero/policy'
import type { Store } from '../store'
import { population, type Roster } from './config'
import { assertControl, defaults, initializeControl, readControl, type Control } from './control'
import { PersonaRunner } from './runner'

export const TICK_MS = 10_000
export const MAX_ACTIVITIES_PER_TICK = 3

/** One controller in the existing leader; idle characters have no timers or model instances. */
export class PersonaService {
  private timer: ReturnType<typeof setTimeout> | undefined
  private active: Promise<void> | null = null
  private closed = false
  private control: Control | null = null
  private roster: Roster = population()
  private runner: PersonaRunner
  constructor(private store: Store, policy: Policy, pool: Pool, private allowed: () => boolean,
    private initial = defaults(), private now = Date.now) {
    this.runner = new PersonaRunner(store, policy, pool, () => this.roster,
      () => !this.closed && this.allowed() && this.control?.enabled === true, now, {
        maxActivities: MAX_ACTIVITIES_PER_TICK, budgetMs: 5000, futureOnly: true,
        guard: (c) => assertControl(c, this.control!.revision),
      })
  }

  start() {
    if (this.closed || this.timer || this.active) return
    const cycle = async () => {
      await this.tick().catch(() => {})
      if (!this.closed) this.timer = setTimeout(() => { this.timer = undefined; void cycle() }, TICK_MS).unref()
    }
    void cycle()
  }

  tick(): Promise<void> {
    if (this.closed || !this.allowed()) return Promise.resolve()
    this.active ??= this.run().finally(() => { this.active = null })
    return this.active
  }

  async stop() {
    this.closed = true
    clearTimeout(this.timer)
    await Promise.allSettled([this.runner.stop(), this.active])
  }

  private async run() {
    const started = performance.now()
    let error: string | null = null
    try {
      if (!this.control) await initializeControl(this.store, this.initial, this.now())
      const control = await readControl(this.store.pool)
      if (!control) throw new Error('persona_control_missing')
      if (!this.control || control.population !== this.control.population) this.roster = population(control.population)
      this.control = control
      if (control.enabled) await this.runner.tick()
    } catch (e) {
      error = e instanceof Error ? e.message : 'persona_service_failed'
      if (error !== 'persona_control_changed') console.error(JSON.stringify({ event: 'persona_tick_failed', reason: error }))
    } finally {
      if (!this.closed && this.allowed()) {
        await this.store.transaction((c) => c.query(
          'UPDATE persona_control SET heartbeat_at=$1,tick_ms=$2,last_error=$3 WHERE id=1',
          [this.now(), Math.round(performance.now() - started), error === 'persona_control_changed' ? null : error]))
      }
    }
  }
}
