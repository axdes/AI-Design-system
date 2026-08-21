/* Deterministic scorers for the design-system evals.
 *
 * An eval answers a question the gate cannot: "given a task, does the code an
 * agent produces actually use THIS design system?" The gate checks the repo as
 * it stands; a scorer checks a candidate solution against the registry.
 *
 * Everything here is static (text in, findings out): no LLM, no network, no
 * build. That is deliberate — a scorer that needs judgement cannot be trusted to
 * compare two agents. The expensive checks (tsc, render, axe) live in run.mjs
 * and reuse the project's own tooling.
 */

/* ── a tiny JSX reader ─────────────────────────────────────────────────
 * Not a parser: it finds component tags and the attributes they pass at their
 * OWN level, which is all the scorers need. Hand-written so the harness keeps
 * its zero-dependency promise, but it has to get three things right or it
 * reports nonsense: attributes of a nested element must not be attributed to
 * the parent (`actions={<Button variant="primary" />}`), a type argument is not
 * a tag (`useState<Status[]>`), and a component may carry one
 * (`<FilterDropdown<Status> …>`). */

import { staticInlineStyle } from '../scripts/lib/inline-style.mjs'
const WS = /\s/

// index just past the `}` that closes the `{` at `i`, skipping strings
function skipBraces(src, i) {
  let depth = 0
  let quote = null
  for (let j = i; j < src.length; j++) {
    const c = src[j]
    if (quote) {
      if (c === '\\') j++
      else if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') quote = c
    else if (c === '{') depth++
    else if (c === '}' && --depth === 0) return j + 1
  }
  return src.length
}

// index just past the `>` that closes the `<` at `i` (generic argument list)
function skipAngles(src, i) {
  let depth = 0
  for (let j = i; j < src.length; j++) {
    if (src[j] === '<') depth++
    else if (src[j] === '>' && --depth === 0) return j + 1
  }
  return src.length
}

function parseTag(src, start) {
  const m = /^<([A-Z][\w.]*)/.exec(src.slice(start))
  if (!m) return null
  let j = start + m[0].length
  if (src[j] === '<') j = skipAngles(src, j) // <FilterDropdown<Status> …>
  const attrs = []
  while (j < src.length) {
    while (WS.test(src[j])) j++
    if (src[j] === '>') { j++; break }
    if (src[j] === '/' && src[j + 1] === '>') { j += 2; break }
    const nm = /^[A-Za-z_$][\w$-]*/.exec(src.slice(j))
    if (!nm) { j++; continue }
    const name = nm[0]
    j += name.length
    while (WS.test(src[j])) j++
    let literal = null
    if (src[j] === '=') {
      j++
      while (WS.test(src[j])) j++
      if (src[j] === '"' || src[j] === "'") {
        const q = src[j]
        const end = src.indexOf(q, j + 1)
        literal = src.slice(j + 1, end === -1 ? src.length : end)
        j = (end === -1 ? src.length : end) + 1
      } else if (src[j] === '{') {
        j = skipBraces(src, j) // the expression's own tags are read separately
      }
    }
    attrs.push({ name, literal })
  }
  return { name: m[1], attrs, end: j }
}

/* Comments are blanked (newlines kept, so line numbers still point at the real
 * line) before anything is read. Good code documents itself with sentences like
 * "<DetailPageTemplate> is rendered as-is", and a reader that takes that
 * literally reports every following word as an invented prop — which is exactly
 * what the first eval matrix did, blaming three agent runs for a bug in here. */
export function stripComments(src) {
  const blank = (m) => m.replace(/[^\n]/g, ' ')
  return src
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:'"`\\])\/\/[^\n]*/g, (m, lead) => lead + blank(m.slice(lead.length)))
}

/** Every component tag used in the source, with the attributes it passes. */
export function readTags(source) {
  const src = stripComments(source)
  const out = []
  for (const m of src.matchAll(/<[A-Z][\w.]*/g)) {
    /* `useState<Status[]>` and `Array<Foo>`: a type argument always follows an
     * identifier, a `]` or a `)`, where JSX never does.
     *
     * Except that it does: `Invite user<Icon name="person_add" />` is ordinary
     * JSX and ordinary Prettier output, and the character before `<` is `r`. On
     * 2026-08-14 `npm run redteam` proved what that cost — an invented prop on
     * such a tag was invisible to every scorer here, because the tag itself was
     * never read. So the "follows a word" rule now yields to what the tag
     * actually looks like: attributes (`name=`) or a self-close (`/>`) are JSX
     * and nothing else, while `Array<Foo>` and `useState<Status[]>` have
     * neither and stay skipped. */
    const before = src.slice(0, m.index).replace(/\s+$/, '').slice(-1)
    const ahead = src.slice(m.index + m[0].length, m.index + m[0].length + 60)
    const looksLikeJsx = /^\s*(\/>|[\w-]+\s*=)/.test(ahead)
    if (/[\w$\])]/.test(before) && !looksLikeJsx) continue
    /* `const set = <K extends keyof Settings>(k: K) => …` is a generic parameter
     * on an arrow function, and nothing follows a JSX tag name with `extends`. */
    if (/^<[A-Z][\w]*\s+extends\b/.test(src.slice(m.index, m.index + 40))) continue
    const tag = parseTag(src, m.index)
    if (!tag) continue
    out.push({ name: tag.name, attrs: tag.attrs, line: src.slice(0, m.index).split('\n').length })
  }
  return out
}

