#!/usr/bin/env node
/* The public API of the whole catalogue, held to four rules.
 *
 *   A1  one prop name, ONE TYPE, everywhere
 *   A2  a part past seven props is a compound, or records why not
 *   A3  callbacks come from a closed list
 *   A4  no part without a test
 *   A5  every published prop is passed somewhere in this package
 *
 * A1 is the reason this exists. `lint:vocab` holds the shared props to one set
 * of VALUES — `tone` on Alert accepts what `tone` on Progress accepts — and has
 * never looked at the SHAPE. So on 2026-09-02, with every gate green, 54 prop
 * names resolved to 163 different types: `label` on 50 parts as both `string`
 * and `ReactNode`, `size` on 43 with four unions, `onChange` on 18 with four
 * signatures, `surface` on 12 answering two unrelated questions. An agent
 * cannot learn a word that means two things; it looks it up every time, which
 * is the cost this system exists to remove.
 *
 * A2, A3 and A4 come from the same measurement: 42 parts past seven props
 * (Page 22, Chart 16, FilterDropdown 15), 32 callback names for about eight
 * ideas, 62 of 138 parts with no test file at all.
 *
 * ALL FOUR RUN AGAINST A CEILING, not against zero. Numbers that large cannot
 * be fixed in the commit that starts measuring them, and a check switched off
 * until the debt is paid is a check that never lands. config/api-debt.json is
 * the opening balance, recorded once; from here a name may not gain a type, a
 * part may not gain a prop, a callback may not spread to a new part, and a new
 * part may not arrive untested. The ceiling only falls.
 *
 * POPULATION: derived from component-registry.json, which is generated from the
 * source, so nothing can be missing from a hand-written list.
 *
 *   npm run lint:api             hold the API to the recorded ceiling
 *   npm run lint:api -- --record write today's numbers in as the ceiling
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/* Overridable so the linter can be pointed at a deliberately broken COPY of the
 * package and proven to bite — the same contract every other linter here runs
 * under. See scripts/linters.test.mjs. */
const ROOT = process.env.DS_LINT_ROOT ?? fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RESET = '\x1b[0m', RED = '\x1b[31m', GREEN = '\x1b[32m', DIM = '\x1b[2m', BOLD = '\x1b[1m'
const record = process.argv.includes('--record')
/* What the ceiling is holding, listed. The count alone says whether the number
 * moved; paying it down needs the names, and reading them out of a red run means
 * breaking something first. (2026-09-03) */
const show = process.argv.includes('--show')

const registry = JSON.parse(readFileSync(`${ROOT}/component-registry.json`, 'utf8'))
const vocab = JSON.parse(readFileSync(`${ROOT}/config/callback-vocabulary.json`, 'utf8'))
/* The words of the shared props are somebody else's job. config/prop-vocabulary.json
 * declares them and lint:vocab holds every part to them, including the two that
 * look like drift from here and are not: `info` on an Alert and `destructive` on
 * a button are declared words with arguments behind them (a destructive ACTION
 * is not a bad STATE, which is Apple HIG and Material alike). A1 is about SHAPE,
 * so for a governed prop it asks only whether every part publishes a union of
 * the declared words — and if they do, they are one type wearing different
 * subsets. (2026-09-03) */
const propWords = JSON.parse(readFileSync(`${ROOT}/config/prop-vocabulary.json`, 'utf8'))
const governed = new Map(
  Object.entries(propWords)
    .filter(([k]) => k !== '_')
    .map(([name, def]) => [name, new Set(Object.keys(def.values ?? {}))]),
)
const DEBT = `${ROOT}/config/api-debt.json`
const debt = existsSync(DEBT) ? JSON.parse(readFileSync(DEBT, 'utf8')) : null

/** Every part with a public API, components and blocks alike. */
const parts = Object.entries({ ...registry.components, ...registry.blocks })
  .map(([name, entry]) => ({ name, ...entry }))
  .sort((a, b) => a.name.localeCompare(b.name))

/* ── A1 ─────────────────────────────────────────────────────────────────── */

/* A ref points at whatever element a part renders and `children` is whatever it
 * wraps: both differ by construction and neither is a word a caller has to
 * LEARN twice. Everything else is. */
