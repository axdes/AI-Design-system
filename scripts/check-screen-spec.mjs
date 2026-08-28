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
import { makeLifecycleEngine, makeRuleEngine, makeCardEngine, makeFormEngine, makeTableEngine, makeCellEngine, checkPriority, checkPrimaryActions, checkContentModel } from './lib/spec-rules.mjs'

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

/* The layer under "cards": which FAMILY of card, chosen by what it carries and
 * what the reader does with it. Same shape as above — data in
 * screen-specs/card-rules.json, engine in lib, this file only runs it. */
const cardDoc = JSON.parse(readFileSync(`${DIR}/card-rules.json`, 'utf8'))
const cards = makeCardEngine(cardDoc, { collectionTasks: rulesDoc.collectionTasks })

/* Same rot check, one level down: a family built from a component the registry
 * does not have would quietly stop being buildable. A family still `planned`
 * is allowed to name components that do not exist yet — that is what planned
 * means — and the gate rejects USING one, which is the part that matters. */
for (const f of cardDoc.families ?? []) {
  if (f.status === 'planned') continue
  for (const c of f.components?.required ?? []) {
    if (!owner.has(c) && !blocks.includes(c)) {
      rulesFileProblems.push(`card-rules.json: family "${f.id}" is built from <${c}>, which is not in the registry`)
    }
  }
}
for (const r of cardDoc.rules ?? []) {
  for (const id of r.choose ?? []) {
    if (!cards.familyIds.includes(id)) rulesFileProblems.push(`card-rules.json: rule ${r.id} chooses family "${id}", which does not exist`)
  }
}

/* The layer on the other side of the screen: which KIND of form a zone that
 * takes input is, chosen by its size, its familiarity, its context and how it
 * commits. Data in screen-specs/form-rules.json, engine in lib, this file only
 * runs it. */
const formDoc = JSON.parse(readFileSync(`${DIR}/form-rules.json`, 'utf8'))
const forms = makeFormEngine(formDoc)

/* Same rot check, one layer along: a kind built from a component the registry
 * does not have would quietly stop being buildable. `planned` kinds are allowed
 * to name what does not exist yet — that is what planned means — and the gate
 * rejects USING one. */
for (const [id, kind] of Object.entries(formDoc.formKinds ?? {})) {
  if (kind.status === 'planned') continue
  for (const c of [...(kind.components?.required ?? []), ...(kind.templates ?? [])]) {
    if (!owner.has(c) && !blocks.includes(c)) {
      rulesFileProblems.push(`form-rules.json: kind "${id}" is built from <${c}>, which is not in the registry`)
    }
  }
}
for (const r of formDoc.rules ?? []) {
  for (const id of r.choose ?? []) {
    if (!forms.kindIds.includes(id)) rulesFileProblems.push(`form-rules.json: rule ${r.id} chooses kind "${id}", which does not exist`)
  }
}
for (const h of formDoc.hard ?? []) {
  for (const id of [...(h.forbid ?? []), h.instead].filter(Boolean)) {
    if (!forms.kindIds.includes(id)) rulesFileProblems.push(`form-rules.json: hard rule ${h.id} names kind "${id}", which does not exist`)
  }
}

/* The layer under "table": which KIND of table a zone that shows one is,
 * chosen by what a row is, what the reader does, how many rows there are and
 * whether a cell interacts. Data in screen-specs/table-rules.json, engine in
 * lib, this file only runs it. */
const tableDoc = JSON.parse(readFileSync(`${DIR}/table-rules.json`, 'utf8'))
const tables = makeTableEngine(tableDoc)

for (const [id, kind] of Object.entries(tableDoc.tableKinds ?? {})) {
  if (kind.status === 'planned') continue
  for (const c of kind.components?.required ?? []) {
    if (!owner.has(c) && !blocks.includes(c)) {
      rulesFileProblems.push(`table-rules.json: kind "${id}" is built from <${c}>, which is not in the registry`)
    }
  }
}
for (const r of tableDoc.rules ?? []) {
  for (const id of r.choose ?? []) {
    if (!tables.kindIds.includes(id)) rulesFileProblems.push(`table-rules.json: rule ${r.id} chooses kind "${id}", which does not exist`)
  }
}
for (const h of tableDoc.hard ?? []) {
  for (const id of [...(h.forbid ?? []), h.instead].filter(Boolean)) {
    if (!tables.kindIds.includes(id)) rulesFileProblems.push(`table-rules.json: hard rule ${h.id} names kind "${id}", which does not exist`)
  }
}