/** Names declared inside the candidate itself — those are not registry misses. */
function localComponents(src) {
  const names = new Set()
  for (const m of src.matchAll(/^\s*(?:export\s+)?(?:function|const)\s+([A-Z][\w]*)/gm)) names.add(m[1])
  return names
}

/* Props that any component inheriting DOM attributes legitimately accepts. */
const DOM_OK = /^(key|ref|className|id|style|role|type|title|tabIndex|href|target|rel|name|value|placeholder|disabled|checked|required|readOnly|autoFocus|maxLength|rows|cols|src|alt|width|height|form|htmlFor|children)$/
const DOM_PREFIX = /^(data-|aria-|on[A-Z])/

/* ── the scorers ───────────────────────────────────────────────────────
 * Each returns a list of findings. An empty list means the dimension passed. */

/** Uses components that exist. Catches the classic invented `<DataGrid>`. */
export function unknownComponents(src, registry) {
  const known = new Set([...Object.keys(registry.components), ...Object.keys(registry.blocks)])
  for (const entry of [...Object.values(registry.components), ...Object.values(registry.blocks)]) {
    for (const e of entry.exports ?? []) known.add(e)
  }
  const local = localComponents(src)
  const seen = new Set()
  const out = []
  for (const tag of readTags(src)) {
    const base = tag.name.split('.')[0]
    if (known.has(base) || local.has(base) || seen.has(base)) continue
    seen.add(base)
    out.push(`line ${tag.line}: <${tag.name}> is not in the registry and is not defined here`)
  }
  return out
}

/** Passes only props that exist, with values from the declared union. */
export function inventedProps(src, registry) {
  const entries = { ...registry.components, ...registry.blocks }
  /* export name -> the entry that owns it (Card, CardTitle, … all map to Card) */
  const owner = new Map()
  for (const entry of Object.values(entries)) {
    for (const e of entry.exports ?? []) owner.set(e, entry)
    owner.set(entry.ref, entry)
  }
  const out = []
  for (const tag of readTags(src)) {
    const entry = owner.get(tag.name)
    if (!entry) continue
    const props = new Map((entry.props ?? []).map((p) => [p.name, p]))
    /* Slot exports (CardTitle) are parsed as part of their parent entry, so
     * their own props are not listed separately — only check the main export. */
    const isMain = tag.name === entry.main || tag.name === entry.ref
    for (const attr of tag.attrs) {
      if (DOM_PREFIX.test(attr.name)) continue
      const prop = props.get(attr.name)
      if (!prop) {
        if (!isMain || entry.inherits || DOM_OK.test(attr.name)) continue
        out.push(`line ${tag.line}: <${tag.name} ${attr.name}> — no such prop (registry lists: ${[...props.keys()].join(', ') || 'none'})`)
        continue
      }
      if (attr.literal !== null && prop.values?.length && !prop.values.includes(attr.literal)) {
        out.push(`line ${tag.line}: <${tag.name} ${attr.name}="${attr.literal}"> — allowed values are ${prop.values.join(' | ')}`)
      }
    }
  }
  return out
}

/** Required props are actually passed. Guessing a component's API shows up here
 * first: <FilterBar> without activeCount/onClear compiles in an agent's head and
 * nowhere else. */
export function missingProps(src, registry) {
  const entries = { ...registry.components, ...registry.blocks }
  const out = []
  for (const tag of readTags(src)) {
    const entry = entries[tag.name]
    if (!entry || (tag.name !== entry.main && tag.name !== entry.ref)) continue
    const passed = new Set(tag.attrs.map((a) => a.name))
    for (const prop of entry.props ?? []) {
      /* `children` is passed as element content, which the tag reader does not
       * see; everything else has to be an attribute. */
      if (!prop.required || prop.name === 'children') continue
      if (!passed.has(prop.name)) {
        out.push(`line ${tag.line}: <${tag.name}> is missing the required prop "${prop.name}" (${prop.type})`)
      }
    }
  }
  return out
}

/** The task's must-use components are actually used. */
/* A required component, or a CHOICE of them.
 *
 * `["MetaItem", "Descriptions"]` inside the list means "one of these", and it
 * exists because the measurement on 2026-08-14 kept failing a defensible answer:
 * asked for a panel of a record's metadata, the agent reached for <Descriptions>
 * three times out of three, which is exactly what the registry says Descriptions
 * is for. An eval that punishes the right answer teaches the harness nothing and
 * teaches whoever reads it to ignore the number. A task with two right answers
 * has to say so; a task with one still says one. */