const STRUCTURAL = /^(ref|children)$/

/* A PARAMETER'S NAME IS NOT PART OF ITS TYPE.
 *
 * `(next: string) => void` and `(value: string) => void` are the same type and
 * were counted as two, because this compares the type as WRITTEN. Half of what
 * looked like drift on the callbacks was two authors picking a different word
 * for the same argument — which is a readability question for the file it is
 * written in, not a contract a caller has to learn twice. The parameter list of
 * a function type is reduced to its types; everything else is left alone,
 * because a field name inside an object type IS part of the contract.
 * (2026-09-03) */
const stripParamNames = (type) => {
  const m = /^\(([^)]*)\)\s*=>(.*)$/.exec(type)
  if (!m) return type
  const params = m[1]
    .split(',')
    .map((p) => p.replace(/^\s*[A-Za-z_$][\w$]*\??\s*:\s*/, '').trim())
    .filter(Boolean)
    .join(', ')
  return `(${params}) =>${m[2]}`
}

const shapeOf = (name, type) =>
  STRUCTURAL.test(name) ? name : stripParamNames(String(type ?? '').replace(/\s+/g, ' ').trim())

/* A NARROWER UNION IS NOT A DIFFERENT TYPE.
 *
 * `size: 'sm' | 'md'` on a Badge and `size: 'sm' | 'md' | 'lg'` on a Button are
 * not two answers to one question: they are one vocabulary, and a part offering
 * fewer steps of it. A caller who learned `size="sm"` is right in both places,
 * which is the test A1 actually cares about — the failure it exists for is a
 * name that means two different QUESTIONS (`surface` as 'base' | 'muted' in one
 * place and 'card' | 'page' in another) or two different SHAPES (a string here,
 * a function there).
 *
 * So a union whose words are a subset of another union's words folds into the
 * wider one and is reported as a narrowing rather than counted as drift. Two
 * unions that disagree about the words are still two types. This is the
 * difference the check could not see until the registry stopped publishing type
 * ALIASES and started publishing the unions themselves (2026-09-03) — before
 * that, `Size` and `Size` looked identical and were not.
 *
 * lint:vocab is what holds those words to one vocabulary; this holds the shape. */
const wordsOf = (type) => {
  const words = [...String(type).matchAll(/'([^']*)'/g)].map((m) => m[1])
  const onlyLiterals = String(type).replace(/'[^']*'/g, '').replace(/[|\s]/g, '') === ''
  return words.length && onlyLiterals ? new Set(words) : null
}
const subsumes = (wide, narrow) => [...narrow].every((w) => wide.has(w))

/* A UNION OF NUMBERS IS A NUMBER. `lines?: 1 | 2` and `lines?: number` are the
 * same question — how many lines — answered once with a limit and once without,
 * and the limit belongs to the part rather than to the word. Two different
 * limits are the same: `columnCount?: 1 | 2 | 3` and `columnCount?: 12` are one
 * question a caller answers with a number, and which numbers each part accepts
 * is that part's business. Folded the same way a narrower union of words folds
 * into the wider one — and unlike words, a number carries no meaning to hold to
 * a vocabulary, so there is nothing lint:vocab would be saying twice.
 * (2026-09-03) */
const isNumberUnion = (type) => /^-?\d+(?:\.\d+)?(\s*\|\s*-?\d+(?:\.\d+)?)*$/.test(String(type).trim())

/* A STRING IS A ReactNode. A part that takes `label: string` and one that takes
 * `label: ReactNode` are answering the same question; the second accepts
 * everything the first does and more. That is the narrowing rule already applied
 * to a union of words — a part offering fewer answers is not a second question —
 * said for the two types that stand in the same relation. It cost nothing to
 * count and hid the names where the two types mean two different things.
 * (2026-09-03) */
/* Only a string. A `number` is a valid ReactNode too, and folding it would put
 * `value: number` on a Meter — a measured quantity — into `value: ReactNode` on
 * a Stat, which is displayed content. Two questions, and the count is the only
 * thing that would notice. */
