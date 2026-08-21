/* Validates screen specs against the design system.
 *
 * A screen spec is the step between "build me the documents screen" and code:
 * zones, the components each zone uses, and the states that are not the happy
 * path. Cheap to write, cheap to argue with, and — unlike a mockup — checkable:
 * every component it names must exist in the registry, every pinned prop value
 * must be legal, and the template must be a real block. A spec that passes this
 * cannot ask for a screen the system is unable to build.
 *
 * Three questions, and they arrived one at a time:
 *
 *   1. Is the screen POSSIBLE? Every component named exists in the registry,
 *      every pinned prop value is legal, the template is a real block. A spec
 *      that passes cannot ask for a screen the system is unable to build.
 *   2. Is the screen TRUE? If the spec names an `implementation` file, that file
 *      has to actually use the template and the components. Without this a spec
 *      is a wish that stays green while the screen drifts away from it — which
 *      is what the one existing spec had already done: it names ListPageTemplate
 *      and the screen never adopted it.
 *   3. Is the screen APPROPRIATE? (2026-08-20) A zone that declares its task and
 *      the shape of its data may only use a representation the rules in
 *      screen-specs/selection-rules.json choose for that pair — cards where the
 *      job is comparing fields is now a failure, not a taste. The spec author
 *      supplies the judgment (task, data), the reviewer approves it, and this
 *      check holds the components to it. Same move for priority: the first zone
 *      that `answers` a question must answer the `primaryQuestion`, and one
 *      screen carries at most one primary action per zone.
 *
 * Run: npm run check:spec            all specs in screen-specs/
 *      npm run check:spec -- <file>  one spec
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { makeRuleEngine, checkPriority, checkPrimaryActions, checkContentModel } from './lib/spec-rules.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const DIR = `${ROOT}/screen-specs`
/* Screens live in the products too, and `apps/` is NOT versioned by this
 * repository (each app carries its own git remote, and /apps is gitignored
 * here). So an implementation path into an app resolves from the monorepo root
 * rather than from this package, and its absence is a note rather than a
 * failure: on a machine with the app checked out the spec is verified like any
 * other, and on a clone without it the spec stays a wish instead of turning the
 * gate red for a file that was never supposed to be here. */
const REPO = fileURLToPath(new URL('../../..', import.meta.url)).replace(/\/$/, '')
const isAppPath = (p) => p.startsWith('apps/')
/* A repo-relative path, resolved from wherever it actually lives. Returns null
 * for an app path on a checkout that does not have that app: unverifiable is not
 * the same as wrong. */
const resolveRepoPath = (p) => {
  const full = `${isAppPath(p) ? REPO : ROOT}/${p}`
  if (isAppPath(p) && !existsSync(`${REPO}/${p.split('/').slice(0, 2).join('/')}`)) return null
  return full
}

/* Behaviour coverage, across every spec. Printed at the end whatever happens:
 * "9 screens, 5 of them say what they DO" is the number that says how much of
 * the contract is still only about structure. */
let behaviourCount = 0
let proven = 0
const pending = []

const registry = JSON.parse(readFileSync(`${ROOT}/component-registry.json`, 'utf8'))
const entries = { ...registry.components, ...registry.blocks }

/* every importable name -> the entry that documents it */
const owner = new Map()
for (const entry of Object.values(entries)) {
  owner.set(entry.ref, entry)
  for (const e of entry.exports ?? []) owner.set(e, entry)
}
const blocks = Object.keys(registry.blocks ?? {})

const REQUIRED_KEYS = ['id', 'title', 'goal', 'template', 'zones', 'states']
const STATE_KEYS = ['loading', 'empty', 'error', 'noPermission']

/* The decision layer: which representation fits which task and data shape.
 * The rules live in screen-specs/selection-rules.json as data and the engine in
 * scripts/lib/spec-rules.mjs, shared with the test that proves it can fail and
 * with the MCP server — this file only runs it. The JSON schema reaches
 * editors; this is the gate. */
const rulesDoc = JSON.parse(readFileSync(`${DIR}/selection-rules.json`, 'utf8'))
const engine = makeRuleEngine(rulesDoc)

