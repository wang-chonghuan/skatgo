#!/usr/bin/env node
// Fail the build when a server-only reference reaches a client chunk.
//
// This exists because of a specific defect that cost a day (PARROT-5): `readPanelBytes` was a plain
// exported function rather than a `createServerFn`, so it had no boundary to be stripped at, rode
// along into the scene page's browser chunk, and threw `ReferenceError: Buffer is not defined` at
// module evaluation. That killed hydration for the whole page. The visible symptom was a *layout*
// failure — AppShell never ran its client-side switch, so on a 375px screen the side nav rendered
// inline and squeezed the passage into 114px — while the actual evidence sat in the browser console.
// No numeric probe finds that: the page reported no overflow, because there was none.
//
// A function that is never called in the browser still breaks the browser. That is why this is a
// build check and not a code-review habit.
//
// It matches usage, not the bare word, so the two legitimate forms survive:
//   - `ArrayBuffer` / `SharedArrayBuffer` — standard web globals, nothing to do with Node.
//   - `globalThis.Buffer` — seroval's guarded feature detect, which tests for the global rather than
//     assuming it. Guarding is exactly the right thing to do, so it must not be punished.
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const APP = join(dirname(fileURLToPath(import.meta.url)), '..')
const ASSETS = join(APP, '.output/public/assets')

// Forms that mean "this code expects to be running in Node". Each is a use, not a mention.
const FORBIDDEN = [
  /\bBuffer\s*\.\s*(from|alloc|allocUnsafe|concat|isBuffer|byteLength)\b/,
  /\bnew\s+Buffer\b/,
  /\bprocess\s*\.\s*env\b/,
  /\brequire\s*\(\s*['"]node:/,
]

// Removed before matching, so a legitimate mention cannot trip a rule about a use.
const ALLOWED = [/\bArrayBuffer\b/g, /\bSharedArrayBuffer\b/g, /globalThis\s*\.\s*Buffer\b/g, /globalThis\s*\.\s*process\b/g]

let files
try {
  files = readdirSync(ASSETS).filter((f) => f.endsWith('.js'))
} catch {
  console.error(`✗ no client bundle at ${ASSETS} — run the build first`)
  process.exit(1)
}
if (!files.length) {
  // An empty sweep passing is the failure mode this whole check exists to avoid.
  console.error(`✗ ${ASSETS} holds no .js — nothing was checked, which is not the same as clean`)
  process.exit(1)
}

const hits = []
for (const f of files) {
  let src = readFileSync(join(ASSETS, f), 'utf8')
  for (const a of ALLOWED) src = src.replace(a, '')
  for (const rule of FORBIDDEN) {
    const m = rule.exec(src)
    if (m) hits.push({ file: f, match: m[0], context: src.slice(Math.max(0, m.index - 60), m.index + 60) })
  }
}

if (hits.length) {
  console.error('✗ server-only references reached the client bundle:')
  for (const h of hits) console.error(`  ${h.file}  ${h.match}\n    …${h.context.replace(/\n/g, ' ')}…`)
  console.error('\n  A plain exported function has no server boundary. Move it to a .server.ts /')
  console.error('  *.server module that only server code imports, or wrap it in createServerFn.')
  process.exit(1)
}

console.log(`✓ ${files.length} client chunks carry no server-only reference`)