const NODE_NARROWINGS = new Set(['string'])

/* A NULLABLE IS THE SAME IDEA WITH ONE MORE STATE. `count: number` and
 * `count: number | null` are one contract — the second says "not counted yet",
 * which is a fact about the data rather than a second question. */
const withoutNull = (type) => type.replace(/\s*\|\s*(null|undefined)\b/g, '').trim()

/* A COLLECTION OF THE PART'S OWN THING IS NOT DRIFT.
 *
 * `items` is eight named types because an Accordion holds AccordionItems and a
 * Breadcrumb holds Crumbs. There is no type a caller could learn once: the shape
 * belongs to the part and the registry publishes it beside the prop. What the
 * rule is for is a word that means two different QUESTIONS, and this is one
 * question whose answer is parameterised. Folded only when EVERY type is a
 * distinct named shape — the moment one of them is a primitive or a literal
 * union, the name is being used for two things and the finding stands.
 * (2026-09-03) */
const NAMED_SHAPE = /^(readonly\s+)?[A-Z][\w.]*(<[^>]*>)?(\[\])?$/
/* Two more count as a named shape, for the same reason and not as an exception:
 * a COLLECTION of a primitive (`readonly string[]` on a TagGroup is still the
 * part's own list, and the thing in it having no name of its own changes
 * nothing), and a RENDER PROP whose parameter is the part's own named shape
 * (`(DropdownTriggerProps) => ReactNode` against `(PopoverTriggerProps) =>
 * ReactNode` — one question, answered with the part's own props). */
const PRIMITIVE_LIST = /^(readonly\s+)?(string|number|boolean)\[\]$/
const RENDER_PROP = /^\((readonly\s+)?[A-Z][\w.]*(<[^>]*>)?(\[\])?\)\s*=>\s*ReactNode$/
const namedShape = (t) => NAMED_SHAPE.test(t.trim()) || PRIMITIVE_LIST.test(t.trim()) || RENDER_PROP.test(t.trim())
const isPolymorphic = (types) => types.length > 1 && types.every(namedShape)

const canonical = new Set(Object.keys(vocab.canonical))
/* A KEPT NAME IS PART OF THE VOCABULARY, not debt inside it. Each one carries
 * the thing it says that the canonical name cannot, and that reason IS the
 * decision — `onBack` is the way out of a screen rather than one action among
 * many, `onClear` does not fire when the value changes. Deferring them as
 * exceptions was the first version of this file and it was wrong: applying that
 * table would have made several APIs worse. What stays debt is only what is
 * still wrong. (2026-09-03) */
const kept = new Set(Object.keys(vocab.kept ?? {}).filter((k) => k !== '_why'))

/* A CALLBACK'S ARGUMENT IS ITS PART'S OWN PAYLOAD.
 *
 * `config/callback-vocabulary.json` decides what each name reports and what it
 * carries: onChange takes "the new value, never an event", onSelect "names what
 * was chosen", onRemove takes which one of many. Which value, which id, which
 * index is the part's own type — the same argument the polymorphic rule makes
 * for `items`, said for behaviour, and A3 is what holds the NAME to the list.
 * Counting eleven payloads for `onChange` was counting eleven parts.
 *
 * With ONE exception, and it is the reason this fold is a check rather than a
 * surrender: a DOM EVENT is not a payload. `onSubmit: (FormEvent) => void`
 * hands the caller the browser's object and makes them dig the values out of
 * it, which is exactly what the vocabulary says the argument is not. An event
 * shape stays counted, and stands out now that the payloads no longer bury it.
 * (2026-09-03) */
const DOM_EVENT = /\b(\w*Event)\b/
const isCallbackPayload = (type) => /^\(.*\)\s*=>/.test(String(type).trim()) && !DOM_EVENT.test(String(type))

