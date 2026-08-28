#!/usr/bin/env node
/* Separates a requirement from a prescription, in somebody else's document.
 *
 * A brief written outside this system arrives carrying two kinds of sentence.
 * One says what the screen must DO — the real data, the thing worth building
 * from. The other says how it must LOOK, in terms the writer had to hand: a hex
 * code, "padding 20px", "an InfoBox at the top", a dropdown described by its
 * appearance. The second kind is not malice and it is not always wrong; it is
 * simply written in a vocabulary this system does not use, and read straight it
 * either drags foreign values into the code or gets silently ignored along with
 * the requirement attached to it.
 *
 * The pipeline that follows this (brief -> model -> spec -> screen) is measured
 * and holds, but every brief it has ever been measured on was written by us, in
 * the system's own language. Nothing stood between a client's document and that
 * pipeline. This does.
 *
 * It is deliberately MECHANICAL. It does not read the document's meaning, does
 * not decide what the screen is for and does not write the spec: those are
 * judgments and they belong to a person, or to an agent under review. What it
 * does is find every value the document pins, look each one up in the token
 * layer and the registry, and say one of three things about it, always with the
 * citation:
 *
 *   carried    the document names something this system already has. Here is
 *              its token or its component. Nothing to decide.
 *   refused    the document names something off the scale or absent from the
 *              registry. Here is the nearest thing that exists, either side.
 *   brand      the document names a colour or a typeface this system has
 *              nothing like. That is not an error — it is the client's brand,
 *              and it has a home: brand/<name>/manifest.json, applied by
 *              scripts/rebrand.mjs. Emitted as a fragment ready for it.
 *
 * Everything it did NOT recognise is left completely alone and written back out
 * as the requirements file. That subtraction is the point: what remains after
 * every prescription is annotated is the part somebody should actually build
 * from.
 *
 *   node scripts/intake.mjs <file.md|txt>        report, and write intake/<slug>.*
 *   node scripts/intake.mjs <file> --dry         report only, write nothing
 *   node scripts/intake.mjs <file> --json        the findings as data
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tokenValues, nearestLength, nearestColour, parseColour, toHex } from './lib/token-values.mjs'

/* A brief arrives in whatever language it was written in, so these patterns have
   to match the working language too — and this file ships in a package the
   language check holds to English. The words are built from code points: same
   behaviour, and the source stays in the shipped language. */
const RU = {
  ROUNDED: String.fromCharCode(0x441,0x43a,0x440,0x443,0x433,0x43b),
  SIZE: String.fromCharCode(0x43a,0x435,0x433,0x43b),
  FONT: String.fromCharCode(0x448,0x440,0x438,0x444,0x442),
  INDENT: String.fromCharCode(0x43e,0x442,0x441,0x442,0x443,0x43f),
  FIELD: String.fromCharCode(0x43f,0x43e,0x43b,0x435),
}
const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const RED = '\x1b[31m', GREEN = '\x1b[32m', YELLOW = '\x1b[33m', DIM = '\x1b[2m', BOLD = '\x1b[1m', R = '\x1b[0m'

const argv = process.argv.slice(2)
const flags = new Set(argv.filter((a) => a.startsWith('--')))
const source = argv.find((a) => !a.startsWith('--'))

if (!source) {
  console.error(`Usage: node scripts/intake.mjs <file.md|txt> [--dry] [--json]`)
  process.exit(1)
}
if (!existsSync(source)) {
  console.error(`${RED}✗${R} no such file: ${source}`)
  process.exit(1)
}
/* Binary document formats are refused by name rather than parsed badly. A .docx
 * read as text produces a page of XML that this would then find "colours" in,
 * and a report full of invented findings is worse than no report. Converting is
 * one step upstream and somebody else's job. */
if (/\.(docx|pdf|xlsx|pptx)$/i.test(source)) {
  console.error(`${RED}✗${R} ${basename(source)} is a binary document. Convert it to text or markdown first — this reads what it can cite, and a mis-parsed file produces findings that are not in the document.`)
  process.exit(1)
}

const registry = JSON.parse(readFileSync(`${ROOT}/component-registry.json`, 'utf8'))
const entries = { ...registry.components, ...registry.blocks }
const values = tokenValues(registry.tokens)

