#!/usr/bin/env node
/* The package's own machine-readable account of itself.
 *
 * `llms.txt` is this in prose, for an agent that reads. This is the same thing
 * as data, for anything that renders: the site the system ships, another
 * product's documentation, a script. Every number, prop, rule and check in it
 * comes out of the package rather than out of a sentence somebody typed, which
 * is the only way a description of a system stays true.
 *
 * It lands in `public/data/`, beside the fonts, for two reasons. The registry
 * alone is 284 KB and the seven rules files another 149 KB: bundling a third of
 * a megabyte of JSON into an app to render documentation is how a size budget
 * stops meaning anything, and as static files they are fetched per section and
 * cached. And a public endpoint is the form an agent can actually use — the
 * agent-ready audits count a fetchable artifact, not a bundled one.
 *
 * Same generate-then-check idiom as the registry and llms.txt: `--check` fails
 * when the output is stale and the gate runs it, so the account cannot drift
 * from the system it accounts for.
 *
 * Run: node scripts/gen-site-data.mjs           write public/data/
 *      node scripts/gen-site-data.mjs --check   fail if it is out of date
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const OUT = `${ROOT}/public/data`
const check = process.argv.includes('--check')

const read = (p) => JSON.parse(readFileSync(p, 'utf8'))
const ds = (p) => read(`${ROOT}/${p}`)

const registry = ds('component-registry.json')
const tokens = ds('registry/_tokens.json')
const surfaces = ds('src/components/surfaces.json')
const categories = ds('src/components/categories.json')
const { GATES } = await import(`${ROOT}/scripts/gates.mjs`)

/* Everything a reader needs to judge a component: what it is for, what it may
 * be given, what it renders. The example is kept as TEXT for the code panel;
 * the LIVE rendering comes from importing the real module, never from here. */
const entry = (name, c, kind) => ({
  name,
  kind,
  level: c.level ?? kind,
  /* What it is FOR and what it may sit on. The site needs both: one to group
   * the catalogue the way a reader looks for things, the other to show a
   * specimen on the surface it was designed against rather than on whatever
   * the documentation happens to be painted. */
  category: categories.of?.[name] ?? null,
  surface: surfaces[name] ?? null,
  description: c.description ?? '',
  props: (c.props ?? []).map((p) => ({ name: p.name, type: p.type, required: !!p.required, doc: p.doc ?? '' })),
  variants: c.variants ?? {},
  exports: c.exports ?? [],
  uses: c.uses ?? [],
  example: c.example ?? '',
  status: c.status ?? null,
})

const components = Object.entries(registry.components).map(([n, c]) => entry(n, c, 'component'))
const blocks = Object.entries(registry.blocks).map(([n, c]) => entry(n, c, 'block'))

/* The seven decision layers, whole rather than summarised: a summary is the
 * thing this data exists not to be. */
const LAYERS = [
  ['selection', 'selection-rules.json', 'Which representation a collection gets'],
  ['card', 'card-rules.json', 'Which card family, once the answer is cards'],
  ['form', 'form-rules.json', 'Which kind of form a zone that takes input is'],
  ['table', 'table-rules.json', 'Which kind of table, once the answer is a table'],
  ['cell', 'cell-rules.json', 'What one column carries, and what that decides'],
  ['page', 'page-rules.json', 'Which regions a page archetype has, and what shape its body takes'],
  ['lifecycle', 'lifecycle-rules.json', 'What the screen does to the resource'],
]
const layers = LAYERS.map(([id, file, means]) => ({ id, means, doc: ds(`screen-specs/${file}`) }))

/* How many screens were agreed before they were built, per archetype.
 *
 * A COUNT, and nothing else. The specs themselves name internal products and
 * quote their goals — "the card lives in apps/…", who the users are, what the
 * programme does — and this data ships with a package that is pushed to a
 * public repository. The fact worth publishing is that screens are agreed
 * before they are coded and how often each archetype carries one; which
 * client's screen it was is not the design system's to say (owner,
 * 2026-08-25).
 */
const NOT_A_SPEC = /(^schema|rules|\.schema)\.json$/
const specCounts = {}
let specTotal = 0
for (const f of readdirSync(`${ROOT}/screen-specs`).filter((f) => f.endsWith('.json') && !NOT_A_SPEC.test(f))) {
  const a = ds(`screen-specs/${f}`).archetype
  specTotal += 1
  if (a) specCounts[a] = (specCounts[a] ?? 0) + 1
}