/* The rules file may not rot: a representation built on a component the
 * registry no longer has would silently stop matching, so that is a failure of
 * the rules file itself, reported before any spec is read. */
const rulesFileProblems = engine.representationComponents
  .filter((c) => !owner.has(c))
  .map((c) => `selection-rules.json: a representation names <${c}>, which is not in the registry`)

/* Coverage across every spec, printed at the end like the behaviour line: a
 * collection zone that names no task is a zone the rules cannot see. */
let questionCount = 0
let acceptanceCount = 0
const unchecked = []

function validate(name, spec) {
  const out = []
  const notes = []
  const fail = (msg) => out.push(msg)

  /* Does the code agree? Optional, because a spec is written BEFORE the screen
   * exists — that is the point of it. Once `implementation` is filled in, the
   * spec stops being a wish and starts being a claim that can be wrong. */
  if (spec.implementation) {
    /* One screen, possibly several modules. A page that outgrows the 600-line
     * rule has to split — usually the card comes out — and the two rules used to
     * contradict each other: splitting the file made every component the card
     * owns read as "the screen does not use it". `implementation` therefore
     * takes a path OR a list of paths, and the check reads them as one screen. */
    const paths = Array.isArray(spec.implementation) ? spec.implementation : [spec.implementation]
    const label = paths.join(' + ')
    const missingFiles = paths.filter((p) => !existsSync(`${isAppPath(p) ? REPO : ROOT}/${p}`))
    if (missingFiles.length) {
      /* "Not on disk" means two different things and only one of them is fine.
       *
       * The apps carry their own git repositories and /apps/ is ignored here, so a
       * checkout without them cannot verify anything: that is a note. But when the
       * app IS checked out and the file is not there, the pointer is stale, and a
       * note is the wrong answer to that. `program-coach` sat unverified for
       * exactly as long as it took to rename ProgramCoachPage to CoachPage, and
       * nothing said so: renaming a file silently switched its spec off.
       *
       * The app folder is the discriminator, so the two cases separate cleanly. */
      const appOf = (p) => p.split('/').slice(0, 2).join('/')
      const unverifiable = missingFiles.filter((p) => isAppPath(p) && !existsSync(`${REPO}/${appOf(p)}`))
      const stale = missingFiles.filter((p) => !unverifiable.includes(p))
      if (unverifiable.length) notes.push(`implementation "${unverifiable.join(', ')}" is not checked out here — spec unverified against code`)
      if (stale.length) fail(`implementation "${stale.join(', ')}" does not exist — the spec points at a file that has moved or been renamed`)
    } else {
      const src = paths.map((p) => readFileSync(`${isAppPath(p) ? REPO : ROOT}/${p}`, 'utf8')).join('\n')
      const uses = (n) => new RegExp(`\\b${n}\\b`).test(src)
      if (spec.template && spec.template !== 'custom' && !uses(spec.template)) {
        /* A written `_templateNote` turns this from a failure into a recorded
         * divergence, the same way ALLOW maps work elsewhere here: the gap stays
         * visible in every run instead of being deleted to get green, and a
         * spec cannot drift silently — only deliberately. */
        if (spec._templateNote) notes.push(`names <${spec.template}> but is built by hand — ${spec._templateNote}`)
        else fail(`spec says the screen is built on <${spec.template}>, and ${label} does not use it`)
      }
      const named = new Set()
      for (const zone of spec.zones ?? []) {
        for (const c of zone.components ?? []) named.add(String(c).split(' ')[0])
      }
      const missing = [...named].filter((n) => !uses(n))
      if (missing.length) {
        fail(`${label} does not use: ${missing.join(', ')}`)
      }
    }
  }

  /* Behaviours: what the screen DOES, and the test that proves it.
   *
   * The zones say what a screen is made of, which is the half a registry can
   * check. This is the other half, and it is the one a client's requirement is
   * actually written in. It stays honest the same way everything else here does:
   * a scenario names the test that proves it, the test carries `<spec>#<id>` in
   * its name, and this fails when the file is gone or the claim is not in it. A
   * scenario nobody has got to yet says so in `pendingReason` and is counted out
   * loud on every run — the one thing it may not do is be quiet. */
  const seenBehaviours = new Set()
  for (const b of spec.behaviours ?? []) {
    if (!b.id || !/^[a-z0-9-]+$/.test(b.id)) { fail(`behaviour id "${b.id ?? ''}" must be a slug`); continue }
    if (seenBehaviours.has(b.id)) fail(`two behaviours share the id "${b.id}"`)
    seenBehaviours.add(b.id)
    for (const key of ['given', 'when', 'then']) {
      if (!b[key]) fail(`behaviour "${b.id}" has no "${key}"`)
    }
    const claim = `${spec.id ?? name}#${b.id}`
    if (b.provenBy) {
      const path = resolveRepoPath(b.provenBy)
      if (!path) {
        notes.push(`behaviour "${b.id}" is proven by ${b.provenBy}, which is not checked out here`)
      } else if (!existsSync(path)) {
        fail(`behaviour "${b.id}": ${b.provenBy} does not exist`)
      } else if (!readFileSync(path, 'utf8').includes(claim)) {
        fail(`behaviour "${b.id}": ${b.provenBy} does not claim "${claim}" — put it in the test name, or the link is prose`)
      } else {
        proven++
      }
    } else if (b.pendingReason) {
      pending.push(`${name}#${b.id}: ${b.pendingReason}`)
    } else {
      fail(`behaviour "${b.id}" names neither a test that proves it nor a reason it is still pending`)
    }
    behaviourCount++
  }

  for (const key of REQUIRED_KEYS) {
    if (spec[key] === undefined) fail(`missing "${key}"`)
  }
  if (spec.id && !/^[a-z0-9-]+$/.test(spec.id)) fail(`id "${spec.id}" must be a slug (a-z, 0-9, dashes)`)
  if (spec.id && name !== spec.id) fail(`id "${spec.id}" does not match the file name "${name}"`)

  /* Template: a real block, or an explicit, reasoned escalation. */
  if (spec.template === 'custom') {
    if (!spec.customReason) fail('template is "custom" but customReason is missing — say why no block fits')
  } else if (spec.template && !blocks.includes(spec.template)) {
    fail(`template "${spec.template}" is not a block (available: ${blocks.join(', ')}, or "custom" with customReason)`)
  }

  /* Zones: every component named must exist, every pinned value must be legal. */
  for (const zone of spec.zones ?? []) {
    if (!zone.name) fail('a zone has no name')
    if (!zone.components?.length) fail(`zone "${zone.name}" lists no components`)
    for (const ref of zone.components ?? []) {
      const [component, ...pins] = ref.split(/\s+/)
      const entry = owner.get(component)
      if (!entry) {
        fail(`zone "${zone.name}": <${component}> is not in the registry`)
        continue
      }
      if (entry.status === 'deprecated') fail(`zone "${zone.name}": <${component}> is deprecated, do not build on it`)
      for (const pin of pins) {
        const [prop, value] = pin.split('=')
        const declared = (entry.props ?? []).find((p) => p.name === prop)
        if (!declared) {
          fail(`zone "${zone.name}": <${component} ${prop}> — no such prop`)
          continue
        }
        if (value && declared.values?.length && !declared.values.map(String).includes(value)) {
          fail(`zone "${zone.name}": <${component} ${prop}="${value}"> — allowed values are ${declared.values.join(' | ')}`)
        }
      }
    }
  }

  /* The decision layer: is the screen APPROPRIATE, not merely possible.
   * Everything here fires only on what the spec declares — task, data, answers,
   * archetype — because a check on prose would be a check on adjectives. The
   * declarations are exactly what the spec review approves, so the gate holds
   * the components to an agreed judgment rather than inventing its own. The
   * logic lives in scripts/lib/spec-rules.mjs, shared with the test that proves
   * every one of these checks can go red. */
  const allComponents = new Set(
    (spec.zones ?? []).flatMap((z) => (z.components ?? []).map((c) => String(c).split(' ')[0])),
  )
  const collect = ({ problems, notes: n }) => { problems.forEach(fail); n.forEach((x) => notes.push(x)) }
  for (const [i, a] of (spec.acceptance ?? []).entries()) {
    if (typeof a !== 'string' || !a.trim()) fail(`acceptance[${i}] is empty — a criterion nobody can verify is not a criterion`)
  }
  if (spec.acceptance?.length) acceptanceCount++
  collect(engine.checkArchetype(spec, allComponents))
  collect(checkPrimaryActions(spec.zones))
  collect(checkPriority(spec))
  if (spec.primaryQuestion) questionCount++
  for (const zone of spec.zones ?? []) {
    const r = engine.checkZone(zone)
    collect(r)
    if (r.unchecked) unchecked.push(`${name}/${zone.name}`)
  }

  /* States: the ones that exist must be described in terms of a real component,
   * because "shows an error" is where hand-rolled markup gets in. */
  for (const [key, text] of Object.entries(spec.states ?? {})) {
    if (!STATE_KEYS.includes(key)) fail(`unknown state "${key}" (use: ${STATE_KEYS.join(', ')})`)
    if (typeof text !== 'string' || !text.trim()) { fail(`state "${key}" is empty`); continue }
    const named = [...owner.keys()].filter((c) => new RegExp(`\\b${c}\\b`).test(text))
    if (!named.length) fail(`state "${key}" names no component — say which one renders it (e.g. "EmptyState with icon=folder")`)
  }
  if (spec.states && !spec.states.empty) fail('states.empty is required — every list, table and search has an empty case')

  return { problems: out, notes }
}

