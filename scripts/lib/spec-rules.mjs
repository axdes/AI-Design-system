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

/* ── the layer under "cards" ──────────────────────────────────────────────
 *
 * selection-rules.json answers WHICH REPRESENTATION. When the answer is cards
 * the next question used to be taste: which card. card-rules.json makes it a
 * computation too — a family is chosen by what the card CARRIES (the content
 * kind) and what the reader does with it, and every family names the parts it
 * may not ship without and the components that build it.
 *
 * Same division of labour as the layer above: the spec author says what the
 * zone carries and which family it is, and this decides whether that pair is
 * permitted. Same three consumers: the gate, the tests, and the MCP `decide`
 * tool for agents that never run the gate.
 */

export function makeCardEngine(cardDoc, { collectionTasks = [] } = {}) {
  const families = new Map((cardDoc.families ?? []).map((f) => [f.id, f]))
  const kinds = Object.keys(cardDoc.contentKinds ?? {})
  /* The task vocabulary is declared once, in selection-rules.json, and handed
   * in here so the two files cannot disagree about which verbs show a
   * collection. Only those verbs make a family compulsory: a Card that is a
   * PANEL around a read zone is a surface, not a family. */
  const collection = new Set(collectionTasks)

  function familyMatches(when, task, carries, data = {}) {
    if (when.task && task && !when.task.includes(task)) return false
    if (when.carries && carries !== when.carries) return false
    if (when.cardinality && data.cardinality !== when.cardinality) return false
    return true
  }

  /* The verdict as data, for whoever asks before writing. */
  function chooseFamily(task, carries, data = {}) {
    const matched = (cardDoc.rules ?? []).filter((r) => familyMatches(r.when, task, carries, data))
    const allowed = [...new Set(matched.flatMap((r) => r.choose))]
    const forbidden = (cardDoc.hard ?? [])
      .filter((h) => familyMatches(h.when, task, carries, data))
      .map((h) => ({ id: h.id, forbid: h.forbid, instead: h.instead, because: h.because }))
    return { matched, allowed, forbidden, families: allowed.map((id) => families.get(id)).filter(Boolean) }
  }

  /* One zone, once the layer above has already decided it shows cards. `rep`
   * is that decision, so a zone whose cards are only a SURFACE (a Card holding
   * a Table) is never asked to name a family it does not have. */
  function checkCardZone(zone, rep) {
    const problems = []
    const notes = []
    const at = (msg) => `zone "${zone.name}": ${msg}`
    const declared = zone.card
    const carries = zone.data?.carries

    if (declared && !families.has(declared)) {
      problems.push(at(`card family "${declared}" does not exist — use ${[...families.keys()].join(' | ')}`))
      return { problems, notes }
    }
    if (carries && !kinds.includes(carries)) {
      problems.push(at(`data.carries "${carries}" — use ${kinds.join(' | ')}`))
      return { problems, notes }
    }
    if (declared && rep !== 'cards') {
      problems.push(at(`declares card family "${declared}" while its components read as "${rep ?? 'no collection'}" — a family belongs to a zone the reader reads AS cards`))
      return { problems, notes }
    }
    if (rep !== 'cards') return { problems, notes }

    const isCollection = zone.task && collection.has(zone.task)
    if (!isCollection) return { problems, notes }

    if (!carries) {
      problems.push(at('a cards zone must say what one card carries (data.carries) — the family rules cannot fire on a representation alone'))
    }
    if (!declared) {
      problems.push(at(`a cards zone must name its card family (card) — ${carries ? `for ${carries} the rules choose ${chooseFamily(zone.task, carries, zone.data).allowed.join(' | ') || 'nothing yet'}` : 'see screen-specs/card-rules.json'}`))
    }
    if (!carries || !declared) return { problems, notes }

    const family = families.get(declared)
    if (!family.carries.includes(carries)) {
      problems.push(at(`family "${declared}" carries ${family.carries.join(' or ')}, not ${carries} — ${family.intent}`))
    }
    if (family.status === 'planned') {
      problems.push(at(`family "${declared}" is planned, not built${family.waitingFor ? ` (waiting for: ${family.waitingFor})` : ''} — agree the component first (requests/), then the screen`))
    }

    const { matched, allowed, forbidden } = chooseFamily(zone.task, carries, zone.data)
    for (const h of forbidden) {
      if (h.forbid.includes(declared)) problems.push(at(`"${declared}" is ruled out for ${carries} — ${h.because} Use "${h.instead}".`))
    }
    if (matched.length && !allowed.includes(declared)) {
      const cite = matched[0]
      problems.push(
        at(`task=${zone.task} over ${carries} — "${declared}" is not what any matching rule chooses (${matched.map((r) => r.id).join(', ')} choose ${allowed.join(' | ')}). ${cite.id}: ${cite.because}`),
      )
    }
    if (!matched.length) {
      notes.push(at(`no card rule matches task=${zone.task} + carries=${carries} — either the declaration is off, or card-rules.json is missing a rule and should gain one`))
    }

    /* What the family is BUILT from: `required` must all be there, `oneOf` is
     * satisfied by any one of them (the purpose-built component or the honest
     * composition), and `expect` is a note — the part that has a component
     * nobody remembered to use. */
    const named = new Set((zone.components ?? []).map((c) => String(c).split(' ')[0]))
    const comps = family.components ?? {}
    const missing = (comps.required ?? []).filter((c) => !named.has(c))
    if (missing.length) {
      problems.push(at(`family "${declared}" is built from ${comps.required.join(' + ')}; the zone never names ${missing.join(', ')}`))
    }
    if (comps.oneOf?.length && !comps.oneOf.some((c) => named.has(c))) {
      problems.push(at(`family "${declared}" needs one of ${comps.oneOf.join(' or ')}; the zone names neither`))
    }
    if (comps.expect?.length && !comps.expect.some((c) => named.has(c))) {
      notes.push(at(`a "${declared}" card has ${comps.expect.join(' / ')} for exactly this — hand-rolling it inside a Card is how the same shape gets built twice`))
    }
    if (family.maxFields !== undefined && typeof zone.data?.fields === 'number' && zone.data.fields > family.maxFields) {
      notes.push(at(`${zone.data.fields} fields on a "${declared}" card — past ${family.maxFields} it reads as a detail page in a grid; drop to the fields that decide, or make the zone a table (R1)`))
    }
    for (const n of cardDoc.notes ?? []) {
      if (n.if !== 'any' && n.if !== declared) continue
      if (!familyMatches(n.when ?? {}, zone.task, carries, zone.data)) continue
      if (n.if === declared) notes.push(at(n.say))
    }
    return { problems, notes }
  }

  return { chooseFamily, checkCardZone, familyIds: [...families.keys()], family: (id) => families.get(id), contentKinds: kinds, doc: cardDoc }
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


/* ── the layer on the other side of the screen ────────────────────────────
 *
 * selection-rules.json and card-rules.json decide how a collection is SHOWN.
 * This one decides how input is TAKEN: once a zone's task is `input`, which
 * kind of form it is, what it is built from, and how it commits. The kind is
 * chosen by four things and nothing else — how many fields, how familiar the
 * task is, whether the context behind it must stay visible, and who commits —
 * which is exactly what a spec author can state and a reviewer can approve.
 *
 * Same three consumers as the layers above: the gate, the test that proves it
 * can fail, and the MCP `decide` tool for agents that never run the gate.
 */

export const COMMIT_MODELS = ['explicit', 'per-row', 'autosave', 'none']
export const FORM_CONTEXTS = ['standalone', 'over-list', 'beside-context', 'in-place']
export const FAMILIARITY = ['routine', 'unfamiliar']

export function makeFormEngine(formDoc) {
  const kinds = new Map(Object.entries(formDoc.formKinds ?? {}))
  /* Every component any kind is built from: what makes a zone READ as a form
   * even when its author forgot to declare the task. */
  const formComponents = new Set(
    [...kinds.values()].flatMap((k) => [
      ...(k.components?.required ?? []),
      ...(k.components?.oneOf ?? []),
    ]),
  )
  for (const c of ['Field', 'FormStack', 'FormSection', 'ErrorSummary']) formComponents.add(c)

  function shapeOf(zone, spec) {
    const d = zone.data ?? {}
    return {
      fields: d.fields,
      commit: d.commit,
      context: d.context,
      familiarity: d.familiarity,
      audience: spec?.audience,
    }
  }

  function matches(when = {}, shape) {
    if (when.minFields !== undefined && !(typeof shape.fields === 'number' && shape.fields >= when.minFields)) return false
    if (when.maxFields !== undefined && !(typeof shape.fields === 'number' && shape.fields <= when.maxFields)) return false
    if (when.commit && shape.commit !== when.commit) return false
    if (when.familiarity && shape.familiarity !== when.familiarity) return false
    if (when.audience && shape.audience !== when.audience) return false
    if (when.context && !(shape.context && when.context.includes(shape.context))) return false
    return true
  }

  /* The verdict as data, for whoever asks BEFORE writing. */
  function chooseKind(shape = {}) {
    const matched = (formDoc.rules ?? []).filter((r) => matches(r.when, shape))
    const allowed = [...new Set(matched.flatMap((r) => r.choose))]
    const forbidden = (formDoc.hard ?? [])
      .filter((h) => matches(h.when, shape))
      .map((h) => ({ id: h.id, forbid: h.forbid, instead: h.instead, because: h.because }))
    const permitted = allowed.filter((id) => !forbidden.some((h) => h.forbid.includes(id)))
    return { matched, allowed, permitted, forbidden, kinds: permitted.map((id) => kinds.get(id)).filter(Boolean) }
  }

  /* Does this zone take input at all? A zone that names a form template or a
   * Field is one, whatever its author called the task. */
  function detect(zone) {
    return (zone.components ?? []).some((c) => formComponents.has(String(c).split(' ')[0]))
  }

  function checkFormZone(zone, spec) {
    const problems = []
    const notes = []
    let unchecked = false
    const at = (msg) => `zone "${zone.name}": ${msg}`
    const declared = zone.form
    const shape = shapeOf(zone, spec)
    const isInput = zone.task === 'input'

    if (declared && !kinds.has(declared)) {
      problems.push(at(`form kind "${declared}" does not exist — use ${[...kinds.keys()].join(' | ')}`))
      return { problems, notes, unchecked }
    }
    if (shape.commit && !COMMIT_MODELS.includes(shape.commit)) {
      problems.push(at(`data.commit "${shape.commit}" — use ${COMMIT_MODELS.join(' | ')}`))
    }
    if (shape.context && !FORM_CONTEXTS.includes(shape.context)) {
      problems.push(at(`data.context "${shape.context}" — use ${FORM_CONTEXTS.join(' | ')}`))
    }
    if (shape.familiarity && !FAMILIARITY.includes(shape.familiarity)) {
      problems.push(at(`data.familiarity "${shape.familiarity}" — use ${FAMILIARITY.join(' | ')}`))
    }
    if (problems.length) return { problems, notes, unchecked }

    if (declared && !isInput) {
      problems.push(at(`declares form kind "${declared}" while its task is "${zone.task ?? 'unset'}" — a form kind belongs to a zone whose task is input`))
      return { problems, notes, unchecked }
    }
    if (!isInput) {
      /* A zone built from form parts that names NO task at all: countable, the
       * same way an unlabelled collection zone is. A zone that says find, read
       * or navigate has already been declared and is the other layers' business
       * — a SearchInput in a toolbar is a narrowing, not a form. */
      if (!zone.task && detect(zone) && zone.name !== 'dialogs') unchecked = true
      return { problems, notes, unchecked }
    }

    if (!shape.commit) {
      problems.push(at('an input zone must say how it commits (data.commit: explicit | per-row | autosave | none) — the rules cannot fire on a verb alone'))
    }
    if (!declared) {
      const { permitted } = chooseKind(shape)
      problems.push(at(`an input zone must name its form kind (form) — ${permitted.length ? `for this shape the rules choose ${permitted.join(' | ')}` : 'see screen-specs/form-rules.json'}`))
    }
    if (!shape.commit || !declared) return { problems, notes, unchecked }

    const kind = kinds.get(declared)
    if (!kind.commit.includes(shape.commit)) {
      problems.push(at(`"${declared}" commits ${kind.commit.join(' or ')}, not ${shape.commit} — ${kind.means}`))
    }
    if (kind.status === 'planned') {
      problems.push(at(`form kind "${declared}" is planned, not built${kind.waitingFor ? ` (waiting for: ${kind.waitingFor})` : ''} — agree the parts first (requests/), then the screen`))
    }

    const { matched, permitted, forbidden } = chooseKind(shape)
    for (const h of forbidden) {
      if (h.forbid.includes(declared)) problems.push(at(`"${declared}" is ruled out here — ${h.because} Use "${h.instead}".`))
    }
    if (matched.length && !permitted.includes(declared)) {
      const cite = matched[0]
      problems.push(
        at(`this shape (${describeShape(shape)}) — "${declared}" is not what any matching rule chooses (${matched.map((r) => r.id).join(', ')} choose ${permitted.join(' | ') || 'nothing left'}). ${cite.id}: ${cite.because}`),
      )
    }
    if (!matched.length) {
      notes.push(at('no form rule matches this shape — either the declaration is off, or form-rules.json is missing a rule and should gain one'))
    }

    /* What the kind is BUILT from, the same contract card families carry. The
     * screen's template counts as named: an auth zone does not repeat
     * <AuthTemplate> inside itself, the template IS the screen. */
    const named = new Set((zone.components ?? []).map((c) => String(c).split(' ')[0]))
    if (spec?.template) named.add(spec.template)
    const comps = kind.components ?? {}
    const missing = (comps.required ?? []).filter((c) => !named.has(c))
    if (missing.length) {
      problems.push(at(`form kind "${declared}" is built from ${comps.required.join(' + ')}; the zone never names ${missing.join(', ')}`))
    }
    if (comps.oneOf?.length && !comps.oneOf.some((c) => named.has(c))) {
      problems.push(at(`form kind "${declared}" needs one of ${comps.oneOf.join(' or ')}; the zone names neither`))
    }
    if (comps.expect?.length && !comps.expect.some((c) => named.has(c))) {
      notes.push(at(`a "${declared}" form has ${comps.expect.join(' / ')} for exactly this — hand-rolling it is how the same shape gets built twice`))
    }
    if (kind.maxFields !== undefined && typeof shape.fields === 'number' && shape.fields > kind.maxFields) {
      notes.push(at(`${shape.fields} fields in a "${declared}" form — past ${kind.maxFields} it stops fitting the container it lives in`))
    }
    for (const n of formDoc.notes ?? []) {
      if (n.if !== 'any' && n.if !== declared) continue
      if (!matches(n.when ?? {}, shape)) continue
      /* A note that asks for a part the zone already names is noise; the point
       * is the zone that forgot it. */
      if ((n.unless ?? []).some((c) => named.has(c))) continue
      notes.push(at(n.say))
    }
    return { problems, notes, unchecked }
  }

  function describeShape(shape) {
    const parts = []
    if (typeof shape.fields === 'number') parts.push(`${shape.fields} fields`)
    if (shape.commit) parts.push(`commit=${shape.commit}`)
    if (shape.context) parts.push(shape.context)
    if (shape.familiarity) parts.push(shape.familiarity)
    if (shape.audience) parts.push(`audience=${shape.audience}`)
    return parts.join(', ') || 'nothing declared'
  }

  return {
    chooseKind,
    checkFormZone,
    detect,
    kindIds: [...kinds.keys()],
    kind: (id) => kinds.get(id),
    kindComponents: [...formComponents],
    doc: formDoc,
  }
}

/* The table layer lives in its own module (this file is at its size ceiling)
 * and is re-exported here, so every consumer keeps one import for the whole
 * decision layer: representation, card, form, table. */
export { makeTableEngine, makeCellEngine, ROW_UNITS, TABLE_AXES, CELL_MODES, SELECT_MODES, NESTING } from './table-rules.mjs'

/* ── the LIFECYCLE axis ───────────────────────────────────────────────────
 *
 * Every layer above asks what a screen LOOKS like. This one asks what it DOES
 * to the resource, and decides the three things that hung off that question and
 * were decided by taste: which variant of a detail page, which shape an edit
 * takes, and how hard a destruction is to confirm.
 *
 * Same division of labour as the layers beside it: the spec author says what
 * the screen does and to how much, and this decides whether the pair is
 * permitted. Same three consumers: the gate, the tests, and the MCP `decide`
 * tool for agents that never run the gate.
 */
export function makeLifecycleEngine(doc) {
  const stageIds = Object.keys(doc.stages ?? {})
  const detailIds = Object.keys(doc.detailVariants ?? {})
  const editIds = Object.keys(doc.editKinds ?? {})
  const deleteIds = Object.keys(doc.deleteKinds ?? {})

  /* `when` clauses here are ranges and equalities over a small shape, the way
   * form-rules' are. Kept in one place so a rule cannot mean one thing to the
   * gate and another to `decide`. */
  function matches(when = {}, shape = {}) {
    for (const [key, cond] of Object.entries(when)) {
      const v = shape[key]
      if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
        if (cond.min !== undefined && !(typeof v === 'number' && v >= cond.min)) return false
        if (cond.max !== undefined && !(typeof v === 'number' && v <= cond.max)) return false
        continue
      }
      if (Array.isArray(cond)) { if (!cond.includes(v)) return false; continue }
      if (v !== cond) return false
    }
    return true
  }

  function choose(rules, hard, shape) {
    const matched = (rules ?? []).filter((r) => matches(r.when, shape))
    const allowed = [...new Set(matched.flatMap((r) => r.choose ?? []))]
    const forbidden = (hard ?? [])
      .filter((h) => matches(h.when, shape))
      .map((h) => ({ id: h.id, forbid: h.forbid, instead: h.instead, because: h.because }))
    const permitted = allowed.filter((id) => !forbidden.some((h) => (h.forbid ?? []).includes(id)))
    return { matched, allowed, permitted, forbidden }
  }

  const chooseDetail = (shape) => choose(doc.detailRules, [], shape)
  const chooseEdit = (shape) => choose(doc.editRules, [], shape)
  const chooseDelete = (shape) => choose(doc.deleteRules, doc.hard, shape)

  /* A screen may say which stages it serves. It is checked against the archetype
   * rather than taken on trust: an archetype that reads and a screen that claims
   * to delete on it is either the wrong archetype or an action that belongs
   * somewhere else, and both are worth stopping before the code. */
  function checkLifecycle(spec) {
    const problems = []
    const notes = []
    const declared = spec.lifecycle
    if (!declared) return { problems, notes }
    const list = Array.isArray(declared) ? declared : [declared]
    for (const stage of list) {
      if (!stageIds.includes(stage)) {
        problems.push(`lifecycle "${stage}" — use ${stageIds.join(' | ')}`)
        continue
      }
      const allowed = doc.archetypeStages?.[spec.archetype]
      if (spec.archetype && allowed && !allowed.includes(stage)) {
        problems.push(
          `archetype "${spec.archetype}" serves ${allowed.join(' + ')}, and this screen declares "${stage}" — either the archetype is wrong, or that stage happens on another screen`,
        )
      }
    }
    return { problems, notes }
  }

  return { stageIds, detailIds, editIds, deleteIds, chooseDetail, chooseEdit, chooseDelete, checkLifecycle }
}