/* A family that decides nothing a reader can SEE is a rule without a picture.
 * card-rules.json names 31 of them and, until 2026-08-25, the system rendered
 * none: a family is a composition, so no component's golden example is one.
 * src/specimens/cards.tsx holds them. It fails BOTH ways: a family with no
 * specimen, and a specimen for a family that does not exist.
 *
 * The first half was a warning until 2026-08-26 — right while the specimens
 * were being written family by family, since a gate that went red on the first
 * one would have stopped them being written at all, and wrong from the moment
 * the last one landed. A mutation test is what found it: deleting a specimen
 * left the gate green and printed "30/31" in grey. Coverage that only counts
 * is not a check. */
const readSpecimens = (file) => {
  /* Two things a coverage check must not care about: how the key is quoted, and
     how the body is written. 'verified-confirm' cannot be a bare identifier,
     and `() => column(...)` is as much a specimen as `() => (…)`. The old
     pattern demanded a parenthesised body and reported three real specimens as
     missing across three layers before anyone noticed it was the READER that
     was wrong (2026-08-26). Anything at the map's own indent counts. */
  const src = readFileSync(`${DIR}/../src/specimens/${file}`, 'utf8')
  return [...src.matchAll(/^ {2}'?([a-z-]+)'?: \(\) =>/gm)].map((m) => m[1])
}
const specimenIds = readSpecimens('cards.tsx')
const formSpecimenIds = readSpecimens('forms.tsx')
const tableSpecimenIds = readSpecimens('tables.tsx')
const cellSpecimenIds = readSpecimens('cells.tsx')
const familyIds = (cardDoc.families ?? []).map((f) => f.id)
for (const id of specimenIds) {
  if (!familyIds.includes(id)) rulesFileProblems.push(`src/specimens/cards.tsx: specimen "${id}" is not a card family`)
}
const missingSpecimens = familyIds.filter((id) => !specimenIds.includes(id))
for (const id of missingSpecimens) {
  rulesFileProblems.push(`src/specimens/cards.tsx: card family "${id}" has no specimen — the rules can choose it and nobody has seen it`)
}

/* Forms and tables are held to the same standard as the card families: a kind
 * the rules can choose and nobody has ever seen is a rule taught blind. They
 * had no specimens at all until 2026-08-26, which is why this is a check and
 * not a note — the coverage went to 18/18 and 20/20 the day it was written, so
 * anything less from here is a regression, not a backlog. */
const formKindIds = Object.keys(formDoc.formKinds ?? {})
const tableKindIds = Object.keys(tableDoc.tableKinds ?? {})
for (const id of formSpecimenIds) {
  if (!formKindIds.includes(id)) rulesFileProblems.push(`src/specimens/forms.tsx: specimen "${id}" is not a form kind`)
}
for (const id of tableSpecimenIds) {
  if (!tableKindIds.includes(id)) rulesFileProblems.push(`src/specimens/tables.tsx: specimen "${id}" is not a table kind`)
}
for (const id of formKindIds.filter((k) => !formSpecimenIds.includes(k))) {
  rulesFileProblems.push(`src/specimens/forms.tsx: form kind "${id}" has no specimen — the rules can choose it and nobody has seen it`)
}
for (const id of tableKindIds.filter((k) => !tableSpecimenIds.includes(k))) {
  rulesFileProblems.push(`src/specimens/tables.tsx: table kind "${id}" has no specimen — the rules can choose it and nobody has seen it`)
}

/* The LIFECYCLE layer: what the screen DOES to the resource, and the three
 * decisions that hang off it — which variant of a detail page, which shape an
 * edit takes, how hard a destruction is to confirm. Data in
 * screen-specs/lifecycle-rules.json, engine in lib, this file only runs it. */
const lifeDoc = JSON.parse(readFileSync(`${DIR}/lifecycle-rules.json`, 'utf8'))
const life = makeLifecycleEngine(lifeDoc)

/* The same rot check the layers beside it get: a kind built from a component
 * the registry does not have would quietly stop being buildable. `planned`
 * kinds are allowed to name what does not exist yet — that is what planned
 * means — and using one is what the gate rejects. */
