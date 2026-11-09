import assert from 'node:assert/strict'
import test from 'node:test'
import { cleanNickname } from '../../app/src/lib/skat/nickname'
import { population, roster } from '../src/personas/config'
import { planDay } from '../src/personas/schedule'

const approved = [
  'PeteM', 'emmalou', 'J\u00f6rg.P', 'mick', 'Clari', 'PhilH', 'Benno', 'laurab',
  'Stevie', 'NoraBee', 'Moxie', 'Fips', 'Pippo', 'r\u00e9mi.r', 'Brummel', 'biscotti', 'S\u00f8renK',
]

test('starter roster uses the approved names without altering case or Unicode spelling', () => {
  assert.deepEqual(roster.personas.map((p) => p.nickname), approved)
  assert.equal(new Set(approved.map((name) => name.toLowerCase())).size, 17)
  assert.equal(approved.filter((name) => /[^\x00-\x7f]/.test(name)).length, 3)
  for (const name of approved) {
    assert.equal(cleanNickname(name), name)
    assert.equal(cleanNickname(name.normalize('NFD')), name)
  }
})

test('every supported growth step preserves the approved starter identities and profiles', () => {
  for (const count of [17, 100, 200, 300, 400, 500]) {
    const expanded = population(count)
    assert.equal(expanded.personas.length, count)
    assert.deepEqual(expanded.personas.slice(0, 17), roster.personas)
  }
})

test('nickname and audit-version changes preserve attendance, timing and game random streams', () => {
  const previous = { ...roster, version: 'skatgo-personas/2',
    personas: roster.personas.map((p) => ({ ...p, nickname: `old-${p.id}` })) }
  const timeline = (r: typeof roster, day: string) =>
    planDay(r, day).map(({ version, configHash, persona, ...activity }) => activity)
  for (const day of ['2026-10-25', '2026-11-09', '2026-11-10', '2026-11-14', '2027-03-28']) {
    assert.deepEqual(timeline(roster, day), timeline(previous, day))
    assert(planDay(roster, day).every((a) => a.version === roster.version))
  }
})
