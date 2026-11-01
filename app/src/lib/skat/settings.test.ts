import { describe, expect, it } from 'vitest'

import { migrateSettings } from './settings'

// SKATGO-168: a seat's face is kept only when the player chose it; SKATGO-167's stored defaults are not a choice.
describe('settings from before version 1', () => {
  it('drops a seat that still holds its old default, keeps a chosen face and the rest', () => {
    expect(migrateSettings({ deck: 'german', avatars: { 1: 'lina', 2: 'noah' } }, 0)).toEqual({ deck: 'german', avatars: {} })
    expect(migrateSettings({ avatars: { 1: 'lina', 2: 'man-cap' } }, 0)).toEqual({ avatars: { 2: 'man-cap' } })
    expect(migrateSettings({ avatars: { 1: 'noah', 2: 'lina' } }, 0)).toEqual({ avatars: { 1: 'noah', 2: 'lina' } })
  })
  it('leaves settings without faces, and current ones, as they are', () => {
    expect(migrateSettings({ sounds: false }, 0)).toEqual({ sounds: false })
    expect(migrateSettings({ avatars: { 1: 'lina' } }, 1)).toEqual({ avatars: { 1: 'lina' } })
  })
})
