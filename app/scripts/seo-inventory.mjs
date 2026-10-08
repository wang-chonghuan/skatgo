import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { fileURLToPath } from 'node:url'
import { parse } from '@babel/parser'

const app = new URL('../', import.meta.url)

function ast(path) {
  return parse(readFileSync(new URL(path, app), 'utf8'), { sourceType: 'module', plugins: ['typescript', 'jsx'] })
}

function literal(node) {
  if (node.type === 'TSAsExpression') return literal(node.expression)
  if (node.type === 'StringLiteral') return node.value
  if (node.type === 'ArrayExpression') return node.elements.map(literal)
  if (node.type === 'ObjectExpression') {
    return Object.fromEntries(node.properties.map((property) => [property.key.name ?? property.key.value, literal(property.value)]))
  }
  throw new Error(`Unsupported inventory constant: ${node.type}`)
}

function constantNode(path, name) {
  for (const statement of ast(path).program.body) {
    const declaration = statement.declaration
    if (declaration?.type !== 'VariableDeclaration') continue
    const value = declaration.declarations.find((item) => item.id.name === name)
    if (value) return value.init
  }
  throw new Error(`Missing inventory source ${path}: ${name}`)
}

function constant(path, name) {
  return literal(constantNode(path, name))
}

function courseIds() {
  const path = 'src/lib/skat/lessons/content.ts'
  const imports = new Map(ast(path).program.body.filter((node) => node.type === 'ImportDeclaration').flatMap((node) =>
    node.specifiers.map((binding) => [binding.local.name, { source: node.source.value, exported: binding.imported?.name }])))
  return Object.fromEntries(constantNode(path, 'COURSES').properties.map((property) => {
    const binding = imports.get(property.value.name)
    assert.ok(binding?.exported, 'Course language data must have an authoritative imported source')
    const file = new URL(`${binding.source}.ts`, new URL(path, app))
    const lessons = constantNode(file, binding.exported)
    assert.equal(lessons.type, 'ArrayExpression', `${file}: discoverable course lessons`)
    const ids = lessons.elements.map((lesson) => {
      const id = lesson.properties.find((item) => (item.key.name ?? item.key.value) === 'id')
      assert.ok(id, `${file}: lesson id missing`)
      return literal(id.value)
    })
    return [property.key.name ?? property.key.value, ids]
  }))
}

function walk(node, visit) {
  if (!node || typeof node !== 'object') return
  if (node.type) visit(node)
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((child) => walk(child, visit))
    else if (value && typeof value === 'object') walk(value, visit)
  }
}

function routePaths() {
  const paths = []
  for (const file of readdirSync(new URL('src/routes/', app))) {
    if (!file.endsWith('.tsx')) continue
    walk(ast(`src/routes/${file}`), (node) => {
      if (node.type !== 'CallExpression' || node.callee.name !== 'createFileRoute') return
      assert.equal(node.arguments[0]?.type, 'StringLiteral', `${file}: route must have a discoverable path`)
      paths.push(node.arguments[0].value.split('/').map((part) => part.replace(/_$/, '')).join('/').replace(/\/$/, '') || '/')
    })
  }
  assert.ok(paths.length > 0, 'Derived no file routes')
  assert.equal(new Set(paths).size, paths.length, 'Duplicate route paths')
  return paths
}

// Read the product's typed data modules without a build, including in explicit-origin mode.
// This resolver is limited to source imports; no generated route tree or page implementation runs.
async function sourceData() {
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      let url
      if (specifier.startsWith('~/')) url = new URL(`src/${specifier.slice(2)}`, app)
      else if (specifier.startsWith('.') && context.parentURL?.startsWith(app.href)) url = new URL(specifier, context.parentURL)
      if (url && !existsSync(url) && existsSync(`${fileURLToPath(url)}.ts`)) {
        return nextResolve(`${url.href}.ts`, context)
      }
      return nextResolve(specifier, context)
    },
  })
  try {
    const [{ GUIDES, lessonPath }, { PRIVATE_PAGES }, { paraglideOptions }] = await Promise.all([
      import('../src/lib/skat/lessons/guide.ts'),
      import('../src/lib/indexability.ts'),
      import('../paraglide.options.ts'),
    ])
    return { guides: GUIDES, lessonPath, privatePaths: [...PRIVATE_PAGES], patterns: paraglideOptions.urlPatterns }
  } finally {
    hooks.deregister()
  }
}