/* Every importable name -> the entry that documents it, so a compound's part
 * (`Card.Header`) resolves to the component that publishes it. */
const known = new Map()
for (const entry of Object.values(entries)) {
  known.set(entry.ref, entry)
  for (const e of entry.exports ?? []) known.set(e, entry)
}
/* Every prop name the system publishes anywhere, and the legal values per
 * component. A prop the document pins is only checkable against the component it
 * was pinned on, which the document does not always say — so an unknown VALUE on
 * a known prop name is reported as a question, never as a failure. */
const propValues = new Map()
for (const entry of Object.values(entries)) {
  for (const p of entry.props ?? []) {
    if (!p.values?.length) continue
    const key = `${entry.ref}.${p.name}`
    propValues.set(key, p.values)
  }
}

const text = readFileSync(source, 'utf8')
const lines = text.split('\n')
const slug = basename(source).replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'intake'

/* ── what a finding is ─────────────────────────────────────────────────── */

/** @typedef {{ kind: string, line: number, quote: string, verdict: 'carried'|'refused'|'brand'|'question', says: string, cite: string|null }} Finding */
/** @type {Finding[]} */
const findings = []
const add = (f) => findings.push(f)

/* ── colours ───────────────────────────────────────────────────────────── */

const COLOUR = /#[0-9a-f]{3}\b|#[0-9a-f]{6}\b|\brgba?\(\s*\d+[\s,]+\d+[\s,]+\d+[^)]*\)/gi

function readColours(line, n) {
  for (const m of line.matchAll(COLOUR)) {
    const rgb = parseColour(m[0])
    if (!rgb) continue
    const hit = nearestColour(rgb, values.colours)
    if (hit.exact) {
      add({ kind: 'colour', line: n, quote: m[0], verdict: 'carried', says: `already a token: \`${hit.exact.name}\``, cite: hit.exact.name })
    } else if (hit.same) {
      add({ kind: 'colour', line: n, quote: m[0], verdict: 'refused', says: `off by a shade from \`${hit.nearest.name}\` (${hit.nearest.hex}). Use the token; a second near-identical colour is how a palette stops being one`, cite: hit.nearest.name })
    } else {
      add({ kind: 'colour', line: n, quote: m[0], verdict: 'brand', says: `nothing in the layer is this colour (nearest \`${hit.nearest.name}\` ${hit.nearest.hex}, distance ${Math.round(hit.distance)}). Belongs in the brand manifest, not in a component`, cite: hit.nearest.name })
    }
  }
}

/* ── lengths ───────────────────────────────────────────────────────────── */

/* A bare number is not a length, and a version or a count would flood the report
 * if it were. The unit is what makes this a claim about the scale. */
const LENGTH = /\b(\d+(?:\.\d+)?)\s?(px|rem)\b/gi

/** Which scale a length is being measured against, from the words around it.
 *  Unknown means all of them, which is the honest default: the report then says
 *  the nearest step on any scale rather than pretending to know the intent. */
function scaleFor(line) {
  const l = line.toLowerCase()
  if (new RegExp(`\\b(radius|corner|rounded|${RU.ROUNDED})`).test(l)) return 'radius'
  if (new RegExp(`\\b(font|type|text size|${RU.SIZE}|${RU.FONT})`).test(l)) return 'type'
  if (new RegExp(`\\b(padding|margin|gap|spacing|indent|${RU.INDENT}|${RU.FIELD})`).test(l)) return 'spacing'
  return null
}

function readLengths(line, n) {
  for (const m of line.matchAll(LENGTH)) {
    const px = m[2].toLowerCase() === 'rem' ? Number(m[1]) * 16 : Number(m[1])
    const group = scaleFor(line)
    const hit = nearestLength(px, values.lengths, { group })
    const where = group ? `the ${group} scale` : 'any scale'
    if (hit.exact) {
      add({ kind: 'length', line: n, quote: m[0], verdict: 'carried', says: `on ${where}: \`${hit.exact.name}\``, cite: hit.exact.name })
    } else {
      const near = [hit.below && `\`${hit.below.name}\` (${hit.below.px}px)`, hit.above && `\`${hit.above.name}\` (${hit.above.px}px)`].filter(Boolean).join(' or ')
      add({ kind: 'length', line: n, quote: m[0], verdict: 'refused', says: `not a step on ${where}. Nearest: ${near || 'nothing on this scale'}`, cite: hit.below?.name ?? hit.above?.name ?? null })
    }
  }
}

