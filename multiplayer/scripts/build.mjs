import { build } from 'esbuild'
await build({
  entryPoints: { server: 'src/server.ts', personas: 'scripts/personas.ts' },
  outdir: 'dist',
  outExtension: { '.js': '.mjs' },
  platform: 'node',
  target: 'node24',
  format: 'esm',
  bundle: true,
  packages: 'external',
  sourcemap: true,
})