/* Every step of THIS package's gate, with the reason each one runs.
 *
 * Deliberately not the other packages. `checks.json` knows them, and naming
 * them here would publish a list of internal project names on a site that ships
 * with a package pushed to a public repository — which is exactly the client
 * material the monorepo contract keeps out of it (owner, 2026-08-25). That
 * other products in this repository carry their own gates is true and is not
 * this package's business to announce.
 */
const gate = {
  steps: GATES.map((g) => ({ run: g.run, why: g.why, lane: g.lane ?? 'main', ci: g.ci !== false, after: g.after ?? null })),
}

const ruleCount = layers.reduce(
  (n, l) => n + ['rules', 'hard', 'detailRules', 'editRules', 'deleteRules'].reduce((m, k) => m + (l.doc[k]?.length ?? 0), 0),
  0,
)
const facts = {
  components: components.length,
  blocks: blocks.length,
  tokens: Object.keys(tokens.tokens ?? tokens).length,
  decisionLayers: layers.length,
  decisionRules: ruleCount,
  specs: specTotal,
  gateSteps: gate.steps.length,
  examples: [...components, ...blocks].filter((c) => c.example).length,
}

/* WHAT AN AGENT CAN READ, CALL AND BE HELD TO.
 *
 * The three surfaces an agent meets this package through, each read from the
 * thing itself rather than described: the files it can fetch (with their real
 * size, because a context budget is the constraint that decides whether an
 * agent reads them at all), the tools it can call over MCP (imported from the
 * server, so a tool that is renamed is renamed here), and the checks that hold
 * what it produces (the gate steps that fail on invented components, invented
 * props, an unagreed screen or a rule the output broke).
 */
const { TOOLS } = await import(`${ROOT}/mcp/tools.mjs`)
const READABLE = [
  ['component-index.md', 'Every component, one line each. The file discovery starts from.'],
  ['llms.txt', 'The whole contract in prose, for an agent that reads rather than calls.'],
  ['component-registry.json', 'Every component\'s full contract: props, allowed values, the golden example.'],
  ['public/data/layers.json', 'The seven decision layers, whole — the rules the gate enforces.'],
]
const kb = (p) => (existsSync(`${ROOT}/${p}`) ? Math.round(readFileSync(`${ROOT}/${p}`, 'utf8').length / 1024) : null)
/* A step counts as holding an agent when it fails on what an agent produces
 * rather than on how the package is built: an invented component, an invented
 * prop, a screen nobody agreed, a rule the output broke. */
const HOLDS = ['gen-registry:check', 'check:spec', 'lint:rules', 'eval', 'redteam', 'lint:vocab', 'verify']
const agents = {
  reads: READABLE.map(([path, why]) => ({ path, why, kb: kb(path) })),
  calls: TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    args: Object.keys(t.inputSchema?.properties ?? {}),
  })),
  heldBy: gate.steps.filter((s) => HOLDS.includes(s.run)),
}

const FILES = {
  'facts.json': facts,
  'categories.json': categories,
  'components.json': { components, blocks },
  'layers.json': { layers },
  'specs.json': { counts: specCounts, total: specTotal },
  'gate.json': gate,
  'agents.json': agents,
  'tokens.json': tokens,
}

const HEAD = 'GENERATED by scripts/gen-site-data.mjs. Do not edit: run the script.'
const stale = []
mkdirSync(OUT, { recursive: true })
for (const [name, data] of Object.entries(FILES)) {
  const body = JSON.stringify({ '//': HEAD, ...data })
  const path = `${OUT}/${name}`
  const current = existsSync(path) ? readFileSync(path, 'utf8') : null
  if (check) { if (current !== body) stale.push(name); continue }
  writeFileSync(path, body)
}

if (check) {
  if (stale.length) {
    console.error(`\x1b[31m✗ public/data is out of date (${stale.join(', ')}). Run \`npm run gen:data\` and commit the result.\x1b[0m`)
    process.exit(1)
  }
  console.log('\x1b[32m✓\x1b[0m the published data matches the package.')
} else {
  const kb = Object.keys(FILES).map((n) => `${n} ${Math.round(readFileSync(`${OUT}/${n}`, 'utf8').length / 1024)}KB`)
  console.log(`\x1b[32m✓\x1b[0m wrote public/data — ${kb.join(', ')}`)
  console.log(`  ${facts.components} components, ${facts.blocks} blocks, ${facts.decisionRules} rules across ${facts.decisionLayers} layers, ${facts.gateSteps} gate steps, ${agents.calls.length} MCP tools`)
}