for (const [group, kinds] of [['detailVariants', lifeDoc.detailVariants], ['editKinds', lifeDoc.editKinds], ['deleteKinds', lifeDoc.deleteKinds]]) {
  for (const [id, kind] of Object.entries(kinds ?? {})) {
    if (kind.status === 'planned') continue
    for (const c of [...(kind.components?.required ?? []), ...(kind.components?.oneOf ?? [])]) {
      if (!owner.has(c) && !blocks.includes(c)) {
        rulesFileProblems.push(`lifecycle-rules.json: ${group} "${id}" is built from <${c}>, which is not in the registry`)
      }
    }
  }
}
for (const [group, rules, ids] of [['detailRules', lifeDoc.detailRules, life.detailIds], ['editRules', lifeDoc.editRules, life.editIds], ['deleteRules', lifeDoc.deleteRules, life.deleteIds]]) {
  for (const r of rules ?? []) {
    for (const id of r.choose ?? []) {
      if (!ids.includes(id)) rulesFileProblems.push(`lifecycle-rules.json: ${group} rule ${r.id} chooses "${id}", which does not exist`)
    }
  }
}
for (const h of lifeDoc.hard ?? []) {
  for (const id of [...(h.forbid ?? []), h.instead].filter(Boolean)) {
    if (!life.deleteIds.includes(id)) rulesFileProblems.push(`lifecycle-rules.json: hard rule ${h.id} names delete kind "${id}", which does not exist`)
  }
}
/* And the cross-check that keeps the two axes in step: every archetype the
 * shape layer knows has to say which stages it serves, and no other. */
for (const id of Object.keys(rulesDoc.archetypes ?? {})) {
  if (!lifeDoc.archetypeStages?.[id]) rulesFileProblems.push(`lifecycle-rules.json: archetype "${id}" exists in selection-rules.json and names no lifecycle stage`)
}
for (const [id, stages] of Object.entries(lifeDoc.archetypeStages ?? {})) {
  if (!rulesDoc.archetypes?.[id]) rulesFileProblems.push(`lifecycle-rules.json: archetypeStages names "${id}", which is not an archetype`)
  for (const st of stages) {
    if (!life.stageIds.includes(st)) rulesFileProblems.push(`lifecycle-rules.json: archetype "${id}" names stage "${st}", which does not exist`)
  }
}

/* The GEOMETRY layer: which regions a page archetype has, which it may not
 * have, and what shape its body takes. Data in screen-specs/page-rules.json,
 * rendered by blocks/Page. Two ways this file can rot, and both are checked
 * here rather than discovered on a screen:
 *   1. it names a component, a shape or a region that does not exist, and
 *   2. it disagrees with the PRESETS table inside Page.tsx, which is the same
 *      decision at runtime — an archetype that means one thing to the gate and
 *      another on screen is worse than no rule at all. */
const pageDoc = JSON.parse(readFileSync(`${DIR}/page-rules.json`, 'utf8'))
const pageRegions = Object.keys(pageDoc.regions ?? {})
const pageShapes = Object.keys(pageDoc.shapes ?? {})
const pageWidths = Object.keys(pageDoc.widths ?? {})
const REGION_STATES = ['required', 'optional', 'forbidden']

for (const [id, region] of Object.entries(pageDoc.regions ?? {})) {
  if (region.carries === 'anything') continue
  for (const c of region.carries ?? []) {
    if (!owner.has(c) && !blocks.includes(c)) {
      rulesFileProblems.push(`page-rules.json: region "${id}" carries <${c}>, which is not in the registry`)
    }
  }
  for (const sh of region.onlyWithShape ?? []) {
    if (!pageShapes.includes(sh)) rulesFileProblems.push(`page-rules.json: region "${id}" names shape "${sh}", which does not exist`)
  }
}

/* page-rules and selection-rules name the SAME archetypes, and until 2026-08-23
 * they quietly did not: one said `status`, the other `system`. Two files with
 * two names for one archetype is the rot every cross-check here exists to
 * stop, so the two vocabularies are held equal. */