/** Fold each union into the widest union of the same vocabulary. */
function foldNarrowings(name, byType) {
  const unions = [...byType.keys()].map((t) => [t, wordsOf(t)]).filter(([, w]) => w)
  const numbers = [...byType.keys()].filter((t) => t.trim() === 'number' || isNumberUnion(t))
  const numeric = numbers.length > 1
  const nodes = [...byType.keys()].some((t) => t.trim() === 'ReactNode') && [...byType.keys()].some((t) => NODE_NARROWINGS.has(t.trim()))
  /* Only a name the vocabulary decides. A callback nobody declared is A3's
   * finding, and folding its payloads here would answer a question that has not
   * been asked yet. */
  const vocabCallback = (canonical.has(name) || kept.has(name)) && [...byType.keys()].filter(isCallbackPayload).length > 1
  if (unions.length < 2 && !numeric && !nodes && !vocabCallback) return { byType, folded: [] }

  /* A GOVERNED PROP IS ONE TYPE WHEN EVERY PART SPEAKS THE DECLARED WORDS.
   * Which of them a part offers is lint:vocab's question and it asks it
   * properly, per value, with a reason required for each. Counting the subsets
   * here would report the same fact twice and in a worse form. */
  const words = governed.get(name)
  if (words && unions.length === byType.size && unions.every(([, ws]) => [...ws].every((w) => words.has(w)))) {
    const widest = unions.reduce((a, b) => (b[1].size > a[1].size ? b : a))[0]
    const folded = unions.filter(([t]) => t !== widest).map(([t]) => ({ narrow: t, wide: widest, parts: byType.get(t) }))
    return { byType: new Map([[widest, [...byType.values()].flat()]]), folded }
  }
  const out = new Map()
  const folded = []
  const hasNode = [...byType.keys()].some((t) => t.trim() === 'ReactNode')
  const widestPayload = vocabCallback ? [...byType.keys()].filter(isCallbackPayload).sort((a, b) => b.length - a.length)[0] : null
  for (const [type, parts] of byType) {
    if (widestPayload && isCallbackPayload(type) && type !== widestPayload) {
      folded.push({ narrow: type, wide: `${name}: the part's own payload`, parts })
      out.set(widestPayload, [...(out.get(widestPayload) ?? []), ...parts])
      continue
    }
    if (hasNode && NODE_NARROWINGS.has(type.trim())) {
      folded.push({ narrow: type, wide: 'ReactNode', parts })
      out.set('ReactNode', [...(out.get('ReactNode') ?? []), ...parts])
      continue
    }
    if (numeric && isNumberUnion(type)) {
      folded.push({ narrow: type, wide: 'number', parts })
      out.set('number', [...(out.get('number') ?? []), ...parts])
      continue
    }
    const words = wordsOf(type)
    const wider = words && unions.find(([other, otherWords]) => other !== type && otherWords.size > words.size && subsumes(otherWords, words))
    if (wider) {
      folded.push({ narrow: type, wide: wider[0], parts })
      out.set(wider[0], [...(out.get(wider[0]) ?? []), ...parts])
      continue
    }
    out.set(type, [...(out.get(type) ?? []), ...parts])
  }
  return { byType: out, folded }
}

/** prop name → Map(type → the parts that publish it that way). */
const shapes = new Map()
for (const part of parts) {
  for (const prop of part.props ?? []) {
    if (!shapes.has(prop.name)) shapes.set(prop.name, new Map())
    const byType = shapes.get(prop.name)
    const key = shapeOf(prop.name, prop.type)
    byType.set(key, [...(byType.get(key) ?? []), part.name])
  }
}
const narrowings = []
const polymorphic = []
const drift = [...shapes]
  .map(([name, byType]) => {
    /* Nullability first, so `number` and `number | null` are one key before
     * anything else counts them. */
    const merged = new Map()
    for (const [type, parts] of byType) {
      const key = withoutNull(type)
      merged.set(key, [...(merged.get(key) ?? []), ...parts])
    }
    if (isPolymorphic([...merged.keys()])) {
      polymorphic.push({ name, types: merged.size })
      return { name, types: new Map([['(one per part)', [...merged.values()].flat()]]), uses: 0 }
    }
    const { byType: folded, folded: notes } = foldNarrowings(name, merged)
    if (notes.length) narrowings.push({ name, notes })
    return { name, types: folded, uses: [...folded.values()].flat().length }
  })
  .filter((d) => d.types.size > 1)
  .sort((a, b) => b.uses - a.uses)

