/* The decision layer's engine: which representation fits which task and data
 * shape, computed — never interpreted — from screen-specs/selection-rules.json.
 *
 * Three consumers, one module: check-screen-spec.mjs runs it in the gate,
 * src/test/screen-spec-rules.test.ts proves it can fail (an engine that cannot
 * reject a cards-where-columns-belong screen is a hole, not a check), and the
 * MCP server will serve it as `decide` so an agent outside this repo can ask
 * before writing. The division of labour is the point: the spec author names
 * the task and the data, which is the judgment a reviewer approves; this module
 * decides what that judgment permits, which is a computation.
 */

export const TASKS = ['find', 'compare', 'scan', 'browse', 'monitor', 'analyze', 'process', 'navigate', 'read', 'input', 'act']
export const ITEM_KINDS = ['record', 'prose', 'visual', 'metric']
export const CARDINALITIES = ['one', 'few', 'many', 'unbounded']
export const AUDIENCES = ['expert', 'public', 'mixed']

function ruleMatches(when, task, data) {
  if (when.task && !when.task.includes(task)) return false
  if (when.item && data.item !== when.item) return false
  if (when.editable !== undefined && Boolean(data.editable) !== when.editable) return false
  if (when.cardinality && data.cardinality !== when.cardinality) return false
  if (when.minFields !== undefined && !(typeof data.fields === 'number' && data.fields >= when.minFields)) return false
  if (when.maxFields !== undefined && !(typeof data.fields === 'number' && data.fields <= when.maxFields)) return false
  return true
}

