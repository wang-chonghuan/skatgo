import { useId } from 'react'

// The two languages' flags for the language menu (SKATGO-29), drawn here because a flag is nothing but
// fixed colours. Both render in the same small box; the Union Jack's 2:1 is centred and cropped into it.

const W = 22
const H = 15

/** United Kingdom. */
export function FlagGB() {
  const id = useId()
  return (
    <svg width={W} height={H} viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <clipPath id={`${id}t`}>
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth={6} />
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath={`url(#${id}t)`} stroke="#C8102E" strokeWidth={4} />
      <path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" strokeWidth={10} />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth={6} />
    </svg>
  )
}

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