const arg = process.argv[2]
const files = arg
  ? [arg]
  : existsSync(DIR)
    ? readdirSync(DIR).filter((f) => f.endsWith('.json') && f !== 'schema.json' && !f.endsWith('.schema.json') && f !== 'selection-rules.json').map((f) => `${DIR}/${f}`)
    : []

if (!files.length) {
  console.log('No screen specs to check (screen-specs/*.json).')
  process.exit(0)
}

console.log('\x1b[1mScreen specs\x1b[0m\n')
let failed = 0
const parsedSpecs = {}
if (rulesFileProblems.length) {
  failed++
  console.log(`  \x1b[31m✗ selection-rules\x1b[0m (${rulesFileProblems.length})`)
  for (const p of rulesFileProblems) console.log(`      ${p}`)
}
for (const file of files) {
  const name = file.split('/').pop().replace(/\.json$/, '')
  let spec
  try {
    spec = JSON.parse(readFileSync(file, 'utf8'))
  } catch (e) {
    console.log(`  \x1b[31m✗ ${name}\x1b[0m — not valid JSON: ${e.message}`)
    failed++
    continue
  }
  parsedSpecs[name] = spec
  const { problems, notes } = validate(name, spec)
  for (const n of notes) console.log(`  \x1b[33m!\x1b[0m ${name} \x1b[2m${n}\x1b[0m`)
  if (!problems.length) {
    console.log(`  \x1b[32m✓\x1b[0m ${name} \x1b[2m${spec.title ?? ''}\x1b[0m`)
    continue
  }
  failed++
  console.log(`  \x1b[31m✗ ${name}\x1b[0m (${problems.length})`)
  for (const p of problems) console.log(`      ${p}`)
}
console.log('')

