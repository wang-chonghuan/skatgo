import { schema, t } from '@colyseus/schema'
export const PlayerState = schema({ privateData: t.string().view() }, 'SkatPlayer')
export const MatchState = schema({
  publicData: t.string(),
  players: t.map(PlayerState),
}, 'SkatMatch')
