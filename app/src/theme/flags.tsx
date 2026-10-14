import { useId } from 'react'

// The two languages' flags for the header's language switch (SKATGO-29, SKATGO-104), drawn here
// because a flag is nothing but fixed colours. Both fill the box their caller sizes (`dims.flag*`),
// centred and cropped into it. English is the United States and the United Kingdom halved on the
// diagonal (the human, SKATGO-104: 「美国英国各一半的国旗」).

const W = '100%'
const H = '100%'

/** English: the United States top left, the United Kingdom bottom right, a thin white line between. */
export function FlagEN() {
  const id = useId()
  const cross = `${id}-cross`
  const half = `${id}-half`
  return (
    <svg width={W} height={H} viewBox="0 0 60 40" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        {/* The red diagonals sit off-centre, each on the clockwise side of the white. */}
        <clipPath id={cross}>
          <path d="M30,20h30v20zv20h-30zh-30v-20zv-20h30z" />
        </clipPath>
        <clipPath id={half}>
          <path d="M0,0H60L0,40Z" />
        </clipPath>
      </defs>
      <rect width={60} height={40} fill="#012169" />
      <path d="M0,0L60,40M60,0L0,40" stroke="#FFFFFF" strokeWidth={7} />
      <path d="M0,0L60,40M60,0L0,40" clipPath={`url(#${cross})`} stroke="#C8102E" strokeWidth={4} />
      <path d="M30,0v40M0,20h60" stroke="#FFFFFF" strokeWidth={12} />
      <path d="M30,0v40M0,20h60" stroke="#C8102E" strokeWidth={7} />
      <g clipPath={`url(#${half})`}>
        <rect width={60} height={40} fill="#FFFFFF" />
        {STRIPES.map((y) => (
          <rect key={y} y={y} width={60} height={STRIPE} fill="#B22234" />
        ))}
        <rect width={26} height={STRIPE * 7} fill="#3C3B6E" />
        {STARS.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={0.9} fill="#FFFFFF" />
        ))}
      </g>
      <path d="M60,0L0,40" stroke="#FFFFFF" strokeWidth={1.2} />
    </svg>
  )
}

// Thirteen stripes, the seven red ones drawn; the canton's stars as five rows of dots.
const STRIPE = 40 / 13
const STRIPES = Array.from({ length: 7 }, (_, i) => i * 2 * STRIPE)
const STARS: [number, number][] = Array.from({ length: 5 }, (_, row) =>
  Array.from({ length: 6 }, (_, i) => [2.5 + i * 4.2 + (row % 2 === 0 ? 0 : 2.1), 2.4 + row * 4.2] as [number, number]),
).flat()

/** Germany. */
export function FlagDE() {
  return (
    <svg width={W} height={H} viewBox="0 0 5 3" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width={5} height={1} y={0} fill="#000000" />
      <rect width={5} height={1} y={1} fill="#DD0000" />
      <rect width={5} height={1} y={2} fill="#FFCE00" />
    </svg>
  )
}
