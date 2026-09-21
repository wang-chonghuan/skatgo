// @letele/playing-cards points its `types` field at a file it does not publish. Every export is an
// SVGR component: an <svg> that spreads the props it is given.
declare module '@letele/playing-cards' {
  import type { ComponentType, SVGProps } from 'react'
  type Face = ComponentType<SVGProps<SVGSVGElement>>
  export const C7: Face, C8: Face, C9: Face, C10: Face, Cj: Face, Cq: Face, Ck: Face, Ca: Face
  export const S7: Face, S8: Face, S9: Face, S10: Face, Sj: Face, Sq: Face, Sk: Face, Sa: Face
  export const H7: Face, H8: Face, H9: Face, H10: Face, Hj: Face, Hq: Face, Hk: Face, Ha: Face
  export const D7: Face, D8: Face, D9: Face, D10: Face, Dj: Face, Dq: Face, Dk: Face, Da: Face
}
