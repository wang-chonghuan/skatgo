// @multiavatar/multiavatar ships no types (SKATGO-231): one function, a text in, an avatar's SVG out.
declare module '@multiavatar/multiavatar/esm' {
  export default function multiavatar(id: string, sansEnv?: boolean, ver?: { part: string; theme: 'A' | 'B' | 'C' }): string
}