/* ── A2 ─────────────────────────────────────────────────────────────────── */

/* aria-* is the platform's vocabulary, not this system's, and neither ref nor
 * children is a decision a caller makes. */
const publicProps = (part) =>
  (part.props ?? []).filter((p) => !STRUCTURAL.test(p.name) && !p.name.startsWith('aria-'))

const sourceOf = (part) => (part.sourcePath ? join(ROOT, part.sourcePath) : null)
const saysWhy = (part) => {
  const file = sourceOf(part)
  return !!file && existsSync(file) && /monolithic because|not a compound because/i.test(readFileSync(file, 'utf8'))
}
/* EVERY part past seven, excused or not. The written reason answers "why is this
 * not a compound"; it does not answer "why does it now take four more props than
 * when that was written". So an argued part keeps its COUNT on the ceiling and
 * may not grow past it — which is the half that would have quietly gone missing
 * on 2026-09-03, when 37 parts were argued for in one pass and the recorded
 * numbers went with them. */
const wide = parts
  .map((p) => ({ name: p.name, count: publicProps(p).length, excused: saysWhy(p) }))
  .filter((p) => p.count > 7)

/* ── A3 ─────────────────────────────────────────────────────────────────── */
const exceptions = Object.fromEntries(Object.entries(vocab.exceptions ?? {}).filter(([k]) => k !== '_why'))
const callbacks = new Map()
for (const part of parts) {
  for (const prop of part.props ?? []) {
    if (!/^on[A-Z]/.test(prop.name)) continue
    callbacks.set(prop.name, [...(callbacks.get(prop.name) ?? []), part.name])
  }
}

/* ── A4 ─────────────────────────────────────────────────────────────────── */
const hasTest = (part) => {
  const file = sourceOf(part)
  if (!file) return false
  const dir = dirname(file)
  return existsSync(dir) && readdirSync(dir).some((f) => /\.test\.(tsx?|mts)$/.test(f))
}
const untested = parts.filter((p) => !hasTest(p)).map((p) => p.name)


/* ── A5 ─────────────────────────────────────────────────────────────────── */

/* A PROP NOBODY PASSES HAS NEVER BEEN RENDERED.
 *
 * Every part ships a golden example, a test and — for the decision layers — a
 * specimen, and those three are the evidence this system publishes about itself.
 * A prop that appears in none of them has never been through a browser here:
 * `Sparkline` drew a flat series along the floor for months and its FIRST test
 * found it. `Button.iconEnd` is the extreme case — the contract says out loud
 * that passing it does nothing, and it is still in the registry an agent reads.
 *
 * POPULATION: this package. Deliberately not the products, for the same reason
 * lint:token-layer excludes them — a product passing a prop is not the system
 * proving one, and the published copy has no products to look at.
 *
 * Counted from the JSX in `src`, plus object-literal keys in any file that
 * mentions the part, because a test harness passes its props as an object. */
const srcFiles = []
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.tsx?$/.test(entry.name)) srcFiles.push(full)
  }
}
walk(join(ROOT, 'src'))

