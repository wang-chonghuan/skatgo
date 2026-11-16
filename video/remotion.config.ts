import path from 'node:path'
import { Config } from '@remotion/cli/config'

// SkatGo's daily videos (SKATGO-202) draw the site's own cards: `PlayingCard` and its theme come straight from
// `app/src`, compiled here with StyleX's Babel plugin, its styles injected at runtime. One React for everything.

const VIDEO = process.cwd()
const APP_SRC = path.resolve(VIDEO, '../app/src')
const mod = (name: string) => path.resolve(VIDEO, 'node_modules', name)

// The card faces name their pictures from the site's root (`/cards/french/C-J.webp`); in a render the public
// files are served under Remotion's static base, which the composition puts in `globalThis.__skatgoBase`.
function cardsFromStaticBase({ types: t }: { types: typeof import('@babel/core').types }) {
  // The literals this plugin writes, so it never rewrites its own output.
  const made = new WeakSet<object>()
  const base = () => t.logicalExpression('??', t.memberExpression(t.identifier('globalThis'), t.identifier('__skatgoBase')), t.stringLiteral(''))
  return {
    visitor: {
      StringLiteral(p: any) {
        if (made.has(p.node) || !p.node.value.startsWith('/cards/') || p.parentPath.isImportDeclaration()) return
        const literal = t.stringLiteral(p.node.value)
        made.add(literal)
        p.replaceWith(t.binaryExpression('+', base(), literal))
      },
      TemplateLiteral(p: any) {
        const first = p.node.quasis[0]
        if (made.has(p.node) || !first.value.cooked?.startsWith('/cards/')) return
        made.add(p.node)
        p.node.quasis.unshift(t.templateElement({ raw: '', cooked: '' }, false))
        p.node.expressions.unshift(base())
      },
    },
  }
}

Config.setPublicDir('public')
Config.setVideoImageFormat('jpeg')
Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: { ...(config.resolve?.alias as Record<string, string>), '~': APP_SRC },
    // This folder's packages first, for the app's files too: one React, one StyleX, one zustand.
    modules: [mod(''), 'node_modules'],
  },
  module: {
    ...config.module,
    rules: [
      {
        test: /\.(ts|tsx)$/,
        include: [APP_SRC],
        use: {
          loader: mod('babel-loader'),
          options: {
            babelrc: false,
            configFile: false,
            presets: [[mod('@babel/preset-typescript'), { isTSX: true, allExtensions: true }], [mod('@babel/preset-react'), { runtime: 'automatic' }]],
            plugins: [
              cardsFromStaticBase,
              [mod('@stylexjs/babel-plugin'), { dev: false, runtimeInjection: true, treeshakeCompensation: true, unstable_moduleResolution: { type: 'commonJS', rootDir: path.resolve(VIDEO, '..') } }],
            ],
          },
        },
      },
      // Remotion's own TypeScript rule keeps to this folder; the app's files take the rule above.
      ...(config.module?.rules ?? []).map((r: any) =>
        r && r.test instanceof RegExp && r.test.test('x.tsx') ? { ...r, exclude: [APP_SRC, ...(r.exclude ? [r.exclude].flat() : [])] } : r,
      ),
    ],
  },
}))