export function missingRequired(src, required = []) {
  const used = new Set(readTags(src).map((t) => t.name.split('.')[0]))
  const out = []
  for (const item of required) {
    const options = Array.isArray(item) ? item : [item]
    if (options.some((r) => used.has(r))) continue
    out.push(
      options.length === 1
        ? `<${options[0]}> is required for this task but was not used`
        : `this task needs one of ${options.map((o) => `<${o}>`).join(' or ')}, and none was used`,
    )
  }
  return out
}

/** Classes the registry's own text publishes (`.card-link` in Card's anatomy
 * example). A class the docs TELL you to use is contract, not borrowing —
 * flagging it fails an agent for following the published example, which the
 * first pipeline-hub baseline did three times out of three. */
export function publishedClasses(registry) {
  const out = new Set()
  for (const m of JSON.stringify(registry).matchAll(/\.([a-z][a-z0-9]*(?:-[a-z0-9]+)+)\b/g)) out.add(m[1])
  return out
}

/** Hand-rolled markup where the DS already has the component. */
export function handRolled(source, extra = [], published = new Set()) {
  /* Same reason as readTags: a comment that says "not a raw <button>" must not
   * be reported as a raw button. */
  const src = stripComments(source)
  const RULES = [
    [/<button[\s>]/, 'raw <button> — use <Button> / <IconButton> / <Chip>'],
    [/<input[\s>]/, 'raw <input> — use <Input> / <Checkbox> / <Radio> / <SearchInput>'],
    [/<select[\s>]/, 'raw <select> — use <Select>'],
    [/<textarea[\s>]/, 'raw <textarea> — use <Textarea>'],
    [/<table[\s>]/, 'raw <table> — use <Table> and its parts'],
    ...extra.map((p) => [new RegExp(p.pattern), p.message]),
  ]
  const out = []
  src.split('\n').forEach((ln, i) => {
    for (const [re, message] of RULES) if (re.test(ln)) out.push(`line ${i + 1}: ${message}`)
    /* Borrowing a component's class instead of rendering the component. Token
     * by token, because the judgement is per class: `card-link` is the Card
     * example's own published contract while a bare `card` is the component's
     * root being faked. */
    for (const cm of ln.matchAll(/className="([^"]*)"/g)) {
      for (const token of cm[1].split(/\s+/)) {
        if (!/^(card|btn|badge|chip)(-|$)/.test(token)) continue
        if (published.has(token)) continue
        out.push(`line ${i + 1}: hand-rolled DS class "${token}" — use the component, do not borrow its class`)
      }
    }
  })
  return out
}

/** Token discipline in whatever CSS the candidate brings. */
export function styleHygiene(files) {
  const out = []
  for (const [path, raw] of Object.entries(files)) {
    const isCss = path.endsWith('.css')
    const src = stripComments(raw)
    src.split('\n').forEach((ln, i) => {
      const at = `${path}:${i + 1}`
      if (staticInlineStyle(ln)) out.push(`${at}: static inline style — move the decision into CSS`)
      if (isCss && /#[0-9a-fA-F]{3,8}\b/.test(ln)) out.push(`${at}: raw hex — colours come from semantic tokens`)
      if (isCss && /!important/.test(ln)) out.push(`${at}: !important — fix specificity instead`)
      if (isCss && /^\s*(margin|padding|border|inset)-(left|right)\s*:/.test(ln)) out.push(`${at}: physical property — use the inline-logical one (RTL)`)
      if (isCss && /^\s*(gap|margin|padding|border-radius)[^:]*:\s*[^;]*\b\d{2,}px/.test(ln)) out.push(`${at}: raw px on a spacing/radius property — use var(--space-*) / var(--radius-*)`)
    })
  }
  return out
}

/* ── scoring ───────────────────────────────────────────────────────────
 * Dimensions are equally weighted and binary: a dimension either has findings
 * or it does not. Partial credit inside a dimension would reward code that is
 * "mostly conformant", which is exactly the failure mode evals exist to expose. */

export const DIMENSIONS = [
  'components-exist',
  'props-exist',
  'props-complete',
  'required-used',
  'no-hand-rolling',
  'style-hygiene',
]

export function staticScore(files, { rubric = {}, registry }) {
  const code = Object.entries(files)
    .filter(([p]) => p.endsWith('.tsx') || p.endsWith('.ts'))
    .map(([, s]) => s)
    .join('\n')

  const findings = {
    'components-exist': unknownComponents(code, registry),
    'props-exist': inventedProps(code, registry),
    'props-complete': missingProps(code, registry),
    'required-used': missingRequired(code, rubric.required),
    'no-hand-rolling': handRolled(code, rubric.forbidden, publishedClasses(registry)),
    'style-hygiene': styleHygiene(files),
  }
  const passed = DIMENSIONS.filter((d) => findings[d].length === 0)
  return {
    findings,
    passed,
    failed: DIMENSIONS.filter((d) => findings[d].length > 0),
    score: passed.length / DIMENSIONS.length,
  }
}
