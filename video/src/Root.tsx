import { Composition } from 'remotion'
import { DailyVideo } from './DailyVideo'
import { timeline } from './timeline'
import { FPS, type Day } from './types'

const NONE = { kind: 'quiz', lang: 'de', day: '', date: '', role: '', hand: [], segments: [] } as const
const EMPTY: Day = { lang: 'de', day: '', today: { ...NONE, hand: [], segments: [] }, yesterday: { ...NONE, hand: [], segments: [] }, segments: [] }

/** One composition; the day given as props (scripts/make.mjs) says what it shows and how long. */
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
      calculateMetadata={({ props }) => {
        const day = props as unknown as Day
        return { durationInFrames: Math.max(FPS, timeline(day.segments).total) }
      }}
    />
  )
}
