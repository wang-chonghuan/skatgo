import assert from 'node:assert/strict'

export const crawlers = ['Googlebot', 'Bingbot']

function groups(text) {
  const result = []
  let group
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim()
    const colon = line.indexOf(':')
    if (colon < 0) continue
    const key = line.slice(0, colon).toLowerCase()
    const value = line.slice(colon + 1).trim()
    if (key === 'user-agent') {
      if (!group || group.rules.length) {
        group = { agents: [], rules: [] }
        result.push(group)
      }
      group.agents.push(value.toLowerCase())
    } else if (group && ['allow', 'disallow'].includes(key) && value) {
      group.rules.push({ allow: key === 'allow', path: value })
    }
  }
  return result
}

export function robotsAllows(text, agent, path) {
  const candidates = groups(text).map((group) => ({
    group,
    specificity: Math.max(-1, ...group.agents.map((name) => name === '*' ? 0 : agent.toLowerCase().includes(name) ? name.length : -1)),
  }))
  const best = Math.max(-1, ...candidates.map((item) => item.specificity))
  const matching = candidates.filter((item) => item.specificity === best && best >= 0).flatMap(({ group }) => group.rules).filter((rule) => {
    const pattern = rule.path.replace(/[.+?^{}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\$$/, '$')
    return new RegExp(`^${pattern}`).test(path)
  }).sort((a, b) => b.path.replace(/[*$]/g, '').length - a.path.replace(/[*$]/g, '').length || Number(b.allow) - Number(a.allow))
  return matching[0]?.allow ?? true
}

export function assertIndexable(directives, label) {
  assert.ok(!/(?:^|[\s,;:])(noindex|nofollow|none)(?:$|[\s,;])/i.test(directives), `${label}: crawler indexing/following blocked`)
}

export function validateRobots(text, site, paths) {
  const sitemaps = text.split(/\r?\n/).map((line) => line.replace(/#.*$/, '').trim()).filter((line) => /^sitemap:/i.test(line)).map((line) => line.slice(line.indexOf(':') + 1).trim())
  assert.ok(sitemaps.includes(`${site}/sitemap.xml`), 'robots.txt: must announce canonical sitemap')
  for (const agent of crawlers) {
    for (const path of paths) assert.ok(robotsAllows(text, agent, path), `robots.txt: ${agent} blocked ${path}`)
  }
}