/* Content models: the ORCA-lite layer above the specs. Only when the whole
 * folder is being checked — a single-file run has no honest specsById to
 * verify a model against. Reverse coverage runs here rather than in the
 * engine because it needs the implementation paths: a spec that builds into
 * apps/<model.id>/ and is claimed by no object is a screen the model does not
 * know it has. */
let modelCount = 0
let objectCount = 0
if (!arg && existsSync(`${DIR}/models`)) {
  const modelFiles = readdirSync(`${DIR}/models`).filter((f) => f.endsWith('.json'))
  for (const file of modelFiles) {
    const name = file.replace(/\.json$/, '')
    let model
    try {
      model = JSON.parse(readFileSync(`${DIR}/models/${file}`, 'utf8'))
    } catch (e) {
      console.log(`  \x1b[31m✗ model ${name}\x1b[0m — not valid JSON: ${e.message}`)
      failed++
      continue
    }
    const { problems, notes, claimed } = checkContentModel(model, parsedSpecs)
    const untraced = Object.entries(parsedSpecs)
      .filter(([id, s]) => {
        const paths = Array.isArray(s.implementation) ? s.implementation : [s.implementation].filter(Boolean)
        return (s.project === model.id || paths.some((p) => String(p).startsWith(`apps/${model.id}/`))) && !claimed.has(id)
      })
      .map(([id]) => id)
    for (const id of untraced) notes.push(`spec "${id}" belongs to apps/${model.id}/ and no object claims it — the model does not know this screen exists`)

    /* Core attributes against the CODE, not only the spec text: the spec check
     * is a word match and prose can satisfy it by accident, so when the
     * object's screen has its implementation checked out, each core attribute
     * is looked for there too. A miss is a note rather than a failure — code
     * may carry the field under another name, and renaming rules are not this
     * check's to invent. */
    for (const [objName, o] of Object.entries(model.objects ?? {})) {
      const home = o.screens?.detail ?? o.screens?.collection
      const spec = home ? parsedSpecs[home] : null
      if (!spec?.implementation) continue
      const paths = Array.isArray(spec.implementation) ? spec.implementation : [spec.implementation]
      const sources = paths
        .map((p) => resolveRepoPath(p))
        .filter((p) => p && existsSync(p))
        .map((p) => readFileSync(p, 'utf8'))
      if (!sources.length) continue
      const src = sources.join('\n')
      const missing = (o.attributes?.core ?? []).filter((attr) => !new RegExp(`\\b${attr}\\b`, 'i').test(src))
      if (missing.length) notes.push(`object "${objName}": core attribute(s) ${missing.join(', ')} not found in the code of "${home}" — rendered under another name, or dropped`)
    }
    modelCount++
    objectCount += Object.keys(model.objects ?? {}).length
    for (const n of notes) console.log(`  \x1b[33m!\x1b[0m model ${name} \x1b[2m${n}\x1b[0m`)
    if (problems.length) {
      failed++
      console.log(`  \x1b[31m✗ model ${name}\x1b[0m (${problems.length})`)
      for (const p of problems) console.log(`      ${p}`)
    } else {
      console.log(`  \x1b[32m✓\x1b[0m model ${name} \x1b[2m${model.title ?? ''}\x1b[0m`)
    }
  }
  if (modelFiles.length) console.log('')
}