export function makeRuleEngine(rulesDoc) {
  const repOf = new Map()
  for (const [rep, def] of Object.entries(rulesDoc.representations)) {
    for (const c of def.components) repOf.set(c, rep)
  }
  const collectionTasks = new Set(rulesDoc.collectionTasks)

  /* The strongest representation a zone's components signal. Precedence
   * matters: admin-users' content zone names Card AND Table, and the Card is
   * the surface the template's panel sits on while the Table is what the user
   * actually reads. */
  function detect(zone) {
    const present = new Set(
      (zone.components ?? []).map((c) => repOf.get(String(c).split(' ')[0])).filter(Boolean),
    )
    return rulesDoc.precedence.find((rep) => present.has(rep)) ?? null
  }

  /* One zone against the rules. Returns problems (gate-red), notes (printed,
   * never red) and whether the zone shows a collection the rules cannot see. */
  function checkZone(zone) {
    const problems = []
    const notes = []
    let unchecked = false
    const at = (msg) => `zone "${zone.name}": ${msg}`

    if (zone.task && !TASKS.includes(zone.task)) {
      problems.push(at(`task "${zone.task}" — use ${TASKS.join(' | ')}`))
      return { problems, notes, unchecked }
    }
    if (zone.surface && !/^(page|dialog|tab:[a-z0-9-]+)$/.test(zone.surface)) {
      problems.push(at(`surface "${zone.surface}" — use page, dialog, or tab:<name>`))
    }
    /* A label chosen to dodge a rule passes the machine; this is the cheap
     * tripwire for the commonest dodge. The purpose is prose, so it is a note,
     * never a verdict. */
    if (zone.task === 'browse' && /compar/i.test(zone.purpose ?? '')) {
      notes.push(at('the purpose speaks of comparing while task=browse — if the job is comparing fields across items, the task is compare and columns win (R1)'))
    }
    const d = zone.data
    if (d) {
      if (d.item && !ITEM_KINDS.includes(d.item)) problems.push(at(`data.item "${d.item}" — use ${ITEM_KINDS.join(' | ')}`))
      if (d.cardinality && !CARDINALITIES.includes(d.cardinality)) problems.push(at(`data.cardinality "${d.cardinality}" — use ${CARDINALITIES.join(' | ')}`))
      if (d.fields !== undefined && (!Number.isInteger(d.fields) || d.fields < 0)) problems.push(at('data.fields must be a whole number'))
    }
    if (problems.length) return { problems, notes, unchecked }

    const rep = detect(zone)
    if (zone.task && collectionTasks.has(zone.task) && rep) {
      if (!d?.item || !d?.cardinality) {
        problems.push(at(`a ${zone.task} zone showing a collection must say what the data looks like (data.item, data.cardinality) — the rules cannot fire on adjectives`))
        return { problems, notes, unchecked }
      }
      for (const h of rulesDoc.hard ?? []) {
        if (ruleMatches(h.when, zone.task, d) && h.forbid.includes(rep)) {
          problems.push(at(`"${rep}" is ruled out here — ${h.because} Use ${h.instead}.`))
        }
      }
      const matched = (rulesDoc.rules ?? []).filter((r) => ruleMatches(r.when, zone.task, d))
      const allowed = new Set(matched.flatMap((r) => r.choose))
      if (matched.length && !allowed.has(rep)) {
        const cite = matched[0]
        problems.push(
          at(`task=${zone.task} over ${d.item} data — "${rep}" is not what any matching rule chooses (${matched.map((r) => r.id).join(', ')} choose ${[...allowed].join(' | ')}). ${cite.id}: ${cite.because}`),
        )
      }
      if (!matched.length) {
        notes.push(at(`no selection rule matches task=${zone.task} + this data shape — either the declaration is off, or selection-rules.json is missing a rule and should gain one`))
      }
      for (const n of rulesDoc.notes ?? []) {
        if (ruleMatches(n.when, zone.task, d) && n.if === rep) notes.push(at(n.say))
      }
    } else if (!zone.task && rep && zone.name !== 'dialogs') {
      unchecked = true
    }
    return { problems, notes, unchecked }
  }

  /* The verdict as data, for whoever asks BEFORE writing: the MCP `decide`
   * tool renders this for agents outside the repo, the gate renders failures
   * from the same matching. */
  function decide(task, data) {
    const matched = (rulesDoc.rules ?? []).filter((r) => ruleMatches(r.when, task, data ?? {}))
    const allowed = [...new Set(matched.flatMap((r) => r.choose))]
    const forbidden = (rulesDoc.hard ?? [])
      .filter((h) => ruleMatches(h.when, task, data ?? {}))
      .map((h) => ({ id: h.id, forbid: h.forbid, instead: h.instead, because: h.because }))
    const components = Object.fromEntries(
      allowed.map((rep) => [rep, rulesDoc.representations[rep]?.components ?? []]),
    )
    return { matched, allowed, forbidden, components }
  }

  /* The archetype names what KIND of screen this is. Everything checked here is
   * driven by the archetypes section of selection-rules.json: the templates
   * that can carry one, the components it forbids, the ones it expects. */
  function checkArchetype(spec, allComponents) {
    const problems = []
    const notes = []
    if (spec.audience && !AUDIENCES.includes(spec.audience)) {
      problems.push(`audience "${spec.audience}" — use ${AUDIENCES.join(' | ')}`)
    }
    if (!spec.archetype) return { problems, notes }
    const archetypes = rulesDoc.archetypes ?? {}
    const a = archetypes[spec.archetype]
    if (!a) {
      problems.push(`archetype "${spec.archetype}" — use ${Object.keys(archetypes).join(' | ')}`)
      return { problems, notes }
    }
    if (a.templates?.length && spec.template && spec.template !== 'custom' && !a.templates.includes(spec.template)) {
      problems.push(`archetype "${spec.archetype}" is carried by ${a.templates.join(' or ')}, not ${spec.template}`)
    }
    for (const c of a.forbidComponents ?? []) {
      if (allComponents.has(c)) problems.push(a.forbidBecause ?? `archetype "${spec.archetype}" forbids <${c}>`)
    }
    if (a.expectsOneOf?.length && !a.expectsOneOf.some((c) => allComponents.has(c))) {
      notes.push(a.expectsNote ?? `archetype "${spec.archetype}" usually carries one of ${a.expectsOneOf.join(', ')}`)
    }
    return { problems, notes }
  }

  return { detect, checkZone, decide, checkArchetype, representationComponents: [...repOf.keys()], collectionTasks }
}

/* The content model against the specs it claims: the ORCA-lite layer. The
 * model says what the product is about (objects, attributes, relations,
 * actions); this verifies the DERIVATION — every named screen exists, every
 * action's role is declared, every core attribute of an object actually
 * appears on the object's screen. Textual appearance (a word match inside the
 * spec JSON) is deliberately the same standard the implementation check uses
 * on code: crude, cheap, and impossible to satisfy by accident with a missing
 * field. specsById maps spec id -> parsed spec, so the caller decides where
 * specs come from (the folder in the gate, fixtures in the test). */
