import { build } from 'esbuild'
await build({
  entryPoints: ['src/server.ts'],
  outfile: 'dist/server.mjs',
  platform: 'node',
  target: 'node24',
  format: 'esm',
  bundle: true,
  packages: 'external',
  sourcemap: true,
})