const attrsOfTag = new Map()
const keysOfFile = new Map()
const tagsOfFile = new Map()
for (const file of srcFiles) {
  const text = readFileSync(file, 'utf8')
  const keys = new Set()
  for (const m of text.matchAll(/(?<![\w.])([A-Za-z][\w]*)\s*:/g)) keys.add(m[1])
  keysOfFile.set(file, keys)
  const tags = new Set()
  for (const m of text.matchAll(/<([A-Z][A-Za-z0-9]*)/g)) {
    tags.add(m[1])
    /* The opening element, brace- and string-aware: an attribute is a name at
     * depth 0, and everything inside {…} is somebody else's identifier. */
    let i = m.index + m[0].length, depth = 0, quote = null
    /* `<DataGrid<Row> …>` — the generic argument comes before the attributes,
     * and reading its `>` as the end of the element made every prop of the three
     * generic parts read as never passed. */
    if (text[i] === '<') {
      let g = 1
      i++
      while (i < text.length && g > 0) { if (text[i] === '<') g++; else if (text[i] === '>') g--; i++ }
    }
    const attrs = attrsOfTag.get(m[1]) ?? new Set()
    while (i < text.length) {
      const c = text[i]
      if (quote) { if (c === quote && text[i - 1] !== '\\') quote = null; i++; continue }
      if (c === '/' && text[i + 1] === '*') { const end = text.indexOf('*/', i + 2); i = end === -1 ? text.length : end + 2; continue }
      if (c === '"' || c === "'" || c === '`') { quote = c; i++; continue }
      if (c === '{') { depth++; i++; continue }
      if (c === '}') { depth--; i++; continue }
      if (depth === 0 && c === '>') break
      if (depth > 0) { i++; continue }
      const rest = /^([A-Za-z][\w-]*)\s*(=|[\s/>])/.exec(text.slice(i))
      if (rest && !/[\w\-.$]/.test(text[i - 1] ?? '')) { attrs.add(rest[1]); i += rest[1].length; continue }
      i++
    }
    attrsOfTag.set(m[1], attrs)
  }
  tagsOfFile.set(file, tags)
}
const exercised = (part) => {
  const tag = part.main ?? part.name
  const used = new Set(attrsOfTag.get(tag) ?? [])
  /* Any file that NAMES the part, not only one that renders it as a tag: a test
   * harness imports the part and hands its props over as an object. */
  for (const [file, tags] of tagsOfFile) {
    if (tags.has(tag) || readFileSync(file, 'utf8').includes(tag)) for (const k of keysOfFile.get(file)) used.add(k)
  }
  return used
}
/* The five that mean the same on all of them are documented once in the contract
 * and passed on whichever part a screen happens to need — counting them here
 * would report the catalogue rather than the API. */
const SHARED = new Set(['className', 'children', 'ref', 'id', 'style', 'key'])
const unexercised = []
for (const part of parts) {
  const used = exercised(part)
  const cold = publicProps(part).map((p) => p.name).filter((n) => !SHARED.has(n) && !used.has(n))
  if (cold.length) unexercised.push({ name: part.name, props: cold })
}

/* ── record ─────────────────────────────────────────────────────────────── */
if (record) {
  const next = {
    _why: 'The opening balance for npm run lint:api, recorded by npm run lint:api -- --record. Each number is a ceiling that may only fall: a prop name may not gain a type, a part may not gain a prop, a callback outside the vocabulary may not spread to a new part, a new part may not arrive untested, and a part may not publish a new prop that nothing here passes. Re-record after a payment, never to make a failure go away.',
    recorded: new Date().toISOString().slice(0, 10),
    shapes: Object.fromEntries(drift.map((d) => [d.name, d.types.size]).sort((a, b) => a[0].localeCompare(b[0]))),
    props: Object.fromEntries(wide.map((p) => [p.name, p.count]).sort((a, b) => a[0].localeCompare(b[0]))),
    /* Only what is outside the vocabulary ENTIRELY. A `kept` name is a decided
     * part of it, with the argument written against it, and recording those as
     * debt made the file say 24 while the check said 0 — a ceiling that counts
     * something the rule does not is a number nobody can act on. (2026-09-03) */
    callbacks: Object.fromEntries(
      [...callbacks].filter(([n]) => !canonical.has(n) && !kept.has(n)).map(([n, ps]) => [n, [...ps].sort()]).sort((a, b) => a[0].localeCompare(b[0])),
    ),
    untested: [...untested].sort(),
    /* A5: which props of which part nothing here passes. Per part rather than a
     * total, so warming one prop shows as paid and a NEW cold prop on the same
     * part still fails. */
    cold: Object.fromEntries(unexercised.map((u) => [u.name, [...u.props].sort()]).sort((a, b) => a[0].localeCompare(b[0]))),
  }
  writeFileSync(DEBT, `${JSON.stringify(next, null, 2)}\n`)
  console.log(
    `${GREEN}✓${RESET} recorded the ceiling in config/api-debt.json ${DIM}` +
      `${Object.keys(next.shapes).length} names with more than one type, ` +
      `${Object.keys(next.props).length} parts past seven props, ` +
      `${Object.keys(next.callbacks).length} callbacks outside the vocabulary, ` +
      `${next.untested.length} parts without a test${RESET}`,
  )
  process.exit(0)
}