/* What the specs say about behaviour, said out loud. A count nobody prints is a
 * count nobody acts on, and this one is the distance between "the screen is made
 * of the right parts" and "the screen does what was agreed". */
const withBehaviours = files.filter((f) => {
  try { return (JSON.parse(readFileSync(f, 'utf8')).behaviours ?? []).length > 0 } catch { return false }
}).length
console.log(`  \x1b[2mbehaviour: ${behaviourCount} scenario(s) across ${withBehaviours}/${files.length} screens; ${proven} proven by a test, ${pending.length} pending\x1b[0m`)
console.log(`  \x1b[2mdecision: ${questionCount}/${files.length} screens name their primaryQuestion; ${acceptanceCount}/${files.length} carry acceptance criteria; ${unchecked.length} collection zone(s) the rules cannot see${modelCount ? `; ${modelCount} content model(s), ${objectCount} object(s)` : ''}\x1b[0m`)
for (const z of unchecked) console.log(`      \x1b[33m!\x1b[0m \x1b[2m${z} shows a collection but names no task — say what the user does there and the representation rules apply\x1b[0m`)
for (const p of pending) console.log(`      \x1b[33m!\x1b[0m \x1b[2m${p}\x1b[0m`)
if (withBehaviours < files.length) {
  console.log(`  \x1b[2m${files.length - withBehaviours} screen(s) describe only what they are MADE OF. A spec with no behaviours cannot be wrong, which is why it is worth so little.\x1b[0m`)
}
console.log('')

if (failed) {
  console.error(`\x1b[31m✗ ${failed} spec(s) do not match the design system.\x1b[0m`)
  process.exit(1)
}
console.log('\x1b[32m✓ all screen specs check out.\x1b[0m')