/* ── component names ───────────────────────────────────────────────────── */

/* Three shapes, and every one of them is a deliberate claim that a NAME is
 * meant: JSX, backticks, or an inner capital. Ordinary capitalised prose ("The
 * Contract Renewals desk") is not a component reference and is left alone —
 * this reports what it can defend. */
const NAMED = /<([A-Z][A-Za-z0-9.]*)\b|`([A-Z][A-Za-z0-9.]*)`|\b([A-Z][a-z0-9]+(?:[A-Z][a-z0-9]*)+)\b/g

/**
 * What to reach for instead of a name the registry does not have.
 *
 * Two rules, and both are about SHARED WORDS rather than shared letters:
 *
 *   1. the system has components whose name starts with the same word
 *      (`FilterPanel` -> FilterBar, FilterDropdown)
 *   2. the invented name starts with one that exists (`ButtonBar` -> Button)
 *
 * Everything looser was tried and thrown away. Letter-overlap scoring answered
 * `InfoBox` with `Combobox` and `StatusPicker` with `DatePicker`; searching the
 * descriptions for every word of the invented name answered `ButtonBar` with
 * `IconButton`, because "button" and "bar" both turn up in a paragraph about
 * icon buttons in a toolbar. Each of those reads as an ANSWER — a component
 * name, cited, in a report whose whole value is that its citations hold. Saying
 * nothing reads as a question, and a question is what this actually has.
 *
 * So when neither rule fires it returns nothing and the finding tells the reader
 * to search, which is the true state of affairs.
 *
 * @returns {{refs: string[], why: string}|null}
 */
function substituteFor(name) {
  const words = name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(/\s+/).filter(Boolean)
  const head = words[0]
  if (!head) return null
  const refs = new Set()
  for (const ref of known.keys()) {
    if (ref.startsWith(head) && ref !== name) refs.add(ref)
    /* A prefix only counts when it ends on a WORD boundary. Without that test
     * `StatusPicker` starts with `Stat` and the report offered a metric tile as
     * the substitute for a control. */
    else if (name.startsWith(ref) && ref.length >= 4 && /[A-Z]/.test(name[ref.length] ?? '')) refs.add(ref)
  }
  if (!refs.size) return null
  return {
    refs: [...refs].sort((a, b) => a.length - b.length).slice(0, 3),
    why: `The ${head}\u2011 family this system does have`,
  }
}

const seenNames = new Set()

function readNames(line, n) {
  for (const m of line.matchAll(NAMED)) {
    const name = m[1] ?? m[2] ?? m[3]
    if (!name || seenNames.has(name)) continue
    seenNames.add(name)
    const entry = known.get(name) ?? known.get(name.split('.')[0])
    if (entry) {
      add({ kind: 'component', line: n, quote: name, verdict: 'carried', says: `exists: ${entry.level}, import from \`${entry.from}\``, cite: entry.ref })
      continue
    }
    const sub = substituteFor(name)
    add({
      kind: 'component', line: n, quote: name, verdict: 'refused',
      says: sub
        ? `not in the registry. ${sub.why}: ${sub.refs.map((r) => `\`${r}\``).join(', ')} — one of those, or the need is genuinely new`
        : `not in the registry, and nothing in it shares a word with this name. Search it (\`npm run registry -- --search <word>\`), and if the need is real file it in requests/ rather than hand-rolling`,
      cite: sub?.refs[0] ?? null,
    })
  }
}

/* ── pinned prop values ────────────────────────────────────────────────── */

const PINNED = /\b([a-z][A-Za-z0-9]*)\s*=\s*"?([a-zA-Z][A-Za-z0-9-]*)"?/g