if (!debt) {
  console.log(`api: no ceiling recorded yet. ${DIM}Run npm run lint:api -- --record once, and commit config/api-debt.json.${RESET}`)
  process.exit(0)
}

/* ── the four rules, against the ceiling ────────────────────────────────── */
const problems = []
const paid = []
const say = (rule, where, msg, fix) => problems.push({ rule, where, msg, fix })

for (const d of drift) {
  const held = debt.shapes?.[d.name]
  if (held === undefined) {
    say('A1', d.name, `resolves to ${d.types.size} different types, and is not on the ceiling`,
      `one name, one TYPE — not one meaning, because a caller writes the type:\n${[...d.types].map(([t, ps]) => `          ${t || '(none)'}  ${DIM}${ps.slice(0, 4).join(', ')}${ps.length > 4 ? ` +${ps.length - 4}` : ''}${RESET}`).join('\n')}\n      Give it one type, or rename one of them. A word that means two things is a word an agent looks up every time.`)
  } else if (d.types.size > held) {
    say('A1', d.name, `now resolves to ${d.types.size} types, up from ${held}`,
      `the ceiling only falls. The new shape is one of:\n${[...d.types].map(([t, ps]) => `          ${t || '(none)'}  ${DIM}${ps.slice(0, 4).join(', ')}${RESET}`).join('\n')}`)
  } else if (d.types.size < held) paid.push(`${d.name}: ${held} → ${d.types.size} types`)
}
for (const [name, held] of Object.entries(debt.shapes ?? {})) {
  if (!drift.some((d) => d.name === name)) paid.push(`${name}: ${held} types → one`)
}

for (const p of wide) {
  const held = debt.props?.[p.name]
  if (held === undefined && !p.excused) {
    say('A2', p.name, `takes ${p.count} props and is not on the ceiling`,
      'a part past seven is a compound that was never taken apart. Split it into parts rather than flags, or write "monolithic because …" in the file and say what the split would cost.')
  } else if (held !== undefined && p.count > held) {
    say('A2', p.name, `takes ${p.count} props, up from ${held}`,
      'the answer to a part that is already too wide is never one more prop. Take the new behaviour out as a part, or pay the ceiling down first.')
  } else if (p.count < held) paid.push(`${p.name}: ${held} → ${p.count} props`)
}

for (const [name, users] of callbacks) {
  if (canonical.has(name) || kept.has(name)) continue
  const held = debt.callbacks?.[name]
  if (held === undefined) {
    const suggestion = exceptions[name]?.use
    say('A3', name, 'is not in the callback vocabulary',
      `the system says: ${[...canonical].join(', ')} — or a name in \`kept\`, each of which carries the thing the six cannot say.${suggestion ? ` This one reads as ${suggestion}.` : ''} A new callback name is a change to the vocabulary and is argued for in config/callback-vocabulary.json, not invented at the call site.`)
    continue
  }
  if (!exceptions[name]) {
    say('A3', name, 'is on the ceiling but nowhere in the vocabulary',
      'a name carried as debt still has to say what it means and which of the six it reads as. Add it to config/callback-vocabulary.json under exceptions, or the ceiling is a place names hide.')
    continue
  }
  const spread = users.filter((u) => !held.includes(u))
  if (spread.length) {
    say('A3', name, `spread to ${spread.join(', ')}`,
      `a name outside the vocabulary is debt, and debt does not grow. ${exceptions[name]?.use ? `Use ${exceptions[name].use} on the new part` : 'Use a name from the vocabulary'}, or argue the name into config/callback-vocabulary.json.`)
  }
}

for (const name of untested) {
  if (debt.untested?.includes(name)) continue
  say('A4', name, 'has no test',
    'no admission without a test. Coverage percentage is not the measure; existence is — 62 of 138 parts had no test file at all on the day this check landed, and a part nobody tests is a part nobody can refactor.')
}
paid.push(...(debt.untested ?? []).filter((n) => !untested.includes(n)).map((n) => `${n}: now tested`))