export function checkContentModel(model, specsById) {
  const problems = []
  const notes = []
  const objects = model.objects ?? {}
  const roles = new Set(model.roles ?? [])
  const claimed = new Set()

  if (!Object.keys(objects).length) problems.push('a model with no objects models nothing')

  for (const [name, o] of Object.entries(objects)) {
    const at = (msg) => `object "${name}": ${msg}`
    if (!o.description) problems.push(at('no description — say what it is to the user'))
    const core = o.attributes?.core ?? []
    if (!core.length) problems.push(at('no core attributes — a noun with no attributes of its own is an attribute, not an object (the litmus test)'))

    for (const r of o.relations ?? []) {
      if (!objects[r.to]) problems.push(at(`relation points to "${r.to}", which this model does not declare`))
    }

    const screenRefs = []
    for (const a of o.actions ?? []) {
      for (const role of a.roles ?? []) {
        if (!roles.has(role)) problems.push(at(`action "${a.verb}" names role "${role}", which is not in roles`))
      }
      if (a.screen) screenRefs.push({ ref: a.screen, via: `action "${a.verb}"` })
      else notes.push(at(`action "${a.verb}" lands on no screen yet — a requirement nobody has placed`))
      /* provenBy closes the whole chain: requirement -> model action -> screen
       * behaviour -> test. The reference is `<spec>#<behaviour-id>`, the same
       * claim format tests carry, so an action can only cite an agreement that
       * actually exists — and through the behaviour's own provenBy, one that a
       * test proves. */
      if (a.provenBy) {
        const [specId, behaviourId] = String(a.provenBy).split('#')
        const spec = specsById[specId]
        if (!spec) {
          problems.push(at(`action "${a.verb}" is proven by "${a.provenBy}", and spec "${specId}" does not exist`))
        } else if (!(spec.behaviours ?? []).some((b) => b.id === behaviourId)) {
          problems.push(at(`action "${a.verb}" is proven by "${a.provenBy}", and "${specId}" has no behaviour "${behaviourId}"`))
        }
      }
    }
    for (const [kind, ref] of Object.entries(o.screens ?? {})) {
      if (ref) screenRefs.push({ ref, via: kind })
    }

    for (const { ref, via } of screenRefs) {
      claimed.add(ref)
      if (!specsById[ref]) problems.push(at(`${via} names screen "${ref}", and no such spec exists`))
    }
    if (!screenRefs.length) notes.push(at('no screen carries this object — either a screen is missing or the object is not one'))

    /* Core attributes must appear on the object's own screen: the detail if it
     * has one, else the collection. A field the model calls core that the
     * screen never mentions is the exact drift this layer exists to catch. */
    const home = o.screens?.detail ?? o.screens?.collection
    const spec = home ? specsById[home] : null
    if (spec) {
      const text = JSON.stringify(spec).toLowerCase()
      const missing = core.filter((attr) => !text.includes(String(attr).toLowerCase()))
      if (missing.length) problems.push(at(`core attribute(s) ${missing.join(', ')} appear nowhere in "${home}" — the screen dropped part of the object, or the model overstates its core`))
    }
  }

  return { problems, notes, claimed }
}

/* One screen answers once. Two primary buttons in one zone is a failure.
 * Across zones, visibility decides: a zone's `surface` says when it is on
 * screen — page zones are always co-visible, each tab:<name> is its own
 * context beside the page, a dialog covers everything else. So primaries on
 * the SAME surface are genuinely side by side and get a note that names them;
 * a page primary and a tab primary are different moments; dialogs carry their
 * own primary by design and are left out. A zone named "dialogs" defaults to
 * the dialog surface, everything else to page. */
export function checkPrimaryActions(zones) {
  const problems = []
  const notes = []
  const surfaceOf = (z) => z.surface ?? (z.name === 'dialogs' ? 'dialog' : 'page')
  const bySurface = new Map()
  for (const zone of zones ?? []) {
    const primaries = (zone.components ?? []).filter(
      (c) => /^Button\b/.test(String(c)) && /\bvariant=primary\b/.test(String(c)),
    ).length
    if (primaries > 1) problems.push(`zone "${zone.name}" pins Button variant=primary ${primaries} times — a screen answers once; demote the rest`)
    if (primaries === 1) {
      const s = surfaceOf(zone)
      if (s !== 'dialog') bySurface.set(s, [...(bySurface.get(s) ?? []), zone.name])
    }
  }
  for (const [surface, names] of bySurface) {
    if (names.length > 1) {
      notes.push(`surface "${surface}" carries a primary action in ${names.length} zones (${names.join(', ')}) — they are on screen together, so the screen answers twice; demote one, or say the zones live apart (surface: tab:<name> or dialog)`)
    }
  }
  return { problems, notes }
}

/* Priority: the screen's answer comes first. `answers` strings in zone order
 * are the order the screen answers questions in, and the first of them has to
 * be the primaryQuestion verbatim — identity, not paraphrase, is the claim. */
export function checkPriority(spec) {
  const problems = []
  const notes = []
  if (!spec.primaryQuestion) return { problems, notes }
  const answering = (spec.zones ?? []).filter((z) => z.answers)
  if (!answering.length) {
    notes.push('primaryQuestion is set but no zone declares `answers` — the claim that the answer comes first is not checkable yet')
  } else if (answering[0].answers !== spec.primaryQuestion) {
    problems.push(`the first answering zone ("${answering[0].name}") answers "${answering[0].answers}", not the primaryQuestion — either the answer does not come first, or the primaryQuestion is wrong`)
  }
  return { problems, notes }
}

