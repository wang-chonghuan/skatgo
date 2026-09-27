#!/usr/bin/env node
// Fail the build when product code writes a design value of its own instead of naming a token.
//
// Every design value — colour, type, spacing, radius, border, shadow, texture, opacity, stacking,
// timing, breakpoint, component dimension — lives in a registry under `app/src/theme/` (ui.md). A value
// typed into a component is a second source of truth that no registry change will ever reach, and it
// is how a design system erodes one reasonable-looking pixel at a time (SKATGO-19). This check makes
// the rule mechanical, so it needs no review.
//
// Outside `app/src/theme/` it rejects:
//   - inside `stylex.create(...)`: a number other than 0 or 1; a string containing a digit (except
//     '100%'); a template literal; a font property (`fontFamily`, `fontSize`, `fontWeight`,
//     `lineHeight`, `letterSpacing` — typography is a role from theme/type.ts); an `@media` key typed
//     out (use `bp` from theme/breakpoints.stylex.ts);
//   - in a `motion` prop (`initial`, `animate`, `exit`, `transition`, `while*`), a `confetti(...)` or a
//     `useAnimate` `animate(...)` call, and any numeric JSX attribute: a number other than 0 or 1;
//   - anywhere: a string that carries a CSS length, duration or colour ('12px', '120ms', '0.2s',
//     '1fr', '50%', '#abc'). Whole seconds are not matched: lesson text says "7s and 8s".
// `aria-*`, `data-*` and `tabIndex` attributes are not design and are not checked.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@babel/parser'

const app = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(app, 'src')
const SKIP = [join(src, 'theme'), join(src, 'paraglide'), join(src, 'routeTree.gen.ts')]

function files(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (SKIP.some((s) => path === s || path.startsWith(s + '/'))) continue
    if (statSync(path).isDirectory()) out.push(...files(path))
    else if (/\.(ts|tsx)$/.test(name)) out.push(path)
  }
  return out
}

const FONT_PROPS = new Set(['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing'])
const MOTION_PROPS = /^(initial|animate|exit|transition|while[A-Z]\w*)$/
const NOT_DESIGN_ATTR = /^(aria-|data-|tabIndex$)/
const CSS_VALUE = [
  /(?<![\w.#-])-?\d*\.?\d+(px|ms|vh|vw|dvh|svh|lvh|rem|em|fr|deg)(?![\w-])/,
  /(?<![\w.#-])\d*\.\d+s(?![\w-])/,
  /#[0-9a-fA-F]{3,8}(?![\w-])/,
  /(?<![\w.-])(?!100%)\d*\.?\d+%/,
]

const violations = []
const scanned = files(src)
if (scanned.length === 0) {
  console.error('✗ check-design-tokens: found no source files under app/src — the check would pass vacuously')
  process.exit(1)
}

const isStylexCreate = (node) =>
  node.type === 'CallExpression' &&
  node.callee.type === 'MemberExpression' &&
  node.callee.object.name === 'stylex' &&
  node.callee.property.name === 'create'
const isNumberCall = (node) =>
  node.type === 'CallExpression' && node.callee.type === 'Identifier' && (node.callee.name === 'confetti' || node.callee.name === 'animate')
const numberValue = (node) =>
  node.type === 'NumericLiteral' ? node.value : node.type === 'UnaryExpression' && node.operator === '-' && node.argument.type === 'NumericLiteral' ? -node.argument.value : null

for (const file of scanned) {
  const code = readFileSync(file, 'utf8')
  const ast = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] })
  const report = (node, what) => violations.push(`${relative(join(app, '..'), file)}:${node.loc.start.line}  ${what}`)

  // ctx: { style } inside stylex.create, { numbers } where only 0/1 may be written.
  const walk = (node, ctx) => {
    if (!node || typeof node.type !== 'string') return
    let next = ctx
    if (isStylexCreate(node)) next = { ...ctx, style: true, numbers: true }
    else if (isNumberCall(node)) next = { ...ctx, numbers: true }
    else if (node.type === 'JSXAttribute') {
      const name = typeof node.name.name === 'string' ? node.name.name : ''
      if (NOT_DESIGN_ATTR.test(name)) return
      if (MOTION_PROPS.test(name)) next = { ...ctx, numbers: true }
      else if (node.value?.type === 'JSXExpressionContainer' && numberValue(node.value.expression) !== null) next = { ...ctx, numbers: true }
    }

    const n = numberValue(node)
    if (n !== null) {
      if (next.numbers && n !== 0 && n !== 1) report(node, `number ${n} — name a token from app/src/theme/`)
      return
    }
    if (node.type === 'StringLiteral' || node.type === 'TemplateElement') {
      const text = node.type === 'StringLiteral' ? node.value : node.value.cooked
      if (next.style && node.type === 'StringLiteral' && /\d/.test(text) && text !== '100%') report(node, `'${text}' — name a token from app/src/theme/`)
      else if (CSS_VALUE.some((re) => re.test(text))) report(node, `'${text.slice(0, 60)}' carries a CSS value — name a token from app/src/theme/`)
      return
    }
    if (next.style && node.type === 'TemplateLiteral') report(node, 'template literal in a style — compose it in a theme registry')
    if (next.style && node.type === 'ObjectProperty') {
      const key = node.key.type === 'Identifier' ? node.key.name : node.key.type === 'StringLiteral' ? node.key.value : null
      if (key && FONT_PROPS.has(key)) report(node, `${key} — pick a typography role from app/src/theme/type.ts`)
      if (key && key.startsWith('@media')) report(node, `'${key}' — use bp from app/src/theme/breakpoints.stylex.ts`)
    }

    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'start' || key === 'end' || key === 'extra' || key.endsWith('Comments')) continue
      // A plain object key names something (a seat, a variant); only a computed key is a value.
      if (key === 'key' && (node.type === 'ObjectProperty' || node.type === 'ObjectMethod') && !node.computed) continue
      const child = node[key]
      if (Array.isArray(child)) for (const c of child) walk(c, next)
      else if (child && typeof child === 'object') walk(child, next)
    }
  }
  walk(ast.program, { style: false, numbers: false })
}

if (violations.length) {
  console.error(`✗ ${violations.length} design value(s) written outside app/src/theme/:\n` + violations.map((v) => `  ${v}`).join('\n'))
  process.exit(1)
}
console.log(`✓ ${scanned.length} source files name every design value from app/src/theme/`)