for (const { name, props } of unexercised) {
  const held = debt.cold?.[name] ?? []
  const fresh = props.filter((p) => !held.includes(p))
  if (fresh.length) {
    say('A5', name, `publishes ${fresh.join(', ')} and nothing here passes ${fresh.length > 1 ? 'them' : 'it'}`,
      'put it in the golden example if it is part of how the part is used, in the test if it is a promise, or delete it. A prop an agent can read and nobody has rendered is a prop that may not work.')
  }
}
for (const [name, held] of Object.entries(debt.cold ?? {})) {
  const now = unexercised.find((u) => u.name === name)?.props ?? []
  const warmed = held.filter((p) => !now.includes(p))
  if (warmed.length) paid.push(`${name}: ${warmed.join(', ')} now exercised`)
}

/* ── the report ─────────────────────────────────────────────────────────── */
const nShapes = drift.length
const nTypes = drift.reduce((n, d) => n + d.types.size, 0)
const narrowed = narrowings.reduce((n, x) => n + x.notes.length, 0)
console.log(
  `${BOLD}API${RESET} ${DIM}${parts.length} parts, ${shapes.size} prop names — ${nShapes} carry more than one type (${nTypes} shapes), ` +
    `${wide.filter((p) => !p.excused).length} past seven props with no reason written, ${wide.filter((p) => p.excused).length} argued, ${[...callbacks.keys()].filter((c) => !canonical.has(c) && !kept.has(c)).length} callbacks outside the vocabulary, ${untested.length} without a test, ` +
    `${unexercised.reduce((n, u) => n + u.props.length, 0)} props nothing here passes${RESET}`,
)
if (polymorphic.length) {
  console.log(`  ${DIM}${polymorphic.length} name(s) carry one shape per part — a collection of the part's own thing is one question with a parameterised answer${RESET}`)
}
if (narrowed) {
  console.log(`  ${DIM}${narrowed} narrower union(s) folded into the wider vocabulary they belong to — a part offering fewer steps is not a second answer${RESET}`)
}
console.log()

if (show) {
  for (const d of [...drift].sort((a, b) => b.types.size - a.types.size)) {
    console.log(`  ${BOLD}${d.name}${RESET} ${DIM}${d.types.size} shapes${RESET}`)
    for (const [type, parts] of d.types) console.log(`    ${type || '(none)'} ${DIM}${parts.join(', ')}${RESET}`)
  }
  console.log()
  for (const w of wide) console.log(`  ${BOLD}${w.name}${RESET} ${DIM}${w.count} props${RESET}`)
  console.log()
  for (const u of unexercised) console.log(`  ${BOLD}${u.name}${RESET} ${DIM}cold: ${u.props.join(', ')}${RESET}`)
  console.log()
}

if (paid.length) {
  console.log(`${GREEN}${paid.length} below the ceiling${RESET} ${DIM}run npm run lint:api -- --record to write the lower number in${RESET}`)
  for (const p of paid.slice(0, 8)) console.log(`  ${DIM}${p}${RESET}`)
  if (paid.length > 8) console.log(`  ${DIM}+${paid.length - 8} more${RESET}`)
  console.log()
}

if (!problems.length) {
  console.log(`${GREEN}✓${RESET} the API is at or under the ceiling recorded ${debt.recorded}.`)
  process.exit(0)
}

const byRule = new Map()
for (const p of problems) {
  if (!byRule.has(p.rule)) byRule.set(p.rule, [])
  byRule.get(p.rule).push(p)
}
const TITLE = {
  A1: 'one prop name, one type',
  A2: 'seven props, then compound',
  A3: 'callbacks come from a closed list',
  A4: 'no part without a test',
  A5: 'every published prop is exercised here',
}
console.error(`${RED}${problems.length} finding(s)${RESET}\n`)
for (const [rule, list] of [...byRule].sort()) {
  console.error(`${BOLD}${rule}${RESET} ${TITLE[rule]} ${DIM}(${list.length})${RESET}`)
  for (const p of list) console.error(`  ${RED}${p.where}${RESET}  ${p.msg}\n      ${p.fix}\n`)
}
process.exit(1)
