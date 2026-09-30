// The two languages' flags for the language menu (SKATGO-29), drawn here because a flag is nothing but
// fixed colours. Both render in the same small box, centred and cropped into it. English is shown with
// the US flag (the human, SKATGO-29).

const W = 22
const H = 15

/** The United States: thirteen stripes, and the blue canton with its fifty stars as a grid of dots. */
export function FlagUS() {
  return (
    <svg width={W} height={H} viewBox="0 0 190 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width={190} height={100} fill="#FFFFFF" />
      <rect y={0.000} width={190} height={7.692} fill="#B22234" />
      <rect y={15.385} width={190} height={7.692} fill="#B22234" />
      <rect y={30.769} width={190} height={7.692} fill="#B22234" />
      <rect y={46.154} width={190} height={7.692} fill="#B22234" />
      <rect y={61.538} width={190} height={7.692} fill="#B22234" />
      <rect y={76.923} width={190} height={7.692} fill="#B22234" />
      <rect y={92.308} width={190} height={7.692} fill="#B22234" />
      <rect width={76} height={53.846} fill="#3C3B6E" />
      {STARS.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={1.9} fill="#FFFFFF" />
      ))}
    </svg>
  )
}

// Nine rows of stars, six and five alternating, in the canton.
const STARS: [number, number][] = Array.from({ length: 9 }, (_, row) =>
  Array.from({ length: row % 2 === 0 ? 6 : 5 }, (_, i) => [6.33 + (row % 2 === 0 ? 0 : 6.33) + i * 12.67, 5.385 + row * 5.385] as [number, number]),
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