function readProps(line, n) {
  for (const m of line.matchAll(PINNED)) {
    const [, prop, value] = m
    /* Only props this system actually publishes, and only where the pinned value
     * is not one of them. A prop nobody has heard of is a word in a sentence. */
    const owners = [...propValues].filter(([key]) => key.endsWith(`.${prop}`))
    if (!owners.length) continue
    if (owners.some(([, vals]) => vals.includes(value))) continue
    const legal = [...new Set(owners.flatMap(([, vals]) => vals))]
    add({
      kind: 'prop', line: n, quote: `${prop}=${value}`, verdict: 'refused',
      says: `no component has \`${prop}="${value}"\`. The values that exist: ${legal.map((v) => `\`${v}\``).join(', ')}`,
      cite: owners[0][0],
    })
  }
}

/* ── typefaces ─────────────────────────────────────────────────────────── */

const shipped = new Set(values.fonts.flatMap((f) => f.families.map((x) => x.toLowerCase())))
const FONT = new RegExp(`\\bfont(?:-family)?\\s*[:=]\\s*["']?([A-Za-z][A-Za-z0-9 ]{2,30})["']?|["']([A-Z][A-Za-z]+(?: [A-Z][A-Za-z]+)?)["']\\s*(?:font|typeface|${RU.FONT})`, 'gi')

function readFonts(line, n) {
  for (const m of line.matchAll(FONT)) {
    const family = (m[1] ?? m[2] ?? '').trim()
    if (!family) continue
    if (shipped.has(family.toLowerCase())) {
      add({ kind: 'font', line: n, quote: family, verdict: 'carried', says: `already the system's: \`${values.fonts.find((f) => f.families.some((x) => x.toLowerCase() === family.toLowerCase())).name}\``, cite: null })
    } else {
      add({ kind: 'font', line: n, quote: family, verdict: 'brand', says: `not a typeface this system ships. Belongs in the brand manifest with its source, so \`rebrand\` can carry it into the font layer`, cite: null })
    }
  }
}

/* ── typefaces named in prose ──────────────────────────────────────────── */

/* A typeface written into a sentence ("headings in Frutiger Neue, body in
 * Arial") cannot be extracted mechanically: the only thing separating a family
 * name from a person's name is knowing the answer already, and a report that
 * guesses at that is a report nobody can trust twice.
 *
 * So it does not guess. It says the line is about type, quotes it, and asks —
 * which is worth more than silence, because silence on this line reads as "the
 * document pinned no typeface" and that is the one thing it certainly did. */
/* "Font" alone is not enough: "base font size 15px" is a length, already read as
 * one, and asking about it turns a resolved line into an open question. What
 * marks a line as being about a FAMILY is the word typeface, a font-family
 * declaration, or something set "in" a capitalised name. */
const TYPE_TALK = new RegExp(`\\btypeface\\b|\\bfont\\s*-?\\s*famil|(?:headings?|body(?:\\s+(?:text|copy))?)\\s+in\\s+[A-Z]|${RU.FONT}`, 'i')

function readTypographyProse(line, n) {
  if (!TYPE_TALK.test(line)) return
  /* Not when a declaration on the same line already answered it. */
  if (findings.some((f) => f.line === n && f.kind === 'font')) return
  add({
    kind: 'font', line: n, quote: line.trim().slice(0, 90), verdict: 'question',
    says: `this line pins type in prose. Declarations (\`font-family: X\`) and quoted names are read; a family named inside a sentence is not, because the only thing separating it from a person's name is knowing the answer. Confirm which families are meant, then add them to the brand fragment with their source`,
    cite: null,
  })
}

/* ── the pass ──────────────────────────────────────────────────────────── */

lines.forEach((line, i) => {
  const n = i + 1
  readColours(line, n)
  /* Colours are taken out of the line before anything else reads it, blanked
   * rather than deleted so every other reader still sees the same offsets.
   * Without it `#E4002B` is a hex to the colour reader AND a CamelCase name to
   * the component reader, and the report says a brand colour is a missing
   * component. One string, one meaning. */
  const rest = line.replace(COLOUR, (m) => ' '.repeat(m.length))
  readLengths(rest, n)
  readNames(rest, n)
  readProps(rest, n)
  readFonts(rest, n)
  readTypographyProse(rest, n)
})

const carried = findings.filter((f) => f.verdict === 'carried')
const refused = findings.filter((f) => f.verdict === 'refused')
const brand = findings.filter((f) => f.verdict === 'brand')
const questions = findings.filter((f) => f.verdict === 'question')

/* ── the requirements that are left ────────────────────────────────────── */

/* The document, with every recognised prescription marked where it stands. The
 * text is NOT rewritten — a requirement and the prescription attached to it are
 * often the same sentence, and cutting one cuts the other. Marking says which
 * words the system has already answered, so a reader can see what is left to
 * decide without having to trust a summary. */
function requirementsFile() {
  const byLine = new Map()
  for (const f of findings) {
    if (!byLine.has(f.line)) byLine.set(f.line, [])
    byLine.get(f.line).push(f)
  }
  const out = [
    `# Requirements left after intake — ${slug}`,
    ``,
    `Source: \`${source}\`. Every line the intake had something to say about carries a`,
    `marker; everything unmarked is the requirement, untouched. Markers: **[carried]**`,
    `the system already has it, **[refused]** it must change, **[brand]** it belongs in`,
    `the brand manifest.`,
    ``,
    `Full reasoning, with citations: [\`${slug}.findings.md\`](./${slug}.findings.md)`,
    ``,
    `---`,
    ``,
  ]
  lines.forEach((line, i) => {
    out.push(line)
    const hits = byLine.get(i + 1)
    if (hits) out.push(...hits.map((f) => `  <!-- [${f.verdict}] ${f.quote} — ${f.says.replace(/\n/g, ' ')} -->`))
  })
  return out.join('\n') + '\n'
}

/* ── the brand fragment ────────────────────────────────────────────────── */

/* A fragment, never a manifest. It carries only what the document actually
 * pinned, so `rebrand` cannot be pointed at it by accident and asked to
 * regenerate a layer from half the values. Whoever accepts these merges them
 * into brand/<name>/manifest.json, which is the reviewed step. */
function brandFragment() {
  const colours = brand.filter((f) => f.kind === 'colour')
  const fonts = brand.filter((f) => f.kind === 'font')
  return {
    _why: `Values ${basename(source)} pins that this system has nothing like. NOT a manifest: merge the ones you accept into brand/<name>/manifest.json, then run npm run rebrand. See ${slug}.findings.md for what each one displaces.`,
    source,
    colours: colours.map((f) => ({ value: toHex(parseColour(f.quote)), line: f.line, nearestExisting: f.cite })),
    typefaces: fonts.map((f) => ({ family: f.quote, line: f.line, source: null, _todo: 'where do the font files come from — self-hosted, Google, licensed?' })),
  }
}

/* ── the report ────────────────────────────────────────────────────────── */

/**
 * Decisions already written, carried across a re-run.
 *
 * A brief gets revised and the intake gets run again — that is the normal case,
 * not the exception. Without this the second run silently erased every answer
 * the first one had collected, which would make the check that guards those
 * answers a check on a file nobody dares regenerate.
 *
 * Matched on the QUOTE rather than on the refusal's number or its line: both of
 * those move when a paragraph is added above, and an answer that reattaches
 * itself to a different finding is worse than one that is lost.
 */
function priorDecisions() {
  const file = `${ROOT}/intake/${slug}.findings.md`
  if (!existsSync(file)) return { decisions: new Map(), waitingFor: null }
  const text = readFileSync(file, 'utf8')
  const decisions = new Map()
  for (const body of text.split(/^### R\d+ · /m).slice(1)) {
    const quote = /^`([^`]*)`/.exec(body)?.[1]
    const decision = /^>[ \t]*decision:[ \t]*(.*)$/m.exec(body)?.[1]?.trim()
    if (quote && decision) decisions.set(quote, decision)
  }
  return { decisions, waitingFor: /^>[ \t]*waitingFor:[ \t]*(\S.*)$/m.exec(text)?.[1]?.trim() ?? null }
}

const prior = priorDecisions()

function findingsFile() {
  const section = (title, list, note) => {
    const out = [`## ${title} (${list.length})`, ``]
    if (note) out.push(note, ``)
    if (!list.length) out.push(`Nothing.`, ``)
    for (const [i, f] of list.entries()) {
      const id = title.startsWith('Refused') ? `### R${i + 1} · ` : `### `
      out.push(`${id}\`${f.quote}\` — line ${f.line}`, ``, f.says + '.', ``)
      if (title.startsWith('Refused')) out.push(`> decision: ${prior.decisions.get(f.quote) ?? ''}`.trimEnd(), ``)
    }
    return out
  }

  return [
    `# Intake — ${slug}`,
    ``,
    /* The date is written INTO the file rather than left to its mtime, because a
     * clone stamps every file with the moment it was cloned and `check:intake`
     * has to be able to tell a report filed this morning from one that has been
     * waiting for an answer since spring. */
    `Read: ${new Date().toISOString().slice(0, 10)} · Source: \`${source}\` · ${lines.length} lines · ${findings.length} findings`,
    ``,
    ...(prior.waitingFor ? [`> waitingFor: ${prior.waitingFor}`, ``] : []),
    `Written by \`npm run intake\`. It reports what it can CITE and nothing else: every`,
    `line below names the token or the registry entry it was decided against. What the`,
    `document says that is not a pinned value was not read and is not here — that part`,
    `is the requirement, and it is in [\`${slug}.requirements.md\`](./${slug}.requirements.md).`,
    ``,
    ...section('Carried', carried, `The document names something the system already has. Nothing to decide.`),
    ...section('Refused, with the substitute', refused, [
      `Each of these must change before it reaches code. Answer it by writing the`,
      `decision after \`> decision:\` — take the substitute, or say why the system should`,
      `change instead and file it in \`requests/\`. \`npm run check:intake\` turns red on an`,
      `answer that never came, because a refusal nobody answers stops being a process.`,
    ].join('\n')),
    ...section('Questions this could not answer', questions, [
      `Not findings — the places where a mechanical read runs out. Each one names a`,
      `line that is certainly about the system's vocabulary and that this cannot decide`,
      `from the text alone. Answer them with the person who wrote the document.`,
    ].join('\n')),
    ...section('Brand', brand, [
      `Not errors. These are the client's own colour and type, which this system has a`,
      `place for: \`brand/<name>/manifest.json\`, applied by \`npm run rebrand\`. A fragment`,
      `is written beside this file ready to merge. Nothing here belongs in a component.`,
    ].join('\n')),
  ].join('\n') + '\n'
}

if (flags.has('--json')) {
  console.log(JSON.stringify({ source, slug, findings, counts: { carried: carried.length, refused: refused.length, brand: brand.length, questions: questions.length } }, null, 2))
  process.exit(0)
}

console.log(`\n${BOLD}Intake${R} ${DIM}${source}${R}\n`)
console.log(`  ${GREEN}✓${R} carried  ${carried.length}  ${DIM}the system already has it${R}`)
console.log(`  ${RED}✗${R} refused  ${refused.length}  ${DIM}must change before it reaches code${R}`)
console.log(`  ${YELLOW}●${R} brand    ${brand.length}  ${DIM}the client's own, for the manifest${R}`)
console.log(`  ${DIM}?${R} asked    ${questions.length}  ${DIM}a mechanical read cannot settle it${R}\n`)
for (const f of refused.slice(0, 8)) console.log(`  ${RED}✗${R} line ${String(f.line).padStart(4)}  ${f.quote.padEnd(22)} ${DIM}${f.says.split('.')[0]}${R}`)
if (refused.length > 8) console.log(`  ${DIM}… and ${refused.length - 8} more${R}`)

if (flags.has('--dry')) {
  console.log(`\n${DIM}--dry: nothing written.${R}`)
  process.exit(0)
}

const dir = `${ROOT}/intake`
mkdirSync(dir, { recursive: true })
writeFileSync(`${dir}/${slug}.findings.md`, findingsFile())
writeFileSync(`${dir}/${slug}.requirements.md`, requirementsFile())
const kept = refused.filter((f) => prior.decisions.has(f.quote)).length
const written = [`intake/${slug}.findings.md`, `intake/${slug}.requirements.md`]
if (brand.length) {
  writeFileSync(`${dir}/${slug}.brand.json`, JSON.stringify(brandFragment(), null, 2) + '\n')
  written.push(`intake/${slug}.brand.json`)
}
console.log(`\n${GREEN}✓${R} ${written.join('\n  ')}`)
if (kept) console.log(`${DIM}  ${kept} decision(s) already written were carried across.${R}`)
console.log('')