export function deriveInventory({ routes, pages, guides, courseIds, lessonPath, privatePaths, patterns, locales, tags, site }) {
  assert.ok(locales.length > 0, 'Derived no configured locales')
  assert.ok(locales.includes('de') && locales.includes('en'), 'German and English must remain independent')
  const staticRoutes = routes.filter((path) => !path.includes('$'))
  assert.deepEqual([...pages].sort(), [...staticRoutes].sort(), 'Sitemap page registry / file route coverage')
  for (const path of privatePaths) assert.ok(routes.includes(path), `Private page has no route: ${path}`)
  const ids = Object.keys(guides[locales[0]] ?? {})
  assert.ok(ids.length > 0, 'Derived no lesson guides')
  for (const locale of locales) {
    assert.deepEqual(Object.keys(guides[locale] ?? {}).sort(), [...ids].sort(), `${locale}: lesson language coverage`)
    assert.deepEqual(Object.keys(guides[locale] ?? {}).sort(), [...(courseIds[locale] ?? [])].sort(), `${locale}: course / lesson guide coverage`)
    assert.ok(tags[locale], `${locale}: missing language tag`)
  }
  const lessons = ids.map((id) => Object.fromEntries(locales.map((locale) => [locale, lessonPath(id, locale)])))
  // A private route with a parameter (a private table, SKATGO-61) has no source-backed targets: it is
  // checked as personal, at one sample address.
  const dynamic = routes.filter((path) => path.includes('$') && !privatePaths.includes(path))
  assert.ok(dynamic.length > 0, 'Derived no lesson routes')
  const matchRoute = (path, route) => new URLPattern(route.replace(/\$([A-Za-z0-9_]+)/g, ':$1'), site).test(new URL(path, site))
  for (const route of dynamic) {
    assert.ok(lessons.some((paths) => Object.values(paths).some((path) => matchRoute(path, route))), `Dynamic route has no source-backed targets: ${route}`)
  }
  for (const paths of lessons) {
    for (const path of Object.values(paths)) assert.ok(dynamic.some((route) => matchRoute(path, route)), `Lesson has no route: ${path}`)
  }
  const localize = (path, locale) => {
    for (const pattern of patterns) {
      const matched = new URLPattern(pattern.pattern, site).exec(new URL(path, site))
      if (!matched) continue
      const template = pattern.localized.find(([language]) => language === locale)?.[1]
      assert.ok(template, `${path}: missing URL pattern for ${locale}`)
      const localized = template.replace(/:([A-Za-z0-9_]+)(?:\(\.\*\))?\??/g, (_, name) => matched.pathname.groups[name] ?? '')
      assert.ok(!localized.includes(':'), `${path}: unsupported localized URL pattern`)
      return new URL(localized, site).href
    }
    throw new Error(`${path}: no localized URL pattern`)
  }
  const entriesFor = (paths) => {
    const alternates = Object.fromEntries(locales.map((locale) => [tags[locale], localize(paths[locale], locale)]))
    alternates['x-default'] = alternates[tags.de]
    return locales.map((locale) => ({ loc: alternates[tags[locale]], alternates }))
  }
  const same = (path) => Object.fromEntries(locales.map((locale) => [locale, path]))
  const entries = [...staticRoutes.filter((path) => !privatePaths.includes(path)).map(same), ...lessons].flatMap(entriesFor)
  assert.ok(entries.length > 0, 'Derived no indexable pages')
  assert.equal(new Set(entries.map((entry) => entry.loc)).size, entries.length, 'Independent page/language URLs must not collapse')
  return {
    site, locales, tags, entries,
    privateEntries: privatePaths.map((path) => same(path.replace(/\$[A-Za-z0-9_]+/g, 'sample'))).flatMap(entriesFor),
    lessonEntries: lessons.flatMap(entriesFor),
  }
}

export async function loadInventory() {
  return deriveInventory({
    ...await sourceData(),
    routes: routePaths(),
    pages: constant('src/lib/sitemap.ts', 'PAGES'),
    courseIds: courseIds(),
    locales: JSON.parse(readFileSync(new URL('project.inlang/settings.json', app), 'utf8')).locales,
    tags: constant('src/lib/site.ts', 'LANG_TAG'),
    site: constant('src/lib/origin.ts', 'SITE_URL'),
  })
}
