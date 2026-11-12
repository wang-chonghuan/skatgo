#!/usr/bin/env node
// Tell search engines through IndexNow which pages the site has (SKATGO-188).
//
//   node app/scripts/indexnow.mjs <origin>
//
// Reads <origin>'s two sitemaps and submits every address in them in one request to
// api.indexnow.org, which passes it on to Bing and the other engines taking part. It runs after a
// release (operations.md, post-deploy), not when the server starts, so a restart does not submit the
// same addresses again.
//
// The key is the one `<32 hex>.txt` file in app/public/, served at the site's root; its name and its
// content are the key. IndexNow publishes it by design: it shows that the site's owner sent the
// request, it opens no account.
//
// Only the published site submits: the sitemaps always name the published site's addresses, so an
// origin whose host differs from theirs (a preview, 127.0.0.1) has its addresses listed and nothing
// sent. A sitemap that does not answer stops the run before anything is sent, since half a submission
// would read as a whole one; a forum with no post to index answers an empty sitemap, which is fine.
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const SITEMAPS = ['/sitemap.xml', '/sitemap-forum.xml']
const ENDPOINT = 'https://api.indexnow.org/indexnow'

function fail(message) {
  console.error(`indexnow: ${message}`)
  process.exit(1)
}

const arg = process.argv[2]
if (!arg) fail('usage: node app/scripts/indexnow.mjs <origin>')
const origin = new URL(arg).origin

const keys = readdirSync(PUBLIC).filter((name) => /^[0-9a-f]{32}\.txt$/.test(name))
if (keys.length !== 1) fail(`expected one key file in app/public, found ${keys.length}`)
const key = keys[0].slice(0, -4)
if (readFileSync(join(PUBLIC, keys[0]), 'utf8') !== key) fail(`app/public/${keys[0]} does not contain its own name`)

async function read(path) {
  const res = await fetch(origin + path, { redirect: 'manual' })
  if (res.status !== 200) fail(`${origin}${path} answered ${res.status}`)
  return res.text()
}

if ((await read(`/${key}.txt`)) !== key) fail(`${origin}/${key}.txt does not serve the key`)

const urls = []
for (const path of SITEMAPS) {
  const found = [...(await read(path)).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())
  console.log(`${path}: ${found.length}`)
  urls.push(...found)
}
const list = [...new Set(urls)]
if (list.length === 0) fail(`${origin}'s sitemaps list no address`)
const host = new URL(list[0]).host
if (list.some((url) => new URL(url).host !== host)) fail('the sitemaps name more than one host')

if (new URL(origin).host !== host) {
  for (const url of list) console.log(url)
  console.log(`dry run: ${list.length} addresses of ${host}; ${origin} is not ${host}, nothing sent`)
  process.exit(0)
}

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation: `https://${host}/${key}.txt`, urlList: list }),
})
console.log(`IndexNow answered ${res.status} for ${list.length} addresses of ${host}`)
if (res.status !== 200 && res.status !== 202) fail(await res.text())
