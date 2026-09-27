import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const config = JSON.parse(readFileSync(new URL('../render.json', import.meta.url), 'utf8'))
const root = fileURLToPath(new URL('../..', import.meta.url))
const action = process.argv[2]
assert(['inspect', 'provision', 'deploy', 'verify'].includes(action), 'Use inspect, provision, deploy or verify')
const key = process.env.RENDER_API_KEY
assert(key, 'RENDER_API_KEY is required; never put it in committed configuration')
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
async function api(path, method = 'GET', body) {
  const response = await fetch(`https://api.render.com/v1${path}`, {
    method, headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) {
    // Render responses to writes can echo credentials. Report status, never the body.
    throw new Error(`Render ${method} ${path}: HTTP ${response.status}; inspect resource state before retrying a write`)
  }
  return response.status === 204 ? null : response.json()
}
async function list(path, property) {
  const found = []
  let cursor = ''
  do {
    const rows = await api(`${path}${path.includes('?') ? '&' : '?'}limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`)
    assert(Array.isArray(rows), 'Unexpected Render list response')
    found.push(...rows.map(row => row[property] || row))
    cursor = rows.length === 100 ? rows.at(-1).cursor : ''
  } while (cursor)
  return found
}
function unique(rows, name) {
  const matches = rows.filter(x => x.name === name)
  assert(matches.length <= 1, `Multiple resources named ${name}`)
  return matches[0]
}
async function waitFor(run, timeout = 900_000) {
  const end = Date.now() + timeout
  while (Date.now() < end) {
    const result = await run()
    if (result) return result
    await new Promise(r => setTimeout(r, 5000))
  }
  throw new Error('Render readiness deadline exceeded')
}
const projects = await list('/projects', 'project')
const project = unique(projects, config.project)
assert(project, 'Expected existing Render project')
const environments = await list(`/environments?projectId=${project.id}`, 'environment')
const environment = unique(environments, config.environment)
assert(environment, 'Expected existing production environment')
const anchor = unique(await list('/services', 'service'), 'skatgo')
assert(anchor?.environmentId === environment.id, 'Existing website must belong to the expected project/environment')
let service = unique(await list('/services', 'service'), config.service)
let database = unique(await list('/postgres', 'postgres'), config.database)
function checkResource(x) {
  assert.equal(x.environmentId, environment.id, 'Resource environment mismatch')
  assert.equal(x.region || x.serviceDetails?.region, config.region, 'Resource region mismatch')
}
if (service) checkResource(service)
if (database) checkResource(database)
if (action === 'inspect') {
  console.log(JSON.stringify({ project: project.id, environment: environment.id,
    service: service?.id ?? null, database: database?.id ?? null,
    quotedFixedMonthlyUSD: config.quotedFixedMonthlyUSD }, null, 2))
} else {
  git('fetch', 'origin', 'main')
  const commit = git('rev-parse', 'HEAD')
  assert.equal(commit, git('rev-parse', 'origin/main'), 'Release only the merged main head')
  if (action === 'provision') {
    assert(process.argv.includes('--approved'), 'First provisioning requires explicit human approval and --approved')
    assert(config.quotedFixedMonthlyUSD <= config.fixedMonthlyBudgetUSD, 'Resource budget exceeded')
    assert.equal(new Date().toISOString().slice(0, 10), config.pricingCheckedOn, 'Recheck current fixed prices before provisioning')
    if (!database) {
      database = await api('/postgres', 'POST', {
        name: config.database, ownerId: anchor.ownerId, environmentId: environment.id,
        plan: config.databasePlan, region: config.region, version: config.databaseVersion,
        databaseName: 'skatgo_multiplayer', databaseUser: 'skatgo_multiplayer',
        diskSizeGB: config.diskSizeGB, enableDiskAutoscaling: false,
        enableHighAvailability: false, connectionPool: 'none', ipAllowList: [],
      })
      console.log(JSON.stringify({ createdDatabase: database.id }))
    }
    await waitFor(async () => {
      database = await api(`/postgres/${database.id}`)
      return database.status === 'available'
    })
    assert.equal(database.diskSizeGB, config.diskSizeGB)
    assert.equal(database.diskAutoscalingEnabled, false)
    assert.equal(database.connectionPool, 'none', 'Session advisory locks require direct connections')
    assert.equal(database.ipAllowList.length, 0, 'External database access must be blocked')
    if (!service) {
      const connection = await api(`/postgres/${database.id}/connection-info`)
      const created = await api('/services', 'POST', {
        type: 'web_service', name: config.service, ownerId: anchor.ownerId,
        environmentId: environment.id, repo: anchor.repo, branch: 'main', autoDeploy: 'no',
        envVars: [
          { key: 'DATABASE_URL', value: connection.internalConnectionString },
          { key: 'MULTIPLAYER_ADMISSION_KEY', value: randomBytes(32).toString('hex') },
        ],
        serviceDetails: {
          runtime: 'docker', plan: config.servicePlan, region: config.region,
          numInstances: 1, healthCheckPath: '/healthz', maxShutdownDelaySeconds: 30,
          envSpecificDetails: { dockerContext: '.', dockerfilePath: './multiplayer/Dockerfile' },
          pullRequestPreviewsEnabled: 'no',
        },
      })
      service = created.service || created
      console.log(JSON.stringify({ createdService: service.id }))
    }
  }
  assert(service && database, 'Provision the approved resources first')
  checkResource(service)
  assert.equal(service.autoDeploy, 'no')
  assert.equal(service.serviceDetails.numInstances, 1)
  assert.equal(service.serviceDetails.envSpecificDetails.dockerfilePath, './multiplayer/Dockerfile')
  const deploys = () => list(`/services/${service.id}/deploys`, 'deploy')
  if (action === 'deploy') {
    const existing = (await deploys()).find(d => d.commit?.id === commit &&
      ['live', 'created', 'build_in_progress', 'update_in_progress', 'pre_deploy_in_progress'].includes(d.status))
    if (!existing) {
      const deployed = await api(`/services/${service.id}/deploys`, 'POST', { commitId: commit, clearCache: 'do_not_clear' })
      console.log(JSON.stringify({ requestedDeploy: deployed.id, commit }))
    }
  }
  const live = await waitFor(async () => {
    const rows = await deploys()
    const current = rows.find(d => d.commit?.id === commit)
    if (current && ['build_failed', 'update_failed', 'pre_deploy_failed', 'canceled', 'deactivated'].includes(current.status)) {
      throw new Error(`Deployment ${current.id} ended ${current.status}`)
    }
    return current?.status === 'live' ? current : false
  })
  const origin = service.serviceDetails.url
  assert(origin?.startsWith('https://'), 'Missing actual Render service hostname')
  await waitFor(async () => {
    for (const path of ['/healthz', '/readyz']) {
      try {
        const response = await fetch(`${origin}${path}`, { signal: AbortSignal.timeout(10_000) })
        if (!response.ok) return false
        const body = await response.json()
        if (!body.ok || !body.ready || body.version !== commit) return false
      } catch { return false }
    }
    return true
  }, 180_000)
  console.log(JSON.stringify({ service: service.id, database: database.id, origin, commit,
    deploy: live.id, status: 'live-and-ready' }, null, 2))
}