for (const id of Object.keys(rulesDoc.archetypes ?? {})) {
  if (!pageDoc.archetypes?.[id]) rulesFileProblems.push(`page-rules.json: archetype "${id}" exists in selection-rules.json and has no geometry here`)
}
for (const id of Object.keys(pageDoc.archetypes ?? {})) {
  if (!rulesDoc.archetypes?.[id]) rulesFileProblems.push(`page-rules.json: archetype "${id}" is not an archetype in selection-rules.json`)
}
for (const [id, a] of Object.entries(pageDoc.archetypes ?? {})) {
  if (a.carriedBy && !owner.has(a.carriedBy) && !blocks.includes(a.carriedBy)) {
    rulesFileProblems.push(`page-rules.json: archetype "${id}" is carried by <${a.carriedBy}>, which is not in the registry`)
  }
  if (!pageShapes.includes(a.shape)) rulesFileProblems.push(`page-rules.json: archetype "${id}" has shape "${a.shape}", which does not exist`)
  if (!pageWidths.includes(a.width)) rulesFileProblems.push(`page-rules.json: archetype "${id}" has width "${a.width}", which does not exist`)
  for (const [region, state] of Object.entries(a.regions ?? {})) {
    if (!pageRegions.includes(region)) rulesFileProblems.push(`page-rules.json: archetype "${id}" names region "${region}", which does not exist`)
    if (!REGION_STATES.includes(state)) rulesFileProblems.push(`page-rules.json: archetype "${id}" gives region "${region}" the state "${state}" — use ${REGION_STATES.join(' | ')}`)
  }
  for (const c of a.toolbarForbids ?? []) {
    if (!owner.has(c) && !blocks.includes(c)) rulesFileProblems.push(`page-rules.json: archetype "${id}" forbids <${c}> in its toolbar, and that component is not in the registry`)
  }
}

/* One line per archetype in Page.tsx, which is why this can be read rather than
 * parsed. If the shape of that table changes, this check says so instead of
 * quietly passing on nothing. */
