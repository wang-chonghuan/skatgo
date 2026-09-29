import { Archive, Brain, Calculator, Coins, Crown, GraduationCap, Layers, Megaphone, Shuffle, Target, Trophy } from 'lucide-react'
import type { ComponentType } from 'react'

// Each lesson's picture: an outline icon from the same set as the rail and the tiles (SKATGO-26), in
// place of the emoji the lessons once carried. Chosen here, by lesson id, because it is the interface's
// choice, not the course's content.
type Icon = ComponentType<{ size?: number; strokeWidth?: number }>

const ICONS: Record<string, Icon> = {
  '1': Layers,
  '2': Coins,
  '3': Crown,
  '4': Target,
  '5': Shuffle,
  '6': Calculator,
  '7': Megaphone,
  '8': Archive,
  '9': Trophy,
  '10': Brain,
  '11': GraduationCap,
}

export function lessonIcon(id: string): Icon {
  return ICONS[id] ?? Layers
}
