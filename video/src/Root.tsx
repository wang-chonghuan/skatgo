import { Composition } from 'remotion'
import { DailyVideo } from './DailyVideo'
import { timeline } from './timeline'
import { FPS, type Plan } from './types'

const EMPTY: Plan = { kind: 'quiz', lang: 'de', day: '', date: '', role: '', hand: [], segments: [] }

/** One composition; the plan given as props (scripts/make.mjs) says which video and how long. */
export function Root() {
  return (
    <Composition
      id="Daily"
      component={DailyVideo as unknown as React.FC<Record<string, unknown>>}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={FPS}
      defaultProps={EMPTY as unknown as Record<string, unknown>}
      calculateMetadata={({ props }) => ({ durationInFrames: Math.max(FPS, timeline(props as unknown as Plan).total) })}
    />
  )
}