const pageSrc = readFileSync(`${ROOT}/src/blocks/Page/Page.tsx`, 'utf8')
const presetLines = [...pageSrc.matchAll(/^\s{2}(\w+): \{ shape: '([^']+)', width: '([^']+)'(?:, align: '([^']+)')? \},$/gm)]
if (presetLines.length !== Object.keys(pageDoc.archetypes ?? {}).length) {
  rulesFileProblems.push(
    `page-rules.json has ${Object.keys(pageDoc.archetypes ?? {}).length} archetype(s) and Page.tsx's PRESETS table reads as ${presetLines.length} — they are the same decision and must stay in step`,
  )
} else {
  for (const [, id, shape, width, align] of presetLines) {
    const a = pageDoc.archetypes[id]
    if (!a) { rulesFileProblems.push(`Page.tsx presets an archetype "${id}" that page-rules.json does not define`); continue }
    if (a.shape !== shape) rulesFileProblems.push(`archetype "${id}": page-rules.json says shape "${a.shape}", Page.tsx renders "${shape}"`)
    if (a.width !== width) rulesFileProblems.push(`archetype "${id}": page-rules.json says width "${a.width}", Page.tsx renders "${width}"`)
    if ((a.align ?? 'start') !== (align ?? 'start')) {
      rulesFileProblems.push(`archetype "${id}": page-rules.json says align "${a.align ?? 'start'}", Page.tsx renders "${align ?? 'start'}"`)
    }
  }
}

/* And the layer under THAT: what a column is made of. A column carries one kind
 * of value, and the kind decides its alignment, its width behaviour, whether it
 * sorts and what it owes. Data in screen-specs/cell-rules.json. */
const cellDoc = JSON.parse(readFileSync(`${DIR}/cell-rules.json`, 'utf8'))

/* The cell layer, held like the three above it. Declared here because this is
   where cell-rules.json is read. */
const cellKindIds = Object.keys(cellDoc.cellKinds ?? {})
for (const id of cellSpecimenIds) {
  if (!cellKindIds.includes(id)) rulesFileProblems.push(`src/specimens/cells.tsx: specimen "${id}" is not a cell kind`)
}
for (const id of cellKindIds.filter((k) => !cellSpecimenIds.includes(k))) {
  rulesFileProblems.push(`src/specimens/cells.tsx: cell kind "${id}" has no specimen — the rules can choose it and nobody has seen it`)
}
const cells = makeCellEngine(cellDoc)

for (const [id, kind] of Object.entries(cellDoc.cellKinds ?? {})) {
  if (kind.status === 'planned') continue
  for (const c of [...(kind.components?.required ?? []), ...(kind.components?.expect ?? [])]) {
    if (!owner.has(c) && !blocks.includes(c)) {
      rulesFileProblems.push(`cell-rules.json: cell kind "${id}" names <${c}>, which is not in the registry`)
    }
  }
}

/* Coverage across every spec, printed at the end like the behaviour line: a
 * collection zone that names no task is a zone the rules cannot see. */
let questionCount = 0
let acceptanceCount = 0
const unchecked = []
const uncheckedTables = []
const uncheckedForms = []

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
      /* A PART is held to its own props, never to its parent's: `CardMedia
       * ratio` is real and `CardMedia flush` is not, and falling back to the
       * parent's list would pass both. */
      const slot = component === entry.main ? null : (entry.slots ?? []).find((sl) => sl.name === component)
      const declaredProps = slot ? (slot.props ?? []) : (entry.props ?? [])
      for (const pin of pins) {
        const [path, value] = pin.split('=')
        /* A pin may reach INTO an object prop: `Modal actions.tone=destructive`.
         * The registry publishes an object prop's fields, so the leaf is held to
         * the same standard as a top-level prop — existence and allowed values —
         * rather than being waved through because it has a dot in it. */
        const [prop, leaf] = path.split('.')
        const declared = declaredProps.find((p) => p.name === prop)
        if (!declared) {
          fail(`zone "${zone.name}": <${component} ${prop}> — no such prop`)
          continue
        }
        let target = declared
        if (leaf) {
          const field = (declared.fields ?? []).find((f) => f.name === leaf)
          if (!field) {
            fail(`zone "${zone.name}": <${component} ${path}> — <${component} ${prop}> has no field "${leaf}"`)
            continue
          }
          target = field
        }
        if (value && target.values?.length && !target.values.map(String).includes(value)) {
          fail(`zone "${zone.name}": <${component} ${path}="${value}"> — allowed values are ${target.values.join(' | ')}`)
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
  collect(life.checkLifecycle(spec))
  collect(checkPrimaryActions(spec.zones))
  collect(checkPriority(spec))
  if (spec.primaryQuestion) questionCount++
  for (const zone of spec.zones ?? []) {
    const r = engine.checkZone(zone)
    collect(r)
    if (r.unchecked) unchecked.push(`${name}/${zone.name}`)
    collect(cards.checkCardZone(zone, engine.detect(zone)))
    const f = forms.checkFormZone(zone, spec)
    collect(f)
    if (f.unchecked) uncheckedForms.push(`${name}/${zone.name}`)
    const tbl = tables.checkTableZone(zone, engine.detect(zone))
    collect(tbl)
    if (tbl.unchecked) uncheckedTables.push(`${name}/${zone.name}`)
    collect(cells.checkColumns(zone))
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
    ? readdirSync(DIR).filter((f) => f.endsWith('.json') && f !== 'schema.json' && !f.endsWith('.schema.json') && f !== 'selection-rules.json' && f !== 'card-rules.json' && f !== 'form-rules.json' && f !== 'table-rules.json' && f !== 'cell-rules.json' && f !== 'page-rules.json' && f !== 'lifecycle-rules.json').map((f) => `${DIR}/${f}`)
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
  console.log(`  \x1b[31m✗ decision rules\x1b[0m (${rulesFileProblems.length})`)
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
console.log(`  \x1b[2m${specimenIds.length}/${familyIds.length} card families, ${formSpecimenIds.length}/${formKindIds.length} form kinds and ${tableSpecimenIds.length}/${tableKindIds.length} table kinds, ${cellSpecimenIds.length}/${cellKindIds.length} cell kinds have a rendered specimen\x1b[0m`)
if (missingSpecimens.length) console.log(`      \x1b[33m!\x1b[0m \x1b[2mno picture yet: ${missingSpecimens.join(', ')}\x1b[0m`)
for (const z of unchecked) console.log(`      \x1b[33m!\x1b[0m \x1b[2m${z} shows a collection but names no task — say what the user does there and the representation rules apply\x1b[0m`)
for (const z of uncheckedForms) console.log(`      \x1b[33m!\x1b[0m \x1b[2m${z} takes input but names no task — say task: "input" plus data.commit and the form rules apply\x1b[0m`)
for (const z of uncheckedTables) console.log(`      \x1b[33m!\x1b[0m \x1b[2m${z} shows a table but names no task — say what the user does there and the table rules apply\x1b[0m`)
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
